import { style } from '@vanilla-extract/css';
import { colors, spacing, sprinkles } from '@ui';

export const overviewGrid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: spacing.md,
  marginBottom: spacing.lg,
});

export const statsCard = style([
  sprinkles({
    padding: 'md',
    borderColor: 'gray4',
    borderRadius: 'md',
    display: 'flex',
    flexDirection: 'column',
    gap: 'sm',
  }),
  {
    border: `1px solid ${colors.gray4}`,
    backgroundColor: colors.gray2,
  },
]);

export const statsCardLabel = style([
  sprinkles({
    fontSize: 'xs',
    fontFamily: 'mono',
    color: 'gray10',
  }),
  {
    marginBottom: spacing.xs,
    display: 'block',
    letterSpacing: '0.03em',
  },
]);

export const statsCardValue = style([
  sprinkles({
    fontSize: 'xl',
    fontFamily: 'mono',
    color: 'gray12',
  }),
  {
    fontWeight: 600,
    margin: 0,
  },
]);

export const statsCardSubvalue = style([
  sprinkles({
    fontSize: 'xs',
    fontFamily: 'sans',
    color: 'gray10',
  }),
  {
    marginTop: spacing.xs,
    display: 'block',
  },
]);

export const sectionTitle = style([
  sprinkles({
    fontFamily: 'mono',
    color: 'gray12',
  }),
  {
    fontSize: '1rem',
    fontWeight: 500,
    marginBottom: spacing.md,
    marginTop: spacing.lg,
  },
]);

export const chartContainer = style({
  border: `1px solid ${colors.gray4}`,
  borderRadius: spacing.sm,
  backgroundColor: colors.gray2,
  padding: spacing.md,
  minHeight: '300px',
});

export const chartPlaceholder = style([
  sprinkles({
    color: 'gray9',
    fontFamily: 'mono',
    fontSize: 'sm',
  }),
  {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    minHeight: '250px',
  },
]);

export const emptyState = style([
  sprinkles({
    padding: 'xl',
    color: 'gray9',
    fontFamily: 'mono',
    fontSize: 'sm',
  }),
  {
    textAlign: 'center',
    border: `1px dashed ${colors.gray6}`,
    borderRadius: spacing.sm,
  },
]);

export const tableContainer = style({
  border: `1px solid ${colors.gray4}`,
  borderRadius: spacing.sm,
  overflow: 'hidden',
});

export const filterContainer = style({
  display: 'flex',
  gap: spacing.sm,
  marginBottom: spacing.md,
  flexWrap: 'wrap',
  alignItems: 'center',
});

export const dateRangeSelector = style([
  sprinkles({
    padding: 'xs',
    fontSize: 'sm',
    fontFamily: 'mono',
    borderColor: 'gray6',
    borderRadius: 'sm',
  }),
  {
    backgroundColor: colors.gray2,
    color: colors.gray11,
    border: `1px solid ${colors.gray6}`,
    cursor: 'pointer',
    ':hover': {
      borderColor: colors.gray8,
    },
  },
]);

export const costBreakdownGrid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
  gap: spacing.md,
});

export const breakdownCard = style([
  sprinkles({
    padding: 'md',
    borderRadius: 'md',
  }),
  {
    border: `1px solid ${colors.gray4}`,
    backgroundColor: colors.gray2,
  },
]);

export const breakdownTitle = style([
  sprinkles({
    fontSize: 'sm',
    fontFamily: 'mono',
    color: 'gray11',
  }),
  {
    fontWeight: 500,
    marginBottom: spacing.sm,
    display: 'block',
  },
]);

export const breakdownItem = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: `${spacing.xs} 0`,
  borderBottom: `1px solid ${colors.gray3}`,
  selectors: {
    '&:last-child': {
      borderBottom: 'none',
    },
  },
});

export const breakdownItemLabel = style([
  sprinkles({
    fontSize: 'sm',
    fontFamily: 'mono',
    color: 'gray9',
  }),
]);

export const breakdownItemValue = style([
  sprinkles({
    fontSize: 'sm',
    fontFamily: 'mono',
    color: 'gray12',
  }),
  {
    fontWeight: 500,
  },
]);

export const statusBadge = style([
  sprinkles({
    fontSize: 'xs',
    fontFamily: 'mono',
    padding: 'xs',
    borderRadius: 'sm',
  }),
  {
    display: 'inline-block',
  },
]);

export const statusSuccess = style({
  backgroundColor: colors.accent3,
  color: colors.accent11,
});

export const statusError = style({
  backgroundColor: colors.error3,
  color: colors.error11,
});

export const loadingSpinner = style([
  sprinkles({
    color: 'gray9',
  }),
  {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
]);
