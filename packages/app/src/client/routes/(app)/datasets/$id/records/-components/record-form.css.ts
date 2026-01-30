import { colors, spacing } from '@ui';
import { style } from '@vanilla-extract/css';
import { calc } from '@vanilla-extract/css-utils';

export const container = style({
  display: 'flex',
  flexDirection: 'column',
});

export const header = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: spacing.sm,
  width: '100%',
  padding: `${spacing.sm} ${spacing.xs}`,
  height: spacing['2xl'],
  borderBottom: `1px solid ${colors.gray4}`,
  position: 'sticky',
  top: calc.multiply(spacing['2xl'], 1),
  left: '0',
  backgroundColor: colors.background,
  zIndex: 10,
});

export const headerTitle = style({
  flex: 1,
  fontSize: '0.75rem',
  fontWeight: 500,
  color: colors.gray11,
});

export const headerActions = style({
  display: 'flex',
  alignItems: 'center',
  gap: spacing.sm,
});

export const formContainer = style({
  minHeight: calc.subtract('100vh', calc.multiply(spacing['2xl'], 3)),
  paddingTop: spacing.sm,
  paddingBottom: spacing.sm,
  paddingLeft: calc.add(spacing.sm, spacing.xs),
  paddingRight: calc.add(spacing.sm, spacing.xs),
  display: 'flex',
  flexDirection: 'column',
  gap: spacing.lg,
});

export const fieldGroup = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'stretch',
  paddingTop: spacing.xs,
  paddingBottom: spacing.xs,
  gap: spacing.md,
});

export const label = style({
  fontSize: '0.875rem',
  fontWeight: 400,
  color: colors.gray9,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-start',
  gap: spacing.sm,
});

export const labelOptional = style({
  fontSize: '0.75rem',
  color: colors.gray8,
});

export const textarea = style({
  padding: spacing.md,
  fontSize: '13px',
  fontFamily: 'monospace',
  color: colors.gray12,
  backgroundColor: colors.gray2,
  border: `1px solid ${colors.gray6}`,
  borderRadius: spacing.sm,
  resize: 'vertical',
  lineHeight: 1.5,
  ':focus': {
    outline: 'none',
    borderColor: colors.accent7,
    boxShadow: `0 0 0 1px ${colors.accent7}`,
  },
  '::placeholder': {
    color: colors.gray9,
  },
});

export const errorMessage = style({
  fontSize: '12px',
  color: colors.error9,
});
