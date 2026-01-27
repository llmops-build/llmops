import { hc } from '@client/lib/hc';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getQueryKey } from '../queries/useDatasetVersions';
import { getQueryKey as getDatasetQueryKey } from '../queries/useDatasetById';

export const useCreateDatasetVersion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      datasetId: string;
      name?: string | null;
      description?: string | null;
    }) => {
      const response = await hc.v1.datasets[':id'].versions.$post({
        param: { id: data.datasetId },
        json: {
          name: data.name,
          description: data.description,
        },
      });
      const result = await response.json();
      return 'data' in result ? (result.data as { id: string }) : undefined;
    },
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({
        queryKey: getQueryKey(variables.datasetId),
      });
      await queryClient.invalidateQueries({
        queryKey: getDatasetQueryKey(variables.datasetId),
      });
    },
  });
};
