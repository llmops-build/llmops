import { colors, spacing } from '@llmops/ui';
import { style } from '@vanilla-extract/css';

export const savePopupContent = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing.md,
  padding: spacing.md,
  minWidth: '320px',
});

export const savePopupTitle = style({
  fontSize: '0.875rem',
  fontWeight: 600,
  color: colors.gray12,
  marginBottom: spacing.xs,
});

export const saveOptionGroup = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing.sm,
});

export const saveOption = style({
  display: 'flex',
  alignItems: 'center',
  gap: spacing.sm,
  padding: spacing.sm,
  borderRadius: spacing.xs,
  cursor: 'pointer',
  backgroundColor: 'transparent',
  border: `1px solid ${colors.gray4}`,
  transition: 'all 0.15s ease',
  ':hover': {
    backgroundColor: colors.gray2,
  },
});

export const saveOptionSelected = style({
  backgroundColor: colors.accent2,
  borderColor: colors.accent7,
});

export const saveOptionRadio = style({
  width: '16px',
  height: '16px',
  borderRadius: '50%',
  border: `2px solid ${colors.gray6}`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
});

export const saveOptionRadioSelected = style({
  borderColor: colors.accent9,
});

export const saveOptionRadioDot = style({
  width: '8px',
  height: '8px',
  borderRadius: '50%',
  backgroundColor: colors.accent9,
});

export const saveOptionContent = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
});

export const saveOptionTitle = style({
  fontSize: '0.875rem',
  fontWeight: 500,
  color: colors.gray12,
});

export const saveOptionDescription = style({
  fontSize: '0.75rem',
  color: colors.gray9,
});

export const deploySection = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing.sm,
  paddingTop: spacing.sm,
  borderTop: `1px solid ${colors.gray4}`,
});

export const deployCheckboxRow = style({
  display: 'flex',
  alignItems: 'center',
  gap: spacing.sm,
});

export const deployCheckbox = style({
  width: '16px',
  height: '16px',
  borderRadius: '4px',
  border: `2px solid ${colors.gray6}`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  backgroundColor: 'transparent',
  transition: 'all 0.15s ease',
  ':hover': {
    borderColor: colors.accent8,
  },
});

export const deployCheckboxChecked = style({
  backgroundColor: colors.accent9,
  borderColor: colors.accent9,
});

export const deployCheckboxIcon = style({
  color: 'white',
  width: '12px',
  height: '12px',
});

export const deployLabel = style({
  fontSize: '0.875rem',
  color: colors.gray12,
  cursor: 'pointer',
});

export const environmentSelect = style({
  marginTop: spacing.xs,
});

export const saveActions = style({
  display: 'flex',
  justifyContent: 'flex-end',
  gap: spacing.sm,
  paddingTop: spacing.sm,
  borderTop: `1px solid ${colors.gray4}`,
});
