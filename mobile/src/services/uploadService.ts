/**
 * Upload Service
 * 
 * Handles image uploads to Google Cloud Storage via signed URLs.
 * Used for progress photos and scan images.
 * 
 * Flow:
 * 1. Get signed upload URL from backend
 * 2. Upload image directly to GCS
 * 3. Return public URL for storage in database
 */

// @ts-ignore - expo-file-system may not have types in all configurations
import * as FileSystem from 'expo-file-system';
import { servicesApi } from './servicesApiClient';
import { GetUploadUrlResponse } from '../types/scan.types';

// ============================================
// TYPES
// ============================================

export interface UploadResult {
  success: boolean;
  imageUrl: string;
  blobName: string;
}

export interface UploadProgress {
  totalBytesSent: number;
  totalBytesExpectedToSend: number;
  percentage: number;
}

// ============================================
// UPLOAD SERVICE CLASS
// ============================================

class UploadService {
  /**
   * Get signed upload URL from backend
   */
  async getSignedUploadUrl(extension: string = 'jpg'): Promise<GetUploadUrlResponse> {
    return servicesApi.get<GetUploadUrlResponse>(
      '/api/scan/upload-url',
      { extension }
    );
  }

  /**
   * Upload an image to Google Cloud Storage
   * 
   * @param localUri - Local file URI (file:// or content://)
   * @param folder - Target folder (e.g., 'progress-photos', 'scans')
   * @returns Upload result with public URL
   */
  async uploadImage(localUri: string, folder?: string): Promise<UploadResult> {
    // Determine file extension
    const extension = this.getExtensionFromUri(localUri);

    // Get signed upload URL
    const { uploadUrl, blobName } = await this.getSignedUploadUrl(extension);

    // Upload directly to GCS
    const uploadResult = await FileSystem.uploadAsync(uploadUrl, localUri, {
      httpMethod: 'PUT',
      headers: {
        'Content-Type': this.getContentType(extension),
      },
    });

    if (uploadResult.status !== 200) {
      throw new Error(`Upload failed with status: ${uploadResult.status}`);
    }

    // Extract public URL (remove query params from signed URL)
    const imageUrl = uploadUrl.split('?')[0];

    return {
      success: true,
      imageUrl,
      blobName,
    };
  }

  /**
   * Upload a progress photo
   */
  async uploadProgressPhoto(
    localUri: string,
    type: 'front' | 'side' | 'back',
    notes?: string
  ): Promise<UploadResult & { photoId?: string }> {
    // Upload image first
    const uploadResult = await this.uploadImage(localUri, 'progress-photos');

    // Save reference in database
    const photoResponse = await servicesApi.post<{
      success: boolean;
      photo: { id: string };
    }>('/api/progress/photos', {
      image_url: uploadResult.imageUrl,
      type,
      date: new Date().toISOString().split('T')[0],
      notes,
    });

    return {
      ...uploadResult,
      photoId: photoResponse.photo?.id,
    };
  }

  /**
   * Upload multiple images
   */
  async uploadMultiple(
    localUris: string[],
    onProgress?: (completed: number, total: number) => void
  ): Promise<UploadResult[]> {
    const results: UploadResult[] = [];
    const total = localUris.length;

    for (let i = 0; i < localUris.length; i++) {
      const result = await this.uploadImage(localUris[i]);
      results.push(result);
      onProgress?.(i + 1, total);
    }

    return results;
  }

  /**
   * Upload from base64 data
   */
  async uploadBase64(
    base64Data: string,
    extension: string = 'jpg'
  ): Promise<UploadResult> {
    // Create temporary file
    const tempUri = `${FileSystem.cacheDirectory}temp_upload_${Date.now()}.${extension}`;
    
    // Remove data URL prefix if present
    const cleanBase64 = base64Data.replace(/^data:image\/\w+;base64,/, '');
    
    // Write base64 to temp file
    await FileSystem.writeAsStringAsync(tempUri, cleanBase64, {
      encoding: FileSystem.EncodingType.Base64,
    });

    try {
      // Upload the temp file
      const result = await this.uploadImage(tempUri);
      
      // Clean up temp file
      await FileSystem.deleteAsync(tempUri, { idempotent: true });
      
      return result;
    } catch (error) {
      // Clean up on error
      await FileSystem.deleteAsync(tempUri, { idempotent: true });
      throw error;
    }
  }

  /**
   * Check if a file exists and is readable
   */
  async validateFile(uri: string): Promise<{
    valid: boolean;
    size?: number;
    error?: string;
  }> {
    try {
      const info = await FileSystem.getInfoAsync(uri);
      
      if (!info.exists) {
        return { valid: false, error: 'File does not exist' };
      }

      // Check file size (max 10MB)
      const maxSize = 10 * 1024 * 1024;
      if (info.size && info.size > maxSize) {
        return { 
          valid: false, 
          size: info.size,
          error: 'File too large (max 10MB)' 
        };
      }

      return { valid: true, size: info.size };
    } catch (error: any) {
      return { valid: false, error: error.message };
    }
  }

  /**
   * Get file extension from URI
   */
  private getExtensionFromUri(uri: string): string {
    const match = uri.match(/\.(\w+)(?:\?|$)/);
    if (match) {
      return match[1].toLowerCase();
    }
    return 'jpg'; // Default to jpg
  }

  /**
   * Get content type from extension
   */
  private getContentType(extension: string): string {
    const types: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
      heic: 'image/heic',
      heif: 'image/heif',
    };
    return types[extension.toLowerCase()] || 'application/octet-stream';
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}

// Export singleton
export const uploadService = new UploadService();

export default uploadService;
