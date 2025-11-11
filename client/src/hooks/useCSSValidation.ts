/**
 * CSS Validation Hook - Prevents CSS class misuse at runtime
 * 
 * This hook validates that dashboard components are using approved CSS classes
 * and provides warnings/errors when incorrect classes are detected.
 */

import React, { useEffect } from 'react';
import { 
  validateDashboardClassName, 
  getApprovedDashboardClasses 
} from '../constants/cssConstants';

interface UseCSSValidationOptions {
  /** Whether to log warnings for invalid classes */
  enableWarnings?: boolean;
  /** Whether to throw errors for invalid classes */
  strictMode?: boolean;
  /** Component name for better error messages */
  componentName?: string;
}

/**
 * Validates CSS class usage in dashboard components
 * 
 * @param classNames - Array of class names to validate
 * @param options - Validation options
 */
export const useCSSValidation = (
  classNames: (string | undefined)[], 
  options: UseCSSValidationOptions = {}
) => {
  const {
    enableWarnings = process.env.NODE_ENV === 'development',
    strictMode = false,
    componentName = 'Unknown Component'
  } = options;

  useEffect(() => {
    if (!enableWarnings && !strictMode) return;

    const invalidClasses: string[] = [];
    const approvedClasses = getApprovedDashboardClasses();
    
    classNames.forEach((className) => {
      if (!className) return;
      
      // Split multiple classes (e.g., "class1 class2")
      const classes = className.split(' ').filter(Boolean);
      
      classes.forEach((cls) => {
        // Skip utility classes (e.g., flex, text-center) and dynamic classes
        if (cls.startsWith('flex') || cls.startsWith('text-') || 
            cls.startsWith('bg-') || cls.startsWith('p-') || 
            cls.startsWith('m-') || cls.startsWith('w-') || 
            cls.startsWith('h-') || cls.includes('active') ||
            cls.includes('inactive') || cls.includes('hover')) {
          return;
        }
        
        // Check if it's a dashboard-specific class that should be approved
        const isDashboardClass = cls.includes('card') || cls.includes('grid') || 
                                cls.includes('dashboard') || cls.includes('metric') ||
                                cls.includes('chart') || cls.includes('insight');
        
        if (isDashboardClass && !validateDashboardClassName(cls)) {
          invalidClasses.push(cls);
        }
      });
    });

    if (invalidClasses.length > 0) {
      const message = `
🚨 CSS VALIDATION ERROR in ${componentName}:

❌ Invalid dashboard classes detected: ${invalidClasses.join(', ')}

✅ Approved dashboard classes:
${approvedClasses.map(cls => `  - ${cls}`).join('\n')}

🔧 Fix: Import and use constants from 'constants/cssConstants.ts'

Example:
import { HEALTH_METRIC_CARD_CLASS } from '../constants/cssConstants';
<div className={HEALTH_METRIC_CARD_CLASS}>

This ensures consistent styling and prevents CSS breakage.
      `.trim();

      if (strictMode) {
        throw new Error(message);
      } else if (enableWarnings) {
        console.warn(message);
      }
    }
  }, [classNames, enableWarnings, strictMode, componentName]);

  return {
    /** Check if all provided classes are valid */
    isValid: classNames.every(className => 
      !className || className.split(' ').every(cls => 
        !cls || validateDashboardClassName(cls) || 
        // Allow utility classes
        cls.startsWith('flex') || cls.startsWith('text-') || 
        cls.startsWith('bg-') || cls.startsWith('p-') || 
        cls.startsWith('m-') || cls.startsWith('w-') || 
        cls.startsWith('h-') || cls.includes('active') ||
        cls.includes('inactive') || cls.includes('hover') ||
        !(cls.includes('card') || cls.includes('grid') || 
          cls.includes('dashboard') || cls.includes('metric') ||
          cls.includes('chart') || cls.includes('insight'))
      )
    ),
    
    /** Get list of approved classes */
    approvedClasses: getApprovedDashboardClasses(),
    
    /** Validate a single class name */
    validateClass: validateDashboardClassName
  };
};

/**
 * Higher-order component wrapper for CSS validation
 */
export const withCSSValidation = <P extends object>(
  Component: React.ComponentType<P>,
  componentName: string,
  strictMode: boolean = false
): React.ComponentType<P> => {
  return (props: P) => {
    // Extract className props for validation
    const classNames = Object.values(props).filter(
      (value): value is string => 
        typeof value === 'string' && value.includes('className')
    );
    
    useCSSValidation(classNames, { componentName, strictMode });
    
    return React.createElement(Component as any, props);
  };
};

export default useCSSValidation;