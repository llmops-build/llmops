import * as React from 'react';
import { Combobox as BaseCombobox } from '@base-ui/react/combobox';
import clsx from 'clsx';
import * as styles from './combobox.css';

// Icons
function CheckIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      fill="currentcolor"
      width="10"
      height="10"
      viewBox="0 0 10 10"
      {...props}
    >
      <path d="M9.1603 1.12218C9.50684 1.34873 9.60427 1.81354 9.37792 2.16038L5.13603 8.66012C5.01614 8.8438 4.82192 8.96576 4.60451 8.99384C4.3871 9.02194 4.1683 8.95335 4.00574 8.80615L1.24664 6.30769C0.939709 6.02975 0.916013 5.55541 1.19372 5.24822C1.47142 4.94102 1.94536 4.91731 2.2523 5.19524L4.36085 7.10461L8.12299 1.33999C8.34934 0.993152 8.81376 0.895638 9.1603 1.12218Z" />
    </svg>
  );
}

function ClearIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M18 6L6 18" />
      <path d="M6 6l12 12" />
    </svg>
  );
}

function ChevronDownIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function XIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

// Component interfaces
export interface ComboboxProps<T = string> {
  items: T[];
  label?: string;
  placeholder?: string;
  id?: string;
  value?: T | null;
  defaultValue?: T | null;
  onValueChange?: (value: T | null) => void;
  disabled?: boolean;
  multiple?: boolean;
  className?: string;
  itemToString?: (item: T | null) => string;
  itemToIcon?: (item: T | null) => React.ReactNode;
  variant?: 'default' | 'inline';
}

export interface ComboboxMultipleProps<T = string> {
  items: T[];
  label?: string;
  placeholder?: string;
  id?: string;
  value?: T[];
  defaultValue?: T[];
  onValueChange?: (value: T[]) => void;
  disabled?: boolean;
  multiple: true;
  className?: string;
  itemToString?: (item: T | null) => string;
  itemToIcon?: (item: T | null) => React.ReactNode;
}

// Single selection Combobox
export function Combobox<T = string>({
  items,
  label,
  placeholder = 'Search...',
  id,
  value,
  defaultValue,
  onValueChange,
  disabled = false,
  className,
  itemToString,
  itemToIcon,
  variant = 'default',
}: ComboboxProps<T>) {
  const generatedId = React.useId();
  const comboboxId = id || generatedId;

  const isInline = variant === 'inline';
  const labelClass = isInline
    ? styles.comboboxLabelInline
    : styles.comboboxLabel;
  const wrapperClass = clsx(
    isInline ? styles.comboboxInputWrapperInline : styles.comboboxInputWrapper,
    disabled &&
      (isInline
        ? styles.comboboxInputWrapperInlineDisabled
        : styles.comboboxInputWrapperDisabled)
  );
  const inputClass = clsx(
    isInline ? styles.comboboxInputInline : styles.comboboxInput,
    disabled &&
      (isInline
        ? styles.comboboxInputInlineDisabled
        : styles.comboboxInputDisabled)
  );
  const actionButtonsClass = isInline
    ? styles.comboboxActionButtonsInline
    : styles.comboboxActionButtons;

  const handleValueChange = React.useCallback(
    (newValue: T | null, event: { reason: string }) => {
      onValueChange?.(newValue);
    },
    [onValueChange]
  );

  // Determine if we're in controlled mode
  const isControlled = value !== undefined;

  return (
    <BaseCombobox.Root
      items={items}
      value={isControlled ? (value ?? undefined) : undefined}
      defaultValue={!isControlled ? (defaultValue ?? undefined) : undefined}
      onValueChange={handleValueChange}
      disabled={disabled}
      itemToStringLabel={itemToString}
    >
      <div className={clsx(labelClass, className)}>
        {label && <label htmlFor={comboboxId}>{label}</label>}
        <div className={wrapperClass}>
          <BaseCombobox.Input
            placeholder={placeholder}
            id={comboboxId}
            className={inputClass}
          />
          <div className={actionButtonsClass}>
            <BaseCombobox.Clear
              className={clsx(styles.comboboxClear, 'combobox-clear')}
              aria-label="Clear selection"
            >
              <ClearIcon className={styles.comboboxIcon} />
            </BaseCombobox.Clear>
            <BaseCombobox.Trigger
              className={styles.comboboxTrigger}
              aria-label="Open popup"
            >
              <ChevronDownIcon className={styles.comboboxIcon} />
            </BaseCombobox.Trigger>
          </div>
        </div>
      </div>

      <BaseCombobox.Portal>
        <BaseCombobox.Positioner
          className={styles.comboboxPositioner}
          sideOffset={4}
        >
          <BaseCombobox.Popup className={styles.comboboxPopup}>
            <BaseCombobox.Empty className={styles.comboboxEmpty}>
              No items found.
            </BaseCombobox.Empty>
            <BaseCombobox.List className={styles.comboboxList}>
              {(item: T) => {
                const hasIcon = Boolean(itemToIcon);
                return (
                  <BaseCombobox.Item
                    key={itemToString ? itemToString(item) : String(item)}
                    value={item}
                    className={styles.comboboxItem({ withIcon: hasIcon })}
                  >
                    <BaseCombobox.ItemIndicator
                      className={styles.comboboxItemIndicator({
                        withIcon: hasIcon,
                      })}
                    >
                      <CheckIcon className={styles.comboboxItemIndicatorIcon} />
                    </BaseCombobox.ItemIndicator>
                    {itemToIcon && (
                      <div
                        className={styles.comboboxItemIcon({
                          withIcon: hasIcon,
                        })}
                      >
                        {itemToIcon(item)}
                      </div>
                    )}
                    <div
                      className={styles.comboboxItemText({ withIcon: hasIcon })}
                    >
                      {itemToString ? itemToString(item) : String(item)}
                    </div>
                  </BaseCombobox.Item>
                );
              }}
            </BaseCombobox.List>
          </BaseCombobox.Popup>
        </BaseCombobox.Positioner>
      </BaseCombobox.Portal>
    </BaseCombobox.Root>
  );
}

// Multiple selection Combobox
export function ComboboxMultiple<T = string>({
  items,
  label,
  placeholder = 'Search...',
  id,
  value,
  defaultValue,
  onValueChange,
  disabled = false,
  className,
  itemToString,
  itemToIcon,
}: ComboboxMultipleProps<T>) {
  const generatedId = React.useId();
  const comboboxId = id || generatedId;
  const containerRef = React.useRef<HTMLDivElement | null>(null);

  return (
    <BaseCombobox.Root
      items={items}
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange}
      disabled={disabled}
      multiple
      itemToStringLabel={itemToString}
    >
      <div className={clsx(styles.comboboxLabel, className)}>
        {label && <label htmlFor={comboboxId}>{label}</label>}
        <BaseCombobox.Chips className={styles.comboboxChips} ref={containerRef}>
          <BaseCombobox.Value>
            {(selectedValues: T[]) => (
              <React.Fragment>
                {selectedValues.map((item) => {
                  const key = itemToString ? itemToString(item) : String(item);
                  const displayValue = itemToString
                    ? itemToString(item)
                    : String(item);
                  const icon = itemToIcon?.(item);
                  return (
                    <BaseCombobox.Chip
                      key={key}
                      className={styles.comboboxChip}
                      aria-label={displayValue}
                    >
                      {icon && (
                        <div className={styles.comboboxChipIcon}>{icon}</div>
                      )}
                      {displayValue}
                      <BaseCombobox.ChipRemove
                        className={styles.comboboxChipRemove}
                        aria-label="Remove"
                      >
                        <XIcon />
                      </BaseCombobox.ChipRemove>
                    </BaseCombobox.Chip>
                  );
                })}
                <BaseCombobox.Input
                  id={comboboxId}
                  placeholder={selectedValues.length > 0 ? '' : placeholder}
                  className={styles.comboboxChipInput}
                />
              </React.Fragment>
            )}
          </BaseCombobox.Value>
        </BaseCombobox.Chips>
      </div>

      <BaseCombobox.Portal>
        <BaseCombobox.Positioner
          className={styles.comboboxPositioner}
          sideOffset={4}
          anchor={containerRef}
        >
          <BaseCombobox.Popup className={styles.comboboxPopup}>
            <BaseCombobox.Empty className={styles.comboboxEmpty}>
              No items found.
            </BaseCombobox.Empty>
            <BaseCombobox.List className={styles.comboboxList}>
              {(item: T) => {
                const key = itemToString ? itemToString(item) : String(item);
                const displayValue = itemToString
                  ? itemToString(item)
                  : String(item);
                const icon = itemToIcon?.(item);
                const hasIcon = Boolean(itemToIcon);

                return (
                  <BaseCombobox.Item
                    key={key}
                    value={item}
                    className={styles.comboboxItem({ withIcon: hasIcon })}
                  >
                    <BaseCombobox.ItemIndicator
                      className={styles.comboboxItemIndicator({
                        withIcon: hasIcon,
                      })}
                    >
                      <CheckIcon className={styles.comboboxItemIndicatorIcon} />
                    </BaseCombobox.ItemIndicator>
                    {icon && (
                      <div
                        className={styles.comboboxItemIcon({
                          withIcon: hasIcon,
                        })}
                      >
                        {icon}
                      </div>
                    )}
                    <div
                      className={styles.comboboxItemText({ withIcon: hasIcon })}
                    >
                      {displayValue}
                    </div>
                  </BaseCombobox.Item>
                );
              }}
            </BaseCombobox.List>
          </BaseCombobox.Popup>
        </BaseCombobox.Positioner>
      </BaseCombobox.Portal>
    </BaseCombobox.Root>
  );
}

// Export the base components for advanced use cases
export { BaseCombobox };
