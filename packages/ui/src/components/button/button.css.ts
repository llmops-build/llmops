import { style } from '@vanilla-extract/css';
import { spacing } from '../../tokens/spacing.css';

export const base = style({
  paddingLeft: spacing.sm,
  paddingRight: spacing.sm,
  paddingTop: spacing.xs,
  paddingBottom: spacing.xs,
});