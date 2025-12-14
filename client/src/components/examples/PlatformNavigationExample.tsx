/**
 * Platform Navigation Examples
 * 
 * This file demonstrates how to use the usePlatformNavigation hook
 * for iOS, Android, and web-specific navigation.
 */

import React from 'react';
import { usePlatformNavigation } from '../../hooks/usePlatformNavigation';

export const PlatformNavigationExample: React.FC = () => {
  const { openInMaps, openInNativeBrowser, shareContent, platform } = usePlatformNavigation();

  return (
    <div className="p-4 space-y-4">
      {/* Platform Info */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="font-bold mb-2">Current Platform</h3>
        <p>Platform: <strong>{platform.platform}</strong></p>
        <p>iOS: {platform.isIOS ? '✅' : '❌'}</p>
        <p>Android: {platform.isAndroid ? '✅' : '❌'}</p>
        <p>Mobile: {platform.isMobile ? '✅' : '❌'}</p>
      </div>

      {/* Maps Example */}
      <button
        onClick={() => openInMaps('1600 Amphitheatre Parkway, Mountain View, CA')}
        className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
      >
        📍 Open in Maps
        <span className="text-sm block mt-1">
          {platform.isIOS && '(Apple Maps)'}
          {platform.isAndroid && '(Google Maps)'}
          {platform.isBrowser && !platform.isMobile && '(Google Maps - Web)'}
        </span>
      </button>

      {/* Browser Example */}
      <button
        onClick={() => openInNativeBrowser('https://www.wihy.ai')}
        className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        🌐 Open WIHY Website
        <span className="text-sm block mt-1">
          {platform.isMobile ? '(Native Browser)' : '(New Tab)'}
        </span>
      </button>

      {/* Share Example */}
      <button
        onClick={() => shareContent(
          'Check out WIHY!',
          'Discover the healthiest food options with AI-powered analysis',
          'https://www.wihy.ai'
        )}
        className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
      >
        📤 Share WIHY
        <span className="text-sm block mt-1">
          {platform.isMobile ? '(Native Share Sheet)' : '(Copy Link)'}
        </span>
      </button>
    </div>
  );
};

/**
 * Usage in Your Components:
 * 
 * ```tsx
 * import { usePlatformNavigation } from '../../hooks/usePlatformNavigation';
 * 
 * function MyComponent() {
 *   const { openInMaps, openInNativeBrowser, shareContent, platform } = usePlatformNavigation();
 * 
 *   // Open address in native maps
 *   const handleViewLocation = () => {
 *     openInMaps('123 Main St, San Francisco, CA');
 *   };
 * 
 *   // Open URL in native browser
 *   const handleOpenLink = () => {
 *     openInNativeBrowser('https://example.com');
 *   };
 * 
 *   // Share content
 *   const handleShare = () => {
 *     shareContent('Title', 'Description', 'https://example.com');
 *   };
 * 
 *   // Platform-specific UI
 *   if (platform.isIOS) {
 *     return <div>iOS-specific UI</div>;
 *   }
 * 
 *   return (
 *     <div>
 *       <button onClick={handleViewLocation}>View on Map</button>
 *       <button onClick={handleOpenLink}>Open Link</button>
 *       <button onClick={handleShare}>Share</button>
 *     </div>
 *   );
 * }
 * ```
 */
