import { OPENROUTER } from '../../globals';
import { EmbedResponse } from '../../types/embedRequestBody';
import { ErrorResponse, ProviderConfig } from '../types';
import { embedParams } from '../open-ai-base';
import {
  generateErrorResponse,
  generateInvalidProviderResponseError,
} from '../utils';
import { OpenrouterErrorResponse } from './chatComplete';

const openrouterExtraParams: ProviderConfig = {
  input_type: {
    param: 'input_type',
  },
  provider: {
    param: 'provider',
  },
};

export const OpenrouterEmbedConfig: ProviderConfig = embedParams(
  [],
  {},
  openrouterExtraParams
);

export const OpenrouterEmbedResponseTransform: (
  response: EmbedResponse | OpenrouterErrorResponse,
  responseStatus: number
) => EmbedResponse | ErrorResponse = (response, responseStatus) => {
  if ('message' in response && responseStatus !== 200) {
    return generateErrorResponse(
      {
        message: response.message,
        type: response.type,
        param: response.param,
        code: response.code,
      },
      OPENROUTER
    );
  }

  if ('data' in response) {
    return {
      ...response,
      provider: OPENROUTER,
    };
  }

  return generateInvalidProviderResponseError(response, OPENROUTER);
};
