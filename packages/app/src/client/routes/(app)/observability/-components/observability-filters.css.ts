import { style } from '@vanilla-extract/css';
import { colors, spacing, sprinkles } from '@ui';

export const filtersTrigger = style([
  sprinkles({
    display: 'flex',
    gap: 'xs',
    fontSize: 'sm',
    fontFamily: 'mono',
    padding: 'xs',
    borderRadius: 'xs',
  }),
  {
    alignItems: 'center',
    backgroundColor: colors.gray2,
    border: `1px solid ${colors.gray6}`,
    color: colors.gray11,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    height: '32px',
    paddingLeft: spacing.sm,
    paddingRight: spacing.sm,
    ':hover': {
      backgroundColor: colors.gray3,
      borderColor: colors.gray7,
    },
    selectors: {
      '&[data-state="open"]': {
        backgroundColor: colors.gray3,
        borderColor: colors.accent9,
      },
    },
  },
]);

export const filtersTriggerIcon = style({
  color: colors.gray11,
  flexShrink: 0,
});

export const filtersTriggerText = style({
  color: colors.gray11,
  whiteSpace: 'nowrap',
});

export const filtersBadge = style([
  sprinkles({
    fontSize: 'xs',
    fontFamily: 'mono',
    borderRadius: 'xs',
  }),
  {
    backgroundColor: colors.accent9,
    color: colors.gray1,
    padding: '2px 6px',
    marginLeft: spacing.xs,
    fontWeight: 500,
    minWidth: '18px',
    textAlign: 'center',
  },
]);

export const filtersContent = style([
  sprinkles({
    borderRadius: 'sm',
  }),
  {
    backgroundColor: colors.gray1,
    border: `1px solid ${colors.gray6}`,
    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)',
    minWidth: '280px',
    overflow: 'hidden',
  },
]);

export const filtersHeader = style([
  sprinkles({
    padding: 'sm',
    fontSize: 'xs',
    fontFamily: 'mono',
  }),
  {
    borderBottom: `1px solid ${colors.gray4}`,
    color: colors.gray9,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    fontWeight: 500,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
]);

export const clearButton = style([
  sprinkles({
    fontSize: 'xs',
    fontFamily: 'mono',
  }),
  {
    backgroundColor: 'transparent',
    border: 'none',
    color: colors.accent9,
    cursor: 'pointer',
    textTransform: 'none',
    letterSpacing: 'normal',
    fontWeight: 400,
    ':hover': {
      color: colors.accent10,
      textDecoration: 'underline',
    },
  },
]);

export const filtersBody = style({
  padding: spacing.sm,
  display: 'flex',
  flexDirection: 'column',
  gap: spacing.sm,
});

export const filterRow = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing.xs,
});

export const filterLabel = style([
  sprinkles({
    fontSize: 'xs',
    fontFamily: 'mono',
  }),
  {
    color: colors.gray9,
    letterSpacing: '0.03em',
  },
]);

export const filterSelect = style([
  sprinkles({
    fontSize: 'sm',
    fontFamily: 'mono',
    padding: 'xs',
    borderRadius: 'xs',
  }),
  {
    backgroundColor: colors.gray2,
    border: `1px solid ${colors.gray6}`,
    color: colors.gray11,
    cursor: 'pointer',
    width: '100%',
    height: '32px',
    outline: 'none',
    transition: 'all 0.15s ease',
    ':hover': {
      backgroundColor: colors.gray3,
      borderColor: colors.gray7,
    },
    ':focus': {
      borderColor: colors.accent9,
    },
    ':disabled': {
      backgroundColor: colors.gray3,
      color: colors.gray8,
      cursor: 'not-allowed',
    },
  },
]);
