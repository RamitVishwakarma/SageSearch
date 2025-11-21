const OpenAI = require('openai');
const config = require('../config/default');

const openai = new OpenAI({
  apiKey: config.openaiApiKey,
});

/**
 * Generates embeddings for a given text.
 * @param {string} text - The text to embed.
 * @returns {Promise<number[]>} - The embedding vector.
 */
const generateEmbedding = async (text) => {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small', // Cost-effective and high performance
      input: text,
      encoding_format: 'float',
    });
    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
};

module.exports = { generateEmbedding };
