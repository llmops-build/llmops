import { colors, spacing } from '@ui';
import { style } from '@vanilla-extract/css';
import { calc } from '@vanilla-extract/css-utils';

export const variantsContainer = style({
  minHeight: `calc(100vh - 2 * ${spacing['sm']} - 3 * ${spacing['2xl']} - 2px)`,
});

export const variantsHeader = style({
  height: spacing['2xl'],
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  padding: `0 ${spacing.sm}`,
  borderBottom: `1px solid ${colors.gray4}`,
  position: 'sticky',
  top: calc.multiply(spacing['2xl'], 2),
});
