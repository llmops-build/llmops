/**
 * Provider ID mapping between models.dev and Portkey gateway.
 *
 * models.dev uses different provider IDs than Portkey for some providers.
 * This mapping allows converting from models.dev IDs to Portkey gateway IDs.
 *
 * Key: models.dev provider ID
 * Value: Portkey gateway provider ID
 */
export const MODELS_DEV_TO_PORTKEY_PROVIDER_MAP: Record<string, string> = {
  'azure-cognitive-services': 'azure-ai',
  azure: 'azure-openai',
};

/**
 * Reverse mapping from Portkey to models.dev
 */
export const PORTKEY_TO_MODELS_DEV_PROVIDER_MAP: Record<string, string> =
  Object.fromEntries(
    Object.entries(MODELS_DEV_TO_PORTKEY_PROVIDER_MAP).map(([k, v]) => [v, k])
  );

/**
 * Get the Portkey gateway provider ID for a given models.dev provider ID.
 * Returns the original ID if no mapping exists.
 *
 * @param modelsDevProviderId - The provider ID from models.dev
 * @returns The corresponding Portkey gateway provider ID
 */
export function getPortkeyProviderId(modelsDevProviderId: string): string {
  return (
    MODELS_DEV_TO_PORTKEY_PROVIDER_MAP[modelsDevProviderId] ??
    modelsDevProviderId
  );
}

/**
 * Get the models.dev provider ID for a given Portkey gateway provider ID.
 * Returns the original ID if no mapping exists.
 *
 * @param portkeyProviderId - The provider ID from Portkey gateway
 * @returns The corresponding models.dev provider ID
 */
export function getModelsDevProviderId(portkeyProviderId: string): string {
  return (
    PORTKEY_TO_MODELS_DEV_PROVIDER_MAP[portkeyProviderId] ?? portkeyProviderId
  );
}
