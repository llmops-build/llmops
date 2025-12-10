import { z } from 'zod';

export const baseModels = z.enum([
  'configs',
  'variants',
  'environments',
  'environment_secrets',
  'config_variants',
  'environment_config_variants',
]);

export const dbFieldTypeSchema = z.union([
  z.literal('string'),
  z.literal('number'),
  z.literal('boolean'),
  z.literal('date'),
  z.literal('json'),
  z.literal('string[]'),
  z.literal('number[]'),
  z.array(z.string()),
]);

export const dbFieldAttributeSchema = z.object({
  type: dbFieldTypeSchema,
  required: z.boolean().optional(),
  returned: z.boolean().optional(),
  input: z.boolean().optional(),
  unique: z.boolean().optional(),
  defaultValue: z.any().optional(),
  references: z.object({
    model: z.string(),
    field: z.string(),
  }).optional(),
  transform: z.function().optional(),
});

export const dbTableSchema = z.object({
  modelName: z.string(),
  fields: z.record(z.string(), dbFieldAttributeSchema),
  disableMigrations: z.boolean().optional(),
  order: z.number().optional(),
});

export const llmopsDBSchema = z.record(z.string(), dbTableSchema);

export type BaseModelNames = z.infer<typeof baseModels>;
export type DBFieldType = z.infer<typeof dbFieldTypeSchema>;
export type DBFieldAttribute = z.infer<typeof dbFieldAttributeSchema>;
export type DBTableSchema = z.infer<typeof dbTableSchema>;
export type LLMOpsDBSchema = z.infer<typeof llmopsDBSchema>;

export interface LLMOpsOptions {
  database?: {
    customFields?: Record<string, Record<string, DBFieldAttribute>>;
    tablePrefix?: string;
  };
  plugins?: Array<{
    id: string;
    schema?: Record<string, DBTableSchema>;
  }>;
}

const getDefaultSchema = (): LLMOpsDBSchema => ({
  configs: {
    modelName: 'configs',
    fields: {
      id: {
        type: 'string',
        required: true,
        unique: true,
        defaultValue: 'uuid()',
      },
      createdAt: {
        type: 'date',
        required: true,
        defaultValue: 'now()',
      },
      updatedAt: {
        type: 'date',
        required: true,
        defaultValue: 'now()',
      },
    },
    order: 1,
  },
  variants: {
    modelName: 'variants',
    fields: {
      id: {
        type: 'string',
        required: true,
        unique: true,
        defaultValue: 'uuid()',
      },
      provider: {
        type: 'string',
        required: true,
      },
      modelName: {
        type: 'string',
        required: true,
      },
      jsonData: {
        type: 'json',
        required: true,
      },
      createdAt: {
        type: 'date',
        required: true,
        defaultValue: 'now()',
      },
      updatedAt: {
        type: 'date',
        required: true,
        defaultValue: 'now()',
      },
    },
    order: 2,
  },
  environments: {
    modelName: 'environments',
    fields: {
      id: {
        type: 'string',
        required: true,
        unique: true,
        defaultValue: 'uuid()',
      },
      name: {
        type: 'string',
        required: true,
      },
      slug: {
        type: 'string',
        required: true,
        unique: true,
      },
      createdAt: {
        type: 'date',
        required: true,
        defaultValue: 'now()',
      },
      updatedAt: {
        type: 'date',
        required: true,
        defaultValue: 'now()',
      },
    },
    order: 3,
  },
  environment_secrets: {
    modelName: 'environment_secrets',
    fields: {
      id: {
        type: 'string',
        required: true,
        unique: true,
        defaultValue: 'uuid()',
      },
      environmentId: {
        type: 'string',
        required: true,
        references: {
          model: 'environments',
          field: 'id',
        },
      },
      keyName: {
        type: 'string',
        required: true,
      },
      keyValue: {
        type: 'string',
        required: true,
      },
      createdAt: {
        type: 'date',
        required: true,
        defaultValue: 'now()',
      },
      updatedAt: {
        type: 'date',
        required: true,
        defaultValue: 'now()',
      },
    },
    order: 4,
  },
  config_variants: {
    modelName: 'config_variants',
    fields: {
      id: {
        type: 'string',
        required: true,
        unique: true,
        defaultValue: 'uuid()',
      },
      configId: {
        type: 'string',
        required: true,
        references: {
          model: 'configs',
          field: 'id',
        },
      },
      variantId: {
        type: 'string',
        required: true,
        references: {
          model: 'variants',
          field: 'id',
        },
      },
      createdAt: {
        type: 'date',
        required: true,
        defaultValue: 'now()',
      },
      updatedAt: {
        type: 'date',
        required: true,
        defaultValue: 'now()',
      },
    },
    order: 5,
  },
  environment_config_variants: {
    modelName: 'environment_config_variants',
    fields: {
      id: {
        type: 'string',
        required: true,
        unique: true,
        defaultValue: 'uuid()',
      },
      environmentId: {
        type: 'string',
        required: true,
        references: {
          model: 'environments',
          field: 'id',
        },
      },
      configVariantId: {
        type: 'string',
        required: true,
        references: {
          model: 'config_variants',
          field: 'id',
        },
      },
      createdAt: {
        type: 'date',
        required: true,
        defaultValue: 'now()',
      },
      updatedAt: {
        type: 'date',
        required: true,
        defaultValue: 'now()',
      },
    },
    order: 6,
  },
});

export const getLLMOpsTables = (options: LLMOpsOptions = {}): LLMOpsDBSchema => {
  const defaultSchema = getDefaultSchema();

  // Apply custom fields if provided
  if (options.database?.customFields) {
    Object.entries(options.database.customFields).forEach(([tableName, customFields]) => {
      if (defaultSchema[tableName]) {
        defaultSchema[tableName].fields = {
          ...defaultSchema[tableName].fields,
          ...customFields,
        };
      }
    });
  }

  // Apply plugin schemas
  const pluginSchema = (options.plugins ?? []).reduce(
    (acc, plugin) => {
      if (plugin.schema) {
        return { ...acc, ...plugin.schema };
      }
      return acc;
    },
    {} as LLMOpsDBSchema
  );

  return {
    ...defaultSchema,
    ...pluginSchema,
  };
};

export const getDBModels = getLLMOpsTables;
