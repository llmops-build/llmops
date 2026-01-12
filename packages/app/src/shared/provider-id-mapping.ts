/**
 * Provider ID mapping between models.dev and internal gateway IDs.
 *
 * models.dev uses different provider IDs than the internal gateway for some providers.
 * This mapping allows converting from models.dev IDs to internal gateway IDs.
 *
 * This file is browser-safe and can be used in both client and server code.
 *
 * Key: models.dev provider ID
 * Value: Internal gateway provider ID
 */
export const MODELS_DEV_TO_INTERNAL_PROVIDER_MAP: Record<string, string> = {
  'azure-cognitive-services': 'azure-ai',
  azure: 'azure-openai',
};

/**
 * Reverse mapping from internal to models.dev
 */
export const INTERNAL_TO_MODELS_DEV_PROVIDER_MAP: Record<string, string> =
  Object.fromEntries(
    Object.entries(MODELS_DEV_TO_INTERNAL_PROVIDER_MAP).map(([k, v]) => [v, k])
  );

/**
 * Get the internal gateway provider ID for a given models.dev provider ID.
 * Returns the original ID if no mapping exists.
 *
 * @param modelsDevProviderId - The provider ID from models.dev
 * @returns The corresponding internal gateway provider ID
 */
export function getInternalProviderId(modelsDevProviderId: string): string {
  return (
    MODELS_DEV_TO_INTERNAL_PROVIDER_MAP[modelsDevProviderId] ??
    modelsDevProviderId
  );
}

/**
 * Get the models.dev provider ID for a given internal gateway provider ID.
 * Returns the original ID if no mapping exists.
 *
 * @param internalProviderId - The internal provider ID
 * @returns The corresponding models.dev provider ID
 */
export function getModelsDevProviderId(internalProviderId: string): string {
  return (
    INTERNAL_TO_MODELS_DEV_PROVIDER_MAP[internalProviderId] ??
    internalProviderId
  );
}
