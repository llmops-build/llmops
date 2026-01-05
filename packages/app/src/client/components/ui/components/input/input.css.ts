import { recipe } from '@vanilla-extract/recipes';
import { colors, spacing } from '../../tokens';

export const inputRecipe = recipe({
  base: {
    borderRadius: spacing.xs,
    outline: 'none',
    fontFamily: 'inherit',
    transition: 'border-color 0.15s ease',
    '::placeholder': {
      color: colors.gray7,
    },
    ':disabled': {
      cursor: 'not-allowed',
      opacity: 0.6,
    },
  },
  variants: {
    size: {
      default: {
        height: spacing['xl'],
        paddingRight: spacing.sm,
        paddingLeft: spacing.sm,
        fontSize: '0.875rem',
      },
      lg: {
        height: '44px',
        paddingRight: spacing.md,
        paddingLeft: spacing.md,
        fontSize: '0.875rem',
      },
    },
    variant: {
      default: {
        backgroundColor: colors.gray1,
        color: colors.gray11,
        border: `1px solid ${colors.gray4}`,
        selectors: {
          '&:focus': {
            borderColor: colors.accent9,
          },
        },
      },
      filled: {
        backgroundColor: colors.gray3,
        color: colors.gray12,
        border: `1px solid ${colors.gray5}`,
        selectors: {
          '&:focus': {
            borderColor: colors.gray7,
            boxShadow: `0 0 0 1px ${colors.gray7}`,
          },
        },
      },
    },
  },
  defaultVariants: {
    size: 'default',
    variant: 'default',
  },
});

export type InputVariants = NonNullable<Parameters<typeof inputRecipe>[0]>;
