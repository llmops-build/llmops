import { ProviderConfigs } from '../types';
import OpenrouterAPIConfig from './api';
import {
  OpenrouterChatCompleteConfig,
  OpenrouterChatCompleteResponseTransform,
  OpenrouterChatCompleteStreamChunkTransform,
} from './chatComplete';
import { OpenrouterCreateModelResponseConfig } from './createModelResponse';
import {
  OpenrouterEmbedConfig,
  OpenrouterEmbedResponseTransform,
} from './embed';
import {
  OpenAICreateModelResponseTransformer,
  OpenAIGetModelResponseTransformer,
  OpenAIDeleteModelResponseTransformer,
  OpenAIListInputItemsResponseTransformer,
} from '../open-ai-base';
import { OPENROUTER } from '../../globals';

const OpenrouterConfig: ProviderConfigs = {
  chatComplete: OpenrouterChatCompleteConfig,
  embed: OpenrouterEmbedConfig,
  api: OpenrouterAPIConfig,
  createModelResponse: OpenrouterCreateModelResponseConfig,
  getModelResponse: {},
  deleteModelResponse: {},
  listModelsResponse: {},
  responseTransforms: {
    chatComplete: OpenrouterChatCompleteResponseTransform,
    'stream-chatComplete': OpenrouterChatCompleteStreamChunkTransform,
    embed: OpenrouterEmbedResponseTransform,
    createModelResponse: OpenAICreateModelResponseTransformer(OPENROUTER),
    getModelResponse: OpenAIGetModelResponseTransformer(OPENROUTER),
    deleteModelResponse: OpenAIDeleteModelResponseTransformer(OPENROUTER),
    listModelsResponse: OpenAIListInputItemsResponseTransformer(OPENROUTER),
  },
};

export default OpenrouterConfig;
