import { colors, spacing } from '@ui';
import { style, globalStyle } from '@vanilla-extract/css';

export const messageBlockContainer = style({
  backgroundColor: colors.gray2,
  borderRadius: spacing.sm,
  border: `1px solid ${colors.gray4}`,
  overflow: 'hidden',
});

export const messageBlockHeader = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: `${spacing.xs} ${spacing.sm}`,
  backgroundColor: colors.gray2,
  borderBottom: `1px solid transparent`,
  transition: 'border-color 150ms ease',
  selectors: {
    [`${messageBlockContainer}[data-open] &`]: {
      borderBottom: `1px solid ${colors.gray4}`,
    },
  },
});

export const messageBlockHeaderLeft = style({
  display: 'flex',
  alignItems: 'center',
  gap: spacing.xs,
});

export const messageBlockHeaderRight = style({
  display: 'flex',
  alignItems: 'center',
  gap: spacing.xs,
});

export const roleSelector = style({
  display: 'flex',
  alignItems: 'center',
  gap: spacing.xs,
  padding: `${spacing.xs} ${spacing.sm}`,
  backgroundColor: 'transparent',
  border: 'none',
  borderRadius: spacing.xs,
  cursor: 'pointer',
  color: colors.gray11,
  fontSize: '0.8125rem',
  fontWeight: 500,
  transition: 'background-color 150ms ease',
  ':hover': {
    backgroundColor: colors.gray3,
  },
});

export const roleSelectorIcon = style({
  display: 'flex',
  alignItems: 'center',
  color: colors.gray9,
});

export const expandButton = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: spacing.xs,
  backgroundColor: 'transparent',
  border: 'none',
  borderRadius: spacing.xs,
  cursor: 'pointer',
  color: colors.gray9,
  transition: 'background-color 150ms ease, color 150ms ease, transform 200ms ease',
  ':hover': {
    backgroundColor: colors.gray3,
    color: colors.gray11,
  },
  selectors: {
    '&[data-open="true"]': {
      transform: 'rotate(180deg)',
    },
  },
});

export const deleteButton = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: spacing.xs,
  backgroundColor: 'transparent',
  border: 'none',
  borderRadius: spacing.xs,
  cursor: 'pointer',
  color: colors.gray9,
  transition: 'background-color 150ms ease, color 150ms ease',
  ':hover': {
    backgroundColor: colors.error3,
    color: colors.error11,
  },
});

export const messageBlockPanel = style({
  overflow: 'hidden',
});

export const messageBlockContent = style({
  padding: spacing.none,
});

export const editorWrapper = style({
  position: 'relative',
});

// Override editor styles for message block
globalStyle(`${editorWrapper} > div`, {
  borderRadius: '0',
  border: 'none',
  backgroundColor: 'transparent',
});

// Make the editor content editable have smaller min-height
globalStyle(`${editorWrapper} [contenteditable]`, {
  minHeight: '6rem',
});

// Role menu styles
export const roleMenuPopup = style({
  backgroundColor: colors.gray1,
  border: `1px solid ${colors.gray4}`,
  borderRadius: spacing.sm,
  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12)',
  padding: spacing.xs,
  minWidth: '120px',
  zIndex: 100,
});

export const roleMenuItem = style({
  display: 'flex',
  alignItems: 'center',
  gap: spacing.sm,
  padding: `${spacing.xs} ${spacing.sm}`,
  borderRadius: spacing.xs,
  cursor: 'pointer',
  fontSize: '0.8125rem',
  color: colors.gray11,
  transition: 'background-color 150ms ease',
  ':hover': {
    backgroundColor: colors.gray3,
  },
  selectors: {
    '&[data-selected="true"]': {
      backgroundColor: colors.accent3,
      color: colors.accent11,
    },
  },
});

export const roleMenuItemIcon = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '16px',
});

// Role-specific colors
export const roleSystem = style({
  color: colors.accent11,
});

export const roleUser = style({
  color: '#22c55e', // green
});

export const roleAssistant = style({
  color: '#a855f7', // purple
});
