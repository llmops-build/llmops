import { Popover, PopoverTrigger, PopoverContent, Slider } from '@llmops/ui';
import { Menu } from '@base-ui/react/menu';
import { ChevronDown, ChevronRight, Check } from 'lucide-react';
import { useProviderModels } from '@client/hooks/queries/useProviderModels';
import * as styles from './model-settings.css';
import { configTitleInput } from '../../../-components/configs.css';

const providers = window.bootstrapData?.llmProviders?.map((provider) => {
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

type ProviderSubmenuProps = {
  provider: { label: string; icon?: string; value: string };
  selectedProvider: string;
  selectedModelName: string;
  onSelect: (provider: string, modelName: string) => void;
};

function ProviderSubmenu({
  provider,
  selectedProvider,
  selectedModelName,
  onSelect,
}: ProviderSubmenuProps) {
  const { data: models, isLoading } = useProviderModels(provider.value);

  // Group models by their provider.name (e.g., "Anthropic", "OpenAI")
  const modelsByProvider = models?.reduce(
    (acc, model) => {
      const providerName = model.provider?.name || 'Other';
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

  return (
    <Menu.SubmenuRoot>
      <Menu.SubmenuTrigger
        className={styles.menuSubmenuTrigger}
        openOnHover
        delay={100}
      >
        {provider.icon ? (
          <img src={provider.icon} alt="" className={styles.menuItemIcon} />
        ) : (
          <span className={styles.modelSettingsTriggerIcon}>
            {provider.label.charAt(0).toUpperCase()}
          </span>
        )}
        <span className={styles.menuItemText}>{provider.label}</span>
        <ChevronRight className={styles.menuChevron} />
      </Menu.SubmenuTrigger>
      <Menu.Portal>
        <Menu.Positioner
          className={styles.menuPositioner}
          side="right"
          sideOffset={4}
          align="start"
        >
          <Menu.Popup className={styles.menuPopup}>
            {isLoading ? (
              <div className={styles.menuLoading}>Loading models...</div>
            ) : providerNames.length === 0 ? (
              <div className={styles.menuEmpty}>No models available</div>
            ) : (
              providerNames.map((providerName, index) => (
                <Menu.Group key={providerName}>
                  {index > 0 && (
                    <Menu.Separator className={styles.menuSeparator} />
                  )}
                  <Menu.GroupLabel className={styles.menuGroupLabel}>
                    {providerName}
                  </Menu.GroupLabel>
                  {modelsByProvider?.[providerName]?.map((model) => {
                    const isSelected =
                      selectedProvider === provider.value &&
                      selectedModelName === model.id;
                    return (
                      <Menu.Item
                        key={model.id}
                        className={styles.menuItem}
                        onClick={() => onSelect(provider.value, model.id)}
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
                </Menu.Group>
              ))
            )}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.SubmenuRoot>
  );
}

export function ModelSettingsPopover({
  value,
  onChange,
}: ModelSettingsPopoverProps) {
  const { data: models } = useProviderModels(value.provider);

  const selectedModel = models?.find((m) => m.id === value.modelName);
  const selectedProvider = providers?.find((p) => p.value === value.provider);

  const displayText = value.modelName
    ? value.modelName
    : value.provider
      ? 'Select model'
      : 'Select model';

  const handleModelSelect = (provider: string, modelName: string) => {
    onChange({
      ...value,
      provider,
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
        {selectedModel?.provider ? (
          <span className={styles.modelSettingsTriggerIcon}>
            {selectedModel.provider.name.charAt(0).toUpperCase()}
          </span>
        ) : selectedProvider?.icon ? (
          <img
            src={selectedProvider.icon}
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

      <PopoverContent side="bottom" align="start" sideOffset={4}>
        <div className={styles.modelSettingsPopupContent}>
          {/* Multi-level Model Selection */}
          <div className={styles.modelSettingsSection}>
            <span className={styles.modelSettingsSectionTitle}>Model</span>
            <Menu.Root modal={false}>
              <Menu.Trigger className={styles.modelMenuTrigger}>
                {selectedModel?.provider ? (
                  <span className={styles.modelSettingsTriggerIcon}>
                    {selectedModel.provider.name.charAt(0).toUpperCase()}
                  </span>
                ) : selectedProvider?.icon ? (
                  <img
                    src={selectedProvider.icon}
                    alt=""
                    className={styles.menuItemIcon}
                  />
                ) : (
                  <span className={styles.modelSettingsTriggerIcon}>?</span>
                )}
                <span className={styles.menuItemText}>
                  {value.modelName || 'Select a model'}
                </span>
                <ChevronDown className={styles.menuChevron} />
              </Menu.Trigger>
              <Menu.Portal>
                <Menu.Positioner
                  className={styles.menuPositioner}
                  side="bottom"
                  sideOffset={4}
                  align="start"
                >
                  <Menu.Popup className={styles.menuPopup}>
                    {providers?.map((provider) => (
                      <ProviderSubmenu
                        key={provider.value}
                        provider={provider}
                        selectedProvider={value.provider}
                        selectedModelName={value.modelName}
                        onSelect={handleModelSelect}
                      />
                    ))}
                  </Menu.Popup>
                </Menu.Positioner>
              </Menu.Portal>
            </Menu.Root>
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
