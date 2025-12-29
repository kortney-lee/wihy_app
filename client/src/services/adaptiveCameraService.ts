/**
 * Adaptive Camera Service
 * Uses Capacitor Camera on mobile, web getUserMedia on desktop
 */

import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { PlatformDetectionService } from './shared/platformDetectionService';

export class AdaptiveCameraService {
  /**
   * Capture image from camera
   * Uses native camera on mobile, web camera on desktop
   * @returns Data URL of captured image
   */
  static async captureImage(): Promise<string> {
    if (PlatformDetectionService.isNative()) {
      console.log('[MOBILE] Using native Capacitor Camera');
      
      // Use Capacitor Camera on mobile
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
        saveToGallery: false
      });
      
      return image.dataUrl!;
    } else {
      console.log(' Using web getUserMedia API');
      
      // For web, return a promise that resolves when user captures from web camera
      // This would integrate with your existing web camera logic
      throw new Error('Web camera capture should use existing ImageUploadModal flow');
    }
  }

  /**
   * Select image from gallery/file system
   * @returns Data URL of selected image
   */
  static async selectImage(): Promise<string> {
    if (PlatformDetectionService.isNative()) {
      console.log('[MOBILE] Using native photo picker');
      
      // Use Capacitor Camera to pick from gallery
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Photos
      });
      
      return image.dataUrl!;
    } else {
      console.log(' Using web file picker');
      
      // For web, return a promise that resolves when user selects file
      // This would integrate with your existing file input logic
      throw new Error('Web file selection should use existing ImageUploadModal flow');
    }
  }

  /**
   * Check if camera is available
   */
  static async checkCameraAvailability(): Promise<boolean> {
    try {
      if (PlatformDetectionService.isNative()) {
        // On mobile, camera is typically available
        // Could add actual permission check here
        return true;
      } else {
        // On web, check if getUserMedia is available
        return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
      }
    } catch (error) {
      console.error('Camera availability check failed:', error);
      return false;
    }
  }

  /**
   * Request camera permissions (mobile only)
   */
  static async requestCameraPermissions(): Promise<boolean> {
    if (PlatformDetectionService.isNative()) {
      try {
        // Attempting to use camera will trigger permission request
        await Camera.checkPermissions();
        const permissions = await Camera.requestPermissions();
        return permissions.camera === 'granted';
      } catch (error) {
        console.error('Failed to request camera permissions:', error);
        return false;
      }
    }
    return true; // Web doesn't need pre-request
  }

  /**
   * Convert data URL to File object
   * Useful for QuaggaJS barcode scanning
   */
  static dataURLToFile(dataURL: string, filename: string = 'camera-capture.jpg'): File {
    const arr = dataURL.split(',');
    const mime = arr[0].match(/:(.*?);/)![1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  }

  /**
   * Convert File to data URL
   */
  static fileToDataURL(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}
