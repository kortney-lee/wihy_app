import { wihyScanningService } from './wihyScanningService';
import { createRoot, Root } from 'react-dom/client';
import React from 'react';
import Spinner from '../components/ui/Spinner';
import ImageScanning from '../components/ui/ImageScanning';

export interface ScanResult {
  success: boolean;
  type: 'barcode_scan' | 'image_analysis' | 'error';
  data?: any;
  error?: string;
  userQuery?: string;
  sessionId?: string;
}

export class ScanningService {
  private static instance: ScanningService;
  private spinnerContainer: HTMLElement | null = null;
  private spinnerRoot: Root | null = null;
  private scanningContainer: HTMLElement | null = null;
  private scanningRoot: Root | null = null;

  private constructor() {}

  static getInstance(): ScanningService {
    if (!ScanningService.instance) {
      ScanningService.instance = new ScanningService();
    }
    return ScanningService.instance;
  }



  /**
   * Show spinner overlay
   */
  private showSpinner(message: string) {
    if (this.spinnerContainer) return; // Already showing

    this.spinnerContainer = document.createElement('div');
    this.spinnerContainer.id = 'scanning-service-spinner';
    document.body.appendChild(this.spinnerContainer);

    const spinnerElement = React.createElement(Spinner, {
      overlay: true,
      title: 'Analyzing with AI...',
      subtitle: message,
      disableEsc: true
    });

    this.spinnerRoot = createRoot(this.spinnerContainer);
    this.spinnerRoot.render(spinnerElement);
  }

  /**
   * Hide spinner overlay
   */
  private hideSpinner() {
    if (!this.spinnerContainer || !this.spinnerRoot) return;

    this.spinnerRoot.unmount();
    document.body.removeChild(this.spinnerContainer);
    this.spinnerContainer = null;
    this.spinnerRoot = null;
  }

  /**
   * Open camera with live barcode scanning using React component
   */
  async openCameraWithBarcodeScanning(
    onBarcodeDetected: (barcode: string) => void, 
    onClose: () => void,
    onPhotoCapture?: (file: File) => void
  ): Promise<void> {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Camera access is not available on this device.');
    }

    // Create container for React component
    if (this.scanningContainer) return; // Already showing

    this.scanningContainer = document.createElement('div');
    this.scanningContainer.id = 'scanning-service-camera';
    document.body.appendChild(this.scanningContainer);

    const handleBarcodeDetected = async (barcode: string) => {
      console.log('[MOBILE] Barcode detected in React component:', barcode);
      
      // Hide camera component
      this.hideCameraScanning();
      
      // Show spinner
      this.showSpinner(`Looking up product ${barcode}...`);
      
      try {
        await onBarcodeDetected(barcode);
      } finally {
        this.hideSpinner();
      }
    };

    const handleClose = () => {
      this.hideCameraScanning();
      onClose();
    };

    const scanningElement = React.createElement(ImageScanning, {
      isOpen: true,
      onClose: handleClose,
      onBarcodeDetected: handleBarcodeDetected,
      onPhotoCapture: onPhotoCapture ? async (file: File) => {
        this.hideCameraScanning();
        onPhotoCapture(file);
      } : undefined
    });

    this.scanningRoot = createRoot(this.scanningContainer);
    this.scanningRoot.render(scanningElement);
  }

  /**
   * Hide camera scanning component
   */
  private hideCameraScanning() {
    if (!this.scanningContainer || !this.scanningRoot) return;

    this.scanningRoot.unmount();
    document.body.removeChild(this.scanningContainer);
    this.scanningContainer = null;
    this.scanningRoot = null;
  }



  /**
   * Scan a barcode and return structured result
   */
  async scanBarcode(barcode: string): Promise<ScanResult> {
    console.log('[SEARCH] Scanning barcode:', barcode);
    
    try {
      const barcodeResult = await wihyScanningService.scanBarcode(barcode);
      
      if (barcodeResult.success) {
        return {
          success: true,
          type: 'barcode_scan',
          data: barcodeResult,
          userQuery: `Scanned barcode: ${barcode}`,
          sessionId: (barcodeResult as any).sessionId
        };
      } else {
        return {
          success: false,
          type: 'error',
          error: barcodeResult.error || 'Barcode not found in database'
        };
      }
    } catch (error) {
      console.error('[X] Barcode scanning error:', error);
      return {
        success: false,
        type: 'error',
        error: 'Barcode scanning failed. Please try again.'
      };
    }
  }

  /**
   * Process an image file for analysis
   */
  async analyzeImage(file: File): Promise<ScanResult> {
    console.log('[SEARCH] Analyzing image:', file.name);
    
    try {
      // Use existing image processing logic from wihyScanningService
      // This would need to be implemented based on your existing image analysis logic
      
      return {
        success: true,
        type: 'image_analysis',
        data: { /* image analysis result */ },
        userQuery: `Uploaded image: ${file.name}`
      };
    } catch (error) {
      console.error('[X] Image analysis error:', error);
      return {
        success: false,
        type: 'error',
        error: 'Image analysis failed. Please try again.'
      };
    }
  }
}

export const scanningService = ScanningService.getInstance();