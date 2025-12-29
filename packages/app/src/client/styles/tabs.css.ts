import { colors, spacing, sprinkles } from '@ui';
import { style } from '@vanilla-extract/css';
import { recipe } from '@vanilla-extract/recipes';
import { calc } from '@vanilla-extract/css-utils';

export const tabsContainer = style([
  {
    borderBottom: `1px solid ${colors.gray4}`,
    height: spacing['2xl'],
    display: 'flex',
    alignItems: 'center',
    paddingLeft: spacing.xs,
    paddingRight: spacing.xs,
    gap: spacing.sm,
    position: 'sticky',
    top: spacing['2xl'],
  },
]);

export const tab = recipe({
  base: [
    sprinkles({
      display: 'flex',
      padding: 'xs',
      fontSize: 'sm',
      color: 'gray11',
      fontFamily: 'mono',
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
      width: 'auto',
      fontWeight: 400,
      textAlign: 'left',
      color: colors.gray9,
      backgroundColor: 'transparent',
      paddingLeft: spacing.sm,
      paddingRight: spacing.sm,
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
