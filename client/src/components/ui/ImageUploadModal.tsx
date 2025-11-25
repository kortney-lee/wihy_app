import React, { useState, useRef, useCallback, useEffect } from 'react';
import './Spinner.css';
import '../../styles/VHealthSearch.css';
import '../../styles/modals.css';
import { wihyScanningService } from '../../services/wihyScanningService';
import { visionAnalysisService } from '../../services/visionAnalysisService';
import { quaggaBarcodeScanner } from '../../services/quaggaBarcodeScanner';

interface ImageUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAnalysisComplete: (foodAnalysis: string | any) => void; // Allow both string and full scan result
  title?: string;
  subtitle?: string;
}

const isMobileDevice = () => {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent || '';
  // pointer:coarse helps catch tablets that spoof desktop UA
  const coarse = window.matchMedia?.('(pointer:coarse)').matches ?? false;
  // Include tablets by checking for screen width as well
  const isTabletSize = window.innerWidth <= 1024;
  return /Mobi|Android|iPhone|iPad|iPod/i.test(ua) || coarse || isTabletSize;
};

const hasCamera = () => {
  if (typeof window === 'undefined') return false;
  // More specific check for actual mobile devices with cameras
  const ua = navigator.userAgent || '';
  return /Android|iPhone|iPod/i.test(ua) && 'mediaDevices' in navigator;
};

const ImageUploadModal: React.FC<ImageUploadModalProps> = ({
  isOpen,
  onClose,
  onAnalysisComplete,
  title = 'Analyze any food',
  subtitle = 'Scan barcodes, search products, or analyze images'
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);        // desktop & mobile (library/file)
  const cameraInputRef = useRef<HTMLInputElement>(null);      // mobile (camera)
  const lastProcessingTime = useRef<number>(0);               // prevent rapid successive calls
  const isMobile = isMobileDevice();

  // Helper to prevent rapid successive processing calls
  const canProcess = () => {
    const now = Date.now();
    const timeSinceLastProcess = now - lastProcessingTime.current;
    const MIN_PROCESS_INTERVAL = 2000; // 2 seconds between processing attempts
    
    if (timeSinceLastProcess < MIN_PROCESS_INTERVAL) {
      console.log('⏰ Processing too soon, ignoring request. Please wait before trying again.');
      // Could add toast notification here if needed
      return false;
    }
    
    lastProcessingTime.current = now;
    return true;
  };

  // Add paste handler for images - works on all screen sizes
  useEffect(() => {
    if (!isOpen) return;

    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          e.preventDefault();
          e.stopPropagation();
          const blob = items[i].getAsFile();
          if (blob) {
            // Create a proper File object with a name for pasted images
            const file = new File([blob], `pasted-image-${Date.now()}.png`, { type: blob.type });
            // Set preview and pending file, but DON'T process yet
            setPreviewUrl(URL.createObjectURL(file));
            setPendingFile(file);
            console.log('📋 Image pasted successfully:', file.name, 'Size:', Math.round(file.size / 1024), 'KB');
          }
          break;
        }
      }
    };

    // Attach to document to catch paste anywhere when modal is open
    document.addEventListener('paste', handlePaste, true); // Use capture phase for reliability
    return () => document.removeEventListener('paste', handlePaste, true);
  }, [isOpen, isProcessing]);

  // Add global drag-drop prevention and handling
  useEffect(() => {
    if (!isOpen) return;

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleGlobalDrop = async (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      
      const files = e.dataTransfer?.files;
      if (!files?.length) return;
      
      const imageFile = Array.from(files).find(f => f.type.startsWith('image/'));
      if (imageFile) {
        // Set preview and pending file, but DON'T process yet
        setPreviewUrl(URL.createObjectURL(imageFile));
        setPendingFile(imageFile);
      }
    };

    document.addEventListener('dragover', handleDragOver);
    document.addEventListener('drop', handleGlobalDrop);
    
    return () => {
      document.removeEventListener('dragover', handleDragOver);
      document.removeEventListener('drop', handleGlobalDrop);
    };
  }, [isOpen, isProcessing]);

  // Cleanup preview URL when modal closes
  useEffect(() => {
    if (!isOpen) {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
      setPendingFile(null);
      setImageUrl('');
      setIsProcessing(false);
      setIsDragging(false);
    }
  }, [isOpen]);

  // Handle camera access with fallback
  const handleCameraClick = async () => {
    console.log('Camera button clicked');
    console.log('isMobile:', isMobile);
    console.log('hasCamera:', hasCamera());
    console.log('User Agent:', navigator.userAgent);
    console.log('MediaDevices available:', 'mediaDevices' in navigator);

    // Try to use MediaDevices API first for better camera control
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        // Request camera permission and get stream
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment', // Prefer back camera
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        });

        // Create video element to show camera feed
        const video = document.createElement('video');
        video.srcObject = stream;
        video.autoplay = true;
        video.playsInline = true;
        
        // Create a mobile-optimized modal for camera capture
        const modal = document.createElement('div');
        modal.style.cssText = `
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          height: 100dvh;
          background: #000;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          padding: 0;
          margin: 0;
          overflow: hidden;
        `;
        
        video.style.cssText = `
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 0;
          position: absolute;
          top: 0;
          left: 0;
        `;
        
        // Create animated scanner overlay
        const scannerOverlay = document.createElement('div');
        scannerOverlay.style.cssText = `
          position: absolute;
          top: 50%;
          left: 50%;
          width: 250px;
          height: 250px;
          transform: translate(-50%, -50%);
          border: 2px solid #00ff00;
          border-radius: 12px;
          z-index: 10001;
          pointer-events: none;
          box-shadow: 0 0 20px rgba(0, 255, 0, 0.3);
        `;
        
        // Create corner indicators
        const corners = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
        corners.forEach(corner => {
          const cornerDiv = document.createElement('div');
          cornerDiv.style.cssText = `
            position: absolute;
            width: 20px;
            height: 20px;
            border: 3px solid #00ff00;
            ${corner.includes('top') ? 'top: -2px;' : 'bottom: -2px;'}
            ${corner.includes('left') ? 'left: -2px;' : 'right: -2px;'}
            ${corner.includes('top') && corner.includes('left') ? 'border-right: none; border-bottom: none;' : ''}
            ${corner.includes('top') && corner.includes('right') ? 'border-left: none; border-bottom: none;' : ''}
            ${corner.includes('bottom') && corner.includes('left') ? 'border-right: none; border-top: none;' : ''}
            ${corner.includes('bottom') && corner.includes('right') ? 'border-left: none; border-top: none;' : ''}
          `;
          scannerOverlay.appendChild(cornerDiv);
        });
        
        // Create animated scan line
        const scanLine = document.createElement('div');
        scanLine.style.cssText = `
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, #ff0000, transparent);
          animation: scanAnimation 2s ease-in-out infinite;
          box-shadow: 0 0 10px #ff0000;
        `;
        scannerOverlay.appendChild(scanLine);
        
        // Add CSS animation for scan line
        const style = document.createElement('style');
        style.textContent = `
          @keyframes scanAnimation {
            0% { top: 0; opacity: 1; }
            50% { opacity: 1; }
            100% { top: calc(100% - 2px); opacity: 1; }
          }
        `;
        document.head.appendChild(style);
        
        // Create button container with better mobile positioning
        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = `
          position: absolute;
          bottom: env(safe-area-inset-bottom, 20px);
          left: 0;
          right: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          z-index: 10001;
          padding: 0 20px 20px 20px;
          box-sizing: border-box;
        `;
        
        const captureBtn = document.createElement('button');
        captureBtn.textContent = 'Capture Photo';
        captureBtn.style.cssText = `
          padding: 18px 40px;
          background: #4cbb17;
          color: white;
          border: none;
          border-radius: 50px;
          font-size: 18px;
          font-weight: 600;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(76, 187, 23, 0.3);
          width: 100%;
          max-width: 280px;
          transition: all 0.2s ease;
          touch-action: manipulation;
        `;
        
        const closeBtn = document.createElement('button');
        closeBtn.textContent = '✕ Close';
        closeBtn.style.cssText = `
          padding: 14px 24px;
          background: rgba(255, 255, 255, 0.95);
          color: #333;
          border: none;
          border-radius: 25px;
          font-size: 16px;
          cursor: pointer;
          backdrop-filter: blur(10px);
          width: 100%;
          max-width: 200px;
          transition: all 0.2s ease;
          touch-action: manipulation;
        `;
        
        // Add touch feedback for capture button
        const addTouchFeedback = (btn: HTMLButtonElement, pressedStyle: string) => {
          btn.addEventListener('touchstart', () => {
            btn.style.transform = 'scale(0.95)';
          });
          btn.addEventListener('touchend', () => {
            btn.style.transform = 'scale(1)';
          });
          btn.addEventListener('touchcancel', () => {
            btn.style.transform = 'scale(1)';
          });
        };

        addTouchFeedback(captureBtn, '');
        addTouchFeedback(closeBtn, '');

        // Handle capture
        captureBtn.onclick = async () => {
          if (isProcessing) {
            console.log('⏰ Already processing, ignoring capture request');
            return;
          }
          
          setIsProcessing(true);
          lastProcessingTime.current = Date.now(); // Update timestamp
          
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          context?.drawImage(video, 0, 0);
          
          canvas.toBlob(async (blob) => {
            if (blob) {
              try {
                const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
                console.log('📸 Processing captured photo:', file.name);
                await processFile(file);
              } catch (error) {
                console.error('❌ Error processing captured photo:', error);
              } finally {
                setIsProcessing(false);
              }
            } else {
              setIsProcessing(false);
            }
            
            // Cleanup
            stream.getTracks().forEach(track => track.stop());
            document.body.removeChild(modal);
          }, 'image/jpeg', 0.8);
        };
        
        // Handle close
        const cleanup = () => {
          stream.getTracks().forEach(track => track.stop());
          document.body.removeChild(modal);
        };
        
        closeBtn.onclick = cleanup;
        modal.onclick = (e) => {
          if (e.target === modal) cleanup();
        };
        
        // Assemble the modal
        buttonContainer.appendChild(captureBtn);
        buttonContainer.appendChild(closeBtn);
        modal.appendChild(video);
        modal.appendChild(scannerOverlay);  // Add animated scanner overlay
        modal.appendChild(buttonContainer);
        document.body.appendChild(modal);
        
        return;
      } catch (error) {
        console.log('MediaDevices failed, falling back to file input:', error);
      }
    }
    
    // Fallback to file input with capture
    cameraInputRef.current?.click();
  };

  // --- Image file processing using Direct Upload Pattern ---
  const processFile = useCallback(async (file: File) => {
    console.log('🔍 Processing file with Direct Upload Pattern:', file.name);
    
    // Set preview URL so user can see the uploaded image
    setPreviewUrl(URL.createObjectURL(file));
    
    try {
      // First, try to detect barcodes using Quagga
      console.log('📷 Attempting barcode detection with Quagga...');
      const barcodeResult = await quaggaBarcodeScanner.scanImageFile(file);
      
      if (barcodeResult.success && barcodeResult.barcodes.length > 0) {
        console.log('✅ Barcode detected in image:', barcodeResult.barcodes[0]);
        // Found a barcode - use barcode scanning API directly
        await handleBarcodeScanning(barcodeResult.barcodes[0]);
        return;
      }
      
      console.log('ℹ️ No barcode detected, proceeding with image analysis...');
      
      // Check if we're in local development - use base64 fallback to avoid CORS
      const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      
      if (isLocalDev) {
        console.log('🏠 Local development detected - using base64 fallback to avoid CORS');
        
        // Convert file to base64 for local development
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onload = () => {
            const base64 = reader.result as string;
            const base64Data = base64.split(',')[1];
            resolve(base64Data);
          };
          reader.onerror = reject;
        });
        
        reader.readAsDataURL(file);
        const base64Data = await base64Promise;
        
        const apiUrl = 'https://services.wihy.ai';
        const fallbackResponse = await fetch(`${apiUrl}/api/scan`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image: base64Data,
            user_context: {
              userId: 'web-user',
              trackHistory: true,
              include_charts: true
            }
          })
        });
        
        if (!fallbackResponse.ok) {
          // If API fails in local dev, show mock response
          console.log('⚠️ API unavailable in local dev, showing mock response');
          onAnalysisComplete({
            type: 'image_analysis',
            scanType: 'image',
            data: {
              success: true,
              message: 'Local development mode - API calls bypassed'
            },
            summary: `📸 Image uploaded: ${file.name}\n\n⚠️ Local Development Mode\nAPI calls are bypassed in localhost to avoid CORS errors.\n\nIn production, this would analyze the image and provide:\n• Nutritional information\n• Health insights\n• Ingredient analysis`,
            userQuery: `Uploaded image: ${file.name}`,
            imageUrl: URL.createObjectURL(file)
          });
          return;
        }
        
        const scanResult = await fallbackResponse.json();
        
        if (scanResult.success && scanResult.analysis) {
          onAnalysisComplete({
            type: 'image_analysis',
            scanType: 'image',
            data: scanResult.analysis,
            summary: formatScanResult(scanResult.analysis),
            userQuery: `Uploaded image: ${file.name}`,
            imageUrl: scanResult.analysis.metadata?.image_url || URL.createObjectURL(file)
          });
        } else {
          throw new Error(scanResult.error || 'Analysis failed');
        }
        return;
      }
      
      // Production: Use Direct Upload Pattern with service-managed temporary URLs
      console.log('☁️ Production mode - using Direct Upload Pattern...');
      const apiUrl = 'https://services.wihy.ai';
      const fileExtension = file.name.split('.').pop() || 'jpg';
      
      try {
        // Step 1: Request upload URL from service (service manages temp storage/cleanup)
        console.log('📝 Step 1: Requesting upload URL from service...');
        const urlResponse = await fetch(`${apiUrl}/api/scan/upload-url`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: 'web-user',
            fileExtension: fileExtension,
            ttl: 60 // Request 60 second TTL - service will manage cleanup
          })
        });
        
        const uploadInfo = await urlResponse.json();
        
        // If upload service returns 503 or error, fall back to base64
        if (!urlResponse.ok || !uploadInfo.success) {
          console.log('⚠️ Upload service unavailable (503), falling back to base64 method');
          throw new Error('Upload service unavailable - using fallback');
        }
        
        console.log('✅ Upload URL received (service-managed temp storage):', uploadInfo.uploadId);
        
        // Step 2: Upload image directly to service-provided URL
        console.log('☁️ Step 2: Uploading to service-managed storage...');
        const uploadResponse = await fetch(uploadInfo.uploadUrl, {
          method: 'PUT',
          headers: {
            'x-ms-blob-type': 'BlockBlob',
            'Content-Type': file.type || 'image/jpeg'
          },
          body: file // Raw bytes - efficient upload
        });
        
        if (!uploadResponse.ok) {
          throw new Error(`Upload failed: ${uploadResponse.status}`);
        }
        
        console.log('✅ Image uploaded - service will auto-cleanup after TTL');
        
        // Step 3: Trigger analysis using service-managed URL
        console.log('🔬 Step 3: Triggering analysis via service...');
        const analyzeResponse = await fetch(`${apiUrl}/api/scan/analyze-upload`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            uploadId: uploadInfo.uploadId,
            user_context: {
              userId: 'web-user',
              trackHistory: true,
              include_charts: true
            }
          })
        });
        
        if (!analyzeResponse.ok) {
          throw new Error(`Analysis failed: ${analyzeResponse.statusText}`);
        }
        
        const scanResult = await analyzeResponse.json();
        console.log('✅ Analysis complete');
        
        if (scanResult.success && scanResult.analysis) {
          onAnalysisComplete({
            type: 'image_analysis',
            scanType: 'image',
            data: scanResult.analysis,
            summary: formatScanResult(scanResult.analysis),
            userQuery: `Uploaded image: ${file.name}`,
            imageUrl: scanResult.analysis.metadata?.image_url || URL.createObjectURL(file)
          });
        } else {
          throw new Error(scanResult.error || 'Analysis failed');
        }
        
      } catch (uploadError) {
        // Fallback: Use base64 method when Direct Upload unavailable
        console.log('🔄 Falling back to base64 upload (less efficient, no temp URL management)...');
        console.error('Upload error:', uploadError);
        
        // Convert file to base64
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onload = () => {
            const base64 = reader.result as string;
            // Remove data:image/...;base64, prefix
            const base64Data = base64.split(',')[1];
            resolve(base64Data);
          };
          reader.onerror = reject;
        });
        
        reader.readAsDataURL(file);
        const base64Data = await base64Promise;
        
        console.log('📤 Sending base64 image for analysis...');
        const fallbackResponse = await fetch(`${apiUrl}/api/scan`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image: base64Data,
            user_context: {
              userId: 'web-user',
              trackHistory: true,
              include_charts: true
            }
          })
        });
        
        if (!fallbackResponse.ok) {
          throw new Error(`Fallback analysis failed: ${fallbackResponse.statusText}`);
        }
        
        const fallbackResult = await fallbackResponse.json();
        console.log('✅ Analysis complete via fallback method');
        
        if (fallbackResult.success && fallbackResult.analysis) {
          onAnalysisComplete({
            type: 'image_analysis',
            scanType: 'image',
            data: fallbackResult.analysis,
            summary: formatScanResult(fallbackResult.analysis),
            userQuery: `Uploaded image: ${file.name}`,
            imageUrl: fallbackResult.analysis.metadata?.image_url || URL.createObjectURL(file)
          });
        } else {
          throw new Error(fallbackResult.error || 'Analysis failed');
        }
      }
      
    } catch (err) {
      console.error('❌ processFile error:', err);
      onAnalysisComplete({
        type: 'error',
        error: err instanceof Error ? err.message : 'Image analysis failed. Please try again.'
      });
    }
  }, [onAnalysisComplete]);

  // Helper to format scan results for display
  const formatScanResult = (analysis: any): string => {
    if (!analysis) return 'Analysis completed';
    
    const metadata = analysis.metadata || {};
    let summary = `📸 **${metadata.product_name || 'Product Analysis'}**\n\n`;
    
    if (metadata.health_score) {
      summary += `🎯 Health Score: ${metadata.health_score}/100\n`;
    }
    
    if (analysis.health_insights?.summary) {
      summary += `\n${analysis.health_insights.summary}\n`;
    }
    
    if (analysis.ingredients?.length > 0) {
      summary += `\n📋 Ingredients: ${analysis.ingredients.slice(0, 5).join(', ')}`;
      if (analysis.ingredients.length > 5) {
        summary += ` (+${analysis.ingredients.length - 5} more)`;
      }
    }
    
    return summary;
  };

  // --- handlers ---
  const onFilePicked = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Set preview and pending file, but DON'T process yet
      setPreviewUrl(URL.createObjectURL(file));
      setPendingFile(file);
    }
    e.target.value = '';
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault(); 
    setIsDragging(false);
    if (!e.dataTransfer.files?.length) return;
    const f = Array.from(e.dataTransfer.files).find(x => x.type.startsWith('image/'));
    if (f) {
      // Set preview and pending file, but DON'T process yet
      setPreviewUrl(URL.createObjectURL(f));
      setPendingFile(f);
    }
  };

  // Separate handler for barcode scanning
  const handleBarcodeScanning = useCallback(async (barcode: string) => {
    console.log('🔍 Handling barcode scan:', barcode);
    
    try {
      // Test API connectivity first
      const connectionTest = await wihyScanningService.testConnection();
      if (!connectionTest.available) {
        console.warn('⚠️ WiHy Scanning API not available for barcode scan');
        onAnalysisComplete({
          type: 'error',
          error: `Barcode scanning service unavailable: ${connectionTest.error || 'Connection failed'}`
        });
        return;
      }
      
      const barcodeResult = await wihyScanningService.scanBarcode(barcode);
      
      if (barcodeResult.success) {
        // Pass structured barcode data with rich chat data
        onAnalysisComplete({
          type: 'barcode_scan',
          scanType: 'barcode',
          data: barcodeResult,
          summary: wihyScanningService.formatScanResult(barcodeResult),
          chatData: wihyScanningService.extractChatData(barcodeResult),
          userQuery: `Scanned barcode: ${barcode}`
        });
      } else {
        onAnalysisComplete({
          type: 'error',
          error: barcodeResult.error || 'Barcode not found in database'
        });
      }
    } catch (error) {
      console.error('❌ Barcode scanning error:', error);
      onAnalysisComplete({
        type: 'error',
        error: 'Barcode scanning failed. Please try again.'
      });
    }
  }, [onAnalysisComplete]);

  // Separate handler for product name searching  
  const handleProductSearch = useCallback(async (productName: string) => {
    console.log('🔍 Handling product search:', productName);
    
    try {
      const searchResult = await wihyScanningService.scanProductName(productName, {
        health_goals: ['nutrition_analysis'],
        dietary_restrictions: []
      });
      
      if (searchResult.success && searchResult.analysis) {
        // Pass structured product search data with rich chat data
        onAnalysisComplete({
          type: 'product_search',
          scanType: 'product_name',
          data: searchResult,
          summary: wihyScanningService.formatScanResult(searchResult),
          chatData: wihyScanningService.extractChatData(searchResult),
          userQuery: `Searched for: ${productName}`
        });
      } else {
        onAnalysisComplete({
          type: 'error', 
          error: searchResult.error || 'Product not found in database'
        });
      }
    } catch (error) {
      console.error('❌ Product search error:', error);
      onAnalysisComplete({
        type: 'error',
        error: 'Product search failed. Please try again.'
      });
    }
  }, [onAnalysisComplete]);

  // Separate handler for image URL processing
  const handleImageUrl = useCallback(async (imageUrl: string) => {
    console.log('🔍 Handling image URL:', imageUrl);
    
    try {
      const res = await fetch(imageUrl);
      if (!res.ok) {
        throw new Error(`Failed to fetch image: ${res.status} ${res.statusText}`);
      }
      
      const blob = await res.blob();
      if (!blob.type.startsWith('image/')) {
        throw new Error('URL does not point to an image');
      }
      
      // Extract filename from URL or use generic name
      const urlPath = new URL(imageUrl).pathname;
      const fileName = urlPath.split('/').pop() || 'url-image';
      const file = new File([blob], fileName, { type: blob.type || 'image/jpeg' });
      await processFile(file);
    } catch (error) {
      console.error('❌ Image URL processing error:', error);
      onAnalysisComplete({
        type: 'error',
        error: 'Failed to load image from URL. Please check the link and try again.'
      });
    }
  }, [processFile, onAnalysisComplete]);

  // Main input handler that routes to appropriate specialized handler
  const handleUrlUpload = useCallback(async () => {
    if (!imageUrl.trim() || isProcessing || !canProcess()) return;
    setIsProcessing(true);
    
    try {
      const input = imageUrl.trim();
      
      // Route to appropriate handler based on input type
      const barcodePattern = /^\d{8,14}$/;
      const isBarcode = barcodePattern.test(input);
      
      if (isBarcode) {
        await handleBarcodeScanning(input);
      } else if (input.includes(' ') || input.length < 50) {
        await handleProductSearch(input);
      } else {
        await handleImageUrl(input);
      }
    } catch (err) {
      console.error('❌ Input processing error:', err);
      onAnalysisComplete({
        type: 'error',
        error: 'Processing failed. Please try again.'
      });
    } finally {
      setIsProcessing(false);
    }
  }, [imageUrl, handleBarcodeScanning, handleProductSearch, handleImageUrl, onAnalysisComplete]);

  // Unified handler for both preview images and URL/text input
  const handleAnalyze = useCallback(async () => {
    if (isProcessing || !canProcess()) return;
    
    // Priority 1: Process pending file from preview
    if (pendingFile) {
      setIsProcessing(true);
      try {
        await processFile(pendingFile);
      } finally {
        setIsProcessing(false);
      }
      return;
    }
    
    // Priority 2: Process URL/barcode/product name input
    if (imageUrl.trim()) {
      await handleUrlUpload();
    }
  }, [pendingFile, imageUrl, processFile, handleUrlUpload, isProcessing, canProcess]);

  // overlay close + Esc
  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') safeClose(); };
    if (isOpen) document.addEventListener('keydown', onEsc);
    return () => document.removeEventListener('keydown', onEsc);
  }, [isOpen]);

  const safeClose = () => {
    if (isProcessing) return;
    setImageUrl('');
    setIsDragging(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="photo-modal-overlay" onClick={safeClose}>
      <div className="photo-modal" onClick={(e) => e.stopPropagation()}>
        
        {/* Header with close button */}
        <div className="modal-header" style={{borderBottom: 'none', position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
          <div style={{textAlign: 'center'}}>
            <h2 style={{margin: '0', fontSize: '24px', fontWeight: '600'}}>{title}</h2>
            <p className="modal-subtitle" style={{margin: '4px 0 0 0', color: '#666'}}>{subtitle}</p>
          </div>
          <button 
            className="modal-close" 
            onClick={safeClose} 
            aria-label="Close"
            style={{position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)'}}
          >✕</button>
        </div>

        {/* Main upload area */}
        <div className="simple-upload-container" style={{padding: '16px 24px', textAlign: 'center'}}>
          
          {/* Upload buttons */}
          <div style={{display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '16px', marginTop: '4px'}}>
            {isMobile && hasCamera() && (
              <>
                <button 
                  className="simple-search-button" 
                  onClick={handleCameraClick} 
                  disabled={isProcessing}
                  style={{
                    width: '100%', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    gap: '8px',
                    background: isProcessing ? '#cccccc' : '#4cbb17',
                    color: isProcessing ? '#666' : 'white',
                    border: 'none',
                    borderRadius: '24px',
                    padding: '16px 20px',
                    fontSize: '16px',
                    fontWeight: '600',
                    transition: 'all 0.2s ease',
                    cursor: isProcessing ? 'not-allowed' : 'pointer'
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9.4 10.5l4.77-8.26C13.47 2.09 12.75 2 12 2c-2.4 0-4.6.85-6.32 2.25l3.66 6.35.06-.1zM21.54 9c-.92-2.92-3.15-5.26-6-6.34L11.88 9h9.66zm.26 1h-7.49l.29.5 4.76 8.25C21 16.97 22 14.61 22 12c0-.69-.07-1.35-.2-2zM8.54 12l-3.9-6.75C3.01 7.03 2 9.39 2 12c0 .69.07 1.35.2 2h7.49l-1.15-2zm-6.08 3c.92 2.92 3.15 5.26 6 6.34L12.12 15H2.46zm11.27 0l-3.9 6.76c.7.15 1.42.24 2.17.24 2.4 0 4.6-.85 6.32-2.25L14.73 15z"/>
                  </svg>
                  {isProcessing ? 'Processing...' : 'Use Camera'}
                </button>
                <button 
                  className="simple-search-button" 
                  onClick={() => fileInputRef.current?.click()} 
                  disabled={isProcessing}
                  style={{
                    width: '100%', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    gap: '8px',
                    background: isProcessing ? '#f5f5f5' : '#f8f9fa',
                    color: isProcessing ? '#999' : '#5f6368',
                    border: `1px solid ${isProcessing ? '#ddd' : '#e5e7eb'}`,
                    borderRadius: '24px',
                    padding: '16px 20px',
                    fontSize: '16px',
                    fontWeight: '600',
                    transition: 'all 0.2s ease',
                    cursor: isProcessing ? 'not-allowed' : 'pointer'
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                  </svg>
                  {isProcessing ? 'Processing...' : 'Upload from Files'}
                </button>
              </>
            )}
            {isMobile && !hasCamera() && (
              <button 
                className="simple-search-button" 
                onClick={() => fileInputRef.current?.click()} 
                disabled={isProcessing}
                style={{
                  width: '100%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '8px',
                  background: '#4cbb17',
                  color: 'white',
                  border: 'none',
                  borderRadius: '24px',
                  padding: '16px 20px',
                  fontSize: '16px',
                  fontWeight: '600',
                  transition: 'all 0.2s ease'
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                </svg>
                Upload from Files
              </button>
            )}
          </div>

          {/* Hidden inputs */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={onFilePicked}
            style={{ display: 'none' }}
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture={true}
            onChange={onFilePicked}
            style={{ display: 'none' }}
          />

          {/* Dropzone (desktop only) */}
          {!isMobile && (
            <div
              className={`simple-upload-area ${isDragging ? 'dragging' : ''} ${isProcessing ? 'processing' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => !previewUrl && fileInputRef.current?.click()}
              style={{ cursor: previewUrl ? 'default' : 'pointer' }}
            >
              {previewUrl ? (
                <div className="simple-upload-content" style={{ padding: '16px' }}>
                  <img
                    src={previewUrl}
                    alt="Uploaded preview"
                    style={{ 
                      maxWidth: '100%', 
                      maxHeight: 240, 
                      borderRadius: 16, 
                      objectFit: 'contain',
                      display: 'block',
                      margin: '0 auto'
                    }}
                  />
                  {isProcessing && (
                    <div style={{ marginTop: '12px', textAlign: 'center' }}>
                      <div className="simple-spinner">
                        <div className="spinner" />
                      </div>
                      <p className="simple-upload-text">Analyzing image…</p>
                    </div>
                  )}
                </div>
              ) : isProcessing ? (
                <div className="simple-upload-content">
                  <div className="simple-spinner">
                    <div className="spinner" />
                  </div>
                  <p className="simple-upload-text">Analyzing image…</p>
                </div>
              ) : (
                <div className="simple-upload-content">
                  <div className="simple-upload-icon">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="#9aa0a6">
                      <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                      <path d="M12,11L8,15H10.5V19H13.5V15H16L12,11Z"/>
                    </svg>
                  </div>
                  <p className="simple-upload-text">Drag an image here or click to upload.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* URL section */}
        <div className="simple-divider" style={{margin: '12px 0', fontSize: '14px', color: '#9aa0a6'}}>
          <span>OR</span>
        </div>
        <div className="simple-url-section" style={{padding: '0 16px 24px 16px', display: 'flex', flexDirection: 'column', gap: '16px'}}>
          <input
            className="simple-url-input"
            type={isMobile ? "text" : "text"}
            placeholder={isMobile ? "Enter barcode, product name, or image URL" : "Enter barcode, product name, or paste image URL"}
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
            onPaste={async (e) => {
              // Handle image paste in input field (redundant but ensures mobile compatibility)
              const items = e.clipboardData?.items;
              if (!items) return;
              
              for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf('image') !== -1) {
                  e.preventDefault();
                  e.stopPropagation();
                  const blob = items[i].getAsFile();
                  if (blob) {
                    const file = new File([blob], `pasted-image-${Date.now()}.png`, { type: blob.type });
                    setPreviewUrl(URL.createObjectURL(file));
                    setPendingFile(file);
                    setImageUrl(''); // Clear text input
                    console.log('📋 Image pasted in input field:', file.name, 'Size:', Math.round(file.size / 1024), 'KB');
                  }
                  break;
                }
              }
            }}
            disabled={isProcessing}
            autoComplete="off"
            inputMode={isMobile ? "text" : "text"}
            style={{
              padding: '14px 18px',
              border: '1px solid #e5e7eb',
              borderRadius: '24px',
              fontSize: '16px',
              outline: 'none',
              boxShadow: 'none',
              WebkitAppearance: 'none',
              WebkitTapHighlightColor: 'transparent'
            }}
            onFocus={(e) => {
              e.target.style.border = '1px solid #e5e7eb';
              e.target.style.boxShadow = 'none';
              e.target.style.outline = 'none';
            }}
            onBlur={(e) => {
              e.target.style.border = '1px solid #e5e7eb';
              e.target.style.boxShadow = 'none';
              e.target.style.outline = 'none';
            }}
          />
          <div style={{
            display: 'inline-block',
            borderRadius: '26px',
            overflow: 'hidden',
            background: 'linear-gradient(#fff,#fff) padding-box, linear-gradient(90deg, #fa5f06, #ffffff, #c0c0c0, #4cbb17) border-box',
            backgroundSize: '100% 100%, 200% 100%',
            border: '2px solid transparent',
            animation: 'wihy-border-sweep 2.2s linear infinite'
          }}>
            <button
              onClick={handleAnalyze}
              disabled={isProcessing || (!imageUrl.trim() && !pendingFile)}
              style={{
                width: '100%',
                background: '#fff',
                color: '#1A73E8',
                border: 'none',
                borderRadius: '24px',
                padding: '16px 20px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                textAlign: 'center'
              }}
            >
              {isProcessing ? 'Analyzing...' : 'Analyze with WiHY'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageUploadModal;