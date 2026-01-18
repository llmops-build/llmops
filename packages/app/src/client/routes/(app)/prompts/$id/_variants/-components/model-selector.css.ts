import { colors, spacing, sprinkles } from '@ui';
import { style } from '@vanilla-extract/css';

export const modelSelectorWrapper = style({
  width: '100%',
  maxWidth: '400px',
  display: 'flex',
  gap: 0,
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
    width: '100%',
    maxWidth: '400px',
    height: spacing['xl'],
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    border: `1px solid ${colors.gray4}`,
    outline: 'none',
    cursor: 'pointer',
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    ':hover': {
      backgroundColor: colors.gray2,
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

export const chevronRight = style({
  width: spacing['md'],
  height: spacing['md'],
  color: colors.gray7,
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
  border: `1px solid ${colors.gray4}`,
  borderRadius: spacing['xs'],
});

export const menuPopup = style({
  width: 'calc(var(--anchor-width))',
  maxHeight: '200px',
  background: colors.background,
  overflowY: 'auto',
  border: `1px solid ${colors.gray4}`,
  borderRadius: spacing['xs'],
  outline: 'none',
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
    fontSize: 'sm',
    fontWeight: 'medium',
    color: 'gray9',
    paddingLeft: 'sm',
    paddingRight: 'sm',
    paddingTop: 'sm',
    paddingBottom: 'sm',
    fontFamily: 'mono',
  }),
  {
    position: 'sticky',
    top: 0,
    zIndex: 1,
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
      '&[data-highlighted]': {
        backgroundColor: colors.gray2,
      },
      '&[aria-expanded="true"]': {
        backgroundColor: colors.gray2,
      },
    },
  },
]);

export const menuTrigger = style([
  sprinkles({
    fontSize: 'sm',
    color: 'gray11',
    paddingLeft: 'sm',
    paddingRight: 'sm',
    paddingTop: 'xs',
    paddingBottom: 'xs',
  }),
  {
    width: '100%',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing['sm'],
    cursor: 'pointer',
    transition: 'background-color 0.15s ease',
    border: 'none',
    background: colors.background,
    ':hover': {
      backgroundColor: colors.gray2,
    },
    ':focus': {
      backgroundColor: colors.gray2,
      outline: 'none',
    },
    selectors: {
      '&[data-state="open"]': {
        backgroundColor: colors.gray2,
      },
      '&[data-highlighted]': {
        backgroundColor: colors.gray2,
      },
      '&[aria-expanded="true"]': {
        backgroundColor: colors.gray2,
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

export const browseContainer = style({
  display: 'flex',
  height: 'calc(var(--available-height) - 150px - 2rem)',
  overflow: 'hidden',
});

export const providerColumn = style({
  width: '40%',
  borderRight: `1px solid ${colors.gray4}`,
  overflowY: 'auto',
  backgroundColor: colors.gray1,
});

export const modelColumn = style({
  width: '60%',
  overflowY: 'auto',
  display: 'flex',
  flexDirection: 'column',
});

export const providerItem = style([
  sprinkles({
    fontSize: 'sm',
    color: 'gray11',
    padding: 'sm',
  }),
  {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    cursor: 'pointer',
    gap: spacing['sm'],
    selectors: {
      '&:hover': {
        backgroundColor: colors.gray3,
      },
      '&[data-active="true"]': {
        backgroundColor: colors.background,
        color: colors.accent11,
        fontWeight: 500,
        borderRight: `1px solid transparent`,
        marginRight: '-1px',
      },
    },
  },
]);

export const providerLogo = style({
  width: spacing['md'],
  height: spacing['md'],
  selectors: {
    '.dark &': {
      filter: 'invert(1)',
    },
  },
});

export const menu = style({
  display: 'flex',
  flexDirection: 'column',
});

export const menubarList = style({
  width: '100%',
});

export const providerListItemWrapper = style({
  display: 'flex',
  alignItems: 'center',
  gap: spacing['sm'],
});

export const providerMenuItemSlug = style([
  sprinkles({
    fontFamily: 'mono',
  }),
  {
    color: colors.gray8,
    fontSize: '0.75rem',
  },
]);

export const paramsTrigger = style([
  sprinkles({
    fontSize: 'sm',
    borderRadius: 'xs',
    paddingLeft: 'sm',
    paddingRight: 'sm',
    backgroundColor: 'gray1',
    color: 'gray11',
  }),
  {
    width: 'auto',
    maxWidth: '400px',
    height: spacing['xl'],
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing['sm'],
    border: `1px solid ${colors.gray4}`,
    borderLeftWidth: 0,
    outline: 'none',
    cursor: 'pointer',
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    ':hover': {
      backgroundColor: colors.gray2,
    },
  },
]);

export const paramsPopup = style({
  width: '240px',
  maxHeight: 'calc(var(--available-height))',
  background: colors.background,
  overflow: 'hidden',
  border: `1px solid ${colors.gray4}`,
  borderRadius: spacing['xs'],
});
