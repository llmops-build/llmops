import { jsonb, pgEnum, pgTable, text, uuid } from 'drizzle-orm/pg-core';
import { SupportedProviders } from '@/providers';

export const providerEnums = pgEnum('provider', [
  SupportedProviders.OPENROUTER,
]);

export const configs = pgTable('configs', {
  id: uuid('id').primaryKey().defaultRandom(),
});

export const variants = pgTable('variants', {
  id: uuid('id').primaryKey().defaultRandom(),
  provider: providerEnums('provider').notNull(),
  modelName: text('model_name').notNull(),
  jsonData: jsonb('json_data').notNull(),
});

export const environments = pgTable('environments', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
});

export const environmentSecrets = pgTable('environment_secrets', {
  id: uuid('id').primaryKey().defaultRandom(),
  environmentId: uuid('environment_id')
    .notNull()
    .references(() => environments.id, { onDelete: 'cascade' }),
  keyName: text('key_name').notNull(),
  keyValue: text('key_value').notNull(),
});

export const configVariants = pgTable('config_variants', {
  id: uuid('id').primaryKey().defaultRandom(),
  configId: uuid('config_id')
    .notNull()
    .references(() => configs.id, { onDelete: 'cascade' }),
  variantId: uuid('variant_id')
    .notNull()
    .references(() => variants.id, { onDelete: 'cascade' }),
});

/**
 * @todo add config draft column
 */

export const environmentConfigVariants = pgTable(
  'environment_config_variants',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    environmentId: uuid('environment_id')
      .notNull()
      .references(() => environments.id, { onDelete: 'cascade' }),
    configVariantId: uuid('config_variant_id')
      .notNull()
      .references(() => configVariants.id, { onDelete: 'cascade' }),
  }
);
