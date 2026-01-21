import { colors, spacing, sprinkles } from '@ui';
import { style } from '@vanilla-extract/css';

export const featureCard = style({
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: colors.gray2,
  border: `1px solid ${colors.gray4}`,
  borderRadius: spacing.sm,
  padding: spacing.md,
  gap: spacing.md,
  flex: 1,
  minWidth: '200px',
});

export const featureCardHeader = style({
  display: 'flex',
  alignItems: 'center',
  gap: spacing.sm,
});

export const featureCardTitle = style([
  sprinkles({
    fontFamily: 'sans',
  }),
  {
    fontSize: '0.9375rem',
    fontWeight: 600,
    color: colors.gray12,
    margin: 0,
  },
]);

export const featureCardMetrics = style({
  display: 'flex',
  gap: spacing.lg,
  flex: 1,
});

export const featureCardMetric = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
});

export const featureCardMetricValue = style([
  sprinkles({
    fontFamily: 'mono',
  }),
  {
    fontSize: '1.25rem',
    fontWeight: 600,
    color: colors.gray12,
  },
]);

export const featureCardMetricLabel = style({
  fontSize: '0.75rem',
  color: colors.gray9,
});

export const featureCardAction = style({
  fontSize: '0.8125rem',
  fontWeight: 500,
  color: colors.accent9,
  textDecoration: 'none',
  ':hover': {
    textDecoration: 'underline',
  },
});
