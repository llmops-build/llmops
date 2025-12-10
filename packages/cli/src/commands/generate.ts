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
import { existsSync, readFileSync } from 'fs';
import { join, resolve } from 'path';
import { validateLLMOpsConfig } from '@llmops/core';

interface PackageJson {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  version?: string;
}

const DEFAULT_CONFIG_FILES = ['llmops.config.js', 'llmops.config.ts'];

async function findPackageJson(
  cwd: string
): Promise<{ path: string; content: PackageJson } | null> {
  const packagePath = join(cwd, 'package.json');

  if (!existsSync(packagePath)) {
    return null;
  }

  try {
    const content = JSON.parse(
      readFileSync(packagePath, 'utf-8')
    ) as PackageJson;
    return { path: packagePath, content };
  } catch (error) {
    throw new Error(
      `Failed to parse package.json: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

function hasLLMOpsSDK(packageJson: PackageJson): string | null {
  const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
  return deps['@llmops/sdk'] || null;
}

function isVersionCompatible(sdkVersion: string, cliVersion: string): boolean {
  const cleanSdkVersion = sdkVersion.replace(/^[\^~]/, '');
  const cleanCliVersion = cliVersion.replace(/^[\^~]/, '');

  const [sdkMajor] = cleanSdkVersion.split('.').map(Number);
  const [cliMajor] = cleanCliVersion.split('.').map(Number);

  return sdkMajor === cliMajor;
}

function findConfigFile(
  configPath: string | undefined,
  cwd: string
): string | null {
  if (configPath) {
    const resolvedPath = resolve(cwd, configPath);
    return existsSync(resolvedPath) ? resolvedPath : null;
  }

  for (const defaultFile of DEFAULT_CONFIG_FILES) {
    const path = join(cwd, defaultFile);
    if (existsSync(path)) {
      return path;
    }
  }

  return null;
}

async function loadAndValidateConfig(configPath: string): Promise<any> {
  try {
    let config: any;

    if (configPath.endsWith('.json')) {
      const content = readFileSync(configPath, 'utf-8');
      config = JSON.parse(content);
    } else {
      const module = await import(`file://${configPath}`);
      config = module.default || module;
    }

    return validateLLMOpsConfig(config);
  } catch (error) {
    throw new Error(
      `Failed to load or validate config: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export const generateCommand = command({
  name: 'generate',
  desc: 'Generate database migrations and schemas based on LLMOps configuration',
  options: {
    config: string().desc('Path to the LLMOps config file').alias('c'),
    force: boolean()
      .default(false)
      .desc('Force generation even with warnings')
      .alias('f'),
  },
  handler: async (opts) => {
    const cwd = process.cwd();
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
      const configPath = findConfigFile(opts.config, cwd);

      if (!configPath) {
        const searchPaths = opts.config
          ? [`Specified path: ${opts.config}`]
          : DEFAULT_CONFIG_FILES.map((f) => `  ${f}`);

        throw new Error(
          `Config file not found. Searched:\n${searchPaths.join('\n')}`
        );
      }

      // Step 6: Load and validate config
      const config = await loadAndValidateConfig(configPath);

      // Step 7: Get database adapter
      const dbAdapter = config.database;

      if (!dbAdapter) {
        throw new Error('No database configuration found in config file');
      }

      console.log('✅ Configuration validated successfully');
      console.log(`📁 Config loaded from: ${configPath}`);

      // console.log(`📦 SDK Version: ${sdkVersion}`);

      // TODO: Implement actual generation logic here
      // console.log('\n🚧 Generation logic not yet implemented');
    } catch (error) {
      console.error('❌ Generate command failed:');
      console.error(
        error instanceof Error ? error.message : 'Unknown error occurred'
      );
      process.exit(1);
    }
  },
});
