import type { Kysely, ColumnDataType, RawBuilder } from 'kysely';
import { sql } from 'kysely';
import type { Database } from './schema';
import { SCHEMA_METADATA } from './schema';
import { logger } from '../utils/logger';

export type DatabaseType = 'postgres' | 'mysql' | 'sqlite' | 'mssql';

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
  dbType: DatabaseType
): Promise<MigrationResult> {
  // For PostgreSQL, detect and log the current schema being used
  let currentSchema = 'public';
  if (dbType === 'postgres') {
    currentSchema = await getPostgresSchema(db);
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
        mysql: 'varchar(36)',
        sqlite: 'text',
        mssql: 'varchar(36)',
      },
      text: {
        postgres: 'text',
        mysql: fieldConfig.unique ? 'varchar(255)' : 'text',
        sqlite: 'text',
        mssql: fieldConfig.unique ? 'varchar(255)' : 'varchar(8000)',
      },
      timestamp: {
        postgres: 'timestamptz',
        mysql: 'timestamp(3)',
        sqlite: 'date',
        mssql: sql`datetime2(3)`,
      },
      jsonb: {
        postgres: 'jsonb',
        mysql: 'json',
        sqlite: 'text',
        mssql: 'varchar(8000)',
      },
      boolean: {
        postgres: 'boolean',
        mysql: 'boolean',
        sqlite: 'integer',
        mssql: sql`bit`,
      },
      integer: {
        postgres: 'integer',
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

  async function runMigrations() {
    for (const migration of migrations) {
      await migration.execute();
    }
  }

  async function compileMigrations() {
    const compiled = migrations.map((m) => m.compile().sql);
    return compiled.join(';\n\n') + ';';
  }

  return {
    toBeCreated,
    toBeAdded,
    runMigrations,
    compileMigrations,
    migrations,
    needsMigration: toBeCreated.length > 0 || toBeAdded.length > 0,
  };
}

/**
 * Run migrations if needed based on autoMigrate config
 * @param db - Kysely database instance
 * @param dbType - Database type
 * @param autoMigrate - Auto-migrate configuration
 * @returns true if migrations were run, false otherwise
 */
export async function runAutoMigrations(
  db: Kysely<Database>,
  dbType: DatabaseType,
  autoMigrate: boolean | 'development'
): Promise<{ ran: boolean; tables: string[]; fields: string[] }> {
  // Determine if we should run migrations
  const shouldMigrate =
    autoMigrate === true ||
    (autoMigrate === 'development' && process.env.NODE_ENV === 'development');

  if (!shouldMigrate) {
    return { ran: false, tables: [], fields: [] };
  }

  const { toBeCreated, toBeAdded, runMigrations, needsMigration } =
    await getMigrations(db, dbType);

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
