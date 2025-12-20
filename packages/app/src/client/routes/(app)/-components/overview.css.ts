import { colors, spacing, sprinkles } from '@llmops/ui';
import { style } from '@vanilla-extract/css';
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
