import type { LLMOpsConfig } from '@/types';
import type { BetterAuthDBSchema, DBFieldAttribute } from './type';

export interface BetterAuthLLMOpsOptions {
  database?: {
    customFields?: Record<string, Record<string, DBFieldAttribute>>;
    tablePrefix?: string;
  };
  plugins?: Array<{
    id: string;
    schema?: BetterAuthDBSchema;
  }>;
}

const getDefaultSchema = (): BetterAuthDBSchema => ({
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

export const getTables = (
  config: LLMOpsConfig,
  options: BetterAuthLLMOpsOptions = {}
): BetterAuthDBSchema => {
  const defaultSchema = getDefaultSchema();

  // Apply custom fields if provided
  if (options.database?.customFields) {
    Object.entries(options.database.customFields).forEach(
      ([tableName, customFields]) => {
        if (defaultSchema[tableName]) {
          defaultSchema[tableName].fields = {
            ...defaultSchema[tableName].fields,
            ...customFields,
          };
        }
      }
    );
  }

  // Apply plugin schemas
  const pluginSchema = (options.plugins ?? []).reduce((acc, plugin) => {
    if (plugin.schema) {
      return { ...acc, ...plugin.schema };
    }
    return acc;
  }, {} as BetterAuthDBSchema);

  return {
    ...defaultSchema,
    ...pluginSchema,
  };
};
