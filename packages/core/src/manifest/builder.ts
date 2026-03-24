import type { Kysely } from 'kysely';
import type { Database } from '../db/schema';
import { logger } from '../utils/logger';
import type {
  GatewayManifest,
  ManifestGuardrail,
  ManifestProviderGuardrailOverride,
} from './types';

/**
 * Builds the gateway manifest from database
 */
export class ManifestBuilder {
  constructor(private db: Kysely<Database>) {}

  /**
   * Build the manifest from database
   */
  async build(): Promise<GatewayManifest> {
    const [guardrailConfigs, providerGuardrailOverridesData] =
      await Promise.all([
        this.db
          .selectFrom('guardrail_configs')
          .where('enabled', '=', true)
          .selectAll()
          .execute(),
        this.db
          .selectFrom('provider_guardrail_overrides')
          .selectAll()
          .execute(),
      ]);

    // Build guardrails grouped by hook type, sorted by priority (desc)
    const beforeRequestGuardrails: ManifestGuardrail[] = [];
    const afterRequestGuardrails: ManifestGuardrail[] = [];

    logger.info(
      `[ManifestBuilder] Found ${guardrailConfigs.length} enabled guardrail configs`
    );

    for (const guardrail of guardrailConfigs) {
      const parameters =
        typeof guardrail.parameters === 'string'
          ? JSON.parse(guardrail.parameters)
          : guardrail.parameters;

      const manifestGuardrail: ManifestGuardrail = {
        id: guardrail.id,
        name: guardrail.name,
        pluginId: guardrail.pluginId,
        functionId: guardrail.functionId,
        hookType: guardrail.hookType as
          | 'beforeRequestHook'
          | 'afterRequestHook',
        parameters: parameters ?? {},
        priority: guardrail.priority,
        onFail: guardrail.onFail as 'block' | 'log',
      };

      if (guardrail.hookType === 'beforeRequestHook') {
        beforeRequestGuardrails.push(manifestGuardrail);
      } else {
        afterRequestGuardrails.push(manifestGuardrail);
      }
    }

    // Sort guardrails by priority (desc)
    beforeRequestGuardrails.sort((a, b) => b.priority - a.priority);
    afterRequestGuardrails.sort((a, b) => b.priority - a.priority);

    // Build provider guardrail overrides keyed by providerConfigId
    const providerGuardrailOverrides: Record<
      string,
      ManifestProviderGuardrailOverride[]
    > = {};

    for (const override of providerGuardrailOverridesData) {
      const parameters =
        typeof override.parameters === 'string'
          ? JSON.parse(override.parameters)
          : override.parameters;

      const manifestOverride: ManifestProviderGuardrailOverride = {
        id: override.id,
        providerConfigId: override.providerConfigId,
        guardrailConfigId: override.guardrailConfigId,
        enabled: override.enabled,
        parameters: parameters ?? null,
      };

      if (!providerGuardrailOverrides[override.providerConfigId]) {
        providerGuardrailOverrides[override.providerConfigId] = [];
      }
      providerGuardrailOverrides[override.providerConfigId].push(
        manifestOverride
      );
    }

    return {
      version: Date.now(),
      builtAt: new Date().toISOString(),
      guardrails: {
        beforeRequestHook: beforeRequestGuardrails,
        afterRequestHook: afterRequestGuardrails,
      },
      providerGuardrailOverrides,
    };
  }
}
