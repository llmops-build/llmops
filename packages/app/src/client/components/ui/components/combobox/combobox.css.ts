import { style } from '@vanilla-extract/css';
import { colors, spacing } from '../../tokens';
import { sprinkles } from '../../styles';
import { recipe } from '@vanilla-extract/recipes';

export const comboboxLabel = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing.xs,
  fontSize: '0.875rem',
  lineHeight: '1.25rem',
  fontWeight: 500,
  color: colors.gray12,
  position: 'relative',
  maxWidth: '16rem',
});

export const comboboxInputWrapper = style({
  position: 'relative',
  backgroundColor: colors.gray1,
  border: `1px solid ${colors.gray4}`,
  borderRadius: spacing.xs,
  selectors: {
    '&:focus-within': {
      borderColor: colors.accent9,
    },
  },
});

export const comboboxInputWrapperDisabled = style({
  opacity: 0.5,
  cursor: 'not-allowed',
  selectors: {
    '&:focus-within': {
      borderColor: colors.gray4,
    },
  },
});

export const comboboxInput = style([
  sprinkles({
    fontSize: 'sm',
    borderRadius: 'xs',
    paddingLeft: 'sm',
    paddingRight: 'sm',
    color: 'gray11',
  }),
  {
    border: 'none',
    backgroundColor: 'transparent',
    height: spacing['xl'],
    // border: `1px solid ${colors.gray4}`,
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
    // ':focus': {
    //   borderColor: colors.accent9,
    // },
  },
]);

export const comboboxInputDisabled = style({
  cursor: 'not-allowed',
});

export const comboboxActionButtons = style({
  boxSizing: 'border-box',
  position: 'absolute',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  bottom: 0,
  height: '100%',
  right: spacing.xs,
  border: 'none',
  color: colors.gray11,
  padding: 0,
  backgroundColor: colors.gray1,
  borderRadius: spacing.xs,
});

export const comboboxTrigger = style({
  boxSizing: 'border-box',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '1.5rem',
  height: '100%',
  color: colors.gray11,
  border: 'none',
  padding: 0,
  borderRadius: spacing.xs,
  background: 'none',
  cursor: 'pointer',
});

export const comboboxClear = style({
  boxSizing: 'border-box',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '1.5rem',
  height: spacing['2xl'],
  color: colors.gray11,
  border: 'none',
  padding: 0,
  borderRadius: spacing.xs,
  background: 'none',
  cursor: 'pointer',
});

export const comboboxIcon = style({
  width: '1rem',
  height: '1rem',
});

export const comboboxPositioner = style({
  outline: 0,
  zIndex: 200, // Higher than popover (100) to ensure dropdown appears above
});

export const comboboxPopup = style({
  boxSizing: 'border-box',
  borderRadius: spacing.xs,
  backgroundColor: colors.gray1,
  color: colors.gray12,
  width: 'var(--anchor-width)',
  maxHeight: 'min(23rem, var(--available-height))',
  maxWidth: 'var(--available-width)',
  transition: 'opacity 0.1s, transform 0.1s',
  transformOrigin: 'var(--transform-origin)',
  outline: `1px solid ${colors.gray6}`,
  boxShadow: `0 10px 15px -3px ${colors.gray6}, 0 4px 6px -4px ${colors.gray6}`,
  selectors: {
    '&[data-starting-style], &[data-ending-style]': {
      opacity: 0,
      transform: 'scale(0.95)',
    },
  },
});

export const comboboxList = style({
  boxSizing: 'border-box',
  overflowY: 'auto',
  overscrollBehavior: 'contain',
  paddingBlock: spacing.xs,
  scrollPaddingBlock: spacing.xs,
  outline: 0,
  width: 'var(--anchor-width)',
  maxHeight: 'min(23rem, var(--available-height))',
  maxWidth: 'var(--available-width)',
  selectors: {
    '&[data-empty]': {
      padding: 0,
    },
  },
});

export const comboboxItem = recipe({
  base: {
    boxSizing: 'border-box',
    outline: 0,
    cursor: 'default',
    userSelect: 'none',
    paddingBlock: spacing.xs,
    paddingLeft: spacing.sm,
    paddingRight: spacing.lg,
    display: 'grid',
    gap: spacing.sm,
    alignItems: 'center',
    gridTemplateColumns: '0.75rem 1fr',
    fontSize: '0.875rem',
    whiteSpace: 'nowrap',
    lineHeight: '1rem',
    color: colors.gray10,
    selectors: {
      '&[data-highlighted]': {
        zIndex: 0,
        position: 'relative',
        color: colors.gray12,
      },
      '&[data-highlighted]::before': {
        content: '',
        zIndex: -1,
        position: 'absolute',
        insetBlock: 0,
        insetInline: spacing.xs,
        borderRadius: spacing.xs,
        backgroundColor: colors.gray3,
      },
    },
  },
  variants: {
    withIcon: {
      true: {
        gridTemplateColumns: '0.75rem 1rem 1fr',
      },
      false: {},
    },
  },
  defaultVariants: {
    withIcon: false,
  },
});

export const comboboxItemText = recipe({
  base: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  variants: {
    withIcon: {
      true: {
        gridColumnStart: 3,
      },
      false: {
        gridColumnStart: 2,
      },
    },
  },
  defaultVariants: {
    withIcon: false,
  },
});

export const comboboxItemIcon = recipe({
  base: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '1rem',
    height: '1rem',
    color: colors.gray11,
  },
  variants: {
    withIcon: {
      true: {
        gridColumnStart: 2,
      },
      false: {
        gridColumnStart: 2,
      },
    },
  },
  defaultVariants: {
    withIcon: false,
  },
});

export const comboboxItemIndicator = recipe({
  base: {},
  variants: {
    withIcon: {
      true: {
        gridColumnStart: 1,
      },
      false: {
        gridColumnStart: 1,
      },
    },
  },
  defaultVariants: {
    withIcon: false,
  },
});

export const comboboxItemIndicatorIcon = style({
  display: 'block',
  width: '0.75rem',
  height: '0.75rem',
});

export const comboboxEmpty = style({
  boxSizing: 'border-box',
  fontSize: '0.875rem',
  lineHeight: '1rem',
  color: colors.gray11,
  padding: spacing.md,
  selectors: {
    '&:empty': {
      margin: 0,
      padding: 0,
    },
  },
});

// Chips for multiple selection
export const comboboxChips = style({
  boxSizing: 'border-box',
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: spacing.sm,
  border: `1px solid ${colors.gray6}`,
  borderRadius: spacing.xs,
  padding: spacing.xs,
  selectors: {
    '&:focus-within': {
      outline: `2px solid ${colors.accent9}`,
      outlineOffset: '-1px',
    },
  },
});

export const comboboxChip = style({
  display: 'flex',
  alignItems: 'center',
  backgroundColor: colors.gray3,
  color: colors.gray12,
  borderRadius: spacing.xs,
  fontSize: '0.875rem',
  padding: '0.125rem 0.125rem 0.125rem 0.375rem',
  overflow: 'hidden',
  gap: '0.125rem',
  outline: 0,
  cursor: 'default',
  selectors: {
    '&:focus-within': {
      backgroundColor: colors.accent9,
      color: colors.gray1,
    },
    '&[data-highlighted]': {
      backgroundColor: colors.accent9,
      color: colors.gray1,
    },
  },
});

export const comboboxChipRemove = style({
  border: 'none',
  background: 'none',
  padding: '0.125rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'inherit',
  borderRadius: spacing.xs,
  cursor: 'pointer',
  selectors: {
    '&:hover': {
      backgroundColor: colors.gray4,
    },
  },
});

export const comboboxChipIcon = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '1rem',
  height: '1rem',
  color: colors.gray11,
});

export const comboboxChipInput = style({
  flex: 1,
  boxSizing: 'border-box',
  paddingLeft: spacing.xs,
  margin: 0,
  border: 'none',
  height: spacing.lg,
  borderRadius: spacing.xs,
  fontFamily: 'inherit',
  fontSize: '0.875rem',
  backgroundColor: 'transparent',
  color: colors.gray12,
  minWidth: '3rem',
  selectors: {
    '&:focus': {
      outline: 'none',
    },
  },
});

export const comboboxGroup = style({
  display: 'block',
  paddingBottom: spacing.xs,
});

export const comboboxGroupLabel = style({
  boxSizing: 'border-box',
  padding: `${spacing.sm} ${spacing.md} ${spacing.xs} calc(${spacing.md} + 0.75rem + ${spacing.xs})`,
  fontSize: '0.6875rem',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  backgroundColor: colors.gray1,
  position: 'sticky',
  zIndex: 1,
  top: 0,
  margin: `0 ${spacing.xs} 0 0`,
  width: 'calc(100% - 0.5rem)',
  color: colors.gray11,
});

// Inline variant styles
export const comboboxLabelInline = style({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  gap: 0,
  fontSize: '0.875rem',
  lineHeight: '1.25rem',
  fontWeight: 400,
  color: colors.gray12,
  position: 'relative',
  maxWidth: 'none',
  flex: 1,
  minWidth: 0, // Allows flex item to shrink below content size
});

export const comboboxInputWrapperInline = style({
  position: 'relative',
  backgroundColor: 'transparent',
  border: 'none',
  borderRadius: 0,
  display: 'flex',
  alignItems: 'center',
  minWidth: '10rem',
  maxWidth: '100%',
  selectors: {
    '&:hover': {
      backgroundColor: colors.gray2,
    },
    '&:focus-within': {
      backgroundColor: colors.gray3,
      borderColor: 'transparent',
    },
  },
});

export const comboboxInputWrapperInlineDisabled = style({
  opacity: 0.5,
  cursor: 'not-allowed',
  selectors: {
    '&:hover': {
      backgroundColor: 'transparent',
    },
    '&:focus-within': {
      backgroundColor: 'transparent',
    },
  },
});

export const comboboxInputInline = style([
  sprinkles({
    fontSize: 'sm',
    borderRadius: 'xs',
    paddingLeft: 'xs',
    color: 'gray12',
  }),
  {
    border: 'none',
    backgroundColor: 'transparent',
    height: '1.75rem',
    outline: 'none',
    flex: 1,
    minWidth: '6rem',
    paddingRight: '3rem', // Make room for action buttons
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    ':-moz-placeholder': {
      color: colors.gray9,
    },
    '::-webkit-input-placeholder': {
      color: colors.gray9,
    },
    '::placeholder': {
      color: colors.gray9,
    },
  },
]);

export const comboboxInputInlineDisabled = style({
  cursor: 'not-allowed',
});

export const comboboxActionButtonsInline = style({
  boxSizing: 'border-box',
  position: 'absolute',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  bottom: 0,
  height: '100%',
  right: 0,
  border: 'none',
  color: colors.gray11,
  padding: 0,
  backgroundColor: colors.gray1,
  borderRadius: spacing.xs,
  opacity: 0.8,
  transition: 'opacity 0.15s',
  selectors: {
    '&:hover, &:focus-within': {
      opacity: 1,
    },
  },
});
