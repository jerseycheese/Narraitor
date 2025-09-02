/**
 * ESLint rule to prevent hardcoded colors in JavaScript/TypeScript
 * 
 * This rule catches hardcoded color values in:
 * - String literals: '#ff0000', 'rgb(255,0,0)', 'red'
 * - Object properties: { color: '#ff0000' }
 * - Template literals: `color: #ff0000`
 * 
 * Encourages use of design tokens instead.
 */

const rule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow hardcoded color values in favor of design tokens',
      category: 'Design System',
      recommended: true,
    },
    fixable: null,
    schema: [],
    messages: {
      hardcodedColor: 'Hardcoded color "{{color}}" found. Use design tokens from @/lib/design-tokens instead.',
      hardcodedColorInTemplate: 'Hardcoded color in template literal. Use design tokens from @/lib/design-tokens instead.',
    },
  },

  create(context) {
    // Regex patterns to match color values
    const colorPatterns = [
      // Hex colors: #fff, #ffffff, #123456
      /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/,
      // RGB/RGBA functions: rgb(255,0,0), rgba(255,0,0,1)
      /^rgba?\s*\(\s*\d+\s*,\s*\d+\s*,\s*\d+(\s*,\s*[\d.]+)?\s*\)$/,
      // HSL/HSLA functions: hsl(0,100%,50%), hsla(0,100%,50%,1)
      /^hsla?\s*\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%(\s*,\s*[\d.]+)?\s*\)$/,
    ];

    // Common color names to avoid
    const colorNames = [
      'red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink', 'brown',
      'black', 'white', 'gray', 'grey', 'cyan', 'magenta', 'lime', 'indigo',
      'violet', 'teal', 'navy', 'maroon', 'olive', 'aqua', 'fuchsia', 'silver'
    ];

    function isColorValue(value) {
      if (typeof value !== 'string') return false;
      
      // Check against color patterns
      for (const pattern of colorPatterns) {
        if (pattern.test(value)) return true;
      }
      
      // Check against color names (case insensitive)
      return colorNames.includes(value.toLowerCase());
    }

    function checkTemplateForColors(node) {
      const sourceCode = context.getSourceCode();
      const text = sourceCode.getText(node);
      
      // Look for CSS-like patterns in template literals
      const cssColorPattern = /(color|background|border|fill|stroke)\s*:\s*([^;]+)/gi;
      let match;
      
      while ((match = cssColorPattern.exec(text)) !== null) {
        const colorValue = match[2].trim();
        if (isColorValue(colorValue)) {
          context.report({
            node,
            messageId: 'hardcodedColorInTemplate',
          });
          break;
        }
      }
    }

    return {
      // Check string literals
      Literal(node) {
        if (typeof node.value === 'string' && isColorValue(node.value)) {
          // Skip if it's in an import statement or from design tokens
          const sourceCode = context.getSourceCode();
          const parent = node.parent;
          
          // Allow if importing from design tokens
          if (parent && parent.type === 'ImportSpecifier') {
            return;
          }
          
          // Allow if it's a design token reference
          const text = sourceCode.getText(node);
          if (text.includes('design-tokens') || text.includes('primitiveColors')) {
            return;
          }

          context.report({
            node,
            messageId: 'hardcodedColor',
            data: {
              color: node.value,
            },
          });
        }
      },

      // Check template literals for CSS-in-JS
      TemplateLiteral(node) {
        checkTemplateForColors(node);
      },

      // Check object properties (style objects)
      Property(node) {
        if (node.value && node.value.type === 'Literal') {
          const key = node.key.name || node.key.value;
          const value = node.value.value;
          
          // Check if it's a style-related property with a color value
          const styleProps = ['color', 'backgroundColor', 'borderColor', 'fill', 'stroke'];
          if (styleProps.includes(key) && typeof value === 'string' && isColorValue(value)) {
            context.report({
              node: node.value,
              messageId: 'hardcodedColor',
              data: {
                color: value,
              },
            });
          }
        }
      },
    };
  },
};

export default rule;