import { TextNode, $createTextNode } from 'lexical';
import type {
  SerializedTextNode,
  NodeKey,
  LexicalNode,
  EditorConfig,
} from 'lexical';

export type TemplateVariableType = 'variable' | 'block' | 'comment';

export type SerializedTemplateVariableNode = SerializedTextNode & {
  type: 'template-variable';
  version: 1;
  variableType: TemplateVariableType;
};

/**
 * TemplateVariableNode - A custom Lexical node for Nunjucks/Jinja2 template syntax
 *
 * Supports:
 * - Variables: {{ variable_name }}
 * - Blocks: {% if condition %}, {% for item in items %}, etc.
 * - Comments: {# comment text #}
 */
export class TemplateVariableNode extends TextNode {
  __variableType: TemplateVariableType;

  static getType(): string {
    return 'template-variable';
  }

  static clone(node: TemplateVariableNode): TemplateVariableNode {
    return new TemplateVariableNode(
      node.__text,
      node.__variableType,
      node.__key
    );
  }

  constructor(
    text: string,
    variableType?: TemplateVariableType,
    key?: NodeKey
  ) {
    super(text, key);
    this.__variableType = variableType || TemplateVariableNode.detectType(text);
  }

  static detectType(text: string): TemplateVariableType {
    if (text.startsWith('{#')) {
      return 'comment';
    } else if (text.startsWith('{%')) {
      return 'block';
    }
    return 'variable';
  }

  getVariableType(): TemplateVariableType {
    return this.__variableType;
  }

  createDOM(config: EditorConfig): HTMLElement {
    const dom = document.createElement('span');
    const text = this.__text;
    dom.textContent = text;

    // Apply theme classes if available
    const themeClass = config.theme.templateVariable;
    if (themeClass) {
      dom.classList.add(themeClass);
    }

    // Apply type-specific classes
    const typeClass =
      config.theme[
        `templateVariable${this.__variableType.charAt(0).toUpperCase() + this.__variableType.slice(1)}`
      ];
    if (typeClass) {
      dom.classList.add(typeClass);
    }

    // Apply inline styles as fallback
    dom.style.padding = '1px 4px';
    dom.style.borderRadius = '3px';
    dom.style.fontFamily = 'monospace';
    dom.style.fontSize = '0.9em';

    // Color by token type
    switch (this.__variableType) {
      case 'comment':
        dom.style.backgroundColor = 'rgba(107, 114, 128, 0.15)';
        dom.style.color = '#6b7280'; // gray-500
        break;
      case 'block':
        dom.style.backgroundColor = 'rgba(168, 85, 247, 0.15)';
        dom.style.color = '#a855f7'; // purple-500
        break;
      case 'variable':
      default:
        dom.style.backgroundColor = 'rgba(59, 130, 246, 0.15)';
        dom.style.color = '#3b82f6'; // blue-500
        break;
    }

    return dom;
  }

  updateDOM(prevNode: TemplateVariableNode, dom: HTMLElement): boolean {
    const text = this.getTextContent();
    if (
      text !== dom.textContent ||
      prevNode.__variableType !== this.__variableType
    ) {
      dom.textContent = text;
      // Update colors if type changed
      switch (this.__variableType) {
        case 'comment':
          dom.style.backgroundColor = 'rgba(107, 114, 128, 0.15)';
          dom.style.color = '#6b7280';
          break;
        case 'block':
          dom.style.backgroundColor = 'rgba(168, 85, 247, 0.15)';
          dom.style.color = '#a855f7';
          break;
        case 'variable':
        default:
          dom.style.backgroundColor = 'rgba(59, 130, 246, 0.15)';
          dom.style.color = '#3b82f6';
          break;
      }
      return true;
    }
    return false;
  }

  exportJSON(): SerializedTemplateVariableNode {
    return {
      ...super.exportJSON(),
      type: 'template-variable',
      version: 1,
      variableType: this.__variableType,
    };
  }

  static importJSON(
    serializedNode: SerializedTemplateVariableNode
  ): TemplateVariableNode {
    const node = $createTemplateVariableNode(
      serializedNode.text,
      serializedNode.variableType
    );
    node.setFormat(serializedNode.format);
    node.setDetail(serializedNode.detail);
    node.setMode(serializedNode.mode);
    node.setStyle(serializedNode.style);
    return node;
  }

  /**
   * Validates if the node content is a valid template syntax
   */
  isValid(): boolean {
    return TEMPLATE_REGEX.EXACT.test(this.__text);
  }

  /**
   * Extracts the variable name from the template syntax
   * e.g., "{{ user.name }}" -> "user.name"
   */
  getVariableName(): string | null {
    if (this.__variableType !== 'variable') {
      return null;
    }
    const match = this.__text.match(/\{\{\s*([\s\S]*?)\s*\}\}/);
    return match ? match[1].trim() : null;
  }
}

// Regex patterns for Nunjucks/Jinja2 template syntax
export const TEMPLATE_REGEX = {
  // Match complete tokens: variables {{ }}, blocks {% %} (with optional - trim markers), comments {# #}
  FULL: /(\{\{[\s\S]*?\}\}|\{%-?[\s\S]*?-?%\}|\{%[\s\S]*?%\}|\{#[\s\S]*?#\})/,
  // Match incomplete tokens at end of string (for input mode)
  INPUT: /(\{\{[\s\S]*$|\{%-?[\s\S]*$|\{%[\s\S]*$|\{#[\s\S]*$)/,
  // Exact match validator for token nodes (entire text content is one token)
  EXACT:
    /^(\{\{[\s\S]*?\}\}|\{%-?[\s\S]*?-?%\}|\{%[\s\S]*?%\}|\{#[\s\S]*?#\})$/,
  // Match just variable tokens {{ }}
  VARIABLE: /\{\{[\s\S]*?\}\}/,
  // Match block tokens {% %}
  BLOCK: /\{%-?[\s\S]*?-?%\}/,
  // Match comment tokens {# #}
  COMMENT: /\{#[\s\S]*?#\}/,
};

export function $createTemplateVariableNode(
  text: string,
  variableType?: TemplateVariableType
): TemplateVariableNode {
  return new TemplateVariableNode(text, variableType);
}

export function $isTemplateVariableNode(
  node: LexicalNode | null | undefined
): node is TemplateVariableNode {
  return node instanceof TemplateVariableNode;
}

/**
 * Convert a TemplateVariableNode back to a regular TextNode
 */
export function $convertTemplateVariableToText(
  node: TemplateVariableNode
): TextNode {
  return $createTextNode(node.getTextContent());
}
