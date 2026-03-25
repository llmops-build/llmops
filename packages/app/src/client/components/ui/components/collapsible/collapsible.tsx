import * as React from 'react';
import { Collapsible as BaseCollapsible } from '@base-ui/react/collapsible';
import clsx from 'clsx';
import { ChevronDown } from 'lucide-react';
import * as styles from './collapsible.css';

export interface CollapsibleProps {
  children: React.ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
}

export interface CollapsibleTriggerProps {
  children: React.ReactNode;
  className?: string;
  showIcon?: boolean;
}

export interface CollapsibleContentProps {
  children: React.ReactNode;
  className?: string;
}

export function Collapsible({
  children,
  open,
  defaultOpen = true,
  onOpenChange,
  className,
}: CollapsibleProps) {
  return (
    <BaseCollapsible.Root
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange}
      className={clsx(styles.collapsibleRoot, className)}
    >
      {children}
    </BaseCollapsible.Root>
  );
}

export function CollapsibleTrigger({
  children,
  className,
  showIcon = true,
}: CollapsibleTriggerProps) {
  return (
    <BaseCollapsible.Trigger
      className={clsx(styles.collapsibleTrigger, className)}
    >
      {children}
      {showIcon && (
        <span className={styles.collapsibleTriggerIcon}>
          <ChevronDown size={16} />
        </span>
      )}
    </BaseCollapsible.Trigger>
  );
}

export function CollapsibleContent({
  children,
  className,
}: CollapsibleContentProps) {
  return (
    <BaseCollapsible.Panel className={styles.collapsiblePanel}>
      <div className={clsx(styles.collapsibleContent, className)}>
        {children}
      </div>
    </BaseCollapsible.Panel>
  );
}

export { BaseCollapsible };
