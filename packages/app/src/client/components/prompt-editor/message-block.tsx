import { useState, useRef } from 'react';
import { useWatch, type Control } from 'react-hook-form';
import { Collapsible as BaseCollapsible } from '@base-ui/react/collapsible';
import { Menu as BaseMenu } from '@base-ui/react';
import { ChevronDown, Trash2, Check, Monitor, User, Bot } from 'lucide-react';
import clsx from 'clsx';
import MarkdownEditor from './editor';
import * as styles from './message-block.css';

export type MessageRole = 'system' | 'user' | 'assistant';

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
}

interface MessageBlockProps {
  message: Message;
  onChange: (message: Message) => void;
  onDelete: () => void;
  canDelete?: boolean;
  editorKey?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control?: Control<any>;
  index?: number;
}

const roleConfig: Record<
  MessageRole,
  { label: string; icon: typeof Monitor; className: string }
> = {
  system: { label: 'System', icon: Monitor, className: styles.roleSystem },
  user: { label: 'User', icon: User, className: styles.roleUser },
  assistant: { label: 'Assistant', icon: Bot, className: styles.roleAssistant },
};

export function MessageBlock({
  message: initialMessage,
  onChange,
  onDelete,
  canDelete = true,
  editorKey,
  control,
  index,
}: MessageBlockProps) {
  const [isOpen, setIsOpen] = useState(true);

  // Watch this specific field for reactive updates (handles form.reset() correctly)
  const watchedMessage =
    control && index !== undefined
      ? (useWatch({ control, name: `messages.${index}` }) as
          | Message
          | undefined)
      : undefined;

  // Use watched value if available, otherwise fall back to prop
  const message = watchedMessage ?? initialMessage;

  const config = roleConfig[message.role];
  const RoleIcon = config.icon;

  // Use refs to get latest values without causing infinite re-renders
  // (the functions only reference refs, so React Compiler can memoize them properly)
  const messageRef = useRef(message);
  const onChangeRef = useRef(onChange);
  messageRef.current = message;
  onChangeRef.current = onChange;

  const handleRoleChange = (newRole: MessageRole) => {
    if (newRole !== messageRef.current.role) {
      onChangeRef.current({ ...messageRef.current, role: newRole });
    }
  };

  const handleContentChange = (content: string) => {
    // Only trigger update if content actually changed
    // Lexical's OnChangePlugin fires on selection/focus changes too
    if (content !== messageRef.current.content) {
      onChangeRef.current({ ...messageRef.current, content });
    }
  };

  return (
    <BaseCollapsible.Root
      open={isOpen}
      onOpenChange={setIsOpen}
      className={styles.messageBlockContainer}
      data-open={isOpen || undefined}
    >
      <div className={styles.messageBlockHeader}>
        <div className={styles.messageBlockHeaderLeft}>
          <BaseMenu.Root>
            <BaseMenu.Trigger className={styles.roleSelector}>
              <RoleIcon size={14} className={config.className} />
              <span className={config.className}>{config.label}</span>
              <ChevronDown size={12} className={styles.roleSelectorIcon} />
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
                        onClick={() => handleRoleChange(role)}
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
        </div>
        <div className={styles.messageBlockHeaderRight}>
          {canDelete && (
            <button
              type="button"
              className={styles.deleteButton}
              onClick={onDelete}
              title="Delete message"
            >
              <Trash2 size={14} />
            </button>
          )}
          <BaseCollapsible.Trigger
            className={styles.expandButton}
            data-open={isOpen}
          >
            <ChevronDown size={16} />
          </BaseCollapsible.Trigger>
        </div>
      </div>
      <BaseCollapsible.Panel className={styles.messageBlockPanel}>
        <div className={clsx(styles.messageBlockContent, styles.editorWrapper)}>
          <MarkdownEditor
            key={editorKey}
            value={message.content}
            onChange={handleContentChange}
            placeholder={`Enter ${config.label.toLowerCase()} message...`}
          />
        </div>
      </BaseCollapsible.Panel>
    </BaseCollapsible.Root>
  );
}

export default MessageBlock;
