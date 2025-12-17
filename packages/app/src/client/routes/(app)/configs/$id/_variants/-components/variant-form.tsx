import { type UseFormReturn } from 'react-hook-form';
import { useState } from 'react';
import {
  variantFormContainer,
  variantPropertyRow,
  variantPropertyLabel,
  variantPropertyValue,
  variantInlineInput,
} from './variants.css';
import { Combobox } from '@llmops/ui';
import { Icon } from '@client/components/icons';
import { BrainCircuit, CardSim, PenLine } from 'lucide-react';

const providers = window.bootstrapData?.llmProviders?.map((provider) => {
  return {
    label: provider.name,
    icon: provider.imageURI,
    value: provider.key,
  };
});

const models = [
  'gpt-4o',
  'gpt-4o-mini',
  'claude-3.5-sonnet',
  'claude-3.5-haiku',
  'gemini-2.0-flash',
  'gemini-1.5-pro',
  'llama-3.3-70b',
  'mistral-large',
  'command-r-plus',
];

const VariantForm = ({ form }: { form: UseFormReturn<{ name: string }> }) => {
  const {
    register,
    formState: { errors },
  } = form;

  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);

  return (
    <div className={variantFormContainer}>
      <div className={variantPropertyRow}>
        <div className={variantPropertyLabel}>
          <Icon icon={PenLine} size="xs" />
          <span>Name</span>
        </div>
        <div className={variantPropertyValue}>
          <input
            {...register('name', { required: 'Variant name is required' })}
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
            items={providers?.map((provider) => provider.value) || []}
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
            onValueChange={setSelectedProvider}
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
            items={models}
            placeholder="Select model"
            variant="inline"
            disabled={!selectedProvider}
          />
        </div>
      </div>
      {/*<div className={variantContentArea}>
        <textarea
          placeholder="Start writing your prompt..."
          className={variantTextarea}
        />
      </div>*/}
    </div>
  );
};

export default VariantForm;
