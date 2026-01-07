import { Icon } from '@client/components/icons';
import { createFileRoute } from '@tanstack/react-router';
import { ArrowLeft, Pencil, Plug, Trash2 } from 'lucide-react';
import { useState, useCallback } from 'react';
import { AlertDialog } from '@base-ui/react/alert-dialog';
import { Button, Combobox } from '@ui';
import { useProviderConfigs } from '@client/hooks/queries/useProviderConfigs';
import {
  useProvidersList,
  type ProviderInfo,
} from '@client/hooks/queries/useProvidersList';
import { useUpsertProviderConfig } from '@client/hooks/mutations/useUpsertProviderConfig';
import { useDeleteProviderConfig } from '@client/hooks/mutations/useDeleteProviderConfig';
import { ProviderConfigFields } from './-components/ProviderConfigFields';
import { getRequiredFields } from './-components/provider-field-definitions';
import * as styles from './-components/workspace-providers.css';

export const Route = createFileRoute(
  '/(app)/settings/_settings/workspace-providers'
)({
  component: RouteComponent,
  staticData: {
    customData: {
      title: 'Providers',
      icon: <Icon icon={Plug} />,
    },
  },
});

type ProviderConfig = {
  id: string;
  providerId: string;
  config: Record<string, unknown>;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
};

type ViewMode = 'list' | 'add' | 'edit';

function RouteComponent() {
  const { data: providerConfigs, isLoading } = useProviderConfigs();
  const { data: availableProviders } = useProvidersList();
  const upsertProvider = useUpsertProviderConfig();
  const deleteProvider = useDeleteProviderConfig();

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<ProviderInfo | null>(
    null
  );
  const [configValues, setConfigValues] = useState<Record<string, string>>({});
  const [editingConfig, setEditingConfig] = useState<ProviderConfig | null>(
    null
  );

  // Get provider info by ID
  const getProviderInfo = useCallback(
    (providerId: string) => {
      return availableProviders?.find((p) => p.id === providerId);
    },
    [availableProviders]
  );

  // Filter out providers that are already configured
  const availableProvidersForAdd = useCallback(() => {
    if (!availableProviders) return availableProviders;
    const configuredProviderIds =
      providerConfigs?.map((c) => c.providerId) || [];
    return availableProviders.filter(
      (p) => !configuredProviderIds.includes(p.id)
    );
  }, [availableProviders, providerConfigs]);

  const handleOpenAdd = () => {
    setSelectedProvider(null);
    setConfigValues({});
    setEditingConfig(null);
    setViewMode('add');
  };

  const handleOpenEdit = (config: ProviderConfig) => {
    setEditingConfig(config);
    const providerInfo = getProviderInfo(config.providerId);
    setSelectedProvider(providerInfo || null);
    // Populate all config values from existing config
    const existingConfig = config.config as Record<string, string>;
    setConfigValues(existingConfig || {});
    setViewMode('edit');
  };

  const handleBack = () => {
    setViewMode('list');
    setSelectedProvider(null);
    setConfigValues({});
    setEditingConfig(null);
  };

  const handleOpenDeleteDialog = (config: ProviderConfig) => {
    setEditingConfig(config);
    setIsDeleteDialogOpen(true);
  };

  const handleConfigFieldChange = (fieldName: string, value: string) => {
    setConfigValues((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  // Check if all required fields are filled
  const isFormValid = () => {
    if (!selectedProvider) return false;
    const requiredFields = getRequiredFields(selectedProvider.id);
    return requiredFields.every((field) => configValues[field]?.trim());
  };

  const handleSaveProvider = async () => {
    if (!selectedProvider) return;

    // Filter out empty values
    const cleanedConfig = Object.fromEntries(
      Object.entries(configValues).filter(([, v]) => v?.trim())
    );

    await upsertProvider.mutateAsync({
      providerId: selectedProvider.id,
      config: cleanedConfig,
      enabled: true,
    });

    handleBack();
  };

  const handleDeleteProvider = async () => {
    if (!editingConfig) return;

    await deleteProvider.mutateAsync({
      id: editingConfig.id,
    });

    setIsDeleteDialogOpen(false);
    setEditingConfig(null);
  };

  if (isLoading) {
    return <div className={styles.providersContainer}>Loading...</div>;
  }

  // Add/Edit view
  if (viewMode === 'add' || viewMode === 'edit') {
    return (
      <div className={styles.providersContainer}>
        <button className={styles.backButton} onClick={handleBack}>
          <Icon icon={ArrowLeft} />
          Back to Providers
        </button>

        <div className={styles.formContainer}>
          {viewMode === 'add' ? (
            <div className={styles.formField}>
              <label className={styles.formFieldLabel}>Provider</label>
              <Combobox<ProviderInfo>
                items={availableProvidersForAdd() || []}
                value={selectedProvider}
                onValueChange={setSelectedProvider}
                itemToString={(item) => item?.name ?? ''}
                itemToIcon={(item) =>
                  item?.logo ? (
                    <img
                      src={item.logo}
                      alt={item.name}
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: 2,
                        objectFit: 'contain',
                      }}
                    />
                  ) : null
                }
                placeholder="Select provider"
              />
            </div>
          ) : (
            <div className={styles.formField}>
              <label className={styles.formFieldLabel}>Provider</label>
              <div className={styles.providerDisplay}>
                {selectedProvider?.logo && (
                  <img
                    src={selectedProvider.logo}
                    alt={selectedProvider.name}
                    className={styles.providerLogo}
                  />
                )}
                <span>{selectedProvider?.name}</span>
              </div>
            </div>
          )}

          {selectedProvider && (
            <ProviderConfigFields
              providerId={selectedProvider.id}
              configValues={configValues}
              onChange={handleConfigFieldChange}
            />
          )}

          <div className={styles.formActions}>
            <Button
              onClick={handleSaveProvider}
              disabled={!isFormValid() || upsertProvider.isPending}
            >
              {upsertProvider.isPending ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // List view
  return (
    <div className={styles.providersContainer}>
      <div className={styles.providersHeader}>
        <h2 className={styles.providersTitle}>Providers</h2>
        <p className={styles.providersDescription}>
          Configure API keys for your LLM providers.
        </p>
      </div>

      <div className={styles.providersTableContainer}>
        <div className={styles.providersTableHeader}>
          <span>Name</span>
          <span>Actions</span>
        </div>
        {providerConfigs && providerConfigs.length > 0 ? (
          providerConfigs.map((config) => {
            const providerInfo = getProviderInfo(config.providerId);
            return (
              <div key={config.id} className={styles.providerRow}>
                <div className={styles.providerInfo}>
                  {providerInfo?.logo && (
                    <img
                      src={providerInfo.logo}
                      alt={providerInfo.name}
                      className={styles.providerLogo}
                    />
                  )}
                  <span className={styles.providerName}>
                    {providerInfo?.name || config.providerId}
                  </span>
                </div>
                <div className={styles.providerActions}>
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
            No providers configured yet. Add your first provider to get started.
          </div>
        )}
      </div>

      <button className={styles.addButton} onClick={handleOpenAdd}>
        Add provider
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
              Delete Provider
            </AlertDialog.Title>
            <p
              style={{
                margin: 0,
                color: 'var(--gray11)',
                fontSize: '0.875rem',
              }}
            >
              Are you sure you want to delete the{' '}
              <strong>
                {getProviderInfo(editingConfig?.providerId || '')?.name}
              </strong>{' '}
              provider configuration? This action cannot be undone.
            </p>
            <div className={styles.dialogActions}>
              <AlertDialog.Close className={styles.cancelButton}>
                Cancel
              </AlertDialog.Close>
              <button
                className={styles.deleteButton}
                onClick={handleDeleteProvider}
                disabled={deleteProvider.isPending}
                style={{
                  backgroundColor: 'var(--error9)',
                  color: 'white',
                }}
              >
                {deleteProvider.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </AlertDialog.Popup>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </div>
  );
}
