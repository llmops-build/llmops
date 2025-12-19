import { hc } from '@client/lib/hc';
import { useQuery } from '@tanstack/react-query';

export const getQueryKey = (configId: string) => ['targeting-rules', configId];

export const useTargetingRules = (configId: string) => {
  return useQuery({
    queryKey: getQueryKey(configId),
    queryFn: async () => {
      const response = await hc.v1.targeting.config[':configId'].$get({
        param: { configId },
      });
      const result = await response.json();
      return ('data' in result ? result.data : []) as {
        id: string;
        environmentId: string;
        configId: string;
        configVariantId: string;
        weight: number;
        priority: number;
        enabled: boolean;
        conditions: Record<string, unknown> | null;
        createdAt: string;
        updatedAt: string;
        environmentName: string | null;
        environmentSlug: string | null;
        variantName: string | null;
        variantProvider: string | null;
        variantModelName: string | null;
      }[];
    },
    enabled: !!configId,
  });
};
