import { colors, spacing, sprinkles } from '@ui';
import { style, keyframes } from '@vanilla-extract/css';

// Keyframes for dropdown animation
const fadeIn = keyframes({
  from: { opacity: 0, transform: 'translateY(-4px)' },
  to: { opacity: 1, transform: 'translateY(0)' },
});

// Container styles
export const usageContainer = style({
  maxWidth: '800px',
});

export const usageHeader = style({
  marginBottom: spacing.lg,
});

export const usageTitle = style({
  fontSize: '0.875rem',
  fontWeight: 600,
  color: colors.gray12,
  margin: 0,
  marginBottom: spacing.xs,
});

export const usageDescription = style({
  fontSize: '0.75rem',
  color: colors.gray9,
  margin: 0,
  lineHeight: 1.5,
});

// Code block styles
export const codeBlock = style([
  sprinkles({
    fontFamily: 'mono',
  }),
  {
    position: 'relative',
    fontSize: '0.875rem',
    lineHeight: 1.7,
    color: colors.gray11,
    width: '100%',
    maxWidth: '675px',
    margin: `0 auto`,
    scrollbarWidth: 'none',
    selectors: {
      '&::-webkit-scrollbar': {
        display: 'none',
      },
    },
  },
]);

export const codeElement = style({
  display: 'block',
});

export const codeLine = style({
  display: 'block',
  whiteSpace: 'pre',
  height: '2.2rem',
  lineHeight: '2.2rem',
  borderTop: `1px dashed ${colors.gray4}`,
});

export const codeLineIndent = style({
  display: 'block',
  whiteSpace: 'pre',
  paddingLeft: spacing.md,
  height: '2.2rem',
  lineHeight: '2.2rem',
  borderTop: `1px dashed ${colors.gray4}`,
  selectors: {
    '&:last-child': {
      borderBottom: `1px dashed ${colors.gray4}`,
    },
  },
});

export const codeKeyword = style({
  color: colors.gray9,
});

export const codeString = style({
  color: colors.gray12, // Green for strings
});

export const codeComment = style({
  color: colors.gray8,
  fontStyle: 'italic',
});

// Copy button
export const copyButton = style({
  position: 'absolute',
  top: spacing.sm,
  right: spacing.sm,
  padding: spacing.xs,
  backgroundColor: colors.gray3,
  border: `1px solid ${colors.gray5}`,
  borderRadius: spacing.xs,
  cursor: 'pointer',
  color: colors.gray11,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 150ms',
  ':hover': {
    backgroundColor: colors.gray4,
    borderColor: colors.gray6,
  },
});

export const copyButtonSuccess = style({
  color: '#7ee787',
});

// Inline select styles
export const inlineSelectWrapper = style({
  display: 'inline-block',
  position: 'relative',
});

export const inlineSelectTrigger = style([
  sprinkles({
    fontFamily: 'mono',
  }),
  {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '2px',
    padding: '1px 4px',
    backgroundColor: colors.accent3,
    border: `1px solid ${colors.accent6}`,
    borderRadius: '3px',
    cursor: 'pointer',
    fontSize: 'inherit',
    color: colors.accent11,
    transition: 'all 150ms',
    ':hover': {
      backgroundColor: colors.accent4,
      borderColor: colors.accent7,
    },
  },
]);

export const inlineSelectTriggerPlaceholder = style({
  color: colors.gray9,
  fontStyle: 'italic',
});

export const inlineSelectIcon = style({
  marginLeft: '2px',
  opacity: 0.7,
  display: 'inline-flex',
});

export const inlineSelectPositioner = style({
  zIndex: 1000,
});

export const inlineSelectDropdown = style({
  minWidth: '200px',
  maxHeight: '300px',
  overflowY: 'auto',
  backgroundColor: colors.gray1,
  border: `1px solid ${colors.gray4}`,
  borderRadius: spacing.xs,
  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
  animation: `${fadeIn} 150ms ease-out`,
  outline: 'none',
});

export const inlineSelectOption = style([
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
    width: '100%',
    textAlign: 'left',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    transition: 'background-color 150ms',
    ':hover': {
      backgroundColor: colors.gray2,
    },
    ':focus': {
      backgroundColor: colors.gray2,
      outline: 'none',
    },
    selectors: {
      '&[data-highlighted]': {
        backgroundColor: colors.gray2,
      },
    },
  },
]);

export const inlineSelectOptionSelected = style({
  backgroundColor: colors.accent3,
  color: colors.accent11,
  ':hover': {
    backgroundColor: colors.accent4,
  },
});

export const inlineSelectItemIndicator = style({
  position: 'absolute',
  left: spacing.sm,
  color: colors.accent9,
});

export const inlineSelectOptionIcon = style({
  width: spacing.md,
  height: spacing.md,
  flexShrink: 0,
  selectors: {
    '.dark &': {
      filter: 'invert(1)',
    },
  },
});

export const inlineSelectOptionLabel = style({
  flex: 1,
});

export const inlineSelectOptionSecondary = style([
  sprinkles({
    fontFamily: 'mono',
  }),
  {
    fontSize: '0.75rem',
    color: colors.gray8,
    letterSpacing: '0.02em',
  },
]);

export const inlineSelectEmptyState = style({
  padding: `${spacing.md}`,
  textAlign: 'center',
  color: colors.gray9,
  fontSize: '0.8125rem',
});

// Section styles for organizing the usage page
export const section = style({
  marginBottom: spacing.xl,
});

export const sectionTitle = style({
  fontSize: '0.8125rem',
  fontWeight: 500,
  color: colors.gray11,
  marginBottom: spacing.xl,
});

// Info box styles
export const infoBox = style({
  padding: spacing.md,
  backgroundColor: colors.accent2,
  border: `1px solid ${colors.accent5}`,
  borderRadius: spacing.xs,
  marginBottom: spacing.md,
});

export const infoBoxText = style({
  fontSize: '0.8125rem',
  color: colors.accent11,
  margin: 0,
  lineHeight: 1.5,
});

// Loading state
export const loading = style({
  color: colors.gray9,
  fontSize: '0.875rem',
  padding: spacing.md,
});
