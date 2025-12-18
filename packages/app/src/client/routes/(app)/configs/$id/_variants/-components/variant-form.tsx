import { useWatch, type UseFormReturn } from 'react-hook-form';
import {
  variantFormContainer,
  variantPropertyRow,
  variantPropertyLabel,
  variantPropertyValue,
  variantInlineInput,
  variantPropertyColumn,
  markdownLabelInfo,
} from './variants.css';
import { Combobox } from '@llmops/ui';
import { Icon } from '@client/components/icons';
import { BrainCircuit, CardSim, PenLine } from 'lucide-react';
import { useProviderModels } from '@client/hooks/queries/useProviderModels';
import MarkdownEditor from './editor';
import Markdown from '@client/components/icons/markdown';
// import MarkdownIcon from '@/client/icons/markdown';

const providers = window.bootstrapData?.llmProviders?.map((provider) => {
  return {
    label: provider.name,
    icon: provider.imageURI,
    value: provider.key,
  };
});

const providerItems = providers?.map((provider) => provider.value) || [];

export type VariantFormData = {
  name: string;
  provider: string;
  modelName: string;
};

const VariantForm = ({ form }: { form: UseFormReturn<VariantFormData> }) => {
  const {
    register,
    formState: { errors },
    setValue,
    control,
  } = form;

  const selectedProvider = useWatch({
    control: form.control,
    name: 'provider',
  });
  const selectedModel = useWatch({
    control,
    name: 'modelName',
  });
  const nameValue = useWatch({
    control,
    name: 'name',
  });

  const { data: models } = useProviderModels(selectedProvider);

  return (
    <div className={variantFormContainer}>
      <div className={variantPropertyRow}>
        <div className={variantPropertyLabel}>
          <Icon icon={PenLine} size="xs" />
          <span>Name</span>
        </div>
        <div className={variantPropertyValue}>
          <input
            value={nameValue || ''}
            onChange={(e) =>
              setValue('name', e.target.value, {
                shouldValidate: true,
                shouldDirty: true,
              })
            }
            placeholder="Enter variant name"
            aria-invalid={errors.name ? 'true' : 'false'}
            className={variantInlineInput}
          />
        </div>
      </div>
      {errors.name && (
        <span style={{ color: 'red', fontSize: '0.875rem' }}>
          {errors.name.message}
        </span>
      )}

      <div className={variantPropertyRow}>
        <div className={variantPropertyLabel}>
          <Icon icon={CardSim} size="xs" />
          Provider
        </div>
        <div className={variantPropertyValue}>
          <Combobox
            items={providerItems}
            value={selectedProvider}
            itemToString={(item) => {
              return providers?.find((p) => p.value === item)?.label || '';
            }}
            itemToIcon={(item) => {
              const src = providers?.find((p) => p.value === item)?.icon || '';
              if (src) {
                return (
                  <img src={src} alt="" style={{ width: 16, height: 16 }} />
                );
              }
              return null;
            }}
            placeholder="Select provider"
            variant="inline"
            onValueChange={(value) => {
              setValue('provider', value || '');
              setValue('modelName', '');
            }}
          />
        </div>
      </div>

      <div className={variantPropertyRow}>
        <div className={variantPropertyLabel}>
          <Icon icon={BrainCircuit} size="xs" />
          <span>Model</span>
        </div>
        <div className={variantPropertyValue}>
          <Combobox
            key={selectedProvider}
            items={models?.map((model) => model.id) || []}
            value={selectedModel}
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
            variant="inline"
            onValueChange={(value) => setValue('modelName', value || '')}
          />
        </div>
      </div>
      <div className={variantPropertyColumn}>
        <div className={variantPropertyLabel}>
          <span>System</span>
          <div className={markdownLabelInfo}>
            <Markdown width={14} height={14} />
            <span>Markdown Supported</span>
          </div>
        </div>
        <MarkdownEditor />
      </div>
    </div>
  );
};

export default VariantForm;
