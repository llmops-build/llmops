import { hc } from '@client/lib/hc';
import { useQuery } from '@tanstack/react-query';

export type SpanAnnotationRow = {
  id: string;
  traceId: string;
  spanId: string;
  type: 'score' | 'label' | 'comment';
  value: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export const getSpanAnnotationsQueryKey = (
  traceId: string,
  spanId: string
) => ['span-annotations', traceId, spanId];

export const useSpanAnnotations = (traceId: string, spanId: string) => {
  return useQuery({
    queryKey: getSpanAnnotationsQueryKey(traceId, spanId),
    queryFn: async () => {
      const response = await hc.v1.traces[':traceId'].spans[':spanId']
        .annotations.$get({
          param: { traceId, spanId },
        });
      const result = await response.json();
      return ('data' in result ? result.data : []) as SpanAnnotationRow[];
    },
    enabled: !!traceId && !!spanId,
  });
};
