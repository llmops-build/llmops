import { hc } from '@client/lib/hc';
import { queryOptions, useQuery } from '@tanstack/react-query';

export type ProviderConfig = {
  id: string;
  providerId: string;
  name: string | null;
  config: Record<string, unknown>;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
};

export const getProviderConfigsQueryKey = () => ['provider-configs'];

export const providerConfigsQueryOptions = () =>
  queryOptions({
    queryKey: getProviderConfigsQueryKey(),
    queryFn: async () => {
      const response = await hc.v1.providers.configs.$get();
      const result = await response.json();
      return ('data' in result ? result.data : []) as ProviderConfig[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

export const useProviderConfigs = () => {
  return useQuery(providerConfigsQueryOptions());
};

// Alias for backwards compatibility
export const useAllProviderConfigs = useProviderConfigs;
