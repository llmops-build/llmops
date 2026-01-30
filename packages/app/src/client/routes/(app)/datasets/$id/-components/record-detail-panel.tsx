import { X, Trash2 } from 'lucide-react';
import { Button } from '@ui';
import { Icon } from '@client/components/icons';
import { useDatasetRecords } from '@client/hooks/queries/useDatasetRecords';
import { useDeleteDatasetRecord } from '@client/hooks/mutations/useDeleteDatasetRecord';
import { format } from 'date-fns';
import * as styles from './record-detail-panel.css';

type RecordDetailPanelProps = {
  datasetId: string;
  recordId: string;
  onClose: () => void;
};

function formatJson(value: unknown): string {
  if (value === null || value === undefined) return '';
  try {
    if (typeof value === 'string') {
      // Try to parse if it's a JSON string
      const parsed = JSON.parse(value);
      return JSON.stringify(parsed, null, 2);
    }
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export function RecordDetailPanel({
  datasetId,
  recordId,
  onClose,
}: RecordDetailPanelProps) {
  const { data: records } = useDatasetRecords(datasetId);
  const deleteRecord = useDeleteDatasetRecord();

  const record = records?.find((r) => r.id === recordId);

  if (!record) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <span className={styles.headerTitle}>Record not found</span>
          <button className={styles.closeButton} onClick={onClose}>
            <X size={16} />
          </button>
        </div>
      </div>
    );
  }

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this record?')) {
      await deleteRecord.mutateAsync({ datasetId, recordId });
      onClose();
    }
  };

  const inputJson = formatJson(record.input);
  const expectedJson = formatJson(record.expected);
  const metadataJson = formatJson(record.metadata);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.headerTitle}>Record Details</span>
        <button className={styles.closeButton} onClick={onClose}>
          <X size={16} />
        </button>
      </div>

      <div className={styles.content}>
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTitle}>Input</span>
          </div>
          {inputJson ? (
            <pre className={styles.codeBlock}>{inputJson}</pre>
          ) : (
            <div className={styles.emptyValue}>No input data</div>
          )}
        </div>

        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTitle}>Expected</span>
          </div>
          {expectedJson ? (
            <pre className={styles.codeBlock}>{expectedJson}</pre>
          ) : (
            <div className={styles.emptyValue}>null</div>
          )}
        </div>

        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTitle}>Metadata</span>
          </div>
          {metadataJson && metadataJson !== '{}' ? (
            <pre className={styles.codeBlock}>{metadataJson}</pre>
          ) : (
            <div className={styles.emptyValue}>No metadata</div>
          )}
        </div>
      </div>

      <div className={styles.metadata}>
        <div className={styles.metadataItem}>
          <span className={styles.metadataLabel}>Created</span>
          <span className={styles.metadataValue}>
            {format(new Date(record.createdAt), 'MMM d, yyyy h:mm a')}
          </span>
        </div>
        <div className={styles.metadataItem}>
          <span className={styles.metadataLabel}>Updated</span>
          <span className={styles.metadataValue}>
            {format(new Date(record.updatedAt), 'MMM d, yyyy h:mm a')}
          </span>
        </div>
      </div>

      <div className={styles.actions}>
        <Button
          variant="outline"
          scheme="destructive"
          onClick={handleDelete}
          disabled={deleteRecord.isPending}
        >
          <Icon icon={Trash2} />
          {deleteRecord.isPending ? 'Deleting...' : 'Delete Record'}
        </Button>
      </div>
    </div>
  );
}
