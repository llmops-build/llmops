import { style } from '@vanilla-extract/css';
import { colors } from '../../tokens/colors.css';
import { spacing } from '../../tokens/spacing.css';
import { sprinkles } from '../../styles';

export const breadcrumbsContainer = style([
  sprinkles({
    fontFamily: 'mono',
  }),
  {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.xs,
    fontSize: '0.875rem',
    lineHeight: '1.25rem',
    color: colors.gray11,
  },
]);

export const breadcrumbItem = style({
  display: 'flex',
  alignItems: 'center',
  gap: spacing.sm,
  color: colors.gray9,
});

export const breadcrumbLink = style({
  color: colors.gray9,
  textDecoration: 'none',
  selectors: {
    '&:hover': {
      color: colors.gray12,
    },
  },
});

export const breadcrumbSeparator = style({
  color: colors.gray8,
  fontSize: '0.75rem',
  userSelect: 'none',
});

export const breadcrumbCurrent = style({
  color: colors.gray9,
  fontWeight: '500',
});
