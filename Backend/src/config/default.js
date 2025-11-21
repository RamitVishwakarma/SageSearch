require('dotenv').config();

module.exports = {
  openaiApiKey: process.env.OPENAI_API_KEY,
  pineconeApiKey: process.env.PINECONE_API_KEY,
  pineconeIndex: process.env.PINECONE_INDEX || 'sagesearch',
  port: process.env.PORT || 3000,
};
