// Shared utility functions for formatting
export const formatCalories = (cal: number): string => {
  return `${cal.toFixed(0)} cal`;
};

export const formatMacro = (grams: number): string => {
  return `${grams.toFixed(1)}g`;
};

export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
};

export const formatTime = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
};
