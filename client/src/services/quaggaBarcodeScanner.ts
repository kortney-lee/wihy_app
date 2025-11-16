// QuaggaJS Barcode Scanner Integration
// Replaces ZXing with more reliable and lightweight QuaggaJS

import Quagga from 'quagga';

interface QuaggaBarcodeResult {
  success: boolean;
  barcodes: string[];
  error?: string;
}

class QuaggaBarcodeScanner {
  private isInitialized: boolean = false;

  /**
   * Initialize QuaggaJS with optimized settings for food barcodes
   */
  private async initializeQuagga(): Promise<void> {
    if (this.isInitialized) return;

    return new Promise((resolve, reject) => {
      const config = {
        inputStream: {
          name: 'Live',
          type: 'LiveStream',
          target: null, // Will be set dynamically
          constraints: {
            width: 640,
            height: 480,
            facingMode: 'environment' // Back camera preferred
          }
        },
        locator: {
          patchSize: 'medium',
          halfSample: true
        },
        numOfWorkers: 2,
        decoder: {
          readers: [
            'code_128_reader',  // Common for food products
            'ean_reader',       // EAN-13, EAN-8
            'ean_8_reader',
            'code_39_reader',
            'code_39_vin_reader',
            'codabar_reader',
            'upc_reader',       // UPC-A, UPC-E
            'upc_e_reader'
          ]
        },
        locate: true
      };

      Quagga.init(config, (error: any) => {
        if (error) {
          console.error('QuaggaJS initialization failed:', error);
          reject(error);
          return;
        }
        
        this.isInitialized = true;
        console.log('✅ QuaggaJS initialized successfully');
        resolve();
      });
    });
  }

  /**
   * Scan barcodes from image file using QuaggaJS
   */
  async scanImageFile(imageFile: File): Promise<QuaggaBarcodeResult> {
    try {
      console.log('🔍 QuaggaJS: Scanning image file for barcodes');
      
      const barcodes = await this.processImageWithQuagga(imageFile);
      
      if (barcodes.length > 0) {
        console.log('✅ QuaggaJS detected barcodes:', barcodes);
        return {
          success: true,
          barcodes: barcodes
        };
      } else {
        console.log('ℹ️ QuaggaJS: No barcodes detected in image');
        return {
          success: false,
          barcodes: [],
          error: 'No barcodes detected'
        };
      }
    } catch (error) {
      console.error('❌ QuaggaJS scanning error:', error);
      return {
        success: false,
        barcodes: [],
        error: error instanceof Error ? error.message : 'Scanning failed'
      };
    }
  }

  /**
   * Process image file with QuaggaJS
   */
  private async processImageWithQuagga(imageFile: File): Promise<string[]> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      img.onload = () => {
        try {
          // Set canvas dimensions
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          
          // QuaggaJS configuration for image processing
          const config = {
            decoder: {
              readers: [
                'code_128_reader',
                'ean_reader',
                'ean_8_reader',
                'code_39_reader',
                'upc_reader',
                'upc_e_reader'
              ]
            },
            locate: true,
            src: canvas.toDataURL('image/jpeg', 0.8)
          };

          Quagga.decodeSingle(config, (result: any) => {
            if (result && result.codeResult) {
              const barcode = result.codeResult.code;
              const normalizedBarcode = this.normalizeBarcode(barcode);
              resolve([normalizedBarcode]);
            } else {
              resolve([]);
            }
          });
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(imageFile);
    });
  }

  /**
   * Start live camera scanning
   */
  async startLiveScanning(videoElement: HTMLVideoElement, onDetected: (barcode: string) => void): Promise<void> {
    try {
      console.log('📹 Starting QuaggaJS live camera scanning');
      
      const config = {
        inputStream: {
          name: 'Live',
          type: 'LiveStream',
          target: videoElement,
          constraints: {
            width: 640,
            height: 480,
            facingMode: 'environment'
          }
        },
        locator: {
          patchSize: 'medium',
          halfSample: true
        },
        numOfWorkers: navigator.hardwareConcurrency || 2,
        decoder: {
          readers: [
            'code_128_reader',
            'ean_reader',
            'ean_8_reader',
            'upc_reader',
            'upc_e_reader'
          ]
        },
        locate: true
      };

      await new Promise<void>((resolve, reject) => {
        Quagga.init(config, (error: any) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      });

      // Start scanning
      Quagga.start();

      // Listen for barcode detections
      Quagga.onDetected((result: any) => {
        if (result && result.codeResult) {
          const barcode = result.codeResult.code;
          const normalizedBarcode = this.normalizeBarcode(barcode);
          console.log('📱 QuaggaJS live detection:', barcode, '→', normalizedBarcode);
          onDetected(normalizedBarcode);
        }
      });

    } catch (error) {
      console.error('❌ QuaggaJS live scanning failed:', error);
      throw error;
    }
  }

  /**
   * Stop live scanning and cleanup
   */
  stopLiveScanning(): void {
    try {
      Quagga.stop();
      console.log('🛑 QuaggaJS live scanning stopped');
    } catch (error) {
      console.error('⚠️ Error stopping QuaggaJS:', error);
    }
  }

  /**
   * Normalize barcode to GTIN-14 format for consistent food product lookup
   */
  private normalizeBarcode(barcode: string): string {
    // Remove any non-digit characters
    const digits = barcode.replace(/\D/g, '');
    
    // Handle different UPC/EAN formats and normalize to GTIN-14
    switch (digits.length) {
      case 8:  // EAN-8
        return '000000' + digits;
      case 12: // UPC-A
        return '00' + digits;
      case 13: // EAN-13
        return '0' + digits;
      case 14: // Already GTIN-14
        return digits;
      default:
        // For other lengths, pad or truncate to 14 digits
        if (digits.length < 14) {
          return digits.padStart(14, '0');
        } else {
          return digits.substring(0, 14);
        }
    }
  }

  /**
   * Check if QuaggaJS is supported in the current browser
   */
  static isSupported(): boolean {
    return (
      typeof navigator !== 'undefined' &&
      typeof navigator.mediaDevices !== 'undefined' &&
      typeof navigator.mediaDevices.getUserMedia === 'function' &&
      typeof Worker !== 'undefined'
    );
  }
}

// Export singleton instance
export const quaggaBarcodeScanner = new QuaggaBarcodeScanner();
export default quaggaBarcodeScanner;