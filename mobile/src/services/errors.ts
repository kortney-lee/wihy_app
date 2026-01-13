/**
 * WIHY Service Error Types
 * Standardized error handling for all API services
 */

export enum WIHYErrorCode {
  // Image errors
  INVALID_IMAGE = 'INVALID_IMAGE',
  IMAGE_PROCESSING_FAILED = 'IMAGE_PROCESSING_FAILED',
  IMAGE_TOO_LARGE = 'IMAGE_TOO_LARGE',
  
  // Network errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  
  // Server errors
  SERVER_ERROR = 'SERVER_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  
  // Data errors
  INVALID_RESPONSE = 'INVALID_RESPONSE',
  DECODING_ERROR = 'DECODING_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  
  // Rate limiting
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  
  // Service availability
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  MAINTENANCE_MODE = 'MAINTENANCE_MODE',
  
  // Generic
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export class WIHYError extends Error {
  constructor(
    public code: WIHYErrorCode,
    message: string,
    public statusCode?: number,
    public originalError?: any
  ) {
    super(message);
    this.name = 'WIHYError';
    
    // Maintains proper stack trace for where error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, WIHYError);
    }
  }

  /**
   * Get user-friendly error message
   */
  getUserMessage(): string {
    switch (this.code) {
      case WIHYErrorCode.INVALID_IMAGE:
        return 'Invalid image format. Please try a different photo.';
      
      case WIHYErrorCode.IMAGE_PROCESSING_FAILED:
        return 'Failed to process image. Please try again.';
      
      case WIHYErrorCode.IMAGE_TOO_LARGE:
        return 'Image is too large. Please use a smaller photo.';
      
      case WIHYErrorCode.NETWORK_ERROR:
        return 'Network connection error. Please check your internet connection.';
      
      case WIHYErrorCode.TIMEOUT_ERROR:
        return 'Request timed out. Please try again.';
      
      case WIHYErrorCode.SERVER_ERROR:
        return 'Server error occurred. Please try again later.';
      
      case WIHYErrorCode.NOT_FOUND:
        return 'Product not found. Try taking a photo of the nutrition label.';
      
      case WIHYErrorCode.UNAUTHORIZED:
        return 'Authentication required. Please sign in.';
      
      case WIHYErrorCode.INVALID_RESPONSE:
        return 'Received invalid response from server.';
      
      case WIHYErrorCode.DECODING_ERROR:
        return 'Failed to parse server response.';
      
      case WIHYErrorCode.VALIDATION_ERROR:
        return 'Invalid data provided.';
      
      case WIHYErrorCode.RATE_LIMIT_EXCEEDED:
        return 'Too many requests. Please wait a moment and try again.';
      
      case WIHYErrorCode.SERVICE_UNAVAILABLE:
        return 'Service temporarily unavailable. Please try again later.';
      
      case WIHYErrorCode.MAINTENANCE_MODE:
        return 'Service is under maintenance. Please try again later.';
      
      case WIHYErrorCode.UNKNOWN_ERROR:
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }

  /**
   * Check if error is retryable
   */
  isRetryable(): boolean {
    const retryableCodes = [
      WIHYErrorCode.NETWORK_ERROR,
      WIHYErrorCode.TIMEOUT_ERROR,
      WIHYErrorCode.SERVER_ERROR,
      WIHYErrorCode.SERVICE_UNAVAILABLE,
    ];
    
    return retryableCodes.includes(this.code);
  }

  /**
   * Log error details for debugging
   */
  logError(): void {
    console.error('=== WIHY ERROR ===');
    console.error('Code:', this.code);
    console.error('Message:', this.message);
    console.error('User Message:', this.getUserMessage());
    console.error('Status Code:', this.statusCode);
    console.error('Original Error:', this.originalError);
    console.error('Stack:', this.stack);
    console.error('==================');
  }
}

/**
 * Create error from HTTP response
 */
export function createErrorFromResponse(
  statusCode: number,
  responseText?: string,
  originalError?: any
): WIHYError {
  let code: WIHYErrorCode;
  let message: string;

  switch (statusCode) {
    case 400:
      code = WIHYErrorCode.VALIDATION_ERROR;
      message = 'Invalid request data';
      break;
    
    case 401:
      code = WIHYErrorCode.UNAUTHORIZED;
      message = 'Authentication required';
      break;
    
    case 404:
      code = WIHYErrorCode.NOT_FOUND;
      message = 'Resource not found';
      break;
    
    case 429:
      code = WIHYErrorCode.RATE_LIMIT_EXCEEDED;
      message = 'Rate limit exceeded';
      break;
    
    case 500:
    case 502:
    case 503:
      code = WIHYErrorCode.SERVER_ERROR;
      message = 'Server error';
      break;
    
    case 504:
      code = WIHYErrorCode.TIMEOUT_ERROR;
      message = 'Request timeout';
      break;
    
    default:
      code = WIHYErrorCode.UNKNOWN_ERROR;
      message = `HTTP error ${statusCode}`;
  }

  if (responseText) {
    message += `: ${responseText}`;
  }

  return new WIHYError(code, message, statusCode, originalError);
}

/**
 * Create error from network failure
 */
export function createNetworkError(originalError?: any): WIHYError {
  return new WIHYError(
    WIHYErrorCode.NETWORK_ERROR,
    'Network request failed',
    undefined,
    originalError
  );
}

/**
 * Create error from timeout
 */
export function createTimeoutError(): WIHYError {
  return new WIHYError(
    WIHYErrorCode.TIMEOUT_ERROR,
    'Request timed out'
  );
}

/**
 * Create error from image processing failure
 */
export function createImageError(message: string, originalError?: any): WIHYError {
  return new WIHYError(
    WIHYErrorCode.IMAGE_PROCESSING_FAILED,
    message,
    undefined,
    originalError
  );
}
