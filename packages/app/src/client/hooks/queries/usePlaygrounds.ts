import { hc } from '@client/lib/hc';
import { useQuery } from '@tanstack/react-query';
import type { PlaygroundColumn } from '@llmops/core';

export type Playground = {
  id: string;
  name: string;
  datasetId: string | null;
  columns: PlaygroundColumn[] | null;
  createdAt: string;
  updatedAt: string;
};

export const getQueryKey = () => ['playgrounds'];

export const usePlaygrounds = () => {
  return useQuery({
    queryKey: getQueryKey(),
    queryFn: async () => {
      const response = await hc.v1.playgrounds.$get();
      const result = await response.json();
      return ('data' in result ? result.data : []) as Playground[];
    },
  });
};
