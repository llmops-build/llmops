import { useMemo, useRef, useState } from 'react';
import { Slider } from '@ui';
import {
  Combobox as BaseCombobox,
  Menu as BaseMenu,
  Menubar as BaseMenubar,
  Popover as BasePopover,
} from '@base-ui/react';
import {
  Check,
  ChevronDown,
  ChevronRight,
  Search,
  SlidersHorizontal,
} from 'lucide-react';
import { Link } from '@tanstack/react-router';
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

export type ModelSettings = {
  provider: string;
  modelName: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
};

type ModelSelectorProps = {
  value: ModelSettings;
  onChange: (settings: ModelSettings) => void;
};

const ProvidersMenubarContent = ({
  groupsWithProviderInfo,
  menubarRef,
  selectedModel,
  onSelect,
}: {
  groupsWithProviderInfo: ProviderGroupWithModels[];
  menubarRef: React.RefObject<HTMLDivElement | null>;
  selectedModel: ModelWithProvider | null;
  onSelect: (model: ModelWithProvider) => void;
}) => {
  return (
    <>
      {groupsWithProviderInfo.map((group) => (
        <BaseMenu.Root key={group.id}>
          <BaseMenu.Trigger
            className={styles.menuTrigger}
            onMouseEnter={() => {
              if (menubarRef.current?.dataset.hasSubmenuOpen === 'false') {
                // @ts-expect-error click is on the button inside Trigger
                menubarRef.current?.firstChild?.firstChild?.click();
                // @ts-expect-error click is on the button inside Trigger
                menubarRef.current?.firstChild?.firstChild?.click();
              }
            }}
            openOnHover
          >
            <div className={styles.providerListItemWrapper}>
              <BaseCombobox.Icon className={styles.triggerIcon}>
                {group.logo && (
                  <img className={styles.triggerIconImg} src={group.logo} />
                )}
              </BaseCombobox.Icon>
              {group.label}{' '}
              <span className={styles.providerMenuItemSlug}>
                ({group.slug})
              </span>
            </div>
            <BaseCombobox.Icon className={styles.chevronRight}>
              <ChevronRight size={14} />
            </BaseCombobox.Icon>
          </BaseMenu.Trigger>
          <BaseMenu.Portal>
            <BaseMenu.Positioner
              align="end"
              side="right"
              sideOffset={6}
              alignOffset={-2}
            >
              <BaseMenu.Popup className={styles.menuPopup}>
                {group.models.map((model) => {
                  const isSelected =
                    selectedModel?.provider.id === model.provider.id &&
                    selectedModel?.value === model.value;
                  return (
                    <div
                      key={`${model.provider.id}_${model.value}`}
                      className={styles.item}
                      role="menuitem"
                      tabIndex={-1}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        onSelect(model);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onSelect(model);
                        }
                      }}
                    >
                      <span className={styles.itemIndicator}>
                        {isSelected && <Check size={16} />}
                      </span>
                      {model.provider.logo && (
                        <img
                          className={styles.triggerIconImg}
                          src={model.provider.logo}
                        />
                      )}
                      {model.label}
                    </div>
                  );
                })}
              </BaseMenu.Popup>
            </BaseMenu.Positioner>
          </BaseMenu.Portal>
        </BaseMenu.Root>
      ))}
    </>
  );
};

const ModelSelector = ({ value, onChange }: ModelSelectorProps) => {
  const { data: providerGroups } = useModelsGroupedByProvider();
  const [inputValue, setInputValue] = useState('');
  const menubarRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleInputValueChange = (newValue: string) => {
    const wasEmpty = !inputValue?.trim();
    const willBeEmpty = !newValue?.trim();
    setInputValue(newValue);

    // Refocus input when switching between empty and non-empty states
    if (wasEmpty !== willBeEmpty) {
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    }
  };

  const handleSettingChange = (
    key: keyof Omit<ModelSettings, 'provider' | 'modelName'>,
    newValue: number | undefined
  ) => {
    const updatedSettings = {
      ...value,
      [key]: newValue,
    };

    // Ensure maxTokens doesn't exceed model's limit
    if (
      key === 'maxTokens' &&
      newValue &&
      selectedModel?.limit?.output &&
      newValue > selectedModel.limit.output
    ) {
      updatedSettings.maxTokens = selectedModel.limit.output;
    }

    onChange(updatedSettings);
  };

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

  const filteredGroups = useMemo(() => {
    if (!inputValue?.trim()) return [];
    const lowerQuery = inputValue.toLowerCase();

    return groupsWithProviderInfo
      .map((group) => {
        const groupMatches = group.label.toLowerCase().includes(lowerQuery);
        // If group matches, return it as is (all models included)
        if (groupMatches) return group;

        // If group doesn't match, check models
        const matchingModels = group.models.filter(
          (model) =>
            model.label.toLowerCase().includes(lowerQuery) ||
            model.value.toLowerCase().includes(lowerQuery)
        );

        if (matchingModels.length > 0) {
          return { ...group, models: matchingModels };
        }

        return null;
      })
      .filter((g): g is ProviderGroupWithModels => g !== null);
  }, [groupsWithProviderInfo, inputValue]);

  // Derive selectedKey from value.provider and value.modelName
  const selectedKey =
    value.provider && value.modelName
      ? `${value.provider}_${value.modelName}`
      : null;

  const selectedModel = selectedKey
    ? (modelMap.get(selectedKey) ?? null)
    : null;

  // Guard against spurious null calls after selection
  const justSelectedRef = useRef(false);

  const handleValueChange = (
    item: ModelWithProvider | ProviderGroupWithModels | null
  ) => {
    // Only handle ModelWithProvider, ignore ProviderGroupWithModels
    if (item && 'value' in item) {
      justSelectedRef.current = true;
      onChange({
        ...value,
        provider: item.provider.id,
        modelName: item.value,
      });
      // Reset the guard after a tick
      setTimeout(() => {
        justSelectedRef.current = false;
      }, 0);
    } else if (!item && !justSelectedRef.current) {
      // Only clear if this isn't a spurious null after selection
      onChange({
        ...value,
        provider: '',
        modelName: '',
      });
    }
  };

  return (
    <div className={styles.modelSelectorWrapper}>
      <BaseCombobox.Root
        value={selectedModel}
        onValueChange={handleValueChange}
        inputValue={inputValue}
        onInputValueChange={handleInputValueChange}
        filter={() => true}
        autoHighlight
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
                  ref={inputRef}
                  placeholder="Search Model..."
                  className={styles.searchInputWithIcon}
                  onKeyDownCapture={(event) => {
                    if (event.code === 'ArrowDown' && !inputValue?.trim()) {
                      event.preventDefault();
                      event.stopPropagation();
                      // Focus first menubar trigger, ArrowRight will open submenu
                      const firstTrigger =
                        menubarRef.current?.querySelector('button');
                      firstTrigger?.focus();
                    }
                  }}
                />
              </div>

              <div className={styles.listWrapper}>
                {!inputValue?.trim() ? (
                  <BaseMenubar
                    ref={menubarRef}
                    className={styles.menu}
                    orientation="vertical"
                  >
                    <ProvidersMenubarContent
                      groupsWithProviderInfo={groupsWithProviderInfo}
                      menubarRef={menubarRef}
                      selectedModel={selectedModel}
                      onSelect={handleValueChange}
                    />
                    <Link
                      to="/gateway/providers"
                      className={styles.connectProviderLink}
                      onMouseEnter={(e) => {
                        const target = e.currentTarget;
                        // Click the active/open menu trigger to close it
                        const activeButton = menubarRef.current?.querySelector(
                          'button[data-popup-open="true"], button[aria-expanded="true"]'
                        ) as HTMLElement | null;
                        activeButton?.click();
                        target.focus();
                      }}
                    >
                      <div className={styles.providerLogoStack}>
                        <img src="https://models.dev/logos/openai.svg" alt="" className={styles.stackedLogo} />
                        <img src="https://models.dev/logos/anthropic.svg" alt="" className={styles.stackedLogo} />
                        <img src="https://models.dev/logos/google.svg" alt="" className={styles.stackedLogo} />
                      </div>
                      Connect Provider
                    </Link>
                  </BaseMenubar>
                ) : (
                  <>
                    <BaseCombobox.List>
                      {filteredGroups.map((group) => (
                        <BaseCombobox.Group key={group.id} items={group.models}>
                          <BaseCombobox.GroupLabel
                            className={styles.groupLabel}
                          >
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
                      ))}
                    </BaseCombobox.List>
                    <Link
                      to="/gateway/providers"
                      className={styles.connectProviderLink}
                      onMouseEnter={(e) => e.currentTarget.focus()}
                    >
                      <div className={styles.providerLogoStack}>
                        <img src="https://models.dev/logos/openai.svg" alt="" className={styles.stackedLogo} />
                        <img src="https://models.dev/logos/anthropic.svg" alt="" className={styles.stackedLogo} />
                        <img src="https://models.dev/logos/google.svg" alt="" className={styles.stackedLogo} />
                      </div>
                      Connect Provider
                    </Link>
                  </>
                )}
              </div>
            </BaseCombobox.Popup>
          </BaseCombobox.Positioner>
        </BaseCombobox.Portal>
      </BaseCombobox.Root>
      <BasePopover.Root>
        <BasePopover.Trigger
          className={styles.paramsTrigger}
          disabled={!selectedModel}
        >
          <SlidersHorizontal size={14} /> Params <ChevronDown size={14} />
        </BasePopover.Trigger>
        <BasePopover.Portal>
          <BasePopover.Positioner align="start" sideOffset={4}>
            <BasePopover.Popup className={styles.paramsPopup}>
              <div className={styles.paramsPopupContent}>
                <div className={styles.paramsSection}>
                  <span className={styles.paramsSectionTitle}>Parameters</span>
                  <div className={styles.paramsSliderGroup}>
                    <div className={styles.paramsField}>
                      <label className={styles.paramsFieldLabel}>
                        Max Tokens
                        {selectedModel?.limit?.output
                          ? ` (${selectedModel.limit.output})`
                          : ''}
                      </label>
                      <input
                        type="number"
                        className={styles.paramsInput}
                        value={value.maxTokens ?? ''}
                        placeholder="Default"
                        min={1}
                        max={selectedModel?.limit?.output || undefined}
                        onChange={(e) => {
                          const val = e.target.value
                            ? parseInt(e.target.value, 10)
                            : undefined;
                          handleSettingChange('maxTokens', val);
                        }}
                      />
                    </div>

                    {selectedModel?.temperature !== false && (
                      <Slider
                        label="Temperature"
                        value={value.temperature ?? 1}
                        min={0}
                        max={2}
                        step={0.1}
                        onValueChange={(v) =>
                          handleSettingChange('temperature', v)
                        }
                        formatValue={(v) => v.toFixed(1)}
                      />
                    )}

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
                      onValueChange={(v) =>
                        handleSettingChange('presencePenalty', v)
                      }
                      formatValue={(v) => v.toFixed(1)}
                    />
                  </div>
                </div>
              </div>
            </BasePopover.Popup>
          </BasePopover.Positioner>
        </BasePopover.Portal>
      </BasePopover.Root>
    </div>
  );
};

export default ModelSelector;
