import type { Kysely, ColumnDataType, RawBuilder } from 'kysely';
import { sql } from 'kysely';
import { getMigrations as getAuthMigrations } from 'better-auth/db';
import type { Database } from './schema';
import { SCHEMA_METADATA } from './schema';
import { logger } from '../utils/logger';
import { getAuthClientOptions } from '@/auth';
import type { DatabaseType } from './index';

/**
 * Options for migration operations
 */
export interface MigrationOptions {
  /**
   * PostgreSQL schema name to use.
   * If provided, the schema will be created if it doesn't exist.
   */
  schema?: string;
  rawConnection?: unknown;
}

const postgresMap = {
  uuid: ['character varying', 'varchar', 'text', 'uuid'],
  text: ['character varying', 'varchar', 'text'],
  timestamp: ['timestamptz', 'timestamp', 'date'],
  jsonb: ['json', 'jsonb'],
  integer: ['integer', 'int4', 'int', 'smallint', 'bigint', 'int2', 'int8'],
  boolean: ['boolean', 'bool'],
};

const mysqlMap = {
  text: ['varchar', 'text'],
  timestamp: ['timestamp', 'datetime', 'date'],
  jsonb: ['json'],
};

const sqliteMap = {
  text: ['TEXT'],
  date: ['DATE', 'INTEGER'],
  integer: ['INTEGER'],
  boolean: ['INTEGER', 'BOOLEAN', 'TEXT'],
  jsonb: ['TEXT'],
};

const mssqlMap = {
  varchar: ['varchar', 'nvarchar', 'uniqueidentifier'],
  datetime2: ['datetime2', 'date', 'datetime'],
  jsonb: ['varchar', 'nvarchar'],
};

const typeMap = {
  postgres: postgresMap,
  neon: postgresMap,
  mysql: mysqlMap,
  sqlite: sqliteMap,
  mssql: mssqlMap,
};

export function matchType(
  columnDataType: string,
  fieldType: string,
  dbType: DatabaseType
): boolean {
  const normalize = (type: string) => type.toLowerCase().split('(')[0]!.trim();
  const types = typeMap[dbType] as any;

  for (const [expectedType, variants] of Object.entries(types)) {
    if (fieldType.toLowerCase().includes(expectedType.toLowerCase())) {
      return (variants as string[]).some(
        (variant) => variant.toLowerCase() === normalize(columnDataType)
      );
    }
  }

  return false;
}

/**
 * Get the current PostgreSQL schema (search_path) for the database connection
 */
async function getPostgresSchema(db: Kysely<Database>): Promise<string> {
  try {
    const result = await sql<{ search_path: string }>`SHOW search_path`.execute(
      db
    );
    if (result.rows[0]?.search_path) {
      const schemas = result.rows[0].search_path
        .split(',')
        .map((s) => s.trim())
        .map((s) => s.replace(/^["']|["']$/g, ''))
        .filter((s) => !s.startsWith('$'));
      return schemas[0] || 'public';
    }
  } catch {
    // If query fails, fall back to public schema
  }
  return 'public';
}

/**
 * Ensure the PostgreSQL schema exists, creating it if necessary
 */
async function ensurePostgresSchemaExists(
  db: Kysely<Database>,
  schema: string
): Promise<void> {
  if (schema === 'public') {
    // public schema always exists
    return;
  }

  try {
    // Check if schema exists
    const result = await sql<{ exists: boolean }>`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.schemata
        WHERE schema_name = ${schema}
      ) as exists
    `.execute(db);

    if (!result.rows[0]?.exists) {
      logger.info(`Creating PostgreSQL schema: ${schema}`);
      await sql`CREATE SCHEMA IF NOT EXISTS ${sql.ref(schema)}`.execute(db);
    }
  } catch (error) {
    logger.warn({ error }, 'Failed to ensure PostgreSQL schema exists');
  }
}

export interface MigrationResult {
  toBeCreated: Array<{
    table: string;
    fields: Record<string, any>;
    order: number;
  }>;
  toBeAdded: Array<{
    table: string;
    fields: Record<string, any>;
    order: number;
  }>;
  runMigrations: () => Promise<void>;
  compileMigrations: () => Promise<string>;
  migrations: any[];
  needsMigration: boolean;
}

export async function getMigrations(
  db: Kysely<Database>,
  dbType: DatabaseType,
  options?: MigrationOptions
): Promise<MigrationResult> {
  // For PostgreSQL, detect and log the current schema being used
  let currentSchema = 'public';
  if (dbType === 'postgres') {
    // If schema is provided in options, ensure it exists first
    if (options?.schema) {
      await ensurePostgresSchemaExists(db, options.schema);
      currentSchema = options.schema;
    } else {
      currentSchema = await getPostgresSchema(db);
    }
    logger.debug(`PostgreSQL migration: Using schema '${currentSchema}'`);
  }

  const allTableMetadata = await db.introspection.getTables();

  // For PostgreSQL, filter tables to only those in the target schema
  let tableMetadata = allTableMetadata;
  if (dbType === 'postgres') {
    try {
      const tablesInSchema = await sql<{ table_name: string }>`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = ${currentSchema}
        AND table_type = 'BASE TABLE'
      `.execute(db);

      const tableNamesInSchema = new Set(
        tablesInSchema.rows.map((row) => row.table_name)
      );

      tableMetadata = allTableMetadata.filter(
        (table) =>
          table.schema === currentSchema && tableNamesInSchema.has(table.name)
      );

      logger.debug(
        `Found ${tableMetadata.length} table(s) in schema '${currentSchema}'`
      );
    } catch (error) {
      logger.warn(
        'Could not filter tables by schema. Using all discovered tables.'
      );
    }
  }

  const schema = SCHEMA_METADATA.tables;

  const toBeCreated: Array<{
    table: string;
    fields: (typeof schema)[keyof typeof schema]['fields'];
    order: number;
  }> = [];

  const toBeAdded: Array<{
    table: string;
    fields: Partial<(typeof schema)[keyof typeof schema]['fields']>;
    order: number;
  }> = [];

  // Check which tables need to be created or have missing fields
  for (const [tableName, tableConfig] of Object.entries(schema)) {
    const existingTable = tableMetadata.find((t) => t.name === tableName);

    if (!existingTable) {
      toBeCreated.push({
        table: tableName,
        fields: tableConfig.fields,
        order: tableConfig.order,
      });
      continue;
    }

    // Check for missing fields
    const missingFields: Record<
      string,
      (typeof tableConfig.fields)[keyof typeof tableConfig.fields]
    > = {};
    for (const [fieldName, fieldConfig] of Object.entries(tableConfig.fields)) {
      const existingColumn = existingTable.columns.find(
        (c) => c.name === fieldName
      );

      if (!existingColumn) {
        missingFields[fieldName] = fieldConfig;
        continue;
      }

      // Verify type matches
      if (!matchType(existingColumn.dataType, fieldConfig.type, dbType)) {
        logger.warn(
          `Field ${fieldName} in table ${tableName} has a different type. ` +
            `Expected ${fieldConfig.type} but got ${existingColumn.dataType}.`
        );
      }
    }

    if (Object.keys(missingFields).length > 0) {
      toBeAdded.push({
        table: tableName,
        fields: missingFields,
        order: tableConfig.order,
      });
    }
  }

  // Sort by order
  toBeCreated.sort((a, b) => a.order - b.order);
  toBeAdded.sort((a, b) => a.order - b.order);

  const migrations: any[] = [];

  // Helper to get the correct column type for each database
  function getColumnType(
    fieldConfig: any,
    fieldName: string
  ): ColumnDataType | RawBuilder<unknown> {
    const { type } = fieldConfig;

    const colTypeMap: Record<
      string,
      Record<DatabaseType, ColumnDataType | RawBuilder<unknown>>
    > = {
      uuid: {
        postgres: 'uuid',
        neon: 'uuid',
        mysql: 'varchar(36)',
        sqlite: 'text',
        mssql: 'varchar(36)',
      },
      text: {
        postgres: 'text',
        neon: 'text',
        mysql: fieldConfig.unique ? 'varchar(255)' : 'text',
        sqlite: 'text',
        mssql: fieldConfig.unique ? 'varchar(255)' : 'varchar(8000)',
      },
      timestamp: {
        postgres: 'timestamptz',
        neon: 'timestamptz',
        mysql: 'timestamp(3)',
        sqlite: 'date',
        mssql: sql`datetime2(3)`,
      },
      jsonb: {
        postgres: 'jsonb',
        neon: 'jsonb',
        mysql: 'json',
        sqlite: 'text',
        mssql: 'varchar(8000)',
      },
      boolean: {
        postgres: 'boolean',
        neon: 'boolean',
        mysql: 'boolean',
        sqlite: 'integer',
        mssql: sql`bit`,
      },
      integer: {
        postgres: 'integer',
        neon: 'integer',
        mysql: 'integer',
        sqlite: 'integer',
        mssql: 'integer',
      },
    };

    return colTypeMap[type]?.[dbType] || 'text';
  }

  // IMPORTANT: Create new tables FIRST (before adding columns that may reference them)
  for (const table of toBeCreated) {
    let builder = db.schema.createTable(table.table);

    // Add all columns
    for (const [fieldName, fieldConfig] of Object.entries(table.fields)) {
      const type = getColumnType(fieldConfig, fieldName);

      builder = builder.addColumn(fieldName, type, (col) => {
        let c = col;

        if (fieldName === 'id') {
          if (dbType === 'postgres') {
            c = c
              .primaryKey()
              .defaultTo(sql`gen_random_uuid()`)
              .notNull();
          } else {
            c = c.primaryKey().notNull();
          }
        } else if (!fieldConfig.nullable) {
          // Only add notNull constraint if the field is not nullable
          c = c.notNull();
        }

        if (fieldConfig.references && fieldName !== 'id') {
          const refTable = fieldConfig.references.table;
          const refColumn = fieldConfig.references.column;
          c = c.references(`${refTable}.${refColumn}`).onDelete('cascade');
        }

        if (fieldConfig.unique && fieldName !== 'id') {
          c = c.unique();
        }

        if (
          fieldConfig.default === 'now()' &&
          fieldName !== 'id' &&
          dbType !== 'sqlite'
        ) {
          if (dbType === 'mysql') {
            c = c.defaultTo(sql`CURRENT_TIMESTAMP(3)`);
          } else {
            c = c.defaultTo(sql`CURRENT_TIMESTAMP`);
          }
        }

        return c;
      });
    }

    migrations.push(builder);
  }

  // Add missing columns to existing tables AFTER creating new tables
  // (columns may reference newly created tables)
  for (const table of toBeAdded) {
    for (const [fieldName, fieldConfig] of Object.entries(table.fields)) {
      const type = getColumnType(fieldConfig, fieldName);
      const builder = db.schema
        .alterTable(table.table)
        .addColumn(fieldName, type, (col) => {
          let c = col;

          // Add notNull constraint only if the field is not nullable
          if (!fieldConfig.nullable) {
            c = c.notNull();
          }

          if (fieldConfig.references) {
            const refTable = fieldConfig.references.table;
            const refColumn = fieldConfig.references.column;
            c = c.references(`${refTable}.${refColumn}`).onDelete('cascade');
          }

          if (fieldConfig.unique) {
            c = c.unique();
          }

          if (fieldConfig.default === 'now()' && dbType !== 'sqlite') {
            if (dbType === 'mysql') {
              c = c.defaultTo(sql`CURRENT_TIMESTAMP(3)`);
            } else {
              c = c.defaultTo(sql`CURRENT_TIMESTAMP`);
            }
          }

          return c;
        });

      migrations.push(builder);
    }
  }

  // For Neon, schema is set via currentSchema in connection string
  // For regular PostgreSQL, ensure schema is set
  if (dbType === 'postgres') {
    try {
      await sql`SET search_path TO "${options?.schema ?? 'llmops'}"`.execute(
        db
      );
    } catch (error) {
      logger.warn(
        { error },
        'Failed to set search_path for Better Auth migrations'
      );
    }
  }

  const authOptions = getAuthClientOptions({
    database: {
      db: db,
      type: dbType === 'neon' ? 'postgres' : dbType,
    },
  });
  const {
    toBeAdded: authChangesToBeAdded,
    toBeCreated: authChangesToBeCreated,
    runMigrations: runAuthMigrations,
  } = await getAuthMigrations(authOptions);

  async function runMigrations() {
    for (const migration of migrations) {
      await migration.execute();
    }
    await runAuthMigrations();
  }

  async function compileMigrations() {
    const compiled = migrations.map((m) => m.compile().sql);
    return compiled.join(';\n\n') + ';';
  }

  return {
    toBeCreated: [...toBeCreated, ...authChangesToBeCreated],
    toBeAdded: [...toBeAdded, ...authChangesToBeAdded],
    runMigrations,
    compileMigrations,
    migrations,
    needsMigration:
      toBeCreated.length > 0 ||
      toBeAdded.length > 0 ||
      authChangesToBeCreated.length > 0 ||
      authChangesToBeAdded.length > 0,
  };
}

/**
 * Fix legacy constraints that may exist from previous schema versions
 */
async function fixLegacyConstraints(
  db: Kysely<Database>,
  dbType: DatabaseType,
  schema: string = 'public'
) {
  // Only handling Postgres for now as it's the primary supported DB with this issue
  if (dbType === 'postgres') {
    logger.info(
      `Auto-migration: Checking for legacy constraints in schema '${schema}'...`
    );

    // 1. Explicitly drop the known problematic constraint from the error log
    // The error confirmed the name is "provider_configs_providerId_key"
    try {
      await sql`ALTER TABLE ${sql.ref(schema)}."provider_configs" DROP CONSTRAINT IF EXISTS "provider_configs_providerId_key"`.execute(
        db
      );
      // Also try the lowercase version just in case
      await sql`ALTER TABLE ${sql.ref(schema)}."provider_configs" DROP CONSTRAINT IF EXISTS "provider_configs_providerid_key"`.execute(
        db
      );
    } catch (err) {
      logger.warn(
        `Auto-migration: Failed to drop specific legacy constraint: ${err}`
      );
    }

    // 2. Generic search for other potential unique constraints on providerId
    try {
      // Find unique constraints on provider_configs.providerId
      const result = await sql<{ conname: string }>`
        SELECT conname
        FROM pg_constraint c
        JOIN pg_namespace n ON n.oid = c.connamespace
        JOIN pg_class t ON t.oid = c.conrelid
        WHERE n.nspname = ${schema}
          AND t.relname = 'provider_configs'
          AND c.contype = 'u'
          AND EXISTS (
            SELECT 1 FROM pg_attribute a 
            WHERE a.attrelid = c.conrelid 
            AND a.attnum = ANY(c.conkey) 
            AND lower(a.attname) = 'providerid'
          )
      `.execute(db);

      for (const row of result.rows) {
        logger.info(
          `Auto-migration: Removing legacy unique constraint '${row.conname}' from provider_configs`
        );
        // Safely drop the constraint
        await sql`ALTER TABLE ${sql.ref(schema)}."provider_configs" DROP CONSTRAINT ${sql.ref(row.conname)}`.execute(
          db
        );
      }
    } catch (err) {
      logger.warn(
        `Auto-migration: Failed to cleanup legacy constraints: ${err}`
      );
    }
  }
}

/**
 * Run migrations if needed
 * @param db - Kysely database instance
 * @param dbType - Database type
 * @param options - Migration options (schema, etc.)
 * @returns true if migrations were run, false otherwise
 */
export async function runAutoMigrations(
  db: Kysely<Database>,
  dbType: DatabaseType,
  options?: MigrationOptions
): Promise<{ ran: boolean; tables: string[]; fields: string[] }> {
  // Resolve schema for fixups
  let currentSchema = options?.schema || 'public';
  if (dbType === 'postgres' && !options?.schema) {
    currentSchema = await getPostgresSchema(db);
  }

  // Run legacy constraint fixups before or after migrations
  // Running it here ensures the table exists (if it was just created, it won't have the constraint anyway)
  // If it existed before, we remove the constraint.
  try {
    // Only attempt fixup if table likely exists (we can rely on try-catch too)
    await fixLegacyConstraints(db, dbType, currentSchema);
  } catch (error) {
    // Ignore errors in fixup to prevent blocking startup
    logger.debug(`Constraint fixup skipped or failed: ${error}`);
  }

  const { toBeCreated, toBeAdded, runMigrations, needsMigration } =
    await getMigrations(db, dbType, options);

  if (!needsMigration) {
    logger.debug('Auto-migration: No migrations needed');
    return { ran: false, tables: [], fields: [] };
  }

  const tables = toBeCreated.map((t) => t.table);
  const fields = toBeAdded.flatMap((t) =>
    Object.keys(t.fields).map((f) => `${t.table}.${f}`)
  );

  logger.info(
    `Auto-migration: Running migrations for ${tables.length} table(s) and ${fields.length} field(s)`
  );

  if (tables.length > 0) {
    logger.debug(`Auto-migration: Creating tables: ${tables.join(', ')}`);
  }

  if (fields.length > 0) {
    logger.debug(`Auto-migration: Adding fields: ${fields.join(', ')}`);
  }

  await runMigrations();

  logger.info('Auto-migration: Completed successfully');

  return { ran: true, tables, fields };
}
