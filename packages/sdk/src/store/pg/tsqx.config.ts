import { defineConfig } from '@tsqx/kit';
import { pgDialect } from '@tsqx/kit/postgres/pg';

export default defineConfig({
  dialect: pgDialect(),
  schema: './schema',
  migrations: './migrations',
});
