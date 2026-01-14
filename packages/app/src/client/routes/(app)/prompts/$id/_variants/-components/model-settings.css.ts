import { colors, spacing } from '@ui';
import { style } from '@vanilla-extract/css';

export const modelSettingsTrigger = style({
  display: 'flex',
  alignItems: 'center',
  gap: spacing.sm,
  padding: `${spacing.xs} ${spacing.sm}`,
  border: 'none',
  background: 'transparent',
  cursor: 'pointer',
  borderRadius: spacing.xs,
  color: colors.gray12,
  fontSize: '0.875rem',
  minWidth: '8rem',
  textAlign: 'left',
  ':hover': {
    backgroundColor: colors.gray2,
  },
});

export const modelSettingsTriggerIcon = style({
  width: 16,
  height: 16,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 10,
  fontWeight: 600,
  backgroundColor: colors.gray3,
  borderRadius: 4,
  flexShrink: 0,
});

export const modelSettingsTriggerText = style({
  flex: 1,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

export const modelSettingsPlaceholder = style({
  color: colors.gray9,
});

export const modelSettingsPopupContent = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing.md,
  padding: spacing.md,
  minWidth: '280px',
});

export const modelSettingsSection = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing.sm,
});

export const modelSettingsSectionTitle = style({
  fontSize: '0.75rem',
  fontWeight: 500,
  color: colors.gray9,
});

export const modelSettingsSliderGroup = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing.md,
});

export const modelSettingsField = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing.xs,
});

export const modelSettingsFieldLabel = style({
  fontSize: '0.75rem',
  color: colors.gray11,
});

export const modelSettingsInput = style({
  width: '100%',
  padding: `${spacing.xs} ${spacing.sm}`,
  border: `1px solid ${colors.gray4}`,
  borderRadius: spacing.xs,
  fontSize: '0.875rem',
  backgroundColor: colors.background,
  color: colors.gray12,
  outline: 'none',
  ':focus': {
    borderColor: colors.gray8,
  },
  '::placeholder': {
    color: colors.gray9,
  },
});

export const modelSettingsHeader = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: `${spacing.sm} ${spacing.md}`,
  borderBottom: `1px solid ${colors.gray4}`,
});

export const modelSettingsTitle = style({
  fontSize: '0.875rem',
  fontWeight: 600,
  color: colors.gray12,
  margin: 0,
});

export const chevronIcon = style({
  width: 12,
  height: 12,
  color: colors.gray9,
  transition: 'transform 150ms',
  flexShrink: 0,
});

export const modelMenuTrigger = style({
  display: 'flex',
  alignItems: 'center',
  gap: spacing.sm,
  padding: `${spacing.sm} ${spacing.md}`,
  border: `1px solid ${colors.gray4}`,
  background: colors.gray1,
  cursor: 'pointer',
  borderRadius: spacing.xs,
  color: colors.gray12,
  fontSize: '0.875rem',
  width: '100%',
  textAlign: 'left',
  ':hover': {
    backgroundColor: colors.gray2,
    borderColor: colors.gray6,
  },
});

// Nested menu model selector styles
export const menuPositioner = style({
  outline: 0,
  zIndex: 200,
});

export const menuPopup = style({
  boxSizing: 'border-box',
  paddingBlock: spacing.xs,
  borderRadius: spacing.xs,
  backgroundColor: colors.gray1,
  color: colors.gray12,
  transformOrigin: 'var(--transform-origin)',
  transition: 'transform 150ms, opacity 150ms',
  outline: `1px solid ${colors.gray6}`,
  boxShadow: `0 10px 15px -3px ${colors.gray6}, 0 4px 6px -4px ${colors.gray6}`,
  minWidth: '180px',
  maxHeight: '400px',
  overflowY: 'auto',
  selectors: {
    '&[data-starting-style], &[data-ending-style]': {
      opacity: 0,
      transform: 'scale(0.95)',
    },
  },
});

export const menuItem = style({
  outline: 0,
  cursor: 'default',
  userSelect: 'none',
  paddingBlock: spacing.sm,
  paddingLeft: spacing.md,
  paddingRight: spacing.lg,
  display: 'flex',
  alignItems: 'center',
  gap: spacing.sm,
  fontSize: '0.875rem',
  lineHeight: '1rem',
  color: colors.gray11,
  selectors: {
    '&[data-highlighted]': {
      zIndex: 0,
      position: 'relative',
      color: colors.gray12,
    },
    '&[data-highlighted]::before': {
      content: '',
      zIndex: -1,
      position: 'absolute',
      insetBlock: 0,
      insetInline: spacing.xs,
      borderRadius: spacing.xs,
      backgroundColor: colors.gray3,
    },
  },
});

export const menuSubmenuTrigger = style({
  outline: 0,
  cursor: 'default',
  userSelect: 'none',
  paddingBlock: spacing.sm,
  paddingLeft: spacing.md,
  paddingRight: spacing.md,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: spacing.md,
  fontSize: '0.875rem',
  lineHeight: '1rem',
  color: colors.gray11,
  selectors: {
    '&[data-popup-open]': {
      zIndex: 0,
      position: 'relative',
    },
    '&[data-popup-open]::before': {
      content: '',
      zIndex: -1,
      position: 'absolute',
      insetBlock: 0,
      insetInline: spacing.xs,
      borderRadius: spacing.xs,
      backgroundColor: colors.gray3,
    },
    '&[data-highlighted]': {
      zIndex: 0,
      position: 'relative',
      color: colors.gray12,
    },
    '&[data-highlighted]::before': {
      content: '',
      zIndex: -1,
      position: 'absolute',
      insetBlock: 0,
      insetInline: spacing.xs,
      borderRadius: spacing.xs,
      backgroundColor: colors.gray3,
    },
  },
});

export const menuItemIcon = style({
  width: 16,
  height: 16,
  borderRadius: 4,
  flexShrink: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
});

export const menuItemText = style({
  flex: 1,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

export const menuChevron = style({
  width: 12,
  height: 12,
  color: colors.gray8,
  flexShrink: 0,
});

export const menuGroupLabel = style({
  cursor: 'default',
  userSelect: 'none',
  paddingBlock: spacing.xs,
  paddingLeft: spacing.md,
  paddingRight: spacing.lg,
  fontSize: '0.6875rem',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: colors.gray9,
});

export const menuSeparator = style({
  margin: `${spacing.xs} ${spacing.md}`,
  height: 1,
  backgroundColor: colors.gray4,
});

export const menuEmpty = style({
  padding: spacing.md,
  fontSize: '0.875rem',
  color: colors.gray9,
  textAlign: 'center',
});

export const menuLoading = style({
  padding: spacing.md,
  fontSize: '0.875rem',
  color: colors.gray9,
  textAlign: 'center',
});

export const menuCheckIcon = style({
  width: 14,
  height: 14,
  flexShrink: 0,
  color: colors.accent11,
});

export const providerIcon = style({
  width: 16,
  height: 16,
  flexShrink: 0,
  selectors: {
    '.dark &': {
      filter: 'invert(1)',
    },
  },
});
