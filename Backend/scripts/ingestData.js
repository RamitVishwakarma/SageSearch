const fs = require('fs');
const path = require('path');
const { generateEmbedding } = require('../src/services/embedder');
const { upsertVectors } = require('../src/services/vectorStore');
const { v4: uuidv4 } = require('uuid');

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
      id: uuidv4(),
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

const cleanText = (text) => {
  // 1. Remove Project Gutenberg Header/Footer
  const startMarker = /\*\*\* START OF THE PROJECT GUTENBERG EBOOK .* \*\*\*/;
  const endMarker = /\*\*\* END OF THE PROJECT GUTENBERG EBOOK .* \*\*\*/;
  
  const startMatch = text.match(startMarker);
  if (startMatch) {
    text = text.substring(startMatch.index + startMatch[0].length);
  }
  
  const endMatch = text.match(endMarker);
  if (endMatch) {
    text = text.substring(0, endMatch.index);
  }

  // 2. Remove specific noise patterns (Page numbers, Headers, Copyright)
  return text
    .split('\n')
    .filter(line => {
      const t = line.trim();
      // Remove empty lines (we'll normalize spacing later)
      if (!t) return false;
      // Remove page numbers (lines with only digits)
      if (/^\d+$/.test(t)) return false;
      // Remove specific headers
      if (['WINGS OF FIRE', 'ORIENTATION', 'Contents', 'Preface', 'Acknowledgements'].includes(t)) return false;
      // Remove copyright/publisher info
      if (t.includes('Universities Press') || t.includes('Copyright') || t.includes('All Rights Reserved')) return false;
      // Remove artifacts
      if (t.includes('$ „ 1 1 & i * express')) return false;
      
      return true;
    })
    .join(' '); // Join with space to create continuous text, or '\n' if you prefer preserving lines. 
                // For embeddings, continuous text often works better if chunks are character-based.
};

const main = async () => {
  try {
    console.log('Starting ingestion...');
    const files = readFiles();
    let totalVectors = 0;

    for (const file of files) {
      console.log(`Processing ${file.name}...`);
      const cleanedContent = cleanText(file.content);
      console.log(`  Content cleaned. Length: ${file.content.length} -> ${cleanedContent.length}`);
      
      const chunks = chunkText(cleanedContent, file.name);
      
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
