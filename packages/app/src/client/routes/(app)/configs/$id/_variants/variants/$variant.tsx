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
import {
  useVariantById,
  variantByIdQueryOptions,
} from '@client/hooks/queries/useVariantById';
import { useEffect, useState } from 'react';

export const Route = createFileRoute(
  '/(app)/configs/$id/_variants/variants/$variant'
)({
  component: RouteComponent,
  loader: async ({ params, context }) => {
    if (params.variant === 'new') {
      return { title: 'New Variant' };
    }

    const variant = await context.queryClient.ensureQueryData(
      variantByIdQueryOptions(params.variant)
    );

    return {
      title: variant?.name ?? params.variant,
    };
  },
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
      temperature: undefined,
      maxTokens: undefined,
      topP: undefined,
      frequencyPenalty: undefined,
      presencePenalty: undefined,
    },
  });

  const isDirty = form.formState.isDirty;
  const isSaving = createVariant.isPending || updateVariant.isPending;

  useBlocker({
    shouldBlockFn: () => {
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
          // Prefer model from jsonData, fallback to modelName column for backwards compatibility
          modelName: (jsonData?.model as string) || variantData.modelName || '',
          system_prompt: (jsonData?.system_prompt as string) || '',
          temperature: jsonData?.temperature as number | undefined,
          maxTokens: jsonData?.max_tokens as number | undefined,
          topP: jsonData?.top_p as number | undefined,
          frequencyPenalty: jsonData?.frequency_penalty as number | undefined,
          presencePenalty: jsonData?.presence_penalty as number | undefined,
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
      const jsonData: Record<string, unknown> = {
        system_prompt: data.system_prompt,
        // Store model in jsonData for future use (modelName column will be deprecated)
        model: data.modelName,
      };

      // Only include model parameters if they have been set
      if (data.temperature !== undefined) {
        jsonData.temperature = data.temperature;
      }
      if (data.maxTokens !== undefined) {
        jsonData.max_tokens = data.maxTokens;
      }
      if (data.topP !== undefined) {
        jsonData.top_p = data.topP;
      }
      if (data.frequencyPenalty !== undefined) {
        jsonData.frequency_penalty = data.frequencyPenalty;
      }
      if (data.presencePenalty !== undefined) {
        jsonData.presence_penalty = data.presencePenalty;
      }

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
