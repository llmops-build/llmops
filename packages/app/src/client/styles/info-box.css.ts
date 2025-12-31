import { colors, spacing } from '@ui';
import { style } from '@vanilla-extract/css';

export const infoBox = style({
  display: 'flex',
  alignItems: 'center',
  gap: spacing.sm,
  padding: spacing.md,
  backgroundColor: colors.accent2,
  borderRadius: spacing.xs,
  fontSize: '0.875rem',
  color: colors.gray10,
});

export const infoBoxHighlight = style({
  padding: spacing.xs,
  backgroundColor: colors.accent4,
  color: colors.gray12,
  borderRadius: spacing.xs,
  fontWeight: 500,
  marginLeft: spacing.xs,
  marginRight: spacing.xs,
});
