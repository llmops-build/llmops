/**
 * Convex Database Adapter
 *
 * Implements the Adapter interface using Convex HTTP client.
 * This allows LLMOps to use Convex as a database backend.
 *
 * To use this adapter:
 * 1. Deploy the Convex schema and functions from packages/core/convex to your Convex project
 * 2. Create the adapter with your Convex deployment URL
 *
 * @example
 * ```ts
 * import { ConvexHttpClient } from 'convex/browser';
 * import { createConvexAdapter } from '@llmops/core';
 * import { api } from '../convex/_generated/api';
 *
 * const client = new ConvexHttpClient(process.env.CONVEX_URL!);
 * const adapter = createConvexAdapter(client, api);
 * const dataLayer = createDataLayer(adapter);
 * ```
 */

import type { Adapter, Where, FindManyOptions, WhereOperator } from './types';

/**
 * Convex API type - the generated API object from Convex
 * This is a simplified type that matches the expected structure
 */
export interface ConvexAPI {
  llmops: {
    create: any;
    findOne: any;
    findMany: any;
    update: any;
    deleteOne: any;
    createMany: any;
    deleteMany: any;
    count: any;
  };
}

/**
 * Convex HTTP Client interface
 * Matches the ConvexHttpClient from 'convex/browser'
 */
export interface ConvexClient {
  query<T>(functionReference: any, args?: any): Promise<T>;
  mutation<T>(functionReference: any, args?: any): Promise<T>;
}

/**
 * Table name mapping from our internal names to Convex table names
 * Convex doesn't support underscores in table names, so we use camelCase
 */
const TABLE_NAME_MAP: Record<string, string> = {
  configs: 'configs',
  variants: 'variants',
  variant_versions: 'variantVersions',
  environments: 'environments',
  environment_secrets: 'environmentSecrets',
  config_variants: 'configVariants',
  targeting_rules: 'targetingRules',
  workspace_settings: 'workspaceSettings',
  provider_configs: 'providerConfigs',
  playgrounds: 'playgrounds',
  playground_runs: 'playgroundRuns',
  playground_results: 'playgroundResults',
  guardrail_configs: 'guardrailConfigs',
  provider_guardrail_overrides: 'providerGuardrailOverrides',
  datasets: 'datasets',
  dataset_versions: 'datasetVersions',
  dataset_records: 'datasetRecords',
  dataset_version_records: 'datasetVersionRecords',
  llm_requests: 'llmRequests',
};

/**
 * Convert our table names to Convex table names
 */
function toConvexTable(model: string): string {
  return TABLE_NAME_MAP[model] || model;
}

/**
 * Convert Where conditions to Convex filter format
 */
function toConvexFilter(
  where: Where[]
): Array<{ field: string; operator: WhereOperator; value: any }> {
  return where.map((w) => ({
    field: w.field,
    operator: w.operator || 'eq',
    value: w.value,
  }));
}

/**
 * Convert FindManyOptions to Convex query options
 */
function toConvexOptions(options: FindManyOptions = {}) {
  return {
    filter: options.where ? toConvexFilter(options.where) : [],
    orderBy: options.orderBy || [],
    limit: options.limit,
    offset: options.offset,
  };
}

/**
 * Create a Convex-based adapter implementation
 *
 * @param client - Convex HTTP client instance
 * @param api - Generated Convex API object (import { api } from '../convex/_generated/api')
 * @returns Adapter implementation
 *
 * @example
 * ```ts
 * import { ConvexHttpClient } from 'convex/browser';
 * import { createConvexAdapter } from '@llmops/core';
 * import { api } from '../convex/_generated/api';
 *
 * const client = new ConvexHttpClient(process.env.CONVEX_URL!);
 * const adapter = createConvexAdapter(client, api);
 * ```
 */
export function createConvexAdapter(
  client: ConvexClient,
  api: ConvexAPI
): Adapter {
  return {
    async create<T>(model: string, data: Record<string, unknown>): Promise<T> {
      const table = toConvexTable(model);
      const result = await client.mutation(api.llmops.create, {
        table,
        data,
      });
      return result as T;
    },

    async findOne<T>(model: string, where: Where[]): Promise<T | null> {
      const table = toConvexTable(model);
      const filter = toConvexFilter(where);
      const result = await client.query(api.llmops.findOne, {
        table,
        filter,
      });
      return (result as T) ?? null;
    },

    async findMany<T>(
      model: string,
      options: FindManyOptions = {}
    ): Promise<T[]> {
      const table = toConvexTable(model);
      const convexOptions = toConvexOptions(options);
      const result = await client.query(api.llmops.findMany, {
        table,
        ...convexOptions,
      });
      return result as T[];
    },

    async update<T>(
      model: string,
      where: Where[],
      data: Record<string, unknown>
    ): Promise<T | null> {
      const table = toConvexTable(model);
      const filter = toConvexFilter(where);
      const result = await client.mutation(api.llmops.update, {
        table,
        filter,
        data,
      });
      return (result as T) ?? null;
    },

    async delete<T>(model: string, where: Where[]): Promise<T | null> {
      const table = toConvexTable(model);
      const filter = toConvexFilter(where);
      const result = await client.mutation(api.llmops.deleteOne, {
        table,
        filter,
      });
      return (result as T) ?? null;
    },

    async createMany<T>(
      model: string,
      data: Record<string, unknown>[]
    ): Promise<T[]> {
      if (data.length === 0) {
        return [];
      }
      const table = toConvexTable(model);
      const result = await client.mutation(api.llmops.createMany, {
        table,
        data,
      });
      return result as T[];
    },

    async deleteMany(model: string, where: Where[]): Promise<number> {
      const table = toConvexTable(model);
      const filter = toConvexFilter(where);
      const result = await client.mutation(api.llmops.deleteMany, {
        table,
        filter,
      });
      return result as number;
    },

    async count(model: string, where: Where[] = []): Promise<number> {
      const table = toConvexTable(model);
      const filter = toConvexFilter(where);
      const result = await client.query(api.llmops.count, {
        table,
        filter,
      });
      return result as number;
    },

    // Note: Convex doesn't support traditional transactions
    // Operations are atomic at the mutation level
    // For multi-step operations, use Convex's built-in mutation atomicity
    transaction: undefined,
  };
}

/**
 * Type for Convex deployment URL
 */
export type ConvexDeploymentUrl = string;

/**
 * Options for creating a Convex adapter from a URL
 */
export interface ConvexAdapterOptions {
  /** The Convex deployment URL (e.g., https://your-deployment.convex.cloud) */
  url: ConvexDeploymentUrl;
}
