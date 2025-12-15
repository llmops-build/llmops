/**
 * @fileoverview This file defines the 'generate' command for the CLI application.
 * Steps:
 * 1. Look for package.json and @llmops/sdk in the current directory.
 * 2. Check if the @llmops/sdk version works with the current CLI version.
 * 3. If compatible, check for the config file passed as an argument.
 * 4. If the config file exists, read and parse it.
 * 5. If not passed, look for default config file locations.
 * 6. Use zod to validate the existing configuration schema.
 * 7. If valid, get the db adapter from the config.
 */

import { command, string, boolean } from '@drizzle-team/brocli';
import { getAdapter } from 'better-auth/db';
import { existsSync } from 'node:fs';
import { logger } from '@llmops/core';
import { getConfig } from '../lib/get-config';
import { generateSchema } from '../generators';

export const generateCommand = command({
  name: 'generate',
  desc: 'Generate database migrations and schemas based on LLMOps configuration',
  options: {
    cwd: string()
      .default(process.cwd())
      .desc('Current working directory')
      .alias('d'),
    config: string()
      .required()
      .desc('Path to the LLMOps config file')
      .alias('c'),
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

    const adapter = await getAdapter(config.database).catch((err) => {
      logger.error('Failed to initialize database adapter from configuration.');
      process.exit(1);
    });

    const schema = await generateSchema({
      adapter,
      options: config,
    });

    console.log('Generated Schema:', schema);

    // Further steps to generate migrations and schemas would go here.

    // const cliVersion = '0.0.1'; // This should match the version in package.json

    try {
      // Step 1: Look for package.json and @llmops/sdk
      // const packageInfo = await findPackageJson(cwd);
      // if (!packageInfo) {
      //   throw new Error('No package.json found in current directory');
      // }
      // // Step 2: Check if @llmops/sdk exists
      // const sdkVersion = hasLLMOpsSDK(packageInfo.content);
      // if (!sdkVersion) {
      //   throw new Error(
      //     '@llmops/sdk not found in dependencies. Please install it first.'
      //   );
      // }
      // // Step 3: Check version compatibility
      // if (!isVersionCompatible(sdkVersion, cliVersion)) {
      //   const message = `Version mismatch: @llmops/sdk ${sdkVersion} may not be compatible with CLI ${cliVersion}`;
      //   if (!opts.force) {
      //     throw new Error(`${message}. Use --force to proceed anyway.`);
      //   } else {
      //     console.warn(`Warning: ${message}. Proceeding due to --force flag.`);
      //   }
      // }
      // Step 4-5: Find config file
      // const adapter = await getAdapter(opts.config)
    } catch (error) {
      process.exit(1);
    }
  },
});
