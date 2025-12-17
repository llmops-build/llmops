import { hc } from '@client/lib/hc';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKey } from '../queries/useVariantList';
import { getQueryKey as getConfigVariantsQueryKey } from '../queries/useConfigVariants';

type VariantResult = {
  variant: {
    id: string;
    name: string;
    provider: string;
    modelName: string;
    jsonData: string;
    createdAt: string;
    updatedAt: string;
  };
  configVariant: {
    id: string;
    configId: string;
    variantId: string;
    createdAt: string;
    updatedAt: string;
  };
};

export const useCreateVariant = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      configId: string;
      name: string;
      provider: string;
      modelName: string;
      jsonData?: Record<string, unknown>;
    }): Promise<VariantResult | undefined> => {
      const response = await hc.v1.configs[':configId'].variants.$post({
        param: { configId: data.configId },
        json: {
          name: data.name,
          provider: data.provider,
          modelName: data.modelName,
          jsonData: data.jsonData,
        },
      });
      const result = await response.json();
      if ('data' in result && result.data) {
        return result.data as VariantResult;
      }
      return undefined;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({
        queryKey: getConfigVariantsQueryKey(variables.configId),
      });
    },
  });
};
