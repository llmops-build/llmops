import type { LLMOpsConfig } from '@llmops/core';
import { loadConfig } from 'c12';
import { existsSync } from 'node:fs';
import path from 'node:path';

export const getConfig = async ({
  cwd,
  configPath,
}: {
  cwd: string;
  configPath: string;
}) => {
  if (configPath) {
    let resolvedPath = path.join(cwd, configPath);
    if (existsSync(configPath)) resolvedPath = configPath;

    const { config: loadedConfig } = await loadConfig<{
      config: LLMOpsConfig;
    }>({
      configFile: resolvedPath,
    });
    const config = loadedConfig.config;

    return config;
  }
};
