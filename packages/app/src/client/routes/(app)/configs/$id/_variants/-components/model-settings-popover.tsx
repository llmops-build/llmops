import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  Slider,
  Combobox,
} from '@llmops/ui';
import { Menu } from '@base-ui/react/menu';
import { ChevronDown, ChevronRight, Check } from 'lucide-react';
import { useProviderModels } from '@client/hooks/queries/useProviderModels';
import * as styles from './model-settings.css';
import { configTitleInput } from '../../../-components/configs.css';

type ProviderItem = {
  label: string;
  icon?: string;
  value: string;
};

const providers: ProviderItem[] | undefined =
  window.bootstrapData?.llmProviders?.map((provider) => {
    return {
      label: provider.name,
      icon: provider.imageURI,
      value: provider.key,
    };
  });

export type ModelSettings = {
  provider: string;
  modelName: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
};

type ModelSettingsPopoverProps = {
  value: ModelSettings;
  onChange: (settings: ModelSettings) => void;
};

function ChevronIcon({ className }: { className?: string }) {
  return <ChevronDown className={className} />;
}

// Helper to extract provider from model ID (e.g., "anthropic/claude-3" -> "Anthropic")
function getModelProvider(modelId: string): string {
  const parts = modelId.split('/');
  if (parts.length > 1) {
    // Capitalize first letter
    return parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
  }
  return 'Other';
}

type ModelMenuProps = {
  models: Array<{ id: string; name: string }> | undefined;
  isLoading: boolean;
  selectedModelName: string;
  onSelect: (modelName: string) => void;
};

function ModelMenu({
  models,
  isLoading,
  selectedModelName,
  onSelect,
}: ModelMenuProps) {
  // Group models by provider extracted from model ID
  const modelsByProvider = models?.reduce(
    (acc, model) => {
      const providerName = getModelProvider(model.id);
      if (!acc[providerName]) {
        acc[providerName] = [];
      }
      acc[providerName].push(model);
      return acc;
    },
    {} as Record<string, typeof models>
  );

  const providerNames = modelsByProvider
    ? Object.keys(modelsByProvider).sort()
    : [];

  // Get display name for selected model
  const selectedModel = models?.find((m) => m.id === selectedModelName);
  const displayName =
    selectedModel?.name || selectedModelName || 'Select a model';

  return (
    <Menu.Root modal={false}>
      <Menu.Trigger className={styles.modelMenuTrigger}>
        <span className={styles.menuItemText}>{displayName}</span>
        <ChevronDown className={styles.menuChevron} />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner
          className={styles.menuPositioner}
          side="bottom"
          sideOffset={4}
          align="start"
          positionMethod="fixed"
          sticky
        >
          <Menu.Popup className={styles.menuPopup}>
            {isLoading ? (
              <div className={styles.menuLoading}>Loading models...</div>
            ) : providerNames.length === 0 ? (
              <div className={styles.menuEmpty}>No models available</div>
            ) : (
              providerNames.map((providerName) => (
                <Menu.SubmenuRoot key={providerName}>
                  <Menu.SubmenuTrigger
                    className={styles.menuSubmenuTrigger}
                    openOnHover
                    delay={100}
                  >
                    <span className={styles.menuItemText}>{providerName}</span>
                    <ChevronRight className={styles.menuChevron} />
                  </Menu.SubmenuTrigger>
                  <Menu.Portal>
                    <Menu.Positioner
                      className={styles.menuPositioner}
                      side="right"
                      sideOffset={4}
                      align="start"
                      positionMethod="fixed"
                      sticky
                    >
                      <Menu.Popup className={styles.menuPopup}>
                        {modelsByProvider?.[providerName]?.map((model) => {
                          const isSelected = selectedModelName === model.id;
                          return (
                            <Menu.Item
                              key={model.id}
                              className={styles.menuItem}
                              onClick={() => onSelect(model.id)}
                            >
                              <span className={styles.menuItemText}>
                                {model.name || model.id}
                              </span>
                              {isSelected && (
                                <Check className={styles.menuCheckIcon} />
                              )}
                            </Menu.Item>
                          );
                        })}
                      </Menu.Popup>
                    </Menu.Positioner>
                  </Menu.Portal>
                </Menu.SubmenuRoot>
              ))
            )}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

export function ModelSettingsPopover({
  value,
  onChange,
}: ModelSettingsPopoverProps) {
  const { data: models, isLoading } = useProviderModels(value.provider);

  const selectedProviderItem =
    providers?.find((p) => p.value === value.provider) || null;

  const displayText = value.modelName
    ? value.modelName
    : value.provider
      ? 'Select model'
      : 'Select model';

  const handleProviderChange = (providerItem: ProviderItem | null) => {
    if (providerItem) {
      onChange({
        ...value,
        provider: providerItem.value,
        modelName: '', // Reset model when provider changes
      });
    }
  };

  const handleModelSelect = (modelName: string) => {
    onChange({
      ...value,
      modelName,
    });
  };

  const handleSettingChange = (
    key: keyof Omit<ModelSettings, 'provider' | 'modelName'>,
    newValue: number
  ) => {
    onChange({
      ...value,
      [key]: newValue,
    });
  };

  return (
    <Popover>
      <PopoverTrigger className={styles.modelSettingsTrigger}>
        {selectedProviderItem?.icon ? (
          <img
            src={selectedProviderItem.icon}
            alt=""
            style={{ width: 16, height: 16, flexShrink: 0 }}
          />
        ) : (
          <span className={styles.modelSettingsTriggerIcon}>?</span>
        )}
        <span
          className={
            value.modelName
              ? styles.modelSettingsTriggerText
              : `${styles.modelSettingsTriggerText} ${styles.modelSettingsPlaceholder}`
          }
        >
          {displayText}
        </span>
        <ChevronIcon className={styles.chevronIcon} />
      </PopoverTrigger>

      <PopoverContent
        side="bottom"
        align="start"
        sideOffset={4}
        positionMethod="fixed"
      >
        <div className={styles.modelSettingsPopupContent}>
          {/* Provider Selection */}
          <div className={styles.modelSettingsSection}>
            <span className={styles.modelSettingsSectionTitle}>Provider</span>
            <Combobox<ProviderItem>
              items={providers || []}
              value={selectedProviderItem}
              onValueChange={handleProviderChange}
              itemToString={(item) => item?.label || ''}
              itemToIcon={(item) =>
                item?.icon ? (
                  <img
                    src={item.icon}
                    alt=""
                    style={{ width: 16, height: 16 }}
                  />
                ) : (
                  <span className={styles.modelSettingsTriggerIcon}>
                    {item?.label?.charAt(0).toUpperCase() || '?'}
                  </span>
                )
              }
              placeholder="Select provider"
            />
          </div>

          {/* Model Selection */}
          <div className={styles.modelSettingsSection}>
            <span className={styles.modelSettingsSectionTitle}>Model</span>
            {value.provider ? (
              <ModelMenu
                models={models}
                isLoading={isLoading}
                selectedModelName={value.modelName}
                onSelect={handleModelSelect}
              />
            ) : (
              <div
                className={styles.modelMenuTrigger}
                style={{ color: 'var(--gray9)' }}
              >
                Select a provider first
              </div>
            )}
          </div>

          {/* Model Parameters */}
          <div className={styles.modelSettingsSection}>
            <span className={styles.modelSettingsSectionTitle}>Parameters</span>
            <div className={styles.modelSettingsSliderGroup}>
              <Slider
                label="Temperature"
                value={value.temperature ?? 1}
                min={0}
                max={2}
                step={0.1}
                onValueChange={(v) => handleSettingChange('temperature', v)}
                formatValue={(v) => v.toFixed(1)}
              />

              <div className={styles.modelSettingsField}>
                <label className={styles.modelSettingsFieldLabel}>
                  Max Tokens
                </label>
                <input
                  type="number"
                  className={configTitleInput}
                  value={value.maxTokens ?? ''}
                  placeholder="Default"
                  min={1}
                  onChange={(e) => {
                    const val = e.target.value
                      ? parseInt(e.target.value, 10)
                      : undefined;
                    onChange({
                      ...value,
                      maxTokens: val,
                    });
                  }}
                />
              </div>

              <Slider
                label="Top P"
                value={value.topP ?? 1}
                min={0}
                max={1}
                step={0.05}
                onValueChange={(v) => handleSettingChange('topP', v)}
                formatValue={(v) => v.toFixed(2)}
              />

              <Slider
                label="Frequency Penalty"
                value={value.frequencyPenalty ?? 0}
                min={-2}
                max={2}
                step={0.1}
                onValueChange={(v) =>
                  handleSettingChange('frequencyPenalty', v)
                }
                formatValue={(v) => v.toFixed(1)}
              />

              <Slider
                label="Presence Penalty"
                value={value.presencePenalty ?? 0}
                min={-2}
                max={2}
                step={0.1}
                onValueChange={(v) => handleSettingChange('presencePenalty', v)}
                formatValue={(v) => v.toFixed(1)}
              />
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
