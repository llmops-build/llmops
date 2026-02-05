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

  // Step 3: Add unique constraints (idempotent using DO block)
  lines.push(`-- STEP 3: Add unique constraints (if not exist)`);

  for (const { name, meta } of sortedTables) {
    const snakeTable = toSnakeCase(name);
    const fullTableName = schemaPrefix + snakeTable;

    // Single column unique constraints
    for (const [columnName, field] of Object.entries(meta.fields)) {
      if (field.unique) {
        const snakeColumn = toSnakeCase(columnName);
        const constraintName = `uq_${snakeTable}_${snakeColumn}`;

        lines.push(`DO $$`);
        lines.push(`BEGIN`);
        lines.push(`  IF NOT EXISTS (`);
        lines.push(`    SELECT 1 FROM pg_constraint WHERE conname = '${constraintName}'`);
        lines.push(`  ) THEN`);
        lines.push(`    ALTER TABLE ${fullTableName} ADD CONSTRAINT ${constraintName} UNIQUE (${snakeColumn});`);
        lines.push(`  END IF;`);
        lines.push(`END $$;`);
      }
    }

    // Composite unique constraints
    if (meta.uniqueConstraints) {
      for (const constraint of meta.uniqueConstraints) {
        const cols = constraint.columns.map(toSnakeCase).join(', ');
        const constraintName = `uq_${snakeTable}_${constraint.columns.map(toSnakeCase).join('_')}`;

        lines.push(`DO $$`);
        lines.push(`BEGIN`);
        lines.push(`  IF NOT EXISTS (`);
        lines.push(`    SELECT 1 FROM pg_constraint WHERE conname = '${constraintName}'`);
        lines.push(`  ) THEN`);
        lines.push(`    ALTER TABLE ${fullTableName} ADD CONSTRAINT ${constraintName} UNIQUE (${cols});`);
        lines.push(`  END IF;`);
        lines.push(`END $$;`);
      }
    }
  }
  lines.push('');

  // Step 4: Add foreign key constraints
  lines.push(`-- STEP 4: Add foreign keys (if not exist)`);

  for (const { name, meta } of sortedTables) {
    const snakeTable = toSnakeCase(name);
    const fullTableName = schemaPrefix + snakeTable;

    for (const [columnName, field] of Object.entries(meta.fields)) {
      if (field.references) {
        const snakeColumn = toSnakeCase(columnName);
        const refTable = schemaPrefix + toSnakeCase(field.references.table);
        const refColumn = toSnakeCase(field.references.column);
        const constraintName = `fk_${snakeTable}_${snakeColumn}`;

        lines.push(`DO $$`);
        lines.push(`BEGIN`);
        lines.push(`  IF NOT EXISTS (`);
        lines.push(`    SELECT 1 FROM pg_constraint WHERE conname = '${constraintName}'`);
        lines.push(`  ) THEN`);
        lines.push(`    ALTER TABLE ${fullTableName} ADD CONSTRAINT ${constraintName}`);
        lines.push(`      FOREIGN KEY (${snakeColumn}) REFERENCES ${refTable}(${refColumn}) ON DELETE CASCADE;`);
        lines.push(`  END IF;`);
        lines.push(`END $$;`);
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

  // Step 6: Create trigger function and triggers
  lines.push(`-- STEP 6: Create updated_at triggers`);

  // Function must be created in a specific schema
  const functionSchema = schemaName ? `"${schemaName}".` : 'public.';
  const functionName = `${functionSchema}update_updated_at_column`;

  lines.push(`CREATE OR REPLACE FUNCTION ${functionName}()`);
  lines.push(`RETURNS TRIGGER AS $$`);
  lines.push(`BEGIN`);
  lines.push(`  NEW.updated_at = NOW();`);
  lines.push(`  RETURN NEW;`);
  lines.push(`END;`);
  lines.push(`$$ language 'plpgsql';`);

  for (const { name } of sortedTables) {
    const snakeTable = toSnakeCase(name);
    const fullTableName = schemaPrefix + snakeTable;
    lines.push(`DROP TRIGGER IF EXISTS update_${snakeTable}_updated_at ON ${fullTableName};`);
    lines.push(`CREATE TRIGGER update_${snakeTable}_updated_at BEFORE UPDATE ON ${fullTableName} FOR EACH ROW EXECUTE FUNCTION ${functionName}();`);
  }
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

  // Split by semicolons but keep DO blocks together
  const statements = splitSQLStatements(schemaSQL);

  for (const statement of statements) {
    const trimmed = statement.trim();
    if (trimmed && !trimmed.startsWith('--')) {
      await sql(trimmed);
    }
  }
}

/**
 * Split SQL into individual statements, keeping DO blocks together
 */
function splitSQLStatements(sql: string): string[] {
  const statements: string[] = [];
  let current = '';
  let inDoBlock = false;

  const lines = sql.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith('--')) {
      continue;
    }

    // Track DO blocks
    if (trimmed === 'DO $$') {
      inDoBlock = true;
      current = line + '\n';
      continue;
    }

    if (inDoBlock) {
      current += line + '\n';
      if (trimmed === 'END $$;') {
        statements.push(current.trim());
        current = '';
        inDoBlock = false;
      }
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
  // Helper to wrap a neon sql instance with .query() method
  const wrapNeonSql = (
    sql: ReturnType<typeof import('@neondatabase/serverless').neon>
  ): ((query: string) => Promise<unknown>) => {
    return (query: string) => sql.query(query);
  };

  // User passed neon() function directly
  if (typeof rawConnection === 'function') {
    // Check if it has a .query method (neon sql instance)
    if ('query' in rawConnection && typeof rawConnection.query === 'function') {
      return wrapNeonSql(
        rawConnection as ReturnType<
          typeof import('@neondatabase/serverless').neon
        >
      );
    }
    // Fallback for legacy/custom sql functions
    return rawConnection as (query: string) => Promise<unknown>;
  }

  // User passed a connection string
  if (typeof rawConnection === 'string' && rawConnection) {
    const { neon } = await import('@neondatabase/serverless');
    const sql = neon(rawConnection);
    return wrapNeonSql(sql);
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
  return wrapNeonSql(sql);
}
