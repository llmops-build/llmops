import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { TRANSFORMERS, LINK } from '@lexical/markdown';
import type { TextMatchTransformer } from '@lexical/markdown';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListNode, ListItemNode } from '@lexical/list';
import { CodeNode, CodeHighlightNode } from '@lexical/code';
import { LinkNode, AutoLinkNode } from '@lexical/link';
import { HorizontalRuleNode } from '@lexical/react/LexicalHorizontalRuleNode';
import {
  editorContainer,
  editorInput,
  editorPlaceholder,
  templateVariable,
  templateVariableToken,
  templateVariableBlock,
  templateVariableComment,
} from './editor.css';
import {
  AutoLinkPlugin,
  createLinkMatcherWithRegExp,
} from '@lexical/react/LexicalAutoLinkPlugin';
import { CheckListPlugin } from '@lexical/react/LexicalCheckListPlugin';
import { ClickableLinkPlugin } from '@lexical/react/LexicalClickableLinkPlugin';

import { HorizontalRulePlugin } from '@lexical/react/LexicalHorizontalRulePlugin';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { TabIndentationPlugin } from '@lexical/react/LexicalTabIndentationPlugin';

import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import {
  $convertFromMarkdownString,
  $convertToMarkdownString,
} from '@lexical/markdown';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect, useCallback } from 'react';
import type { EditorState } from 'lexical';
import type { JSX } from 'react/jsx-runtime';

import { TemplateVariableNode } from './template-variable-node';
import { TemplateVariablePlugin } from './template-variable-plugin';

export type MarkdownEditorProps = {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
};

const urlRegExp = new RegExp(
  /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[-;:&=+$,\w]+@)?[A-Za-z0-9.-]+|(?:www.|[-;:&=+$,\w]+@)[A-Za-z0-9.-]+)((?:\/[+~%/.\w-_]*)?\??(?:[-+=&;%@.\w_]*)#?(?:[\w]*))?)/
);
export function validateUrl(url: string): boolean {
  return url === 'https://' || urlRegExp.test(url);
}

function LexicalLinkPlugin({
  hasLinkAttributes = false,
}: {
  hasLinkAttributes?: boolean;
}): JSX.Element {
  return (
    <LinkPlugin
      validateUrl={validateUrl}
      attributes={
        hasLinkAttributes
          ? {
              rel: 'noopener noreferrer',
              target: '_blank',
            }
          : undefined
      }
    />
  );
}

const URL_REGEX =
  /((https?:\/\/(www\.)?)|(www\.))[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)(?<![-.+():%])/;

const EMAIL_REGEX =
  /(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))/;

const matchers = [
  createLinkMatcherWithRegExp(URL_REGEX, (text) => {
    return text.startsWith('http') ? text : `https://${text}`;
  }),
  createLinkMatcherWithRegExp(EMAIL_REGEX, (text) => {
    return `mailto:${text}`;
  }),
];

function LexicalAutoLinkPlugin(): JSX.Element {
  return <AutoLinkPlugin matchers={matchers} />;
}

// Custom LINK transformer that triggers immediately (not just at end of line)
const IMMEDIATE_LINK: TextMatchTransformer = {
  ...LINK,
  // Remove the $ anchor so it triggers anywhere, not just at end of line
  regExp: /(?:\[(.+?)\])(?:\((?:([^()\s]+)(?:\s"((?:[^"]*\\")*[^"]*)"\s*)?)\))/,
};

// Replace the default LINK transformer with our immediate version
const MARKDOWN_TRANSFORMERS = TRANSFORMERS.map((t) =>
  t === LINK ? IMMEDIATE_LINK : t
);

const theme = {
  paragraph: 'editor-paragraph',
  heading: {
    h1: 'editor-heading-h1',
    h2: 'editor-heading-h2',
    h3: 'editor-heading-h3',
    h4: 'editor-heading-h4',
    h5: 'editor-heading-h5',
    h6: 'editor-heading-h6',
  },
  text: {
    bold: 'editor-text-bold',
    italic: 'editor-text-italic',
    underline: 'editor-text-underline',
    strikethrough: 'editor-text-strikethrough',
    code: 'editor-text-code',
  },
  list: {
    ul: 'editor-list-ul',
    ol: 'editor-list-ol',
    listitem: 'editor-listitem',
    nested: {
      listitem: 'editor-nested-listitem',
    },
  },
  quote: 'editor-quote',
  code: 'editor-code',
  codeHighlight: {},
  link: 'editor-link',
  horizontalRule: 'editor-hr',
  // Nunjucks/Jinja2 template variable theming
  templateVariable: templateVariable,
  templateVariableVariable: templateVariableToken,
  templateVariableBlock: templateVariableBlock,
  templateVariableComment: templateVariableComment,
};

const nodes = [
  HeadingNode,
  QuoteNode,
  ListNode,
  ListItemNode,
  CodeNode,
  CodeHighlightNode,
  LinkNode,
  AutoLinkNode,
  HorizontalRuleNode,
  TemplateVariableNode,
];

function Placeholder({ text }: { text: string }) {
  return <div className={editorPlaceholder}>{text}</div>;
}

function InitialValuePlugin({ value }: { value?: string }) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (value !== undefined) {
      editor.update(() => {
        $convertFromMarkdownString(value, MARKDOWN_TRANSFORMERS);
      });
    }
  }, []);

  return null;
}

function OnChangeMarkdownPlugin({
  onChange,
}: {
  onChange?: (value: string) => void;
}) {
  const handleChange = useCallback(
    (editorState: EditorState) => {
      if (onChange) {
        editorState.read(() => {
          const markdown = $convertToMarkdownString(MARKDOWN_TRANSFORMERS);
          onChange(markdown);
        });
      }
    },
    [onChange]
  );

  return <OnChangePlugin onChange={handleChange} />;
}

export function MarkdownEditor({
  placeholder = 'Write your content here...',
  value,
  onChange,
}: MarkdownEditorProps) {
  const initialConfig = {
    namespace: 'MarkdownEditor',
    theme,
    nodes,
    onError: (error: Error) => {
      console.error('Lexical error:', error);
    },
  };

  return (
    <div className={editorContainer}>
      <LexicalComposer initialConfig={initialConfig}>
        <RichTextPlugin
          contentEditable={<ContentEditable className={editorInput} />}
          placeholder={<Placeholder text={placeholder} />}
          ErrorBoundary={LexicalErrorBoundary}
        />
        <MarkdownShortcutPlugin transformers={MARKDOWN_TRANSFORMERS} />
        <ListPlugin />
        <CheckListPlugin />
        <TabIndentationPlugin />
        <ClickableLinkPlugin />
        <HorizontalRulePlugin />
        <LexicalLinkPlugin />
        <LexicalAutoLinkPlugin />
        <TemplateVariablePlugin />
        <InitialValuePlugin value={value} />
        <OnChangeMarkdownPlugin onChange={onChange} />
      </LexicalComposer>
    </div>
  );
}

export default MarkdownEditor;
