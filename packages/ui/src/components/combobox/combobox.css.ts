import { style } from '@vanilla-extract/css';
import { colors, spacing } from '../../tokens';
import { sprinkles } from '../../styles';

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

export const comboboxInput = style([
  sprinkles({
    fontSize: 'base',
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

export const comboboxActionButtons = style({
  boxSizing: 'border-box',
  position: 'absolute',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  bottom: 0,
  height: '100%',
  right: spacing.xs,
  borderRadius: spacing.xs,
  border: 'none',
  color: colors.gray11,
  padding: 0,
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

export const comboboxItem = style({
  boxSizing: 'border-box',
  outline: 0,
  cursor: 'default',
  userSelect: 'none',
  paddingBlock: spacing.xs,
  paddingLeft: spacing.md,
  paddingRight: spacing.lg,
  display: 'grid',
  gap: spacing.xs,
  alignItems: 'center',
  gridTemplateColumns: '0.75rem 1fr',
  fontSize: '0.875rem',
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
});

export const comboboxItemText = style({
  gridColumnStart: 2,
});

export const comboboxItemIndicator = style({
  gridColumnStart: 1,
});

export const comboboxItemIndicatorIcon = style({
  display: 'block',
  width: '0.75rem',
  height: '0.75rem',
});

export const comboboxEmpty = style({
  boxSizing: 'border-box',
  fontSize: '0.925rem',
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
  gap: spacing.xs,
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
  padding: '0.2rem 0.2rem 0.2rem 0.4rem',
  overflow: 'hidden',
  gap: spacing.xs,
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
  padding: spacing.xs,
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

export const comboboxChipInput = style({
  flex: 1,
  boxSizing: 'border-box',
  paddingLeft: spacing.xs,
  margin: 0,
  border: 'none',
  height: spacing.lg,
  borderRadius: spacing.xs,
  fontFamily: 'inherit',
  fontSize: '1rem',
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
});

export const comboboxInputWrapperInline = style({
  position: 'relative',
  backgroundColor: 'transparent',
  border: 'none',
  borderRadius: 0,
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

export const comboboxInputInline = style([
  sprinkles({
    fontSize: 'sm',
    borderRadius: 'xs',
    paddingLeft: 'xs',
    paddingRight: 'xs',
    color: 'gray12',
  }),
  {
    border: 'none',
    backgroundColor: 'transparent',
    height: '1.75rem',
    outline: 'none',
    minWidth: '8rem',
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
