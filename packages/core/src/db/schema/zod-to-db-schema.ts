import { z } from 'zod';
import type { DBFieldAttribute, LLMOpsDBSchema } from '../type';

import type { DBPrimitive } from '../type';

/**
 * Metadata for field attributes that aren't part of the Zod schema
 */
export interface FieldMetadata {
  defaultValue?: DBPrimitive | (() => DBPrimitive) | string;
  onUpdate?: () => DBPrimitive;
  references?: {
    model: string;
    field: string;
    onDelete?:
      | 'no action'
      | 'restrict'
      | 'cascade'
      | 'set null'
      | 'set default';
  };
  unique?: boolean;
  index?: boolean;
  sortable?: boolean;
}

/**
 * Table metadata including field-specific configurations
 */
export interface TableMetadata {
  modelName: string;
  order?: number;
  disableMigrations?: boolean;
  fields?: Record<string, FieldMetadata>;
}

/**
 * Convert a Zod type to a DBFieldType
 * Note: Zod v4 uses _def.type instead of _def.typeName
 */
function zodTypeToDBFieldType(zodType: z.ZodTypeAny): DBFieldAttribute['type'] {
  const def = zodType._def as any;
  const type = def?.type;

  if (!type) {
    return 'string';
  }

  if (type === 'string') {
    return 'string';
  }
  if (type === 'number') {
    return 'number';
  }
  if (type === 'boolean') {
    return 'boolean';
  }
  if (type === 'date') {
    return 'date';
  }
  if (type === 'array') {
    const innerType = def.type?._def?.type;
    if (innerType === 'string') {
      return 'string[]';
    }
    if (innerType === 'number') {
      return 'number[]';
    }
  }
  if (type === 'record' || type === 'object') {
    return 'json';
  }
  if (type === 'enum') {
    return def.values as string[];
  }

  // Default fallback
  return 'string';
}

/**
 * Check if a Zod field is required (not optional or nullable)
 * Note: Zod v4 uses _def.type instead of _def.typeName
 */
function isZodFieldRequired(zodType: z.ZodTypeAny): boolean {
  const def = zodType._def as any;
  const type = def?.type;
  return !(type === 'optional' || type === 'nullable');
}

/**
 * Convert a Zod object schema to LLMOpsDBSchema field attributes
 */
export function zodSchemaToFields(
  schema: z.ZodObject<any>,
  metadata?: Record<string, FieldMetadata>
): Record<string, DBFieldAttribute> {
  const shape = schema.shape;
  const fields: Record<string, DBFieldAttribute> = {};

  for (const [fieldName, zodType] of Object.entries(shape)) {
    const fieldMeta = metadata?.[fieldName] || {};
    const type = zodTypeToDBFieldType(zodType as z.ZodTypeAny);
    const required = isZodFieldRequired(zodType as z.ZodTypeAny);

    fields[fieldName] = {
      type,
      required,
      ...fieldMeta,
    } as DBFieldAttribute;
  }

  return fields;
}

/**
 * Convert a collection of Zod schemas to LLMOpsDBSchema
 */
export function zodSchemasToDBSchema(
  schemas: Record<string, z.ZodObject<any>>,
  metadata: Record<string, TableMetadata>
): LLMOpsDBSchema {
  const dbSchema: LLMOpsDBSchema = {};

  for (const [tableName, zodSchema] of Object.entries(schemas)) {
    const tableMeta = metadata[tableName] || { modelName: tableName };

    dbSchema[tableName] = {
      modelName: tableMeta.modelName,
      fields: zodSchemaToFields(zodSchema, tableMeta.fields),
      order: tableMeta.order,
      disableMigrations: tableMeta.disableMigrations,
    };
  }

  return dbSchema;
}

/**
 * Helper to create field metadata for common patterns
 */
export const fieldMeta = {
  timestamp: (field: 'createdAt' | 'updatedAt'): FieldMetadata => ({
    defaultValue: field === 'createdAt' ? 'now()' : 'now()',
    onUpdate: field === 'updatedAt' ? () => new Date() : undefined,
  }),

  reference: (
    model: string,
    field: string = 'id',
    onDelete: 'cascade' | 'set null' | 'restrict' = 'cascade'
  ): FieldMetadata => ({
    references: { model, field, onDelete },
  }),

  unique: (): FieldMetadata => ({
    unique: true,
  }),

  indexed: (): FieldMetadata => ({
    index: true,
  }),
};
