import { colors, spacing } from '@ui';
import { style } from '@vanilla-extract/css';
import { calc } from '@vanilla-extract/css-utils';

export const container = style({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
});

export const toolbar = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: `${spacing.sm}`,
  borderBottom: `1px solid ${colors.gray4}`,
  position: 'sticky',
  top: spacing['2xl'],
  backgroundColor: colors.background,
  zIndex: 1,
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

export const tableContainer = style({
  flex: 1,
  overflow: 'auto',
});

export const rowNumber = style({
  color: colors.gray11,
  fontVariantNumeric: 'tabular-nums',
  fontSize: '13px',
});

export const jsonPreview = style({
  fontFamily: 'monospace',
  fontSize: '12px',
  color: colors.gray11,
  maxWidth: '300px',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

export const emptyCell = style({
  color: colors.gray9,
  fontStyle: 'italic',
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
  margin: 0,
});

export const emptyStateDescription = style({
  fontSize: '14px',
  color: colors.gray11,
  textAlign: 'center',
  margin: 0,
});
