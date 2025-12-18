import { hc } from '@client/lib/hc';
import { useQuery } from '@tanstack/react-query';

type ModelProviderInfo = {
  id: string;
  name: string;
};

type ModelInfo = {
  id: string;
  name: string;
  provider?: ModelProviderInfo;
  pricing?: {
    prompt?: string;
    completion?: string;
    request?: string;
    image?: string;
  };
};

export const useProviderModels = (providerId: string | null | undefined) => {
  const isEnabled = Boolean(providerId && providerId.length > 0);
  return useQuery({
    queryKey: ['provider-models', providerId],
    queryFn: async () => {
      if (!providerId) return [] as ModelInfo[];
      const response = await hc.v1.providers[':providerId'].models.$get({
        param: { providerId },
      });
      const json = await response.json();
      if ('data' in json && json.data) {
        return json.data as ModelInfo[];
      }
      return [] as ModelInfo[];
    },
    enabled: isEnabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
