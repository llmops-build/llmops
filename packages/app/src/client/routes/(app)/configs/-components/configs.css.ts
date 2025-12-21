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
  borderBottom: `1px solid ${colors.gray4}`,
  position: 'sticky',
  left: '0',
  top: '0',
  backgroundColor: colors.background,
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
