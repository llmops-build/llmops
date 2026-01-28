import { colors, spacing } from '@ui';
import { style } from '@vanilla-extract/css';
import { calc } from '@vanilla-extract/css-utils';

export const container = style({
  display: 'flex',
  flexDirection: 'column',
  minHeight: calc('100%').subtract(spacing['2xl']).toString(),
});

export const toolbar = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: `${spacing.sm}`,
  height: spacing['2xl'],
  borderBottom: `1px solid ${colors.gray4}`,
  position: 'sticky',
  top: spacing['2xl'],
  backgroundColor: colors.background,
});

export const toolbarLeft = style({
  display: 'flex',
  alignItems: 'center',
  gap: spacing.sm,
});

export const toolbarRight = style({
  display: 'flex',
  alignItems: 'center',
  gap: spacing.sm,
});

export const content = style({
  flex: 1,
  padding: spacing.lg,
});

export const infoText = style({
  color: colors.gray11,
  fontVariantNumeric: 'tabular-nums',
  fontSize: '13px',
});

export const emptyState = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: spacing['3xl'],
  gap: spacing.md,
  color: colors.gray11,
});

export const emptyStateTitle = style({
  fontSize: '16px',
  fontWeight: 500,
  color: colors.gray12,
});

export const emptyStateDescription = style({
  fontSize: '14px',
  color: colors.gray11,
  textAlign: 'center',
});
