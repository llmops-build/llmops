import { useQuery } from '@tanstack/react-query';
import { useProviderConfigs } from './useProviderConfigs';
import { useProvidersList } from './useProvidersList';

export type ConfiguredProvider = {
  id: string;
  name: string;
  slug: string | null;
  customName: string | null;
  logo: string;
  configId: string;
  enabled: boolean;
};

/**
 * Returns the list of providers that have been configured in the dashboard.
 * This combines provider configs with provider info from models.dev.
 */
export const useConfiguredProviders = () => {
  const { data: providerConfigs, isLoading: configsLoading } =
    useProviderConfigs();
  const { data: providersList, isLoading: providersLoading } =
    useProvidersList();

  return useQuery({
    queryKey: [
      'configured-providers',
      providerConfigs?.map((c) => c.id),
      providersList?.length,
    ],
    queryFn: () => {
      if (!providerConfigs || !providersList) {
        return [];
      }

      // Map configured providers with their info
      const configured: ConfiguredProvider[] = [];

      for (const config of providerConfigs) {
        if (!config.enabled) continue;

        const providerInfo = providersList.find(
          (p) => p.id === config.providerId
        );

        if (providerInfo) {
          configured.push({
            id: providerInfo.id,
            name: providerInfo.name,
            slug: config.slug,
            customName: config.name,
            logo: providerInfo.logo,
            configId: config.id,
            enabled: config.enabled,
          });
        } else {
          // Provider not found in models.dev, use providerId as fallback
          configured.push({
            id: config.providerId,
            name:
              config.providerId.charAt(0).toUpperCase() +
              config.providerId.slice(1),
            slug: config.slug,
            customName: config.name,
            logo: `https://models.dev/logos/${config.providerId}.svg`,
            configId: config.id,
            enabled: config.enabled,
          });
        }
      }

      return configured;
    },
    enabled: !configsLoading && !providersLoading,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};
