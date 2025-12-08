import { spacing } from '@llmops/ui';
import { style } from '@vanilla-extract/css';

export const twinSplitContainer = style({
  width: '100%',
  height: '100%',
  display: 'flex',
  gap: spacing.xs,
  vars: {
    '--tile-width': '40%',
  },
});

export const leftTile = style({
  flex: `0 0 var(--tile-width)`,
});

export const rightTile = style({
  flex: `1 1 calc(100% - var(--tile-width))`,
});
