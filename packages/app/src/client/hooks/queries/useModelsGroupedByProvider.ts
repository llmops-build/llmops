import { useQuery } from '@tanstack/react-query';

export type Model = {
  id: string;
  value: string;
  label: string;
  temperature?: boolean;
  limit?: {
    input?: number;
    output?: number;
  };
};

export type ProviderGroup = {
  id: string;
  providerId: string;
  slug: string | null;
  label: string;
  logo: string | null;
  models: Model[];
};

/**
 * Stub: providers are now configured in code via llmops().
 * Model selection in playgrounds will be updated to work with inline providers.
 */
export function useModelsGroupedByProvider() {
  return useQuery<ProviderGroup[]>({
    queryKey: ['models-grouped-by-provider'],
    queryFn: async () => [],
    staleTime: Number.POSITIVE_INFINITY,
  });
}
