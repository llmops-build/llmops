import { colors, spacing, sprinkles } from '@ui';
import { style } from '@vanilla-extract/css';
import { calc } from '@vanilla-extract/css-utils';

export const userMenuTrigger = style({
  display: 'flex',
  alignItems: 'center',
  gap: spacing.sm,
  padding: spacing.xs,
  border: 'none',
  background: 'transparent',
  cursor: 'pointer',
  borderRadius: spacing.xs,
  color: colors.gray12,
  fontSize: '0.875rem',
  width: '100%',
  textAlign: 'left',
  ':hover': {
    backgroundColor: colors.gray3,
  },
});

export const userAvatar = style({
  width: 20,
  height: 20,
  borderRadius: '50%',
  backgroundColor: colors.accent9,
  color: colors.gray1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '0.75rem',
  fontWeight: 600,
  flexShrink: 0,
  lineHeight: '1.25rem',
});

export const userEmail = style({
  flex: 1,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

export const userMenuChevron = style({
  width: 12,
  height: 12,
  color: colors.gray9,
  flexShrink: 0,
});

export const menuPositioner = style({
  outline: 0,
  zIndex: 200,
});

export const menuPopup = style({
  boxSizing: 'border-box',
  paddingBottom: spacing.xs,
  paddingTop: spacing.xs,
  borderRadius: spacing.xs,
  backgroundColor: colors.gray1,
  color: colors.gray12,
  transformOrigin: 'var(--transform-origin)',
  transition: 'transform 150ms, opacity 150ms',
  outline: `1px solid ${colors.gray6}`,
  boxShadow: `0 10px 15px -3px ${colors.gray6}, 0 4px 6px -4px ${colors.gray6}`,
  minWidth: calc.subtract('var(--sidebar-width)', spacing.md),
  selectors: {
    '&[data-starting-style], &[data-ending-style]': {
      opacity: 0,
      transform: 'scale(0.95)',
    },
  },
});

export const menuSection = style({
  padding: spacing.sm,
});

export const menuSectionLabel = style([
  sprinkles({
    fontFamily: 'mono',
  }),
  {
    fontSize: '0.75rem',
    fontWeight: 500,
    letterSpacing: '0.05em',
    color: colors.gray9,
    marginBottom: spacing.sm,
  },
]);

export const themeSwitcher = style({
  display: 'flex',
  gap: spacing.xs,
  padding: spacing.xs,
  backgroundColor: colors.gray3,
  borderRadius: spacing.xs,
});

export const themeButton = style({
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: `${spacing.xs} ${spacing.sm}`,
  border: 'none',
  background: 'transparent',
  cursor: 'pointer',
  borderRadius: spacing.xs,
  color: colors.gray11,
  transition: 'background-color 150ms, color 150ms',
  ':hover': {
    backgroundColor: colors.gray4,
  },
});

export const themeButtonActive = style({
  backgroundColor: colors.gray1,
  color: colors.gray12,
  boxShadow: `0 1px 2px ${colors.gray6}`,
});

export const themeButtonIcon = style({
  width: 16,
  height: 16,
});

export const menuSeparator = style({
  margin: `${spacing.xs} 0`,
  height: 1,
  backgroundColor: colors.gray4,
});

export const menuItem = style({
  outline: 0,
  cursor: 'pointer',
  userSelect: 'none',
  paddingBlock: spacing.sm,
  paddingLeft: spacing.md,
  paddingRight: spacing.lg,
  display: 'flex',
  alignItems: 'center',
  gap: spacing.sm,
  fontSize: '0.875rem',
  lineHeight: '1rem',
  color: colors.gray9,
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

export const menuItemIcon = style({
  width: 16,
  height: 16,
  flexShrink: 0,
});

export const comingSoonTooltip = style({
  display: 'flex',
  gap: spacing.xs,
  height: spacing.md,
  lineHeight: spacing.md,
});

export const sidebarSectionTitle = style([
  sprinkles({
    fontSize: 'xs',
    fontFamily: 'mono',
    color: 'gray9',
    paddingLeft: 'xs',
    paddingRight: 'xs',
  }),
  {
    fontWeight: 500,
    letterSpacing: '0.05em',
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    transition: 'opacity 0.2s ease-in-out',
  },
]);

export const sidebarSectionTitleHidden = style({
  opacity: 0,
});

export const userMenuTriggerCollapsed = style({
  ':hover': {
    backgroundColor: 'transparent',
  },
});
