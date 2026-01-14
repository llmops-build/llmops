import { colors, spacing } from '@ui';
import { style } from '@vanilla-extract/css';
import { calc } from '@vanilla-extract/css-utils';

export const newConfigStateContainer = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  height: calc.subtract('100%', spacing['2xl']),
});

export const newConfigStateContent = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: spacing.md,
});

export const newConfigStateTitle = style({
  margin: 0,
  color: colors.gray10,
  fontWeight: 400,
  fontSize: '0.875rem',
  textAlign: 'center',
  maxWidth: '240px',
  textWrap: 'balance',
});
