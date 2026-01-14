import { useEffect, useCallback } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useLexicalTextEntity } from '@lexical/react/useLexicalTextEntity';
import { TextNode, $createTextNode } from 'lexical';
import type { LexicalNode } from 'lexical';
import {
  TemplateVariableNode,
  $createTemplateVariableNode,
  $isTemplateVariableNode,
  TEMPLATE_REGEX,
} from './template-variable-node';

/**
 * TemplateVariablePlugin - Automatically detects and converts Nunjucks/Jinja2 template syntax
 *
 * This plugin watches for text that matches template patterns and converts them to
 * TemplateVariableNode instances for proper highlighting and handling.
 *
 * Supports:
 * - Variables: {{ variable_name }}
 * - Blocks: {% if condition %}, {% for item in items %}, {% endif %}, etc.
 * - Comments: {# comment text #}
 * - Trim markers: {%- ... -%}
 */
export function TemplateVariablePlugin(): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!editor.hasNodes([TemplateVariableNode])) {
      throw new Error(
        'TemplateVariablePlugin: TemplateVariableNode not registered on editor'
      );
    }

    const $transformTextNode = (textNode: LexicalNode | null | undefined) => {
      if (!textNode || !(textNode instanceof TextNode)) return;
      if ($isTemplateVariableNode(textNode)) return;

      const text = textNode.getTextContent();
      if (!text) return;

      // Check if the text contains any template syntax
      const fullMatch = text.match(TEMPLATE_REGEX.FULL);
      if (!fullMatch) return;

      const [matchedText] = fullMatch;
      const startOffset = fullMatch.index!;
      const endOffset = startOffset + matchedText.length;

      const beforeToken = text.slice(0, startOffset);
      const afterToken = text.slice(endOffset);

      const parent = textNode.getParent();
      if (!parent) return;

      // Create nodes for the parts
      if (beforeToken) {
        const beforeNode = $createTextNode(beforeToken);
        textNode.insertBefore(beforeNode);
      }

      const templateNode = $createTemplateVariableNode(matchedText);
      textNode.insertBefore(templateNode);

      if (afterToken) {
        const afterNode = $createTextNode(afterToken);
        textNode.insertBefore(afterNode);
      }

      textNode.remove();
    };

    const $transformTemplateNode = (node: LexicalNode | null | undefined) => {
      if (!node || !$isTemplateVariableNode(node)) return;

      const text = node.getTextContent();

      // If the node is no longer a valid template syntax, convert back to text
      if (!text || !TEMPLATE_REGEX.EXACT.test(text)) {
        const parent = node.getParent();
        if (!parent) return;

        const textNode = $createTextNode(text);
        node.replace(textNode);
      }
    };

    const unregisterTextTransform = editor.registerNodeTransform(
      TextNode,
      $transformTextNode
    );
    const unregisterTemplateTransform = editor.registerNodeTransform(
      TemplateVariableNode,
      $transformTemplateNode
    );

    return () => {
      unregisterTextTransform();
      unregisterTemplateTransform();
    };
  }, [editor]);

  // Match callback for useLexicalTextEntity
  const getTemplateMatch = useCallback((text: string) => {
    const match = TEMPLATE_REGEX.FULL.exec(text);
    if (match) {
      return {
        start: match.index,
        end: match.index + match[0].length,
      };
    }
    return null;
  }, []);

  // Factory callback for creating template nodes
  const $createTemplateNode = useCallback((textNode: TextNode) => {
    return $createTemplateVariableNode(textNode.getTextContent());
  }, []);

  // Use the text entity hook for additional pattern matching
  useLexicalTextEntity<TemplateVariableNode>(
    getTemplateMatch,
    TemplateVariableNode,
    $createTemplateNode
  );

  return null;
}

export default TemplateVariablePlugin;
