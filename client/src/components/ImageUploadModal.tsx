// src/components/ImageUploadModal.tsx
import React, { useState } from 'react';
import '../VHealthSearch.css';

interface ImageUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFileSelect: (file: File) => Promise<void>;
  title?: string;
  subtitle?: string;
}

const ImageUploadModal: React.FC<ImageUploadModalProps> = ({
  isOpen,
  onClose,
  onFileSelect,
  title = "Search any image with vHealth",
  subtitle = "Upload food, medical, or health-related images for AI analysis"
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

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
    const file = e.target.files?.[0];
    if (file) {
      await processFile(file);
    }
  };

  // Handle URL upload
  const handleUrlUpload = async () => {
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
  };

  // Process file and call parent handler
  const processFile = async (file: File) => {
    setIsProcessing(true);
    try {
      await onFileSelect(file);
      // Close modal after successful upload
      onClose();
      setImageUrl('');
    } catch (error) {
      console.error('Error processing file:', error);
      // Don't close modal on error so user can try again
    } finally {
      setIsProcessing(false);
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
              <p className="upload-text">Processing image...</p>
            ) : (
              <p className="upload-text">
                {isDragging ? 'Drop image here' : 'Drag an image here or'}{' '}
                <button 
                  className="upload-link"
                  onClick={() => document.getElementById('modal-file-input')?.click()}
                  disabled={isProcessing}
                >
                  upload a file
                </button>
              </p>
            )}
          </div>
          
          <input
            id="modal-file-input"
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleFileInput}
            disabled={isProcessing}
          />
        </div>
        
        {/* Divider */}
        <div className="modal-divider">
          <span>OR</span>
        </div>
        
        {/* URL Input */}
        <div className="url-input-section">
          <input
            type="url"
            placeholder="Paste image URL"
            className="url-input"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleUrlUpload();
              }
            }}
            disabled={isProcessing}
          />
          <button 
            className={`search-button-modal ${isProcessing ? 'processing' : ''}`}
            onClick={handleUrlUpload}
            disabled={isProcessing || !imageUrl.trim()}
          >
            {isProcessing ? 'Loading...' : 'Search'}
          </button>
        </div>
        
        {/* Supported formats */}
        <div className="upload-info">
          <small>Supported formats: JPG, PNG, GIF, WebP (max 10MB)</small>
        </div>
      </div>
    </div>
  );
};

export default ImageUploadModal;