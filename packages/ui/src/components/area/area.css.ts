import { style } from '@vanilla-extract/css';
import { colors } from '../../tokens/colors.css';
import { spacing } from '../../tokens/spacing.css';

export const base = style({
  gridColumn: '2 / -1',
  gridRow: '2 / 3',
  backgroundColor: colors.background,
  borderRadius: spacing.sm,
  borderWidth: '1px',
  borderStyle: 'solid',
  borderColor: colors.gray4,
  overflow: 'hidden',
});