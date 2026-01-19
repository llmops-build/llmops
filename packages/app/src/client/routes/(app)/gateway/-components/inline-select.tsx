import { Select } from '@base-ui/react/select';
import { ChevronDown, Check } from 'lucide-react';
import clsx from 'clsx';
import * as styles from './curl-builder.css';

export interface InlineSelectOption {
  id: string;
  label: string;
  secondary?: string;
  selectedLabel?: string; // What to show when selected (defaults to label)
}

interface InlineSelectProps {
  value: string | null;
  options: InlineSelectOption[];
  onChange: (option: InlineSelectOption) => void;
  placeholder?: string;
  emptyMessage?: string;
  isLoading?: boolean;
}

export function InlineSelect({
  value,
  options,
  onChange,
  placeholder = 'select...',
  emptyMessage = 'No options available',
  isLoading = false,
}: InlineSelectProps) {
  const handleValueChange = (newValue: string | null) => {
    const option = options.find((opt) => opt.id === newValue);
    if (option) {
      onChange(option);
    }
  };

  const selectedOption = options.find((opt) => opt.id === value);

  return (
    <Select.Root value={value} onValueChange={handleValueChange}>
      <Select.Trigger className={styles.inlineSelectTrigger}>
        <Select.Value
          placeholder={
            <span className={styles.inlineSelectTriggerPlaceholder}>
              {placeholder}
            </span>
          }
        >
          {selectedOption?.selectedLabel ?? selectedOption?.label}
        </Select.Value>
        <Select.Icon className={styles.inlineSelectIcon}>
          <ChevronDown size={12} />
        </Select.Icon>
      </Select.Trigger>

      <Select.Portal>
        <Select.Positioner
          className={styles.inlineSelectPositioner}
          sideOffset={4}
        >
          <Select.Popup className={styles.inlineSelectDropdown}>
            {isLoading ? (
              <div className={styles.inlineSelectEmptyState}>Loading...</div>
            ) : options.length === 0 ? (
              <div className={styles.inlineSelectEmptyState}>{emptyMessage}</div>
            ) : (
              options.map((option) => (
                <Select.Item
                  key={option.id}
                  value={option.id}
                  className={clsx(
                    styles.inlineSelectOption,
                    value === option.id && styles.inlineSelectOptionSelected
                  )}
                >
                  <Select.ItemIndicator className={styles.inlineSelectItemIndicator}>
                    <Check size={12} />
                  </Select.ItemIndicator>
                  <Select.ItemText className={styles.inlineSelectOptionLabel}>
                    {option.label}
                  </Select.ItemText>
                  {option.secondary && (
                    <span className={styles.inlineSelectOptionSecondary}>
                      {option.secondary}
                    </span>
                  )}
                </Select.Item>
              ))
            )}
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  );
}
