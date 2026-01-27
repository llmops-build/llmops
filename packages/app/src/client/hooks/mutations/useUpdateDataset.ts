import { hc } from '@client/lib/hc';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getQueryKey } from '../queries/useDatasets';
import { getQueryKey as getDatasetQueryKey } from '../queries/useDatasetById';

export const useUpdateDataset = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { id: string; name?: string }) => {
      const response = await hc.v1.datasets[':id'].$patch({
        param: { id: data.id },
        json: {
          name: data.name,
        },
      });
      const result = await response.json();
      return 'data' in result ? (result.data as { id: string }) : undefined;
    },
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: getQueryKey() });
      if (data?.id) {
        await queryClient.invalidateQueries({
          queryKey: getDatasetQueryKey(data.id),
        });
      }
    },
  });
};
