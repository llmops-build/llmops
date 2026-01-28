import { useFieldArray, useWatch, type UseFormReturn } from 'react-hook-form';
import { Plus } from 'lucide-react';
import {
  variantFormContainer,
  variantPropertyLabel,
  variantPropertyColumn,
  messagesContainer,
  addMessageButton,
  actionsRow,
  variantNameInput,
} from './variants.css';
import ModelSelector, { type ModelSettings } from './model-selector';
import MessageBlock, { type Message, type MessageRole } from './message-block';

export type VariantFormData = {
  variant_name: string;
  provider: string;
  modelName: string;
  messages: Message[];
  // Model parameters
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
};

type VariantFormProps = {
  form: UseFormReturn<VariantFormData>;
  editorKey?: string;
};

let messageIdCounter = 0;
const generateMessageId = () => `msg_${Date.now()}_${++messageIdCounter}`;

const VariantForm = ({ form, editorKey }: VariantFormProps) => {
  const { setValue, control } = form;

  // Watch variant_name to ensure re-render when form.reset() is called
  const variantName = useWatch({ control, name: 'variant_name' });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'messages',
    keyName: '_fieldId', // Use different name to avoid conflict with Message.id
  });

  const handleModelSettingsChange = (settings: ModelSettings) => {
    setValue('provider', settings.provider, {
      shouldValidate: true,
      shouldDirty: true,
    });
    setValue('modelName', settings.modelName, {
      shouldValidate: true,
      shouldDirty: true,
    });
    setValue('temperature', settings.temperature, {
      shouldValidate: true,
      shouldDirty: true,
    });
    setValue('maxTokens', settings.maxTokens, {
      shouldValidate: true,
      shouldDirty: true,
    });
    setValue('topP', settings.topP, {
      shouldValidate: true,
      shouldDirty: true,
    });
    setValue('frequencyPenalty', settings.frequencyPenalty, {
      shouldValidate: true,
      shouldDirty: true,
    });
    setValue('presencePenalty', settings.presencePenalty, {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  const handleMessageChange = (index: number, message: Message) => {
    // Use setValue instead of update() to avoid replacing the entire field
    // which would cause the field ID to change and remount the editor
    setValue(`messages.${index}.role`, message.role, { shouldDirty: true });
    setValue(`messages.${index}.content`, message.content, { shouldDirty: true });
  };

  const handleAddMessage = (role: MessageRole = 'user') => {
    append({
      id: generateMessageId(),
      role,
      content: '',
    });
  };

  const handleDeleteMessage = (index: number) => {
    remove(index);
  };

  return (
    <div className={variantFormContainer}>
      <div className={variantPropertyColumn}>
        <div className={variantPropertyLabel}>
          <span>Name</span>
        </div>
        <input
          title="Variant Name"
          data-1p-ignore
          autoComplete="off"
          placeholder="Variant Name"
          className={variantNameInput}
          value={variantName ?? ''}
          onChange={(e) =>
            setValue('variant_name', e.target.value, { shouldDirty: true })
          }
        />
      </div>

      <div className={variantPropertyColumn}>
        <div className={variantPropertyLabel}>
          <span>Model</span>
        </div>
        <ModelSelector
          control={control}
          onChange={handleModelSettingsChange}
        />
      </div>

      <div className={messagesContainer}>
        {fields.map((field, index) => (
          <MessageBlock
            key={field._fieldId}
            message={field}
            onChange={(msg) => handleMessageChange(index, msg)}
            onDelete={() => handleDeleteMessage(index)}
            canDelete={fields.length > 1}
            editorKey={`${editorKey}-${field._fieldId}`}
            control={control}
            index={index}
          />
        ))}
      </div>

      <div className={actionsRow}>
        <button
          type="button"
          className={addMessageButton}
          onClick={() => handleAddMessage('user')}
        >
          <Plus size={14} />
          Message
        </button>
      </div>
    </div>
  );
};

export default VariantForm;
