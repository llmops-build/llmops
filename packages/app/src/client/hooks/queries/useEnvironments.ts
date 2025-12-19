import { hc } from '@client/lib/hc';
import { useQuery } from '@tanstack/react-query';

export const getQueryKey = () => ['environments'];

export const useEnvironments = () => {
  return useQuery({
    queryKey: getQueryKey(),
    queryFn: async () => {
      const response = await hc.v1.environments.$get();
      const result = await response.json();
      const data = ('data' in result ? result.data : []) as {
        id: string;
        name: string;
        slug: string;
        isProd: boolean | number | string;
        createdAt: string;
        updatedAt: string;
      }[];
      // Normalize isProd from various formats to boolean
      // SQLite can return: boolean, integer (0/1), or string ("true"/"false")
      return data.map((env) => ({
        ...env,
        isProd:
          env.isProd === true || env.isProd === 1 || env.isProd === 'true',
      }));
    },
  });
};
