import 'dotenv/config';
import express from 'express';
import { createLLMOpsMiddleware } from '@llmops/sdk/express';
import { ChatOpenAI } from '@langchain/openai';
import { OpenAIEmbeddings } from '@langchain/openai';
import { LangChainTracer } from '@langchain/core/tracers/tracer_langchain';
import { tool } from '@langchain/core/tools';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { z } from 'zod';
import llmopsClient from './llmops';

const app = express();
const port = 3000;

const llmops = createLLMOpsMiddleware(llmopsClient);

app.use(express.json());

// Mount LLMOps middleware
app.use('/llmops', llmops);

// Create a LangChain LLM pointing at the LLMOps gateway.
// Uses an explicit baseURL so the gateway auto-creates traces for each call.
function createLLM() {
  return new ChatOpenAI({
    configuration: {
      baseURL: `http://localhost:${port}/llmops/api/genai/v1`,
    },
    apiKey: process.env.LLMOPS_ENV_SECRET || 'llmops',
    model: process.env.MODEL || '@openai/gpt-4o-mini',
  });
}

// Create a LangChain LLM using provider() — routes in-process, no auto traces.
// Use this with LangChainTracer which handles tracing for all runs (LLM, tools, chains).
function createLLMWithTracer() {
  const { baseURL, apiKey, fetch } = llmopsClient.provider();
  return new ChatOpenAI({
    configuration: { baseURL, fetch },
    apiKey,
    model: process.env.MODEL || '@openai/gpt-4o-mini',
  });
}

// --- Tools ---

const getWeather = tool(
  async ({ city }) => {
    // Simulated weather lookup
    const weather: Record<string, string> = {
      'san francisco': 'Foggy, 58°F',
      'new york': 'Sunny, 75°F',
      'london': 'Rainy, 52°F',
      'tokyo': 'Cloudy, 68°F',
    };
    return weather[city.toLowerCase()] || `Weather data not available for ${city}`;
  },
  {
    name: 'get_weather',
    description: 'Get the current weather for a city',
    schema: z.object({ city: z.string().describe('The city name') }),
  }
);

const calculate = tool(
  async ({ expression }) => {
    try {
      // Simple math evaluation (safe for demo purposes)
      const result = Function(`"use strict"; return (${expression})`)();
      return `${expression} = ${result}`;
    } catch {
      return `Could not evaluate: ${expression}`;
    }
  },
  {
    name: 'calculate',
    description: 'Evaluate a math expression',
    schema: z.object({
      expression: z.string().describe('A math expression like "2 + 2" or "100 * 0.15"'),
    }),
  }
);

const tools = [getWeather, calculate];

// --- Agent ---

// Agent endpoint — uses LangChainTracer to capture the full execution hierarchy
// (chains, LLM calls, tool invocations) as a single trace with nested spans.
app.post('/api/agent', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // LangChainTracer captures everything — LLM calls, tool runs, chain steps.
    // Uses provider() under the hood so LLM calls route in-process (no double-tracing).
    const tracer = new LangChainTracer({
      client: llmopsClient.langchainTracer(),
    });

    const llm = createLLMWithTracer();
    const agent = createReactAgent({ llm, tools });
    const result = await agent.invoke(
      { messages: [{ role: 'user', content: prompt }] },
      { callbacks: [tracer] }
    );

    const lastMessage = result.messages[result.messages.length - 1];

    res.json({
      content: lastMessage.content,
      steps: result.messages.length,
    });
  } catch (error: any) {
    console.error('Agent error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Chat completion
app.post('/api/chat', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const llm = createLLM();
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
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const llm = createLLM();
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
  console.log(`  POST /api/agent        - Agent with tools (weather, calculator)`);
  console.log(`  POST /api/chat         - Chat completion`);
  console.log(`  POST /api/chat/stream  - Streaming chat`);
  console.log(`  POST /api/embeddings   - Generate embeddings`);
});
