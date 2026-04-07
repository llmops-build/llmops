import type { LLMOpsConfig } from '@llmops/core';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

type ConfigModule = {
  config?: LLMOpsConfig;
  default?: LLMOpsConfig | { config?: LLMOpsConfig };
};

export const getConfig = async ({
  cwd,
  configPath,
}: {
  cwd: string;
  configPath: string;
}): Promise<LLMOpsConfig | undefined> => {
  if (!configPath) return undefined;

  const resolvedPath = existsSync(configPath)
    ? path.resolve(configPath)
    : path.resolve(cwd, configPath);

  if (!existsSync(resolvedPath)) {
    throw new Error(`Config file not found: ${resolvedPath}`);
  }

  const mod = (await import(
    pathToFileURL(resolvedPath).href
  )) as ConfigModule;

  // Support several common shapes:
  //   export const config = llmops({...})
  //   export default llmops({...})
  //   export default { config: llmops({...}) }
  if (mod.config) return mod.config;
  if (mod.default) {
    if (
      typeof mod.default === 'object' &&
      mod.default !== null &&
      'config' in mod.default &&
      mod.default.config
    ) {
      return mod.default.config;
    }
    return mod.default as LLMOpsConfig;
  }

  return undefined;
};
