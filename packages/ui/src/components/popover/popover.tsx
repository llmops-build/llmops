import * as React from 'react';
import { Popover as BasePopover } from '@base-ui/react/popover';
import clsx from 'clsx';
import * as styles from './popover.css';

export interface PopoverProps {
  children: React.ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  modal?: boolean | 'trap-focus';
  /**
   * When true, prevents the popover from closing when interacting with
   * portalled elements like combobox dropdowns inside the popover.
   * @default true
   */
  preventCloseOnNestedPortals?: boolean;
}

export interface PopoverTriggerProps {
  children: React.ReactNode;
  className?: string;
  asChild?: boolean;
}

export interface PopoverContentProps {
  children: React.ReactNode;
  className?: string;
  sideOffset?: number;
  align?: 'start' | 'center' | 'end';
  side?: 'top' | 'right' | 'bottom' | 'left';
}

export interface PopoverTitleProps {
  children: React.ReactNode;
  className?: string;
}

export interface PopoverDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

export interface PopoverCloseProps {
  children?: React.ReactNode;
  className?: string;
}

function CloseIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M18 6L6 18" />
      <path d="M6 6l12 12" />
    </svg>
  );
}

type PopoverEventDetails = {
  reason: string;
  event?: Event;
  trigger?: Element | null;
  cancel?: () => void;
};

export function Popover({
  children,
  open,
  defaultOpen,
  onOpenChange,
  modal = false,
  preventCloseOnNestedPortals = true,
}: PopoverProps) {
  const handleOpenChange = React.useCallback(
    (isOpen: boolean, eventDetails: PopoverEventDetails) => {
      // If closing due to outside press, check if the click is on a nested portal
      if (
        !isOpen &&
        preventCloseOnNestedPortals &&
        eventDetails.reason === 'outside-press' &&
        eventDetails.event
      ) {
        // Check if the click target is inside any popup element (combobox dropdown, etc.)
        // Base UI popups have data-open attribute when visible
        const target = eventDetails.event.target as HTMLElement | null;
        // Check for common popup container patterns
        if (
          target?.closest('[data-open]') ||
          target?.closest('[role="listbox"]') ||
          target?.closest('[role="option"]')
        ) {
          // Cancel the close action
          eventDetails.cancel?.();
          return;
        }
      }
      onOpenChange?.(isOpen);
    },
    [onOpenChange, preventCloseOnNestedPortals]
  );

  return (
    <BasePopover.Root
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={handleOpenChange}
      modal={modal}
    >
      {children}
    </BasePopover.Root>
  );
}

export function PopoverTrigger({
  children,
  className,
  asChild,
}: PopoverTriggerProps) {
  if (asChild && React.isValidElement(children)) {
    return (
      <BasePopover.Trigger render={children} className={className}>
        {children}
      </BasePopover.Trigger>
    );
  }

  return (
    <BasePopover.Trigger className={className}>{children}</BasePopover.Trigger>
  );
}

export function PopoverContent({
  children,
  className,
  sideOffset = 8,
  align = 'center',
  side = 'bottom',
}: PopoverContentProps) {
  return (
    <BasePopover.Portal>
      <BasePopover.Positioner
        className={styles.popoverPositioner}
        sideOffset={sideOffset}
        align={align}
        side={side}
      >
        <BasePopover.Popup className={clsx(styles.popoverPopup, className)}>
          {children}
        </BasePopover.Popup>
      </BasePopover.Positioner>
    </BasePopover.Portal>
  );
}

export function PopoverTitle({ children, className }: PopoverTitleProps) {
  return (
    <BasePopover.Title className={clsx(styles.popoverTitle, className)}>
      {children}
    </BasePopover.Title>
  );
}

export function PopoverDescription({
  children,
  className,
}: PopoverDescriptionProps) {
  return (
    <BasePopover.Description
      className={clsx(styles.popoverDescription, className)}
    >
      {children}
    </BasePopover.Description>
  );
}

export function PopoverClose({ children, className }: PopoverCloseProps) {
  return (
    <BasePopover.Close className={clsx(styles.popoverClose, className)}>
      {children || <CloseIcon />}
    </BasePopover.Close>
  );
}

// Export base components for advanced use cases
export { BasePopover };
