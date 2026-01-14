import { hc } from '@client/lib/hc';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKey } from '../queries/usePlaygrounds';

export const useUpdatePlayground = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      id: string;
      name?: string;
      description?: string;
      state?: Record<string, unknown>;
    }) => {
      const response = await hc.v1.playgrounds[':id'].$patch({
        param: { id: data.id },
        json: {
          name: data.name,
          description: data.description,
          state: data.state,
        },
      });
      const result = await response.json();
      return 'data' in result ? result.data : undefined;
    },
    onSuccess: async (data) => {
      if (data) {
        await queryClient.invalidateQueries({ queryKey: queryKey });
        // Assuming the return type from updatePlayground has an id field.
        // It returns keys from db.updateTable().returningAll().executeTakeFirst()
        // So it should have id.
        await queryClient.invalidateQueries({
          queryKey: ['playground', (data as any).id],
        });
      }
    },
  });
};
