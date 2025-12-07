import { recipe } from '@vanilla-extract/recipes';
import { colors } from '../../tokens/colors.css';
import { spacing } from '../../tokens/spacing.css';

export const buttonRecipe = recipe({
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
    borderRadius: '0.25rem',
    cursor: 'pointer',
    fontWeight: '500',
    fontSize: '0.875rem',
    lineHeight: '1.25rem',
    textDecoration: 'none',
    outline: 'none',
    transition: 'all 0.2s ease-in-out',
    ':focus': {
      outline: `2px solid ${colors.accent9}`,
    },
    ':disabled': {
      opacity: '0.5',
      cursor: 'not-allowed',
    },
  },
  variants: {
    variant: {
      primary: {
        backgroundColor: colors.accent9,
        color: colors.accentContrast,
        ':hover': {
          backgroundColor: colors.accent10,
        },
        ':active': {
          backgroundColor: colors.accent11,
        },
      },
      secondary: {
        backgroundColor: colors.gray6,
        color: colors.gray12,
        ':hover': {
          backgroundColor: colors.gray7,
        },
        ':active': {
          backgroundColor: colors.gray8,
        },
      },
      ghost: {
        backgroundColor: 'transparent',
        color: colors.gray9,
        ':hover': {
          backgroundColor: colors.gray3,
        },
        ':active': {
          backgroundColor: colors.gray3,
          outline: 'none',
        },
        ':focus': {
          backgroundColor: colors.gray3,
          outline: 'none',
        },
      },
      danger: {
        backgroundColor: '#dc2626',
        color: '#ffffff',
        ':hover': {
          backgroundColor: '#b91c1c',
        },
        ':active': {
          backgroundColor: '#991b1b',
        },
      },
    },
    size: {
      sm: {
        paddingLeft: spacing.sm,
        paddingRight: spacing.sm,
        paddingTop: spacing.xs,
        paddingBottom: spacing.xs,
        fontSize: '0.75rem',
        lineHeight: '1rem',
      },
      md: {
        paddingLeft: spacing.md,
        paddingRight: spacing.md,
        paddingTop: spacing.sm,
        paddingBottom: spacing.sm,
      },
      lg: {
        paddingLeft: spacing.lg,
        paddingRight: spacing.lg,
        paddingTop: spacing.md,
        paddingBottom: spacing.md,
        fontSize: '1rem',
        lineHeight: '1.5rem',
      },
      icon: {
        padding: spacing.sm,
      },
    },
    fullWidth: {
      true: {
        width: '100%',
      },
    },
  },
  defaultVariants: {
    variant: 'primary',
    size: 'md',
  },
});

export type ButtonVariants = NonNullable<Parameters<typeof buttonRecipe>[0]>;
