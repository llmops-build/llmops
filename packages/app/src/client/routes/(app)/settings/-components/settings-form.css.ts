import { colors, spacing, sprinkles } from '@ui';
import { style } from '@vanilla-extract/css';

export const settingsContainer = style({
  maxWidth: '600px',
});

export const settingsForm = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing.xl,
});

export const settingsSection = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing.md,
});

export const settingsSectionTitle = style({
  fontSize: '0.875rem',
  fontWeight: 600,
  color: colors.gray12,
  margin: 0,
});

export const settingsSectionDescription = style({
  fontSize: '0.75rem',
  color: colors.gray9,
  margin: 0,
});

export const settingsFieldLabel = style({
  display: 'block',
  fontSize: '0.75rem',
  color: colors.gray9,
  marginBottom: spacing.sm,
});

export const settingsInput = style([
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
    width: '100%',
    maxWidth: '200px',
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
