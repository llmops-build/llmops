import { hc } from '@client/lib/hc';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getSpanAnnotationsQueryKey } from '../queries/useSpanAnnotations';

export const useCreateSpanAnnotation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      traceId: string;
      spanId: string;
      type: 'score' | 'label' | 'comment';
      value: Record<string, unknown>;
    }) => {
      const response = await hc.v1.traces[':traceId'].spans[':spanId']
        .annotations.$post({
          param: { traceId: data.traceId, spanId: data.spanId },
          json: { type: data.type, value: data.value },
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
