import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Button, Combobox } from '@llmops/ui';
import { useState, useEffect } from 'react';
import { useEnvironments } from '@client/hooks/queries/useEnvironments';
import { useConfigVariants } from '@client/hooks/queries/useConfigVariants';
import { useTargetingRules } from '@client/hooks/queries/useTargetingRules';
import { useSetTargeting } from '@client/hooks/mutations/useSetTargeting';
import {
  variantContainer,
  variantHeader,
  variantPropertyRow,
  variantPropertyLabel,
  variantPropertyValue,
} from '../../_variants/-components/variants.css';

export const Route = createFileRoute(
  '/(app)/configs/$id/_targeting/targeting/$environment'
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { id: configId, environment: environmentId } = Route.useParams();
  const navigate = useNavigate();

  const { data: environments, isLoading: loadingEnvironments } =
    useEnvironments();
  const { data: variants, isLoading: loadingVariants } =
    useConfigVariants(configId);
  const { data: targetingRules, isLoading: loadingTargetingRules } =
    useTargetingRules(configId);
  const setTargeting = useSetTargeting();

  // Store just the variant ID
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    null
  );

  const environment = environments?.find((env) => env.id === environmentId);
  const existingRule = targetingRules?.find(
    (rule) => rule.environmentId === environmentId
  );

  // Initialize from existing rule
  useEffect(() => {
    if (existingRule && selectedVariantId === null) {
      setSelectedVariantId(existingRule.configVariantId);
    }
  }, [existingRule, selectedVariantId]);

  const isLoading =
    loadingEnvironments || loadingVariants || loadingTargetingRules;

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!environment) {
    return <div>Environment not found</div>;
  }

  // Use variant IDs as items (strings work better with Combobox)
  const variantIds = variants?.map((v) => v.id) ?? [];

  const handleSave = async () => {
    if (!selectedVariantId) return;

    try {
      await setTargeting.mutateAsync({
        environmentId,
        configId,
        configVariantId: selectedVariantId,
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
          {setTargeting.isPending ? 'Saving...' : 'Save'}
        </Button>
      </div>
      <div className={variantContainer}>
        <div className={variantPropertyRow}>
          <div className={variantPropertyLabel} style={{ minWidth: '120px' }}>
            Environment
          </div>
          <div className={variantPropertyValue}>
            {environment.name}
            {environment.isProd && (
              <span style={{ marginLeft: '0.5rem', opacity: 0.6 }}>(prod)</span>
            )}
          </div>
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
                const variant = variants?.find((v) => v.id === id);
                return variant
                  ? `${variant.name} (${variant.provider ?? 'unknown'}/${variant.modelName ?? 'unknown'})`
                  : id;
              }}
              variant="inline"
            />
          </div>
        </div>

        {variantIds.length === 0 && (
          <div style={{ marginTop: '1rem', opacity: 0.6 }}>
            No variants available. Create a variant first to configure
            targeting.
          </div>
        )}
      </div>
    </div>
  );
}
