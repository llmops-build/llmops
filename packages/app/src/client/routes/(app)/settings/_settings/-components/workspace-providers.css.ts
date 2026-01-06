import { colors, spacing } from '@ui';
import { style, globalStyle } from '@vanilla-extract/css';

export const providersContainer = style({
  maxWidth: '700px',
});

export const providersHeader = style({
  marginBottom: spacing.lg,
});

export const providersTitle = style({
  fontSize: '0.875rem',
  fontWeight: 600,
  color: colors.gray12,
  margin: 0,
  marginBottom: spacing.xs,
});

export const providersDescription = style({
  fontSize: '0.75rem',
  color: colors.gray9,
  margin: 0,
  lineHeight: 1.5,
});

export const providersTableContainer = style({
  border: `1px solid ${colors.gray4}`,
  borderRadius: spacing.sm,
  overflow: 'hidden',
  marginBottom: spacing.md,
});

export const providersTableHeader = style({
  display: 'grid',
  gridTemplateColumns: '1fr auto',
  gap: spacing.md,
  padding: `${spacing.sm} ${spacing.md}`,
  backgroundColor: colors.gray2,
  borderBottom: `1px solid ${colors.gray4}`,
  fontSize: '0.75rem',
  fontWeight: 500,
  color: colors.gray10,
});

export const providerRow = style({
  display: 'grid',
  gridTemplateColumns: '1fr auto',
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

export const providerInfo = style({
  display: 'flex',
  alignItems: 'center',
  gap: spacing.sm,
});

export const providerLogo = style({
  width: '20px',
  height: '20px',
  borderRadius: '4px',
  objectFit: 'contain',
});

export const providerName = style({
  fontSize: '0.875rem',
  fontWeight: 500,
  color: colors.gray12,
});

export const providerActions = style({
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

// Dialog styles
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

// Global style to ensure combobox dropdown appears above dialog
globalStyle('[data-base-ui-combobox-positioner]', {
  zIndex: '1100 !important',
});

export const dialogTitle = style({
  fontSize: '1.125rem',
  fontWeight: 600,
  color: colors.gray12,
  margin: 0,
  marginBottom: spacing.md,
});

export const dialogForm = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing.md,
});

export const dialogField = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing.xs,
});

export const dialogFieldLabel = style({
  fontSize: '0.75rem',
  fontWeight: 500,
  color: colors.gray11,
});

export const dialogInput = style({
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

export const dialogTextarea = style({
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

export const fieldDescription = style({
  fontSize: '0.6875rem',
  color: colors.gray9,
  marginTop: '2px',
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

export const saveButton = style({
  padding: `${spacing.sm} ${spacing.md}`,
  fontSize: '0.875rem',
  fontWeight: 500,
  color: 'white',
  backgroundColor: colors.accent9,
  border: 'none',
  borderRadius: spacing.xs,
  cursor: 'pointer',
  transition: 'all 150ms',
  ':hover': {
    backgroundColor: colors.accent10,
  },
  ':disabled': {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
});

export const deleteButton = style({
  padding: `${spacing.sm} ${spacing.md}`,
  fontSize: '0.875rem',
  fontWeight: 500,
  color: colors.error11,
  backgroundColor: 'transparent',
  border: 'none',
  borderRadius: spacing.xs,
  cursor: 'pointer',
  transition: 'all 150ms',
  ':hover': {
    backgroundColor: colors.error3,
  },
});

// Page-based form styles
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
  maxWidth: '500px',
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

export const providerDisplay = style({
  display: 'flex',
  alignItems: 'center',
  gap: spacing.sm,
  padding: spacing.sm,
  fontSize: '0.875rem',
  color: colors.gray12,
  backgroundColor: colors.gray2,
  border: `1px solid ${colors.gray4}`,
  borderRadius: spacing.xs,
});

export const formActions = style({
  marginTop: spacing.sm,
});
