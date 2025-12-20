import { colors } from '@llmops/ui';
import { recipe } from '@vanilla-extract/recipes';

export const logoWithDarkmode = recipe({
  base: {
    vars: {
      '--ghost-body': colors.gray12,
      '--ghost-eyes': colors.gray1,
    },
  },
  variants: {
    invert: {
      true: {
        vars: {
          '--ghost-body': colors.gray1,
          '--ghost-eyes': colors.gray12,
        },
      },
    },
  },
  defaultVariants: {
    invert: false,
  },
});
