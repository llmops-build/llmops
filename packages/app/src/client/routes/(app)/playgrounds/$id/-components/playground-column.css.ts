import { style } from '@vanilla-extract/css';

export const columnContainer = style({
  display: 'flex',
  flexDirection: 'column',
  width: '400px',
  minWidth: '400px',
  backgroundColor: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: '8px',
  overflow: 'hidden',
});

export const columnHeader = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '12px 16px',
  borderBottom: '1px solid var(--color-border)',
  backgroundColor: 'var(--color-surface-secondary)',
});

export const columnHeaderLeft = style({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
});

export const nameButton = style({
  padding: '4px 8px',
  fontSize: '14px',
  fontWeight: 600,
  color: 'var(--color-text)',
  backgroundColor: 'transparent',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  ':hover': {
    backgroundColor: 'var(--color-surface-hover)',
  },
});

export const nameInput = style({
  padding: '4px 8px',
  fontSize: '14px',
  fontWeight: 600,
  color: 'var(--color-text)',
  backgroundColor: 'var(--color-surface)',
  border: '1px solid var(--color-primary)',
  borderRadius: '4px',
  outline: 'none',
});

export const deleteColumnButton = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '6px',
  color: 'var(--color-text-secondary)',
  backgroundColor: 'transparent',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  ':hover': {
    color: 'var(--color-danger)',
    backgroundColor: 'var(--color-danger-surface)',
  },
});

export const modelSelectorWrapper = style({
  padding: '12px 16px',
  borderBottom: '1px solid var(--color-border)',
});

export const modelTrigger = style({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  width: '100%',
  padding: '8px 12px',
  fontSize: '14px',
  color: 'var(--color-text)',
  backgroundColor: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: '6px',
  cursor: 'pointer',
  ':hover': {
    backgroundColor: 'var(--color-surface-hover)',
  },
});

export const placeholderText = style({
  color: 'var(--color-text-tertiary)',
});

export const providerLogo = style({
  width: '16px',
  height: '16px',
  borderRadius: '2px',
});

export const modelMenuPopup = style({
  maxHeight: '300px',
  overflowY: 'auto',
  minWidth: '280px',
  padding: '4px',
  backgroundColor: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: '8px',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
});

export const modelGroup = style({
  selectors: {
    '& + &': {
      borderTop: '1px solid var(--color-border)',
      marginTop: '4px',
      paddingTop: '4px',
    },
  },
});

export const modelGroupLabel = style({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '8px 12px',
  fontSize: '12px',
  fontWeight: 600,
  color: 'var(--color-text-secondary)',
  textTransform: 'uppercase',
});

export const modelMenuItem = style({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '8px 12px',
  fontSize: '14px',
  color: 'var(--color-text)',
  borderRadius: '4px',
  cursor: 'pointer',
  ':hover': {
    backgroundColor: 'var(--color-surface-hover)',
  },
  selectors: {
    '&[data-selected]': {
      backgroundColor: 'var(--color-primary-surface)',
    },
  },
});

export const modelMenuItemIcon = style({
  width: '16px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'var(--color-primary)',
});

export const messagesContainer = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
  padding: '16px',
  flex: 1,
  overflowY: 'auto',
});

export const messageBlock = style({
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: 'var(--color-surface-secondary)',
  border: '1px solid var(--color-border)',
  borderRadius: '6px',
  overflow: 'hidden',
});

export const messageHeader = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '8px 12px',
  borderBottom: '1px solid var(--color-border)',
});

export const roleSelector = style({
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  padding: '4px 8px',
  fontSize: '13px',
  fontWeight: 500,
  color: 'var(--color-text)',
  backgroundColor: 'transparent',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  ':hover': {
    backgroundColor: 'var(--color-surface-hover)',
  },
});

export const roleSystem = style({
  color: 'var(--color-warning)',
});

export const roleUser = style({
  color: 'var(--color-primary)',
});

export const roleAssistant = style({
  color: 'var(--color-success)',
});

export const roleMenuPopup = style({
  minWidth: '140px',
  padding: '4px',
  backgroundColor: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: '8px',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
});

export const roleMenuItem = style({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '8px 12px',
  fontSize: '14px',
  color: 'var(--color-text)',
  borderRadius: '4px',
  cursor: 'pointer',
  ':hover': {
    backgroundColor: 'var(--color-surface-hover)',
  },
  selectors: {
    '&[data-selected]': {
      backgroundColor: 'var(--color-primary-surface)',
    },
  },
});

export const roleMenuItemIcon = style({
  width: '16px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'var(--color-primary)',
});

export const deleteMessageButton = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '4px',
  color: 'var(--color-text-secondary)',
  backgroundColor: 'transparent',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  ':hover': {
    color: 'var(--color-danger)',
    backgroundColor: 'var(--color-danger-surface)',
  },
});

export const messageTextarea = style({
  padding: '12px',
  fontSize: '14px',
  lineHeight: 1.5,
  color: 'var(--color-text)',
  backgroundColor: 'var(--color-surface)',
  border: 'none',
  outline: 'none',
  resize: 'vertical',
  fontFamily: 'inherit',
  '::placeholder': {
    color: 'var(--color-text-tertiary)',
  },
});

export const addMessageButton = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '6px',
  padding: '10px',
  fontSize: '13px',
  fontWeight: 500,
  color: 'var(--color-text-secondary)',
  backgroundColor: 'transparent',
  border: '1px dashed var(--color-border)',
  borderRadius: '6px',
  cursor: 'pointer',
  transition: 'all 0.15s',
  ':hover': {
    color: 'var(--color-primary)',
    borderColor: 'var(--color-primary)',
    backgroundColor: 'var(--color-primary-surface)',
  },
});
