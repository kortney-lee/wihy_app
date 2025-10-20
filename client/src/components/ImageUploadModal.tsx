// src/components/ImageUploadModal.tsx
import React, { useState, useRef, useCallback } from 'react';
import './Spinner.css';
import '../styles/VHealthSearch.css';
import { visionAnalysisService } from '../services/visionAnalysisService';

interface ImageUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAnalysisComplete: (foodName: string) => void; // Changed from onFileSelect
  title?: string;
  subtitle?: string;
}

const ImageUploadModal: React.FC<ImageUploadModalProps> = ({
  isOpen,
  onClose,
  onAnalysisComplete, // Updated prop name
  title = "Analyze Image",
  subtitle = "Upload or capture images for comprehensive analysis"
}) => {
  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
  const [isDragging, setIsDragging] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Process file and analyze it with Vision Analysis Service
  const processFile = useCallback(async (file: File) => {
    console.log('🔍 STEP 1: File received:', {
      name: file.name,
      type: file.type,
      size: file.size
    });
    
    setIsProcessing(true);
    
    try {
      console.log('🔍 STEP 2: Using Vision Analysis Service for comprehensive analysis...');
      
      // Use Vision Analysis Service for comprehensive detection
      const visionResult = await visionAnalysisService.analyzeImage(file);
      console.log('🔍 STEP 3: Vision analysis result:', visionResult);
      
      let analysisText = 'Image analyzed';
      
      if (visionResult.success && visionResult.data) {
        // Format comprehensive analysis results
        analysisText = visionAnalysisService.formatForDisplay(visionResult);
        
        // Also try the original WiHy API for additional context
        try {
          console.log('🔍 STEP 4: Also checking WiHy API for additional context...');
          const { wihyAPI } = await import('../services/wihyAPI');
          const wihyResult = await wihyAPI.scanFood(file);
          
          if (wihyResult.success && 'data' in wihyResult && wihyResult.data?.ai_response?.response) {
            analysisText = `${analysisText}\n\nAI Health Analysis: ${wihyResult.data.ai_response.response}`;
          }
        } catch (wihyError) {
          console.log('ℹ️ WiHy API not available, using Vision Analysis results only');
        }
      } else {
        console.log('❌ Vision analysis failed, falling back to basic analysis');
        analysisText = visionResult.error || 'Image analysis unavailable';
      }
      
      console.log('🔍 STEP 5: Final analysis text:', analysisText);
      console.log('🔍 STEP 6: Triggering analysis completion...');
      
      onAnalysisComplete(analysisText);
      
    } catch (error) {
      console.error('❌ Error in processFile:', error);
      onAnalysisComplete('Analysis failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [onAnalysisComplete]);

  // Camera functions
  const startCamera = useCallback(async () => {
    try {
      setCameraError('');
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Camera access error:', error);
      setCameraError('Unable to access camera. Please check permissions.');
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowCamera(false);
  }, [stream]);

  const capturePhoto = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw current video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert canvas to blob and then to File
    canvas.toBlob(async (blob) => {
      if (blob) {
        const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
        await processFile(file);
        stopCamera();
      }
    }, 'image/jpeg', 0.9);
  }, [processFile, stopCamera]);

  const handleCameraToggle = useCallback(() => {
    if (showCamera) {
      stopCamera();
    } else {
      setShowCamera(true);
      startCamera();
    }
  }, [showCamera, stopCamera, startCamera]);

  // Handle file drop
  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    
    if (imageFile) {
      await processFile(imageFile);
    } else {
      alert('Please upload an image file (JPG, PNG, GIF, etc.)');
    }
  }, [processFile]);

  // Handle drag events
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  // Handle file input
  const handleFileInput = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('📁 File input triggered');
    const file = e.target.files?.[0];
    console.log('📁 Selected file:', file);
    if (file) {
      await processFile(file);
    } else {
      console.log('❌ No file selected');
    }
  }, [processFile]);

  // Handle URL upload
  const handleUrlUpload = useCallback(async () => {
    if (!imageUrl.trim()) {
      alert('Please enter a valid image URL');
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      
      if (!blob.type.startsWith('image/')) {
        throw new Error('URL does not point to an image');
      }

      const file = new File([blob], 'uploaded-image.jpg', { type: blob.type });
      await processFile(file);
    } catch (error) {
      console.error('Error loading image from URL:', error);
      alert('Failed to load image from URL. Please check the URL and try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [imageUrl, processFile]);

  // Handle modal close
  const handleClose = useCallback(() => {
    if (!isProcessing) {
      stopCamera(); // Clean up camera resources
      onClose();
      setImageUrl('');
      setIsDragging(false);
      setShowCamera(false);
      setCameraError('');
    }
  }, [isProcessing, stopCamera, onClose]);

  // Return null if modal is not open (AFTER all hooks are called)
  if (!isOpen) return null;

  return (
    <div className={`photo-modal-overlay ${isOpen ? 'open' : ''}`} onClick={handleClose}>
      <div className="photo-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-simple">
          <button 
            className="modal-close-simple"
            onClick={handleClose}
            aria-label="Close"
            disabled={isProcessing}
          >
            ×
          </button>
        </div>
        
        {/* Simple Upload Area */}
        <div className="simple-upload-container">
          <h2 className="simple-title">Analyze any image</h2>
          
          {!showCamera ? (
            <>
              <div 
                className={`simple-upload-area ${isDragging ? 'dragging' : ''} ${isProcessing ? 'processing' : ''}`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              >
                <div className="simple-upload-content">
                  {isProcessing ? (
                    <>
                      <div className="simple-spinner">
                        <div className="spinner"></div>
                      </div>
                      <p className="simple-upload-text">Analyzing image...</p>
                    </>
                  ) : (
                    <>
                      <div className="simple-upload-icon">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M9,16V10H5L12,3L19,10H15V16H9M5,20V18H19V20H5Z"/>
                        </svg>
                      </div>
                      <p className="simple-upload-text">
                        {isDragging ? 'Drop image here' : 'Drag an image here or'}{' '}
                        <span 
                          className="upload-link"
                          onClick={() => document.getElementById('modal-file-input')?.click()}
                        >
                          upload a file
                        </span>
                      </p>
                    </>
                  )}
                </div>
                
                <input
                  id="modal-file-input"
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleFileInput}
                  disabled={isProcessing}
                  capture="environment" // Mobile camera hint
                />
              </div>
              
              {/* Camera Toggle Button */}
              <div className="camera-toggle-section" style={{ 
                marginBottom: '16px', 
                textAlign: 'center',
                display: 'flex',
                justifyContent: 'center',
                width: '100%'
              }}>
                <div className="wihy-btn-wrapper" style={{
                  display: 'inline-block',
                  animation: isProcessing ? 'none' : 'wiH-border-sweep 2.2s linear infinite',
                  background: isProcessing 
                    ? 'linear-gradient(#f3f4f6, #f3f4f6)' 
                    : 'linear-gradient(#fff, #fff) padding-box, linear-gradient(90deg, #fa5f06, #ffffff, #C0C0C0, #4cbb17) border-box',
                  backgroundSize: '100% 100%, 200% 100%',
                  border: '2px solid transparent',
                  borderRadius: '28px',
                  minWidth: '240px',
                  width: '60%',
                  maxWidth: '300px'
                }}>
                  <button 
                    className="analyze-wihy-btn"
                    onClick={handleCameraToggle}
                    disabled={isProcessing}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      borderRadius: '28px',
                      padding: '18px 36px',
                      fontSize: '20px',
                      fontWeight: '700',
                      cursor: isProcessing ? 'not-allowed' : 'pointer',
                      boxShadow: 'none',
                      transform: 'none',
                      color: '#1a73e8',
                      width: '100%',
                      letterSpacing: '0.5px',
                      textAlign: 'center',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    Use Camera
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* Camera Section */
            <div className="camera-section">
              {cameraError ? (
                <div className="camera-error">
                  <p>{cameraError}</p>
                  <button onClick={startCamera} className="retry-button">Try Again</button>
                </div>
              ) : (
                <>
                  <div className="camera-container">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="camera-video"
                    />
                    {stream && !isProcessing && (
                      <div className="wihy-btn-wrapper" style={{
                        display: 'inline-block',
                        animation: 'wiH-border-sweep 2.2s linear infinite',
                        background: 'linear-gradient(#fff, #fff) padding-box, linear-gradient(90deg, #fa5f06, #ffffff, #C0C0C0, #4cbb17) border-box',
                        backgroundSize: '100% 100%, 200% 100%',
                        border: '2px solid transparent',
                        borderRadius: '24px',
                        position: 'absolute',
                        bottom: '20px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        minWidth: '180px'
                      }}>
                        <button
                          className="analyze-wihy-btn"
                          onClick={capturePhoto}
                          disabled={isProcessing}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            borderRadius: '24px',
                            padding: '14px 28px',
                            fontSize: '16px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            boxShadow: 'none',
                            transform: 'none',
                            color: '#1a73e8',
                            width: '100%'
                          }}
                        >
                          Capture & Analyze
                        </button>
                      </div>
                    )}
                    {isProcessing && (
                      <div className="camera-processing">
                        <div className="spinner"></div>
                        <p>Analyzing image...</p>
                      </div>
                    )}
                  </div>
                  
                  <button 
                    className="back-to-upload-button"
                    onClick={handleCameraToggle}
                    disabled={isProcessing}
                    style={{
                      background: '#f8f9fa',
                      border: '1px solid #dadce0',
                      borderRadius: '24px',
                      padding: '12px 24px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: isProcessing ? 'not-allowed' : 'pointer',
                      color: '#5f6368',
                      marginTop: '20px',
                      marginBottom: '20px'
                    }}
                  >
                    Back to Upload
                  </button>
                  
                  <canvas
                    ref={canvasRef}
                    style={{ display: 'none' }}
                  />
                </>
              )}
            </div>
          )}
        </div>
        
        <div className="simple-url-section" style={{ marginBottom: '30px', textAlign: 'center' }}>
          <input
            type="url"
            placeholder="Paste image link"
            className="simple-url-input"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleUrlUpload();
              }
            }}
            disabled={isProcessing}
            style={{ marginBottom: '16px' }}
          />
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            width: '100%' 
          }}>
            <div className="wihy-btn-wrapper" style={{
              display: 'inline-block',
              animation: (isProcessing || !imageUrl.trim()) ? 'none' : 'wiH-border-sweep 2.2s linear infinite',
              background: (isProcessing || !imageUrl.trim()) 
                ? 'linear-gradient(#f3f4f6, #f3f4f6)' 
                : 'linear-gradient(#fff, #fff) padding-box, linear-gradient(90deg, #fa5f06, #ffffff, #C0C0C0, #4cbb17) border-box',
              backgroundSize: '100% 100%, 200% 100%',
              border: '2px solid transparent',
              borderRadius: '28px',
              minWidth: '240px',
              width: '60%',
              maxWidth: '300px'
            }}>
              <button 
                className="analyze-wihy-btn"
                onClick={handleUrlUpload}
                disabled={isProcessing || !imageUrl.trim()}
                style={{
                  background: 'transparent',
                  border: 'none',
                  borderRadius: '28px',
                  padding: '18px 36px',
                  fontSize: '20px',
                  fontWeight: '700',
                  cursor: isProcessing || !imageUrl.trim() ? 'not-allowed' : 'pointer',
                  boxShadow: 'none',
                  transform: 'none',
                  color: (isProcessing || !imageUrl.trim()) ? '#9ca3af' : '#1a73e8',
                  width: '100%',
                  letterSpacing: '0.5px',
                  textAlign: 'center',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {isProcessing ? 'Analyzing...' : 'Analyze with WiHy'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageUploadModal;