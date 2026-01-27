import { colors, spacing } from '@ui';
import { style } from '@vanilla-extract/css';
import { calc } from '@vanilla-extract/css-utils';

export const emptyDatasetsStateContainer = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  height: calc.subtract('100%', spacing['2xl']),
  padding: spacing['2xl'],
});

export const emptyDatasetsStateContent = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: spacing.md,
});

export const emptyDatasetsStateTitle = style({
  margin: 0,
  color: colors.gray10,
  fontWeight: 400,
  fontSize: '0.875rem',
  textAlign: 'center',
  maxWidth: '240px',
  textWrap: 'balance',
});
