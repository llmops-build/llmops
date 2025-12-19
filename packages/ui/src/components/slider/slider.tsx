import * as React from 'react';
import { Slider as BaseSlider } from '@base-ui/react/slider';
import clsx from 'clsx';
import * as styles from './slider.css';

export interface SliderProps {
  label?: string;
  value?: number;
  defaultValue?: number;
  min?: number;
  max?: number;
  step?: number;
  onValueChange?: (value: number) => void;
  onValueCommitted?: (value: number) => void;
  disabled?: boolean;
  className?: string;
  showValue?: boolean;
  formatValue?: (value: number) => string;
}

export function Slider({
  label,
  value,
  defaultValue,
  min = 0,
  max = 100,
  step = 1,
  onValueChange,
  onValueCommitted,
  disabled = false,
  className,
  showValue = true,
  formatValue,
}: SliderProps) {
  const handleValueChange = React.useCallback(
    (newValue: number | number[]) => {
      if (typeof newValue === 'number') {
        onValueChange?.(newValue);
      } else if (Array.isArray(newValue)) {
        onValueChange?.(newValue[0]);
      }
    },
    [onValueChange]
  );

  const handleValueCommitted = React.useCallback(
    (newValue: number | number[]) => {
      if (typeof newValue === 'number') {
        onValueCommitted?.(newValue);
      } else if (Array.isArray(newValue)) {
        onValueCommitted?.(newValue[0]);
      }
    },
    [onValueCommitted]
  );

  const displayValue = value ?? defaultValue ?? min;
  const formattedValue = formatValue
    ? formatValue(displayValue)
    : String(displayValue);

  return (
    <BaseSlider.Root
      value={value}
      defaultValue={defaultValue}
      min={min}
      max={max}
      step={step}
      onValueChange={handleValueChange}
      onValueCommitted={handleValueCommitted}
      disabled={disabled}
      className={clsx(styles.sliderRoot, className)}
    >
      {(label || showValue) && (
        <div className={styles.sliderLabel}>
          {label && <span>{label}</span>}
          {showValue && (
            <span className={styles.sliderValue}>{formattedValue}</span>
          )}
        </div>
      )}
      <BaseSlider.Control className={styles.sliderControl}>
        <BaseSlider.Track className={styles.sliderTrack}>
          <BaseSlider.Indicator className={styles.sliderIndicator} />
          <BaseSlider.Thumb className={styles.sliderThumb} />
        </BaseSlider.Track>
      </BaseSlider.Control>
    </BaseSlider.Root>
  );
}

// Export base components for advanced use cases
export { BaseSlider };
