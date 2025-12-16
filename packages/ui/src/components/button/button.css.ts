import { recipe } from '@vanilla-extract/recipes';
import { colors, spacing } from '../../tokens';

export const buttonRecipe = recipe({
  base: {
    borderRadius: spacing.xs,
    border: 'none',
    cursor: 'pointer',
    fontWeight: 500,
  },
  variants: {
    size: {
      default: {
        height: spacing['xl'],
        paddingRight: spacing.sm,
        paddingLeft: spacing.sm,
        paddingTop: 0,
        paddingBottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.xs,
        fontSize: '0.875rem',
      },
      sm: {},
      lg: {},
      icon: {
        width: spacing['xl'],
        height: spacing['xl'],
        padding: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      },
    },
    variant: {
      primary: {
        backgroundColor: colors.accent9,
        color: colors.accent1,
        selectors: {
          '&:hover': {
            backgroundColor: colors.accent10,
          },
          '&[data-disabled]': {
            backgroundColor: colors.accent8,
            cursor: 'not-allowed',
          },
        },
      },
      outline: {
        backgroundColor: colors.accent1,
        color: colors.accent9,
        border: `1px solid ${colors.accent9}`,
        selectors: {
          '&:hover': {
            backgroundColor: colors.accent2,
          },
          '&[data-disabled]': {
            color: colors.accent8,
            borderColor: colors.accent8,
            cursor: 'not-allowed',
          },
        },
      },
      ghost: {
        backgroundColor: 'transparent',
        color: colors.accent9,
        selectors: {
          '&:hover': {
            backgroundColor: colors.accent2,
          },
          '&[data-disabled]': {
            color: colors.accent8,
            cursor: 'not-allowed',
          },
        },
      },
    },
    scheme: {
      default: {},
      destructive: {},
      gray: {},
    },
  },
  compoundVariants: [
    {
      variants: {
        variant: 'primary',
        scheme: 'destructive',
      },
      style: {
        backgroundColor: colors.error9,
        color: colors.error1,
        selectors: {
          '&:hover': {
            backgroundColor: colors.error10,
          },
          '&[data-disabled]': {
            backgroundColor: colors.error8,
            cursor: 'not-allowed',
          },
        },
      },
    },
    {
      variants: {
        variant: 'outline',
        scheme: 'destructive',
      },
      style: {
        backgroundColor: colors.error1,
        color: colors.error9,
        border: `1px solid ${colors.error9}`,
        selectors: {
          '&:hover': {
            backgroundColor: colors.error2,
          },
          '&[data-disabled]': {
            color: colors.error8,
            borderColor: colors.error8,
            cursor: 'not-allowed',
          },
        },
      },
    },
    {
      variants: {
        variant: 'ghost',
        scheme: 'destructive',
      },
      style: {
        backgroundColor: 'transparent',
        color: colors.error9,
        selectors: {
          '&:hover': {
            backgroundColor: colors.error2,
          },
          '&[data-disabled]': {
            color: colors.error8,
            cursor: 'not-allowed',
          },
        },
      },
    },
    {
      variants: {
        variant: 'primary',
        scheme: 'gray',
      },
      style: {
        backgroundColor: colors.gray9,
        color: colors.gray1,
        selectors: {
          '&:hover': {
            backgroundColor: colors.gray10,
          },
          '&[data-disabled]': {
            backgroundColor: colors.gray8,
            cursor: 'not-allowed',
          },
        },
      },
    },
    {
      variants: {
        variant: 'outline',
        scheme: 'gray',
      },
      style: {
        backgroundColor: colors.gray1,
        color: colors.gray9,
        border: `1px solid ${colors.gray4}`,
        selectors: {
          '&:hover': {
            backgroundColor: colors.gray2,
          },
          '&[data-disabled]': {
            color: colors.gray8,
            borderColor: colors.gray8,
            cursor: 'not-allowed',
          },
        },
      },
    },
    {
      variants: {
        variant: 'ghost',
        scheme: 'gray',
      },
      style: {
        backgroundColor: 'transparent',
        color: colors.gray9,
        selectors: {
          '&:hover': {
            backgroundColor: colors.gray2,
          },
          '&[data-disabled]': {
            color: colors.gray8,
            cursor: 'not-allowed',
          },
        },
      },
    },
  ],
  defaultVariants: {
    size: 'default',
    variant: 'primary',
  },
});

export type ButtonVariants = NonNullable<Parameters<typeof buttonRecipe>[0]>;
