import CodeMirror from '@uiw/react-codemirror';
import { json } from '@codemirror/lang-json';
import { EditorView } from '@codemirror/view';
import { useMemo } from 'react';
import { editorContainer } from './json-editor.css';

export type JsonEditorProps = {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  minHeight?: string;
};

export function JsonEditor({
  placeholder = '{"key": "value"}',
  value = '',
  onChange,
  minHeight = '10rem',
}: JsonEditorProps) {
  const extensions = useMemo(
    () => [
      json(),
      EditorView.lineWrapping,
      EditorView.theme({
        '&': {
          minHeight,
        },
        '.cm-scroller': {
          minHeight,
        },
      }),
    ],
    [minHeight],
  );

  return (
    <div className={editorContainer}>
      <CodeMirror
        value={value}
        onChange={onChange}
        extensions={extensions}
        placeholder={placeholder}
        theme="none"
        basicSetup={{
          lineNumbers: false,
          foldGutter: false,
          highlightActiveLine: true,
          highlightSelectionMatches: true,
          autocompletion: true,
          bracketMatching: true,
          closeBrackets: true,
          indentOnInput: true,
          syntaxHighlighting: true,
        }}
      />
    </div>
  );
}

export default JsonEditor;
