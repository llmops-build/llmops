import { defineConfig } from '@tsqx/kit';
import { d1Dialect } from '@tsqx/kit/sqlite/d1';

export default defineConfig({
  dialect: d1Dialect(),
  schema: './schema',
  migrations: './migrations',
});
