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
import { Icon } from '@client/components/icons';
import { BrainCircuit, PenLine } from 'lucide-react';
import MarkdownEditor from './editor';
import Markdown from '@client/components/icons/markdown';
import {
  ModelSettingsPopover,
  type ModelSettings,
} from './model-settings-popover';

export type VariantFormData = {
  variant_name: string;
  provider: string;
  modelName: string;
  system_prompt: string;
  // Model parameters
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
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
  const temperature = useWatch({
    control,
    name: 'temperature',
  });
  const maxTokens = useWatch({
    control,
    name: 'maxTokens',
  });
  const topP = useWatch({
    control,
    name: 'topP',
  });
  const frequencyPenalty = useWatch({
    control,
    name: 'frequencyPenalty',
  });
  const presencePenalty = useWatch({
    control,
    name: 'presencePenalty',
  });

  const modelSettings: ModelSettings = {
    provider: selectedProvider || '',
    modelName: selectedModel || '',
    temperature,
    maxTokens,
    topP,
    frequencyPenalty,
    presencePenalty,
  };

  const handleModelSettingsChange = (settings: ModelSettings) => {
    if (settings.provider !== selectedProvider) {
      setValue('provider', settings.provider, {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
    if (settings.modelName !== selectedModel) {
      setValue('modelName', settings.modelName, {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
    if (settings.temperature !== temperature) {
      setValue('temperature', settings.temperature, {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
    if (settings.maxTokens !== maxTokens) {
      setValue('maxTokens', settings.maxTokens, {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
    if (settings.topP !== topP) {
      setValue('topP', settings.topP, {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
    if (settings.frequencyPenalty !== frequencyPenalty) {
      setValue('frequencyPenalty', settings.frequencyPenalty, {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
    if (settings.presencePenalty !== presencePenalty) {
      setValue('presencePenalty', settings.presencePenalty, {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
  };

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
          <Icon icon={BrainCircuit} size="xs" />
          <span>Model</span>
        </div>
        <div className={variantPropertyValue}>
          <ModelSettingsPopover
            value={modelSettings}
            onChange={handleModelSettingsChange}
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
