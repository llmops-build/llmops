import { colors, spacing } from '@llmops/ui';
import { style } from '@vanilla-extract/css';

export const headerStyle = style({
  paddingTop: spacing.sm,
  paddingBottom: spacing.sm,
  display: 'flex',
  alignItems: 'center',
  gap: spacing.sm,
});

export const iconContainer = style({
  display: 'flex',
  alignItems: 'flex-end',
  height: '100%',
});

export const chevronStyle = style({
  color: colors.gray9,
});

export const breadcrumbLink = style({
  color: colors.gray9,
  textDecoration: 'none',
});
