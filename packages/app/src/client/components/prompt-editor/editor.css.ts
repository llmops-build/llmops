import { colors, spacing } from '@ui';
import { style, globalStyle } from '@vanilla-extract/css';

export const editorContainer = style({
  position: 'relative',
  borderRadius: spacing.xs,
  backgroundColor: colors.gray2,
  overflow: 'hidden',
});

export const editorInput = style({
  minHeight: '20rem',
  outline: 'none',
  fontSize: '0.875rem',
  lineHeight: '1.6',
  color: colors.gray12,
  fontFamily: 'Geist Mono, monospace, sans-serif',
  caretColor: colors.accent9,
  padding: spacing.md,
  selectors: {
    '&:focus': {
      outline: 'none',
    },
  },
});

export const editorPlaceholder = style({
  position: 'absolute',
  top: spacing.md,
  left: spacing.md,
  color: colors.gray9,
  fontSize: '0.875rem',
  pointerEvents: 'none',
  userSelect: 'none',
  lineHeight: '1.6',
});

// GitHub-style markdown theming
globalStyle(`${editorInput} p`, {
  margin: '0',
});

globalStyle(`${editorInput} p:last-child`, {
  marginBottom: 0,
});

globalStyle(`${editorInput} h1`, {
  fontSize: '1.75rem',
  fontWeight: 600,
  lineHeight: 1.25,
  margin: '0',
  paddingBottom: '0',
});

globalStyle(`${editorInput} h2`, {
  fontSize: '1.5em',
  fontWeight: 600,
  lineHeight: 1.25,
  margin: '0',
});

globalStyle(`${editorInput} h3`, {
  fontSize: '1.25em',
  fontWeight: 600,
  lineHeight: 1.25,
});

globalStyle(`${editorInput} h4`, {
  fontSize: '1em',
  fontWeight: 600,
  lineHeight: 1.25,
});

globalStyle(`${editorInput} h5`, {
  fontSize: '0.875em',
  fontWeight: 600,
  lineHeight: 1.25,
});

globalStyle(`${editorInput} h6`, {
  fontSize: '0.85em',
  fontWeight: 600,
  lineHeight: 1.25,
  color: colors.gray9,
});

globalStyle(`${editorInput} strong`, {
  fontWeight: 600,
});

globalStyle(`${editorInput} em`, {
  fontStyle: 'italic',
});

globalStyle(`${editorInput} code`, {
  padding: '0.2em 0.4em',
  margin: 0,
  fontSize: '85%',
  whiteSpace: 'break-spaces',
  backgroundColor: colors.gray3,
  borderRadius: '6px',
  fontFamily:
    'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
});

globalStyle(`${editorInput} pre`, {
  padding: '1em',
  margin: '0',
  overflow: 'auto',
  fontSize: '85%',
  lineHeight: 1.45,
  color: colors.gray12,
  backgroundColor: colors.gray2,
  borderRadius: '6px',
  fontFamily:
    'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
});

globalStyle(`${editorInput} pre code`, {
  padding: 0,
  margin: 0,
  fontSize: '100%',
  backgroundColor: 'transparent',
  borderRadius: 0,
});

globalStyle(`${editorInput} blockquote`, {
  padding: '0 1em',
  margin: '0',
  color: colors.gray9,
  borderLeft: `0.25em solid ${colors.gray4}`,
});

globalStyle(`${editorInput} ul`, {
  paddingLeft: '2em',
  margin: '0',
  listStyleType: 'disc',
});

globalStyle(`${editorInput} ol`, {
  paddingLeft: '2em',
  margin: '0',
  listStyleType: 'decimal',
});

globalStyle(`${editorInput} li`, {
  marginBottom: '0',
});

globalStyle(`${editorInput} li:last-child`, {
  marginBottom: 0,
});

globalStyle(`${editorInput} hr`, {
  height: '0.25em',
  padding: 0,
  margin: '1.5em 0',
  backgroundColor: colors.gray4,
  border: 0,
  borderRadius: '2px',
});

globalStyle(`${editorInput} a`, {
  color: colors.accent9,
  textDecoration: 'none',
});

globalStyle(`${editorInput} a:hover`, {
  textDecoration: 'underline',
});

globalStyle(`${editorInput} s`, {
  textDecoration: 'line-through',
});

// Template variable (Nunjucks/Jinja2) theming
export const templateVariable = style({
  padding: '1px 4px',
  borderRadius: '3px',
  fontFamily: 'Geist Mono, monospace',
  fontSize: '0.9em',
});

export const templateVariableToken = style({
  backgroundColor: 'rgba(59, 130, 246, 0.15)',
  color: '#3b82f6', // blue-500
});

export const templateVariableBlock = style({
  backgroundColor: 'rgba(168, 85, 247, 0.15)',
  color: '#a855f7', // purple-500
});

export const templateVariableComment = style({
  backgroundColor: 'rgba(107, 114, 128, 0.15)',
  color: '#6b7280', // gray-500
});
