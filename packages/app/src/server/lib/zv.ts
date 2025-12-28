import { ZodType } from 'zod';
import type { ValidationTargets } from 'hono';
import { zValidator } from '@hono/zod-validator';

export const zv = <T extends ZodType, Target extends keyof ValidationTargets>(
  target: Target,
  schema: T
) =>
  zValidator(target, schema, (result, c) => {
    if (!result.success) {
      /**
       * @todo handle error properly
       */
      return c.json(
        {
          message: 'Bad Request',
        },
        400
      );
    }
  });
