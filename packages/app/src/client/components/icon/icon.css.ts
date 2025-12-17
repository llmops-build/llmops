import { recipe } from '@vanilla-extract/recipes';

export const iconRecipe = recipe({
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  variants: {
    size: {
      xs: {
        width: '0.75rem',
        height: '0.75rem',
      },
      sm: {
        width: '1rem',
        height: '1rem',
      },
      md: {
        width: '1.25rem',
        height: '1.25rem',
      },
      lg: {
        width: '1.5rem',
        height: '1.5rem',
      },
      xl: {
        width: '2rem',
        height: '2rem',
      },
    },
  },
  defaultVariants: {
    size: 'sm',
  },
});

export type IconVariants = NonNullable<Parameters<typeof iconRecipe>[0]>;
