import { toNextJsHandler } from '@llmops/sdk/nextjs';
import llmopsClient from '@/llmops';

export const { GET, POST, PUT, PATCH, DELETE } = toNextJsHandler(llmopsClient);
