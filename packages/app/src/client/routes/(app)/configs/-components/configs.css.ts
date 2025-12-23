import { colors, spacing, sprinkles } from '@llmops/ui';
import { style } from '@vanilla-extract/css';

// Re-export shared tab styles for backward compatibility
export {
  tabsContainer as configTabsContainer,
  tab as configTab,
} from '@client/styles/tabs.css';

export const headerStyles = style({
  padding: `${spacing.sm} ${spacing.xs}`,
  height: spacing['2xl'],
  display: 'flex',
  alignItems: 'center',
  gap: spacing.sm,
  borderBottom: `1px solid ${colors.gray4}`,
  position: 'sticky',
  left: '0',
  top: '0',
  backgroundColor: colors.background,
});

export const configSlugStyles = style({
  display: 'flex',
  alignItems: 'center',
  gap: spacing.xs,
  marginLeft: 'auto',
  paddingRight: spacing.sm,
});

export const configSlugText = style({
  fontFamily: 'monospace',
  fontSize: '0.75rem',
  color: colors.gray11,
  backgroundColor: colors.gray3,
  padding: `${spacing.xs} ${spacing.sm}`,
  borderRadius: spacing.xs,
});

export const copyButton = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: spacing.xs,
  border: 'none',
  backgroundColor: 'transparent',
  color: colors.gray9,
  cursor: 'pointer',
  borderRadius: spacing.xs,
  ':hover': {
    backgroundColor: colors.gray4,
    color: colors.gray12,
  },
});

export const configsContainer = style([
  sprinkles({
    paddingLeft: 'xs',
    paddingRight: 'xs',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 'sm',
  }),
  {
    margin: '0',
    position: 'relative',
  },
]);

export const configTitleInput = style([
  sprinkles({
    fontSize: 'sm',
    borderRadius: 'xs',
    paddingLeft: 'sm',
    paddingRight: 'sm',
    backgroundColor: 'gray1',
    color: 'gray11',
  }),
  {
    height: spacing['xl'],
    border: `1px solid ${colors.gray4}`,
    outline: 'none',
    ':-moz-placeholder': {
      color: colors.gray7,
    },
    '::-webkit-input-placeholder': {
      color: colors.gray7,
    },
    '::placeholder': {
      color: colors.gray7,
    },
    ':focus': {
      borderColor: colors.accent9,
    },
  },
]);

export const updateNameStatus = style({
  color: colors.gray9,
  fontSize: '0.875rem',
});
