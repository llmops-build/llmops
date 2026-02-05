/**
 * Idempotent SQL Schema Generator
 *
 * Generates fully idempotent PostgreSQL schema SQL that can be run on every
 * server restart. Works in edge environments (no file system access needed).
 *
 * This is the programmatic version of the generate-schema-sql.ts script.
 */

import { SCHEMA_METADATA } from './schema';

interface FieldMeta {
  type: string;
  primaryKey?: boolean;
  unique?: boolean;
  nullable?: boolean;
  default?: string | number | boolean;
  onUpdate?: string;
  references?: {
    table: string;
    column: string;
  };
}

interface TableMeta {
  order: number;
  fields: Record<string, FieldMeta>;
  uniqueConstraints?: Array<{ columns: string[] }>;
}

// Convert camelCase to snake_case
function toSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

// Get default value for PostgreSQL
function getDefaultValue(
  fieldType: string,
  defaultValue: string | number | boolean | undefined
): string | null {
  if (defaultValue === undefined) return null;

  if (defaultValue === 'now()') {
    return 'NOW()';
  }

  if (typeof defaultValue === 'boolean') {
    return defaultValue ? 'TRUE' : 'FALSE';
  }

  if (typeof defaultValue === 'number') {
    return String(defaultValue);
  }

  if (typeof defaultValue === 'string') {
    if (defaultValue === '{}') {
      return "'{}'::jsonb";
    }
    return `'${defaultValue}'`;
  }

  return null;
}

// Type mappings for PostgreSQL
const TYPE_MAPPINGS: Record<string, string> = {
  uuid: 'UUID',
  text: 'TEXT',
  integer: 'INTEGER',
  boolean: 'BOOLEAN',
  timestamp: 'TIMESTAMP WITH TIME ZONE',
  jsonb: 'JSONB',
};

/**
 * Generate idempotent PostgreSQL schema SQL
 *
 * @param schemaName - Optional PostgreSQL schema name (e.g., 'llmops').
 *                     If not provided, tables are created in the current search_path.
 * @returns SQL string that can be executed to create/update the schema
 */
export function generatePostgresSchemaSQL(schemaName?: string): string {
  const lines: string[] = [];
  const schemaPrefix = schemaName ? `"${schemaName}".` : '';

  lines.push(`-- LLMOps Database Schema (PostgreSQL)`);
  lines.push(`-- This SQL is fully idempotent and safe to run on every server restart.`);
  lines.push('');

  // Schema creation
  if (schemaName) {
    lines.push(`-- Create schema if not exists`);
    lines.push(`CREATE SCHEMA IF NOT EXISTS "${schemaName}";`);
    lines.push('');
  }

  // UUID extension (must be created in public schema)
  lines.push(`-- Enable UUID extension`);
  lines.push(`CREATE EXTENSION IF NOT EXISTS "pgcrypto" SCHEMA public;`);
  lines.push('');

  // Sort tables by order
  const sortedTables = Object.entries(SCHEMA_METADATA.tables)
    .map(([name, meta]) => ({ name, meta: meta as TableMeta }))
    .sort((a, b) => a.meta.order - b.meta.order);

  // Step 1: Create tables with only primary key (minimal structure)
  lines.push(`-- STEP 1: Create tables (if not exist)`);

  for (const { name, meta } of sortedTables) {
    const snakeTable = toSnakeCase(name);
    const fullTableName = schemaPrefix + snakeTable;

    // Find primary key field
    const pkField = Object.entries(meta.fields).find(([_, f]) => f.primaryKey);
    if (!pkField) continue;

    lines.push(`CREATE TABLE IF NOT EXISTS ${fullTableName} (`);
    lines.push(`  id UUID PRIMARY KEY DEFAULT gen_random_uuid()`);
    lines.push(`);`);
  }
  lines.push('');

  // Step 2: Add all columns to existing tables
  lines.push(`-- STEP 2: Add columns (if not exist)`);

  for (const { name, meta } of sortedTables) {
    const snakeTable = toSnakeCase(name);
    const fullTableName = schemaPrefix + snakeTable;

    for (const [columnName, field] of Object.entries(meta.fields)) {
      if (field.primaryKey) continue; // Already created with table

      const snakeColumn = toSnakeCase(columnName);
      const sqlType = TYPE_MAPPINGS[field.type] || 'TEXT';
      const defaultVal = getDefaultValue(field.type, field.default);

      let colDef = `${snakeColumn} ${sqlType}`;
      if (defaultVal) {
        colDef += ` DEFAULT ${defaultVal}`;
      }

      lines.push(`ALTER TABLE ${fullTableName} ADD COLUMN IF NOT EXISTS ${colDef};`);
    }
  }
  lines.push('');

  // Step 3: Add unique constraints using unique indexes (works with Neon HTTP)
  lines.push(`-- STEP 3: Add unique indexes (if not exist)`);

  for (const { name, meta } of sortedTables) {
    const snakeTable = toSnakeCase(name);
    const fullTableName = schemaPrefix + snakeTable;

    // Single column unique constraints - use unique indexes
    for (const [columnName, field] of Object.entries(meta.fields)) {
      if (field.unique) {
        const snakeColumn = toSnakeCase(columnName);
        const indexName = `uq_${snakeTable}_${snakeColumn}`;
        lines.push(`CREATE UNIQUE INDEX IF NOT EXISTS ${indexName} ON ${fullTableName}(${snakeColumn});`);
      }
    }

    // Composite unique constraints - use unique indexes
    if (meta.uniqueConstraints) {
      for (const constraint of meta.uniqueConstraints) {
        const cols = constraint.columns.map(toSnakeCase).join(', ');
        const indexName = `uq_${snakeTable}_${constraint.columns.map(toSnakeCase).join('_')}`;
        lines.push(`CREATE UNIQUE INDEX IF NOT EXISTS ${indexName} ON ${fullTableName}(${cols});`);
      }
    }
  }
  lines.push('');

  // Step 4: Add foreign key constraints (will be executed with error handling)
  lines.push(`-- STEP 4: Add foreign keys (errors ignored if already exist)`);

  for (const { name, meta } of sortedTables) {
    const snakeTable = toSnakeCase(name);
    const fullTableName = schemaPrefix + snakeTable;

    for (const [columnName, field] of Object.entries(meta.fields)) {
      if (field.references) {
        const snakeColumn = toSnakeCase(columnName);
        const refTable = schemaPrefix + toSnakeCase(field.references.table);
        const refColumn = toSnakeCase(field.references.column);
        const constraintName = `fk_${snakeTable}_${snakeColumn}`;

        // Mark with special comment so execution can handle errors
        lines.push(`--FK_CONSTRAINT`);
        lines.push(`ALTER TABLE ${fullTableName} ADD CONSTRAINT ${constraintName} FOREIGN KEY (${snakeColumn}) REFERENCES ${refTable}(${refColumn}) ON DELETE CASCADE;`);
      }
    }
  }
  lines.push('');

  // Step 5: Create indexes
  lines.push(`-- STEP 5: Create indexes (if not exist)`);

  for (const { name, meta } of sortedTables) {
    const snakeTable = toSnakeCase(name);
    const fullTableName = schemaPrefix + snakeTable;

    for (const [columnName, field] of Object.entries(meta.fields)) {
      if (field.references) {
        const snakeColumn = toSnakeCase(columnName);
        lines.push(`CREATE INDEX IF NOT EXISTS idx_${snakeTable}_${snakeColumn} ON ${fullTableName}(${snakeColumn});`);
      }
    }
  }
  lines.push('');

  // Step 6: Note about triggers
  // Triggers require PL/pgSQL functions with $$ blocks which don't work with Neon HTTP.
  // The updated_at column should be set at the application level or via a WebSocket migration.
  lines.push(`-- STEP 6: Triggers (skipped for Neon HTTP compatibility)`);
  lines.push(`-- NOTE: updated_at triggers require PL/pgSQL which is not supported via Neon HTTP.`);
  lines.push(`-- Set updated_at at the application level or run triggers via psql/WebSocket.`);
  lines.push('');

  return lines.join('\n');
}

/**
 * Execute the schema SQL using a Neon SQL function
 *
 * @param sql - Neon sql function (from `neon()` or passed connection)
 * @param schemaName - Optional PostgreSQL schema name
 */
export async function runSchemaSQL(
  sql: (query: string) => Promise<unknown>,
  schemaName?: string
): Promise<void> {
  const schemaSQL = generatePostgresSchemaSQL(schemaName);

  // Split into individual statements
  const statements = splitSQLStatements(schemaSQL);

  let isFkConstraint = false;
  for (let i = 0; i < statements.length; i++) {
    const trimmed = statements[i].trim();

    // Track FK constraint marker
    if (trimmed === '--FK_CONSTRAINT') {
      isFkConstraint = true;
      continue;
    }

    if (trimmed && !trimmed.startsWith('--')) {
      try {
        await sql(trimmed);
      } catch (error: unknown) {
        // For FK constraints, ignore "already exists" errors (code 42710)
        const isAlreadyExists =
          error instanceof Error &&
          'code' in error &&
          (error as { code: string }).code === '42710';

        if (isFkConstraint && isAlreadyExists) {
          // Constraint already exists, that's fine
          continue;
        }

        console.error(`[Schema] Failed at statement ${i + 1}/${statements.length}:`);
        console.error(`[Schema] Statement preview: ${trimmed.slice(0, 100)}...`);
        throw error;
      }
    }

    // Reset FK marker after processing
    isFkConstraint = false;
  }
}

/**
 * Split SQL into individual statements
 * Each statement ends with a semicolon, comments are preserved as separate entries
 */
function splitSQLStatements(sql: string): string[] {
  const statements: string[] = [];
  let current = '';

  const lines = sql.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip empty lines
    if (!trimmed) {
      continue;
    }

    // Preserve comment markers (like --FK_CONSTRAINT) as separate statements
    if (trimmed.startsWith('--')) {
      if (current.trim()) {
        statements.push(current.trim());
        current = '';
      }
      statements.push(trimmed);
      continue;
    }

    // Regular statement
    current += line + '\n';
    if (trimmed.endsWith(';')) {
      statements.push(current.trim());
      current = '';
    }
  }

  if (current.trim()) {
    statements.push(current.trim());
  }

  return statements;
}

/**
 * Create a Neon SQL function from various connection types
 *
 * The Neon serverless library returns a tagged template function from neon(),
 * but for conventional string queries we need to use sql.query() instead.
 * This helper wraps the neon instance to provide a simple query function.
 *
 * @param rawConnection - neon() function, connection string, or undefined (uses env vars)
 * @returns SQL function that can be used with runSchemaSQL, or null if unable to create
 */
export async function createNeonSqlFunction(
  rawConnection: unknown
): Promise<((query: string) => Promise<unknown>) | null> {
  // Type for objects with a query method (like neon sql instance)
  type SqlWithQuery = { query: (sql: string) => Promise<unknown> };

  // Helper to wrap a neon sql instance with .query() method
  const wrapNeonSql = (sql: SqlWithQuery): ((query: string) => Promise<unknown>) => {
    return (query: string) => sql.query(query);
  };

  // User passed neon() function directly
  if (typeof rawConnection === 'function') {
    // Check if it has a .query method (neon sql instance)
    if ('query' in rawConnection && typeof rawConnection.query === 'function') {
      return wrapNeonSql(rawConnection as SqlWithQuery);
    }
    // Fallback for legacy/custom sql functions
    return rawConnection as (query: string) => Promise<unknown>;
  }

  // User passed a connection string
  if (typeof rawConnection === 'string' && rawConnection) {
    const { neon } = await import('@neondatabase/serverless');
    const sql = neon(rawConnection);
    return wrapNeonSql(sql as unknown as SqlWithQuery);
  }

  // Try to get from environment variables
  const connectionString =
    process.env.NEON_CONNECTION_STRING ||
    process.env.NEON_PG_URL ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    '';

  if (!connectionString) {
    return null;
  }

  const { neon } = await import('@neondatabase/serverless');
  const sql = neon(connectionString);
  return wrapNeonSql(sql as unknown as SqlWithQuery);
}
