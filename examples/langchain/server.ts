import 'dotenv/config';
import express from 'express';
import { createLLMOpsMiddleware } from '@llmops/sdk/express';
import { ChatOpenAI } from '@langchain/openai';
import { OpenAIEmbeddings } from '@langchain/openai';
import llmopsClient from './llmops';

const app = express();
const port = 3000;

const llmops = createLLMOpsMiddleware(llmopsClient);

app.use(express.json());

// Mount LLMOps middleware
app.use('/llmops', llmops);

// Create a LangChain LLM pointing at the LLMOps gateway.
// Uses an explicit baseURL (not provider()) so the gateway creates traces.
// provider() sets x-llmops-internal which skips trace creation,
// expecting a separate OTLP exporter to handle tracing instead.
function createLLM() {
  return new ChatOpenAI({
    configuration: {
      baseURL: `http://localhost:${port}/llmops/api/genai/v1`,
    },
    apiKey: process.env.LLMOPS_ENV_SECRET || 'llmops',
    model: process.env.MODEL || '@openai/gpt-4o-mini',
  });
}

// Chat completion
app.post('/api/chat', async (req, res) => {
  try {
    const { prompt, configId } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const llm = createLLM(configId);
    const response = await llm.invoke(prompt);

    res.json({
      content: response.content,
      model: response.response_metadata?.model,
      usage: response.usage_metadata,
    });
  } catch (error: any) {
    console.error('Chat error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Streaming chat completion
app.post('/api/chat/stream', async (req, res) => {
  try {
    const { prompt, configId } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const llm = createLLM(configId);
    const stream = await llm.stream(prompt);

    for await (const chunk of stream) {
      res.write(`data: ${JSON.stringify({ content: chunk.content })}\n\n`);
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error: any) {
    console.error('Stream error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Embeddings
app.post('/api/embeddings', async (req, res) => {
  try {
    const { text, configId } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const embeddings = new OpenAIEmbeddings({
      configuration: {
        baseURL: `http://localhost:${port}/llmops/api/genai/v1`,
        defaultHeaders: configId ? { 'x-llmops-config': configId } : undefined,
      },
      apiKey: process.env.LLMOPS_ENV_SECRET || 'your-environment-secret',
      model: 'text-embedding-3-small',
    });

    const vectors = await embeddings.embedQuery(text);

    res.json({
      dimensions: vectors.length,
      vectors: vectors.slice(0, 5),
    });
  } catch (error: any) {
    console.error('Embeddings error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log(`LLMOps dashboard at http://localhost:${port}/llmops`);
  console.log();
  console.log('Endpoints:');
  console.log(`  POST /api/chat         - Chat completion`);
  console.log(`  POST /api/chat/stream  - Streaming chat`);
  console.log(`  POST /api/embeddings   - Generate embeddings`);
});
