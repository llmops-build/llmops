import { colors, spacing, sprinkles } from '@llmops/ui';
import { style } from '@vanilla-extract/css';

export const secretsContainer = style([
  sprinkles({
    padding: 'md',
  }),
]);

export const secretsTableWrapper = style({
  overflow: 'auto',
});

export const typeCell = style({
  display: 'flex',
  alignItems: 'center',
  gap: spacing.xs,
});

export const infoIcon = style({
  color: colors.gray8,
  cursor: 'help',
  display: 'inline-flex',
  alignItems: 'center',
});

export const keyValue = style({
  fontFamily: 'monospace',
  fontSize: '0.875rem',
  color: colors.gray11,
});

export const copyButton = style({
  background: 'none',
  border: 'none',
  padding: spacing.xs,
  cursor: 'pointer',
  color: colors.gray8,
  display: 'inline-flex',
  alignItems: 'center',
  borderRadius: '0.25rem',
  transition: 'color 0.2s, background-color 0.2s',
  ':hover': {
    color: colors.gray11,
    backgroundColor: colors.gray3,
  },
});

export const keyCell = style({
  display: 'flex',
  alignItems: 'center',
  gap: spacing.sm,
});

export const emptyState = style([
  sprinkles({
    padding: 'lg',
    color: 'gray8',
    fontSize: 'sm',
  }),
  {
    textAlign: 'center',
  },
]);
