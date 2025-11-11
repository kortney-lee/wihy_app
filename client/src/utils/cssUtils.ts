/**
 * CSS Utilities for combining and managing CSS classes
 */

import { CSS_CLASSES } from '../constants/cssConstants';

/**
 * Combines multiple CSS class names, filtering out falsy values
 * @param classes - Class names to combine
 * @returns Combined class string
 */
export const combineClasses = (...classes: (string | undefined | null | false)[]): string => {
  return classes.filter(Boolean).join(' ');
};

/**
 * Conditional class helper
 * @param condition - Whether to apply the class
 * @param trueClass - Class to apply when condition is true
 * @param falseClass - Class to apply when condition is false (optional)
 */
export const conditionalClass = (
  condition: boolean, 
  trueClass: string, 
  falseClass?: string
): string => {
  return condition ? trueClass : (falseClass || '');
};

/**
 * Common Tailwind class combinations for frequent use
 */
export const COMMON_CLASSES = {
  // Flex containers
  FLEX_CENTER: combineClasses(CSS_CLASSES.FLEX, CSS_CLASSES.ITEMS_CENTER, CSS_CLASSES.JUSTIFY_CENTER),
  FLEX_BETWEEN: combineClasses(CSS_CLASSES.FLEX, CSS_CLASSES.ITEMS_CENTER, CSS_CLASSES.JUSTIFY_BETWEEN),
  FLEX_COL_CENTER: combineClasses(CSS_CLASSES.FLEX, CSS_CLASSES.FLEX_COL, CSS_CLASSES.ITEMS_CENTER),
  
  // Cards
  CARD_BASE: combineClasses(CSS_CLASSES.BG_WHITE, CSS_CLASSES.BORDER, CSS_CLASSES.BORDER_GRAY_200, CSS_CLASSES.ROUNDED_LG, CSS_CLASSES.P_4),
  
  // Text combinations
  TITLE_TEXT: combineClasses(CSS_CLASSES.TEXT_LG, CSS_CLASSES.FONT_SEMIBOLD, CSS_CLASSES.TEXT_GRAY_800),
  SUBTITLE_TEXT: combineClasses(CSS_CLASSES.TEXT_SM, CSS_CLASSES.TEXT_GRAY_600),
  
  // Buttons
  BUTTON_BASE: combineClasses(CSS_CLASSES.PX_4, CSS_CLASSES.PY_2, CSS_CLASSES.ROUNDED, CSS_CLASSES.FONT_MEDIUM),
  BUTTON_PRIMARY: combineClasses(CSS_CLASSES.BG_BLUE_500, CSS_CLASSES.TEXT_WHITE),
} as const;

export default {
  combineClasses,
  conditionalClass,
  COMMON_CLASSES,
};