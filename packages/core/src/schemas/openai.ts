import { z } from 'zod';

const chatCompletionContentPartTextSchema = z.object({
  text: z.string(),
  type: z.literal('text'),
});

const chatCompletionContentPartImageSchema = z.object({
  image_url: z.object({
    url: z.string(),
    detail: z.enum(['auto', 'low', 'high']).optional(),
  }),
  type: z.literal('image_url'),
});

const chatCompletionContentPartInputAudioSchema = z.object({
  input_audio: z.object({
    data: z.string(),
    format: z.enum(['wav', 'mp3']),
  }),
  type: z.literal('input_audio'),
});

const chatCompletionContentPartFileSchema = z.object({
  file: z.object({
    file_data: z.string().optional(),
    file_id: z.string().optional(),
    filename: z.string().optional(),
  }),
  type: z.literal('file'),
});

const chatCompletionContentPartRefusalSchema = z.object({
  refusal: z.string(),
  type: z.literal('refusal'),
});

const chatCompletionContentPartSchema = z.union([
  chatCompletionContentPartTextSchema,
  chatCompletionContentPartImageSchema,
  chatCompletionContentPartInputAudioSchema,
  chatCompletionContentPartFileSchema,
]);

const chatCompletionDeveloperMessageParamSchema = z.object({
  content: z.union([z.string(), z.array(chatCompletionContentPartTextSchema)]),
  role: z.literal('developer'),
  name: z.string().optional(),
});

const chatCompletionSystemMessageParamSchema = z.object({
  content: z.union([z.string(), z.array(chatCompletionContentPartTextSchema)]),
  role: z.literal('system'),
  name: z.string().optional(),
});

const chatCompletionUserMessageParamSchema = z.object({
  content: z.union([z.string(), z.array(chatCompletionContentPartSchema)]),
  role: z.literal('user'),
  name: z.string().optional(),
});

const chatCompletionMessageToolCallSchema = z.object({
  id: z.string(),
  function: z.object({
    arguments: z.string(),
    name: z.string(),
  }),
  type: z.literal('function'),
});

const chatCompletionAssistantMessageParamSchema = z.object({
  role: z.literal('assistant'),
  audio: z
    .object({
      id: z.string(),
    })
    .optional()
    .nullable(),
  content: z
    .union([
      z.string(),
      z.array(
        z.union([
          chatCompletionContentPartTextSchema,
          chatCompletionContentPartRefusalSchema,
        ])
      ),
    ])
    .optional()
    .nullable(),
  function_call: z
    .object({
      arguments: z.string(),
      name: z.string(),
    })
    .optional()
    .nullable(),
  name: z.string().optional(),
  refusal: z.string().optional().nullable(),
  tool_calls: z.array(chatCompletionMessageToolCallSchema).optional(),
});

const chatCompletionToolMessageParamSchema = z.object({
  content: z.union([z.string(), z.array(chatCompletionContentPartTextSchema)]),
  role: z.literal('tool'),
  tool_call_id: z.string(),
});

const chatCompletionFunctionMessageParamSchema = z.object({
  content: z.string().nullable(),
  name: z.string(),
  role: z.literal('function'),
});

const chatCompletionMessageParamSchema = z.union([
  chatCompletionDeveloperMessageParamSchema,
  chatCompletionSystemMessageParamSchema,
  chatCompletionUserMessageParamSchema,
  chatCompletionAssistantMessageParamSchema,
  chatCompletionToolMessageParamSchema,
  chatCompletionFunctionMessageParamSchema,
]);

const functionDefinitionSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  parameters: z.record(z.string(), z.any()).optional(),
});

const chatCompletionFunctionToolSchema = z.object({
  function: functionDefinitionSchema,
  type: z.literal('function'),
});

const chatCompletionCustomToolSchema = z.object({
  custom: z.object({
    name: z.string(),
    description: z.string().optional(),
    format: z
      .union([
        z.object({
          type: z.literal('text'),
        }),
        z.object({
          grammar: z.object({
            definition: z.string(),
            syntax: z.enum(['lark', 'regex']),
          }),
          type: z.literal('grammar'),
        }),
      ])
      .optional(),
  }),
  type: z.literal('custom'),
});

const chatCompletionToolSchema = z.union([
  chatCompletionFunctionToolSchema,
  chatCompletionCustomToolSchema,
]);

const chatCompletionNamedToolChoiceSchema = z.object({
  function: z.object({
    name: z.string(),
  }),
  type: z.literal('function'),
});

const chatCompletionNamedToolChoiceCustomSchema = z.object({
  custom: z.object({
    name: z.string(),
  }),
  type: z.literal('custom'),
});

const chatCompletionAllowedToolChoiceSchema = z.object({
  allowed_tools: z.object({
    mode: z.enum(['auto', 'required']),
    tools: z.array(z.record(z.string(), z.unknown())),
  }),
  type: z.literal('allowed_tools'),
});

const chatCompletionToolChoiceOptionSchema = z.union([
  z.enum(['none', 'auto', 'required']),
  chatCompletionAllowedToolChoiceSchema,
  chatCompletionNamedToolChoiceSchema,
  chatCompletionNamedToolChoiceCustomSchema,
]);

const chatCompletionAudioParamSchema = z.object({
  format: z.enum(['wav', 'aac', 'mp3', 'flac', 'opus', 'pcm16']),
  voice: z.union([
    z.string(),
    z.enum([
      'alloy',
      'ash',
      'ballad',
      'coral',
      'echo',
      'sage',
      'shimmer',
      'verse',
      'marin',
      'cedar',
    ]),
  ]),
});

const chatCompletionStreamOptionsSchema = z.object({
  include_obfuscation: z.boolean().optional(),
  include_usage: z.boolean().optional(),
});

const chatCompletionPredictionContentSchema = z.object({
  content: z.union([z.string(), z.array(chatCompletionContentPartTextSchema)]),
  type: z.literal('content'),
});

const responseFormatTextSchema = z.object({
  type: z.literal('text'),
});

const responseFormatJSONObjectSchema = z.object({
  type: z.literal('json_object'),
});

const responseFormatJSONSchemaSchema = z.object({
  type: z.literal('json_schema'),
  json_schema: z.object({
    name: z.string(),
    description: z.string().optional(),
    schema: z.record(z.string(), z.any()).optional(),
    strict: z.boolean().optional(),
  }),
});

const responseFormatSchema = z.union([
  responseFormatTextSchema,
  responseFormatJSONObjectSchema,
  responseFormatJSONSchemaSchema,
]);

const webSearchUserLocationSchema = z.object({
  approximate: z.object({
    city: z.string().optional(),
    country: z.string().optional(),
    region: z.string().optional(),
    timezone: z.string().optional(),
  }),
  type: z.literal('approximate'),
});

const webSearchOptionsSchema = z.object({
  search_context_size: z.enum(['low', 'medium', 'high']).optional(),
  user_location: webSearchUserLocationSchema.optional().nullable(),
});

export const chatCompletionCreateParamsBaseSchema = z.object({
  messages: z.array(chatCompletionMessageParamSchema),
  model: z.string(),
  audio: chatCompletionAudioParamSchema.optional().nullable(),
  frequency_penalty: z.number().min(-2).max(2).optional().nullable(),
  function_call: z
    .union([
      z.enum(['none', 'auto']),
      z.object({
        name: z.string(),
      }),
    ])
    .optional(),
  functions: z
    .array(
      z.object({
        name: z.string(),
        description: z.string().optional(),
        parameters: z.record(z.string(), z.any()).optional(),
      })
    )
    .optional(),
  logit_bias: z
    .record(z.string(), z.number().min(-100).max(100))
    .optional()
    .nullable(),
  logprobs: z.boolean().optional().nullable(),
  max_completion_tokens: z.number().positive().optional().nullable(),
  max_tokens: z.number().positive().optional().nullable(),
  metadata: z.record(z.string(), z.string()).optional().nullable(),
  modalities: z
    .array(z.enum(['text', 'audio']))
    .optional()
    .nullable(),
  n: z.number().positive().optional().nullable(),
  parallel_tool_calls: z.boolean().optional(),
  prediction: chatCompletionPredictionContentSchema.optional().nullable(),
  presence_penalty: z.number().min(-2).max(2).optional().nullable(),
  prompt_cache_key: z.string().optional(),
  prompt_cache_retention: z.enum(['in-memory', '24h']).optional().nullable(),
  reasoning_effort: z
    .enum(['none', 'minimal', 'low', 'medium', 'high', 'xhigh'])
    .optional()
    .nullable(),
  response_format: responseFormatSchema.optional(),
  safety_identifier: z.string().optional(),
  seed: z.number().optional().nullable(),
  service_tier: z
    .enum(['auto', 'default', 'flex', 'scale', 'priority'])
    .optional()
    .nullable(),
  stop: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .nullable(),
  store: z.boolean().optional().nullable(),
  stream: z.boolean().optional().nullable(),
  stream_options: chatCompletionStreamOptionsSchema.optional().nullable(),
  temperature: z.number().min(0).max(2).optional().nullable(),
  tool_choice: chatCompletionToolChoiceOptionSchema.optional(),
  tools: z.array(chatCompletionToolSchema).optional(),
  top_logprobs: z.number().min(0).max(20).optional().nullable(),
  top_p: z.number().min(0).max(1).optional().nullable(),
  user: z.string().optional(),
  verbosity: z.enum(['low', 'medium', 'high']).optional().nullable(),
  web_search_options: webSearchOptionsSchema.optional(),
});

export type ChatCompletionCreateParamsBase = z.infer<
  typeof chatCompletionCreateParamsBaseSchema
>;

/**
 * Schema for variant jsonData - these are the parameters that can be
 * configured per variant to override the default chat completion settings.
 * This is a subset of ChatCompletionCreateParamsBase that makes sense to
 * configure at the variant level (excludes messages which come from the request).
 */
export const variantJsonDataSchema = z.object({
  // LLMOps-specific fields
  system_prompt: z.string().optional(),
  messages: z.array(chatCompletionMessageParamSchema).optional(),

  // OpenAI-compatible fields
  model: z.string().optional(),
  audio: chatCompletionAudioParamSchema.optional().nullable(),
  frequency_penalty: z.number().min(-2).max(2).optional().nullable(),
  function_call: z
    .union([
      z.enum(['none', 'auto']),
      z.object({
        name: z.string(),
      }),
    ])
    .optional(),
  functions: z
    .array(
      z.object({
        name: z.string(),
        description: z.string().optional(),
        parameters: z.record(z.string(), z.any()).optional(),
      })
    )
    .optional(),
  logit_bias: z
    .record(z.string(), z.number().min(-100).max(100))
    .optional()
    .nullable(),
  logprobs: z.boolean().optional().nullable(),
  max_completion_tokens: z.number().positive().optional().nullable(),
  max_tokens: z.number().positive().optional().nullable(),
  metadata: z.record(z.string(), z.string()).optional().nullable(),
  modalities: z
    .array(z.enum(['text', 'audio']))
    .optional()
    .nullable(),
  n: z.number().positive().optional().nullable(),
  parallel_tool_calls: z.boolean().optional(),
  prediction: chatCompletionPredictionContentSchema.optional().nullable(),
  presence_penalty: z.number().min(-2).max(2).optional().nullable(),
  prompt_cache_key: z.string().optional(),
  prompt_cache_retention: z.enum(['in-memory', '24h']).optional().nullable(),
  reasoning_effort: z
    .enum(['none', 'minimal', 'low', 'medium', 'high', 'xhigh'])
    .optional()
    .nullable(),
  response_format: responseFormatSchema.optional(),
  safety_identifier: z.string().optional(),
  seed: z.number().optional().nullable(),
  service_tier: z
    .enum(['auto', 'default', 'flex', 'scale', 'priority'])
    .optional()
    .nullable(),
  stop: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .nullable(),
  store: z.boolean().optional().nullable(),
  stream: z.boolean().optional().nullable(),
  stream_options: chatCompletionStreamOptionsSchema.optional().nullable(),
  temperature: z.number().min(0).max(2).optional().nullable(),
  tool_choice: chatCompletionToolChoiceOptionSchema.optional(),
  tools: z.array(chatCompletionToolSchema).optional(),
  top_logprobs: z.number().min(0).max(20).optional().nullable(),
  top_p: z.number().min(0).max(1).optional().nullable(),
  user: z.string().optional(),
  verbosity: z.enum(['low', 'medium', 'high']).optional().nullable(),
  web_search_options: webSearchOptionsSchema.optional(),
});

export type VariantJsonData = z.infer<typeof variantJsonDataSchema>;
