import { schemas, type TableName } from './schema';

/**
 * Validate data against table schema
 * Useful for runtime validation before inserting/updating
 */
export function validateTableData<T extends TableName>(
  table: T,
  data: unknown
) {
  const schema = schemas[table];
  return schema.safeParse(data);
}

/**
 * Validate partial data (for updates)
 */
export function validatePartialTableData<T extends TableName>(
  table: T,
  data: unknown
) {
  const schema = schemas[table].partial();
  return schema.safeParse(data);
}

/**
 * Parse and validate data, throws on error
 */
export function parseTableData<T extends TableName>(table: T, data: unknown) {
  const schema = schemas[table];
  return schema.parse(data);
}

/**
 * Parse partial data, throws on error
 */
export function parsePartialTableData<T extends TableName>(
  table: T,
  data: unknown
) {
  const schema = schemas[table].partial();
  return schema.parse(data);
}
