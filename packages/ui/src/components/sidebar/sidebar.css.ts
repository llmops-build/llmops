import { recipe } from '@vanilla-extract/recipes';
import { calc } from '@vanilla-extract/css-utils';
import { sprinkles } from '../../styles/sprinkles.css';
import { colors } from '../../tokens/colors.css';
import { spacing } from '../../tokens/spacing.css';

export const sidebarRecipe = recipe({
  base: [
    sprinkles({
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: 'gray2',
      transitionTimingFunction: 'easeInOutCubic',
    }),
    {
      width: 'var(--sidebar-width)',
      gridRow: '1 / 3',
      height: '100%',
      alignItems: 'stretch',
      willChange: 'width',
      transitionProperty: 'width',
      transitionDuration: '200ms',
    },
  ],
  variants: {
    collapsed: {
      true: {
        width: '4rem',
      },
      false: {
        width: 'var(--sidebar-width)',
      },
    },
    position: {
      fixed: {
        position: 'fixed',
        left: 0,
        top: 0,
        zIndex: 40,
      },
      relative: {
        position: 'relative',
      },
    },
    theme: {
      light: {
        backgroundColor: colors.gray2,
        borderRightColor: colors.gray6,
      },
      dark: {
        backgroundColor: colors.gray1,
        borderRightColor: colors.gray6,
      },
    },
  },
  defaultVariants: {
    collapsed: false,
    position: 'relative',
    theme: 'light',
  },
});

export const headerRecipe = recipe({
  base: [
    sprinkles({
      borderColor: 'gray6',
      padding: 'sm',
    }),
    {
      height: spacing['2xl'],
    },
  ],
  variants: {
    centered: {
      true: sprinkles({
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }),
      false: sprinkles({
        display: 'flex',
        alignItems: 'center',
        flexDirection: 'row-reverse',
      }),
    },
  },
  defaultVariants: {
    centered: false,
  },
});

export const footerRecipe = recipe({
  base: [
    sprinkles({
      borderColor: 'gray6',
    }),
    {
      height: spacing['2xl'],
      borderTop: '1px solid',
      marginTop: 'auto',
    },
  ],
  variants: {
    centered: {
      true: sprinkles({
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }),
      false: sprinkles({
        display: 'flex',
        alignItems: 'center',
      }),
    },
  },
  defaultVariants: {
    centered: false,
  },
});

export const contentRecipe = recipe({
  base: [
    sprinkles({
      padding: 'sm',
      gap: 'xs',
      display: 'flex',
      flexDirection: 'column',
    }),
    {
      flex: 1,
      overflowY: 'auto',
      overflowX: 'clip',
    },
  ],
});

export const sidebarItem = recipe({
  base: [
    sprinkles({
      display: 'flex',
      padding: 'xs',
      fontSize: 'sm',
      color: 'gray11',
    }),
    {
      lineHeight: calc.multiply(spacing.md, 1.25),
      alignItems: 'center',
      gap: spacing.md,
      borderRadius: '0.25rem',
      textDecoration: 'none',
      cursor: 'pointer',
      transition: 'all 0.2s ease-in-out',
      border: 'none',
      fontFamily: 'inherit',
      width: '100%',
      fontWeight: 400,
      textAlign: 'left',
      color: colors.gray9,
      backgroundColor: colors.gray2,
      selectors: {
        '&:hover': {
          backgroundColor: colors.gray3,
        },
        '&.active': {
          backgroundColor: colors.gray4,
          color: colors.gray11,
        },
      },
    },
  ],
});

export type SidebarVariants = NonNullable<Parameters<typeof sidebarRecipe>[0]>;
export type SidebarHeaderVariants = NonNullable<
  Parameters<typeof headerRecipe>[0]
>;
export type SidebarFooterVariants = NonNullable<
  Parameters<typeof footerRecipe>[0]
>;
export type SidebarContentVariants = NonNullable<
  Parameters<typeof contentRecipe>[0]
>;
export type SidebarItemVariants = NonNullable<
  Parameters<typeof sidebarItem>[0]
>;

// Note: Icon styling is now handled by the app's centralized Icon component
