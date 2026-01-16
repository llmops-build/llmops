import { NeonDialect } from 'kysely-neon';
import { type NeonQueryFunction } from '@neondatabase/serverless';

/**
 * Create a Neon serverless dialect for Kysely
 *
 * @param neonInstance - Neon database query function
 * @returns Kysely dialect configured for Neon serverless
 */
export function createNeonDialect(
  neonInstance: NeonQueryFunction<false, false>
): any {
  return new NeonDialect({
    neon: neonInstance,
  });
}

/**
 * Execute a query with search_path set for Neon serverless
 *
 * @param neonInstance - Neon database query function
 * @param query - SQL query to execute
 * @param schema - Schema to set (optional)
 * @returns Query result
 */
export async function executeWithSchema(
  neonInstance: NeonQueryFunction<false, false>,
  query: string,
  schema?: string
): Promise<any> {
  if (schema && schema !== 'public') {
    try {
      (await neonInstance`SET search_path TO ${schema}`) as any;
    } catch (error) {
      // Ignore search_path errors, continue with query
    }
  }
  return neonInstance(query as any);
}
