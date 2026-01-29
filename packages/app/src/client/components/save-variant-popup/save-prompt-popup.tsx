import { useState } from 'react';
import { Button, Popover, PopoverTrigger, PopoverContent, Combobox } from '@ui';
import { Check, Save } from 'lucide-react';
import { useEnvironments } from '@client/hooks/queries/useEnvironments';
import { useConfigList } from '@client/hooks/queries/useConfigList';
import { useConfigVariants } from '@client/hooks/queries/useConfigVariants';
import { Icon } from '@client/components/icons';
import * as styles from './save-variant-popup.css';

export type SavePromptMode = 'new_prompt' | 'new_variant' | 'new_version';

export type SavePromptOptions = {
  mode: SavePromptMode;
  promptName?: string;
  variantName?: string;
  configId?: string;
  variantId?: string;
  deployToEnvironment: boolean;
  environmentId: string | null;
};

type ConfigItem = {
  id: string;
  name: string;
};

type VariantItem = {
  id: string;
  variantId: string;
  name: string;
};

type EnvironmentItem = {
  id: string;
  name: string;
  slug: string;
  isProd: boolean;
};

type SavePromptPopupProps = {
  defaultPromptName?: string;
  defaultVariantName?: string;
  onSave: (options: SavePromptOptions) => void;
  isSaving?: boolean;
  buttonLabel?: string;
  buttonVariant?: 'primary' | 'outline' | 'ghost';
};

export function SavePromptPopup({
  defaultPromptName = '',
  defaultVariantName = '',
  onSave,
  isSaving = false,
  buttonLabel = 'Save Prompt',
  buttonVariant = 'ghost',
}: SavePromptPopupProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<SavePromptMode>('new_prompt');
  const [promptName, setPromptName] = useState(defaultPromptName);
  const [variantName, setVariantName] = useState(defaultVariantName);
  const [selectedConfig, setSelectedConfig] = useState<ConfigItem | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<VariantItem | null>(
    null
  );
  const [deployToEnvironment, setDeployToEnvironment] = useState(false);
  const [selectedEnvironment, setSelectedEnvironment] =
    useState<EnvironmentItem | null>(null);

  const { data: environments = [] } = useEnvironments();
  const { data: configs = [] } = useConfigList();
  const { data: variants = [] } = useConfigVariants(selectedConfig?.id ?? '');

  const handleSave = () => {
    onSave({
      mode,
      promptName: mode === 'new_prompt' ? promptName : undefined,
      variantName:
        mode === 'new_prompt' || mode === 'new_variant'
          ? variantName
          : undefined,
      configId:
        mode === 'new_variant' || mode === 'new_version'
          ? selectedConfig?.id
          : undefined,
      variantId: mode === 'new_version' ? selectedVariant?.variantId : undefined,
      deployToEnvironment,
      environmentId: deployToEnvironment
        ? (selectedEnvironment?.id ?? null)
        : null,
    });
    setIsOpen(false);
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    // Reset state when opening
    if (open) {
      setMode('new_prompt');
      setPromptName(defaultPromptName);
      setVariantName(defaultVariantName);
      setSelectedConfig(null);
      setSelectedVariant(null);
      setDeployToEnvironment(false);
      setSelectedEnvironment(null);
    }
  };

  const isValidToSave = () => {
    if (mode === 'new_prompt') {
      return promptName.trim().length > 0 && variantName.trim().length > 0;
    }
    if (mode === 'new_variant') {
      return selectedConfig && variantName.trim().length > 0;
    }
    if (mode === 'new_version') {
      return selectedConfig && selectedVariant;
    }
    return false;
  };

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant={buttonVariant}
          scheme="gray"
          size="default"
          type="button"
          disabled={isSaving}
        >
          <Icon icon={Save} size="xs" />
          {isSaving ? 'Saving...' : buttonLabel}
        </Button>
      </PopoverTrigger>

      <PopoverContent side="top" align="start" sideOffset={4}>
        <div className={styles.savePopupContent}>
          <div className={styles.savePopupTitle}>Save to Prompts</div>

          <div className={styles.saveOptionGroup}>
            {/* Save as new prompt option */}
            <div
              className={`${styles.saveOption} ${mode === 'new_prompt' ? styles.saveOptionSelected : ''}`}
              onClick={() => setMode('new_prompt')}
              onKeyDown={(e) => e.key === 'Enter' && setMode('new_prompt')}
              role="radio"
              aria-checked={mode === 'new_prompt'}
              tabIndex={0}
            >
              <div
                className={`${styles.saveOptionRadio} ${mode === 'new_prompt' ? styles.saveOptionRadioSelected : ''}`}
              >
                {mode === 'new_prompt' && (
                  <div className={styles.saveOptionRadioDot} />
                )}
              </div>
              <div className={styles.saveOptionContent}>
                <span className={styles.saveOptionTitle}>
                  Save as new prompt
                </span>
                <span className={styles.saveOptionDescription}>
                  Creates a new prompt with this configuration
                </span>
              </div>
            </div>

            {/* Save as new variant option */}
            <div
              className={`${styles.saveOption} ${mode === 'new_variant' ? styles.saveOptionSelected : ''}`}
              onClick={() => setMode('new_variant')}
              onKeyDown={(e) => e.key === 'Enter' && setMode('new_variant')}
              role="radio"
              aria-checked={mode === 'new_variant'}
              tabIndex={0}
            >
              <div
                className={`${styles.saveOptionRadio} ${mode === 'new_variant' ? styles.saveOptionRadioSelected : ''}`}
              >
                {mode === 'new_variant' && (
                  <div className={styles.saveOptionRadioDot} />
                )}
              </div>
              <div className={styles.saveOptionContent}>
                <span className={styles.saveOptionTitle}>
                  Add variant to existing prompt
                </span>
                <span className={styles.saveOptionDescription}>
                  Creates a new variant under an existing prompt
                </span>
              </div>
            </div>

            {/* Save as new version option */}
            <div
              className={`${styles.saveOption} ${mode === 'new_version' ? styles.saveOptionSelected : ''}`}
              onClick={() => setMode('new_version')}
              onKeyDown={(e) => e.key === 'Enter' && setMode('new_version')}
              role="radio"
              aria-checked={mode === 'new_version'}
              tabIndex={0}
            >
              <div
                className={`${styles.saveOptionRadio} ${mode === 'new_version' ? styles.saveOptionRadioSelected : ''}`}
              >
                {mode === 'new_version' && (
                  <div className={styles.saveOptionRadioDot} />
                )}
              </div>
              <div className={styles.saveOptionContent}>
                <span className={styles.saveOptionTitle}>
                  Update existing variant
                </span>
                <span className={styles.saveOptionDescription}>
                  Creates a new version of an existing variant
                </span>
              </div>
            </div>
          </div>

          {/* Dynamic fields based on mode */}
          <div className={styles.deploySection}>
            {mode === 'new_prompt' && (
              <>
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Prompt Name</label>
                  <input
                    type="text"
                    className={styles.textInput}
                    value={promptName}
                    onChange={(e) => setPromptName(e.target.value)}
                    placeholder="Enter prompt name"
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Variant Name</label>
                  <input
                    type="text"
                    className={styles.textInput}
                    value={variantName}
                    onChange={(e) => setVariantName(e.target.value)}
                    placeholder="Enter variant name"
                  />
                </div>
              </>
            )}

            {mode === 'new_variant' && (
              <>
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Select Prompt</label>
                  <Combobox<ConfigItem>
                    items={configs}
                    value={selectedConfig}
                    onValueChange={setSelectedConfig}
                    itemToString={(item) => item?.name || ''}
                    placeholder="Select prompt"
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Variant Name</label>
                  <input
                    type="text"
                    className={styles.textInput}
                    value={variantName}
                    onChange={(e) => setVariantName(e.target.value)}
                    placeholder="Enter variant name"
                  />
                </div>
              </>
            )}

            {mode === 'new_version' && (
              <>
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Select Prompt</label>
                  <Combobox<ConfigItem>
                    items={configs}
                    value={selectedConfig}
                    onValueChange={(config) => {
                      setSelectedConfig(config);
                      setSelectedVariant(null);
                    }}
                    itemToString={(item) => item?.name || ''}
                    placeholder="Select prompt"
                  />
                </div>
                {selectedConfig && (
                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>Select Variant</label>
                    <Combobox<VariantItem>
                      items={variants}
                      value={selectedVariant}
                      onValueChange={setSelectedVariant}
                      itemToString={(item) => item?.name || ''}
                      placeholder="Select variant"
                    />
                  </div>
                )}
              </>
            )}
          </div>

          {/* Deploy to environment section */}
          <div className={styles.deploySection}>
            <div className={styles.deployCheckboxRow}>
              <div
                className={`${styles.deployCheckbox} ${deployToEnvironment ? styles.deployCheckboxChecked : ''}`}
                onClick={() => setDeployToEnvironment(!deployToEnvironment)}
                onKeyDown={(e) =>
                  e.key === 'Enter' &&
                  setDeployToEnvironment(!deployToEnvironment)
                }
                role="checkbox"
                aria-checked={deployToEnvironment}
                tabIndex={0}
              >
                {deployToEnvironment && (
                  <Check className={styles.deployCheckboxIcon} />
                )}
              </div>
              <span
                className={styles.deployLabel}
                onClick={() => setDeployToEnvironment(!deployToEnvironment)}
              >
                Deploy to environment
              </span>
            </div>

            {deployToEnvironment && (
              <div className={styles.environmentSelect}>
                <Combobox<EnvironmentItem>
                  items={environments}
                  value={selectedEnvironment}
                  onValueChange={setSelectedEnvironment}
                  itemToString={(item) => item?.name || ''}
                  placeholder="Select environment"
                />
              </div>
            )}
          </div>

          {/* Actions */}
          <div className={styles.saveActions}>
            <Button
              variant="ghost"
              scheme="gray"
              size="sm"
              type="button"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="button"
              onClick={handleSave}
              disabled={
                isSaving ||
                !isValidToSave() ||
                (deployToEnvironment && !selectedEnvironment)
              }
            >
              {isSaving ? 'Saving...' : 'Confirm'}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
