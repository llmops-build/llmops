import { hc } from '@client/lib/hc';
import { useQuery } from '@tanstack/react-query';

export type Model = {
  label: string;
  value: string;
  id: string;
  name: string;
  family?: string;
  attachment: boolean;
  reasoning: boolean;
  tool_call: boolean;
  temperature?: boolean;
  knowledge?: string;
  release_date: string;
  last_updated: string;
  modalities: {
    input: string[];
    output: string[];
  };
  open_weights: boolean;
  cost: {
    input: number;
    output: number;
    reasoning?: number;
    cache_read?: number;
    cache_write?: number;
    input_audio?: number;
    output_audio?: number;
  };
  limit: {
    context: number;
    input?: number;
    output: number;
  };
};

export type ProviderGroup = {
  id: string;
  providerId: string;
  slug: string | null;
  label: string;
  logo: string | null;
  models: Array<Model>;
};

export const useModelsGroupedByProvider = () => {
  return useQuery({
    queryKey: ['models-grouped'],
    queryFn: async () => {
      const response = await hc.v1.providers.models.grouped.$get();
      const json = await response.json();
      if ('data' in json && json.data) {
        return json.data as ProviderGroup[];
      }
      return [] as ProviderGroup[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};
