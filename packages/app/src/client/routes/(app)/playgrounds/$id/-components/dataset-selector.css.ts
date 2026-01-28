import { colors, easings, spacing, sprinkles } from '@ui';
import { keyframes, style } from '@vanilla-extract/css';

const fadeIn = keyframes({
  from: {
    opacity: 0,
    transform: 'translateY(-4px)',
  },
  to: {
    opacity: 1,
    transform: 'translateY(0)',
  },
});

export const trigger = style([
  sprinkles({
    fontSize: 'sm',
    borderRadius: 'xs',
    paddingLeft: 'sm',
    paddingRight: 'sm',
    backgroundColor: 'gray1',
    color: 'gray11',
  }),
  {
    minWidth: '200px',
    height: spacing.xl,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    border: `1px solid ${colors.gray4}`,
    outline: 'none',
    cursor: 'pointer',
    ':hover': {
      backgroundColor: colors.gray2,
    },
  },
]);

export const triggerContent = style({
  display: 'flex',
  alignItems: 'center',
  gap: spacing.sm,
});

export const triggerIcon = style({
  color: colors.gray9,
});

export const placeholder = style({
  color: colors.gray9,
});

export const chevronIcon = style({
  width: spacing.md,
  height: spacing.md,
  color: colors.gray9,
});

export const popup = style({
  width: '280px',
  maxHeight: 'var(--available-height)',
  background: colors.background,
  overflow: 'hidden',
  border: `1px solid ${colors.gray4}`,
  borderRadius: spacing.xs,
  animation: `${fadeIn} 150ms ${easings.easeInOutCubic}`,
});

export const searchWrapper = style({
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
});

export const searchIcon = style({
  position: 'absolute',
  zIndex: 1,
  left: spacing.sm,
  color: colors.gray7,
  pointerEvents: 'none',
  width: spacing.md,
  height: spacing.md,
});

export const searchInput = style([
  sprinkles({
    fontSize: 'sm',
    paddingLeft: 'xl',
    paddingRight: 'sm',
    backgroundColor: 'gray1',
    color: 'gray11',
  }),
  {
    position: 'sticky',
    top: 0,
    width: '100%',
    height: spacing.xl,
    borderBottom: `1px solid ${colors.gray4}`,
    borderLeft: '1px solid transparent',
    borderRight: '1px solid transparent',
    borderTop: '1px solid transparent',
    outline: 'none',
    '::placeholder': {
      color: colors.gray7,
    },
    ':focus': {
      borderBottomColor: colors.accent9,
    },
  },
]);

export const listWrapper = style({
  maxHeight: '200px',
  overflowY: 'auto',
});

export const item = style([
  sprinkles({
    fontSize: 'sm',
    color: 'gray11',
    paddingLeft: 'xl',
    paddingRight: 'sm',
    paddingTop: 'xs',
    paddingBottom: 'xs',
  }),
  {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    gap: spacing.sm,
    cursor: 'pointer',
    transition: 'background-color 0.15s ease',
    ':hover': {
      backgroundColor: colors.gray2,
    },
    ':focus': {
      backgroundColor: colors.gray2,
      outline: 'none',
    },
    selectors: {
      '&[data-selected]': {
        backgroundColor: colors.accent2,
        color: colors.accent11,
      },
      '&[data-highlighted]': {
        backgroundColor: colors.gray2,
      },
    },
  },
]);

export const itemIndicator = style({
  position: 'absolute',
  left: spacing.sm,
  color: colors.accent9,
  width: '16px',
});

export const itemIcon = style({
  color: colors.gray9,
  flexShrink: 0,
});

export const itemName = style({
  flex: 1,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

export const noResults = style([
  sprinkles({
    fontSize: 'sm',
    color: 'gray9',
    paddingLeft: 'sm',
    paddingRight: 'sm',
    paddingTop: 'sm',
    paddingBottom: 'sm',
  }),
  {
    textAlign: 'center',
  },
]);

export const actionsContainer = style({
  borderTop: `1px solid ${colors.gray4}`,
  display: 'flex',
  flexDirection: 'column',
});

export const actionButton = style([
  sprinkles({
    fontSize: 'sm',
    color: 'gray9',
    paddingLeft: 'sm',
    paddingRight: 'sm',
    paddingTop: 'xs',
    paddingBottom: 'xs',
  }),
  {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.background,
    cursor: 'pointer',
    textDecoration: 'none',
    outline: 'none',
    border: 'none',
    width: '100%',
    ':hover': {
      backgroundColor: colors.gray2,
      color: colors.gray11,
    },
    ':focus': {
      backgroundColor: colors.gray2,
      color: colors.gray11,
    },
  },
]);

export const actionLink = style([
  sprinkles({
    fontSize: 'sm',
    color: 'gray9',
    paddingLeft: 'sm',
    paddingRight: 'sm',
    paddingTop: 'xs',
    paddingBottom: 'xs',
  }),
  {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.background,
    cursor: 'pointer',
    textDecoration: 'none',
    outline: 'none',
    border: 'none',
    width: '100%',
    ':hover': {
      backgroundColor: colors.gray2,
      color: colors.gray11,
    },
    ':focus': {
      backgroundColor: colors.gray2,
      color: colors.gray11,
    },
  },
]);
