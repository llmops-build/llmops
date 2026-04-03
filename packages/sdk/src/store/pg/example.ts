/**
 * Example: how .sql file imports work with pgStore.
 *
 * This file demonstrates the pattern — it's not wired into production yet.
 * The actual migration from Kysely to raw pg will happen query by query.
 */
import type { Pool } from 'pg';
import type { z } from 'zod';
import type { schemas } from '@llmops/core';
import GET_TOTAL_COST from './queries/getTotalCost.sql';

// Row types — inferred from Zod schemas in core
type LLMRequestRow = z.infer<(typeof schemas)['llm_requests']>;

// Aggregate result types — hand-written, matching SELECT aliases in .sql
interface TotalCostRow {
  totalCost: number;
  totalInputCost: number;
  totalOutputCost: number;
  totalPromptTokens: number;
  totalCompletionTokens: number;
  totalTokens: number;
  totalCachedTokens: number;
  totalCacheSavings: number;
  requestCount: number;
}

export function createExample(pool: Pool) {
  return {
    getTotalCost: async (startDate: string, endDate: string) => {
      const { rows } = await pool.query<TotalCostRow>(GET_TOTAL_COST, [
        startDate,
        endDate,
      ]);
      return rows[0] ?? null;
    },
  };
}
