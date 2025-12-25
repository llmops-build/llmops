import { hc } from '@client/lib/hc';
import { useQuery } from '@tanstack/react-query';

export const getQueryKey = (configId: string) => ['config-variants', configId];

export const useConfigVariants = (configId: string) => {
  return useQuery({
    queryKey: getQueryKey(configId),
    queryFn: async () => {
      const response = await hc.v1.configs[':configId'].variants.$get({
        param: { configId },
      });
      const result = await response.json();
      return ('data' in result ? result.data : []) as {
        id: string;
        name: string;
        configId: string;
        variantId: string;
        createdAt: string;
        updatedAt: string;
        provider: string | null;
        modelName: string | null;
        jsonData: Record<string, any> | null;
        latestVersion: {
          version: number;
        } | null;
      }[];
    },
    enabled: !!configId,
  });
};
