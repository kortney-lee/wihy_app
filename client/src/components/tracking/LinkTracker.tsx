/**
 * Link Tracking Component
 * Generates trackable links and captures referral information
 */

import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

// Link tracking service
export class LinkTrackingService {
  private static STORAGE_KEY = 'wihy_link_tracking';
  
  /**
   * Generate a tracking link with user/partner reference
   * @param userId User or partner identifier
   * @param campaign Optional campaign name
   * @param destination Optional destination URL (defaults to Kickstarter)
   * @returns URL with tracking parameters
   */
  static generateTrackingLink(userId: string, campaign?: string, destination?: string): string {
    const defaultKickstarterUrl = 'https://www.kickstarter.com/projects/wihy/wihy-a-new-way-to-explore-food-knowledge-and-choices';
    const targetUrl = destination || defaultKickstarterUrl;
    
    const params = new URLSearchParams({
      ref: userId,
      ...(campaign && { utm_campaign: campaign }),
      utm_source: 'wihy',
      utm_medium: 'referral'
    });
    
    // Check if URL already has query parameters
    const separator = targetUrl.includes('?') ? '&' : '?';
    return `${targetUrl}${separator}${params.toString()}`;
  }

  /**
   * Track outbound clicks to external destinations (Kickstarter, Instagram, etc.)
   * Preserves the original source attribution (e.g., Facebook → wihy.ai → Kickstarter)
   * @param userId Current referrer ID
   * @param campaign Optional campaign name
   * @param destinationUrl The URL being clicked to
   */
  static trackOutboundClick(userId: string, destinationUrl: string, campaign?: string): void {
    // Get the original source if it exists (e.g., Facebook)
    const originalSource = sessionStorage.getItem('wihy_original_source') || userId;
    const originalCampaign = sessionStorage.getItem('wihy_original_campaign') || campaign;

    const trackingData = {
      referrer: userId,
      campaign: campaign || 'outbound_click',
      timestamp: new Date().toISOString(),
      destinationUrl,
      originalSource,  // This preserves Facebook → wihy.ai → Kickstarter chain
      eventType: 'outbound' as const
    };
    
    // Store in localStorage
    const existingClicks = localStorage.getItem('wihy_outbound_clicks');
    const clicks = existingClicks ? JSON.parse(existingClicks) : [];
    clicks.push(trackingData);
    localStorage.setItem('wihy_outbound_clicks', JSON.stringify(clicks));
    
    // Send to analytics endpoint
    this.sendTrackingData(trackingData);
  }

  /**
   * @deprecated Use trackOutboundClick instead
   */
  static trackKickstarterClick(userId: string, campaign?: string): void {
    this.trackOutboundClick(
      userId, 
      'https://www.kickstarter.com/projects/wihy/wihy-a-new-way-to-explore-food-knowledge-and-choices',
      campaign
    );
  }

  /**
   * Get current tracking data
   */
  static getTrackingData(): any {
    const data = localStorage.getItem(this.STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  }

  /**
   * Send tracking data to backend
   */
  private static async sendTrackingData(data: any): Promise<void> {
    try {
      await fetch('/api/tracking/capture', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });
    } catch (error) {
      console.error('Failed to send tracking data:', error);
    }
  }

  /**
   * Clear tracking data
   */
  static clearTracking(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }
}

// Hook for tracking in components
export const useTracking = () => {
  const location = useLocation();
  const [trackingData, setTrackingData] = useState<any>(null);

  useEffect(() => {
    // Get existing tracking data
    setTrackingData(LinkTrackingService.getTrackingData());
  }, [location.search]);

  return {
    trackingData,
    generateLink: LinkTrackingService.generateTrackingLink,
    trackClick: LinkTrackingService.trackKickstarterClick,
    clearTracking: LinkTrackingService.clearTracking
  };
};

// Link Generator Component
interface LinkGeneratorProps {
  onLinkGenerated?: (link: string) => void;
}

export const LinkGenerator: React.FC<LinkGeneratorProps> = ({ onLinkGenerated }) => {
  const [userId, setUserId] = useState('');
  const [campaign, setCampaign] = useState('');
  const [destination, setDestination] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');
  const [copied, setCopied] = useState(false);

  const handleGenerate = () => {
    if (!userId.trim()) {
      alert('Please enter a user ID or partner name');
      return;
    }

    const link = LinkTrackingService.generateTrackingLink(
      userId, 
      campaign || undefined,
      destination || undefined
    );
    setGeneratedLink(link);
    onLinkGenerated?.(link);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <div style={{
      maxWidth: '600px',
      margin: '0 auto',
      padding: '24px',
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    }}>
      <h2 style={{ marginBottom: '24px', color: '#333' }}>Generate Tracking Link</h2>
      
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#555' }}>
          Partner/Source ID *
        </label>
        <input
          type="text"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          placeholder="e.g., partner_acme, influencer_jane, email_jan"
          style={{
            width: '100%',
            padding: '12px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '14px'
          }}
        />
        <small style={{ color: '#666', fontSize: '12px', marginTop: '4px', display: 'block' }}>
          Identifies who is sharing this link
        </small>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#555' }}>
          Campaign Name (Optional)
        </label>
        <input
          type="text"
          value={campaign}
          onChange={(e) => setCampaign(e.target.value)}
          placeholder="e.g., kickstarter, beta_launch, social_media"
          style={{
            width: '100%',
            padding: '12px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '14px'
          }}
        />
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#555' }}>
          Destination URL (Optional)
        </label>
        <input
          type="text"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          placeholder="Leave blank for Kickstarter, or enter any URL"
          style={{
            width: '100%',
            padding: '12px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '14px'
          }}
        />
        <small style={{ color: '#666', fontSize: '12px', marginTop: '4px', display: 'block' }}>
          Defaults to WIHY Kickstarter page if not specified
        </small>
      </div>

      <button
        onClick={handleGenerate}
        style={{
          width: '100%',
          padding: '12px',
          backgroundColor: '#4cbb17',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          fontSize: '16px',
          fontWeight: '600',
          cursor: 'pointer',
          marginBottom: '16px'
        }}
      >
        Generate Link
      </button>

      {generatedLink && (
        <div style={{
          padding: '16px',
          backgroundColor: '#f5f5f5',
          borderRadius: '4px',
          marginTop: '16px'
        }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#555' }}>
            Your Tracking Link:
          </label>
          <div style={{
            display: 'flex',
            gap: '8px',
            alignItems: 'center'
          }}>
            <input
              type="text"
              value={generatedLink}
              readOnly
              style={{
                flex: 1,
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px',
                backgroundColor: 'white'
              }}
            />
            <button
              onClick={handleCopy}
              style={{
                padding: '12px 24px',
                backgroundColor: copied ? '#4cbb17' : '#0066cc',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {copied ? '✓ Copied!' : 'Copy'}
            </button>
          </div>
          <small style={{ color: '#666', fontSize: '12px', marginTop: '8px', display: 'block' }}>
            This link goes to your Kickstarter page with tracking for {userId}
          </small>
        </div>
      )}
    </div>
  );
};

export default LinkGenerator;
