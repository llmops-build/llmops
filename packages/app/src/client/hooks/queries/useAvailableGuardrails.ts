import { hc } from '@client/lib/hc';
import { queryOptions, useQuery } from '@tanstack/react-query';

export type GuardrailParameterProperty = {
  type: string;
  label: string;
  description?: Array<{ type: string; text: string }>;
  default?: unknown;
  enum?: string[];
  items?: {
    type: string;
    enum?: string[];
  };
};

export type GuardrailParameterSchema = {
  type: 'object';
  properties?: Record<string, GuardrailParameterProperty>;
  required?: string[];
};

export type AvailableGuardrail = {
  id: string;
  name: string;
  type: 'guardrail' | 'transformer';
  supportedHooks: Array<'beforeRequestHook' | 'afterRequestHook'>;
  description: Array<{ type: string; text: string }>;
  parameters: GuardrailParameterSchema;
};

export const getAvailableGuardrailsQueryKey = () => ['available-guardrails'];

export const availableGuardrailsQueryOptions = () =>
  queryOptions({
    queryKey: getAvailableGuardrailsQueryKey(),
    queryFn: async () => {
      const response = await hc.v1.guardrails.available.$get();
      const result = await response.json();
      return ('data' in result ? result.data : []) as AvailableGuardrail[];
    },
    staleTime: 1000 * 60 * 30, // 30 minutes - manifest rarely changes
  });

export const useAvailableGuardrails = () => {
  return useQuery(availableGuardrailsQueryOptions());
};
