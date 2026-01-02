import { style, keyframes } from '@vanilla-extract/css';
import { colors, spacing, sprinkles } from '@ui';

export const datePickerTrigger = style([
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

export const datePickerTriggerIcon = style({
  color: colors.gray11,
  flexShrink: 0,
});

export const datePickerTriggerText = style({
  color: colors.gray11,
  whiteSpace: 'nowrap',
});

export const datePickerContent = style([
  sprinkles({
    borderRadius: 'sm',
  }),
  {
    backgroundColor: colors.gray1,
    border: `1px solid ${colors.gray6}`,
    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)',
    minWidth: '240px',
    overflow: 'hidden',
  },
]);

export const datePickerHeader = style([
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
  },
]);

export const datePickerPresets = style({
  display: 'flex',
  flexDirection: 'column',
  padding: spacing.xs,
});

export const datePickerPresetItem = style([
  sprinkles({
    fontSize: 'sm',
    fontFamily: 'mono',
    padding: 'xs',
    borderRadius: 'xs',
  }),
  {
    backgroundColor: 'transparent',
    border: 'none',
    color: colors.gray11,
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.1s ease',
    paddingLeft: spacing.sm,
    paddingRight: spacing.sm,
    ':hover': {
      backgroundColor: colors.gray3,
    },
    selectors: {
      '&[data-selected="true"]': {
        backgroundColor: colors.accent3,
        color: colors.accent11,
      },
    },
  },
]);

export const datePickerDivider = style({
  height: '1px',
  backgroundColor: colors.gray4,
  margin: `${spacing.xs} 0`,
});

export const datePickerCustomSection = style({
  padding: spacing.sm,
  borderTop: `1px solid ${colors.gray4}`,
});

export const datePickerCustomLabel = style([
  sprinkles({
    fontSize: 'xs',
    fontFamily: 'mono',
    color: 'gray9',
  }),
  {
    display: 'block',
    marginBottom: spacing.xs,
    letterSpacing: '0.03em',
  },
]);

export const datePickerInputRow = style({
  display: 'flex',
  gap: spacing.xs,
  alignItems: 'center',
  marginBottom: spacing.sm,
});

export const datePickerInput = style([
  sprinkles({
    fontSize: 'sm',
    fontFamily: 'mono',
    padding: 'xs',
    borderRadius: 'xs',
  }),
  {
    flex: 1,
    backgroundColor: colors.gray2,
    border: `1px solid ${colors.gray6}`,
    color: colors.gray11,
    outline: 'none',
    ':focus': {
      borderColor: colors.accent9,
    },
    '::placeholder': {
      color: colors.gray7,
    },
  },
]);

export const datePickerInputSeparator = style([
  sprinkles({
    fontSize: 'sm',
    fontFamily: 'mono',
    color: 'gray9',
  }),
]);

export const datePickerApplyButton = style([
  sprinkles({
    fontSize: 'sm',
    fontFamily: 'mono',
    padding: 'xs',
    borderRadius: 'xs',
  }),
  {
    width: '100%',
    backgroundColor: colors.accent9,
    border: 'none',
    color: colors.gray1,
    cursor: 'pointer',
    fontWeight: 500,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xs,
    transition: 'all 0.15s ease',
    ':hover': {
      backgroundColor: colors.accent10,
    },
    ':disabled': {
      backgroundColor: colors.gray6,
      cursor: 'not-allowed',
    },
  },
]);

export const refreshButton = style([
  sprinkles({
    padding: 'xs',
    borderRadius: 'xs',
  }),
  {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    border: `1px solid ${colors.gray6}`,
    color: colors.gray9,
    cursor: 'pointer',
    height: '32px',
    width: '32px',
    transition: 'all 0.15s ease',
    ':hover': {
      backgroundColor: colors.gray3,
      borderColor: colors.gray7,
      color: colors.gray11,
    },
  },
]);

const spin = keyframes({
  from: { transform: 'rotate(0deg)' },
  to: { transform: 'rotate(360deg)' },
});

export const refreshButtonSpinning = style({
  animation: `${spin} 1s linear infinite`,
});
