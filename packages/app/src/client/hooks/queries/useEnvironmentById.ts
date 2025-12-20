import { hc } from '@client/lib/hc';
import { queryOptions, useQuery } from '@tanstack/react-query';

export type Environment = {
  id: string;
  name: string;
  slug: string;
  isProd: boolean;
  createdAt: string;
  updatedAt: string;
};

export const environmentByIdQueryOptions = (id?: string) =>
  queryOptions({
    queryKey: ['environment', id],
    queryFn: async () => {
      const response = await hc.v1.environments[':id'].$get({
        param: { id: id as string },
      });
      const result = await response.json();
      const env = ('data' in result ? result.data : null) as {
        id: string;
        name: string;
        slug: string;
        isProd: boolean | number | string;
        createdAt: string;
        updatedAt: string;
      } | null;
      if (!env) return null;
      // Normalize isProd from various formats to boolean
      return {
        ...env,
        isProd:
          env.isProd === true || env.isProd === 1 || env.isProd === 'true',
      } as Environment;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

export const useEnvironmentById = (id?: string) => {
  return useQuery(environmentByIdQueryOptions(id));
};
