import { ZodType } from 'zod';
import type { ValidationTargets } from 'hono';
import { zValidator } from '@hono/zod-validator';

export const zv = <T extends ZodType, Target extends keyof ValidationTargets>(
  target: Target,
  schema: T
) =>
  zValidator(target, schema, (result, c) => {
    if (!result.success) {
      return c.json(
        {
          message: 'Bad Request',
          errors: result.error.issues.map((issue) => ({
            path: issue.path.join('.'),
            message: issue.message,
          })),
        },
        400
      );
    }
  });
