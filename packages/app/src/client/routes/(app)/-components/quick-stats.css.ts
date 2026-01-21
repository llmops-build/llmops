import { colors, spacing, sprinkles } from '@ui';
import { style, keyframes } from '@vanilla-extract/css';
import { recipe } from '@vanilla-extract/recipes';

const shimmer = keyframes({
  '0%': { backgroundPosition: '-200% 0' },
  '100%': { backgroundPosition: '200% 0' },
});

export const quickStatsContainer = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing.sm,
});

export const quickStatsHeader = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
});

export const quickStatsTitle = style([
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

export const quickStatsGrid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(4, 1fr)',
  gap: spacing.md,
  '@media': {
    '(max-width: 768px)': {
      gridTemplateColumns: 'repeat(2, 1fr)',
    },
  },
});

export const quickStatItem = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
  padding: spacing.md,
  backgroundColor: colors.gray2,
  border: `1px solid ${colors.gray4}`,
  borderRadius: spacing.xs,
});

export const quickStatValue = style([
  sprinkles({
    fontFamily: 'mono',
  }),
  {
    fontSize: '1.5rem',
    fontWeight: 600,
    color: colors.gray12,
    lineHeight: 1.2,
  },
]);

export const quickStatValueStatus = recipe({
  base: {},
  variants: {
    status: {
      good: {
        color: colors.accent9,
      },
      warning: {
        color: '#f5a623',
      },
      error: {
        color: '#e54d4d',
      },
    },
  },
});

export const quickStatLabel = style({
  fontSize: '0.75rem',
  color: colors.gray9,
});

export const quickStatsSkeleton = style({
  height: '100px',
  backgroundColor: colors.gray3,
  borderRadius: spacing.xs,
  background: `linear-gradient(90deg, ${colors.gray3} 25%, ${colors.gray4} 50%, ${colors.gray3} 75%)`,
  backgroundSize: '200% 100%',
  animation: `${shimmer} 1.5s infinite`,
});
