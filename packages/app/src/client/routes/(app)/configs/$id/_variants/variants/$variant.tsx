import { Button } from '@llmops/ui';
import {
  createFileRoute,
  useBlocker,
  useNavigate,
} from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { variantContainer, variantHeader } from '../-components/variants.css';
import VariantForm, { type VariantFormData } from '../-components/variant-form';
import { useCreateVariant } from '@client/hooks/mutations/useCreateVariant';
import { useCreateVariantVersion } from '@client/hooks/mutations/useCreateVariantVersion';
import { useSetTargeting } from '@client/hooks/mutations/useSetTargeting';
import {
  useVariantById,
  variantByIdQueryOptions,
} from '@client/hooks/queries/useVariantById';
import { useConfigVariants } from '@client/hooks/queries/useConfigVariants';
import { useEffect, useState } from 'react';
import {
  SaveVariantPopup,
  type SaveVariantOptions,
} from '../-components/save-variant-popup';

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
  const createVariantVersion = useCreateVariantVersion();
  const setTargeting = useSetTargeting();
  const { data: variantData } = useVariantById(
    variant === 'new' ? '' : variant
  );
  const { data: configVariants } = useConfigVariants(configId);
  const [editorKey, setEditorKey] = useState<string>('new');

  const isNewVariant = variant === 'new';

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
  const isSaving =
    createVariant.isPending ||
    createVariantVersion.isPending ||
    setTargeting.isPending;

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

  const buildJsonData = (data: VariantFormData): Record<string, unknown> => {
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

    return jsonData;
  };

  /**
   * Generate a unique variant name by adding a suffix like (2), (3), etc.
   */
  const generateUniqueVariantName = (baseName: string): string => {
    if (!configVariants || configVariants.length === 0) {
      return baseName;
    }

    const existingNames = new Set(configVariants.map((cv) => cv.name));

    // If the base name doesn't exist, use it as-is
    if (!existingNames.has(baseName)) {
      return baseName;
    }

    // Find the next available suffix
    let suffix = 2;
    let newName = `${baseName} (${suffix})`;
    while (existingNames.has(newName)) {
      suffix++;
      newName = `${baseName} (${suffix})`;
    }

    return newName;
  };

  const handleSave = async (options: SaveVariantOptions) => {
    const data = form.getValues();

    if (!data.variant_name.trim() || !data.provider || !data.modelName) {
      return;
    }

    try {
      const jsonData = buildJsonData(data);

      if (options.mode === 'new_variant' || isNewVariant) {
        // Generate unique name when saving as new variant from existing
        const variantName =
          options.mode === 'new_variant' && !isNewVariant
            ? generateUniqueVariantName(data.variant_name)
            : data.variant_name;

        // Create new variant with version 1
        const result = await createVariant.mutateAsync({
          configId,
          name: variantName,
          provider: data.provider,
          modelName: data.modelName,
          jsonData,
        });

        // Deploy to environment if requested
        if (options.deployToEnvironment && options.environmentId && result) {
          await setTargeting.mutateAsync({
            environmentId: options.environmentId,
            configId,
            configVariantId: result.configVariant.id,
            variantVersionId: result.version.id,
          });
        }
      } else {
        // Create new version for existing variant
        const versionResult = await createVariantVersion.mutateAsync({
          variantId: variant,
          provider: data.provider,
          modelName: data.modelName,
          jsonData,
        });

        // Deploy to environment if requested
        if (options.deployToEnvironment && options.environmentId) {
          // Find the config variant for this variant
          const configVariant = configVariants?.find(
            (cv) => cv.variantId === variant
          );

          if (configVariant && versionResult) {
            await setTargeting.mutateAsync({
              environmentId: options.environmentId,
              configId,
              configVariantId: configVariant.id,
              variantVersionId: versionResult.id,
            });
          }
        }
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
    <div>
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
        <SaveVariantPopup
          isNewVariant={isNewVariant}
          onSave={handleSave}
          isSaving={isSaving}
        />
      </div>
      <div className={variantContainer}>
        <VariantForm form={form} editorKey={editorKey} />
      </div>
    </div>
  );
}
