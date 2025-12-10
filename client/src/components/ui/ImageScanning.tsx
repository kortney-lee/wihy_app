import React, { useEffect, useRef, useState } from 'react';
import './ImageScanning.css';

interface ImageScanningProps {
  isOpen: boolean;
  onClose: () => void;
  onBarcodeDetected: (barcode: string) => void;
  onPhotoCapture?: (file: File) => void;
}

const ImageScanning: React.FC<ImageScanningProps> = ({
  isOpen,
  onClose,
  onBarcodeDetected,
  onPhotoCapture
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<any>(null);
  const isScanningRef = useRef(false);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize barcode detector
  useEffect(() => {
    const initializeDetector = async () => {
      try {
        // @ts-ignore
        if (window.BarcodeDetector) {
          // @ts-ignore
          detectorRef.current = new window.BarcodeDetector({
            formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'qr_code'],
          });
          console.log('✅ BarcodeDetector initialized for ImageScanning component');
        } else {
          console.log('⚠️ BarcodeDetector not available - manual capture only');
        }
      } catch (error) {
        console.log('⚠️ BarcodeDetector initialization failed:', error);
      }
    };

    initializeDetector();
  }, []);

  // Start camera when modal opens
  useEffect(() => {
    if (isOpen && !isScanning) {
      startCamera();
    } else if (!isOpen && isScanning) {
      stopCamera();
    }
  }, [isOpen]);

  // Cleanup when component unmounts
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      setError(null);
      setIsScanning(true);

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: 'environment' as const },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      console.log('📷 Starting camera...');
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        await new Promise((resolve) => {
          if (videoRef.current) {
            videoRef.current.onloadedmetadata = () => {
              videoRef.current?.play().then(() => {
                console.log('✅ Camera started successfully');
                resolve(null);
              }).catch(err => {
                console.warn('Video play error:', err);
                resolve(null);
              });
            };
          }
        });

        // Set scanning state and start barcode scanning loop
        isScanningRef.current = true;
        setIsScanning(true);
        console.log('🔍 Starting barcode scanning loop');
        startBarcodeScanning();
      }
    } catch (err) {
      console.error('❌ Failed to start camera:', err);
      setError('Camera access failed. Please ensure camera permissions are granted.');
    }
  };

  const stopCamera = () => {
    console.log('🧹 Stopping camera...');
    isScanningRef.current = false;
    setIsScanning(false);
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        console.log('  - Stopping track:', track.kind, track.label);
        track.stop();
      });
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    console.log('✅ Camera stopped');
  };

  const startBarcodeScanning = () => {
    if (!detectorRef.current || !videoRef.current) {
      console.log('⚠️ Barcode scanning disabled - detector or video not available');
      return;
    }

    const scanLoop = async () => {
      console.log('🔍 Barcode scanning loop started, isScanningRef.current:', isScanningRef.current);
      while (isScanningRef.current && videoRef.current) {
        try {
          // @ts-ignore
          const barcodes = await detectorRef.current.detect(videoRef.current);
          
          if (barcodes.length > 0) {
            const barcode = barcodes[0].rawValue.trim();
            const format = barcodes[0].format;
            console.log('✅ BARCODE DETECTED!', barcode, 'format:', format);
            
            isScanningRef.current = false;
            setIsScanning(false);
            onBarcodeDetected(barcode);
            return;
          }
        } catch (err) {
          // Detector errors are normal when no barcode is visible
          if ((err as any)?.message && !(err as any).message.includes('Could not detect')) {
            console.warn('⚠️ BarcodeDetector error:', err);
          }
        }
        
        // Wait ~150ms between scans (~6-7 scans/sec)
        await new Promise((resolve) => setTimeout(resolve, 150));
      }
    };

    scanLoop();
  };

  const handleCapturePhoto = async () => {
    if (!videoRef.current || !onPhotoCapture) return;

    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        
        await new Promise<void>((resolve) =>
          canvas.toBlob(async (blob) => {
            if (!blob) return resolve();
            const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
            onPhotoCapture(file);
            resolve();
          }, 'image/jpeg', 0.85)
        );
      }
    } catch (error) {
      console.error('❌ Error capturing photo:', error);
    }
  };

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="image-scanning-overlay" onClick={handleClose}>
      <div className="image-scanning-modal" onClick={(e) => e.stopPropagation()}>
        
        {/* Video feed */}
        <video
          ref={videoRef}
          className="image-scanning-video"
          playsInline
          muted
          autoPlay
        />

        {/* Scanner overlay */}
        <div className="scanner-overlay">
          <div className="scanner-corners">
            <div className="corner top-left"></div>
            <div className="corner top-right"></div>
            <div className="corner bottom-left"></div>
            <div className="corner bottom-right"></div>
          </div>
          <div className="scan-line"></div>
        </div>

        {/* Controls */}
        <div className="scanning-controls">
          {onPhotoCapture && (
            <button 
              className="capture-btn"
              onClick={handleCapturePhoto}
              disabled={!isScanning}
            >
              Capture Photo
            </button>
          )}
          <button 
            className="close-btn"
            onClick={handleClose}
          >
            ✕ Close
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="scanning-error">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageScanning;