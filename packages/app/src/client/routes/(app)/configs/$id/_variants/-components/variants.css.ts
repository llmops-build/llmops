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

export const environmentHighlight = style({
  padding: spacing.md,
  backgroundColor: colors.accent2,
  borderRadius: spacing.xs,
  fontSize: '0.875rem',
  color: colors.gray10,
  marginBottom: spacing.md,
});

export const environmentNameHighlight = style({
  padding: spacing.xs,
  backgroundColor: colors.accent4,
  color: colors.gray12,
  borderRadius: spacing.xs,
  fontWeight: 500,
  marginLeft: spacing.xs,
  marginRight: spacing.xs,
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

export const variantPropertyColumn = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'stretch',
  paddingTop: spacing.xs,
  paddingBottom: spacing.xs,
  gap: spacing.md,
  marginTop: spacing.md,
});

export const variantPropertyLabel = style({
  fontSize: '0.875rem',
  color: colors.gray9,
  fontWeight: 400,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: spacing.sm,
});

export const markdownLabelInfo = style({
  display: 'flex',
  alignItems: 'center',
  gap: spacing.sm,
  color: colors.gray8,
  fontSize: '0.75rem',
  lineHeight: '0.875rem',
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
