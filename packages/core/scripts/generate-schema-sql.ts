#!/usr/bin/env npx tsx
/**
 * Generate SQL schema files from SCHEMA_METADATA
 *
 * Usage: npx tsx packages/core/scripts/generate-schema-sql.ts [schema-name]
 *
 * Examples:
 *   npx tsx packages/core/scripts/generate-schema-sql.ts          # Generate all schemas
 *   npx tsx packages/core/scripts/generate-schema-sql.ts myapp    # Generate schema for 'myapp'
 *
 * Generates fully idempotent, procedural SQL files for different database dialects.
 * These scripts can be run on every server restart and will:
 * - Create tables that don't exist
 * - Add columns that are missing from existing tables
 * - Add indexes that are missing
 * - Add constraints that are missing
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import the shared schema generator
import { generatePostgresSchemaSQL } from '../src/db/schema-sql';
import { SCHEMA_METADATA } from '../src/db/schema';

type Dialect = 'sqlite' | 'mysql';

interface FieldMeta {
  type: string;
  primaryKey?: boolean;
  unique?: boolean;
  nullable?: boolean;
  default?: string | number | boolean;
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

// Type mappings for non-PostgreSQL dialects
const TYPE_MAPPINGS: Record<Dialect, Record<string, string>> = {
  sqlite: {
    uuid: 'TEXT',
    text: 'TEXT',
    integer: 'INTEGER',
    boolean: 'INTEGER',
    timestamp: 'TEXT',
    jsonb: 'TEXT',
  },
  mysql: {
    uuid: 'CHAR(36)',
    text: 'TEXT',
    integer: 'INT',
    boolean: 'TINYINT(1)',
    timestamp: 'TIMESTAMP',
    jsonb: 'JSON',
  },
};

function getDefaultValue(
  dialect: Dialect,
  fieldType: string,
  defaultValue: string | number | boolean | undefined
): string | null {
  if (defaultValue === undefined) return null;

  if (defaultValue === 'now()') {
    return dialect === 'sqlite' ? "(datetime('now'))" : 'CURRENT_TIMESTAMP';
  }

  if (typeof defaultValue === 'boolean') {
    return defaultValue ? '1' : '0';
  }

  if (typeof defaultValue === 'number') {
    return String(defaultValue);
  }

  if (typeof defaultValue === 'string') {
    if (defaultValue === '{}') {
      return dialect === 'mysql' ? '(JSON_OBJECT())' : "'{}'";
    }
    return `'${defaultValue}'`;
  }

  return null;
}

function toSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

function generateColumnDef(
  dialect: Dialect,
  columnName: string,
  field: FieldMeta
): string {
  const sqlType = TYPE_MAPPINGS[dialect][field.type] || 'TEXT';
  const snakeColumn = toSnakeCase(columnName);
  const parts: string[] = [snakeColumn, sqlType];

  if (field.primaryKey) {
    parts.push('PRIMARY KEY');
  } else {
    if (!field.nullable) {
      parts.push('NOT NULL');
    }
    const defaultVal = getDefaultValue(dialect, field.type, field.default);
    if (defaultVal) {
      parts.push(`DEFAULT ${defaultVal}`);
    }
  }

  return parts.join(' ');
}

// Generate SQLite schema
function generateSqliteSchema(): string {
  const lines: string[] = [];

  lines.push(`-- LLMOps Database Schema (SQLite)`);
  lines.push(`-- Generated: ${new Date().toISOString()}`);
  lines.push(`-- NOTE: SQLite doesn't support ADD COLUMN IF NOT EXISTS.`);
  lines.push(`-- This schema creates tables if they don't exist but cannot add columns to existing tables.`);
  lines.push('');

  const sortedTables = Object.entries(SCHEMA_METADATA.tables)
    .map(([name, meta]) => ({ name, meta: meta as TableMeta }))
    .sort((a, b) => a.meta.order - b.meta.order);

  for (const { name, meta } of sortedTables) {
    const snakeTable = toSnakeCase(name);

    lines.push(`-- Table: ${name}`);
    lines.push(`CREATE TABLE IF NOT EXISTS ${snakeTable} (`);

    const columnDefs: string[] = [];

    for (const [columnName, field] of Object.entries(meta.fields)) {
      columnDefs.push('  ' + generateColumnDef('sqlite', columnName, field));
    }

    for (const [columnName, field] of Object.entries(meta.fields)) {
      if (field.unique) {
        const snakeColumn = toSnakeCase(columnName);
        columnDefs.push(`  UNIQUE (${snakeColumn})`);
      }
    }

    if (meta.uniqueConstraints) {
      for (const constraint of meta.uniqueConstraints) {
        const cols = constraint.columns.map(toSnakeCase).join(', ');
        columnDefs.push(`  UNIQUE (${cols})`);
      }
    }

    lines.push(columnDefs.join(',\n'));
    lines.push(`);`);
    lines.push('');
  }

  lines.push(`-- Indexes`);
  for (const { name, meta } of sortedTables) {
    const snakeTable = toSnakeCase(name);

    for (const [columnName, field] of Object.entries(meta.fields)) {
      if (field.references) {
        const snakeColumn = toSnakeCase(columnName);
        lines.push(`CREATE INDEX IF NOT EXISTS idx_${snakeTable}_${snakeColumn} ON ${snakeTable}(${snakeColumn});`);
      }
    }
  }
  lines.push('');

  return lines.join('\n');
}

// Generate MySQL schema
function generateMysqlSchema(): string {
  const lines: string[] = [];

  lines.push(`-- LLMOps Database Schema (MySQL)`);
  lines.push(`-- Generated: ${new Date().toISOString()}`);
  lines.push(`-- NOTE: MySQL doesn't support ADD COLUMN IF NOT EXISTS in standard SQL.`);
  lines.push(`-- This schema creates tables if they don't exist.`);
  lines.push('');

  const sortedTables = Object.entries(SCHEMA_METADATA.tables)
    .map(([name, meta]) => ({ name, meta: meta as TableMeta }))
    .sort((a, b) => a.meta.order - b.meta.order);

  for (const { name, meta } of sortedTables) {
    const snakeTable = toSnakeCase(name);

    lines.push(`-- Table: ${name}`);
    lines.push(`CREATE TABLE IF NOT EXISTS ${snakeTable} (`);

    const columnDefs: string[] = [];
    const constraints: string[] = [];

    for (const [columnName, field] of Object.entries(meta.fields)) {
      columnDefs.push('  ' + generateColumnDef('mysql', columnName, field));

      if (field.unique) {
        const snakeColumn = toSnakeCase(columnName);
        constraints.push(`  UNIQUE KEY uq_${snakeTable}_${snakeColumn} (${snakeColumn})`);
      }

      if (field.references) {
        const snakeColumn = toSnakeCase(columnName);
        const refTable = toSnakeCase(field.references.table);
        const refColumn = toSnakeCase(field.references.column);
        constraints.push(`  CONSTRAINT fk_${snakeTable}_${snakeColumn} FOREIGN KEY (${snakeColumn}) REFERENCES ${refTable}(${refColumn}) ON DELETE CASCADE`);
      }
    }

    if (meta.uniqueConstraints) {
      for (const constraint of meta.uniqueConstraints) {
        const cols = constraint.columns.map(toSnakeCase).join(', ');
        const constraintName = `uq_${snakeTable}_${constraint.columns.map(toSnakeCase).join('_')}`;
        constraints.push(`  UNIQUE KEY ${constraintName} (${cols})`);
      }
    }

    lines.push([...columnDefs, ...constraints].join(',\n'));
    lines.push(`) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`);
    lines.push('');
  }

  return lines.join('\n');
}

// Main function
async function main() {
  const outputDir = path.join(__dirname, '..', 'sql');
  const customSchema = process.argv[2];

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Generate PostgreSQL schemas using the shared function
  if (customSchema) {
    // Generate for custom schema only
    const postgresCustom = generatePostgresSchemaSQL(customSchema);
    const filename = `schema.postgres.${customSchema}.sql`;
    fs.writeFileSync(path.join(outputDir, filename), postgresCustom, 'utf-8');
    console.log(`Generated: sql/${filename}`);
  } else {
    // Generate default schemas
    const postgresLlmops = generatePostgresSchemaSQL('llmops');
    fs.writeFileSync(path.join(outputDir, 'schema.postgres.llmops.sql'), postgresLlmops, 'utf-8');
    console.log('Generated: sql/schema.postgres.llmops.sql');

    const postgresPublic = generatePostgresSchemaSQL();
    fs.writeFileSync(path.join(outputDir, 'schema.postgres.sql'), postgresPublic, 'utf-8');
    console.log('Generated: sql/schema.postgres.sql');
  }

  // Generate SQLite schema
  const sqlite = generateSqliteSchema();
  fs.writeFileSync(path.join(outputDir, 'schema.sqlite.sql'), sqlite, 'utf-8');
  console.log('Generated: sql/schema.sqlite.sql');

  // Generate MySQL schema
  const mysql = generateMysqlSchema();
  fs.writeFileSync(path.join(outputDir, 'schema.mysql.sql'), mysql, 'utf-8');
  console.log('Generated: sql/schema.mysql.sql');

  console.log('\nDone! SQL schema files generated.');
  console.log('\nPostgreSQL schemas are fully idempotent and can be run on every server restart.');
  console.log('SQLite/MySQL schemas only handle table creation (no ADD COLUMN IF NOT EXISTS support).');

  if (!customSchema) {
    console.log('\nTo generate for a custom schema: npx tsx scripts/generate-schema-sql.ts <schema-name>');
  }
}

main().catch(console.error);
