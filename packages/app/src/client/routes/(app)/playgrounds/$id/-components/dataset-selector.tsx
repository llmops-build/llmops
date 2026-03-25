import { useState } from 'react';
import { Combobox as BaseCombobox } from '@base-ui/react';
import { Check, ChevronDown, Database, Plus, Search, X } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { useDatasets } from '@client/hooks/queries/useDatasets';
import * as styles from './dataset-selector.css';

type DatasetOption = {
  id: string;
  name: string;
};

type DatasetSelectorProps = {
  value: string | null;
  onChange: (datasetId: string | null) => void;
};

export function DatasetSelector({ value, onChange }: DatasetSelectorProps) {
  const { data: datasets, isLoading } = useDatasets();
  const [inputValue, setInputValue] = useState('');

  const options: DatasetOption[] = (datasets ?? []).map((d) => ({
    id: d.id,
    name: d.name,
  }));

  const selectedOption = value
    ? (options.find((opt) => opt.id === value) ?? null)
    : null;

  const filteredOptions = inputValue.trim()
    ? options.filter((opt) =>
        opt.name.toLowerCase().includes(inputValue.toLowerCase()),
      )
    : options;

  const handleValueChange = (option: DatasetOption | null) => {
    onChange(option?.id ?? null);
  };

  const handleInputValueChange = (newValue: string) => {
    setInputValue(newValue);
  };

  return (
    <BaseCombobox.Root
      value={selectedOption}
      onValueChange={handleValueChange}
      inputValue={inputValue}
      onInputValueChange={handleInputValueChange}
      filter={() => true}
    >
      <BaseCombobox.Trigger className={styles.trigger}>
        <div className={styles.triggerContent}>
          {selectedOption ? (
            <>
              <Database size={14} className={styles.triggerIcon} />
              <span>{selectedOption.name}</span>
            </>
          ) : (
            <span className={styles.placeholder}>
              {isLoading ? 'Loading...' : 'Select dataset'}
            </span>
          )}
        </div>
        <BaseCombobox.Icon className={styles.chevronIcon}>
          <ChevronDown size={14} />
        </BaseCombobox.Icon>
      </BaseCombobox.Trigger>
      <BaseCombobox.Portal>
        <BaseCombobox.Positioner align="start" sideOffset={4}>
          <BaseCombobox.Popup className={styles.popup}>
            <div className={styles.searchWrapper}>
              <Search className={styles.searchIcon} size={16} />
              <BaseCombobox.Input
                placeholder="Search datasets..."
                className={styles.searchInput}
              />
            </div>
            <div className={styles.listWrapper}>
              <BaseCombobox.List>
                {filteredOptions.map((option) => (
                  <BaseCombobox.Item
                    key={option.id}
                    value={option}
                    className={styles.item}
                  >
                    <BaseCombobox.ItemIndicator
                      className={styles.itemIndicator}
                    >
                      <Check size={16} />
                    </BaseCombobox.ItemIndicator>
                    <Database size={14} className={styles.itemIcon} />
                    <span className={styles.itemName}>{option.name}</span>
                  </BaseCombobox.Item>
                ))}
                {filteredOptions.length === 0 && inputValue.trim() && (
                  <div className={styles.noResults}>No datasets found</div>
                )}
              </BaseCombobox.List>
            </div>
            <div className={styles.actionsContainer}>
              {selectedOption && (
                <button
                  type="button"
                  className={styles.actionButton}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleValueChange(null);
                  }}
                >
                  <X size={14} />
                  Clear Selection
                </button>
              )}
              <Link
                to="/datasets/$id"
                params={{ id: 'new' }}
                className={styles.actionLink}
              >
                <Plus size={14} />
                Add Dataset
              </Link>
            </div>
          </BaseCombobox.Popup>
        </BaseCombobox.Positioner>
      </BaseCombobox.Portal>
    </BaseCombobox.Root>
  );
}

export default DatasetSelector;
