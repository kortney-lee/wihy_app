/**
 * CSS Validation Utilities - Runtime CSS class validation system
 * 
 * This module provides utilities to validate CSS class usage at runtime and build-time
 * to prevent CSS breakage and ensure consistent styling across the application.
 * 
 * @CRITICAL: This system prevents CSS from breaking by enforcing locked constants
 */

import { CSS_CLASSES } from '../constants/cssConstants';

// ============================================================================
// CSS CLASS VALIDATION UTILITIES
// ============================================================================

/**
 * Type-safe CSS class validator - ensures only valid CSS classes are used
 */
export type ValidCSSClass = typeof CSS_CLASSES[keyof typeof CSS_CLASSES];

/**
 * Array of all valid CSS class names for runtime validation
 */
export const VALID_CSS_CLASSES = Object.values(CSS_CLASSES) as string[];

/**
 * Set for O(1) lookup performance during validation
 */
export const VALID_CSS_CLASSES_SET = new Set(VALID_CSS_CLASSES);

// ============================================================================
// RUNTIME VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validates that a CSS class name is approved and locked
 * @param className - The CSS class name to validate
 * @returns true if valid, false if invalid
 */
export function isValidCSSClass(className: string): className is ValidCSSClass {
  return VALID_CSS_CLASSES_SET.has(className);
}

/**
 * Validates multiple CSS class names
 * @param classNames - Array of CSS class names to validate
 * @returns Object with validation results and invalid classes
 */
export function validateCSSClasses(classNames: string[]): {
  isValid: boolean;
  invalidClasses: string[];
  validClasses: string[];
} {
  const invalidClasses: string[] = [];
  const validClasses: string[] = [];
  
  for (const className of classNames) {
    if (isValidCSSClass(className)) {
      validClasses.push(className);
    } else {
      invalidClasses.push(className);
    }
  }
  
  return {
    isValid: invalidClasses.length === 0,
    invalidClasses,
    validClasses,
  };
}

/**
 * Parses className string and validates all classes
 * @param classNameString - Space-separated CSS classes (like React className prop)
 * @returns Validation results
 */
export function validateClassNameString(classNameString: string): {
  isValid: boolean;
  invalidClasses: string[];
  validClasses: string[];
} {
  const classNames = classNameString
    .split(/\s+/)
    .filter(name => name.length > 0);
  
  return validateCSSClasses(classNames);
}

// ============================================================================
// BUILD-TIME VALIDATION UTILITIES
// ============================================================================

/**
 * Extracts CSS class names from a TypeScript/JSX file content
 * @param fileContent - The file content to analyze
 * @returns Array of found CSS class names
 */
export function extractClassNamesFromFile(fileContent: string): string[] {
  const classNames: string[] = [];
  
  // Match className="..." and className={'...'}
  const classNameRegex = /className\s*=\s*["'`]([^"'`]+)["'`]/g;
  const templateLiteralRegex = /className\s*=\s*\{[^}]*["'`]([^"'`]+)["'`][^}]*\}/g;
  
  let match;
  
  // Extract from simple className="..."
  while ((match = classNameRegex.exec(fileContent)) !== null) {
    const classString = match[1];
    const classes = classString.split(/\s+/).filter(name => name.length > 0);
    classNames.push(...classes);
  }
  
  // Extract from template literals
  while ((match = templateLiteralRegex.exec(fileContent)) !== null) {
    const classString = match[1];
    const classes = classString.split(/\s+/).filter(name => name.length > 0);
    classNames.push(...classes);
  }
  
  return [...new Set(classNames)]; // Remove duplicates
}

/**
 * Validates CSS classes in a file and reports issues
 * @param fileContent - The file content to validate
 * @param filePath - Path to the file (for error reporting)
 * @returns Validation report
 */
export function validateFileCSS(fileContent: string, filePath: string): {
  isValid: boolean;
  errors: Array<{
    className: string;
    suggestion?: string;
    line?: number;
  }>;
  warnings: Array<{
    message: string;
    className?: string;
  }>;
} {
  const foundClasses = extractClassNamesFromFile(fileContent);
  const validation = validateCSSClasses(foundClasses);
  
  const errors = validation.invalidClasses.map(className => ({
    className,
    suggestion: findClosestValidClass(className),
  }));
  
  const warnings: Array<{ message: string; className?: string }> = [];
  
  // Check for hardcoded strings instead of constants
  const hardcodedClassRegex = /className\s*=\s*["'`]([^"'`{]+)["'`]/g;
  let match;
  while ((match = hardcodedClassRegex.exec(fileContent)) !== null) {
    warnings.push({
      message: `Consider using CSS_CLASSES constants instead of hardcoded strings`,
      className: match[1],
    });
  }
  
  return {
    isValid: validation.isValid,
    errors,
    warnings,
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Finds the closest matching valid CSS class using Levenshtein distance
 * @param invalidClass - The invalid CSS class name
 * @returns Closest valid class name or undefined
 */
export function findClosestValidClass(invalidClass: string): string | undefined {
  let minDistance = Infinity;
  let closestClass: string | undefined;
  
  for (const validClass of VALID_CSS_CLASSES) {
    const distance = levenshteinDistance(invalidClass, validClass);
    if (distance < minDistance && distance <= 3) { // Only suggest if reasonably close
      minDistance = distance;
      closestClass = validClass;
    }
  }
  
  return closestClass;
}

/**
 * Calculates Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
  
  for (let i = 0; i <= str1.length; i++) {
    matrix[0][i] = i;
  }
  
  for (let j = 0; j <= str2.length; j++) {
    matrix[j][0] = j;
  }
  
  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // deletion
        matrix[j - 1][i] + 1, // insertion
        matrix[j - 1][i - 1] + indicator // substitution
      );
    }
  }
  
  return matrix[str2.length][str1.length];
}

// ============================================================================
// DEVELOPMENT HELPERS
// ============================================================================

/**
 * Development-only function to log CSS validation warnings
 * Only runs in development mode
 */
export function logCSSValidationWarnings(className: string, componentName?: string): void {
  if (process.env.NODE_ENV === 'development') {
    const validation = validateClassNameString(className);
    
    if (!validation.isValid) {
      const prefix = componentName ? `[${componentName}]` : '[CSS Validation]';
      console.warn(`${prefix} Invalid CSS classes found:`, validation.invalidClasses);
      
      validation.invalidClasses.forEach(invalidClass => {
        const suggestion = findClosestValidClass(invalidClass);
        if (suggestion) {
          console.warn(`  - "${invalidClass}" → Did you mean "${suggestion}"?`);
        } else {
          console.warn(`  - "${invalidClass}" → No similar class found. Check CSS_CLASSES constants.`);
        }
      });
    }
  }
}

/**
 * Runtime CSS class formatter - ensures only valid classes are used
 * @param classNames - Array of CSS class names or className string
 * @returns Formatted className string with only valid classes
 */
export function formatValidClassNames(...classNames: (string | undefined | null | false)[]): string {
  const validClasses: string[] = [];
  
  for (const className of classNames) {
    if (!className) continue;
    
    const classes = String(className).split(/\s+/).filter(name => name.length > 0);
    
    for (const cls of classes) {
      if (isValidCSSClass(cls)) {
        validClasses.push(cls);
      } else if (process.env.NODE_ENV === 'development') {
        console.warn(`Invalid CSS class "${cls}" filtered out`);
      }
    }
  }
  
  return validClasses.join(' ');
}

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type CSSValidationResult = ReturnType<typeof validateCSSClasses>;
export type FileValidationResult = ReturnType<typeof validateFileCSS>;