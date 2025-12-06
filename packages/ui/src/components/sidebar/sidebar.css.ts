import { style } from '@vanilla-extract/css';
import { colors } from '../../tokens/colors.css';

export const base = style({
  width: 'var(--sidebar-width)',
  gridRow: '1 / 3',
  height: '100%',
  backgroundColor: colors.gray2,
});