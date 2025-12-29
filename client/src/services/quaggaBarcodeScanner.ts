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
        console.log('[OK] QuaggaJS initialized successfully');
        resolve();
      });
    });
  }

  /**
   * Scan barcodes from image file using QuaggaJS
   */
  async scanImageFile(imageFile: File): Promise<QuaggaBarcodeResult> {
    try {
      console.log('[SEARCH] QuaggaJS: Scanning image file for barcodes');
      
      const barcodes = await this.processImageWithQuagga(imageFile);
      
      if (barcodes.length > 0) {
        console.log('[OK] QuaggaJS detected barcodes:', barcodes);
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
      console.error('[X] QuaggaJS scanning error:', error);
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
          // Set canvas dimensions - scale up for better detection
          const maxDimension = 1280;
          const scale = Math.min(maxDimension / img.width, maxDimension / img.height, 1);
          canvas.width = img.width * scale;
          canvas.height = img.height * scale;
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          const detectedBarcodes: string[] = [];
          let attemptCount = 0;
          const maxAttempts = 3;

          const tryDecode = () => {
            attemptCount++;
            console.log(`[SEARCH] QuaggaJS attempt ${attemptCount}/${maxAttempts}`);

            // Try different image processing techniques for better detection
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            
            // Enhance contrast for better barcode detection
            if (attemptCount > 1) {
              const data = imageData.data;
              for (let i = 0; i < data.length; i += 4) {
                // Increase contrast
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                const gray = 0.299 * r + 0.587 * g + 0.114 * b;
                const enhanced = gray < 128 ? gray * 0.8 : gray * 1.2;
                data[i] = data[i + 1] = data[i + 2] = Math.min(255, Math.max(0, enhanced));
              }
              ctx.putImageData(imageData, 0, 0);
            }

            const config = {
              decoder: {
                readers: [
                  'ean_reader',       // Try EAN first (most common for food)
                  'upc_reader',       // UPC barcodes
                  'upc_e_reader',     // UPC-E
                  'ean_8_reader',     // EAN-8
                  'code_128_reader',  // Code 128
                  'code_39_reader'    // Code 39
                ],
                multiple: false
              },
              locate: true,
              numOfWorkers: 0, // Use main thread for static images
              src: canvas.toDataURL('image/jpeg', 0.9)
            };

            Quagga.decodeSingle(config, (result: any) => {
              if (result && result.codeResult && result.codeResult.code) {
                const barcode = result.codeResult.code;
                const normalizedBarcode = this.normalizeBarcode(barcode);
                console.log(`[OK] QuaggaJS detected: ${barcode} → ${normalizedBarcode}`);
                
                if (!detectedBarcodes.includes(normalizedBarcode)) {
                  detectedBarcodes.push(normalizedBarcode);
                }
                resolve(detectedBarcodes);
              } else if (attemptCount < maxAttempts) {
                // Try again with image enhancement
                console.log('[!] No barcode found, retrying with enhancement...');
                setTimeout(tryDecode, 100);
              } else {
                console.log('ℹ️ QuaggaJS: No barcodes detected after all attempts');
                resolve([]);
              }
            });
          };

          // Start first attempt
          tryDecode();

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
      console.log('[VIDEO] Starting QuaggaJS live camera scanning');
      
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
          console.log('[MOBILE] QuaggaJS live detection:', barcode, '→', normalizedBarcode);
          onDetected(normalizedBarcode);
        }
      });

    } catch (error) {
      console.error('[X] QuaggaJS live scanning failed:', error);
      throw error;
    }
  }

  /**
   * Stop live scanning and cleanup
   */
  stopLiveScanning(): void {
    try {
      Quagga.stop();
      console.log(' QuaggaJS live scanning stopped');
    } catch (error) {
      console.error('[!] Error stopping QuaggaJS:', error);
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