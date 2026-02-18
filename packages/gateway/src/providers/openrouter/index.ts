import { ProviderConfigs } from '../types';
import OpenrouterAPIConfig from './api';
import {
  OpenrouterChatCompleteConfig,
  OpenrouterChatCompleteResponseTransform,
  OpenrouterChatCompleteStreamChunkTransform,
} from './chatComplete';
import { OpenrouterCreateModelResponseConfig } from './createModelResponse';
import {
  OpenAICreateModelResponseTransformer,
  OpenAIGetModelResponseTransformer,
  OpenAIDeleteModelResponseTransformer,
  OpenAIListInputItemsResponseTransformer,
} from '../open-ai-base';
import { OPENROUTER } from '../../globals';

const OpenrouterConfig: ProviderConfigs = {
  chatComplete: OpenrouterChatCompleteConfig,
  api: OpenrouterAPIConfig,
  createModelResponse: OpenrouterCreateModelResponseConfig,
  getModelResponse: {},
  deleteModelResponse: {},
  listModelsResponse: {},
  responseTransforms: {
    chatComplete: OpenrouterChatCompleteResponseTransform,
    'stream-chatComplete': OpenrouterChatCompleteStreamChunkTransform,
    createModelResponse: OpenAICreateModelResponseTransformer(OPENROUTER),
    getModelResponse: OpenAIGetModelResponseTransformer(OPENROUTER),
    deleteModelResponse: OpenAIDeleteModelResponseTransformer(OPENROUTER),
    listModelsResponse: OpenAIListInputItemsResponseTransformer(OPENROUTER),
  },
};

export default OpenrouterConfig;
