import { style, keyframes } from '@vanilla-extract/css';

export const editorContainer = style({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  overflow: 'hidden',
});

export const toolbar = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '12px 16px',
  borderBottom: '1px solid var(--color-border)',
  backgroundColor: 'var(--color-surface)',
});

export const toolbarRight = style({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
});

export const runButton = style({
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  padding: '8px 16px',
  fontSize: '14px',
  fontWeight: 500,
  color: '#fff',
  backgroundColor: 'var(--color-primary)',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  transition: 'background-color 0.15s',
  ':hover': {
    backgroundColor: 'var(--color-primary-hover)',
  },
  ':disabled': {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
});

const spin = keyframes({
  from: { transform: 'rotate(0deg)' },
  to: { transform: 'rotate(360deg)' },
});

export const spinnerIcon = style({
  animation: `${spin} 1s linear infinite`,
});

export const columnsContainer = style({
  display: 'flex',
  gap: '16px',
  padding: '16px',
  overflowX: 'auto',
  flex: '0 0 auto',
  minHeight: '400px',
});

export const addColumnButton = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  minWidth: '200px',
  padding: '24px',
  backgroundColor: 'var(--color-surface)',
  border: '2px dashed var(--color-border)',
  borderRadius: '8px',
  cursor: 'pointer',
  color: 'var(--color-text-secondary)',
  fontSize: '14px',
  fontWeight: 500,
  transition: 'all 0.15s',
  ':hover': {
    backgroundColor: 'var(--color-surface-hover)',
    borderColor: 'var(--color-primary)',
    color: 'var(--color-primary)',
  },
});
