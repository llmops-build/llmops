import { useState, useEffect } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useForm, useWatch } from 'react-hook-form';
import { Check, Loader2 } from 'lucide-react';
import { Combobox } from '@ui';
import {
  useProvidersList,
  type ProviderInfo,
} from '@client/hooks/queries/useProvidersList';
import { useUpsertProviderConfig } from '@client/hooks/mutations/useUpsertProviderConfig';
import { useCreateConfig } from '@client/hooks/mutations/useCreateConfig';
import {
  getProviderFields,
  type ProviderFieldDefinition,
} from '../settings/_settings/-components/provider-field-definitions';
import * as styles from './overview.css';

type OnboardingStep = 'provider' | 'config' | 'complete';

interface OnboardingFlowProps {
  hasProviders?: boolean;
}

interface ProviderFormData {
  provider: ProviderInfo | null;
  config: Record<string, string>;
}

interface ConfigFormData {
  name: string;
}

export function OnboardingFlow({ hasProviders = false }: OnboardingFlowProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState<OnboardingStep>(
    hasProviders ? 'config' : 'provider'
  );
  const [savedProvider, setSavedProvider] = useState<ProviderInfo | null>(null);

  const { data: availableProviders, isLoading: providersLoading } =
    useProvidersList();
  const upsertProvider = useUpsertProviderConfig();
  const createConfig = useCreateConfig();

  // Provider form
  const providerForm = useForm<ProviderFormData>({
    defaultValues: {
      provider: null,
      config: {},
    },
  });

  // Config form
  const configForm = useForm<ConfigFormData>({
    defaultValues: {
      name: '',
    },
  });

  const selectedProvider = useWatch({
    control: providerForm.control,
    name: 'provider',
  });

  const configValues = useWatch({
    control: providerForm.control,
    name: 'config',
  });

  const configName = useWatch({
    control: configForm.control,
    name: 'name',
  });

  // Reset config values when provider changes
  useEffect(() => {
    providerForm.setValue('config', {});
  }, [selectedProvider, providerForm]);

  useEffect(() => {
    if (hasProviders && step === 'provider') {
      setStep('config');
    }
  }, [hasProviders, step]);

  const handleProviderSubmit = providerForm.handleSubmit(async (data) => {
    if (!data.provider) return;

    try {
      const config: Record<string, unknown> = {};
      Object.entries(data.config).forEach(([key, value]) => {
        if (value?.trim()) {
          config[key] = value.trim();
        }
      });

      await upsertProvider.mutateAsync({
        providerId: data.provider.id,
        config,
        enabled: true,
      });

      setSavedProvider(data.provider);
      setStep('config');
    } catch (error) {
      console.error('Failed to save provider:', error);
    }
  });

  const handleConfigSubmit = configForm.handleSubmit(async (data) => {
    if (!data.name.trim()) return;

    try {
      await createConfig.mutateAsync({ name: data.name.trim() });
      setStep('complete');
    } catch (error) {
      console.error('Failed to create config:', error);
    }
  });

  const handleSkipConfig = () => {
    navigate({ to: '/configs/$id', params: { id: 'new' } });
  };

  const isProviderFormValid = () => {
    if (!selectedProvider) return false;
    const fields = getProviderFields(selectedProvider.id);
    const requiredFields = fields.filter((f) => f.required);
    return requiredFields.every((field) => configValues?.[field.name]?.trim());
  };

  const getStepStatus = (
    targetStep: OnboardingStep
  ): 'completed' | 'active' | 'pending' => {
    const steps: OnboardingStep[] = hasProviders
      ? ['config', 'complete']
      : ['provider', 'config', 'complete'];
    const currentIndex = steps.indexOf(step);
    const targetIndex = steps.indexOf(targetStep);

    if (hasProviders && targetStep === 'provider') return 'completed';

    if (targetIndex < currentIndex) return 'completed';
    if (targetIndex === currentIndex) return 'active';
    return 'pending';
  };

  if (providersLoading && !hasProviders) {
    return (
      <div className={styles.onboardingContainer}>
        <Loader2 className="animate-spin" size={32} />
      </div>
    );
  }

  const providerStatus = getStepStatus('provider');
  const configStatus = getStepStatus('config');

  return (
    <div className={styles.onboardingContainer}>
      <div className={styles.onboardingTimeline}>
        {/* Step 1: Setup Provider */}
        <div className={styles.onboardingStepWrapper}>
          <div className={styles.onboardingStepIndicator}>
            <div
              className={styles.onboardingStepCircle({
                status: providerStatus,
              })}
            >
              {providerStatus === 'completed' ? <Check size={14} /> : '1'}
            </div>
            <div
              className={styles.onboardingStepLine({ status: providerStatus })}
            />
          </div>
          <div className={styles.onboardingStepContent}>
            <div className={styles.onboardingStepHeader}>
              <h2 className={styles.onboardingStepTitle}>
                Setup Provider to connect AI models
              </h2>
              <p className={styles.onboardingStepSubtitle}>
                Add your LLM provider API key to get started
              </p>
            </div>

            {step === 'provider' && (
              <form
                onSubmit={handleProviderSubmit}
                className={styles.onboardingCard}
              >
                <div className={styles.onboardingField}>
                  <label className={styles.onboardingFieldLabel}>
                    Provider
                  </label>
                  <Combobox<ProviderInfo>
                    items={availableProviders || []}
                    value={selectedProvider}
                    onValueChange={(provider) =>
                      providerForm.setValue('provider', provider)
                    }
                    itemToString={(item) => item?.name ?? ''}
                    itemToIcon={(item) =>
                      item?.logo ? (
                        <img
                          src={item.logo}
                          alt={item.name}
                          style={{
                            width: 16,
                            height: 16,
                            borderRadius: 2,
                            objectFit: 'contain',
                          }}
                        />
                      ) : null
                    }
                    placeholder="Select a provider"
                  />
                </div>

                {selectedProvider && (
                  <div className={styles.onboardingForm}>
                    <ProviderConfigFields
                      providerId={selectedProvider.id}
                      configValues={configValues || {}}
                      onChange={(fieldName, value) =>
                        providerForm.setValue(`config.${fieldName}`, value)
                      }
                    />
                  </div>
                )}

                <div className={styles.onboardingActions}>
                  <button
                    type="submit"
                    className={styles.onboardingButton({ variant: 'primary' })}
                    disabled={
                      !isProviderFormValid() || upsertProvider.isPending
                    }
                  >
                    {upsertProvider.isPending ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Continue'
                    )}
                  </button>
                </div>
              </form>
            )}

            {providerStatus === 'completed' && savedProvider && (
              <div className={styles.onboardingCard}>
                <div className={styles.onboardingSuccessRow}>
                  <div className={styles.onboardingSuccessIcon}>
                    <Check size={12} />
                  </div>
                  <div className={styles.onboardingSuccessContent}>
                    <p className={styles.onboardingSuccessTitle}>
                      {savedProvider.name} added successfully
                    </p>
                    <p className={styles.onboardingSuccessSubtitle}>
                      Your AI Provider is now integrated
                    </p>
                  </div>
                  <Link
                    className={styles.onboardingEditButton}
                    to="/settings/workspace-providers"
                  >
                    Edit
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Step 2: Create Config */}
        <div className={styles.onboardingStepWrapper}>
          <div className={styles.onboardingStepIndicator}>
            <div
              className={styles.onboardingStepCircle({ status: configStatus })}
            >
              {configStatus === 'completed' ? <Check size={14} /> : '2'}
            </div>
            {configStatus !== 'completed' && (
              <div
                className={styles.onboardingStepLine({ status: configStatus })}
              />
            )}
          </div>
          <div className={styles.onboardingStepContent}>
            <div className={styles.onboardingStepHeader}>
              <h2 className={styles.onboardingStepTitle}>
                Create your first config
              </h2>
              <p className={styles.onboardingStepSubtitle}>
                Configs let you define routing rules and model settings
              </p>
            </div>

            {step === 'config' && (
              <form
                onSubmit={handleConfigSubmit}
                className={styles.onboardingCard}
              >
                <div className={styles.onboardingForm}>
                  <div className={styles.onboardingField}>
                    <label className={styles.onboardingFieldLabel}>
                      Config Name{' '}
                      <span style={{ color: 'var(--error9)' }}>*</span>
                    </label>
                    <input
                      type="text"
                      className={styles.onboardingInput}
                      {...configForm.register('name', { required: true })}
                      placeholder="Coding Agent, Audit Agent, etc."
                    />
                    <span className={styles.onboardingFieldDescription}>
                      A unique name to identify this configuration.
                    </span>
                  </div>
                </div>

                <div className={styles.onboardingActions}>
                  <button
                    type="button"
                    className={styles.onboardingButton({
                      variant: 'secondary',
                    })}
                    onClick={handleSkipConfig}
                  >
                    Skip for now
                  </button>
                  <button
                    type="submit"
                    className={styles.onboardingButton({ variant: 'primary' })}
                    disabled={!configName?.trim() || createConfig.isPending}
                  >
                    {createConfig.isPending ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create Config'
                    )}
                  </button>
                </div>
              </form>
            )}

            {configStatus === 'completed' && (
              <div className={styles.onboardingCard}>
                <div className={styles.onboardingSuccessRow}>
                  <div className={styles.onboardingSuccessIcon}>
                    <Check size={12} />
                  </div>
                  <div className={styles.onboardingSuccessContent}>
                    <p className={styles.onboardingSuccessTitle}>
                      Config "{configName}" created successfully
                    </p>
                    <p className={styles.onboardingSuccessSubtitle}>
                      You can now start configuring model variants and routing
                      rules.
                    </p>
                  </div>
                </div>
                <div className={styles.onboardingActions}>
                  <button
                    type="button"
                    className={styles.onboardingButton({ variant: 'primary' })}
                    onClick={() => navigate({ to: '/' })}
                  >
                    Go to Dashboard
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Provider config fields component
interface ProviderConfigFieldsProps {
  providerId: string;
  configValues: Record<string, string>;
  onChange: (fieldName: string, value: string) => void;
}

function ProviderConfigFields({
  providerId,
  configValues,
  onChange,
}: ProviderConfigFieldsProps) {
  const fields = getProviderFields(providerId);

  return (
    <>
      {fields.map((field) => (
        <ProviderField
          key={field.name}
          field={field}
          value={configValues[field.name] || ''}
          onChange={(value) => onChange(field.name, value)}
        />
      ))}
    </>
  );
}

interface ProviderFieldProps {
  field: ProviderFieldDefinition;
  value: string;
  onChange: (value: string) => void;
}

function ProviderField({ field, value, onChange }: ProviderFieldProps) {
  const labelElement = (
    <label className={styles.onboardingFieldLabel}>
      {field.label}
      {field.required && <span style={{ color: 'var(--error9)' }}> *</span>}
    </label>
  );

  const descriptionElement = field.description && (
    <span className={styles.onboardingFieldDescription}>
      {field.description}
    </span>
  );

  switch (field.type) {
    case 'select':
      return (
        <div className={styles.onboardingField}>
          {labelElement}
          <select
            className={styles.onboardingSelect}
            value={value}
            onChange={(e) => onChange(e.target.value)}
          >
            {!field.required && <option value="">Select...</option>}
            {field.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {descriptionElement}
        </div>
      );

    case 'textarea':
      return (
        <div className={styles.onboardingField}>
          {labelElement}
          <textarea
            className={styles.onboardingTextarea}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            rows={4}
          />
          {descriptionElement}
        </div>
      );

    case 'password':
      return (
        <div className={styles.onboardingField}>
          {labelElement}
          <input
            type="password"
            className={styles.onboardingInput}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
          />
          {descriptionElement}
        </div>
      );

    case 'text':
    default:
      return (
        <div className={styles.onboardingField}>
          {labelElement}
          <input
            type="text"
            className={styles.onboardingInput}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
          />
          {descriptionElement}
        </div>
      );
  }
}
