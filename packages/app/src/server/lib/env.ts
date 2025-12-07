import z from 'zod';

export const envVariablesSchema = z.object({
  OPENROUTER_API_KEY: z.string().min(1).optional(),
  LLMOPS_DEV: z.stringbool().optional(),
});

export type ParsedEnvVariables = z.infer<typeof envVariablesSchema>;
