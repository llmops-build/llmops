import { Menu as BaseMenu } from '@base-ui/react';
import { ChevronDown, Database, Check, X } from 'lucide-react';
import { useDatasets } from '@client/hooks/queries/useDatasets';
import * as styles from './dataset-selector.css';

type DatasetSelectorProps = {
  selectedDatasetId: string | null;
  onSelect: (datasetId: string | null) => void;
};

export function DatasetSelector({
  selectedDatasetId,
  onSelect,
}: DatasetSelectorProps) {
  const { data: datasets } = useDatasets();

  const selectedDataset = datasets?.find((d) => d.id === selectedDatasetId);

  return (
    <div className={styles.selectorWrapper}>
      <BaseMenu.Root>
        <BaseMenu.Trigger className={styles.trigger}>
          <Database size={16} />
          {selectedDataset ? (
            <span>{selectedDataset.name}</span>
          ) : (
            <span className={styles.placeholderText}>Select dataset...</span>
          )}
          <ChevronDown size={14} />
        </BaseMenu.Trigger>
        <BaseMenu.Portal>
          <BaseMenu.Positioner sideOffset={4} align="start">
            <BaseMenu.Popup className={styles.menuPopup}>
              {selectedDatasetId && (
                <>
                  <BaseMenu.Item
                    className={styles.menuItem}
                    onClick={() => onSelect(null)}
                  >
                    <span className={styles.menuItemIcon}>
                      <X size={14} />
                    </span>
                    <span className={styles.clearText}>Clear selection</span>
                  </BaseMenu.Item>
                  <div className={styles.divider} />
                </>
              )}
              {datasets?.length === 0 ? (
                <div className={styles.emptyState}>
                  No datasets available. Create a dataset first.
                </div>
              ) : (
                datasets?.map((dataset) => {
                  const isSelected = selectedDatasetId === dataset.id;
                  return (
                    <BaseMenu.Item
                      key={dataset.id}
                      className={styles.menuItem}
                      data-selected={isSelected || undefined}
                      onClick={() => onSelect(dataset.id)}
                    >
                      <span className={styles.menuItemIcon}>
                        {isSelected && <Check size={14} />}
                      </span>
                      <div className={styles.datasetInfo}>
                        <span className={styles.datasetName}>{dataset.name}</span>
                        <span className={styles.datasetMeta}>
                          {dataset.recordCount} records
                        </span>
                      </div>
                    </BaseMenu.Item>
                  );
                })
              )}
            </BaseMenu.Popup>
          </BaseMenu.Positioner>
        </BaseMenu.Portal>
      </BaseMenu.Root>
    </div>
  );
}

export default DatasetSelector;
