import { useMemo } from 'react';
import { isIOS, isAndroid, isMobile, isBrowser } from 'react-device-detect';

export interface PlatformInfo {
  isIOS: boolean;
  isAndroid: boolean;
  isMobile: boolean;
  isBrowser: boolean;
  platform: 'ios' | 'android' | 'web';
}

export interface NavigationHelpers {
  openInMaps: (address: string) => void;
  openInNativeBrowser: (url: string) => void;
  shareContent: (title: string, text: string, url?: string) => Promise<void>;
  platform: PlatformInfo;
}

/**
 * Hook for platform-aware navigation (iOS, Android, Web)
 * Provides helpers for opening maps, browsers, and sharing content
 */
export function usePlatformNavigation(): NavigationHelpers {
  const platform: PlatformInfo = useMemo(() => ({
    isIOS,
    isAndroid,
    isMobile,
    isBrowser,
    platform: isIOS ? 'ios' : isAndroid ? 'android' : 'web'
  }), []);

  /**
   * Open address in native maps app
   * - iOS: Opens Apple Maps
   * - Android: Opens Google Maps
   * - Web: Opens Google Maps in browser
   */
  const openInMaps = (address: string) => {
    const encodedAddress = encodeURIComponent(address);
    // Always open in web for now
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank');
  };

  /**
   * Open URL in native browser or new tab
   * - Mobile: Opens in native browser
   * - Web: Opens in new tab
   */
  const openInNativeBrowser = (url: string) => {
    // Always use window.open with _blank
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  /**
   * Share content using native share sheet or Web Share API
   * Falls back to copying to clipboard on unsupported platforms
   */
  const shareContent = async (title: string, text: string, url?: string) => {
    const shareData = {
      title,
      text,
      url
    };

    try {
      // Check if Web Share API is available (iOS/Android/modern browsers)
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback: copy to clipboard
        const shareText = `${title}\n${text}${url ? `\n${url}` : ''}`;
        await navigator.clipboard.writeText(shareText);
        alert('Link copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing:', error);
      // If share was cancelled or failed, try clipboard fallback
      try {
        const shareText = `${title}\n${text}${url ? `\n${url}` : ''}`;
        await navigator.clipboard.writeText(shareText);
        alert('Link copied to clipboard!');
      } catch (clipboardError) {
        console.error('Clipboard error:', clipboardError);
      }
    }
  };

  return {
    openInMaps,
    openInNativeBrowser,
    shareContent,
    platform
  };
}
