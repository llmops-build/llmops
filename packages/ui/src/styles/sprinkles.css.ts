import { defineProperties, createSprinkles } from '@vanilla-extract/sprinkles';
import { colors } from '../tokens/colors.css';
import { spacing } from '../tokens/spacing.css';

const responsiveProperties = defineProperties({
  conditions: {
    mobile: {},
    tablet: { '@media': 'screen and (min-width: 768px)' },
    desktop: { '@media': 'screen and (min-width: 1024px)' },
  },
  defaultCondition: 'mobile',
  properties: {
    padding: spacing,
    paddingTop: spacing,
    paddingBottom: spacing,
    paddingLeft: spacing,
    paddingRight: spacing,
    margin: spacing,
    marginTop: spacing,
    marginBottom: spacing,
    marginLeft: spacing,
    marginRight: spacing,
    backgroundColor: colors,
    color: colors,
    borderColor: colors,
    display: ['none', 'flex', 'block', 'inline', 'inline-block', 'grid'],
    flexDirection: ['row', 'column', 'row-reverse', 'column-reverse'],
    justifyContent: [
      'stretch',
      'flex-start',
      'center',
      'flex-end',
      'space-around',
      'space-between',
    ],
    alignItems: ['stretch', 'flex-start', 'center', 'flex-end'],
    gap: spacing,
    borderRadius: spacing,
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
    textAlign: ['left', 'center', 'right'],
    position: ['static', 'relative', 'absolute', 'fixed', 'sticky'],
    top: spacing,
    bottom: spacing,
    left: spacing,
    right: spacing,
    zIndex: {
      '0': '0',
      '10': '10',
      '20': '20',
      '30': '30',
      '40': '40',
      '50': '50',
    },
  },
  shorthands: {
    p: ['padding'],
    px: ['paddingLeft', 'paddingRight'],
    py: ['paddingTop', 'paddingBottom'],
    m: ['margin'],
    mx: ['marginLeft', 'marginRight'],
    my: ['marginTop', 'marginBottom'],
  },
});

const unresponsiveProperties = defineProperties({
  properties: {
    cursor: ['default', 'pointer', 'not-allowed'],
    userSelect: ['none', 'text', 'all'],
    pointerEvents: ['none', 'auto'],
    outline: ['none'],
    borderWidth: {
      '0': '0px',
      '1': '1px',
      '2': '2px',
    },
    borderStyle: ['none', 'solid', 'dashed', 'dotted'],
    boxSizing: ['border-box', 'content-box'],
    width: ['auto', '100%', '50%', '25%'],
    height: ['auto', '100%', '50%', '25%'],
    minWidth: ['0', '100%'],
    minHeight: ['0', '100%'],
    maxWidth: ['none', '100%'],
    maxHeight: ['none', '100%'],
    overflow: ['visible', 'hidden', 'scroll', 'auto'],
    whiteSpace: ['normal', 'nowrap', 'pre', 'pre-wrap'],
    textOverflow: ['clip', 'ellipsis'],
  },
});

export const sprinkles = createSprinkles(
  responsiveProperties,
  unresponsiveProperties
);
export type Sprinkles = Parameters<typeof sprinkles>[0];
