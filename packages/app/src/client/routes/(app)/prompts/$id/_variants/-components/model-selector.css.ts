import { colors, spacing, sprinkles } from '@ui';
import { style } from '@vanilla-extract/css';

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
    width: '100%',
    maxWidth: '400px',
    height: spacing['xl'],
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    border: `1px solid ${colors.gray4}`,
    outline: 'none',
    cursor: 'pointer',
    ':hover': {
      borderColor: colors.accent9,
    },
  },
]);

export const triggerSelectedModelWrapper = style({
  display: 'flex',
  alignItems: 'center',
  gap: spacing['sm'],
});

export const triggerIcon = style({
  width: spacing['md'],
  height: spacing['md'],
});

export const triggerIconImg = style({
  width: spacing['md'],
  height: spacing['md'],
  selectors: {
    '.dark &': {
      filter: 'invert(1)',
    },
  },
});

export const popup = style({
  width: 'var(--anchor-width)',
  maxHeight: 'calc(var(--available-height) - 150px)',
  background: colors.background,
  overflow: 'hidden',
});

export const searchInput = style([
  sprinkles({
    fontSize: 'sm',
    paddingLeft: 'sm',
    paddingRight: 'sm',
    backgroundColor: 'gray1',
    color: 'gray11',
  }),
  {
    position: 'sticky',
    top: 0,
    width: '100%',
    height: spacing['xl'],
    borderBottom: `1px solid ${colors.gray4}`,
    borderLeft: '1px solid transparent',
    borderRight: '1px solid transparent',
    borderTop: '1px solid transparent',
    outline: 'none',
    ':-moz-placeholder': {
      color: colors.gray7,
    },
    '::-webkit-input-placeholder': {
      color: colors.gray7,
    },
    '::placeholder': {
      color: colors.gray7,
    },
    ':focus': {
      borderBottomColor: colors.accent9,
    },
  },
]);

export const searchWrapper = style({
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
});

export const searchIcon = style({
  position: 'absolute',
  zIndex: 1,
  left: spacing['sm'],
  color: colors.gray7,
  pointerEvents: 'none',
  width: spacing['md'],
  height: spacing['md'],
});

export const searchInputWithIcon = style([
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
    height: spacing['xl'],
    borderBottom: `1px solid ${colors.gray4}`,
    borderLeft: '1px solid transparent',
    borderRight: '1px solid transparent',
    borderTop: '1px solid transparent',
    outline: 'none',
    ':-moz-placeholder': {
      color: colors.gray7,
    },
    '::-webkit-input-placeholder': {
      color: colors.gray7,
    },
    '::placeholder': {
      color: colors.gray7,
    },
    ':focus': {
      borderBottomColor: colors.accent9,
    },
  },
]);

export const groupLabel = style([
  sprinkles({
    fontSize: 'xs',
    fontWeight: 'medium',
    color: 'gray9',
    paddingLeft: 'sm',
    paddingRight: 'sm',
    paddingTop: 'sm',
    paddingBottom: 'sm',
  }),
  {
    position: 'sticky',
    top: 0,
    zIndex: 1,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    background: colors.background,
  },
]);

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
    gap: spacing['sm'],
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
    },
  },
]);

export const itemIndicator = style({
  position: 'absolute',
  left: spacing['sm'],
  color: colors.accent9,
});

export const listWrapper = style({
  maxHeight: 'calc(var(--available-height) - 150px - 2rem)',
  overflowY: 'auto',
});
