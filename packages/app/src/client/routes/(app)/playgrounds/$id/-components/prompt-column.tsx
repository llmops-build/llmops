import { useMemo, useRef, type ChangeEvent } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { Plus, Copy, Trash2, GripVertical, RefreshCw } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Link } from '@tanstack/react-router';
import type { PlaygroundColumn } from '@llmops/core';
import ModelSelector, {
  type ModelSettings,
} from '@client/routes/(app)/prompts/$id/_variants/-components/model-selector';
import MessageBlock, {
  type Message,
} from '@client/routes/(app)/prompts/$id/_variants/-components/message-block';
import { SaveVariantPopup } from '@client/components/save-variant-popup';
import { useConfigById } from '@client/hooks/queries/useConfigById';
import { useVariantVersions } from '@client/hooks/queries/useVariantVersions';
import { useCreateVariantVersion } from '@client/hooks/mutations/useCreateVariantVersion';
import { showToast } from '@client/components/toast';
import * as styles from './prompt-column.css';

type PromptColumnFormData = {
  name: string;
  provider: string;
  modelName: string;
  messages: Message[];
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
};

type PromptColumnProps = {
  column: PlaygroundColumn;
  onChange: (updatedColumn: PlaygroundColumn) => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  canDelete?: boolean;
};

let messageIdCounter = 0;
const generateMessageId = () => `msg_${Date.now()}_${++messageIdCounter}`;

export function PromptColumn({
  column,
  onChange,
  onDelete,
  onDuplicate,
  canDelete = true,
}: PromptColumnProps) {
  const columnRef = useRef(column);
  columnRef.current = column;

  // Source tracking - fetch config and variant data if linked
  const { data: config } = useConfigById(column.configId ?? '');
  const { data: versions } = useVariantVersions(column.variantId ?? '');
  const createVariantVersion = useCreateVariantVersion();

  // Find the original version this column was created from
  const originalVersion = useMemo(() => {
    if (!versions || !column.variantVersionId) return null;
    return versions.find((v) => v.id === column.variantVersionId) ?? null;
  }, [versions, column.variantVersionId]);

  // Find the latest version for comparison
  const latestVersion = useMemo(() => {
    if (!versions || versions.length === 0) return null;
    return versions.reduce((latest, current) =>
      current.version > latest.version ? current : latest
    );
  }, [versions]);

  // Check if the column has been modified from the original version
  const hasChanges = useMemo(() => {
    if (!originalVersion) return false;

    const originalData =
      typeof originalVersion.jsonData === 'string'
        ? (JSON.parse(originalVersion.jsonData) as Record<string, unknown>)
        : (originalVersion.jsonData as Record<string, unknown> | null);

    // Helper to compare values treating null/undefined as equivalent
    const isEqual = (a: unknown, b: unknown): boolean => {
      // Treat null and undefined as equivalent
      if ((a === null || a === undefined) && (b === null || b === undefined)) {
        return true;
      }
      return a === b;
    };

    // Compare messages
    const originalMessages = originalData?.messages as
      | Array<{ role: string; content: string }>
      | undefined;
    if (originalMessages) {
      if (originalMessages.length !== column.messages.length) return true;
      for (let i = 0; i < originalMessages.length; i++) {
        if (
          originalMessages[i].role !== column.messages[i].role ||
          originalMessages[i].content !== column.messages[i].content
        ) {
          return true;
        }
      }
    }

    // Compare model settings
    const originalModel = (originalData?.model as string) || originalVersion.modelName;
    if (originalModel !== column.modelName) return true;

    if (originalVersion.provider !== column.providerConfigId) return true;

    // Compare parameters (treat null/undefined as equivalent)
    if (!isEqual(originalData?.temperature, column.temperature)) return true;
    if (!isEqual(originalData?.max_tokens, column.maxTokens)) return true;
    if (!isEqual(originalData?.top_p, column.topP)) return true;
    if (!isEqual(originalData?.frequency_penalty, column.frequencyPenalty)) return true;
    if (!isEqual(originalData?.presence_penalty, column.presencePenalty)) return true;

    return false;
  }, [column, originalVersion]);

  // Handle saving changes back to the variant
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleSaveToVariant = async (_options: { mode: string }) => {
    if (!column.variantId) return;

    const jsonData: Record<string, unknown> = {
      messages: column.messages.map(({ role, content }) => ({ role, content })),
      model: column.modelName,
    };

    if (column.temperature !== null && column.temperature !== undefined) {
      jsonData.temperature = column.temperature;
    }
    if (column.maxTokens !== null && column.maxTokens !== undefined) {
      jsonData.max_tokens = column.maxTokens;
    }
    if (column.topP !== null && column.topP !== undefined) {
      jsonData.top_p = column.topP;
    }
    if (column.frequencyPenalty !== null && column.frequencyPenalty !== undefined) {
      jsonData.frequency_penalty = column.frequencyPenalty;
    }
    if (column.presencePenalty !== null && column.presencePenalty !== undefined) {
      jsonData.presence_penalty = column.presencePenalty;
    }

    try {
      const newVersion = await createVariantVersion.mutateAsync({
        variantId: column.variantId,
        provider: column.providerConfigId ?? '',
        modelName: column.modelName,
        jsonData,
      });

      if (newVersion) {
        // Update the column to reference the new version
        onChange({
          ...column,
          variantVersionId: newVersion.id,
        });
        showToast.success('Changes saved', `Created version ${newVersion.version}`);
      }
    } catch (error) {
      showToast.error(
        'Failed to save',
        error instanceof Error ? error.message : 'An error occurred'
      );
    }
  };

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: column.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const form = useForm<PromptColumnFormData>({
    defaultValues: {
      name: column.name,
      provider: column.providerConfigId ?? '',
      modelName: column.modelName,
      messages: column.messages.map((m) => ({
        id: generateMessageId(),
        role: m.role,
        content: m.content,
      })),
      temperature: column.temperature ?? undefined,
      maxTokens: column.maxTokens ?? undefined,
      topP: column.topP ?? undefined,
      frequencyPenalty: column.frequencyPenalty ?? undefined,
      presencePenalty: column.presencePenalty ?? undefined,
    },
  });

  const { control, setValue, watch } = form;

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'messages',
    keyName: '_fieldId',
  });

  const emitChange = (updates: Partial<PlaygroundColumn>) => {
    onChange({
      ...columnRef.current,
      ...updates,
    });
  };

  const handleNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setValue('name', name);
    emitChange({ name });
  };

  const handleModelSettingsChange = (settings: ModelSettings) => {
    setValue('provider', settings.provider);
    setValue('modelName', settings.modelName);
    setValue('temperature', settings.temperature);
    setValue('maxTokens', settings.maxTokens);
    setValue('topP', settings.topP);
    setValue('frequencyPenalty', settings.frequencyPenalty);
    setValue('presencePenalty', settings.presencePenalty);

    emitChange({
      providerConfigId: settings.provider || null,
      modelName: settings.modelName,
      temperature: settings.temperature ?? null,
      maxTokens: settings.maxTokens ?? null,
      topP: settings.topP ?? null,
      frequencyPenalty: settings.frequencyPenalty ?? null,
      presencePenalty: settings.presencePenalty ?? null,
    });
  };

  const handleMessageChange = (index: number, message: Message) => {
    setValue(`messages.${index}.role`, message.role);
    setValue(`messages.${index}.content`, message.content);

    const currentMessages = watch('messages');
    emitChange({
      messages: currentMessages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    });
  };

  const handleAddMessage = () => {
    append({
      id: generateMessageId(),
      role: 'user',
      content: '',
    });

    const currentMessages = watch('messages');
    emitChange({
      messages: [
        ...currentMessages.map((m) => ({ role: m.role, content: m.content })),
        { role: 'user' as const, content: '' },
      ],
    });
  };

  const handleDeleteMessage = (index: number) => {
    remove(index);

    const currentMessages = watch('messages');
    const newMessages = currentMessages.filter((_, i) => i !== index);
    emitChange({
      messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
    });
  };

  const name = watch('name');

  return (
    <div ref={setNodeRef} style={style} className={styles.columnCard}>
      <div className={styles.columnHeader}>
        <div className={styles.columnHeaderLeft}>
          <div className={styles.columnIndicator} />
          <input
            type="text"
            className={styles.columnNameInput}
            value={name}
            onChange={handleNameChange}
            placeholder="Untitled prompt"
          />
        </div>
        <div className={styles.columnHeaderRight}>
          {onDuplicate && (
            <button
              type="button"
              className={styles.columnHeaderAction}
              onClick={onDuplicate}
              title="Duplicate"
            >
              <Copy size={14} />
            </button>
          )}
          {canDelete && onDelete && (
            <button
              type="button"
              className={styles.columnHeaderAction}
              onClick={onDelete}
              title="Delete"
            >
              <Trash2 size={14} />
            </button>
          )}
          <div
            className={styles.dragHandle}
            title="Drag to reorder"
            {...attributes}
            {...listeners}
          >
            <GripVertical size={14} />
          </div>
        </div>
      </div>

      <div className={styles.modelSelectorRow}>
        <ModelSelector control={control} onChange={handleModelSettingsChange} />
      </div>

      <div className={styles.columnBody}>
        <div className={styles.messagesContainer}>
          {fields.map((field, index) => (
            <MessageBlock
              key={field._fieldId}
              message={field}
              onChange={(msg) => handleMessageChange(index, msg)}
              onDelete={() => handleDeleteMessage(index)}
              canDelete={fields.length > 1}
              editorKey={`${column.id}-${field._fieldId}`}
              control={control}
              index={index}
            />
          ))}
        </div>

        <div className={styles.actionsRow}>
          <button
            type="button"
            className={styles.actionButton}
            onClick={handleAddMessage}
          >
            <Plus size={14} />
            Message
          </button>
        </div>
      </div>

      <div className={styles.columnFooter}>
        <div className={styles.footerLeft}>
          {column.configId && column.variantId ? (
            <Link
              to="/prompts/$id/variants/$variant"
              params={{ id: column.configId, variant: column.variantId }}
              className={styles.sourceLink}
            >
              <RefreshCw size={12} className={styles.sourceLinkIcon} />
              <span className={styles.sourceLinkText}>
                {config?.name ?? 'Prompt'}
              </span>
              {originalVersion && (
                <span className={styles.versionBadge}>
                  v{originalVersion.version}
                  {latestVersion &&
                    originalVersion.id === latestVersion.id &&
                    ' (latest)'}
                </span>
              )}
            </Link>
          ) : (
            <span className={styles.noSourceText}>No linked prompt</span>
          )}
        </div>
        <div className={styles.footerRight}>
          {column.variantId && hasChanges && (
            <SaveVariantPopup
              isNewVariant={false}
              onSave={handleSaveToVariant}
              isSaving={createVariantVersion.isPending}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default PromptColumn;
