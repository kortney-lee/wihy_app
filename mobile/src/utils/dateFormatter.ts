/**
 * Auto-formats date input to MM/DD/YYYY format
 * Automatically adds slashes as user types
 * @param value - The input value from the user
 * @returns Formatted date string with slashes
 */
export const formatDateInput = (value: string): string => {
  // Remove all non-numeric characters
  const numbers = value.replace(/\D/g, '');
  
  // Don't allow more than 8 digits (MMDDYYYY)
  const truncated = numbers.slice(0, 8);
  
  // Add slashes automatically
  let formatted = truncated;
  
  if (truncated.length >= 3) {
    // Add first slash after MM
    formatted = truncated.slice(0, 2) + '/' + truncated.slice(2);
  }
  
  if (truncated.length >= 5) {
    // Add second slash after DD
    formatted = truncated.slice(0, 2) + '/' + truncated.slice(2, 4) + '/' + truncated.slice(4);
  }
  
  return formatted;
};

/**
 * Validates if a date string is in correct MM/DD/YYYY format
 * @param date - Date string to validate
 * @returns true if valid format
 */
export const isValidDateFormat = (date: string): boolean => {
  const datePattern = /^\d{2}\/\d{2}\/\d{4}$/;
  return datePattern.test(date);
};

/**
 * Converts date to YYYY-MM-DD format for API submission
 * @param date - Date in MM/DD/YYYY format
 * @returns Date in YYYY-MM-DD format or original if invalid
 */
export const convertToAPIFormat = (date: string): string => {
  if (!isValidDateFormat(date)) return date;
  
  const [month, day, year] = date.split('/');
  return `${year}-${month}-${day}`;
};
