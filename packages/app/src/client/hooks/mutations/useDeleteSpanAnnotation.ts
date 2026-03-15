import { hc } from '@client/lib/hc';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getSpanAnnotationsQueryKey } from '../queries/useSpanAnnotations';

export const useDeleteSpanAnnotation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      traceId: string;
      spanId: string;
      annotationId: string;
    }) => {
      const response = await hc.v1.traces[':traceId'].spans[':spanId']
        .annotations[':annotationId'].$delete({
          param: {
            traceId: data.traceId,
            spanId: data.spanId,
            annotationId: data.annotationId,
          },
        });
      const result = await response.json();
      return 'data' in result ? result.data : undefined;
    },
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({
        queryKey: getSpanAnnotationsQueryKey(
          variables.traceId,
          variables.spanId
        ),
      });
    },
  });
};
