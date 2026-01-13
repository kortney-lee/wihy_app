/**
 * Error Handler Utility
 * 
 * Centralized error handling for API calls and app errors.
 * Provides consistent error formatting and user-friendly messages.
 */

// ============================================
// CUSTOM ERROR CLASSES
// ============================================

export class AppError extends Error {
  public code: string;
  public statusCode?: number;
  public isOperational: boolean;

  constructor(
    message: string,
    code: string = 'APP_ERROR',
    statusCode?: number
  ) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = true;
    
    // Maintains proper stack trace for where error was thrown
    Error.captureStackTrace?.(this, this.constructor);
  }
}

export class NetworkError extends AppError {
  constructor(message: string = 'Network error. Check your connection.') {
    super(message, 'NETWORK_ERROR');
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed. Please log in again.') {
    super(message, 'AUTH_ERROR', 401);
  }
}

export class ValidationError extends AppError {
  public details: Record<string, string[]>;

  constructor(
    message: string = 'Validation failed',
    details: Record<string, string[]> = {}
  ) {
    super(message, 'VALIDATION_ERROR', 400);
    this.details = details;
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 'NOT_FOUND', 404);
  }
}

export class ServerError extends AppError {
  constructor(message: string = 'Server error. Please try again later.') {
    super(message, 'SERVER_ERROR', 500);
  }
}

// ============================================
// ERROR HANDLING FUNCTIONS
// ============================================

/**
 * Handle API errors and convert to AppError
 */
export function handleApiError(error: any): AppError {
  // Already an AppError
  if (error instanceof AppError) {
    return error;
  }

  // Axios/fetch response error
  if (error.response) {
    const status = error.response.status;
    const data = error.response.data;
    const message = data?.error || data?.message || getDefaultMessage(status);

    switch (status) {
      case 400:
        return new ValidationError(message, data?.details);
      case 401:
        return new AuthenticationError(message);
      case 404:
        return new NotFoundError(message);
      case 500:
      case 502:
      case 503:
        return new ServerError(message);
      default:
        return new AppError(message, data?.code || 'API_ERROR', status);
    }
  }

  // Network error (no response)
  if (error.request || error.message?.includes('Network')) {
    return new NetworkError();
  }

  // Timeout error
  if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
    return new NetworkError('Request timed out. Please try again.');
  }

  // Default error
  return new AppError(
    error.message || 'An unexpected error occurred',
    'UNKNOWN_ERROR'
  );
}

/**
 * Get default error message for HTTP status
 */
function getDefaultMessage(status: number): string {
  const messages: Record<number, string> = {
    400: 'Invalid request. Please check your input.',
    401: 'Please log in to continue.',
    403: 'You do not have permission to perform this action.',
    404: 'The requested resource was not found.',
    408: 'Request timed out. Please try again.',
    409: 'This resource already exists.',
    422: 'Unable to process your request.',
    429: 'Too many requests. Please wait and try again.',
    500: 'Server error. Please try again later.',
    502: 'Service temporarily unavailable.',
    503: 'Service temporarily unavailable.',
  };

  return messages[status] || 'An unexpected error occurred.';
}

/**
 * Get user-friendly error message
 */
export function getUserFriendlyMessage(error: any): string {
  const appError = error instanceof AppError ? error : handleApiError(error);
  
  // User-friendly messages for specific codes
  const friendlyMessages: Record<string, string> = {
    NETWORK_ERROR: 'No internet connection. Please check your network.',
    AUTH_ERROR: 'Your session has expired. Please log in again.',
    VALIDATION_ERROR: 'Please check your input and try again.',
    NOT_FOUND: 'The item you are looking for could not be found.',
    SERVER_ERROR: 'Something went wrong. Please try again later.',
    RATE_LIMIT_EXCEEDED: 'Too many requests. Please wait a moment.',
  };

  return friendlyMessages[appError.code] || appError.message;
}

/**
 * Check if error is a network error
 */
export function isNetworkError(error: any): boolean {
  return error instanceof NetworkError || error.code === 'NETWORK_ERROR';
}

/**
 * Check if error requires re-authentication
 */
export function isAuthError(error: any): boolean {
  return (
    error instanceof AuthenticationError ||
    error.code === 'AUTH_ERROR' ||
    error.statusCode === 401
  );
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: any): boolean {
  return (
    isNetworkError(error) ||
    error.statusCode === 408 ||
    error.statusCode === 429 ||
    error.statusCode === 502 ||
    error.statusCode === 503
  );
}

/**
 * Log error for debugging
 */
export function logError(error: any, context?: string): void {
  const appError = error instanceof AppError ? error : handleApiError(error);
  
  console.error(`[Error${context ? ` - ${context}` : ''}]:`, {
    message: appError.message,
    code: appError.code,
    statusCode: appError.statusCode,
    stack: __DEV__ ? appError.stack : undefined,
  });
}

/**
 * Wrap async function with error handling
 */
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  onError?: (error: AppError) => void
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      const appError = handleApiError(error);
      logError(appError);
      onError?.(appError);
      throw appError;
    }
  }) as T;
}

// ============================================
// EXPORTS
// ============================================

export default {
  AppError,
  NetworkError,
  AuthenticationError,
  ValidationError,
  NotFoundError,
  ServerError,
  handleApiError,
  getUserFriendlyMessage,
  isNetworkError,
  isAuthError,
  isRetryableError,
  logError,
  withErrorHandling,
};
