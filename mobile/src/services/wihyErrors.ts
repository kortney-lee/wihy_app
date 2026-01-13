/**
 * WIHY Error Handling
 * Comprehensive error types and handling for WIHY API
 */

/**
 * Error codes for WIHY API errors
 */
export enum ErrorCode {
  // Image errors
  INVALID_IMAGE = 'INVALID_IMAGE',
  IMAGE_PROCESSING_FAILED = 'IMAGE_PROCESSING_FAILED',
  IMAGE_TOO_LARGE = 'IMAGE_TOO_LARGE',
  
  // Network errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  
  // Server errors
  SERVER_ERROR = 'SERVER_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  
  // Response errors
  INVALID_RESPONSE = 'INVALID_RESPONSE',
  DECODING_ERROR = 'DECODING_ERROR',
  
  // Rate limiting
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  
  // Authentication
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  
  // Not found
  NOT_FOUND = 'NOT_FOUND',
  PRODUCT_NOT_FOUND = 'PRODUCT_NOT_FOUND',
  
  // Validation
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_BARCODE = 'INVALID_BARCODE',
  
  // Unknown
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Human-readable error messages
 */
export const ErrorMessages: Record<ErrorCode, string> = {
  [ErrorCode.INVALID_IMAGE]: 'Invalid image format. Please use JPEG or PNG.',
  [ErrorCode.IMAGE_PROCESSING_FAILED]: 'Failed to process image. Please try again with a clearer photo.',
  [ErrorCode.IMAGE_TOO_LARGE]: 'Image is too large. Please use a smaller image.',
  [ErrorCode.NETWORK_ERROR]: 'Network connection error. Please check your internet connection.',
  [ErrorCode.TIMEOUT_ERROR]: 'Request timed out. Please try again.',
  [ErrorCode.SERVER_ERROR]: 'Server error occurred. Please try again later.',
  [ErrorCode.SERVICE_UNAVAILABLE]: 'Service temporarily unavailable. Please try again later.',
  [ErrorCode.INVALID_RESPONSE]: 'Invalid server response. Please try again.',
  [ErrorCode.DECODING_ERROR]: 'Failed to parse response. Please try again.',
  [ErrorCode.RATE_LIMIT_EXCEEDED]: 'Too many requests. Please wait before trying again.',
  [ErrorCode.UNAUTHORIZED]: 'Authentication required. Please sign in.',
  [ErrorCode.FORBIDDEN]: 'Access denied. You do not have permission to perform this action.',
  [ErrorCode.NOT_FOUND]: 'Resource not found.',
  [ErrorCode.PRODUCT_NOT_FOUND]: 'Product not found. Try scanning a different barcode or taking a photo.',
  [ErrorCode.VALIDATION_ERROR]: 'Invalid input. Please check your data and try again.',
  [ErrorCode.INVALID_BARCODE]: 'Invalid barcode format. Please scan a valid barcode.',
  [ErrorCode.UNKNOWN_ERROR]: 'An unexpected error occurred. Please try again.',
};

/**
 * Custom error class for WIHY API errors
 */
export class WIHYError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode?: number;
  public readonly originalError?: Error;

  constructor(
    code: ErrorCode,
    message?: string,
    statusCode?: number,
    originalError?: Error
  ) {
    super(message || ErrorMessages[code]);
    this.name = 'WIHYError';
    this.code = code;
    this.statusCode = statusCode;
    this.originalError = originalError;

    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, WIHYError);
    }
  }

  /**
   * Create a WIHYError from an HTTP response
   */
  static fromResponse(statusCode: number, responseBody?: string): WIHYError {
    let code: ErrorCode;
    let message: string | undefined;

    switch (statusCode) {
      case 400:
        code = ErrorCode.VALIDATION_ERROR;
        break;
      case 401:
        code = ErrorCode.UNAUTHORIZED;
        break;
      case 403:
        code = ErrorCode.FORBIDDEN;
        break;
      case 404:
        code = ErrorCode.NOT_FOUND;
        break;
      case 429:
        code = ErrorCode.RATE_LIMIT_EXCEEDED;
        break;
      case 500:
        code = ErrorCode.SERVER_ERROR;
        break;
      case 502:
      case 503:
      case 504:
        code = ErrorCode.SERVICE_UNAVAILABLE;
        break;
      default:
        code = ErrorCode.UNKNOWN_ERROR;
    }

    // Try to parse error message from response body
    if (responseBody) {
      try {
        const parsed = JSON.parse(responseBody);
        message = parsed.message || parsed.error || responseBody;
      } catch {
        message = responseBody;
      }
    }

    return new WIHYError(code, message, statusCode);
  }

  /**
   * Create a WIHYError from a native error
   */
  static fromError(error: Error): WIHYError {
    if (error instanceof WIHYError) {
      return error;
    }

    // Check for common error types
    if (error.message.includes('Network') || error.message.includes('network')) {
      return new WIHYError(ErrorCode.NETWORK_ERROR, error.message, undefined, error);
    }

    if (error.message.includes('timeout') || error.message.includes('Timeout')) {
      return new WIHYError(ErrorCode.TIMEOUT_ERROR, error.message, undefined, error);
    }

    return new WIHYError(ErrorCode.UNKNOWN_ERROR, error.message, undefined, error);
  }

  /**
   * Get user-friendly error message
   */
  getUserMessage(): string {
    return this.message || ErrorMessages[this.code];
  }

  /**
   * Check if error is recoverable (user can retry)
   */
  isRecoverable(): boolean {
    return [
      ErrorCode.NETWORK_ERROR,
      ErrorCode.TIMEOUT_ERROR,
      ErrorCode.SERVER_ERROR,
      ErrorCode.SERVICE_UNAVAILABLE,
      ErrorCode.RATE_LIMIT_EXCEEDED,
    ].includes(this.code);
  }

  /**
   * Check if this is a not found error
   */
  isNotFound(): boolean {
    return [ErrorCode.NOT_FOUND, ErrorCode.PRODUCT_NOT_FOUND].includes(this.code);
  }

  /**
   * Check if this is an authentication error
   */
  isAuthError(): boolean {
    return [ErrorCode.UNAUTHORIZED, ErrorCode.FORBIDDEN].includes(this.code);
  }

  /**
   * Convert to JSON for logging
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      stack: this.stack,
    };
  }
}

/**
 * Helper function to handle errors in async functions
 */
export async function withErrorHandling<T>(
  fn: () => Promise<T>,
  fallback?: T
): Promise<{ data: T | undefined; error: WIHYError | undefined }> {
  try {
    const data = await fn();
    return { data, error: undefined };
  } catch (error) {
    const wihyError = WIHYError.fromError(error as Error);
    console.error('[WIHY Error]', wihyError.toJSON());
    return { data: fallback, error: wihyError };
  }
}

/**
 * Format error for display in UI
 */
export function formatErrorForDisplay(error: unknown): string {
  if (error instanceof WIHYError) {
    return error.getUserMessage();
  }
  
  if (error instanceof Error) {
    return error.message || 'An unexpected error occurred';
  }
  
  return 'An unexpected error occurred';
}
