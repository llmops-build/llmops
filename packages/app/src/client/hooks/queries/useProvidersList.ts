import { hc } from '@client/lib/hc';
import { useQuery } from '@tanstack/react-query';

export type ProviderInfo = {
  id: string;
  name: string;
  logo: string;
  npm: string;
  env: string[];
  doc: string;
  api?: string;
  modelCount: number;
};

export const useProvidersList = () => {
  return useQuery({
    queryKey: ['providers-list'],
    queryFn: async () => {
      const response = await hc.v1.providers.$get();
      const json = await response.json();
      if ('data' in json && json.data) {
        return json.data as ProviderInfo[];
      }
      return [] as ProviderInfo[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
