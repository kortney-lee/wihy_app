import React, { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader, DecodeHintType, BarcodeFormat } from '@zxing/library';

interface LiveBarcodeScannerWebProps {
  onDetected: (barcode: string) => void;
  onClose?: () => void;
}

const LiveBarcodeScannerWeb: React.FC<LiveBarcodeScannerWebProps> = ({ onDetected, onClose }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState(true);

  useEffect(() => {
    if (!active) return;

    // Configure ZXing with specific hints for better barcode detection
    const hints = new Map();
    const formats = [
      BarcodeFormat.EAN_13,
      BarcodeFormat.EAN_8,
      BarcodeFormat.UPC_A,
      BarcodeFormat.UPC_E,
      BarcodeFormat.CODE_128,
      BarcodeFormat.CODE_39,
      BarcodeFormat.ITF,
      BarcodeFormat.QR_CODE,
    ];
    hints.set(DecodeHintType.POSSIBLE_FORMATS, formats);
    hints.set(DecodeHintType.TRY_HARDER, true);
    
    const codeReader = new BrowserMultiFormatReader(hints);
    let isCancelled = false;

    (async () => {
      try {
        // Request higher resolution for better barcode detection
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: 'environment',
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          }
        });

        if (!videoRef.current || isCancelled) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }

        videoRef.current.srcObject = stream;
        await videoRef.current.play();

        // Start continuous decoding
        const controls = await codeReader.decodeFromVideoElement(videoRef.current);
        
        if (controls) {
          const text = controls.getText().trim();
          console.log('📷 LIVE SCANNER: Detected barcode:', text, 'Format:', controls.getBarcodeFormat());
          setActive(false);
          
          // Stop camera
          const tracks = (videoRef.current.srcObject as MediaStream | null)?.getTracks() || [];
          tracks.forEach(t => t.stop());
          
          onDetected(text);
        }
      } catch (err: any) {
        console.error('📷 LIVE SCANNER: Camera error:', err);
        setError(err.message || 'Camera error');
      }
    })();

    return () => {
      isCancelled = true;
      codeReader.reset();
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream)
          .getTracks()
          .forEach(track => track.stop());
      }
    };
  }, [active, onDetected]);

  return (
    <div style={{ 
      position: 'relative', 
      width: '100%', 
      aspectRatio: '3 / 4', 
      background: '#000',
      borderRadius: '8px',
      overflow: 'hidden'
    }}>
      <video
        ref={videoRef}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        muted
        playsInline
      />
      
      {/* Center scan area overlay */}
      <div
        style={{
          position: 'absolute',
          border: '3px solid rgba(76, 187, 23, 0.9)',
          borderRadius: 12,
          width: '70%',
          height: '25%',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          boxShadow: '0 0 0 9999px rgba(0,0,0,0.35)',
          pointerEvents: 'none',
        }}
      />
      
      {/* Instructions */}
      <div
        style={{
          position: 'absolute',
          bottom: 16,
          left: 0,
          right: 0,
          textAlign: 'center',
          color: '#fff',
          textShadow: '0 1px 2px rgba(0,0,0,0.8)',
          fontSize: 14,
          fontWeight: 500,
        }}
      >
        {error ?? 'Align the barcode inside the box'}
      </div>
      
      {/* Close button */}
      {onClose && (
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            background: 'rgba(0, 0, 0, 0.6)',
            border: 'none',
            color: 'white',
            fontSize: 24,
            width: 40,
            height: 40,
            borderRadius: '50%',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10
          }}
        >
          ×
        </button>
      )}
    </div>
  );
};

export default LiveBarcodeScannerWeb;
