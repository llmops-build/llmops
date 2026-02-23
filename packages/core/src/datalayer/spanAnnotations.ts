import { LLMOpsError } from '@/error';
import type { Database } from '@/schemas';
import type { Kysely } from 'kysely';
import { randomUUID } from 'node:crypto';
import z from 'zod';

const createAnnotation = z.object({
  traceId: z.string(),
  spanId: z.string(),
  type: z.enum(['score', 'label', 'comment']),
  value: z.record(z.string(), z.unknown()),
});

const updateAnnotation = z.object({
  annotationId: z.string().uuid(),
  type: z.enum(['score', 'label', 'comment']).optional(),
  value: z.record(z.string(), z.unknown()).optional(),
});

const deleteAnnotation = z.object({
  annotationId: z.string().uuid(),
});

const listAnnotationsBySpan = z.object({
  spanId: z.string(),
});

export const createSpanAnnotationsDataLayer = (db: Kysely<Database>) => {
  return {
    createSpanAnnotation: async (
      params: z.infer<typeof createAnnotation>
    ) => {
      const value = await createAnnotation.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { traceId, spanId, type, value: annotationValue } = value.data;
      const now = new Date().toISOString();

      return db
        .insertInto('span_annotations')
        .values({
          id: randomUUID(),
          traceId,
          spanId,
          type,
          value: JSON.stringify(annotationValue),
          createdAt: now,
          updatedAt: now,
        })
        .returningAll()
        .executeTakeFirst();
    },

    updateSpanAnnotation: async (
      params: z.infer<typeof updateAnnotation>
    ) => {
      const result = await updateAnnotation.safeParseAsync(params);
      if (!result.success) {
        throw new LLMOpsError(`Invalid parameters: ${result.error.message}`);
      }
      const { annotationId, type, value: annotationValue } = result.data;

      const updateData: Record<string, unknown> = {
        updatedAt: new Date().toISOString(),
      };
      if (type !== undefined) updateData.type = type;
      if (annotationValue !== undefined)
        updateData.value = JSON.stringify(annotationValue);

      return db
        .updateTable('span_annotations')
        .set(updateData)
        .where('id', '=', annotationId)
        .returningAll()
        .executeTakeFirst();
    },

    deleteSpanAnnotation: async (
      params: z.infer<typeof deleteAnnotation>
    ) => {
      const result = await deleteAnnotation.safeParseAsync(params);
      if (!result.success) {
        throw new LLMOpsError(`Invalid parameters: ${result.error.message}`);
      }

      return db
        .deleteFrom('span_annotations')
        .where('id', '=', result.data.annotationId)
        .returningAll()
        .executeTakeFirst();
    },

    listSpanAnnotations: async (
      params: z.infer<typeof listAnnotationsBySpan>
    ) => {
      const result = await listAnnotationsBySpan.safeParseAsync(params);
      if (!result.success) {
        throw new LLMOpsError(`Invalid parameters: ${result.error.message}`);
      }

      return db
        .selectFrom('span_annotations')
        .selectAll()
        .where('spanId', '=', result.data.spanId)
        .orderBy('createdAt', 'desc')
        .execute();
    },
  };
};
