import type { Result } from 'neverthrow';
import type { ProviderConfig } from '../types/provider';
import { RequestType } from '../types/requests';
import type { GatewayError } from '../utils/responses';
import { executeRequest } from './executeRequest';

export function handleChatCompletions(
  config: ProviderConfig,
  request: Request
): Promise<Result<Response, GatewayError>> {
  return executeRequest(config, request, RequestType.ChatCompletion);
}
