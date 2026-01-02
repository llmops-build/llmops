import { style } from '@vanilla-extract/css';
import { calc } from '@vanilla-extract/css-utils';
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
    borderRadius: 'xs',
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
    margin: 0,
  },
]);

export const sectionTitleStandalone = style([
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
  borderRadius: spacing.xs,
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
  marginLeft: calc.negate(spacing.md),
  marginRight: calc.negate(spacing.md),
  width: calc.add('100%', calc.multiply(2, spacing.md)),
  borderTopWidth: 1,
  borderTopStyle: 'solid',
  borderTopColor: colors.gray3,
  overflowX: 'auto',
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
    borderRadius: 'xs',
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

// Request table styles
export const tableCell = style({
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  maxWidth: '200px',
});

export const timestampCell = style([
  sprinkles({
    fontFamily: 'mono',
  }),
  tableCell,
]);

export const cellStack = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
});

export const providerText = style([
  sprinkles({
    fontSize: 'xs',
    fontFamily: 'mono',
    color: 'gray9',
  }),
]);

export const modelText = style([
  sprinkles({
    fontSize: 'sm',
    fontFamily: 'mono',
  }),
]);

export const tokenSubtext = style([
  sprinkles({
    fontSize: 'xs',
    fontFamily: 'mono',
    color: 'gray9',
  }),
]);

// Daily costs chart styles
export const dailyCostsContainer = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing.sm,
});

export const dailyCostRow = style([
  sprinkles({
    fontFamily: 'mono',
    fontSize: 'xs',
  }),
  {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.sm,
  },
]);

export const dailyCostDate = style([
  sprinkles({
    color: 'gray9',
  }),
  {
    width: '80px',
  },
]);

export const dailyCostBarContainer = style({
  flex: 1,
  height: '20px',
  backgroundColor: colors.gray3,
  borderRadius: '4px',
  overflow: 'hidden',
});

export const dailyCostBar = style({
  height: '100%',
  backgroundColor: colors.accent9,
});

export const dailyCostValue = style([
  sprinkles({
    color: 'gray11',
  }),
  {
    width: '70px',
    textAlign: 'right',
  },
]);

export const dailyCostRequests = style([
  sprinkles({
    color: 'gray9',
  }),
  {
    width: '50px',
    textAlign: 'right',
  },
]);

// Requests header styles
export const requestsHeader = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: spacing.md,
  marginTop: spacing.lg,
});

export const columnToggleList = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing.xs,
  padding: spacing.xs,
  minWidth: '160px',
});

export const columnToggleItem = style([
  sprinkles({
    fontSize: 'sm',
    fontFamily: 'mono',
    padding: 'xs',
    borderRadius: 'xs',
  }),
  {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.sm,
    cursor: 'pointer',
    color: colors.gray11,
    ':hover': {
      backgroundColor: colors.gray3,
    },
  },
]);

export const columnToggleCheckbox = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '16px',
  height: '16px',
  borderRadius: '3px',
  border: `1px solid ${colors.gray6}`,
  backgroundColor: colors.gray2,
  color: colors.accent11,
  flexShrink: 0,
  selectors: {
    '&[data-checked="true"]': {
      backgroundColor: colors.accent9,
      borderColor: colors.accent9,
      color: colors.gray1,
    },
  },
});

// Requests page wrapper
export const requestsPageWrapper = style({
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  minHeight: 0,
});

// Pagination styles
export const paginationContainer = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: `${spacing.md} ${spacing.md}`,
  borderTop: `1px solid ${colors.gray4}`,
  backgroundColor: colors.gray1,
  marginLeft: calc.negate(spacing.md),
  marginRight: calc.negate(spacing.md),
  marginBottom: calc.negate(spacing.md),
  width: calc.add('100%', calc.multiply(2, spacing.md)),
  marginTop: 'auto',
  flexShrink: 0,
});

export const paginationInfo = style([
  sprinkles({
    fontSize: 'sm',
    fontFamily: 'mono',
    color: 'gray10',
  }),
]);

export const paginationControls = style({
  display: 'flex',
  alignItems: 'center',
  gap: spacing.sm,
});
