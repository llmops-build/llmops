import { colors, spacing, sprinkles } from '@ui';
import { style } from '@vanilla-extract/css';
import { calc } from '@vanilla-extract/css-utils';
import { recipe } from '@vanilla-extract/recipes';

export const overviewContainer = style({
  padding: spacing.md,
  overflow: 'auto',
});

export const sectionContainer = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing.md,
  width: '100%',
});

export const recentSectionContainer = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing.md,
  width: '100%',
  marginTop: spacing.lg,
});

export const recentSectionTableContainer = style({
  marginLeft: calc.negate(spacing.md),
  marginRight: calc.negate(spacing.md),
  width: calc.add('100%', calc.multiply(2, spacing.md)),
  borderTopWidth: 1,
  borderTopStyle: 'solid',
  borderTopColor: colors.gray3,
});

export const gettingStartedCards = style([
  sprinkles({
    display: 'flex',
    flexDirection: 'row',
    gap: 'md',
  }),
  {},
]);

export const gettingStartedCard = recipe({
  base: {
    height: '7rem',
    aspectRatio: '16 / 9',
    borderRadius: spacing.sm,
    display: 'flex',
    flexDirection: 'column',
    padding: spacing.md,
    gap: spacing.md,
    textDecoration: 'none',
    color: colors.gray12,
    justifyContent: 'space-between',
  },
  variants: {
    variant: {
      primary: {
        backgroundColor: colors.accent7,
      },
    },
  },
});

export const cardTitle = style([
  sprinkles({
    fontFamily: 'sans',
  }),
  {
    textDecoration: 'none',
    color: colors.gray12,
    fontWeight: 500,
  },
]);

export const sectionTitle = style([
  sprinkles({
    fontFamily: 'mono',
  }),
  {
    fontSize: '1.25rem',
    fontWeight: 500,
    margin: 0,
    color: colors.gray12,
  },
]);

export const baseUrlBox = style({
  display: 'flex',
  alignItems: 'center',
  gap: spacing.xs,
  marginRight: spacing.sm,
});

export const baseUrlLabel = style([
  sprinkles({
    fontSize: 'xs',
    color: 'gray9',
    fontFamily: 'mono',
  }),
]);

export const baseUrlText = style({
  fontFamily: 'monospace',
  fontSize: '0.75rem',
  color: colors.gray11,
  backgroundColor: colors.gray3,
  padding: `${spacing.xs} ${spacing.sm}`,
  borderRadius: spacing.xs,
});

export const baseUrlCopyButton = style({
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

// Onboarding Flow Styles
export const onboardingContainer = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: spacing.lg,
  paddingTop: spacing.md,
  paddingBottom: spacing.xl,
  width: '100%',
  maxWidth: '500px',
  margin: '0 auto',
  boxSizing: 'border-box',
});

export const onboardingHeader = style({
  textAlign: 'center',
  marginBottom: spacing.lg,
  width: '100%',
});

export const onboardingTitle = style([
  sprinkles({
    fontFamily: 'sans',
  }),
  {
    fontSize: '1.25rem',
    fontWeight: 600,
    color: colors.gray12,
    margin: 0,
    marginBottom: spacing.xs,
  },
]);

export const onboardingSubtitle = style({
  fontSize: '0.875rem',
  color: colors.gray9,
  margin: 0,
  lineHeight: 1.5,
});

export const onboardingSteps = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: spacing.xs,
  marginBottom: spacing.lg,
  flexWrap: 'wrap',
});

export const onboardingStep = recipe({
  base: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '1.75rem',
    height: '1.75rem',
    borderRadius: '50%',
    fontSize: '0.75rem',
    fontWeight: 500,
    lineHeight: '1.75rem',
    transition: 'all 150ms',
    flexShrink: 0,
  },
  variants: {
    status: {
      completed: {
        backgroundColor: colors.accent9,
        color: 'white',
      },
      active: {
        backgroundColor: colors.accent9,
        color: 'white',
        boxShadow: `0 0 0 3px ${colors.accent4}`,
      },
      pending: {
        backgroundColor: colors.gray4,
        color: colors.gray9,
      },
    },
  },
});

export const onboardingStepConnector = style({
  width: '2rem',
  height: '2px',
  backgroundColor: colors.gray4,
  flexShrink: 0,
});

export const onboardingCard = style({
  width: '100%',
  backgroundColor: colors.gray2,
  border: `1px solid ${colors.gray4}`,
  borderRadius: spacing.xs,
  padding: spacing.md,
  boxSizing: 'border-box',
  display: 'flex',
  flexDirection: 'column',
  gap: spacing.md,
});

export const onboardingCardTitle = style([
  sprinkles({
    fontFamily: 'sans',
  }),
  {
    fontSize: '1rem',
    fontWeight: 500,
    color: colors.gray12,
    margin: 0,
    marginBottom: spacing.xs,
  },
]);

export const onboardingForm = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing.md,
  width: '100%',
});

export const onboardingField = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing.xs,
});

export const onboardingFieldLabel = style({
  fontSize: '0.75rem',
  fontWeight: 500,
  color: colors.gray11,
});

export const onboardingInput = style({
  padding: spacing.sm,
  fontSize: '0.875rem',
  color: colors.gray12,
  backgroundColor: colors.gray1,
  border: `1px solid ${colors.gray6}`,
  borderRadius: spacing.xs,
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
  ':focus': {
    borderColor: colors.accent9,
  },
  '::placeholder': {
    color: colors.gray8,
  },
});

export const onboardingTextarea = style({
  padding: spacing.sm,
  fontSize: '0.875rem',
  color: colors.gray12,
  backgroundColor: colors.gray1,
  border: `1px solid ${colors.gray6}`,
  borderRadius: spacing.xs,
  outline: 'none',
  resize: 'vertical',
  minHeight: '80px',
  fontFamily: 'monospace',
  width: '100%',
  boxSizing: 'border-box',
  ':focus': {
    borderColor: colors.accent9,
  },
  '::placeholder': {
    color: colors.gray8,
  },
});

export const onboardingSelect = style({
  padding: spacing.sm,
  fontSize: '0.875rem',
  color: colors.gray12,
  backgroundColor: colors.gray1,
  border: `1px solid ${colors.gray6}`,
  borderRadius: spacing.xs,
  outline: 'none',
  cursor: 'pointer',
  width: '100%',
  boxSizing: 'border-box',
  ':focus': {
    borderColor: colors.accent9,
  },
});

export const onboardingFieldDescription = style({
  fontSize: '0.6875rem',
  color: colors.gray9,
  marginTop: '2px',
});

export const onboardingActions = style({
  display: 'flex',
  justifyContent: 'flex-end',
  gap: spacing.sm,
  marginTop: spacing.md,
  flexWrap: 'wrap',
});

export const onboardingButton = recipe({
  base: {
    padding: `${spacing.sm} ${spacing.md}`,
    fontSize: '0.875rem',
    fontWeight: 500,
    borderRadius: spacing.xs,
    cursor: 'pointer',
    transition: 'all 150ms',
    border: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    gap: spacing.xs,
  },
  variants: {
    variant: {
      primary: {
        color: 'white',
        backgroundColor: colors.accent9,
        ':hover': {
          backgroundColor: colors.accent10,
        },
        ':disabled': {
          opacity: 0.6,
          cursor: 'not-allowed',
        },
      },
      secondary: {
        color: colors.gray11,
        backgroundColor: colors.gray3,
        ':hover': {
          backgroundColor: colors.gray4,
        },
      },
    },
  },
});

export const successIcon = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '3rem',
  height: '3rem',
  borderRadius: '50%',
  backgroundColor: colors.accent3,
  color: colors.accent11,
  marginBottom: spacing.sm,
  flexShrink: 0,
});

export const completeContent = style({
  textAlign: 'center',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
});
