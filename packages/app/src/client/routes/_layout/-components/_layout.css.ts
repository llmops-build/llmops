import { easings, spacing } from '@llmops/ui';
import { style } from '@vanilla-extract/css';

export const headerStyle = style({
  paddingTop: spacing.sm,
  paddingBottom: spacing.sm,
  transitionProperty: 'width',
  transitionTimingFunction: easings.easeInOutCubic,
  transitionDuration: '300ms',
  display: 'flex',
  alignItems: 'center',
});

export const iconContainer = style({
  display: 'flex',
  alignItems: 'flex-end',
  height: '100%',
});
