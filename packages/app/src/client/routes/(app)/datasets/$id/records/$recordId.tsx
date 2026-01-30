import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useForm, useWatch } from 'react-hook-form';
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@ui';
import { Icon } from '@client/components/icons';
import { Save, Trash2 } from 'lucide-react';
import { useDatasetRecords } from '@client/hooks/queries/useDatasetRecords';
import { useCreateDatasetRecord } from '@client/hooks/mutations/useCreateDatasetRecord';
import { useUpdateDatasetRecord } from '@client/hooks/mutations/useUpdateDatasetRecord';
import { useDeleteDatasetRecord } from '@client/hooks/mutations/useDeleteDatasetRecord';
import { JsonEditor } from './-components/json-editor';
import { DeleteConfirmDialog } from './-components/delete-confirm-dialog';
import * as styles from './-components/record-form.css';

type RecordFormData = {
  input: string;
  expected: string;
  metadata: string;
};

export const Route = createFileRoute('/(app)/datasets/$id/records/$recordId')({
  component: RouteComponent,
  loader: async ({ params }) => {
    if (params.recordId === 'new') {
      return { title: 'New Record' };
    }
    return { title: `Record` };
  },
});

function RouteComponent() {
  const { id: datasetId, recordId } = Route.useParams();
  const navigate = useNavigate();
  const isNew = recordId === 'new';

  const { data: records } = useDatasetRecords(datasetId);
  const createRecord = useCreateDatasetRecord();
  const updateRecord = useUpdateDatasetRecord();
  const deleteRecord = useDeleteDatasetRecord();

  const [errors, setErrors] = useState<{
    input?: string;
    expected?: string;
    metadata?: string;
  }>({});
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const record = records?.find((r) => r.id === recordId);

  const form = useForm<RecordFormData>({
    defaultValues: {
      input: '{\n  \n}',
      expected: '',
      metadata: '',
    },
  });

  // Watch form values to ensure re-renders when form.reset() is called
  const inputValue = useWatch({ control: form.control, name: 'input' });
  const expectedValue = useWatch({ control: form.control, name: 'expected' });
  const metadataValue = useWatch({ control: form.control, name: 'metadata' });

  // Load existing record data
  useEffect(() => {
    if (record && !isNew) {
      form.reset({
        input: formatJson(record.input),
        expected: record.expected ? formatJson(record.expected) : '',
        metadata: record.metadata ? formatJson(record.metadata) : '',
      });
    }
  }, [record, isNew]);

  const isSaving = createRecord.isPending || updateRecord.isPending;
  const isDeleting = deleteRecord.isPending;

  const handleInputChange = useCallback(
    (value: string) => form.setValue('input', value),
    [form]
  );

  const handleExpectedChange = useCallback(
    (value: string) => form.setValue('expected', value),
    [form]
  );

  const handleMetadataChange = useCallback(
    (value: string) => form.setValue('metadata', value),
    [form]
  );

  const handleBack = () => {
    navigate({ to: '/datasets/$id', params: { id: datasetId } });
  };

  const validateJson = (value: string, fieldName: string): boolean => {
    if (!value.trim()) return true;
    try {
      JSON.parse(value);
      return true;
    } catch {
      setErrors((prev) => ({
        ...prev,
        [fieldName]: 'Invalid JSON format',
      }));
      return false;
    }
  };

  const handleSave = async () => {
    setErrors({});
    const data = form.getValues();

    // Validate input (required)
    if (!data.input.trim()) {
      setErrors({ input: 'Input is required' });
      return;
    }

    const isInputValid = validateJson(data.input, 'input');
    const isExpectedValid = validateJson(data.expected, 'expected');
    const isMetadataValid = validateJson(data.metadata, 'metadata');

    if (!isInputValid || !isExpectedValid || !isMetadataValid) {
      return;
    }

    try {
      const input = JSON.parse(data.input);
      const expected = data.expected.trim() ? JSON.parse(data.expected) : null;
      const metadata = data.metadata.trim() ? JSON.parse(data.metadata) : {};

      if (isNew) {
        const result = await createRecord.mutateAsync({
          datasetId,
          input,
          expected,
          metadata,
        });
        // Navigate to the created record
        if (result?.id) {
          navigate({
            to: '/datasets/$id/records/$recordId',
            params: { id: datasetId, recordId: result.id },
            replace: true,
          });
        }
      } else {
        await updateRecord.mutateAsync({
          datasetId,
          recordId,
          input,
          expected,
          metadata,
        });
      }
    } catch (error) {
      console.error('Failed to save record:', error);
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteRecord.mutateAsync({ datasetId, recordId });
      setShowDeleteDialog(false);
      handleBack();
    } catch (error) {
      console.error('Failed to delete record:', error);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerActions}>
          {!isNew && (
            <Button
              variant="ghost"
              scheme="destructive"
              onClick={handleDeleteClick}
              disabled={isDeleting}
            >
              <Icon icon={Trash2} />
              Delete
            </Button>
          )}
          <Button variant="primary" onClick={handleSave} disabled={isSaving}>
            <Icon icon={Save} />
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      <div className={styles.formContainer}>
        <div className={styles.fieldGroup}>
          <label className={styles.label}>Input</label>
          <JsonEditor
            value={inputValue}
            onChange={handleInputChange}
            placeholder='{"key": "value"}'
            minHeight="5rem"
          />
          {errors.input && (
            <span className={styles.errorMessage}>{errors.input}</span>
          )}
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.label}>
            Expected
            <span className={styles.labelOptional}>(optional)</span>
          </label>
          <JsonEditor
            value={expectedValue}
            onChange={handleExpectedChange}
            placeholder='{"expected": "output"}'
            minHeight="3.5rem"
          />
          {errors.expected && (
            <span className={styles.errorMessage}>{errors.expected}</span>
          )}
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.label}>
            Metadata
            <span className={styles.labelOptional}>(optional)</span>
          </label>
          <JsonEditor
            value={metadataValue}
            onChange={handleMetadataChange}
            placeholder='{"tag": "example"}'
            minHeight="3.5rem"
          />
          {errors.metadata && (
            <span className={styles.errorMessage}>{errors.metadata}</span>
          )}
        </div>
      </div>

      <DeleteConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
}

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
