import { Button } from '@llmops/ui';
import {
  createFileRoute,
  useBlocker,
  useNavigate,
} from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { variantContainer, variantHeader } from '../-components/variants.css';
import { Icon } from '@client/components/icons';
import { Save } from 'lucide-react';
import VariantForm, { type VariantFormData } from '../-components/variant-form';
import { useCreateVariant } from '@client/hooks/mutations/useCreateVariant';
import { useUpdateVariant } from '@client/hooks/mutations/useUpdateVariant';
import { useVariantById } from '@client/hooks/queries/useVariantById';
import { useEffect, useState } from 'react';

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
  const [editorKey, setEditorKey] = useState<string>('new');

  const form = useForm<VariantFormData>({
    defaultValues: {
      variant_name: '',
      provider: '',
      modelName: '',
      system_prompt: '',
    },
  });

  const isDirty = form.formState.isDirty;
  const isSaving = createVariant.isPending || updateVariant.isPending;

  useBlocker({
    shouldBlockFn: () => {
      console.log(isDirty);
      if (isSaving) {
        return false;
      }
      if (isDirty) {
        const shouldLeave = confirm(
          'You have unsaved changes. Are you sure you want to move away from the form?'
        );
        return !shouldLeave;
      }
      return false;
    },
  });

  useEffect(() => {
    if (variantData) {
      const jsonData = variantData.jsonData as Record<string, unknown> | null;
      form.reset(
        {
          variant_name: variantData.name || '',
          provider: variantData.provider || '',
          modelName: variantData.modelName || '',
          system_prompt: (jsonData?.system_prompt as string) || '',
        },
        {
          keepDirty: false,
        }
      );
      // Update editor key to force remount with new initial value
      setEditorKey(variantData.id);
    }
  }, [variantData]);

  const onSubmit = async (data: VariantFormData) => {
    if (!data.variant_name.trim() || !data.provider || !data.modelName) {
      return;
    }
    try {
      const jsonData = {
        system_prompt: data.system_prompt,
      };

      if (variant === 'new') {
        // Create the variant and link it to the config in one call
        await createVariant.mutateAsync({
          configId,
          name: data.variant_name,
          provider: data.provider,
          modelName: data.modelName,
          jsonData,
        });
      } else {
        // Update existing variant
        await updateVariant.mutateAsync({
          id: variant,
          name: data.variant_name,
          provider: data.provider,
          modelName: data.modelName,
          jsonData,
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
    <form onSubmit={form.handleSubmit(onSubmit)} autoComplete="off">
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
        <VariantForm form={form} editorKey={editorKey} />
      </div>
    </form>
  );
}
