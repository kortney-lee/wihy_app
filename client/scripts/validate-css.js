#!/usr/bin/env node

/**
 * CSS Lock Validator - Build-time CSS validation script
 * 
 * This script validates all TypeScript/JSX files to ensure:
 * 1. All CSS classes are defined in CSS_CLASSES constants
 * 2. No hardcoded className strings are used
 * 3. All CSS class references are valid
 * 
 * Run this script before builds to prevent CSS breakage.
 * 
 * Usage:
 *   node scripts/validate-css.js
 *   npm run validate-css
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Configuration
const SRC_DIR = path.join(__dirname, '../src');
const CONSTANTS_FILE = path.join(SRC_DIR, 'constants/cssConstants.ts');

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

// Statistics
let stats = {
  totalFiles: 0,
  validFiles: 0,
  filesWithErrors: 0,
  filesWithWarnings: 0,
  totalErrors: 0,
  totalWarnings: 0,
};

/**
 * Load CSS_CLASSES constants from cssConstants.ts
 */
function loadCSSClasses() {
  try {
    if (!fs.existsSync(CONSTANTS_FILE)) {
      console.error(`${colors.red}❌ CSS constants file not found: ${CONSTANTS_FILE}${colors.reset}`);
      process.exit(1);
    }

    const content = fs.readFileSync(CONSTANTS_FILE, 'utf8');
    
    // Extract CSS_CLASSES object with better regex parsing
    const cssClassesMatch = content.match(/export const CSS_CLASSES = \{([\s\S]*?)\} as const;/);
    if (!cssClassesMatch) {
      console.error(`${colors.red}❌ Could not parse CSS_CLASSES from ${CONSTANTS_FILE}${colors.reset}`);
      process.exit(1);
    }

    const cssClasses = {};
    const classesContent = cssClassesMatch[1];
    
    // Extract each class definition with improved regex
    const classMatches = classesContent.match(/([A-Z_]+):\s*['"]([^'"]+)['"],?/g);
    if (classMatches) {
      classMatches.forEach(classMatch => {
        const lineMatch = classMatch.match(/([A-Z_]+):\s*['"]([^'"]+)['"]/);
        if (lineMatch && lineMatch[1] && lineMatch[2]) {
          cssClasses[lineMatch[1]] = lineMatch[2];
        }
      });
    }

    const validClasses = Object.values(cssClasses);
    const validClassesSet = new Set(validClasses);

    console.log(`${colors.green}✓ Loaded ${validClasses.length} CSS classes from constants${colors.reset}`);
    
    return {
      cssClasses,
      validClasses,
      validClassesSet,
    };
  } catch (error) {
    console.error(`${colors.red}❌ Error loading CSS classes: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

/**
 * Extract className values from TypeScript/JSX content
 */
function extractClassNames(content) {
  const classNames = new Set();
  const issues = [];

  // Match className="..." (string literals)
  const stringLiteralRegex = /className\s*=\s*["'`]([^"'`]+)["'`]/g;
  let match;

  while ((match = stringLiteralRegex.exec(content)) !== null) {
    const classString = match[1];
    const classes = classString.split(/\\s+/).filter(cls => cls.length > 0);
    
    classes.forEach(cls => classNames.add(cls));
    
    // Flag as potential issue - should use constants
    issues.push({
      type: 'warning',
      message: `Hardcoded className string found: "${classString}"`,
      suggestion: 'Consider using CSS_CLASSES constants instead',
      line: getLineNumber(content, match.index),
    });
  }

  // Match className={...} expressions
  const expressionRegex = /className\s*=\s*\{([^}]+)\}/g;
  while ((match = expressionRegex.exec(content)) !== null) {
    const expression = match[1];
    
    // Extract string literals from expressions
    const stringInExpression = /["'`]([^"'`]+)["'`]/g;
    let stringMatch;
    
    while ((stringMatch = stringInExpression.exec(expression)) !== null) {
      const classString = stringMatch[1];
      const classes = classString.split(/\\s+/).filter(cls => cls.length > 0);
      classes.forEach(cls => classNames.add(cls));
    }
  }

  return {
    classNames: Array.from(classNames),
    issues,
  };
}

/**
 * Get line number for a character index in content
 */
function getLineNumber(content, index) {
  return content.substring(0, index).split('\n').length;
}

/**
 * Validate CSS classes in a file
 */
function validateFile(filePath, cssData) {
  const { validClassesSet } = cssData;
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const { classNames, issues } = extractClassNames(content);
    
    const errors = [];
    const warnings = [...issues];
    
    // Check each class name
    classNames.forEach(className => {
      if (!validClassesSet.has(className)) {
        errors.push({
          type: 'error',
          message: `Invalid CSS class: "${className}"`,
          suggestion: findClosestMatch(className, cssData.validClasses),
        });
      }
    });
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      classNames,
    };
  } catch (error) {
    return {
      isValid: false,
      errors: [{
        type: 'error',
        message: `Failed to read file: ${error.message}`,
      }],
      warnings: [],
      classNames: [],
    };
  }
}

/**
 * Find closest matching class name using simple string similarity
 */
function findClosestMatch(target, validClasses) {
  let bestMatch = null;
  let bestScore = 0;

  validClasses.forEach(validClass => {
    // Simple scoring based on common substrings
    const score = calculateSimilarity(target.toLowerCase(), validClass.toLowerCase());
    if (score > bestScore && score > 0.4) { // Minimum similarity threshold
      bestScore = score;
      bestMatch = validClass;
    }
  });

  return bestMatch;
}

/**
 * Calculate string similarity (0-1 score)
 */
function calculateSimilarity(str1, str2) {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
}

/**
 * Calculate Levenshtein distance
 */
function levenshteinDistance(str1, str2) {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
  
  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
  
  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + indicator
      );
    }
  }
  
  return matrix[str2.length][str1.length];
}

/**
 * Print validation results for a file
 */
function printFileResults(filePath, results) {
  const relativePath = path.relative(process.cwd(), filePath);
  
  if (results.isValid && results.warnings.length === 0) {
    console.log(`${colors.green}✓${colors.reset} ${relativePath}`);
    stats.validFiles++;
    return;
  }
  
  if (results.errors.length > 0) {
    console.log(`${colors.red}✗${colors.reset} ${relativePath}`);
    stats.filesWithErrors++;
    
    results.errors.forEach(error => {
      console.log(`  ${colors.red}ERROR:${colors.reset} ${error.message}`);
      if (error.suggestion) {
        console.log(`    ${colors.cyan}Suggestion: ${error.suggestion}${colors.reset}`);
      }
      stats.totalErrors++;
    });
  } else {
    console.log(`${colors.yellow}⚠${colors.reset} ${relativePath}`);
    stats.filesWithWarnings++;
  }
  
  if (results.warnings.length > 0) {
    results.warnings.forEach(warning => {
      console.log(`  ${colors.yellow}WARNING:${colors.reset} ${warning.message}`);
      if (warning.suggestion) {
        console.log(`    ${colors.cyan}Suggestion: ${warning.suggestion}${colors.reset}`);
      }
      if (warning.line) {
        console.log(`    ${colors.blue}Line: ${warning.line}${colors.reset}`);
      }
      stats.totalWarnings++;
    });
  }
}

/**
 * Print final statistics
 */
function printStats() {
  console.log('\\n' + '='.repeat(60));
  console.log(`${colors.bold}CSS Validation Results${colors.reset}`);
  console.log('='.repeat(60));
  
  console.log(`Total files scanned: ${colors.cyan}${stats.totalFiles}${colors.reset}`);
  console.log(`Valid files: ${colors.green}${stats.validFiles}${colors.reset}`);
  console.log(`Files with errors: ${colors.red}${stats.filesWithErrors}${colors.reset}`);
  console.log(`Files with warnings: ${colors.yellow}${stats.filesWithWarnings}${colors.reset}`);
  console.log(`Total errors: ${colors.red}${stats.totalErrors}${colors.reset}`);
  console.log(`Total warnings: ${colors.yellow}${stats.totalWarnings}${colors.reset}`);
  
  if (stats.totalErrors === 0) {
    console.log(`\\n${colors.green}${colors.bold}✅ CSS validation passed!${colors.reset}`);
    console.log(`${colors.green}All CSS classes are properly locked and validated.${colors.reset}`);
  } else {
    console.log(`\\n${colors.red}${colors.bold}❌ CSS validation failed!${colors.reset}`);
    console.log(`${colors.red}Fix the errors above to ensure CSS stability.${colors.reset}`);
  }
}

/**
 * Main validation function
 */
function main() {
  console.log(`${colors.bold}${colors.blue}🔒 CSS Lock Validator${colors.reset}`);
  console.log(`${colors.blue}Validating CSS class usage across the application...${colors.reset}\\n`);
  
  // Load CSS constants
  const cssData = loadCSSClasses();
  
  // Find all TypeScript and TSX files
  const pattern = 'src/**/*.{ts,tsx}';
  const files = glob.sync(pattern, { 
    ignore: ['**/*.d.ts', '**/*.test.ts', '**/*.test.tsx', '**/node_modules/**'],
    cwd: process.cwd()
  });
  
  console.log(`Found ${files.length} files to validate\\n`);
  stats.totalFiles = files.length;
  
  // Validate each file
  files.forEach(filePath => {
    const results = validateFile(filePath, cssData);
    printFileResults(filePath, results);
  });
  
  // Print final results
  printStats();
  
  // Exit with error code if there are errors
  if (stats.totalErrors > 0) {
    process.exit(1);
  }
}

// Run the validator
if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(`${colors.red}❌ Validation failed: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

module.exports = {
  validateFile,
  loadCSSClasses,
  extractClassNames,
};