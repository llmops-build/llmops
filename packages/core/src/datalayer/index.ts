import type { LLMOpsConfig } from '@/types';
import { createKyselyAdapter, kyselyAdapter } from '../adapters/kysely-adapter';

export const createDataLayer = async (config: LLMOpsConfig) => {
  const { kysely, databaseType, transaction } =
    await createKyselyAdapter(config);
  const adapter = kyselyAdapter(kysely, {
    type: databaseType,
    transaction,
  })(config);

  adapter.count({
    model: 'configs',
  });

  return {};
};
