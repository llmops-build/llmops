import { colors, spacing } from '@ui';
import { style, globalStyle, createVar } from '@vanilla-extract/css';

// CodeMirror theme CSS variables
const cmBg = createVar();
const cmFg = createVar();
const cmCaret = createVar();
const cmSelection = createVar();
const cmSelectionMatch = createVar();
const cmLineHighlight = createVar();
const cmGutterBg = createVar();
const cmGutterFg = createVar();
const cmTag = createVar();
const cmComment = createVar();
const cmProperty = createVar();
const cmVariable = createVar();
const cmKeyword = createVar();
const cmString = createVar();
const cmName = createVar();
const cmAtom = createVar();
const cmInvalid = createVar();

export const editorContainer = style({
  position: 'relative',
  overflow: 'hidden',
  vars: {
    // Light mode defaults
    [cmBg]: '#fff',
    [cmFg]: '#24292e',
    [cmCaret]: '#24292e',
    [cmSelection]: '#bbdfff',
    [cmSelectionMatch]: '#bbdfff',
    [cmLineHighlight]: '#f6f8fa',
    [cmGutterBg]: '#fff',
    [cmGutterFg]: '#6e7781',
    [cmTag]: '#116329',
    [cmComment]: '#6a737d',
    [cmProperty]: '#6f42c1',
    [cmVariable]: '#005cc5',
    [cmKeyword]: '#d73a49',
    [cmString]: '#032f62',
    [cmName]: '#22863a',
    [cmAtom]: '#e36209',
    [cmInvalid]: '#cb2431',
  },
  selectors: {
    // Dark mode overrides
    '.dark &': {
      vars: {
        [cmBg]: '#0d1117',
        [cmFg]: '#c9d1d9',
        [cmCaret]: '#c9d1d9',
        [cmSelection]: '#003d73',
        [cmSelectionMatch]: '#003d73',
        [cmLineHighlight]: '#36334280',
        [cmGutterBg]: '#0d1117',
        [cmGutterFg]: '#6e7681',
        [cmTag]: '#7ee787',
        [cmComment]: '#8b949e',
        [cmProperty]: '#d2a8ff',
        [cmVariable]: '#79c0ff',
        [cmKeyword]: '#ff7b72',
        [cmString]: '#a5d6ff',
        [cmName]: '#7ee787',
        [cmAtom]: '#ffab70',
        [cmInvalid]: '#f97583',
      },
    },
  },
});

// Base editor styling
globalStyle(`${editorContainer} .cm-editor`, {
  padding: spacing.sm,
  borderRadius: spacing.sm,
  border: `1px solid ${colors.gray6}`,
  backgroundColor: cmBg,
  fontSize: '13px',
  fontFamily: 'Geist Mono, ui-monospace, monospace',
  boxShadow: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
});

globalStyle(`${editorContainer} .cm-editor.cm-focused`, {
  outline: 'none',
  border: `1px dashed ${colors.accent7}`,
});

// Hide scrollbars
globalStyle(`${editorContainer} .cm-scroller`, {
  fontFamily: 'Geist Mono, ui-monospace, monospace',
  lineHeight: '1.6',
  overflow: 'auto',
});

globalStyle(`${editorContainer} .cm-scroller::-webkit-scrollbar`, {
  display: 'none',
});

// Content and lines
globalStyle(`${editorContainer} .cm-content`, {
  caretColor: cmCaret,
  color: cmFg,
});

globalStyle(`${editorContainer} .cm-line`, {
  padding: '0',
});

// Hide gutters
globalStyle(`${editorContainer} .cm-gutters`, {
  display: 'none',
});

// Active line
globalStyle(`${editorContainer} .cm-activeLine`, {
  backgroundColor: cmLineHighlight,
});

// Selection
globalStyle(`${editorContainer} .cm-selectionBackground`, {
  backgroundColor: `${cmSelection} !important`,
});

globalStyle(`${editorContainer} .cm-cursor`, {
  borderLeftColor: cmCaret,
});

// Placeholder styling
globalStyle(`${editorContainer} .cm-placeholder`, {
  color: colors.gray9,
  fontStyle: 'normal',
});

// Tooltip
globalStyle(`${editorContainer} .cm-tooltip`, {
  backgroundColor: cmBg,
  border: `1px solid ${colors.gray6}`,
  borderRadius: spacing.xs,
});

// JSON Syntax highlighting
globalStyle(`${editorContainer} .ͼb`, {
  // property names (keys)
  color: cmProperty,
});

globalStyle(`${editorContainer} .ͼc`, {
  // strings
  color: cmString,
});

globalStyle(`${editorContainer} .ͼd`, {
  // numbers
  color: cmVariable,
});

globalStyle(`${editorContainer} .ͼe`, {
  // keywords (true, false, null)
  color: cmKeyword,
});

globalStyle(`${editorContainer} .ͼi`, {
  // invalid
  color: cmInvalid,
});

// Standard CodeMirror token classes
globalStyle(`${editorContainer} .tok-propertyName`, {
  color: cmProperty,
});

globalStyle(`${editorContainer} .tok-string`, {
  color: cmString,
});

globalStyle(`${editorContainer} .tok-number`, {
  color: cmVariable,
});

globalStyle(`${editorContainer} .tok-bool`, {
  color: cmKeyword,
});

globalStyle(`${editorContainer} .tok-null`, {
  color: cmAtom,
});

globalStyle(`${editorContainer} .tok-keyword`, {
  color: cmKeyword,
});

globalStyle(`${editorContainer} .tok-comment`, {
  color: cmComment,
});

globalStyle(`${editorContainer} .tok-variableName`, {
  color: cmName,
});

globalStyle(`${editorContainer} .tok-invalid`, {
  color: cmInvalid,
});
