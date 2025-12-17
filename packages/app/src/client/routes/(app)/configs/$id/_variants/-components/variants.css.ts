import { colors, spacing } from '@llmops/ui';
import { style } from '@vanilla-extract/css';
import { calc } from '@vanilla-extract/css-utils';

export const variantHeader = style({
  display: 'flex',
  justifyContent: 'flex-end',
  alignItems: 'center',
  gap: spacing.sm,
  width: '100%',
  paddingLeft: spacing.sm,
  paddingRight: spacing.sm,
  position: 'sticky',
  top: calc.multiply(spacing['2xl'], 1),
  padding: `${spacing.sm} ${spacing.xs}`,
  height: spacing['2xl'],
  borderBottom: `1px solid ${colors.gray4}`,
  left: '0',
  backgroundColor: colors.background,
});

export const variantContainer = style({
  minHeight: `calc(100vh - 3 * ${spacing['2xl']})`,
  paddingTop: spacing.sm,
  paddingBottom: spacing.sm,
  paddingLeft: calc.add(spacing.sm, spacing.xs),
  paddingRight: calc.add(spacing.sm, spacing.xs),
});
