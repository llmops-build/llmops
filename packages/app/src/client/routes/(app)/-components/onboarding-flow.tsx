import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Check, ArrowRight, Loader2 } from 'lucide-react';
import { Combobox } from '@ui';
import {
  useProvidersList,
  type ProviderInfo,
} from '@client/hooks/queries/useProvidersList';
import { useUpsertProviderConfig } from '@client/hooks/mutations/useUpsertProviderConfig';
import { useCreateConfig } from '@client/hooks/mutations/useCreateConfig';
import {
  getProviderFields,
  getRequiredFields,
  type ProviderFieldDefinition,
} from '../settings/_settings/-components/provider-field-definitions';
import * as styles from './overview.css';

type OnboardingStep = 'provider' | 'config' | 'complete';

interface OnboardingFlowProps {
  hasProviders?: boolean;
}

export function OnboardingFlow({ hasProviders = false }: OnboardingFlowProps) {
  const navigate = useNavigate();
  // Start at config step if providers already exist
  const [step, setStep] = useState<OnboardingStep>(
    hasProviders ? 'config' : 'provider'
  );
  const [selectedProvider, setSelectedProvider] = useState<ProviderInfo | null>(
    null
  );
  const [configValues, setConfigValues] = useState<Record<string, string>>({});
  const [configName, setConfigName] = useState('');

  const { data: availableProviders, isLoading: providersLoading } =
    useProvidersList();
  const upsertProvider = useUpsertProviderConfig();
  const createConfig = useCreateConfig();

  // Update step if hasProviders changes
  useEffect(() => {
    if (hasProviders && step === 'provider') {
      setStep('config');
    }
  }, [hasProviders, step]);

  const handleProviderChange = useCallback((provider: ProviderInfo | null) => {
    setSelectedProvider(provider);
    setConfigValues({});
  }, []);

  const handleConfigChange = useCallback((fieldName: string, value: string) => {
    setConfigValues((prev) => ({ ...prev, [fieldName]: value }));
  }, []);

  const handleProviderSubmit = useCallback(async () => {
    if (!selectedProvider) return;

    const requiredFields = getRequiredFields(selectedProvider.id);
    const missingRequired = requiredFields.some(
      (field) => !configValues[field]?.trim()
    );

    if (missingRequired) {
      return;
    }

    try {
      const config: Record<string, unknown> = {};
      Object.entries(configValues).forEach(([key, value]) => {
        if (value.trim()) {
          config[key] = value.trim();
        }
      });

      await upsertProvider.mutateAsync({
        providerId: selectedProvider.id,
        config,
        enabled: true,
      });

      setStep('config');
    } catch (error) {
      console.error('Failed to save provider:', error);
    }
  }, [selectedProvider, configValues, upsertProvider]);

  const handleConfigSubmit = useCallback(async () => {
    if (!configName.trim()) return;

    try {
      await createConfig.mutateAsync({ name: configName.trim() });
      setStep('complete');
    } catch (error) {
      console.error('Failed to create config:', error);
    }
  }, [configName, createConfig]);

  const handleSkipConfig = useCallback(() => {
    navigate({ to: '/configs/$id', params: { id: 'new' } });
  }, [navigate]);

  const isProviderFormValid = useCallback(() => {
    if (!selectedProvider) return false;
    const requiredFields = getRequiredFields(selectedProvider.id);
    return requiredFields.every((field) => configValues[field]?.trim());
  }, [selectedProvider, configValues]);

  const getStepStatus = (
    targetStep: OnboardingStep
  ): 'completed' | 'active' | 'pending' => {
    const steps: OnboardingStep[] = hasProviders
      ? ['config', 'complete']
      : ['provider', 'config', 'complete'];
    const currentIndex = steps.indexOf(step);
    const targetIndex = steps.indexOf(targetStep);

    // If hasProviders, provider step is always completed
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

  return (
    <div className={styles.onboardingContainer}>
      <div className={styles.onboardingHeader}>
        <h1 className={styles.onboardingTitle}>
          {hasProviders
            ? 'Create Your First Config'
            : 'Set Up Your First Provider'}
        </h1>
        <p className={styles.onboardingSubtitle}>
          {hasProviders
            ? 'You have providers set up. Now create a config to define routing rules and model settings.'
            : "Let's get you started by setting up your first provider and config."}
        </p>
      </div>

      {!hasProviders && (
        <div className={styles.onboardingSteps}>
          <div
            className={styles.onboardingStep({
              status: getStepStatus('provider'),
            })}
          >
            {getStepStatus('provider') === 'completed' ? (
              <Check size={16} />
            ) : (
              '1'
            )}
          </div>
          <div className={styles.onboardingStepConnector} />
          <div
            className={styles.onboardingStep({
              status: getStepStatus('config'),
            })}
          >
            {getStepStatus('config') === 'completed' ? (
              <Check size={16} />
            ) : (
              '2'
            )}
          </div>
          <div className={styles.onboardingStepConnector} />
          <div
            className={styles.onboardingStep({
              status: getStepStatus('complete'),
            })}
          >
            {getStepStatus('complete') === 'completed' ? (
              <Check size={16} />
            ) : (
              '3'
            )}
          </div>
        </div>
      )}

      {step === 'provider' && (
        <div className={styles.onboardingCard}>
          <h2 className={styles.onboardingCardTitle}>Add a Provider</h2>
          <p className={styles.onboardingSubtitle}>
            Select an LLM provider to connect with.
          </p>

          <div className={styles.onboardingField}>
            <label className={styles.onboardingFieldLabel}>Provider</label>
            <Combobox<ProviderInfo>
              items={availableProviders || []}
              value={selectedProvider}
              onValueChange={handleProviderChange}
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
                configValues={configValues}
                onChange={handleConfigChange}
              />
            </div>
          )}

          <div className={styles.onboardingActions}>
            <button
              type="button"
              className={styles.onboardingButton({ variant: 'primary' })}
              disabled={!isProviderFormValid() || upsertProvider.isPending}
              onClick={handleProviderSubmit}
            >
              {upsertProvider.isPending ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {step === 'config' && (
        <div className={styles.onboardingCard}>
          <h2 className={styles.onboardingCardTitle}>
            {hasProviders
              ? 'Create Your First Config'
              : 'Step 2: Create Your First Config'}
          </h2>
          <p
            className={styles.onboardingSubtitle}
            style={{ marginBottom: '1rem' }}
          >
            Configs let you define routing rules and model settings.
          </p>

          <div className={styles.onboardingForm}>
            <div className={styles.onboardingField}>
              <label className={styles.onboardingFieldLabel}>
                Config Name <span style={{ color: 'var(--error9)' }}>*</span>
              </label>
              <input
                type="text"
                className={styles.onboardingInput}
                value={configName}
                onChange={(e) => setConfigName(e.target.value)}
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
              className={styles.onboardingButton({ variant: 'secondary' })}
              onClick={handleSkipConfig}
            >
              Skip for now
            </button>
            <button
              type="button"
              className={styles.onboardingButton({ variant: 'primary' })}
              disabled={!configName.trim() || createConfig.isPending}
              onClick={handleConfigSubmit}
            >
              {createConfig.isPending ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  Create Config
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {step === 'complete' && (
        <div className={styles.onboardingCard}>
          <div className={styles.completeContent}>
            <div className={styles.successIcon}>
              <Check size={24} />
            </div>
            <h2 className={styles.onboardingCardTitle}>You're all set!</h2>
            <p
              className={styles.onboardingSubtitle}
              style={{ marginBottom: '1rem' }}
            >
              {hasProviders
                ? 'Your config has been created. You can now start configuring model variants and routing rules.'
                : 'Your provider and config have been created. You can now start configuring model variants and routing rules.'}
            </p>
            <button
              type="button"
              className={styles.onboardingButton({ variant: 'primary' })}
              onClick={() => navigate({ to: '/' })}
            >
              Go to Dashboard
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Provider config fields component (inline version)
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
