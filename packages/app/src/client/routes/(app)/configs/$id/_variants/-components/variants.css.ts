import { colors, spacing, sprinkles } from '@llmops/ui';
import { style } from '@vanilla-extract/css';
import { calc } from '@vanilla-extract/css-utils';

export const variantHeader = style({
  display: 'flex',
  justifyContent: 'flex-end',
  alignItems: 'center',
  gap: spacing.sm,
  width: '100%',
  paddingLeft: spacing.sm,
  paddingRight: spacing.sm,
  position: 'sticky',
  top: calc.multiply(spacing['2xl'], 1),
  padding: `${spacing.sm} ${spacing.xs}`,
  height: spacing['2xl'],
  borderBottom: `1px solid ${colors.gray4}`,
  left: '0',
  backgroundColor: colors.background,
});

export const variantContainer = style({
  minHeight: `calc(100vh - 3 * ${spacing['2xl']})`,
  paddingTop: spacing.sm,
  paddingBottom: spacing.sm,
  paddingLeft: calc.add(spacing.sm, spacing.xs),
  paddingRight: calc.add(spacing.sm, spacing.xs),
});

// Variant form Notion-like styles
export const variantFormContainer = style({
  margin: '0 auto',
});

export const variantPropertyRow = style({
  display: 'flex',
  alignItems: 'center',
  minHeight: '1.75rem',
  paddingTop: spacing.xs,
  paddingBottom: spacing.xs,
  gap: spacing.md,
});

export const variantPropertyLabel = style({
  fontSize: '0.875rem',
  color: colors.gray11,
  fontWeight: 400,
  display: 'flex',
  alignItems: 'center',
  gap: spacing.sm,
});

export const variantPropertyValue = style({
  flex: 1,
  display: 'flex',
  alignItems: 'center',
});

export const variantInlineInput = style([
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
    ':hover': {
      backgroundColor: colors.gray2,
    },
    ':focus': {
      backgroundColor: colors.gray3,
    },
  },
]);

export const variantContentArea = style({
  marginTop: spacing.lg,
  padding: spacing.md,
});

export const variantTextarea = style([
  sprinkles({
    fontSize: 'sm',
    borderRadius: 'xs',
    padding: 'md',
    color: 'gray12',
  }),
  {
    border: `1px solid ${colors.gray4}`,
    backgroundColor: colors.gray1,
    outline: 'none',
    minHeight: '20rem',
    width: '100%',
    fontFamily: 'inherit',
    lineHeight: '1.5',
    resize: 'vertical',
    ':-moz-placeholder': {
      color: colors.gray9,
    },
    '::-webkit-input-placeholder': {
      color: colors.gray9,
    },
    '::placeholder': {
      color: colors.gray9,
    },
    ':focus': {
      borderColor: colors.accent9,
    },
  },
]);
