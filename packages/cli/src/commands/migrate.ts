import { command, string } from '@drizzle-team/brocli';
import { logger } from '@llmops/core';
import { existsSync } from 'node:fs';
import yoctoSpinner from 'yocto-spinner';
import prompts from 'prompts';
import { getConfig } from '../lib/get-config';

export const migrateCommand = command({
  name: 'migrate',
  desc: 'Run database migrations based on LLMOps configuration',
  options: {
    cwd: string()
      .default(process.cwd())
      .desc('Current working directory')
      .alias('d'),
    config: string()
      .required()
      .desc('Path to the LLMOps config file')
      .alias('c'),
    yes: string().desc('Automatic yes to prompts').alias('y'),
  },
  handler: async (opts) => {
    const cwd = opts.cwd;
    const configPath = opts.config;

    if (!existsSync(cwd)) {
      logger.error(`The specified directory does not exist: ${cwd}`);
      process.exit(1);
    }

    if (configPath && !existsSync(configPath)) {
      logger.error(`The specified config file does not exist: ${configPath}`);
      process.exit(1);
    }

    const config = await getConfig({
      configPath: configPath,
      cwd,
    });

    if (!config) {
      logger.error('No valid LLMOps configuration found.');
      process.exit(1);
    }

    const telemetry = config.telemetry;
    const store = Array.isArray(telemetry) ? telemetry[0] : telemetry;

    if (!store || !store._pool) {
      logger.error(
        'No telemetry store with database found. Configure pgStore in your config.',
      );
      process.exit(1);
    }

    let migrate = opts.yes;
    if (!opts.yes) {
      const response = await prompts({
        type: 'confirm',
        name: 'migrate',
        message: 'Do you want to run pending migrations?',
        initial: false,
      });
      migrate = response.migrate;
    }

    if (!migrate) {
      console.log('Migration cancelled.');
      process.exit(0);
    }

    const spinner = yoctoSpinner({ text: 'running migrations...' }).start();

    try {
      const { runMigrations } = await import('@llmops/sdk/store/pg');
      const { applied } = await runMigrations(
        store._pool as import('pg').Pool,
        store._schema ?? 'llmops',
      );

      spinner.stop();

      if (applied.length === 0) {
        console.log('🚀 No pending migrations.');
      } else {
        console.log(
          `✅ Applied ${applied.length} migration(s): ${applied.join(', ')}`,
        );
      }
    } catch (error) {
      spinner.stop();
      logger.error(`Migration failed: ${error}`);
      process.exit(1);
    }

    process.exit(0);
  },
});
