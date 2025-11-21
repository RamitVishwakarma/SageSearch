const OpenAI = require('openai');
const config = require('../config/default');

const openai = new OpenAI({
  apiKey: config.openaiApiKey,
});

/**
 * Generates a chat completion response.
 * @param {string} systemPrompt - The system instruction (persona).
 * @param {string} userQuery - The user's question.
 * @param {string} context - The retrieved context passages.
 * @returns {Promise<string>} - The LLM's answer.
 */
const generateAnswer = async (systemPrompt, userQuery, context) => {
  try {
    const messages = [
      { role: 'system', content: `${systemPrompt}\n\nContext:\n${context}` },
      { role: 'user', content: userQuery }
    ];

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: messages,
      temperature: 0.7,
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error('Error generating answer:', error);
    throw error;
  }
};

module.exports = { generateAnswer };
