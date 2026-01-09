import { Combobox } from '@ui';
import {
  createFileRoute,
  useBlocker,
  useNavigate,
} from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import {
  variantContainer,
  variantHeader,
  variantHeaderActions,
} from '../-components/variants.css';
import { configTitleInput } from '../../../-components/configs.css';
import VariantForm, { type VariantFormData } from '../-components/variant-form';
import { useCreateVariant } from '@client/hooks/mutations/useCreateVariant';
import { useCreateVariantVersion } from '@client/hooks/mutations/useCreateVariantVersion';
import { useSetTargeting } from '@client/hooks/mutations/useSetTargeting';
import {
  useVariantById,
  variantByIdQueryOptions,
} from '@client/hooks/queries/useVariantById';
import { useConfigVariants } from '@client/hooks/queries/useConfigVariants';
import {
  useVariantVersions,
  type VariantVersion,
} from '@client/hooks/queries/useVariantVersions';
import { useTargetingRules } from '@client/hooks/queries/useTargetingRules';
import { useEffect, useState } from 'react';
import {
  SaveVariantPopup,
  type SaveVariantOptions,
} from '../-components/save-variant-popup';
import { useEnvironments } from '@client/hooks/queries/useEnvironments';
import { useConfigById } from '@client/hooks/queries/useConfigById';
import { DeploymentSuccessDialog } from '@client/components/deployment-success-dialog';
import type { RouterContext } from '@client/routes/__root';

export const Route = createFileRoute(
  '/(app)/configs/$id/_variants/variants/$variant'
)({
  component: RouteComponent,
  loader: async ({ params, context }) => {
    const ctx = context as RouterContext;
    if (params.variant === 'new') {
      return { title: 'New Variant' };
    }

    const variant = await ctx.queryClient.ensureQueryData(
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
  const { data: versions } = useVariantVersions(
    variant === 'new' ? '' : variant
  );
  const { data: targetingRules } = useTargetingRules(configId);
  const { data: environments } = useEnvironments();
  const { data: config } = useConfigById(configId);
  const [editorKey, setEditorKey] = useState<string>('new');
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(
    null
  );
  const [deploymentSuccess, setDeploymentSuccess] = useState<{
    open: boolean;
    environmentId: string;
    environmentName: string;
    variantName: string;
  }>({ open: false, environmentId: '', environmentName: '', variantName: '' });

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

  // Build version options sorted by version number (descending)
  const versionOptions: VariantVersion[] = versions
    ? [...versions].sort((a, b) => b.version - a.version)
    : [];

  // Set initial selected version to the targeted version if available, otherwise latest
  useEffect(() => {
    if (versions && versions.length > 0 && !selectedVersionId) {
      // Find the config variant for this variant
      const configVariant = configVariants?.find(
        (cv) => cv.variantId === variant
      );

      // Check if there's a targeting rule with a pinned version for this variant
      const targetingRule = targetingRules?.find(
        (rule) =>
          configVariant &&
          rule.configVariantId === configVariant.id &&
          rule.variantVersionId
      );

      if (targetingRule?.variantVersionId) {
        // Use the targeted (pinned) version
        setSelectedVersionId(targetingRule.variantVersionId);
      } else {
        // Fall back to latest version
        const latestVersion = versions.reduce((latest, current) =>
          current.version > latest.version ? current : latest
        );
        setSelectedVersionId(latestVersion.id);
      }
    }
  }, [versions, selectedVersionId, configVariants, targetingRules, variant]);

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
    if (variantData && selectedVersionId && versions) {
      // Find the selected version
      const selectedVersion = versions.find((v) => v.id === selectedVersionId);
      if (!selectedVersion) return;

      // Parse jsonData - it's stored as a string in VariantVersion
      const jsonData =
        typeof selectedVersion.jsonData === 'string'
          ? (JSON.parse(selectedVersion.jsonData) as Record<string, unknown>)
          : (selectedVersion.jsonData as Record<string, unknown> | null);

      form.reset(
        {
          variant_name: variantData.name || '',
          provider: selectedVersion.provider || '',
          // Prefer model from jsonData, fallback to modelName column for backwards compatibility
          modelName:
            (jsonData?.model as string) || selectedVersion.modelName || '',
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
      setEditorKey(`${variantData.id}-${selectedVersionId}`);
    }
  }, [variantData, selectedVersionId, versions]);

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
      let deployedToEnvironment = false;
      let savedVariantName = data.variant_name;

      if (options.mode === 'new_variant' || isNewVariant) {
        // Generate unique name when saving as new variant from existing
        const variantName =
          options.mode === 'new_variant' && !isNewVariant
            ? generateUniqueVariantName(data.variant_name)
            : data.variant_name;

        savedVariantName = variantName;

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
          deployedToEnvironment = true;
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
            deployedToEnvironment = true;
          }
        }
      }

      // Reset form
      form.reset();

      // If deployed to environment, show success dialog
      if (deployedToEnvironment && options.environmentId) {
        const environmentName =
          environments?.find((e) => e.id === options.environmentId)?.name ??
          'Unknown';
        setDeploymentSuccess({
          open: true,
          environmentId: options.environmentId,
          environmentName,
          variantName: savedVariantName,
        });
      } else {
        // Navigate away immediately if no deployment
        navigate({
          to: '/configs/$id/variants',
          params: { id: configId },
        });
      }
    } catch (error) {
      console.error('Error saving variant:', error);
    }
  };

  const handleDeploymentDialogClose = (open: boolean) => {
    setDeploymentSuccess((prev) => ({ ...prev, open }));
    if (!open) {
      navigate({
        to: '/configs/$id/variants',
        params: { id: configId },
      });
    }
  };

  return (
    <div>
      <div className={variantHeader}>
        {/* Variant name input on the left */}
        <input
          title="Variant Name"
          data-1p-ignore
          autoComplete="off"
          placeholder="Variant Name"
          className={configTitleInput}
          {...form.register('variant_name')}
        />
        {/* Version selector and save button on the right */}
        <div className={variantHeaderActions}>
          {!isNewVariant && versionOptions.length > 0 && (
            <Combobox<VariantVersion>
              items={versionOptions}
              value={
                versionOptions.find((v) => v.id === selectedVersionId) ?? null
              }
              onValueChange={(option) => {
                if (option && !isDirty) {
                  setSelectedVersionId(option.id);
                } else if (option && isDirty) {
                  const shouldSwitch = confirm(
                    'You have unsaved changes. Switching versions will discard them. Continue?'
                  );
                  if (shouldSwitch) {
                    setSelectedVersionId(option.id);
                  }
                }
              }}
              placeholder="Select version..."
              itemToString={(option) =>
                option ? `Version ${option.version}` : ''
              }
            />
          )}
          <SaveVariantPopup
            isNewVariant={isNewVariant}
            onSave={handleSave}
            isSaving={isSaving}
          />
        </div>
      </div>
      <div className={variantContainer}>
        <VariantForm form={form} editorKey={editorKey} />
      </div>

      <DeploymentSuccessDialog
        open={deploymentSuccess.open}
        onOpenChange={handleDeploymentDialogClose}
        environmentId={deploymentSuccess.environmentId}
        environmentName={deploymentSuccess.environmentName}
        configSlug={config?.slug}
        variantName={deploymentSuccess.variantName}
      />
    </div>
  );
}
