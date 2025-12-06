import { style } from '@vanilla-extract/css';
import { spacing } from '../../tokens/spacing.css';
import { colors } from '../../tokens/colors.css';

export const outer = style({
  width: '100vw',
  height: '100vh',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'stretch',
  alignItems: 'stretch',
  padding: spacing.sm,
  backgroundColor: colors.gray2,
});

export const inner = style({
  flexGrow: 1,
  borderRadius: spacing.xs,
  display: 'grid',
  gridTemplateColumns: 'var(--sidebar-width) repeat(8, 1fr)',
  gridTemplateRows: `${spacing['2xl']} auto`,
});