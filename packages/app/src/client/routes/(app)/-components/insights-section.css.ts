import { colors, spacing, sprinkles } from '@ui';
import { style } from '@vanilla-extract/css';
import { recipe } from '@vanilla-extract/recipes';

export const insightsContainer = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing.sm,
});

export const insightsTitle = style([
  sprinkles({
    fontFamily: 'mono',
  }),
  {
    fontSize: '0.75rem',
    fontWeight: 500,
    color: colors.gray9,
    margin: 0,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
]);

export const insightsList = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing.xs,
});

export const insightItem = recipe({
  base: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: spacing.xs,
    border: '1px solid',
  },
  variants: {
    type: {
      warning: {
        backgroundColor: '#fef3cd',
        borderColor: '#ffc107',
      },
      info: {
        backgroundColor: colors.accent2,
        borderColor: colors.accent5,
      },
      success: {
        backgroundColor: '#d4edda',
        borderColor: '#28a745',
      },
    },
  },
});

export const insightIcon = recipe({
  base: {
    flexShrink: 0,
  },
  variants: {
    type: {
      warning: {
        color: '#856404',
      },
      info: {
        color: colors.accent11,
      },
      success: {
        color: '#155724',
      },
    },
  },
});

export const insightMessage = style({
  flex: 1,
  fontSize: '0.8125rem',
  color: colors.gray12,
  lineHeight: 1.4,
});

export const insightAction = style({
  fontSize: '0.8125rem',
  fontWeight: 500,
  color: colors.accent9,
  textDecoration: 'none',
  flexShrink: 0,
  ':hover': {
    textDecoration: 'underline',
  },
});
