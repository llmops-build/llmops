export class LLMOpsError extends Error {
  constructor(message: string, cause?: string) {
    super(message);
    this.name = 'LLMOpsError';
    this.message = message;
    this.cause = cause;
    this.stack = '';
  }
}
