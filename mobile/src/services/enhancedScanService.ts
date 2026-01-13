/**
 * Enhanced Scan Service Wrapper
 * Adds rate limiting and better error handling to existing scanService
 */

import { scanService } from './scanService';
import { globalRateLimiter } from '../utils/rateLimiter';
import { 
  WIHYError, 
  WIHYErrorCode, 
  createErrorFromResponse,
  createNetworkError,
  createImageError 
} from './errors';
import { compressImageForUpload } from '../utils/imageCompression';
import type { 
  BarcodeScanResult, 
  FoodPhotoScanResult,
  PillScanResult,
  LabelScanResult,
  ScanHistoryResult 
} from './types';

class EnhancedScanService {
  /**
   * Scan barcode with rate limiting and error handling
   */
  async scanBarcode(
    barcode: string, 
    userContext?: any
  ): Promise<BarcodeScanResult> {
    // Check rate limit
    if (!globalRateLimiter.canMakeRequest()) {
      throw new WIHYError(
        WIHYErrorCode.RATE_LIMIT_EXCEEDED,
        'Too many scan requests. Please wait a moment.',
        429
      );
    }

    try {
      return await scanService.scanBarcode(barcode, userContext);
    } catch (error: any) {
      throw this.handleError(error, 'Barcode scan failed');
    }
  }

  /**
   * Scan food photo with compression, rate limiting, and error handling
   */
  async scanFoodPhoto(
    imageUri: string,
    userContext?: any,
    compressionOptions?: { maxSizeKB?: number }
  ): Promise<FoodPhotoScanResult> {
    // Check rate limit
    if (!globalRateLimiter.canMakeRequest()) {
      throw new WIHYError(
        WIHYErrorCode.RATE_LIMIT_EXCEEDED,
        'Too many scan requests. Please wait a moment.',
        429
      );
    }

    try {
      // Compress image if it's a URI (not already base64)
      let imageData = imageUri;
      if (!imageUri.startsWith('data:image')) {
        console.log('[EnhancedScanService] Compressing food photo...');
        imageData = await compressImageForUpload(imageUri, {
          maxSizeKB: compressionOptions?.maxSizeKB || 500,
        });
      }

      return await scanService.scanFoodPhoto(imageData, userContext);
    } catch (error: any) {
      if (error.message?.includes('compress')) {
        throw createImageError('Failed to compress image', error);
      }
      throw this.handleError(error, 'Food photo scan failed');
    }
  }

  /**
   * Scan pill with compression, rate limiting, and error handling
   */
  async scanPill(
    imageUri: string,
    context?: { userId?: string; imprint?: string; color?: string; shape?: string }
  ): Promise<PillScanResult> {
    // Check rate limit
    if (!globalRateLimiter.canMakeRequest()) {
      throw new WIHYError(
        WIHYErrorCode.RATE_LIMIT_EXCEEDED,
        'Too many scan requests. Please wait a moment.',
        429
      );
    }

    try {
      // Compress image if needed
      let imageData = imageUri;
      if (!imageUri.startsWith('data:image')) {
        console.log('[EnhancedScanService] Compressing pill photo...');
        imageData = await compressImageForUpload(imageUri, { maxSizeKB: 500 });
      }

      return await scanService.scanPill(imageData, context);
    } catch (error: any) {
      if (error.message?.includes('compress')) {
        throw createImageError('Failed to compress image', error);
      }
      throw this.handleError(error, 'Pill scan failed');
    }
  }

  /**
   * Scan label with compression, rate limiting, and error handling
   */
  async scanLabel(
    imageUri: string,
    userContext?: any
  ): Promise<LabelScanResult> {
    // Check rate limit
    if (!globalRateLimiter.canMakeRequest()) {
      throw new WIHYError(
        WIHYErrorCode.RATE_LIMIT_EXCEEDED,
        'Too many scan requests. Please wait a moment.',
        429
      );
    }

    try {
      // Compress image if needed
      let imageData = imageUri;
      if (!imageUri.startsWith('data:image')) {
        console.log('[EnhancedScanService] Compressing label photo...');
        imageData = await compressImageForUpload(imageUri, { maxSizeKB: 500 });
      }

      return await scanService.scanLabel(imageData, userContext);
    } catch (error: any) {
      if (error.message?.includes('compress')) {
        throw createImageError('Failed to compress image', error);
      }
      throw this.handleError(error, 'Label scan failed');
    }
  }

  /**
   * Get scan history with error handling
   */
  async getScanHistory(
    userId: string,
    options?: {
      limit?: number;
      scanType?: 'barcode' | 'image' | 'pill' | 'label';
      includeImages?: boolean;
    }
  ): Promise<ScanHistoryResult> {
    try {
      return await scanService.getScanHistory(userId, options);
    } catch (error: any) {
      throw this.handleError(error, 'Failed to fetch scan history');
    }
  }

  /**
   * Delete scan with error handling
   */
  async deleteScan(
    scanId: number,
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      return await scanService.deleteScan(scanId, userId);
    } catch (error: any) {
      throw this.handleError(error, 'Failed to delete scan');
    }
  }

  /**
   * Confirm pill identification
   */
  async confirmPill(
    scanId: string,
    selectedRxcui: string,
    userId?: string
  ): Promise<any> {
    try {
      return await scanService.confirmPill(scanId, selectedRxcui, userId);
    } catch (error: any) {
      throw this.handleError(error, 'Failed to confirm pill');
    }
  }

  /**
   * Wait for rate limit slot and then execute scan
   */
  async scanWithWait<T>(
    scanFn: () => Promise<T>
  ): Promise<T> {
    await globalRateLimiter.waitForNextSlot();
    return scanFn();
  }

  /**
   * Retry scan with exponential backoff
   */
  async scanWithRetry<T>(
    scanFn: () => Promise<T>,
    maxRetries: number = 3
  ): Promise<T> {
    let lastError: any;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await scanFn();
      } catch (error: any) {
        lastError = error;
        
        // Only retry on network or server errors
        if (error instanceof WIHYError && error.isRetryable()) {
          const backoffMs = 1000 * Math.pow(2, attempt - 1);
          console.log(
            `[EnhancedScanService] Retry attempt ${attempt}/${maxRetries} ` +
            `after ${backoffMs}ms`
          );
          await new Promise(resolve => setTimeout(resolve, backoffMs));
          continue;
        }
        
        // Non-retryable error, throw immediately
        throw error;
      }
    }

    throw lastError;
  }

  /**
   * Handle and convert errors to WIHYError
   */
  private handleError(error: any, context: string): WIHYError {
    // Already a WIHYError
    if (error instanceof WIHYError) {
      return error;
    }

    // Network error
    if (error.message?.includes('Network request failed') || 
        error.message?.includes('Failed to fetch')) {
      return createNetworkError(error);
    }

    // HTTP error (from scanService)
    if (error.message?.includes('HTTP error')) {
      const match = error.message.match(/HTTP error! status: (\d+)/);
      if (match) {
        const statusCode = parseInt(match[1]);
        return createErrorFromResponse(statusCode, context, error);
      }
    }

    // Generic error
    return new WIHYError(
      WIHYErrorCode.UNKNOWN_ERROR,
      `${context}: ${error.message || 'Unknown error'}`,
      undefined,
      error
    );
  }
}

// Export singleton instance
export const enhancedScanService = new EnhancedScanService();

/**
 * Example usage:
 * 
 * // Simple scan with rate limiting
 * const result = await enhancedScanService.scanBarcode('012345678905');
 * 
 * // Scan with automatic retry
 * const result = await enhancedScanService.scanWithRetry(() => 
 *   enhancedScanService.scanBarcode('012345678905')
 * );
 * 
 * // Wait for rate limit slot
 * const result = await enhancedScanService.scanWithWait(() =>
 *   enhancedScanService.scanFoodPhoto(imageUri)
 * );
 * 
 * // Error handling
 * try {
 *   const result = await enhancedScanService.scanBarcode(barcode);
 * } catch (error) {
 *   if (error instanceof WIHYError) {
 *     Alert.alert('Error', error.getUserMessage());
 *     error.logError(); // Detailed logging
 *   }
 * }
 */
