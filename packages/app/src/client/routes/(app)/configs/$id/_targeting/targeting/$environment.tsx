import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Button, Combobox } from '@llmops/ui';
import { useState, useEffect } from 'react';
import { useEnvironments } from '@client/hooks/queries/useEnvironments';
import { useConfigVariants } from '@client/hooks/queries/useConfigVariants';
import { useTargetingRules } from '@client/hooks/queries/useTargetingRules';
import { useSetTargeting } from '@client/hooks/mutations/useSetTargeting';
import { useVariantVersions } from '@client/hooks/queries/useVariantVersions';
import {
  variantContainer,
  variantHeader,
  variantPropertyRow,
  variantPropertyLabel,
  variantPropertyValue,
  environmentHighlight,
  environmentNameHighlight,
} from '../../_variants/-components/variants.css';
import { Icon } from '@client/components/icons';
import { Save } from 'lucide-react';

export const Route = createFileRoute(
  '/(app)/configs/$id/_targeting/targeting/$environment'
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { id: configId, environment: environmentId } = Route.useParams();

  const { data: environments, isLoading: loadingEnvironments } =
    useEnvironments();
  const { data: variants, isLoading: loadingVariants } =
    useConfigVariants(configId);
  const { data: targetingRules, isLoading: loadingTargetingRules } =
    useTargetingRules(configId);

  const isLoading =
    loadingEnvironments || loadingVariants || loadingTargetingRules;

  if (isLoading) {
    return <div>Loading...</div>;
  }

  const environment = environments?.find((env) => env.id === environmentId);

  if (!environment) {
    return <div>Environment not found</div>;
  }

  const existingRule = targetingRules?.find(
    (rule) => rule.environmentId === environmentId
  );

  return (
    <TargetingForm
      configId={configId}
      environmentId={environmentId}
      environment={environment}
      variants={variants ?? []}
      initialVariantId={existingRule?.configVariantId ?? null}
      initialVariantVersionId={existingRule?.variantVersionId ?? null}
    />
  );
}

type TargetingFormProps = {
  configId: string;
  environmentId: string;
  environment: { id: string; name: string; isProd: boolean };
  variants: Array<{
    id: string;
    name: string;
    variantId: string;
    provider: string | null;
    modelName: string | null;
  }>;
  initialVariantId: string | null;
  initialVariantVersionId: string | null | undefined;
};

type VersionOption = {
  id: string | null;
  label: string;
  version: number | null;
};

function TargetingForm({
  configId,
  environmentId,
  environment,
  variants,
  initialVariantId,
  initialVariantVersionId,
}: TargetingFormProps) {
  const navigate = useNavigate();
  const setTargeting = useSetTargeting();

  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    initialVariantId
  );
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(
    initialVariantVersionId ?? null
  );

  // Get the variantId (not configVariantId) for fetching versions
  const selectedConfigVariant = variants.find(
    (v) => v.id === selectedVariantId
  );
  const variantIdForVersions = selectedConfigVariant?.variantId ?? '';

  const { data: versions, isLoading: loadingVersions } =
    useVariantVersions(variantIdForVersions);

  // Reset version selection when variant changes
  useEffect(() => {
    if (selectedVariantId !== initialVariantId) {
      setSelectedVersionId(null);
    }
  }, [selectedVariantId, initialVariantId]);

  const variantIds = variants.map((v) => v.id);

  // Build version options - "Latest" option + all available versions
  const versionOptions: VersionOption[] = [
    { id: null, label: 'Latest (auto-update)', version: null },
    ...(versions?.map((v) => ({
      id: v.id,
      label: `Version ${v.version}`,
      version: v.version,
    })) ?? []),
  ];

  const handleSave = async () => {
    if (!selectedVariantId) return;

    try {
      await setTargeting.mutateAsync({
        environmentId,
        configId,
        configVariantId: selectedVariantId,
        variantVersionId: selectedVersionId,
      });
      navigate({
        to: '/configs/$id/targeting',
        params: { id: configId },
      });
    } catch (error) {
      console.error('Error setting targeting:', error);
    }
  };

  const handleClose = () => {
    navigate({
      to: '/configs/$id/targeting',
      params: { id: configId },
    });
  };

  return (
    <div>
      <div className={variantHeader}>
        <Button variant="ghost" scheme="gray" size="sm" onClick={handleClose}>
          Close
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={handleSave}
          disabled={!selectedVariantId || setTargeting.isPending}
        >
          <Icon icon={Save} size="sm" />
          {setTargeting.isPending ? 'Saving...' : 'Save'}
        </Button>
      </div>
      <div className={variantContainer}>
        <div className={environmentHighlight}>
          The selected variant will be served to all requests in the{' '}
          <span className={environmentNameHighlight}>{environment.name}</span>{' '}
          environment
        </div>

        <div className={variantPropertyRow}>
          <div className={variantPropertyLabel} style={{ minWidth: '120px' }}>
            Variant
          </div>
          <div className={variantPropertyValue}>
            <Combobox
              items={variantIds}
              value={selectedVariantId}
              onValueChange={setSelectedVariantId}
              placeholder="Select a variant..."
              itemToString={(id) => {
                if (!id) return '';
                const variant = variants.find((v) => v.id === id);
                return variant ? variant.name : id;
              }}
            />
          </div>
        </div>
        {variantIds.length === 0 && (
          <div style={{ marginTop: '1rem', opacity: 0.6 }}>
            No variants available. Create a variant first to configure
            targeting.
          </div>
        )}

        {/* Version selector - only show when a variant is selected */}
        {selectedVariantId && (
          <div className={variantPropertyRow}>
            <div className={variantPropertyLabel} style={{ minWidth: '120px' }}>
              Version
            </div>
            <div className={variantPropertyValue}>
              {loadingVersions ? (
                <span style={{ opacity: 0.6 }}>Loading versions...</span>
              ) : (
                <Combobox<VersionOption>
                  items={versionOptions}
                  value={
                    versionOptions.find((v) => v.id === selectedVersionId) ??
                    versionOptions[0]
                  }
                  onValueChange={(option) =>
                    setSelectedVersionId(option?.id ?? null)
                  }
                  placeholder="Select version..."
                  itemToString={(option) => option?.label ?? ''}
                />
              )}
            </div>
          </div>
        )}

        {/* Show info about version selection */}
        {selectedVariantId && !selectedVersionId && (
          <div
            style={{
              marginTop: '0.5rem',
              fontSize: '0.75rem',
              color: 'var(--gray9)',
            }}
          >
            Using &quot;Latest&quot; will automatically use the newest version
            when new versions are created.
          </div>
        )}
        {selectedVariantId && selectedVersionId && (
          <div
            style={{
              marginTop: '0.5rem',
              fontSize: '0.75rem',
              color: 'var(--gray9)',
            }}
          >
            Pinning to a specific version means this environment will not
            auto-update when new versions are created.
          </div>
        )}
      </div>
    </div>
  );
}
