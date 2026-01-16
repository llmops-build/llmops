import pino from 'pino';

// Use globalThis to safely access environment variables across runtimes
const getLogLevel = (): string => {
  try {
    // Check for process.env in Node.js-like environments
    if (typeof process !== 'undefined' && process.env?.LOG_LEVEL) {
      return process.env.LOG_LEVEL;
    }
  } catch {
    // process may not be defined in edge runtimes
  }
  return 'info';
};

export const logger = pino({
  level: getLogLevel(),
});
