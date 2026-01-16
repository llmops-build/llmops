/**
 * @file src/utils/edge-logger.ts
 * Edge-compatible logger using console API
 * Works in all runtimes: Node.js, Cloudflare Workers, Deno, etc.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogFn {
  (msg: string): void;
  (obj: object, msg?: string): void;
}

interface EdgeLogger {
  level: LogLevel;
  debug: LogFn;
  info: LogFn;
  warn: LogFn;
  error: LogFn;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const getLogLevel = (): LogLevel => {
  try {
    if (typeof process !== 'undefined' && process.env?.LOG_LEVEL) {
      const level = process.env.LOG_LEVEL.toLowerCase() as LogLevel;
      if (level in LOG_LEVELS) return level;
    }
  } catch {
    // process may not be defined in edge runtimes
  }
  return 'info';
};

const createLogFn = (level: LogLevel, currentLevel: LogLevel): LogFn => {
  const shouldLog = LOG_LEVELS[level] >= LOG_LEVELS[currentLevel];

  return (objOrMsg: string | object, msg?: string) => {
    if (!shouldLog) return;

    const consoleFn = level === 'debug' ? console.debug :
                      level === 'info' ? console.info :
                      level === 'warn' ? console.warn :
                      console.error;

    if (typeof objOrMsg === 'string') {
      consoleFn(`[${level.toUpperCase()}]`, objOrMsg);
    } else if (msg) {
      consoleFn(`[${level.toUpperCase()}]`, msg, objOrMsg);
    } else {
      consoleFn(`[${level.toUpperCase()}]`, objOrMsg);
    }
  };
};

const createEdgeLogger = (): EdgeLogger => {
  const level = getLogLevel();

  return {
    level,
    debug: createLogFn('debug', level),
    info: createLogFn('info', level),
    warn: createLogFn('warn', level),
    error: createLogFn('error', level),
  };
};

/**
 * Edge-compatible logger instance
 * Use this for code that needs to run in edge runtimes
 */
export const edgeLogger = createEdgeLogger();
