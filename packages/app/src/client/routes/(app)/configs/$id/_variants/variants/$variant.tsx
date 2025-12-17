import { Button } from '@llmops/ui';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { variantContainer, variantHeader } from '../-components/variants.css';
import { Icon } from '@client/components/icons';
import { Save } from 'lucide-react';
import VariantForm from '../-components/variant-form';

export const Route = createFileRoute(
  '/(app)/configs/$id/_variants/variants/$variant'
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { id: configId } = Route.useParams();
  const navigate = useNavigate();
  const form = useForm({
    defaultValues: {
      name: '',
    },
  });

  const onSubmit = async (data: { name: string }) => {
    if (!data.name.trim()) {
      return;
    }
    try {
      console.log('Creating variant with name:', data.name);
      // TODO: Add variant creation logic
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
