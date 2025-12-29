import { style } from '@vanilla-extract/css';
import { colors } from '../../tokens/colors.css';
import { spacing } from '../../tokens/spacing.css';

export const base = style({
  backgroundColor: colors.background,
  borderRadius: spacing.sm,
  borderWidth: '1px',
  borderStyle: 'solid',
  borderColor: colors.gray4,
  overflow: 'hidden',
});
