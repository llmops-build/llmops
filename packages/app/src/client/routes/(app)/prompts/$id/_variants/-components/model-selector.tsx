import { useMemo, useRef, useState } from 'react';
import { Combobox as BaseCombobox } from '@base-ui/react';
import { Check, ChevronDown, Search } from 'lucide-react';
import * as styles from './model-selector.css';
import {
  useModelsGroupedByProvider,
  type Model,
  type ProviderGroup,
} from '@client/hooks/queries/useModelsGroupedByProvider';

export type ModelWithProvider = Model & {
  provider: {
    id: string;
    providerId: string;
    slug: string | null;
    label: string;
    logo: string | null;
  };
};

type ProviderGroupWithModels = Omit<ProviderGroup, 'models'> & {
  models: ModelWithProvider[];
};

const ModelSelector = () => {
  const { data: providerGroups } = useModelsGroupedByProvider();
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  // Create a flat map for quick lookup and items with provider info
  const { groupsWithProviderInfo, modelMap } = useMemo(() => {
    const map = new Map<string, ModelWithProvider>();
    if (!providerGroups) return { groupsWithProviderInfo: [], modelMap: map };

    const groups = providerGroups.map((group) => ({
      ...group,
      models: group.models.map((model) => {
        const modelWithProvider: ModelWithProvider = {
          ...model,
          provider: {
            id: group.id,
            providerId: group.providerId,
            slug: group.slug,
            label: group.label,
            logo: group.logo,
          },
        };
        const key = `${group.id}_${model.value}`;
        map.set(key, modelWithProvider);
        return modelWithProvider;
      }),
    }));

    return { groupsWithProviderInfo: groups, modelMap: map };
  }, [providerGroups]);

  const selectedModel = selectedKey
    ? (modelMap.get(selectedKey) ?? null)
    : null;

  console.log('Selected:', selectedModel);

  // Guard against spurious null calls after selection
  const justSelectedRef = useRef(false);

  const handleValueChange = (
    item: ModelWithProvider | ProviderGroupWithModels | null
  ) => {
    // Only handle ModelWithProvider, ignore ProviderGroupWithModels
    if (item && 'value' in item) {
      justSelectedRef.current = true;
      setSelectedKey(`${item.provider.id}_${item.value}`);
      // Reset the guard after a tick
      setTimeout(() => {
        justSelectedRef.current = false;
      }, 0);
    } else if (!item && !justSelectedRef.current) {
      // Only clear if this isn't a spurious null after selection
      setSelectedKey(null);
    }
  };

  const filter = (
    itemValue: ModelWithProvider | ProviderGroupWithModels,
    query: string,
    itemToString:
      | ((itemValue: ModelWithProvider | ProviderGroupWithModels) => string)
      | undefined
  ): boolean => {
    if (!query) return true;
    const lowerQuery = query.toLowerCase();

    // For individual models
    if ('label' in itemValue && 'value' in itemValue) {
      const model = itemValue as ModelWithProvider;
      return (
        model.label.toLowerCase().includes(lowerQuery) ||
        model.value.toLowerCase().includes(lowerQuery)
      );
    }

    // For provider groups (though these aren't directly filterable items)
    const group = itemValue as ProviderGroupWithModels;
    return group.label.toLowerCase().includes(lowerQuery);
  };

  return (
    <BaseCombobox.Root
      items={groupsWithProviderInfo}
      value={selectedModel}
      onValueChange={handleValueChange}
      filter={filter}
    >
      <BaseCombobox.Trigger className={styles.trigger}>
        <div className={styles.triggerSelectedModelWrapper}>
          {selectedModel && selectedModel.provider.logo && (
            <img
              className={styles.triggerIconImg}
              src={selectedModel.provider.logo}
            />
          )}
          <span>{selectedModel ? selectedModel.label : 'Select Model'}</span>
        </div>
        <BaseCombobox.Icon className={styles.triggerIcon}>
          <ChevronDown size={14} />
        </BaseCombobox.Icon>
      </BaseCombobox.Trigger>
      <BaseCombobox.Portal>
        <BaseCombobox.Positioner align="start" sideOffset={4}>
          <BaseCombobox.Popup className={styles.popup}>
            <div className={styles.searchWrapper}>
              <Search className={styles.searchIcon} size={16} />
              <BaseCombobox.Input
                placeholder="Search Model..."
                className={styles.searchInputWithIcon}
              />
            </div>
            <BaseCombobox.Empty>No models found.</BaseCombobox.Empty>
            <div className={styles.listWrapper}>
              <BaseCombobox.List>
                {(group: ProviderGroupWithModels) => (
                  <BaseCombobox.Group key={group.id} items={group.models}>
                    <BaseCombobox.GroupLabel className={styles.groupLabel}>
                      {group.slug ?? group.label}
                    </BaseCombobox.GroupLabel>
                    <BaseCombobox.Collection>
                      {(model: ModelWithProvider) => (
                        <BaseCombobox.Item
                          key={`${model.provider.id}_${model.value}`}
                          value={model}
                          className={styles.item}
                        >
                          <BaseCombobox.ItemIndicator
                            className={styles.itemIndicator}
                          >
                            <Check size={16} />
                          </BaseCombobox.ItemIndicator>
                          <BaseCombobox.Icon>
                            {model.provider.logo && (
                              <img
                                className={styles.triggerIconImg}
                                src={model.provider.logo}
                              />
                            )}
                          </BaseCombobox.Icon>
                          {model.label}
                        </BaseCombobox.Item>
                      )}
                    </BaseCombobox.Collection>
                  </BaseCombobox.Group>
                )}
              </BaseCombobox.List>
            </div>
          </BaseCombobox.Popup>
        </BaseCombobox.Positioner>
      </BaseCombobox.Portal>
    </BaseCombobox.Root>
  );
};

export default ModelSelector;
