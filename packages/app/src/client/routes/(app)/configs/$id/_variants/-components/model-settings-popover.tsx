import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  Combobox,
  Slider,
} from '@llmops/ui';
import { ChevronDown } from 'lucide-react';
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

const providerItems = providers?.map((provider) => provider.value) || [];

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

  const handleProviderChange = (newProvider: string | null) => {
    onChange({
      ...value,
      provider: newProvider || '',
      modelName: '', // Reset model when provider changes
    });
  };

  const handleModelChange = (newModel: string | null) => {
    onChange({
      ...value,
      modelName: newModel || '',
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
          {/* Provider Selection */}
          <div className={styles.modelSettingsSection}>
            <span className={styles.modelSettingsSectionTitle}>Provider</span>
            <Combobox
              items={providerItems}
              value={value.provider}
              itemToString={(item) => {
                return providers?.find((p) => p.value === item)?.label || '';
              }}
              itemToIcon={(item) => {
                const src =
                  providers?.find((p) => p.value === item)?.icon || '';
                if (src) {
                  return (
                    <img src={src} alt="" style={{ width: 16, height: 16 }} />
                  );
                }
                return null;
              }}
              placeholder="Select provider"
              onValueChange={handleProviderChange}
            />
          </div>

          {/* Model Selection */}
          <div className={styles.modelSettingsSection}>
            <span className={styles.modelSettingsSectionTitle}>Model</span>
            <Combobox
              key={value.provider}
              items={models?.map((model) => model.id) || []}
              value={value.modelName}
              itemToIcon={(item) => {
                const model = models?.find((m) => m.id === item);
                if (!model?.provider) return null;
                return (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 16,
                      height: 16,
                      fontSize: 10,
                      fontWeight: 600,
                      backgroundColor: 'var(--color-bg-tertiary)',
                      borderRadius: 4,
                    }}
                  >
                    {model.provider.name.charAt(0).toUpperCase()}
                  </span>
                );
              }}
              placeholder="Select model"
              onValueChange={handleModelChange}
            />
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
