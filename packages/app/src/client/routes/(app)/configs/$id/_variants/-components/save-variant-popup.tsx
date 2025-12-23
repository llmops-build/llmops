import { useState } from 'react';
import {
  Button,
  Popover,
  PopoverTrigger,
  PopoverContent,
  Combobox,
} from '@llmops/ui';
import { Check, Save } from 'lucide-react';
import { useEnvironments } from '@client/hooks/queries/useEnvironments';
import { Icon } from '@client/components/icons';
import * as styles from './save-variant-popup.css';

export type SaveMode = 'new_variant' | 'new_version';

export type SaveVariantOptions = {
  mode: SaveMode;
  deployToEnvironment: boolean;
  environmentId: string | null;
};

type EnvironmentItem = {
  id: string;
  name: string;
  slug: string;
  isProd: boolean;
};

type SaveVariantPopupProps = {
  isNewVariant: boolean;
  onSave: (options: SaveVariantOptions) => void;
  isSaving?: boolean;
};

export function SaveVariantPopup({
  isNewVariant,
  onSave,
  isSaving = false,
}: SaveVariantPopupProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<SaveMode>(
    isNewVariant ? 'new_variant' : 'new_version'
  );
  const [deployToEnvironment, setDeployToEnvironment] = useState(false);
  const [selectedEnvironment, setSelectedEnvironment] =
    useState<EnvironmentItem | null>(null);

  const { data: environments = [] } = useEnvironments();

  const handleSave = () => {
    onSave({
      mode,
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
      setMode(isNewVariant ? 'new_variant' : 'new_version');
      setDeployToEnvironment(false);
      setSelectedEnvironment(null);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="primary" size="sm" type="button" disabled={isSaving}>
          <Icon icon={Save} size="xs" />
          {isSaving ? 'Saving...' : 'Save'}
        </Button>
      </PopoverTrigger>

      <PopoverContent side="bottom" align="end" sideOffset={4}>
        <div className={styles.savePopupContent}>
          <div className={styles.savePopupTitle}>Save Options</div>

          <div className={styles.saveOptionGroup}>
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
                  Save as new variant
                </span>
                <span className={styles.saveOptionDescription}>
                  Creates a new variant with version 1
                </span>
              </div>
            </div>

            {/* Update as new version option - only show for existing variants */}
            {!isNewVariant && (
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
                    Update as new version
                  </span>
                  <span className={styles.saveOptionDescription}>
                    Creates a new version of this variant
                  </span>
                </div>
              </div>
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
                isSaving || (deployToEnvironment && !selectedEnvironment)
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
