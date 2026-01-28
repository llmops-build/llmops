import { useRef, type ChangeEvent } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { Plus, Copy, Trash2, GripVertical } from 'lucide-react';
import type { PlaygroundColumn } from '@llmops/core';
import ModelSelector, {
  type ModelSettings,
} from '@client/routes/(app)/prompts/$id/_variants/-components/model-selector';
import MessageBlock, {
  type Message,
} from '@client/routes/(app)/prompts/$id/_variants/-components/message-block';
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
    <div className={styles.columnCard}>
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
          <div className={styles.dragHandle} title="Drag to reorder">
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

      <div className={styles.columnFooter}></div>
    </div>
  );
}

export default PromptColumn;
