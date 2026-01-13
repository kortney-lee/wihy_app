/**
 * Image Compression Utilities for React Native
 * Optimizes images before uploading to WIHY services
 */

import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

export interface ImageCompressionOptions {
  maxSizeKB?: number;
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

const DEFAULT_OPTIONS: Required<ImageCompressionOptions> = {
  maxSizeKB: 800,
  maxWidth: 2048,
  maxHeight: 2048,
  quality: 0.85,
};

/**
 * Compress and optimize an image for upload
 * @param uri - Local image URI
 * @param options - Compression options
 * @returns Base64 encoded image data URI
 */
export async function compressImageForUpload(
  uri: string,
  options: ImageCompressionOptions = {}
): Promise<string> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  try {
    // Use single-pass compression for speed
    const compressed = await manipulateAsync(
      uri,
      [
        {
          resize: {
            width: opts.maxWidth,
            height: opts.maxHeight,
          },
        },
      ],
      {
        compress: opts.quality,
        format: SaveFormat.JPEG,
        base64: true,
      }
    );

    if (!compressed.base64) {
      throw new Error('Failed to generate base64 image');
    }

    return `data:image/jpeg;base64,${compressed.base64}`;
  } catch (error: any) {
    console.error('Image compression error:', error);
    throw new Error(`Failed to compress image: ${error.message}`);
  }
}

/**
 * Get the size of a base64 string in bytes
 */
function getBase64Size(base64: string): number {
  // Remove data URI prefix if present
  const base64Data = base64.split(',')[1] || base64;
  
  // Calculate size: base64 is ~1.37x larger than binary
  const padding = (base64Data.match(/=/g) || []).length;
  return (base64Data.length * 3) / 4 - padding;
}

/**
 * Validate image dimensions
 */
export async function validateImageDimensions(
  uri: string,
  maxWidth: number = 4000,
  maxHeight: number = 4000
): Promise<boolean> {
  try {
    const info = await manipulateAsync(uri, [], { compress: 1 });
    return info.width <= maxWidth && info.height <= maxHeight;
  } catch {
    return false;
  }
}

/**
 * Get optimized image info without compression
 */
export async function getImageInfo(uri: string): Promise<{
  width: number;
  height: number;
  estimatedSizeKB: number;
}> {
  const result = await manipulateAsync(uri, [], { compress: 0.9, base64: true });
  const sizeKB = result.base64 ? getBase64Size(result.base64) / 1024 : 0;
  
  return {
    width: result.width,
    height: result.height,
    estimatedSizeKB: Math.round(sizeKB),
  };
}
