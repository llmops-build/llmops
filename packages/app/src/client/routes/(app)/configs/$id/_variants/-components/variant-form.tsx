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
  variant_name: string;
  provider: string;
  modelName: string;
  system_prompt: string;
};

type VariantFormProps = {
  form: UseFormReturn<VariantFormData>;
  editorKey?: string;
};

const VariantForm = ({ form, editorKey }: VariantFormProps) => {
  const {
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
    name: 'variant_name',
  });
  const systemPromptValue = useWatch({
    control,
    name: 'system_prompt',
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
            title="Variant Name"
            data-1p-ignore
            autoComplete="off"
            value={nameValue || ''}
            onChange={(e) =>
              setValue('variant_name', e.target.value, {
                shouldValidate: true,
                shouldDirty: true,
              })
            }
            placeholder="Enter variant name"
            aria-invalid={errors.variant_name ? 'true' : 'false'}
            className={variantInlineInput}
            name="variant_name"
          />
        </div>
      </div>
      {errors.variant_name && (
        <span style={{ color: 'red', fontSize: '0.875rem' }}>
          {errors.variant_name.message}
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
        <MarkdownEditor
          key={editorKey}
          value={systemPromptValue}
          onChange={(value) =>
            setValue('system_prompt', value, {
              shouldValidate: true,
              shouldDirty: true,
            })
          }
        />
      </div>
    </div>
  );
};

export default VariantForm;
