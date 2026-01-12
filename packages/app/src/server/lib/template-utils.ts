import nunjucks from 'nunjucks';

export interface TemplateVariable {
  name: string;
  type: 'variable' | 'block' | 'comment';
  raw: string;
}

/**
 * Extract all Nunjucks/Jinja2 template variables from a string.
 *
 * This function parses the template and extracts:
 * - Variables: {{ variable_name }}, {{ user.name }}, {{ items[0] }}
 * - Block tags: {% if condition %}, {% for item in items %}, etc.
 * - Comments: {# comment text #}
 *
 * @param template - The template string to parse
 * @returns Array of extracted template variables with their types
 */
export function extractTemplateVariables(template: string): TemplateVariable[] {
  const variables: TemplateVariable[] = [];
  const loopVariables = new Set<string>();

  // First pass: identify loop variables (these are locally scoped, not input variables)
  const forPattern = /\{%-?\s*for\s+(\w+)(?:\s*,\s*(\w+))?\s+in\s+/g;
  let forMatch: RegExpExecArray | null;
  while ((forMatch = forPattern.exec(template)) !== null) {
    // Add loop variable (e.g., "item" in "for item in items")
    loopVariables.add(forMatch[1]);
    // Add optional second loop variable (e.g., "key" in "for key, value in dict")
    if (forMatch[2]) {
      loopVariables.add(forMatch[2]);
    }
  }

  // Regex patterns for different token types
  const patterns = {
    // Variables: {{ ... }}
    variable: /\{\{\s*([\s\S]*?)\s*\}\}/g,
    // Block tags: {% ... %} (with optional trim markers)
    block: /\{%-?\s*([\s\S]*?)\s*-?%\}/g,
    // Comments: {# ... #}
    comment: /\{#\s*([\s\S]*?)\s*#\}/g,
  };

  // Extract variables {{ ... }}
  let match: RegExpExecArray | null;
  while ((match = patterns.variable.exec(template)) !== null) {
    const variableName = match[1].trim();
    // Extract the base variable name (before any filters or properties)
    const baseName = extractBaseName(variableName);
    // Skip if this is a loop variable (locally scoped)
    if (baseName && !loopVariables.has(baseName)) {
      variables.push({
        name: baseName,
        type: 'variable',
        raw: match[0],
      });
    }
  }

  // Extract block tags {% ... %}
  while ((match = patterns.block.exec(template)) !== null) {
    const blockContent = match[1].trim();
    // Extract variable names from block statements
    const blockVars = extractVariablesFromBlock(blockContent, loopVariables);
    for (const varName of blockVars) {
      variables.push({
        name: varName,
        type: 'block',
        raw: match[0],
      });
    }
  }

  // Extract comments {# ... #}
  while ((match = patterns.comment.exec(template)) !== null) {
    variables.push({
      name: match[1].trim(),
      type: 'comment',
      raw: match[0],
    });
  }

  return variables;
}

/**
 * Extract unique variable names from a template that need to be provided as input.
 * This includes:
 * - Variables from {{ variable }} expressions
 * - Iterables from {% for item in items %} blocks
 * - Variables from {% if condition %} blocks
 *
 * Excludes:
 * - Loop variables (item in "for item in items")
 * - Comments
 *
 * @param template - The template string to parse
 * @returns Array of unique variable names that need to be provided
 */
export function extractUniqueVariableNames(template: string): string[] {
  const variables = extractTemplateVariables(template);
  const variableNames = variables
    .filter((v) => v.type === 'variable' || v.type === 'block')
    .map((v) => v.name);

  return [...new Set(variableNames)];
}

/**
 * Extract the base variable name from a template expression.
 * Handles filters, properties, and array access.
 *
 * Examples:
 * - "user" => "user"
 * - "user.name" => "user"
 * - "user | capitalize" => "user"
 * - "items[0]" => "items"
 * - "user.profile.name | default('N/A')" => "user"
 */
function extractBaseName(expression: string): string | null {
  // Remove filters (everything after |)
  const withoutFilters = expression.split('|')[0].trim();

  // Extract the root variable (before any . or [)
  const match = withoutFilters.match(/^([a-zA-Z_][a-zA-Z0-9_]*)/);
  return match ? match[1] : null;
}

/**
 * Extract variable names from block statements.
 *
 * Handles:
 * - {% for item in items %} => extracts "items"
 * - {% if user.is_active %} => extracts "user"
 * - {% set x = value %} => extracts "value"
 */
function extractVariablesFromBlock(
  blockContent: string,
  loopVariables: Set<string>
): string[] {
  const variables: string[] = [];

  // Handle "for x in y" pattern
  const forMatch = blockContent.match(
    /^for\s+\w+(?:\s*,\s*\w+)?\s+in\s+([a-zA-Z_][a-zA-Z0-9_.]*)/
  );
  if (forMatch) {
    const baseName = extractBaseName(forMatch[1]);
    if (baseName && !loopVariables.has(baseName)) {
      variables.push(baseName);
    }
    return variables;
  }

  // Handle "if condition" pattern
  const ifMatch = blockContent.match(/^(?:el)?if\s+(.+)$/);
  if (ifMatch) {
    const condition = ifMatch[1];
    // Extract all variable-like tokens from the condition
    const varMatches = condition.matchAll(/([a-zA-Z_][a-zA-Z0-9_]*)/g);
    for (const m of varMatches) {
      const name = m[1];
      // Filter out common keywords and loop variables
      if (
        ![
          'and',
          'or',
          'not',
          'in',
          'is',
          'true',
          'false',
          'none',
          'null',
        ].includes(name.toLowerCase()) &&
        !loopVariables.has(name)
      ) {
        variables.push(name);
      }
    }
    return variables;
  }

  // Handle "set x = value" pattern
  const setMatch = blockContent.match(
    /^set\s+\w+\s*=\s*([a-zA-Z_][a-zA-Z0-9_.]*)/
  );
  if (setMatch) {
    const baseName = extractBaseName(setMatch[1]);
    if (baseName && !loopVariables.has(baseName)) {
      variables.push(baseName);
    }
    return variables;
  }

  return variables;
}

/**
 * Validate a Nunjucks template for syntax errors.
 *
 * @param template - The template string to validate
 * @returns Object with isValid boolean and optional error message
 */
export function validateTemplate(template: string): {
  isValid: boolean;
  error?: string;
} {
  try {
    // Create a sandboxed environment for validation
    const env = new nunjucks.Environment(null, { autoescape: true });
    // Compile the template to check for syntax errors
    env.renderString(template, {});
    return { isValid: true };
  } catch (error) {
    // Nunjucks throws errors for undefined variables, which is expected
    // We only care about actual syntax errors
    const errorMessage = error instanceof Error ? error.message : String(error);

    // These are not syntax errors, just missing variables
    if (
      errorMessage.includes('not defined') ||
      errorMessage.includes('is not a function')
    ) {
      return { isValid: true };
    }

    return {
      isValid: false,
      error: errorMessage,
    };
  }
}

/**
 * Render a Nunjucks template with given context.
 *
 * @param template - The template string
 * @param context - Object containing variable values
 * @returns Rendered string
 */
export function renderTemplate(
  template: string,
  context: Record<string, unknown>
): string {
  const env = new nunjucks.Environment(null, { autoescape: false });
  return env.renderString(template, context);
}
