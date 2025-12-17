import { Button } from '@llmops/ui';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { variantContainer, variantHeader } from '../-components/variants.css';
import { Icon } from '@client/components/icons';
import { Save } from 'lucide-react';
import VariantForm, { type VariantFormData } from '../-components/variant-form';
import { useCreateVariant } from '@client/hooks/mutations/useCreateVariant';

export const Route = createFileRoute(
  '/(app)/configs/$id/_variants/variants/$variant'
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { id: configId } = Route.useParams();
  const navigate = useNavigate();
  const createVariant = useCreateVariant();

  const form = useForm<VariantFormData>({
    defaultValues: {
      name: '',
      provider: '',
      modelName: '',
    },
  });

  const onSubmit = async (data: VariantFormData) => {
    if (!data.name.trim() || !data.provider || !data.modelName) {
      return;
    }
    try {
      // Create the variant and link it to the config in one call
      await createVariant.mutateAsync({
        configId,
        name: data.name,
        provider: data.provider,
        modelName: data.modelName,
      });

      navigate({
        to: '/configs/$id/variants',
        params: { id: configId },
      });
    } catch (error) {
      console.error('Error creating variant:', error);
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
