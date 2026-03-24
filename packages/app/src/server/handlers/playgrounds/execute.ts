import type { PlaygroundColumn } from '@llmops/core';
import { logger } from '@llmops/core';
import { zv } from '@server/lib/zv';
import {
  clientErrorResponse,
  internalServerError,
  successResponse,
} from '@shared/responses';
import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import OpenAI from 'openai';
import z from 'zod';

// SSE Event types
type SSEEvent =
  | { type: 'run_started'; data: { runId: string; totalCells: number } }
  | {
      type: 'cell_started';
      data: { resultId: string; columnId: string; recordId: string | null };
    }
  | { type: 'cell_token'; data: { resultId: string; token: string } }
  | {
      type: 'cell_completed';
      data: {
        resultId: string;
        output: string;
        latencyMs: number;
        promptTokens: number | null;
        completionTokens: number | null;
        totalTokens: number | null;
      };
    }
  | { type: 'cell_failed'; data: { resultId: string; error: string } }
  | {
      type: 'run_completed';
      data: { runId: string; completedCount: number; failedCount: number };
    }
  | { type: 'error'; data: { message: string } };

// Resolve template variables in message content
function resolveTemplateVariables(
  content: string,
  variables: Record<string, unknown>
): string {
  return content.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, key) => {
    const value = variables[key];
    if (value === undefined) {
      return match; // Keep original if variable not found
    }
    return String(value);
  });
}

const app = new Hono()
  // Start a new execution run
  .post(
    '/',
    zv(
      'param',
      z.object({
        id: z.string().uuid(),
      })
    ),
    async (c) => {
      const db = c.get('db')!;
      const { id: playgroundId } = c.req.valid('param');

      try {
        // Get the playground
        const playground = await db.getPlaygroundById({ playgroundId });
        if (!playground) {
          return c.json(clientErrorResponse('Playground not found', 404), 404);
        }

        const columns = playground.columns as PlaygroundColumn[] | null;
        if (!columns || columns.length === 0) {
          return c.json(
            clientErrorResponse(
              'Playground has no columns configured',
              400
            ),
            400
          );
        }

        // Get dataset records if a dataset is selected
        let records: Array<{ id: string; input: Record<string, unknown> }> = [];
        let datasetVersionId: string | null = null;

        if (playground.datasetId) {
          // Get the latest version for the dataset
          const versions = await db.listVersions({
            datasetId: playground.datasetId,
            limit: 1,
          });
          const latestVersion = versions[0];
          datasetVersionId = latestVersion?.id ?? null;

          // Get records for this dataset
          const datasetRecords = await db.listRecords({
            datasetId: playground.datasetId,
            limit: 500, // Reasonable limit for playground execution
          });
          records = datasetRecords.map((r) => ({
            id: r.id,
            input: r.input as Record<string, unknown>,
          }));
        }

        // If no dataset, create a single "manual" entry with empty input
        if (records.length === 0) {
          records = [{ id: 'manual', input: {} }];
        }

        // Calculate total cells (columns * records)
        const totalCells = columns.length * records.length;

        // Create the run
        const run = await db.createPlaygroundRun({
          playgroundId,
          datasetId: playground.datasetId ?? null,
          datasetVersionId,
          status: 'pending',
          totalRecords: totalCells,
        });

        if (!run) {
          return c.json(
            internalServerError('Failed to create run', 500),
            500
          );
        }

        // Create result records for each (column, record) pair
        const resultInputs = [];
        for (const record of records) {
          for (const column of columns) {
            resultInputs.push({
              runId: run.id,
              columnId: column.id,
              datasetRecordId: record.id === 'manual' ? null : record.id,
              inputVariables: record.input,
              status: 'pending' as const,
            });
          }
        }

        await db.createPlaygroundResultsBatch({ results: resultInputs });

        return c.json(
          successResponse(
            {
              runId: run.id,
              totalCells,
            },
            200
          )
        );
      } catch (error) {
        console.error('Error starting playground execution:', error);
        return c.json(
          internalServerError('Failed to start execution', 500),
          500
        );
      }
    }
  )
  // Stream execution results via SSE
  .get(
    '/stream',
    zv(
      'param',
      z.object({
        id: z.string().uuid(),
      })
    ),
    zv(
      'query',
      z.object({
        runId: z.string().uuid(),
      })
    ),
    async (c) => {
      const db = c.get('db')!;
      const { id: playgroundId } = c.req.valid('param');
      const { runId } = c.req.valid('query');

      // Verify the run belongs to this playground
      const run = await db.getPlaygroundRunById({ runId });
      if (!run || run.playgroundId !== playgroundId) {
        return c.json(clientErrorResponse('Run not found', 404), 404);
      }

      // Get the playground
      const playground = await db.getPlaygroundById({ playgroundId });
      if (!playground) {
        return c.json(clientErrorResponse('Playground not found', 404), 404);
      }

      const columns = playground.columns as PlaygroundColumn[] | null;
      if (!columns || columns.length === 0) {
        return c.json(
          clientErrorResponse('Playground has no columns configured', 400),
          400
        );
      }

      // Get results for this run
      const results = await db.listPlaygroundResults({ runId });
      const pendingResults = results.filter((r) => r.status === 'pending');

      if (pendingResults.length === 0) {
        return c.json(
          clientErrorResponse('No pending results to execute', 400),
          400
        );
      }

      // Build column lookup map
      const columnMap = new Map<string, PlaygroundColumn>();
      for (const col of columns) {
        columnMap.set(col.id, col);
      }

      // Get provider configs for all columns
      const providerConfigIds = [
        ...new Set(
          columns
            .map((c) => c.providerConfigId)
            .filter((id): id is string => id !== null)
        ),
      ];
      const providerConfigs = new Map<string, { slug: string | null }>();
      for (const configId of providerConfigIds) {
        const config = await db.getProviderConfigById({
          id: configId,
        });
        if (config) {
          providerConfigs.set(configId, { slug: config.slug });
        }
      }

      // Create OpenAI client pointing to our gateway
      // Derive base URL from request origin, including basePath
      // Handle reverse proxy scenarios by checking forwarded headers
      const forwardedProto = c.req.header('x-forwarded-proto');
      const forwardedHost = c.req.header('x-forwarded-host') || c.req.header('host');
      const url = new URL(c.req.url);
      const protocol = forwardedProto ? `${forwardedProto}:` : url.protocol;
      const host = forwardedHost || url.host;
      const baseURL = `${protocol}//${host}`;
      const basePath = c.get('llmopsConfig')?.basePath || '';
      const gatewayPath = basePath === '/' ? '/api/genai/v1' : `${basePath}/api/genai/v1`;
      const gatewayBaseURL = `${baseURL}${gatewayPath}`;

      logger.debug({
        msg: 'Playground execute: constructing gateway URL',
        forwardedProto,
        forwardedHost,
        urlProtocol: url.protocol,
        urlHost: url.host,
        protocol,
        host,
        baseURL,
        basePath,
        gatewayPath,
        gatewayBaseURL,
      });

      const openai = new OpenAI({
        baseURL: gatewayBaseURL,
        apiKey: 'llmops',
      });

      // Update run status
      await db.updatePlaygroundRun({
        runId,
        status: 'running',
        startedAt: new Date(),
      });

      return streamSSE(c, async (stream) => {
        const sendEvent = async (event: SSEEvent) => {
          await stream.writeSSE({
            event: event.type,
            data: JSON.stringify(event.data),
          });
        };

        // Track completion counts
        let completedCount = 0;
        let failedCount = 0;

        // Process a single cell
        const processCell = async (result: (typeof pendingResults)[0]) => {
          const column = columnMap.get(result.columnId);
          if (!column) {
            failedCount++;
            await sendEvent({
              type: 'cell_failed',
              data: { resultId: result.id, error: 'Column not found' },
            });
            return;
          }

          if (!column.providerConfigId) {
            failedCount++;
            await sendEvent({
              type: 'cell_failed',
              data: {
                resultId: result.id,
                error: 'No provider configured for this column',
              },
            });
            return;
          }

          const providerConfig = providerConfigs.get(column.providerConfigId);
          if (!providerConfig || !providerConfig.slug) {
            failedCount++;
            await sendEvent({
              type: 'cell_failed',
              data: {
                resultId: result.id,
                error: 'Provider config not found or missing slug',
              },
            });
            return;
          }

          // Update result status to running
          await db.updatePlaygroundResult({
            resultId: result.id,
            status: 'running',
          });

          await sendEvent({
            type: 'cell_started',
            data: {
              resultId: result.id,
              columnId: result.columnId,
              recordId: result.datasetRecordId,
            },
          });

          const startTime = Date.now();
          let fullOutput = '';

          try {
            // Resolve template variables in messages
            const inputVariables = result.inputVariables as Record<
              string,
              unknown
            >;
            const resolvedMessages = column.messages.map((msg) => ({
              role: msg.role as 'system' | 'user' | 'assistant',
              content: resolveTemplateVariables(msg.content, inputVariables),
            }));

            // Construct model string with provider slug
            const model = `@${providerConfig.slug}/${column.modelName}`;

            // Make streaming call to gateway via OpenAI SDK
            const response = await openai.chat.completions.create({
              model,
              messages: resolvedMessages,
              temperature: column.temperature ?? undefined,
              max_tokens: column.maxTokens ?? undefined,
              top_p: column.topP ?? undefined,
              frequency_penalty: column.frequencyPenalty ?? undefined,
              presence_penalty: column.presencePenalty ?? undefined,
              stream: true,
              metadata: {
                llmops_feature: 'playground',
              },
            });

            // Stream tokens
            for await (const chunk of response) {
              const content = chunk.choices[0]?.delta?.content;
              if (content) {
                fullOutput += content;
                await sendEvent({
                  type: 'cell_token',
                  data: { resultId: result.id, token: content },
                });
              }
            }

            const latencyMs = Date.now() - startTime;

            // Update result with completion
            await db.updatePlaygroundResult({
              resultId: result.id,
              status: 'completed',
              outputContent: fullOutput,
              latencyMs,
              promptTokens: null,
              completionTokens: null,
              totalTokens: null,
            });

            completedCount++;
            await sendEvent({
              type: 'cell_completed',
              data: {
                resultId: result.id,
                output: fullOutput,
                latencyMs,
                promptTokens: null,
                completionTokens: null,
                totalTokens: null,
              },
            });
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : 'Unknown error';
            console.error(
              `Error executing cell ${result.id}:`,
              errorMessage
            );

            await db.updatePlaygroundResult({
              resultId: result.id,
              status: 'failed',
              error: errorMessage,
            });

            failedCount++;
            await sendEvent({
              type: 'cell_failed',
              data: { resultId: result.id, error: errorMessage },
            });
          }
        };

        try {
          await sendEvent({
            type: 'run_started',
            data: { runId, totalCells: pendingResults.length },
          });

          // Run all cells in parallel
          await Promise.all(pendingResults.map(processCell));

          // Mark run as completed
          await db.updatePlaygroundRun({
            runId,
            status: failedCount === pendingResults.length ? 'failed' : 'completed',
            completedAt: new Date(),
            completedRecords: completedCount + failedCount,
          });

          await sendEvent({
            type: 'run_completed',
            data: { runId, completedCount, failedCount },
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';
          console.error('Error during execution stream:', errorMessage);

          await db.updatePlaygroundRun({
            runId,
            status: 'failed',
            completedAt: new Date(),
          });

          await sendEvent({
            type: 'error',
            data: { message: errorMessage },
          });
        }
      });
    }
  );

export default app;
