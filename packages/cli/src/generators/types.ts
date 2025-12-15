import type { DBAdapter } from '@better-auth/core/db/adapter';
import { LLMOpsConfig } from '@llmops/core';

export interface SchemaGenerator {
  <Options extends LLMOpsConfig>(opts: {
    file?: string;
    adapter: DBAdapter;
    options: Options;
  }): Promise<{
    code?: string;
    fileName: string;
    overwrite?: boolean;
    append?: boolean;
  }>;
}
