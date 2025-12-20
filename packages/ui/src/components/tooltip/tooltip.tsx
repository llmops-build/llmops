import * as React from 'react';
import { Tooltip as BaseTooltip } from '@base-ui/react/tooltip';
import clsx from 'clsx';
import * as styles from './tooltip.css';

export interface TooltipProps {
  /** The content to display in the tooltip */
  content: React.ReactNode;
  /** The element that triggers the tooltip */
  children: React.ReactElement;
  /** Which side of the anchor element to align the tooltip against */
  side?: 'top' | 'right' | 'bottom' | 'left';
  /** How to align the tooltip relative to the specified side */
  align?: 'start' | 'center' | 'end';
  /** Distance between the anchor and the tooltip in pixels */
  sideOffset?: number;
  /** How long to wait before opening the tooltip (ms) */
  delay?: number;
  /** How long to wait before closing the tooltip (ms) */
  closeDelay?: number;
  /** Additional class name for the tooltip popup */
  className?: string;
}

function ArrowSvg(props: React.ComponentProps<'svg'>) {
  return (
    <svg width="20" height="10" viewBox="0 0 20 10" fill="none" {...props}>
      <path
        d="M9.66437 2.60207L4.80758 6.97318C4.07308 7.63423 3.11989 8 2.13172 8H0V10H20V8H18.5349C17.5468 8 16.5936 7.63423 15.8591 6.97318L11.0023 2.60207C10.622 2.2598 10.0447 2.25979 9.66437 2.60207Z"
        className={styles.tooltipArrowFill}
      />
    </svg>
  );
}

export function Tooltip({
  content,
  children,
  side = 'top',
  align = 'center',
  sideOffset = 8,
  delay = 400,
  closeDelay = 0,
  className,
}: TooltipProps) {
  return (
    <BaseTooltip.Provider delay={delay} closeDelay={closeDelay}>
      <BaseTooltip.Root>
        <BaseTooltip.Trigger render={children} />
        <BaseTooltip.Portal>
          <BaseTooltip.Positioner
            className={styles.tooltipPositioner}
            side={side}
            align={align}
            sideOffset={sideOffset}
          >
            <BaseTooltip.Popup className={clsx(styles.tooltipPopup, className)}>
              <BaseTooltip.Arrow className={styles.tooltipArrow}>
                <ArrowSvg />
              </BaseTooltip.Arrow>
              {content}
            </BaseTooltip.Popup>
          </BaseTooltip.Positioner>
        </BaseTooltip.Portal>
      </BaseTooltip.Root>
    </BaseTooltip.Provider>
  );
}

// Export base components for advanced use cases
export { BaseTooltip };
