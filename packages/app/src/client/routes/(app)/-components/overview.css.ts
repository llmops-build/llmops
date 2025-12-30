import { colors, spacing, sprinkles } from '@ui';
import { style } from '@vanilla-extract/css';
import { calc } from '@vanilla-extract/css-utils';
import { recipe } from '@vanilla-extract/recipes';

export const overviewContainer = style({
  padding: spacing.md,
});

export const sectionContainer = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing.md,
  width: '100%',
});

export const recentSectionContainer = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing.md,
  width: '100%',
  marginTop: spacing.lg,
});

export const recentSectionTableContainer = style({
  marginLeft: calc.negate(spacing.md),
  marginRight: calc.negate(spacing.md),
  width: calc.add('100%', calc.multiply(2, spacing.md)),
});

export const gettingStartedCards = style([
  sprinkles({
    display: 'flex',
    flexDirection: 'row',
    gap: 'md',
  }),
  {},
]);

export const gettingStartedCard = recipe({
  base: {
    height: '7rem',
    aspectRatio: '16 / 9',
    borderRadius: spacing.sm,
    display: 'flex',
    flexDirection: 'column',
    padding: spacing.md,
    gap: spacing.md,
    textDecoration: 'none',
    color: colors.gray12,
    justifyContent: 'space-between',
  },
  variants: {
    variant: {
      primary: {
        backgroundColor: colors.accent7,
      },
    },
  },
});

export const cardTitle = style([
  sprinkles({
    fontFamily: 'sans',
  }),
  {
    textDecoration: 'none',
    color: colors.gray12,
    fontWeight: 500,
  },
]);

export const sectionTitle = style([
  sprinkles({
    fontFamily: 'mono',
  }),
  {
    fontSize: '1.25rem',
    fontWeight: 500,
    margin: 0,
    color: colors.gray12,
  },
]);

export const baseUrlBox = style({
  display: 'flex',
  alignItems: 'center',
  gap: spacing.xs,
});

export const baseUrlText = style({
  fontFamily: 'monospace',
  fontSize: '0.75rem',
  color: colors.gray11,
  backgroundColor: colors.gray3,
  padding: `${spacing.xs} ${spacing.sm}`,
  borderRadius: spacing.xs,
});

export const baseUrlCopyButton = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: spacing.xs,
  border: 'none',
  backgroundColor: 'transparent',
  color: colors.gray9,
  cursor: 'pointer',
  borderRadius: spacing.xs,
  ':hover': {
    backgroundColor: colors.gray4,
    color: colors.gray12,
  },
});
