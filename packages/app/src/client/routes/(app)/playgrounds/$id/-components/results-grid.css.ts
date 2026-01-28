import { style, keyframes } from '@vanilla-extract/css';

export const gridContainer = style({
  display: 'flex',
  flexDirection: 'column',
  borderTop: '1px solid var(--color-border)',
  backgroundColor: 'var(--color-surface)',
  flex: 1,
  minHeight: 0,
});

export const gridHeader = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '12px 16px',
  borderBottom: '1px solid var(--color-border)',
  backgroundColor: 'var(--color-surface-secondary)',
});

export const gridTitle = style({
  fontSize: '14px',
  fontWeight: 600,
  color: 'var(--color-text)',
  margin: 0,
});

export const progressInfo = style({
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  fontSize: '13px',
  color: 'var(--color-text-secondary)',
});

const spin = keyframes({
  from: { transform: 'rotate(0deg)' },
  to: { transform: 'rotate(360deg)' },
});

export const spinnerIcon = style({
  animation: `${spin} 1s linear infinite`,
});

export const gridWrapper = style({
  flex: 1,
  overflow: 'auto',
});

export const table = style({
  width: '100%',
  borderCollapse: 'collapse',
  tableLayout: 'fixed',
});

export const headerCell = style({
  padding: '12px 16px',
  fontSize: '13px',
  fontWeight: 600,
  color: 'var(--color-text-secondary)',
  textAlign: 'left',
  backgroundColor: 'var(--color-surface)',
  borderBottom: '1px solid var(--color-border)',
  position: 'sticky',
  top: 0,
  minWidth: '200px',
});

export const inputCell = style({
  padding: '12px 16px',
  borderBottom: '1px solid var(--color-border)',
  verticalAlign: 'top',
  width: '200px',
  maxWidth: '200px',
  backgroundColor: 'var(--color-surface-secondary)',
});

export const inputPreview = style({
  fontSize: '12px',
  fontFamily: 'var(--font-mono)',
  color: 'var(--color-text-secondary)',
  margin: 0,
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
  maxHeight: '100px',
  overflow: 'auto',
});

export const manualInput = style({
  fontSize: '12px',
  color: 'var(--color-text-tertiary)',
  fontStyle: 'italic',
});

export const outputCell = style({
  padding: '12px 16px',
  borderBottom: '1px solid var(--color-border)',
  borderLeft: '1px solid var(--color-border)',
  verticalAlign: 'top',
  minWidth: '250px',
});

export const cellPending = style({
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  fontSize: '13px',
  color: 'var(--color-text-tertiary)',
});

export const cellContent = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
});

export const cellHeader = style({
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  fontSize: '12px',
});

export const statusRunning = style({
  color: 'var(--color-primary)',
});

export const statusCompleted = style({
  color: 'var(--color-success)',
});

export const statusFailed = style({
  color: 'var(--color-danger)',
});

export const latency = style({
  color: 'var(--color-text-tertiary)',
  fontSize: '11px',
});

export const cellOutput = style({
  fontSize: '14px',
  lineHeight: 1.5,
  color: 'var(--color-text)',
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
  maxHeight: '200px',
  overflow: 'auto',
});

export const streamingPlaceholder = style({
  color: 'var(--color-text-tertiary)',
});

export const cellError = style({
  fontSize: '13px',
  color: 'var(--color-danger)',
  fontFamily: 'var(--font-mono)',
});
