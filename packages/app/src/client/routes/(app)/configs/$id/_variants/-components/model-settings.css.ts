import { colors, spacing } from '@llmops/ui';
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
