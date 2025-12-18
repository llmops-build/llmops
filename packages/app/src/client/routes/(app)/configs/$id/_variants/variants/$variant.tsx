import { Button } from '@llmops/ui';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { variantContainer, variantHeader } from '../-components/variants.css';
import { Icon } from '@client/components/icons';
import { Save } from 'lucide-react';
import VariantForm, { type VariantFormData } from '../-components/variant-form';
import { useCreateVariant } from '@client/hooks/mutations/useCreateVariant';
import { useUpdateVariant } from '@client/hooks/mutations/useUpdateVariant';
import { useVariantById } from '@client/hooks/queries/useVariantById';
import { useConfigVariants } from '@client/hooks/queries/useConfigVariants';

export const Route = createFileRoute(
  '/(app)/configs/$id/_variants/variants/$variant'
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { id: configId, variant } = Route.useParams();
  const navigate = useNavigate();
  const createVariant = useCreateVariant();
  const updateVariant = useUpdateVariant();
  const { data: variantData } = useVariantById(
    variant === 'new' ? '' : variant
  );
  const { data: configVariants } = useConfigVariants(configId);

  const currentVariant = configVariants?.find((v) => v.variantId === variant);

  const form = useForm<VariantFormData>({
    defaultValues: {
      name: currentVariant?.name || '',
      provider: variantData?.provider || currentVariant?.provider || '',
      modelName: variantData?.modelName || currentVariant?.modelName || '',
    },
  });

  const onSubmit = async (data: VariantFormData) => {
    if (!data.name.trim() || !data.provider || !data.modelName) {
      return;
    }
    try {
      if (variant === 'new') {
        // Create the variant and link it to the config in one call
        await createVariant.mutateAsync({
          configId,
          name: data.name,
          provider: data.provider,
          modelName: data.modelName,
        });
      } else {
        // Update existing variant
        await updateVariant.mutateAsync({
          id: variant,
          name: data.name,
          provider: data.provider,
          modelName: data.modelName,
        });
      }

      // Reset form and navigate away
      form.reset();
      navigate({
        to: '/configs/$id/variants',
        params: { id: configId },
      });
    } catch (error) {
      console.error('Error saving variant:', error);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <div className={variantHeader}>
        <Button
          variant="ghost"
          scheme="gray"
          size="sm"
          onClick={() => {
            navigate({
              to: '/configs/$id/variants',
              params: { id: configId },
            });
          }}
        >
          Close
        </Button>
        <Button variant="primary" size="sm" type="submit">
          <Icon icon={Save} size="xs" />
          Save
        </Button>
      </div>
      <div className={variantContainer}>
        <VariantForm form={form} />
      </div>
    </form>
  );
}
