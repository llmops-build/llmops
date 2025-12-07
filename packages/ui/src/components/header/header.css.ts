import { style } from '@vanilla-extract/css';
import { spacing } from '../../tokens/spacing.css';

export const base = style({
  height: spacing['2xl'],
  width: 'calc(100% - var(--sidebar-width))',
});
