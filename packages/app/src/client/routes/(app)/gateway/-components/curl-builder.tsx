import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { Button } from '@ui';
import { useProviderConfigs } from '@client/hooks/queries/useProviderConfigs';
import {
  useProvidersList,
  type ProviderInfo,
} from '@client/hooks/queries/useProvidersList';
import { useProviderModels } from '@client/hooks/queries/useProviderModels';
import { InlineSelect, type InlineSelectOption } from './inline-select';
import * as styles from './curl-builder.css';

interface SelectedState {
  providerId: string | null;
  providerConfigId: string | null;
  modelId: string | null;
}

export function CurlBuilder() {
  const [copied, setCopied] = useState(false);
  const [selected, setSelected] = useState<SelectedState>({
    providerId: null,
    providerConfigId: null,
    modelId: null,
  });

  // Fetch data
  const { data: providerConfigs, isLoading: configsLoading } =
    useProviderConfigs();
  const { data: availableProviders } = useProvidersList();
  const { data: models, isLoading: modelsLoading } = useProviderModels(
    selected.providerId,
  );

  // Get provider info helper
  const getProviderInfo = (providerId: string): ProviderInfo | undefined => {
    return availableProviders?.find((p) => p.id === providerId);
  };

  // Build provider options from configured providers
  const providerOptions: InlineSelectOption[] = providerConfigs
    ? providerConfigs.map((config) => {
        const info = getProviderInfo(config.providerId);
        const displayName = config.name || info?.name || config.providerId;
        const slug = config.slug ? `@${config.slug}` : undefined;
        return {
          id: config.id,
          label: displayName,
          secondary: slug,
          selectedLabel: slug || displayName,
          icon: info?.logo,
        };
      })
    : [];

  // Build model options
  const selectedConfig = providerConfigs?.find(
    (c) => c.id === selected.providerConfigId,
  );
  const selectedProviderInfo = selectedConfig
    ? getProviderInfo(selectedConfig.providerId)
    : undefined;
  const modelOptions: InlineSelectOption[] = models
    ? models.map((model) => ({
        id: model.id,
        label: model.name || model.id,
        selectedLabel: model.id,
        icon: selectedProviderInfo?.logo,
      }))
    : [];

  // Get the selected values for display
  const selectedProviderConfig = providerConfigs?.find(
    (c) => c.id === selected.providerConfigId,
  );
  const selectedModel = models?.find((m) => m.id === selected.modelId);

  // Get provider slug for model prefix
  const providerSlug = selectedProviderConfig?.slug
    ? `@${selectedProviderConfig.slug}/`
    : '';

  // Build the full curl command for copying
  const buildCurlCommand = (): string => {
    const baseUrl =
      typeof window !== 'undefined'
        ? `${window.location.origin}${window.bootstrapData?.basePath === '/' ? '' : window.bootstrapData?.basePath || ''}`
        : '';
    const modelValue = selectedModel
      ? `${providerSlug}${selectedModel.id}`
      : '<provider>/<model>';

    return `curl -X POST ${baseUrl}/api/genai/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "${modelValue}",
    "messages": [
      {"role": "user", "content": "Hello!"}
    ]
  }'`;
  };

  const handleCopy = async () => {
    const command = buildCurlCommand();
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = command;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleProviderChange = (option: InlineSelectOption) => {
    const config = providerConfigs?.find((c) => c.id === option.id);
    setSelected((prev) => ({
      ...prev,
      providerConfigId: option.id,
      providerId: config?.providerId ?? null,
      modelId: null, // Reset model when provider changes
    }));
  };

  const handleModelChange = (option: InlineSelectOption) => {
    setSelected((prev) => ({
      ...prev,
      modelId: option.id,
    }));
  };

  const baseUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}${window.bootstrapData?.basePath === '/' ? '' : window.bootstrapData?.basePath || ''}`
      : '';

  if (configsLoading) {
    return <div className={styles.loading}>Loading configuration...</div>;
  }

  return (
    <div className={styles.codeBlockContainer}>
      <div className={styles.codeBlockHeader}>
        <Button variant="outline" scheme="gray" size="sm" onClick={handleCopy}>
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? 'Copied!' : 'Copy Curl'}
        </Button>
      </div>
      <div className={styles.codeBlock}>
        <code className={styles.codeElement}>
          <span className={styles.codeLine}>
            <span className={styles.codeKeyword}>curl</span> -X POST {baseUrl}
            /api/genai/v1/chat/completions \
          </span>

          <span className={styles.codeLineIndent}>
            -H{' '}
            <span className={styles.codeString}>
              "Content-Type: application/json"
            </span>{' '}
            \
          </span>

          <span className={styles.codeLineIndent}>
            -d <span className={styles.codeString}>{"'{"}</span>
          </span>

          <span className={styles.codeLineIndent}>
            {'    '}
            <span className={styles.codeString}>
              "model": "
              <InlineSelect
                value={selected.providerConfigId}
                options={providerOptions}
                onChange={handleProviderChange}
                placeholder="@provider"
                emptyMessage="No providers configured"
                isLoading={configsLoading}
              />
              /
              <InlineSelect
                value={selected.modelId}
                options={modelOptions}
                onChange={handleModelChange}
                placeholder="model"
                emptyMessage={
                  selected.providerId
                    ? 'No models available'
                    : 'Select a provider first'
                }
                isLoading={modelsLoading}
              />
              ",
            </span>
          </span>

          <span className={styles.codeLineIndent}>
            {'    '}
            <span className={styles.codeString}>
              "messages": [{'{"role": "user", "content": "Hello!"}'}]
            </span>
          </span>

          <span className={styles.codeLineIndent}>
            <span className={styles.codeString}>{"  }'"}</span>
          </span>
        </code>
      </div>
    </div>
  );
}
