/**
 * LLMOps Tracing Client for LangChain
 *
 * Implements the LangSmithTracingClientInterface from langsmith, converting
 * LangChain's run create/update calls into batched POST requests to the
 * LLMOps LangSmith-compatible ingestion endpoint.
 *
 * No dependency on langsmith — types are defined inline using structural
 * compatibility (duck typing).
 *
 * @example
 * ```typescript
 * import { LangChainTracer } from '@langchain/core/tracers/tracer_langchain';
 * import llmopsClient from './llmops';
 *
 * const tracer = new LangChainTracer({
 *   client: llmopsClient.langchainTracer(),
 * });
 *
 * // Pass as callback to any LangChain runnable
 * const result = await agent.invoke(input, { callbacks: [tracer] });
 * ```
 */

// ---------------------------------------------------------------------------
// Minimal types matching langsmith interfaces (structural compatibility)
// ---------------------------------------------------------------------------

type KVMap = Record<string, unknown>;

/** Matches CreateRunParams from langsmith/client */
interface CreateRunParams {
  name: string;
  inputs: KVMap;
  run_type: string;
  id?: string;
  start_time?: number | string;
  end_time?: number | string;
  extra?: KVMap;
  error?: string;
  outputs?: KVMap;
  parent_run_id?: string;
  project_name?: string;
  trace_id?: string;
  dotted_order?: string;
  tags?: string[];
  events?: KVMap[];
}

/** Matches RunUpdate from langsmith/schemas */
interface RunUpdate {
  end_time?: number | string;
  outputs?: KVMap;
  error?: string;
  events?: KVMap[];
  inputs?: KVMap;
  extra?: KVMap;
  tags?: string[];
  trace_id?: string;
  dotted_order?: string;
}

/** Matches LangSmithTracingClientInterface from langsmith */
export interface LangChainTracingClient {
  createRun(run: CreateRunParams): Promise<void>;
  updateRun(runId: string, run: RunUpdate): Promise<void>;
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

export interface LLMOpsLangChainClientConfig {
  /** LLMOps base URL (e.g. http://localhost:3000/llmops) */
  baseURL: string;
  /** API key for auth */
  apiKey: string;
  /** Optional custom fetch (e.g. createInternalFetch for in-process routing) */
  fetch?: typeof globalThis.fetch;
}

// ---------------------------------------------------------------------------
// Implementation
// ---------------------------------------------------------------------------

/**
 * Create a LangSmithTracingClientInterface-compatible client that sends
 * LangChain traces to LLMOps.
 *
 * Strategy: buffer `createRun` calls in a Map. When `updateRun` arrives,
 * merge create + update into a complete run and POST to /runs/batch.
 * This gives one HTTP call per run with complete data (inputs + outputs).
 */
export function createLLMOpsLangChainClient(
  config: LLMOpsLangChainClientConfig
): LangChainTracingClient {
  const url = `${config.baseURL.replace(/\/$/, '')}/api/langsmith/runs/batch`;
  const fetchFn = config.fetch ?? globalThis.fetch;
  const pendingRuns = new Map<string, CreateRunParams>();

  async function postBatch(
    post: CreateRunParams[],
    patch: RunUpdate[]
  ): Promise<void> {
    const response = await fetchFn(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey,
      },
      body: JSON.stringify({ post, patch }),
    });
    if (!response.ok) {
      console.warn(
        `[LLMOps LangChain] POST /runs/batch failed: ${response.status} ${response.statusText}`
      );
    }
  }

  return {
    async createRun(run: CreateRunParams): Promise<void> {
      if (run.id) {
        pendingRuns.set(run.id, run);
      }
      // If the run already has outputs and end_time (fully complete),
      // flush immediately
      if (run.id && run.outputs && run.end_time) {
        pendingRuns.delete(run.id);
        await postBatch([run], []);
      }
    },

    async updateRun(runId: string, update: RunUpdate): Promise<void> {
      const create = pendingRuns.get(runId);
      pendingRuns.delete(runId);

      if (create) {
        // Merge create + update into a single complete run
        const merged: CreateRunParams = {
          ...create,
          ...update,
          id: runId,
          // Preserve inputs from create if update doesn't have them
          inputs: update.inputs ?? create.inputs,
          // Prefer update's extra (has usage_metadata) but merge with create's
          extra: { ...create.extra, ...update.extra },
          // Prefer update's tags if present
          tags: update.tags ?? create.tags,
        };
        await postBatch([merged], []);
      } else {
        // Standalone patch — no matching create (rare, run was in a previous batch)
        await postBatch([], [{ ...update, id: runId } as unknown as RunUpdate]);
      }
    },
  };
}
