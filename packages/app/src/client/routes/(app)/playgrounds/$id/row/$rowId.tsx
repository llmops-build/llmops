import { createFileRoute } from '@tanstack/react-router';
import { usePlaygroundById } from '@client/hooks/queries/usePlaygroundById';
import { useDatasetRecords } from '@client/hooks/queries/useDatasetRecords';
import { usePlaygroundRuns } from '@client/hooks/queries/usePlaygroundRuns';
import { usePlaygroundResults } from '@client/hooks/queries/usePlaygroundResults';
import type { PlaygroundColumn } from '@llmops/core';
import * as styles from './-components/row-detail.css';

export const Route = createFileRoute('/(app)/playgrounds/$id/row/$rowId')({
  component: RouteComponent,
  loader: async ({ params }) => {
    return { title: `Row ${params.rowId.slice(0, 8)}...` };
  },
});

function formatJson(value: unknown): string {
  if (value === null || value === undefined) return '';
  try {
    if (typeof value === 'string') {
      const parsed = JSON.parse(value);
      return JSON.stringify(parsed, null, 2);
    }
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function RouteComponent() {
  const { id: playgroundId, rowId } = Route.useParams();

  const { data: playground, isLoading: isLoadingPlayground } =
    usePlaygroundById(playgroundId);
  const { data: runs } = usePlaygroundRuns(playgroundId);
  const latestCompletedRun = runs?.find(
    (run) => run.status === 'completed' || run.status === 'failed'
  );
  const { data: results } = usePlaygroundResults(
    playgroundId,
    latestCompletedRun?.id ?? ''
  );

  const datasetId = playground?.datasetId ?? null;
  const { data: records, isLoading: isLoadingRecords } = useDatasetRecords(
    datasetId ?? '',
    { limit: 500 }
  );

  const columns = (playground?.columns as PlaygroundColumn[] | null) ?? [];
  const record = records?.find((r) => r.id === rowId);

  // Get results for this specific row
  const rowResults = results?.filter((r) => r.datasetRecordId === rowId) ?? [];

  if (isLoadingPlayground || isLoadingRecords) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading...</div>
      </div>
    );
  }

  if (!record) {
    return (
      <div className={styles.container}>
        <div className={styles.notFound}>Record not found</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Input</h3>
        <pre className={styles.codeBlock}>{formatJson(record.input)}</pre>
      </div>

      {columns.length > 0 && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Outputs</h3>
          <div className={styles.outputsGrid}>
            {columns.map((column) => {
              const result = rowResults.find((r) => r.columnId === column.id);
              return (
                <div key={column.id} className={styles.outputCard}>
                  <div className={styles.outputHeader}>
                    <span className={styles.outputTitle}>{column.name}</span>
                    {result?.latencyMs && (
                      <span className={styles.latency}>
                        {result.latencyMs}ms
                      </span>
                    )}
                  </div>
                  <div className={styles.outputContent}>
                    {result ? (
                      result.status === 'completed' ? (
                        <pre className={styles.outputText}>
                          {result.outputContent}
                        </pre>
                      ) : result.status === 'failed' ? (
                        <span className={styles.errorText}>
                          {result.error || 'Execution failed'}
                        </span>
                      ) : result.status === 'running' ? (
                        <span className={styles.runningText}>Running...</span>
                      ) : (
                        <span className={styles.pendingText}>Pending</span>
                      )
                    ) : (
                      <span className={styles.noResult}>Not executed yet</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {record.expected && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Expected Output</h3>
          <pre className={styles.codeBlock}>{formatJson(record.expected)}</pre>
        </div>
      )}

      {record.metadata && Object.keys(record.metadata).length > 0 && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Metadata</h3>
          <pre className={styles.codeBlock}>{formatJson(record.metadata)}</pre>
        </div>
      )}
    </div>
  );
}
