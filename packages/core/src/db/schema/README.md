# Zod-Based Database Schema

This directory contains Zod schemas that serve as the single source of truth for database table definitions.

## Overview

The schema system uses Zod to define table structures, which are then converted to the internal `LLMOpsDBSchema` format used by database adapters. This approach provides:

- **Type Safety**: TypeScript types are automatically inferred from Zod schemas
- **Runtime Validation**: Validate data against schemas before database operations
- **Single Source of Truth**: Define tables once in Zod, use everywhere
- **Extensibility**: Easy to extend with custom fields and plugin schemas

## File Structure

```
schema/
├── index.ts                  # Zod schema definitions and metadata
├── zod-to-db-schema.ts       # Conversion utilities
└── README.md                 # This file
```

## Basic Usage

### 1. Defining a Table Schema

In `schema/index.ts`:

```typescript
import { z } from 'zod';

// Define your Zod schema
export const usersSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Add to tableSchemas map
export const tableSchemas = {
  users: usersSchema,
  // ... other tables
} as const;
```

### 2. Adding Table Metadata

Metadata provides additional database-specific configuration:

```typescript
import { fieldMeta } from './zod-to-db-schema';

export const tableMetadata: Record<string, TableMetadata> = {
  users: {
    modelName: 'users',
    order: 1,
    fields: {
      email: fieldMeta.unique(),
      createdAt: fieldMeta.timestamp('createdAt'),
      updatedAt: fieldMeta.timestamp('updatedAt'),
    },
  },
};
```

### 3. Using Inferred Types

```typescript
import type { TableRecord } from './schema';

// Get the TypeScript type for a table
type User = TableRecord<'users'>;

// Or use the exported type directly
import type { Configs, Variants } from './schema';

function createConfig(data: Configs) {
  // data is fully typed
}
```

### 4. Validating Data

```typescript
import { tableSchemas } from './schema';

const userData = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  email: 'user@example.com',
  name: 'John Doe',
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Validate at runtime
const result = tableSchemas.users.safeParse(userData);
if (result.success) {
  console.log('Valid user data:', result.data);
} else {
  console.error('Validation errors:', result.error);
}
```

## Advanced Usage

### Adding Foreign Key References

```typescript
export const postsSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  title: z.string(),
  content: z.string(),
  createdAt: z.date(),
});

export const tableMetadata = {
  posts: {
    modelName: 'posts',
    fields: {
      userId: fieldMeta.reference('users', 'id', 'cascade'),
      createdAt: fieldMeta.timestamp('createdAt'),
    },
  },
};
```

### Adding Indexes

```typescript
export const tableMetadata = {
  posts: {
    modelName: 'posts',
    fields: {
      userId: {
        ...fieldMeta.reference('users'),
        ...fieldMeta.indexed(),
      },
    },
  },
};
```

### Custom Field Metadata

```typescript
import type { FieldMetadata } from './zod-to-db-schema';

const customFieldMeta: FieldMetadata = {
  defaultValue: () => new Date(),
  unique: true,
  index: true,
  sortable: true,
};
```

### Extending with Custom Fields

When using `getTables()`, you can add custom fields:

```typescript
import { getTables } from '../get-tables';

const schema = getTables(config, {
  database: {
    customFields: {
      users: {
        avatar: {
          type: 'string',
          required: false,
        },
        role: {
          type: ['admin', 'user', 'guest'],
          required: true,
          defaultValue: 'user',
        },
      },
    },
  },
});
```

### Plugin Schemas

Plugins can provide their own schemas:

```typescript
const schema = getTables(config, {
  plugins: [
    {
      id: 'my-plugin',
      schema: {
        plugin_data: {
          modelName: 'plugin_data',
          fields: {
            key: { type: 'string', required: true },
            value: { type: 'json', required: true },
          },
        },
      },
    },
  ],
});
```

## Field Metadata Helpers

The `fieldMeta` helper provides common patterns:

### Timestamps

```typescript
fieldMeta.timestamp('createdAt')  // Auto-set on creation
fieldMeta.timestamp('updatedAt')  // Auto-update on changes
```

### References

```typescript
fieldMeta.reference('tableName')              // Default: id, cascade
fieldMeta.reference('tableName', 'fieldName') // Custom field
fieldMeta.reference('tableName', 'id', 'set null') // Custom onDelete
```

### Constraints

```typescript
fieldMeta.unique()    // Add unique constraint
fieldMeta.indexed()   // Add index
```

## Type Mapping

Zod types are automatically mapped to database field types:

| Zod Type | DB Field Type |
|----------|---------------|
| `z.string()` | `'string'` |
| `z.number()` | `'number'` |
| `z.boolean()` | `'boolean'` |
| `z.date()` | `'date'` |
| `z.record()` / `z.object()` | `'json'` |
| `z.array(z.string())` | `'string[]'` |
| `z.array(z.number())` | `'number[]'` |
| `z.enum(['a', 'b'])` | `['a', 'b']` |

## Benefits

1. **Reduced Duplication**: Define schema once, use for validation, types, and DB
2. **Type Safety**: Full TypeScript support with inferred types
3. **Validation**: Runtime validation before database operations
4. **Maintainability**: Single place to update schema definitions
5. **Extensibility**: Easy to extend with custom fields and plugins

## Migration from Old System

The old system manually defined `LLMOpsDBSchema` objects. Now:

**Before:**
```typescript
const schema: LLMOpsDBSchema = {
  users: {
    modelName: 'users',
    fields: {
      id: { type: 'string', required: true },
      email: { type: 'string', required: true, unique: true },
      // ...
    },
  },
};
```

**After:**
```typescript
// In schema/index.ts
export const usersSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
});

export const tableMetadata = {
  users: {
    modelName: 'users',
    fields: {
      email: fieldMeta.unique(),
    },
  },
};

// Automatically converted in getTables()
```
