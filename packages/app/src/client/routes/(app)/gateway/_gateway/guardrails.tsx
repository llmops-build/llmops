import { Icon } from '@client/components/icons';
import { createFileRoute } from '@tanstack/react-router';
import { ArrowLeft, Pencil, Shield, Trash2 } from 'lucide-react';
import { useState, useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { AlertDialog } from '@base-ui/react/alert-dialog';
import { Button, Combobox } from '@ui';
import {
  useAvailableGuardrails,
  type AvailableGuardrail,
} from '@client/hooks/queries/useAvailableGuardrails';
import {
  useGuardrailConfigs,
  type GuardrailConfig,
} from '@client/hooks/queries/useGuardrailConfigs';
import { useCreateGuardrailConfig } from '@client/hooks/mutations/useCreateGuardrailConfig';
import { useUpdateGuardrailConfig } from '@client/hooks/mutations/useUpdateGuardrailConfig';
import { useDeleteGuardrailConfig } from '@client/hooks/mutations/useDeleteGuardrailConfig';
import { GuardrailFieldRenderer } from '../-components/guardrail-field-renderer';
import * as styles from '../-components/guardrails.css';

export const Route = createFileRoute('/(app)/gateway/_gateway/guardrails')({
  component: RouteComponent,
  staticData: {
    customData: {
      title: 'Guardrails',
      icon: <Icon icon={Shield} />,
    },
  },
});

type ViewMode = 'list' | 'add' | 'edit';
type HookFilter = 'all' | 'beforeRequestHook' | 'afterRequestHook';

interface GuardrailFormData {
  name: string;
  hookType: 'beforeRequestHook' | 'afterRequestHook';
  parameters: Record<string, unknown>;
  priority: number;
  onFail: 'block' | 'log';
}

const defaultFormValues: GuardrailFormData = {
  name: '',
  hookType: 'beforeRequestHook',
  parameters: {},
  priority: 0,
  onFail: 'block',
};

function RouteComponent() {
  const { data: guardrailConfigs, isLoading } = useGuardrailConfigs();
  const { data: availableGuardrails } = useAvailableGuardrails();
  const createGuardrail = useCreateGuardrailConfig();
  const updateGuardrail = useUpdateGuardrailConfig();
  const deleteGuardrail = useDeleteGuardrailConfig();

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [hookFilter, setHookFilter] = useState<HookFilter>('all');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedGuardrail, setSelectedGuardrail] =
    useState<AvailableGuardrail | null>(null);
  const [editingConfig, setEditingConfig] = useState<GuardrailConfig | null>(
    null
  );

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { isSubmitting },
  } = useForm<GuardrailFormData>({
    defaultValues: defaultFormValues,
  });

  const formValues = watch();

  // Get guardrail info by function ID
  const getGuardrailInfo = useCallback(
    (functionId: string) => {
      return availableGuardrails?.find((g) => g.id === functionId);
    },
    [availableGuardrails]
  );

  const handleOpenAdd = () => {
    setSelectedGuardrail(null);
    setEditingConfig(null);
    reset(defaultFormValues);
    setViewMode('add');
  };

  const handleOpenEdit = (config: GuardrailConfig) => {
    setEditingConfig(config);
    const guardrailInfo = getGuardrailInfo(config.functionId);
    setSelectedGuardrail(guardrailInfo || null);
    reset({
      name: config.name,
      hookType: config.hookType,
      parameters: config.parameters || {},
      priority: config.priority,
      onFail: config.onFail,
    });
    setViewMode('edit');
  };

  const handleBack = () => {
    setViewMode('list');
    setSelectedGuardrail(null);
    setEditingConfig(null);
    reset(defaultFormValues);
  };

  const handleOpenDeleteDialog = (config: GuardrailConfig) => {
    setEditingConfig(config);
    setIsDeleteDialogOpen(true);
  };

  const handleParameterChange = (fieldName: string, value: unknown) => {
    setValue(
      'parameters',
      { ...formValues.parameters, [fieldName]: value },
      { shouldDirty: true }
    );
  };

  // Reset parameters when guardrail changes in add mode
  useEffect(() => {
    if (viewMode === 'add' && selectedGuardrail) {
      // Set default hook type based on supported hooks
      const defaultHook = selectedGuardrail.supportedHooks[0];
      setValue('hookType', defaultHook);
      setValue('parameters', {});
    }
  }, [selectedGuardrail, viewMode, setValue]);

  const isFormValid = () => {
    if (!selectedGuardrail) return false;
    if (!formValues.name.trim()) return false;
    // Check required parameters
    const requiredParams =
      selectedGuardrail.parameters?.required || [];
    for (const param of requiredParams) {
      const value = formValues.parameters[param];
      if (value === undefined || value === null || value === '') {
        return false;
      }
    }
    return true;
  };

  const onSubmit = async (data: GuardrailFormData) => {
    if (!selectedGuardrail) return;

    if (viewMode === 'edit' && editingConfig) {
      await updateGuardrail.mutateAsync({
        id: editingConfig.id,
        name: data.name.trim(),
        hookType: data.hookType,
        parameters: data.parameters,
        priority: data.priority,
        onFail: data.onFail,
      });
    } else {
      await createGuardrail.mutateAsync({
        name: data.name.trim(),
        pluginId: 'default',
        functionId: selectedGuardrail.id,
        hookType: data.hookType,
        parameters: data.parameters,
        priority: data.priority,
        onFail: data.onFail,
      });
    }

    handleBack();
  };

  const handleDeleteGuardrail = async () => {
    if (!editingConfig) return;

    await deleteGuardrail.mutateAsync({
      id: editingConfig.id,
    });

    setIsDeleteDialogOpen(false);
    setEditingConfig(null);
  };

  const handleToggleEnabled = async (config: GuardrailConfig) => {
    await updateGuardrail.mutateAsync({
      id: config.id,
      enabled: !config.enabled,
    });
  };

  // Filter guardrails based on hook type
  const filteredConfigs = guardrailConfigs?.filter((config) => {
    if (hookFilter === 'all') return true;
    return config.hookType === hookFilter;
  });

  if (isLoading) {
    return <div className={styles.guardrailsContainer}>Loading...</div>;
  }

  // Add/Edit view
  if (viewMode === 'add' || viewMode === 'edit') {
    return (
      <div className={styles.guardrailsContainer}>
        <button className={styles.backButton} onClick={handleBack}>
          <Icon icon={ArrowLeft} />
          Back to Guardrails
        </button>

        <form
          className={styles.formContainer}
          onSubmit={handleSubmit(onSubmit)}
        >
          {viewMode === 'add' ? (
            <div className={styles.formField}>
              <label className={styles.formFieldLabel}>Guardrail *</label>
              <Combobox<AvailableGuardrail>
                items={availableGuardrails || []}
                value={selectedGuardrail}
                onValueChange={setSelectedGuardrail}
                itemToString={(item) => item?.name ?? ''}
                placeholder="Select a guardrail..."
              />
            </div>
          ) : (
            <div className={styles.formField}>
              <label className={styles.formFieldLabel}>Guardrail</label>
              <div className={styles.guardrailDisplay}>
                <span className={styles.guardrailDisplayName}>
                  {selectedGuardrail?.name}
                </span>
                <span className={styles.guardrailDisplayDescription}>
                  {selectedGuardrail?.description?.[0]?.text}
                </span>
              </div>
            </div>
          )}

          {selectedGuardrail && (
            <>
              <div className={styles.formField}>
                <label className={styles.formFieldLabel}>Name *</label>
                <input
                  type="text"
                  className={styles.formInput}
                  placeholder="e.g., Block Credit Card Numbers"
                  {...register('name')}
                />
              </div>

              <div className={styles.formField}>
                <label className={styles.formFieldLabel}>Hook Type *</label>
                <div className={styles.hookTypeSelector}>
                  {selectedGuardrail.supportedHooks.includes(
                    'beforeRequestHook'
                  ) && (
                    <button
                      type="button"
                      className={styles.hookTypeOption}
                      data-selected={
                        formValues.hookType === 'beforeRequestHook'
                      }
                      onClick={() => setValue('hookType', 'beforeRequestHook')}
                    >
                      Before Request
                    </button>
                  )}
                  {selectedGuardrail.supportedHooks.includes(
                    'afterRequestHook'
                  ) && (
                    <button
                      type="button"
                      className={styles.hookTypeOption}
                      data-selected={formValues.hookType === 'afterRequestHook'}
                      onClick={() => setValue('hookType', 'afterRequestHook')}
                    >
                      After Response
                    </button>
                  )}
                </div>
              </div>

              {selectedGuardrail.parameters?.properties &&
                Object.keys(selectedGuardrail.parameters.properties).length >
                  0 && (
                  <div className={styles.formSection}>
                    <div className={styles.formSectionTitle}>Parameters</div>
                    <GuardrailFieldRenderer
                      parameters={selectedGuardrail.parameters}
                      values={formValues.parameters}
                      onChange={handleParameterChange}
                    />
                  </div>
                )}

              <div className={styles.formSection}>
                <div className={styles.formSectionTitle}>Behavior</div>
                <div className={styles.formRow}>
                  <div className={styles.formField}>
                    <label className={styles.formFieldLabel}>On Fail</label>
                    <select
                      className={styles.formSelect}
                      {...register('onFail')}
                    >
                      <option value="block">Block request</option>
                      <option value="log">Log only</option>
                    </select>
                  </div>
                  <div className={styles.formField}>
                    <label className={styles.formFieldLabel}>Priority</label>
                    <input
                      type="number"
                      className={styles.formInput}
                      {...register('priority', { valueAsNumber: true })}
                    />
                    <span className={styles.formFieldDescription}>
                      Higher priority runs first
                    </span>
                  </div>
                </div>
              </div>

              <div className={styles.formActions}>
                <Button
                  type="submit"
                  disabled={
                    !isFormValid() ||
                    isSubmitting ||
                    createGuardrail.isPending ||
                    updateGuardrail.isPending
                  }
                >
                  {createGuardrail.isPending || updateGuardrail.isPending
                    ? 'Saving...'
                    : 'Save Guardrail'}
                </Button>
              </div>
            </>
          )}
        </form>
      </div>
    );
  }

  // List view
  return (
    <div className={styles.guardrailsContainer}>
      <div className={styles.guardrailsHeader}>
        <h2 className={styles.guardrailsTitle}>Guardrails</h2>
        <p className={styles.guardrailsDescription}>
          Configure input/output validation rules for your gateway.
        </p>
      </div>

      <div className={styles.filterBar}>
        <button
          className={styles.filterButton}
          data-active={hookFilter === 'all'}
          onClick={() => setHookFilter('all')}
        >
          All
        </button>
        <button
          className={styles.filterButton}
          data-active={hookFilter === 'beforeRequestHook'}
          onClick={() => setHookFilter('beforeRequestHook')}
        >
          Before Request
        </button>
        <button
          className={styles.filterButton}
          data-active={hookFilter === 'afterRequestHook'}
          onClick={() => setHookFilter('afterRequestHook')}
        >
          After Response
        </button>
      </div>

      <div className={styles.guardrailsTableContainer}>
        <div className={styles.guardrailsTableHeader}>
          <span>Name</span>
          <span>Function</span>
          <span>Hook</span>
          <span>Status</span>
          <span>Actions</span>
        </div>
        {filteredConfigs && filteredConfigs.length > 0 ? (
          filteredConfigs.map((config) => {
            const guardrailInfo = getGuardrailInfo(config.functionId);
            return (
              <div key={config.id} className={styles.guardrailRow}>
                <div className={styles.guardrailInfo}>
                  <span className={styles.guardrailName}>{config.name}</span>
                </div>
                <span className={styles.guardrailFunction}>
                  {guardrailInfo?.name || config.functionId}
                </span>
                <span
                  className={`${styles.hookTypeBadge} ${
                    config.hookType === 'beforeRequestHook'
                      ? styles.hookTypeBefore
                      : styles.hookTypeAfter
                  }`}
                >
                  {config.hookType === 'beforeRequestHook' ? 'BEFORE' : 'AFTER'}
                </span>
                <div className={styles.statusToggle}>
                  <button
                    type="button"
                    className={styles.toggleSwitch}
                    data-checked={config.enabled}
                    onClick={() => handleToggleEnabled(config)}
                    aria-label={config.enabled ? 'Disable' : 'Enable'}
                  >
                    <span className={styles.toggleKnob} />
                  </button>
                </div>
                <div className={styles.guardrailActions}>
                  <Button
                    size="icon"
                    variant="ghost"
                    scheme="gray"
                    onClick={() => handleOpenEdit(config)}
                  >
                    <Icon icon={Pencil} />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    scheme="destructive"
                    onClick={() => handleOpenDeleteDialog(config)}
                  >
                    <Icon icon={Trash2} />
                  </Button>
                </div>
              </div>
            );
          })
        ) : (
          <div className={styles.emptyState}>
            No guardrails configured yet. Add your first guardrail to get
            started.
          </div>
        )}
      </div>

      <button className={styles.addButton} onClick={handleOpenAdd}>
        Add guardrail
      </button>

      {/* Delete Confirmation Dialog */}
      <AlertDialog.Root
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialog.Portal>
          <AlertDialog.Backdrop className={styles.backdrop} />
          <AlertDialog.Popup className={styles.popup}>
            <AlertDialog.Title className={styles.dialogTitle}>
              Delete Guardrail
            </AlertDialog.Title>
            <p
              style={{
                margin: 0,
                color: 'var(--gray11)',
                fontSize: '0.875rem',
              }}
            >
              Are you sure you want to delete the{' '}
              <strong>{editingConfig?.name}</strong> guardrail? This action
              cannot be undone.
            </p>
            <div className={styles.dialogActions}>
              <AlertDialog.Close className={styles.cancelButton}>
                Cancel
              </AlertDialog.Close>
              <Button
                scheme="destructive"
                onClick={handleDeleteGuardrail}
                disabled={deleteGuardrail.isPending}
              >
                {deleteGuardrail.isPending ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </AlertDialog.Popup>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </div>
  );
}
