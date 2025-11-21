const express = require('express');
const router = express.Router();
const personas = require('../../data/personas.json');
const { generateEmbedding } = require('../services/embedder');
const { queryVectors } = require('../services/vectorStore');
const { generateAnswer } = require('../services/llm');

router.post('/', async (req, res) => {
  try {
    const { personaId, question } = req.body;

    if (!personaId || !question) {
      return res.status(400).json({ error: 'personaId and question are required' });
    }

    const persona = personas.find(p => p.id === personaId);
    if (!persona) {
      return res.status(404).json({ error: 'Persona not found' });
    }

    // 1. Embed the question
    const embedding = await generateEmbedding(question);

    // 2. Retrieve relevant context
    const matches = await queryVectors(embedding, 3); // Top 3 chunks
    const context = matches.map(m => m.metadata.text).join('\n\n');
    const sources = [...new Set(matches.map(m => m.metadata.source))];

    // 3. Generate answer using LLM
    const answer = await generateAnswer(persona.systemPrompt, question, context);

    res.json({
      answer,
      context: matches.map(m => ({ text: m.metadata.text, source: m.metadata.source })),
      sources
    });

  } catch (error) {
    console.error('Error in /ask:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
