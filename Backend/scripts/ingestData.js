const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { generateEmbedding } = require('../src/services/embedder');
const { upsertVectors } = require('../src/services/vectorStore');

const DATA_DIR = path.join(__dirname, '../data/texts');
const CHUNK_SIZE = 1000; // characters
const OVERLAP = 200;

const readFiles = () => {
  const files = fs.readdirSync(DATA_DIR);
  return files.map(file => ({
    name: file,
    content: fs.readFileSync(path.join(DATA_DIR, file), 'utf-8')
  }));
};

const chunkText = (text, source) => {
  const chunks = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + CHUNK_SIZE, text.length);
    const chunkText = text.slice(start, end);
    chunks.push({
      id: crypto.randomUUID(),
      values: [], // to be filled
      metadata: {
        text: chunkText,
        source: source,
        chunkIndex: chunks.length
      }
    });
    start += CHUNK_SIZE - OVERLAP;
  }
  return chunks;
};

const main = async () => {
  try {
    console.log('Starting ingestion...');
    const files = readFiles();
    let totalVectors = 0;

    for (const file of files) {
      console.log(`Processing ${file.name}...`);
      const chunks = chunkText(file.content, file.name);
      
      // Process in batches to avoid rate limits and memory issues
      const BATCH_SIZE = 10;
      for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
        const batch = chunks.slice(i, i + BATCH_SIZE);
        
        // Generate embeddings
        await Promise.all(batch.map(async (chunk) => {
          chunk.values = await generateEmbedding(chunk.metadata.text);
        }));

        // Upsert to Pinecone
        await upsertVectors(batch);
        totalVectors += batch.length;
        console.log(`  Processed ${Math.min(i + BATCH_SIZE, chunks.length)}/${chunks.length} chunks`);
      }
    }

    console.log(`Ingestion complete. Total vectors: ${totalVectors}`);
  } catch (error) {
    console.error('Ingestion failed:', error);
  }
};

main();
