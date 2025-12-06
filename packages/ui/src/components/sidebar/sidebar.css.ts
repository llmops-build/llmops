import { recipe } from '@vanilla-extract/recipes';
import { sprinkles } from '../../styles/sprinkles.css';
import { colors } from '../../tokens/colors.css';
import { spacing } from '../../tokens/spacing.css';

export const sidebarRecipe = recipe({
  base: [
    sprinkles({
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: 'gray2',
    }),
    {
      width: 'var(--sidebar-width)',
      gridRow: '1 / 3',
      height: '100%',
      alignItems: 'stretch',
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
    },
  ],
});

export const sidebarItem = recipe({
  base: [
    sprinkles({
      padding: 'xs',
    }),
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
