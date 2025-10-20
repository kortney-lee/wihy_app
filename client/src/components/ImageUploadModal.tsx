// src/components/ImageUploadModal.tsx
import React, { useState, useRef, useCallback } from 'react';
import './Spinner.css';
import '../styles/VHealthSearch.css';
import '../styles/modals.css';

interface ImageUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAnalysisComplete: (foodName: string) => void;
  title?: string;
  subtitle?: string;
}

const ImageUploadModal: React.FC<ImageUploadModalProps> = ({
  isOpen,
  onClose,
  onAnalysisComplete,
  title = "Upload Image",
  subtitle = "Upload images for analysis"
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      setStream(mediaStream);
      setShowCamera(true);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Unable to access camera. Please check permissions.');
    }
  }, []);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowCamera(false);
    setCapturedImage(null);
  }, [stream]);

  // Capture photo
  const capturePhoto = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageDataUrl = canvas.toDataURL('image/jpeg');
        setCapturedImage(imageDataUrl);
      }
    }
  }, []);

  // Process file and analyze it
  const processFile = useCallback(async (file: File) => {
    console.log('🔍 STEP 1: File received:', {
      name: file.name,
      type: file.type,
      size: file.size
    });
    
    setIsProcessing(true);
    
    try {
      console.log('🔍 STEP 2: Using WiHy Scan API...');
      
      // Import wihyAPI dynamically to avoid circular imports
      const { wihyAPI } = await import('../services/wihyAPI');
      
      console.log('🔍 STEP 3: Making scan API call...');
      const result = await wihyAPI.scanFood(file);

      console.log('🔍 STEP 4: Scan API response received:', result);
      
      // Extract food name from the scan result using unified format
      let foodName = 'unknown';
      
      // Type-safe check for unified response format
      if (result.success && 'data' in result && result.data) {
        const unifiedResult = result as any; // Use any to handle type checking
        
        // Primary: Get health advice from AI response
        if (unifiedResult.data.ai_response?.response) {
          foodName = unifiedResult.data.ai_response.response;
          console.log('🔍 Using AI response:', foodName);
        }
        // Fallback: Try to get product name or other analysis
        else if (unifiedResult.data.product_name) {
          foodName = unifiedResult.data.product_name;
          console.log('🔍 Using product name:', foodName);
        }
        else if (unifiedResult.data.analysis) {
          foodName = unifiedResult.data.analysis;
          console.log('🔍 Using analysis:', foodName);
        }
        else {
          foodName = 'Food item scanned';
          console.log('🔍 Using fallback name');
        }
      } else {
        console.log('❌ No valid response data found');
        foodName = 'Food analysis unavailable';
      }
      
      console.log('🔍 STEP 5: Extracted food name:', foodName);
      
      console.log('🔍 STEP 6: Triggering analysis completion for:', foodName);
      onAnalysisComplete(foodName);
      
    } catch (error) {
      console.error('❌ Error in processFile:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [onAnalysisComplete]);

  // Analyze captured image
  const analyzeCapturedImage = useCallback(async () => {
    if (!capturedImage) return;

    setIsProcessing(true);
    try {
      // Convert data URL to blob
      const response = await fetch(capturedImage);
      const blob = await response.blob();
      const file = new File([blob], 'captured-image.jpg', { type: 'image/jpeg' });
      
      await processFile(file);
    } catch (error) {
      console.error('Error analyzing captured image:', error);
      alert('Failed to analyze the captured image. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [capturedImage, processFile]);

  // Handle URL upload
  const handleUrlUpload = useCallback(async () => {
    if (!imageUrl.trim()) {
      alert('Please enter an image URL');
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error('Failed to fetch image');
      }
      
      const blob = await response.blob();
      const file = new File([blob], 'url-image.jpg', { type: blob.type || 'image/jpeg' });
      
      await processFile(file);
    } catch (error) {
      console.error('Error uploading from URL:', error);
      alert('Failed to upload image from URL. Please check the URL and try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [imageUrl, processFile]);

  // Back to upload view
  const backToUpload = useCallback(() => {
    stopCamera();
  }, [stopCamera]);

  if (!isOpen) return null;

  // Handle file drop
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    
    if (imageFile) {
      await processFile(imageFile);
    } else {
      alert('Please upload an image file (JPG, PNG, GIF, etc.)');
    }
  };

  // Handle drag events
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  // Handle file input
  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('📁 File input triggered');
    const file = e.target.files?.[0];
    console.log('📁 Selected file:', file);
    if (file) {
      await processFile(file);
    } else {
      console.log('❌ No file selected');
    }
  };

  // Handle modal close
  const handleClose = () => {
    if (!isProcessing) {
      onClose();
      setImageUrl('');
      setIsDragging(false);
    }
  };

  return (
    <div className={`photo-modal-overlay ${isOpen ? 'open' : ''}`} onClick={handleClose}>
      <div className="photo-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <p className="modal-subtitle">{subtitle}</p>
          <button 
            className="modal-close"
            onClick={handleClose}
            aria-label="Close"
            disabled={isProcessing}
          >
            ×
          </button>
        </div>
        
        {showCamera ? (
          /* Camera View */
          <div className="camera-view">
            {capturedImage ? (
              /* Captured Image Preview */
              <div className="captured-image-container">
                <img src={capturedImage} alt="Captured" className="captured-image" />
                <div className="camera-controls">
                  <button 
                    className="analyze-wihy-btn"
                    onClick={analyzeCapturedImage}
                    disabled={isProcessing}
                    style={{
                      background: 'transparent',
                      border: '2px solid transparent',
                      borderRadius: '28px',
                      padding: '12px 24px',
                      color: '#1a73e8',
                      fontSize: '16px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      backgroundClip: 'padding-box',
                      position: 'relative',
                      animation: 'wiH-border-sweep 2.2s linear infinite',
                      marginBottom: '12px'
                    }}
                  >
                    {isProcessing ? 'Analyzing...' : 'Analyze with WiHy'}
                  </button>
                  <button 
                    onClick={() => setCapturedImage(null)}
                    style={{
                      background: '#f8f9fa',
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      padding: '8px 16px',
                      color: '#666',
                      fontSize: '14px',
                      cursor: 'pointer'
                    }}
                  >
                    Retake
                  </button>
                  <button 
                    onClick={backToUpload}
                    style={{
                      background: '#f8f9fa',
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      padding: '8px 16px',
                      color: '#666',
                      fontSize: '14px',
                      cursor: 'pointer',
                      marginLeft: '8px'
                    }}
                  >
                    Back to Upload
                  </button>
                </div>
              </div>
            ) : (
              /* Live Camera View */
              <div className="live-camera-container">
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  className="camera-video"
                  style={{
                    width: '100%',
                    height: '300px',
                    objectFit: 'cover',
                    borderRadius: '8px'
                  }}
                />
                <canvas ref={canvasRef} style={{ display: 'none' }} />
                <div className="camera-controls">
                  <button 
                    className="analyze-wihy-btn"
                    onClick={capturePhoto}
                    style={{
                      background: 'transparent',
                      border: '2px solid transparent',
                      borderRadius: '28px',
                      padding: '16px 32px',
                      color: '#1a73e8',
                      fontSize: '18px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      backgroundClip: 'padding-box',
                      position: 'relative',
                      animation: 'wiH-border-sweep 2.2s linear infinite',
                      marginBottom: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '100%'
                    }}
                  >
                    Capture & Analyze
                  </button>
                  <button 
                    onClick={backToUpload}
                    style={{
                      background: '#f8f9fa',
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      padding: '8px 16px',
                      color: '#666',
                      fontSize: '14px',
                      cursor: 'pointer',
                      width: '100%'
                    }}
                  >
                    Back to Upload
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Upload View */
          <>
            {/* Upload Area */}
            <div 
              className={`upload-area ${isDragging ? 'dragging' : ''} ${isProcessing ? 'processing' : ''}`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <div className="upload-content">
                <div className="upload-icon">
                  {isProcessing ? (
                    <div className="upload-spinner">
                      <div className="spinner"></div>
                    </div>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                    </svg>
                  )}
                </div>
                
                {isProcessing ? (
                  <p className="upload-text">Analyzing image...</p>
                ) : (
                  <p className="upload-text">
                    {isDragging ? 'Drop image here' : 'Drag an image here or'}{' '}
                    <button 
                      className="upload-link"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isProcessing}
                    >
                      upload a file
                    </button>
                  </p>
                )}
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleFileInput}
                disabled={isProcessing}
              />
            </div>

            {/* Button Bar */}
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '12px', 
              marginTop: '20px',
              marginBottom: '20px'
            }}>
              <button 
                className="analyze-wihy-btn"
                onClick={startCamera}
                disabled={isProcessing}
                style={{
                  background: 'transparent',
                  border: '2px solid transparent',
                  borderRadius: '28px',
                  padding: '16px 32px',
                  color: '#1a73e8',
                  fontSize: '18px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  backgroundClip: 'padding-box',
                  position: 'relative',
                  animation: 'wiH-border-sweep 2.2s linear infinite',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '100%'
                }}
              >
                Use Camera
              </button>
            </div>

            {/* URL Input Section */}
            <div className="url-input-section" style={{ marginBottom: '20px' }}>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="Paste image link"
                className="url-input"
                disabled={isProcessing}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '25px',
                  border: '1px solid #ddd',
                  fontSize: '16px',
                  marginBottom: '12px'
                }}
              />
              <button
                className="analyze-wihy-btn"
                onClick={handleUrlUpload}
                disabled={isProcessing || !imageUrl.trim()}
                style={{
                  background: 'transparent',
                  border: '2px solid transparent',
                  borderRadius: '28px',
                  padding: '12px 24px',
                  color: '#1a73e8',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  backgroundClip: 'padding-box',
                  position: 'relative',
                  animation: 'wiH-border-sweep 2.2s linear infinite',
                  opacity: isProcessing || !imageUrl.trim() ? 0.5 : 1,
                  width: '100%'
                }}
              >
                {isProcessing ? 'Analyzing...' : 'Analyze with WiHy'}
              </button>
            </div>

            {/* Supported formats */}
            <div className="upload-info">
              <small>Supported formats: JPG, PNG, GIF, WebP (max 10MB)</small>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ImageUploadModal;
