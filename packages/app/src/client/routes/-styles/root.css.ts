import { easings } from '@llmops/ui';
import { style } from '@vanilla-extract/css';

export const contentLayout = style({
  width: 'calc(100% - var(--sidebar-width))',
  // transitionProperty: 'width',
  // transitionTimingFunction: easings.easeInOutCubic,
  // transitionDuration: '300ms',
});
