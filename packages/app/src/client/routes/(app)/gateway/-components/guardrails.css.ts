import { colors, spacing } from '@ui';
import { style } from '@vanilla-extract/css';

export const guardrailsContainer = style({
  maxWidth: '800px',
});

export const guardrailsHeader = style({
  marginBottom: spacing.lg,
});

export const guardrailsTitle = style({
  fontSize: '0.875rem',
  fontWeight: 600,
  color: colors.gray12,
  margin: 0,
  marginBottom: spacing.xs,
});

export const guardrailsDescription = style({
  fontSize: '0.75rem',
  color: colors.gray9,
  margin: 0,
  lineHeight: 1.5,
});

export const filterBar = style({
  display: 'flex',
  alignItems: 'center',
  gap: spacing.sm,
  marginBottom: spacing.md,
});

export const filterButton = style({
  padding: `${spacing.xs} ${spacing.sm}`,
  fontSize: '0.75rem',
  fontWeight: 500,
  color: colors.gray10,
  backgroundColor: colors.gray1,
  border: `1px solid ${colors.gray5}`,
  borderRadius: spacing.xs,
  cursor: 'pointer',
  transition: 'all 150ms',
  ':hover': {
    backgroundColor: colors.gray3,
    borderColor: colors.gray6,
  },
  selectors: {
    '&[data-active="true"]': {
      backgroundColor: colors.accent3,
      borderColor: colors.accent7,
      color: colors.accent11,
    },
  },
});

export const guardrailsTableContainer = style({
  border: `1px solid ${colors.gray4}`,
  borderRadius: spacing.xs,
  overflow: 'hidden',
  marginBottom: spacing.md,
});

export const guardrailsTableHeader = style({
  display: 'grid',
  gridTemplateColumns: '1fr 120px 80px 80px auto',
  gap: spacing.md,
  padding: `${spacing.sm} ${spacing.md}`,
  backgroundColor: colors.gray2,
  borderBottom: `1px solid ${colors.gray4}`,
  fontSize: '0.75rem',
  fontWeight: 500,
  color: colors.gray10,
});

export const guardrailRow = style({
  display: 'grid',
  gridTemplateColumns: '1fr 120px 80px 80px auto',
  gap: spacing.md,
  padding: `${spacing.sm} ${spacing.md}`,
  alignItems: 'center',
  borderBottom: `1px solid ${colors.gray4}`,
  selectors: {
    '&:last-child': {
      borderBottom: 'none',
    },
  },
});

export const guardrailInfo = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
});

export const guardrailName = style({
  fontSize: '0.875rem',
  fontWeight: 500,
  color: colors.gray12,
});

export const guardrailFunction = style({
  fontSize: '0.6875rem',
  color: colors.gray9,
  fontFamily: 'monospace',
});

export const hookTypeBadge = style({
  display: 'inline-flex',
  alignItems: 'center',
  padding: `2px ${spacing.xs}`,
  fontSize: '0.6875rem',
  fontWeight: 500,
  borderRadius: '4px',
  textTransform: 'uppercase',
  letterSpacing: '0.02em',
});

export const hookTypeBefore = style({
  backgroundColor: colors.accent3,
  color: colors.accent11,
});

export const hookTypeAfter = style({
  backgroundColor: colors.gray4,
  color: colors.gray11,
});

export const statusToggle = style({
  display: 'flex',
  alignItems: 'center',
});

export const toggleSwitch = style({
  position: 'relative',
  width: '36px',
  height: '20px',
  backgroundColor: colors.gray6,
  borderRadius: '10px',
  cursor: 'pointer',
  transition: 'background-color 150ms',
  selectors: {
    '&[data-checked="true"]': {
      backgroundColor: colors.accent9,
    },
  },
});

export const toggleKnob = style({
  position: 'absolute',
  top: '2px',
  left: '2px',
  width: '16px',
  height: '16px',
  backgroundColor: colors.gray12,
  borderRadius: '50%',
  transition: 'transform 150ms',
  selectors: {
    '[data-checked="true"] &': {
      transform: 'translateX(16px)',
    },
  },
});

export const guardrailActions = style({
  display: 'flex',
  alignItems: 'center',
  gap: spacing.xs,
});

export const addButton = style({
  padding: `${spacing.sm} ${spacing.md}`,
  fontSize: '0.875rem',
  fontWeight: 500,
  color: colors.gray11,
  backgroundColor: colors.gray1,
  border: `1px solid ${colors.gray6}`,
  borderRadius: spacing.xs,
  cursor: 'pointer',
  transition: 'all 150ms',
  ':hover': {
    backgroundColor: colors.gray3,
    borderColor: colors.gray7,
  },
});

export const emptyState = style({
  padding: spacing.xl,
  textAlign: 'center',
  color: colors.gray9,
  fontSize: '0.875rem',
});

// Form styles
export const backButton = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: spacing.xs,
  padding: 0,
  fontSize: '0.875rem',
  fontWeight: 400,
  color: colors.gray11,
  backgroundColor: 'transparent',
  border: 'none',
  cursor: 'pointer',
  marginBottom: spacing.lg,
  ':hover': {
    color: colors.gray12,
  },
});

export const formContainer = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing.md,
  maxWidth: '600px',
});

export const formSection = style({
  borderTop: `1px solid ${colors.gray4}`,
  paddingTop: spacing.md,
  marginTop: spacing.sm,
});

export const formSectionTitle = style({
  fontSize: '0.75rem',
  fontWeight: 600,
  color: colors.gray10,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  marginBottom: spacing.md,
});

export const formField = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing.xs,
});

export const formFieldLabel = style({
  fontSize: '0.75rem',
  fontWeight: 500,
  color: colors.gray11,
});

export const formFieldDescription = style({
  fontSize: '0.6875rem',
  color: colors.gray9,
  marginTop: '2px',
});

export const formInput = style({
  padding: spacing.sm,
  fontSize: '0.875rem',
  color: colors.gray12,
  backgroundColor: colors.gray1,
  border: `1px solid ${colors.gray6}`,
  borderRadius: spacing.xs,
  outline: 'none',
  ':focus': {
    borderColor: colors.accent9,
  },
  '::placeholder': {
    color: colors.gray8,
  },
});

export const formTextarea = style({
  padding: spacing.sm,
  fontSize: '0.875rem',
  color: colors.gray12,
  backgroundColor: colors.gray1,
  border: `1px solid ${colors.gray6}`,
  borderRadius: spacing.xs,
  outline: 'none',
  resize: 'vertical',
  minHeight: '80px',
  fontFamily: 'monospace',
  ':focus': {
    borderColor: colors.accent9,
  },
  '::placeholder': {
    color: colors.gray8,
  },
});

export const formSelect = style({
  padding: spacing.sm,
  fontSize: '0.875rem',
  color: colors.gray12,
  backgroundColor: colors.gray1,
  border: `1px solid ${colors.gray6}`,
  borderRadius: spacing.xs,
  outline: 'none',
  cursor: 'pointer',
  ':focus': {
    borderColor: colors.accent9,
  },
});

export const formCheckbox = style({
  display: 'flex',
  alignItems: 'center',
  gap: spacing.sm,
});

export const checkboxInput = style({
  width: '16px',
  height: '16px',
  cursor: 'pointer',
});

export const checkboxLabel = style({
  fontSize: '0.875rem',
  color: colors.gray12,
  cursor: 'pointer',
});

export const hookTypeSelector = style({
  display: 'flex',
  gap: spacing.sm,
});

export const hookTypeOption = style({
  display: 'flex',
  alignItems: 'center',
  gap: spacing.xs,
  padding: `${spacing.sm} ${spacing.md}`,
  fontSize: '0.875rem',
  color: colors.gray11,
  backgroundColor: colors.gray1,
  border: `1px solid ${colors.gray5}`,
  borderRadius: spacing.xs,
  cursor: 'pointer',
  transition: 'all 150ms',
  ':hover': {
    backgroundColor: colors.gray3,
    borderColor: colors.gray6,
  },
  selectors: {
    '&[data-selected="true"]': {
      backgroundColor: colors.accent3,
      borderColor: colors.accent7,
      color: colors.accent11,
    },
    '&[data-disabled="true"]': {
      opacity: 0.5,
      cursor: 'not-allowed',
    },
  },
});

export const formRow = style({
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: spacing.md,
});

export const formActions = style({
  marginTop: spacing.sm,
});

// Alert Dialog styles (same as providers)
export const backdrop = style({
  position: 'fixed',
  inset: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  zIndex: 1000,
  transition: 'opacity 150ms',
  selectors: {
    '&[data-starting-style], &[data-ending-style]': {
      opacity: 0,
    },
  },
});

export const popup = style({
  position: 'fixed',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  backgroundColor: colors.background,
  borderRadius: spacing.sm,
  padding: spacing.lg,
  boxShadow: `0 25px 50px -12px rgba(0, 0, 0, 0.25)`,
  zIndex: 1001,
  minWidth: '450px',
  maxWidth: '90vw',
  maxHeight: '85vh',
  overflow: 'auto',
  outline: `1px solid ${colors.gray6}`,
  transition: 'opacity 150ms, transform 150ms',
  selectors: {
    '&[data-starting-style], &[data-ending-style]': {
      opacity: 0,
      transform: 'translate(-50%, -50%) scale(0.95)',
    },
  },
});

export const dialogTitle = style({
  fontSize: '1.125rem',
  fontWeight: 600,
  color: colors.gray12,
  margin: 0,
  marginBottom: spacing.md,
});

export const dialogActions = style({
  display: 'flex',
  justifyContent: 'flex-end',
  gap: spacing.sm,
  marginTop: spacing.md,
});

export const cancelButton = style({
  padding: `${spacing.sm} ${spacing.md}`,
  fontSize: '0.875rem',
  fontWeight: 500,
  color: colors.gray11,
  backgroundColor: colors.gray3,
  border: 'none',
  borderRadius: spacing.xs,
  cursor: 'pointer',
  transition: 'all 150ms',
  ':hover': {
    backgroundColor: colors.gray4,
  },
});

// Provider overrides section
export const overridesSection = style({
  borderTop: `1px solid ${colors.gray4}`,
  paddingTop: spacing.md,
  marginTop: spacing.lg,
});

export const overridesSectionTitle = style({
  fontSize: '0.875rem',
  fontWeight: 600,
  color: colors.gray12,
  marginBottom: spacing.xs,
});

export const overridesSectionDescription = style({
  fontSize: '0.75rem',
  color: colors.gray9,
  marginBottom: spacing.md,
});

export const overridesTable = style({
  border: `1px solid ${colors.gray4}`,
  borderRadius: spacing.xs,
  overflow: 'hidden',
  marginBottom: spacing.md,
});

export const overridesTableHeader = style({
  display: 'grid',
  gridTemplateColumns: '1fr 100px 120px auto',
  gap: spacing.md,
  padding: `${spacing.sm} ${spacing.md}`,
  backgroundColor: colors.gray2,
  borderBottom: `1px solid ${colors.gray4}`,
  fontSize: '0.75rem',
  fontWeight: 500,
  color: colors.gray10,
});

export const overrideRow = style({
  display: 'grid',
  gridTemplateColumns: '1fr 100px 120px auto',
  gap: spacing.md,
  padding: `${spacing.sm} ${spacing.md}`,
  alignItems: 'center',
  borderBottom: `1px solid ${colors.gray4}`,
  selectors: {
    '&:last-child': {
      borderBottom: 'none',
    },
  },
});

export const overrideProviderInfo = style({
  display: 'flex',
  alignItems: 'center',
  gap: spacing.sm,
});

export const overrideProviderLogo = style({
  width: '20px',
  height: '20px',
  borderRadius: '4px',
  objectFit: 'contain',
  selectors: {
    '.dark &': {
      filter: 'brightness(0) invert(1)',
    },
  },
});

export const overrideProviderName = style({
  fontSize: '0.875rem',
  fontWeight: 500,
  color: colors.gray12,
});

export const overrideParameters = style({
  fontSize: '0.75rem',
  color: colors.gray9,
});

export const emptyOverrides = style({
  padding: spacing.md,
  textAlign: 'center',
  color: colors.gray9,
  fontSize: '0.75rem',
});

// Tag input for arrays
export const tagInput = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: spacing.xs,
  padding: spacing.sm,
  backgroundColor: colors.gray1,
  border: `1px solid ${colors.gray6}`,
  borderRadius: spacing.xs,
  minHeight: '40px',
});

export const tag = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '4px',
  padding: `2px ${spacing.xs}`,
  fontSize: '0.75rem',
  color: colors.gray12,
  backgroundColor: colors.gray4,
  borderRadius: '4px',
});

export const tagRemove = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '14px',
  height: '14px',
  padding: 0,
  fontSize: '10px',
  color: colors.gray9,
  backgroundColor: 'transparent',
  border: 'none',
  borderRadius: '50%',
  cursor: 'pointer',
  ':hover': {
    backgroundColor: colors.gray6,
    color: colors.gray12,
  },
});

export const tagInputField = style({
  flex: 1,
  minWidth: '100px',
  padding: 0,
  fontSize: '0.875rem',
  color: colors.gray12,
  backgroundColor: 'transparent',
  border: 'none',
  outline: 'none',
  '::placeholder': {
    color: colors.gray8,
  },
});

// Multi-select checkboxes
export const multiSelect = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing.xs,
  padding: spacing.sm,
  backgroundColor: colors.gray1,
  border: `1px solid ${colors.gray6}`,
  borderRadius: spacing.xs,
  maxHeight: '200px',
  overflowY: 'auto',
});

export const multiSelectOption = style({
  display: 'flex',
  alignItems: 'center',
  gap: spacing.sm,
  padding: `${spacing.xs} 0`,
});

export const guardrailDisplay = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
  padding: spacing.sm,
  backgroundColor: colors.gray2,
  border: `1px solid ${colors.gray4}`,
  borderRadius: spacing.xs,
});

export const guardrailDisplayName = style({
  fontSize: '0.875rem',
  fontWeight: 500,
  color: colors.gray12,
});

export const guardrailDisplayDescription = style({
  fontSize: '0.75rem',
  color: colors.gray9,
});
