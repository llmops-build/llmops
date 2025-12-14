import 'dotenv/config';
import express from 'express';
import { createLLMOpsMiddleware } from '@llmops/sdk/express';
import OpenAI from 'openai';
import llmopsClient from './llmops';
const app = express();
const port = 3000;

const llmops = createLLMOpsMiddleware(llmopsClient);

app.use(express.json());
app.use(express.static('public'));
app.use('/llmops', llmops);

app.get('/', (req, res) => {
  res.send('Hello World!');
});

// OpenAI API endpoint for secure server-side requests
app.post('/api/openai/completion', async (req, res) => {
  try {
    const { model, prompt, apiKey } = req.body;

    if (!apiKey) {
      return res.status(400).json({ error: 'API key is required' });
    }

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const openai = new OpenAI({
      apiKey: apiKey,
    });

    const chatCompletion = await openai.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: model || 'gpt-4o-mini',
    });

    res.json({
      model: chatCompletion.model,
      usage: chatCompletion.usage,
      response: chatCompletion.choices[0].message.content,
      created: chatCompletion.created,
    });
  } catch (error: any) {
    console.error('OpenAI API Error:', error);
    res.status(error.status || 500).json({
      error: error.message || 'An error occurred while processing your request',
    });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
