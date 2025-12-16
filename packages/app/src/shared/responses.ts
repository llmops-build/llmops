import type {
  StatusCode,
  SuccessStatusCode,
  ClientErrorStatusCode,
  ServerErrorStatusCode,
} from 'hono/utils/http-status';

export interface APIResponse<T extends unknown = unknown> {
  code: StatusCode;
  success: boolean;
  data?: T;
  message?: string;
}

export const successResponse = <T>(
  data: T,
  code: SuccessStatusCode
): APIResponse<T> => {
  return {
    code,
    success: true,
    data,
  };
};

export const clientErrorResponse = (
  message: string,
  code: ClientErrorStatusCode
): APIResponse => {
  return {
    code,
    message,
    success: false,
  };
};

export const internalServerError = (
  message: string,
  code: ServerErrorStatusCode
): APIResponse => {
  return {
    code,
    success: false,
    message,
  };
};
