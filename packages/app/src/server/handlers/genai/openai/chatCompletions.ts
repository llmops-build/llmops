import { Hono, type ContextVariableMap } from 'hono';
import {
  chatCompletionCreateParamsBaseSchema,
  SupportedProviders,
  variantJsonDataSchema,
  type ChatCompletionCreateParamsBase,
} from '@llmops/core';
import { zv } from '@server/lib/zv';

const app = new Hono<{
  Variables: ContextVariableMap & { configId: string; envSec?: string };
}>().post('/', zv('json', chatCompletionCreateParamsBaseSchema), async (c) => {
  try {
    const body = c.req.valid('json');
    const providers = c.get('providers');
    const provider = providers[SupportedProviders.OPENROUTER];
    const configId = c.var['configId'];
    const envSec = c.var['envSec'];

    const data = await c.var.db.getVariantJsonDataForConfig({
      configId,
      envSecret: envSec,
    });

    // Parse and validate the jsonData from the variant
    const variantConfig = variantJsonDataSchema.parse(
      typeof data.jsonData === 'string'
        ? JSON.parse(data.jsonData)
        : data.jsonData
    );

    // Build messages array: prepend system prompt from variant if present
    const messages: ChatCompletionCreateParamsBase['messages'] = [];

    if (variantConfig.system_prompt) {
      messages.push({
        role: 'system',
        content: variantConfig.system_prompt,
      });
    }

    // Append user's messages
    messages.push(...body.messages);

    // Use model from jsonData, fallback to modelName column for backwards compatibility
    const model = variantConfig.model || data.modelName;

    // Merge variant config with request body
    // Variant config takes precedence, request body provides fallbacks
    const mergedBody = {
      ...body,
      messages,
      model,
      // Variant config takes precedence over request body
      temperature: variantConfig.temperature ?? body.temperature,
      max_tokens: variantConfig.max_tokens ?? body.max_tokens,
      max_completion_tokens:
        variantConfig.max_completion_tokens ?? body.max_completion_tokens,
      top_p: variantConfig.top_p ?? body.top_p,
      frequency_penalty:
        variantConfig.frequency_penalty ?? body.frequency_penalty,
      presence_penalty: variantConfig.presence_penalty ?? body.presence_penalty,
      stop: variantConfig.stop ?? body.stop,
      n: variantConfig.n ?? body.n,
      logprobs: variantConfig.logprobs ?? body.logprobs,
      top_logprobs: variantConfig.top_logprobs ?? body.top_logprobs,
      response_format: variantConfig.response_format ?? body.response_format,
      seed: variantConfig.seed ?? body.seed,
      tools: variantConfig.tools ?? body.tools,
      tool_choice: variantConfig.tool_choice ?? body.tool_choice,
      parallel_tool_calls:
        variantConfig.parallel_tool_calls ?? body.parallel_tool_calls,
      user: variantConfig.user ?? body.user,
      stream: variantConfig.stream ?? body.stream,
      stream_options: variantConfig.stream_options ?? body.stream_options,
    } satisfies ChatCompletionCreateParamsBase;

    const transformedBody =
      await provider.getChatCompletionResponse(mergedBody);

    return c.json(transformedBody);
  } catch (e) {
    console.log('Error in chat completions handler:', e);
    return c.json({ ok: false, error: e }, 400);
  }
});

export default app;
