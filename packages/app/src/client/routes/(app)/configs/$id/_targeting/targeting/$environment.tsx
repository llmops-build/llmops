import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Button, Combobox } from '@llmops/ui';
import { useState } from 'react';
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
    provider: string | null;
    modelName: string | null;
  }>;
  initialVariantId: string | null;
};

function TargetingForm({
  configId,
  environmentId,
  environment,
  variants,
  initialVariantId,
}: TargetingFormProps) {
  const navigate = useNavigate();
  const setTargeting = useSetTargeting();

  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    initialVariantId
  );

  const variantIds = variants.map((v) => v.id);

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
          {variantIds.length === 0 && (
            <div style={{ marginTop: '1rem', opacity: 0.6 }}>
              No variants available. Create a variant first to configure
              targeting.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
