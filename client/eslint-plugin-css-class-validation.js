/**
 * Custom ESLint Plugin: CSS Class Validation
 * 
 * This plugin enforces the use of CSS_CLASSES constants instead of hardcoded
 * className strings to prevent CSS breakage and ensure consistency.
 * 
 * Rules:
 * - enforce-css-constants: Requires using CSS_CLASSES constants
 * - no-hardcoded-classes: Prevents hardcoded className strings
 * - validate-class-names: Validates that used classes exist in CSS_CLASSES
 */

const fs = require('fs');
const path = require('path');

// Load CSS constants for validation
let CSS_CLASSES = {};
try {
  const constantsPath = path.join(process.cwd(), 'src/constants/cssConstants.ts');
  if (fs.existsSync(constantsPath)) {
    const constantsContent = fs.readFileSync(constantsPath, 'utf8');
    // Extract CSS_CLASSES object (simplified parsing)
    const match = constantsContent.match(/export const CSS_CLASSES = \{([^}]+)\}/s);
    if (match) {
      // Simple extraction - in real implementation, use proper AST parsing
      const classesStr = match[1];
      const classMatches = classesStr.match(/([A-Z_]+):\s*['"]([^'"]+)['"]/g);
      if (classMatches) {
        classMatches.forEach(classMatch => {
          const [, key, value] = classMatch.match(/([A-Z_]+):\s*['"]([^'"]+)['"]/);
          CSS_CLASSES[key] = value;
        });
      }
    }
  }
} catch (error) {
  console.warn('Could not load CSS_CLASSES for ESLint validation:', error.message);
}

const VALID_CLASS_VALUES = Object.values(CSS_CLASSES);

module.exports = {
  rules: {
    'enforce-css-constants': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Enforce use of CSS_CLASSES constants instead of hardcoded className strings',
          category: 'Best Practices',
          recommended: true,
        },
        fixable: 'code',
        schema: [],
        messages: {
          noHardcodedClasses: 'Use CSS_CLASSES.{{suggestion}} instead of hardcoded "{{className}}" to prevent CSS breakage',
          unknownClass: 'CSS class "{{className}}" not found in CSS_CLASSES. Add it to cssConstants.ts or use a valid class.',
          useConstants: 'Use CSS_CLASSES constants instead of hardcoded strings in className.',
        },
      },
      create(context) {
        return {
          JSXAttribute(node) {
            if (node.name && node.name.name === 'className' && node.value) {
              // Check for hardcoded string literals
              if (node.value.type === 'Literal' && typeof node.value.value === 'string') {
                const classNameValue = node.value.value;
                const classes = classNameValue.split(/\\s+/).filter(cls => cls.length > 0);
                
                for (const className of classes) {
                  if (!VALID_CLASS_VALUES.includes(className)) {
                    // Try to find matching constant key
                    const constantKey = Object.keys(CSS_CLASSES).find(
                      key => CSS_CLASSES[key] === className
                    );
                    
                    if (constantKey) {
                      context.report({
                        node: node.value,
                        messageId: 'noHardcodedClasses',
                        data: {
                          className,
                          suggestion: constantKey,
                        },
                        fix(fixer) {
                          return fixer.replaceText(
                            node.value,
                            `{CSS_CLASSES.${constantKey}}`
                          );
                        },
                      });
                    } else {
                      context.report({
                        node: node.value,
                        messageId: 'unknownClass',
                        data: { className },
                      });
                    }
                  }
                }
              }
              
              // Check for template literals with hardcoded classes
              if (node.value.type === 'JSXExpressionContainer' && 
                  node.value.expression.type === 'TemplateLiteral') {
                const template = node.value.expression;
                
                template.quasis.forEach(quasi => {
                  if (quasi.value.raw.trim()) {
                    const classes = quasi.value.raw.split(/\\s+/).filter(cls => cls.length > 0);
                    
                    classes.forEach(className => {
                      if (!VALID_CLASS_VALUES.includes(className)) {
                        context.report({
                          node: quasi,
                          messageId: 'unknownClass',
                          data: { className },
                        });
                      }
                    });
                  }
                });
              }
            }
          },
        };
      },
    },
    
    'no-hardcoded-classes': {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Prevent hardcoded className strings',
          category: 'Best Practices',
          recommended: true,
        },
        schema: [],
        messages: {
          noHardcoded: 'Hardcoded className strings are not allowed. Use CSS_CLASSES constants.',
        },
      },
      create(context) {
        return {
          JSXAttribute(node) {
            if (node.name && node.name.name === 'className' && node.value) {
              if (node.value.type === 'Literal') {
                context.report({
                  node: node.value,
                  messageId: 'noHardcoded',
                });
              }
            }
          },
        };
      },
    },
    
    'validate-class-names': {
      meta: {
        type: 'error',
        docs: {
          description: 'Validate that CSS class names exist in CSS_CLASSES',
          category: 'Possible Errors',
          recommended: true,
        },
        schema: [],
        messages: {
          invalidClass: 'CSS class "{{className}}" is not defined in CSS_CLASSES constants',
          missingImport: 'CSS_CLASSES import is required when using className',
        },
      },
      create(context) {
        let hasCSSClassesImport = false;
        
        return {
          ImportDeclaration(node) {
            if (node.source.value && 
                (node.source.value.includes('cssConstants') || 
                 node.source.value.includes('CSS_CLASSES'))) {
              hasCSSClassesImport = true;
            }
          },
          
          JSXAttribute(node) {
            if (node.name && node.name.name === 'className') {
              if (!hasCSSClassesImport) {
                context.report({
                  node,
                  messageId: 'missingImport',
                });
              }
            }
          },
        };
      },
    },
  },
};