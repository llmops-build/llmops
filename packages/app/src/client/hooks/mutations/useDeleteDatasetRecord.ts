import { hc } from '@client/lib/hc';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getQueryKey } from '../queries/useDatasetRecords';
import { getQueryKey as getDatasetQueryKey } from '../queries/useDatasetById';

export const useDeleteDatasetRecord = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { datasetId: string; recordId: string }) => {
      const response = await hc.v1.datasets[':id'].records[':recordId'].$delete(
        {
          param: { id: data.datasetId, recordId: data.recordId },
        },
      );
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
