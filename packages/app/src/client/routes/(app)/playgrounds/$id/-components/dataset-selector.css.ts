import { style } from '@vanilla-extract/css';

export const selectorWrapper = style({
  display: 'flex',
  alignItems: 'center',
});

export const trigger = style({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
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

export const menuPopup = style({
  minWidth: '240px',
  maxHeight: '300px',
  overflowY: 'auto',
  padding: '4px',
  backgroundColor: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: '8px',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
});

export const menuItem = style({
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

export const menuItemIcon = style({
  width: '16px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'var(--color-primary)',
});

export const datasetInfo = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
});

export const datasetName = style({
  fontSize: '14px',
  fontWeight: 500,
});

export const datasetMeta = style({
  fontSize: '12px',
  color: 'var(--color-text-secondary)',
});

export const clearText = style({
  color: 'var(--color-text-secondary)',
});

export const divider = style({
  height: '1px',
  backgroundColor: 'var(--color-border)',
  margin: '4px 0',
});

export const emptyState = style({
  padding: '16px',
  fontSize: '13px',
  color: 'var(--color-text-secondary)',
  textAlign: 'center',
});
