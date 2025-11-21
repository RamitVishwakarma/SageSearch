const { Pinecone } = require('@pinecone-database/pinecone');
const config = require('../config/default');

const pinecone = new Pinecone({
  apiKey: config.pineconeApiKey,
});

const index = pinecone.index(config.pineconeIndex);

/**
 * Upserts vectors into the Pinecone index.
 * @param {Array<{id: string, values: number[], metadata: object}>} vectors 
 */
const upsertVectors = async (vectors) => {
  try {
    // Batch upsert if needed, but for simplicity assuming reasonable batch sizes passed
    await index.upsert(vectors);
    console.log(`Upserted ${vectors.length} vectors.`);
  } catch (error) {
    console.error('Error upserting vectors:', error);
    throw error;
  }
};

/**
 * Queries the Pinecone index for similar vectors.
 * @param {number[]} vector - The query vector.
 * @param {number} topK - Number of results to return.
 * @returns {Promise<Array>} - List of matches.
 */
const queryVectors = async (vector, topK = 5) => {
  try {
    const queryResponse = await index.query({
      vector: vector,
      topK: topK,
      includeMetadata: true,
    });
    return queryResponse.matches;
  } catch (error) {
    console.error('Error querying vectors:', error);
    throw error;
  }
};

module.exports = { upsertVectors, queryVectors };
