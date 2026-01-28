import { useState, useCallback, useRef } from 'react';
import type { PlaygroundColumn } from '@llmops/core';
import { Trash2, Plus, ChevronDown, Monitor, User, Bot, Check } from 'lucide-react';
import { Menu as BaseMenu } from '@base-ui/react';
import { useModelsGroupedByProvider } from '@client/hooks/queries/useModelsGroupedByProvider';
import * as styles from './playground-column.css';

type MessageRole = 'system' | 'user' | 'assistant';

type Message = {
  role: MessageRole;
  content: string;
};

type PlaygroundColumnProps = {
  column: PlaygroundColumn;
  onChange: (updates: Partial<PlaygroundColumn>) => void;
  onDelete: () => void;
  canDelete: boolean;
};

const roleConfig: Record<
  MessageRole,
  { label: string; icon: typeof Monitor; className: string }
> = {
  system: { label: 'System', icon: Monitor, className: styles.roleSystem },
  user: { label: 'User', icon: User, className: styles.roleUser },
  assistant: { label: 'Assistant', icon: Bot, className: styles.roleAssistant },
};

type MessageBlockProps = {
  message: Message;
  onChange: (message: Message) => void;
  onDelete: () => void;
  canDelete: boolean;
};

function MessageBlock({
  message,
  onChange,
  onDelete,
  canDelete,
}: MessageBlockProps) {
  const config = roleConfig[message.role];
  const RoleIcon = config.icon;

  return (
    <div className={styles.messageBlock}>
      <div className={styles.messageHeader}>
        <BaseMenu.Root>
          <BaseMenu.Trigger className={styles.roleSelector}>
            <RoleIcon size={14} className={config.className} />
            <span className={config.className}>{config.label}</span>
            <ChevronDown size={12} />
          </BaseMenu.Trigger>
          <BaseMenu.Portal>
            <BaseMenu.Positioner sideOffset={4} align="start">
              <BaseMenu.Popup className={styles.roleMenuPopup}>
                {(Object.keys(roleConfig) as MessageRole[]).map((role) => {
                  const roleInfo = roleConfig[role];
                  const Icon = roleInfo.icon;
                  const isSelected = message.role === role;
                  return (
                    <BaseMenu.Item
                      key={role}
                      className={styles.roleMenuItem}
                      data-selected={isSelected || undefined}
                      onClick={() => onChange({ ...message, role })}
                    >
                      <span className={styles.roleMenuItemIcon}>
                        {isSelected && <Check size={14} />}
                      </span>
                      <Icon size={14} className={roleInfo.className} />
                      <span>{roleInfo.label}</span>
                    </BaseMenu.Item>
                  );
                })}
              </BaseMenu.Popup>
            </BaseMenu.Positioner>
          </BaseMenu.Portal>
        </BaseMenu.Root>
        {canDelete && (
          <button
            type="button"
            className={styles.deleteMessageButton}
            onClick={onDelete}
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
      <textarea
        className={styles.messageTextarea}
        value={message.content}
        onChange={(e) => onChange({ ...message, content: e.target.value })}
        placeholder={`Enter ${config.label.toLowerCase()} message... Use {{variable}} for template variables`}
        rows={4}
      />
    </div>
  );
}

export function PlaygroundColumnComponent({
  column,
  onChange,
  onDelete,
  canDelete,
}: PlaygroundColumnProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const { data: providerGroups } = useModelsGroupedByProvider();

  // Find selected model info
  const selectedModel = providerGroups
    ?.flatMap((g) =>
      g.models.map((m) => ({
        ...m,
        providerId: g.id,
        providerLabel: g.label,
        providerLogo: g.logo,
        slug: g.slug,
      }))
    )
    .find(
      (m) =>
        m.providerId === column.providerConfigId && m.value === column.modelName
    );

  const handleNameSubmit = useCallback(() => {
    setIsEditingName(false);
  }, []);

  const handleAddMessage = useCallback(() => {
    const newMessages = [
      ...column.messages,
      { role: 'user' as const, content: '' },
    ];
    onChange({ messages: newMessages });
  }, [column.messages, onChange]);

  const handleMessageChange = useCallback(
    (index: number, message: Message) => {
      const newMessages = [...column.messages];
      newMessages[index] = message;
      onChange({ messages: newMessages });
    },
    [column.messages, onChange]
  );

  const handleDeleteMessage = useCallback(
    (index: number) => {
      if (column.messages.length <= 1) return;
      const newMessages = column.messages.filter((_, i) => i !== index);
      onChange({ messages: newMessages });
    },
    [column.messages, onChange]
  );

  const handleModelSelect = useCallback(
    (providerId: string, modelName: string) => {
      onChange({ providerConfigId: providerId, modelName });
    },
    [onChange]
  );

  return (
    <div className={styles.columnContainer}>
      <div className={styles.columnHeader}>
        <div className={styles.columnHeaderLeft}>
          {isEditingName ? (
            <input
              ref={nameInputRef}
              type="text"
              className={styles.nameInput}
              value={column.name}
              onChange={(e) => onChange({ name: e.target.value })}
              onBlur={handleNameSubmit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleNameSubmit();
                if (e.key === 'Escape') setIsEditingName(false);
              }}
              autoFocus
            />
          ) : (
            <button
              type="button"
              className={styles.nameButton}
              onClick={() => setIsEditingName(true)}
            >
              {column.name}
            </button>
          )}
        </div>
        {canDelete && (
          <button
            type="button"
            className={styles.deleteColumnButton}
            onClick={onDelete}
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>

      <div className={styles.modelSelectorWrapper}>
        <BaseMenu.Root>
          <BaseMenu.Trigger className={styles.modelTrigger}>
            {selectedModel ? (
              <>
                {selectedModel.providerLogo && (
                  <img
                    src={selectedModel.providerLogo}
                    className={styles.providerLogo}
                    alt=""
                  />
                )}
                <span>{selectedModel.label}</span>
              </>
            ) : (
              <span className={styles.placeholderText}>Select model...</span>
            )}
            <ChevronDown size={14} />
          </BaseMenu.Trigger>
          <BaseMenu.Portal>
            <BaseMenu.Positioner sideOffset={4} align="start">
              <BaseMenu.Popup className={styles.modelMenuPopup}>
                {providerGroups?.map((group) => (
                  <div key={group.id} className={styles.modelGroup}>
                    <div className={styles.modelGroupLabel}>
                      {group.logo && (
                        <img
                          src={group.logo}
                          className={styles.providerLogo}
                          alt=""
                        />
                      )}
                      {group.slug ?? group.label}
                    </div>
                    {group.models.map((model) => {
                      const isSelected =
                        column.providerConfigId === group.id &&
                        column.modelName === model.value;
                      return (
                        <BaseMenu.Item
                          key={`${group.id}_${model.value}`}
                          className={styles.modelMenuItem}
                          data-selected={isSelected || undefined}
                          onClick={() => handleModelSelect(group.id, model.value)}
                        >
                          <span className={styles.modelMenuItemIcon}>
                            {isSelected && <Check size={14} />}
                          </span>
                          {model.label}
                        </BaseMenu.Item>
                      );
                    })}
                  </div>
                ))}
              </BaseMenu.Popup>
            </BaseMenu.Positioner>
          </BaseMenu.Portal>
        </BaseMenu.Root>
      </div>

      <div className={styles.messagesContainer}>
        {column.messages.map((message, index) => (
          <MessageBlock
            key={index}
            message={message as Message}
            onChange={(m) => handleMessageChange(index, m)}
            onDelete={() => handleDeleteMessage(index)}
            canDelete={column.messages.length > 1}
          />
        ))}
        <button
          type="button"
          className={styles.addMessageButton}
          onClick={handleAddMessage}
        >
          <Plus size={14} />
          Add message
        </button>
      </div>
    </div>
  );
}

export default PlaygroundColumnComponent;
