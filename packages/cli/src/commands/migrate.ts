import { command, string } from '@drizzle-team/brocli';
import { logger } from '@llmops/core';
import {
  createDatabaseFromConnection,
  detectDatabaseType,
} from '@llmops/core/db';
import { existsSync } from 'node:fs';
import yoctoSpinner from 'yocto-spinner';
import chalk from 'chalk';
import prompts from 'prompts';
import { getConfig } from '../lib/get-config';
import { getMigrations } from '../lib/get-migration';

/**
 * @fileoverview This file defines the 'migrate' command for the CLI application.
 * Steps:
 * 1. Look for package.json and @llmops/sdk in the current directory.
 * 2. Check if the @llmops/sdk version works with the current CLI version.
 * 3. If compatible, check for the config file passed as an argument.
 * 4. If the config file exists, read and parse it.
 * 5. If not passed, look for default config file locations.
 * 6. Use zod to validate the existing configuration schema.
 * 7. If valid, get the db adapter from the config.
 */
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

    if (!config.database) {
      logger.error('No database configuration found.');
      process.exit(1);
    }

    // Create database connection
    const db = await createDatabaseFromConnection(config.database);
    if (!db) {
      logger.error('Failed to create database connection.');
      process.exit(1);
    }

    const dbType = detectDatabaseType(config.database);
    if (!dbType) {
      logger.error('Could not detect database type.');
      process.exit(1);
    }

    const spinner = yoctoSpinner({ text: 'preparing migration...' }).start();
    const { toBeAdded, toBeCreated, runMigrations } = await getMigrations(
      db,
      dbType
    );

    if (!toBeAdded.length && !toBeCreated.length) {
      spinner.stop();
      console.log('🚀 No migrations needed.');
      process.exit(0);
    }

    spinner.stop();
    console.log(`🔑 The migration will affect the following:`);

    for (const table of [...toBeCreated, ...toBeAdded]) {
      console.log(
        '->',
        chalk.magenta(Object.keys(table.fields).join(', ')),
        chalk.white('fields on'),
        chalk.yellow(`${table.table}`),
        chalk.white('table.')
      );
    }

    let migrate = opts.yes;
    if (!opts.yes) {
      const response = await prompts({
        type: 'confirm',
        name: 'migrate',
        message: 'Do you want to proceed with the migration?',
        initial: false,
      });
      migrate = response.migrate;
    }

    if (!migrate) {
      console.log('Migration cancelled.');
      process.exit(0);
    }
    spinner.start('migrating...');
    await runMigrations();
    spinner.stop();
    console.log('✅ Migration completed successfully.');

    process.exit(0);
  },
});
