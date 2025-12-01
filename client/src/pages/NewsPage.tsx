import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/shared/Header';
import HealthNewsFeed from '../components/HealthNewsFeed';
import ImageUploadModal from '../components/ui/ImageUploadModal';
import MultiAuthLogin from '../components/shared/MultiAuthLogin';
import FullScreenChat, { FullScreenChatRef } from '../components/ui/FullScreenChat';
import { CSS_CLASSES } from '../constants/cssConstants';
import { PlatformDetectionService } from '../services/shared/platformDetectionService';
import './NewsPage.css';

const NewsPage: React.FC = () => {
  const navigate = useNavigate();
  const chatRef = useRef<FullScreenChatRef>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  // Detect system dark/light mode
  const [isDarkMode, setIsDarkMode] = useState(
    window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const handleAnalyzeArticle = (query: string) => {
    // Navigate to main search page with the query
    navigate('/', { state: { searchQuery: query, autoSearch: true } });
  };

  const handleUniversalSearch = (searchQuery: string) => {
    // Navigate to home page with search query
    navigate('/', { state: { searchQuery, autoSearch: true } });
  };

  const handleAnalysisComplete = (result: any) => {
    setIsUploadModalOpen(false);
    // Navigate to home page with the analysis result
    navigate('/', { state: { analysisResult: result, autoSearch: true } });
  };

  return (
    <div className="news-page">
      {/* Desktop Login Button - Hidden on mobile/native */}
      <div style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 10002,
        display: PlatformDetectionService.isNative() ? 'none' : 'block'
      }}>
        <MultiAuthLogin className="main-login-button" position="top-right" />
      </div>

      <Header 
        variant="results"
        showLogin={false}
        showSearchInput={true}
        onSearchSubmit={handleUniversalSearch}
      />
      <div style={{ height: '40px' }}></div>
      <div className={CSS_CLASSES.DASHBOARD_CONTAINER}>
        <HealthNewsFeed 
          maxArticles={24}
          onAnalyzeArticle={handleAnalyzeArticle}
        />
      </div>

      {/* IMAGE UPLOAD MODAL */}
      <ImageUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onAnalysisComplete={handleAnalysisComplete}
        title="Analyze Food"
        subtitle="Scan barcodes, search products, or analyze images"
      />

      {/* FULL SCREEN CHAT */}
      <FullScreenChat
        ref={chatRef}
        userId="news-page-user"
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
      />

      {/* BOTTOM NAVIGATION - Mobile-friendly menu for Android */}
      {PlatformDetectionService.isNative() && (
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: '56px',
          backgroundColor: isDarkMode ? '#1f1f1f' : '#ffffff',
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          borderTop: `1px solid ${isDarkMode ? '#2d2d2d' : '#e0e0e0'}`,
          zIndex: 1200,
          boxShadow: isDarkMode ? 'none' : '0 -2px 8px rgba(0, 0, 0, 0.1)'
        }}>
          {/* Search - Navigate to Home */}
          <button
            onClick={() => navigate('/')}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'flex-start',
              background: 'none',
              border: 'none',
              color: isDarkMode ? '#e0e0e0' : '#5f6368',
              padding: '0',
              cursor: 'pointer',
              gap: '4px',
              transition: 'color 0.2s'
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
            </svg>
            <span style={{ fontSize: '11px', fontWeight: '500' }}>Search</span>
          </button>

          {/* Scan - Camera/Upload */}
          <button
            onClick={() => setIsUploadModalOpen(true)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'flex-start',
              background: 'none',
              border: 'none',
              color: isDarkMode ? '#e0e0e0' : '#5f6368',
              padding: '0',
              cursor: 'pointer',
              gap: '4px',
              transition: 'color 0.2s'
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/>
            </svg>
            <span style={{ fontSize: '11px', fontWeight: '500' }}>Scan</span>
          </button>

          {/* Chat - Toggle chat */}
          <button
            onClick={() => setIsChatOpen(!isChatOpen)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'flex-start',
              background: 'none',
              border: 'none',
              color: isChatOpen ? '#4cbb17' : (isDarkMode ? '#e0e0e0' : '#5f6368'),
              padding: '0',
              cursor: 'pointer',
              gap: '4px',
              transition: 'color 0.2s'
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
            </svg>
            <span style={{ fontSize: '11px', fontWeight: '500' }}>Chat</span>
          </button>

          {/* News - Current Page (highlighted when not in chat) */}
          <button
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'flex-start',
              background: 'none',
              border: 'none',
              color: !isChatOpen ? '#4cbb17' : (isDarkMode ? '#e0e0e0' : '#5f6368'),
              padding: '0',
              cursor: 'pointer',
              gap: '4px',
              transition: 'color 0.2s'
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
            </svg>
            <span style={{ fontSize: '11px', fontWeight: '500' }}>News</span>
          </button>

          {/* Login/Account */}
          <button
            onClick={() => {
              // Trigger the login button click
              const loginButton = document.querySelector('.main-login-button button');
              if (loginButton) {
                (loginButton as HTMLElement).click();
              }
            }}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'flex-start',
              background: 'none',
              border: 'none',
              color: isDarkMode ? '#e0e0e0' : '#5f6368',
              padding: '0',
              cursor: 'pointer',
              gap: '4px',
              transition: 'color 0.2s'
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
            </svg>
            <span style={{ fontSize: '11px', fontWeight: '500' }}>Login</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default NewsPage;
