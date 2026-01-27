import { hc } from '@client/lib/hc';
import { useQuery } from '@tanstack/react-query';

export type Dataset = {
  id: string;
  name: string;
  description: string | null;
  recordCount: number;
  latestVersionNumber: number;
  createdAt: string;
  updatedAt: string;
};

export const getQueryKey = () => ['datasets'];

export const useDatasets = () => {
  return useQuery({
    queryKey: getQueryKey(),
    queryFn: async () => {
      const response = await hc.v1.datasets.$get();
      const result = await response.json();
      return ('data' in result ? result.data : []) as Dataset[];
    },
  });
};
