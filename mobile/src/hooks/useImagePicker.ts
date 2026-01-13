/**
 * useImagePicker Hook
 * 
 * React hook for capturing and uploading progress photos.
 * Integrates with device camera/gallery and upload service.
 */

import { useState, useCallback } from 'react';
import { launchCamera, launchImageLibrary, ImagePickerResponse, MediaType, PhotoQuality } from 'react-native-image-picker';
import uploadService from '../services/uploadService';
import { PhotoType } from '../types/progress.types';

// ============================================
// TYPES
// ============================================

interface ImagePickerOptions {
  mediaType?: MediaType;
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
  includeBase64?: boolean;
}

interface UseImagePickerReturn {
  // State
  uploading: boolean;
  progress: number;
  error: string | null;
  
  // Actions
  pickFromGallery: (options?: ImagePickerOptions) => Promise<string | null>;
  takePhoto: (options?: ImagePickerOptions) => Promise<string | null>;
  uploadPhoto: (localUri: string, type: PhotoType, notes?: string) => Promise<{
    success: boolean;
    imageUrl?: string;
    photoId?: string;
    error?: string;
  }>;
  uploadProgressPhoto: (type: PhotoType, useCamera?: boolean, notes?: string) => Promise<{
    success: boolean;
    imageUrl?: string;
    photoId?: string;
    error?: string;
  }>;
  clearError: () => void;
}

// ============================================
// DEFAULT OPTIONS
// ============================================

const DEFAULT_OPTIONS = {
  mediaType: 'photo' as MediaType,
  quality: 0.8 as PhotoQuality,
  maxWidth: 1920,
  maxHeight: 1920,
  includeBase64: false,
};

// ============================================
// HOOK IMPLEMENTATION
// ============================================

export function useImagePicker(): UseImagePickerReturn {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  /**
   * Handle image picker response
   */
  const handleResponse = useCallback((response: ImagePickerResponse): string | null => {
    if (response.didCancel) {
      return null;
    }

    if (response.errorCode) {
      const errorMessages: Record<string, string> = {
        camera_unavailable: 'Camera not available on this device',
        permission: 'Camera/gallery permission denied',
        others: response.errorMessage || 'Unknown error occurred',
      };
      setError(errorMessages[response.errorCode] || response.errorMessage || 'Error selecting image');
      return null;
    }

    const asset = response.assets?.[0];
    if (!asset?.uri) {
      setError('No image selected');
      return null;
    }

    return asset.uri;
  }, []);

  /**
   * Pick image from gallery
   */
  const pickFromGallery = useCallback(async (options?: ImagePickerOptions): Promise<string | null> => {
    setError(null);
    
    try {
      const response = await launchImageLibrary({
        mediaType: options?.mediaType || 'photo',
        quality: (options?.quality || 0.8) as PhotoQuality,
        maxWidth: options?.maxWidth || 1920,
        maxHeight: options?.maxHeight || 1920,
        includeBase64: options?.includeBase64 || false,
      });
      return handleResponse(response);
    } catch (err: any) {
      setError(err.message || 'Failed to open gallery');
      return null;
    }
  }, [handleResponse]);

  /**
   * Take photo with camera
   */
  const takePhoto = useCallback(async (options?: ImagePickerOptions): Promise<string | null> => {
    setError(null);
    
    try {
      const response = await launchCamera({
        mediaType: options?.mediaType || 'photo',
        quality: (options?.quality || 0.8) as PhotoQuality,
        maxWidth: options?.maxWidth || 1920,
        maxHeight: options?.maxHeight || 1920,
        includeBase64: options?.includeBase64 || false,
      });
      return handleResponse(response);
    } catch (err: any) {
      setError(err.message || 'Failed to open camera');
      return null;
    }
  }, [handleResponse]);

  /**
   * Upload a photo to cloud storage
   */
  const uploadPhoto = useCallback(async (
    localUri: string,
    type: PhotoType,
    notes?: string
  ): Promise<{ success: boolean; imageUrl?: string; photoId?: string; error?: string }> => {
    setUploading(true);
    setProgress(0);
    setError(null);

    try {
      // Validate file first
      const validation = await uploadService.validateFile(localUri);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      setProgress(25);

      // Upload to cloud storage
      const result = await uploadService.uploadProgressPhoto(localUri, type, notes);
      
      setProgress(100);
      setUploading(false);

      return {
        success: true,
        imageUrl: result.imageUrl,
        photoId: result.photoId,
      };
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to upload photo';
      setError(errorMsg);
      setUploading(false);
      setProgress(0);
      
      return {
        success: false,
        error: errorMsg,
      };
    }
  }, []);

  /**
   * Capture and upload a progress photo in one step
   */
  const uploadProgressPhoto = useCallback(async (
    type: PhotoType,
    useCamera: boolean = false,
    notes?: string
  ): Promise<{ success: boolean; imageUrl?: string; photoId?: string; error?: string }> => {
    // Get image
    const localUri = useCamera ? await takePhoto() : await pickFromGallery();
    
    if (!localUri) {
      return { success: false, error: 'No image selected' };
    }

    // Upload it
    return uploadPhoto(localUri, type, notes);
  }, [takePhoto, pickFromGallery, uploadPhoto]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    uploading,
    progress,
    error,
    
    // Actions
    pickFromGallery,
    takePhoto,
    uploadPhoto,
    uploadProgressPhoto,
    clearError,
  };
}

export default useImagePicker;
