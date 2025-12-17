import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Copy, Check, Download, Share2, Link2, QrCode, ExternalLink } from 'lucide-react';
import TrackingHeader from '../components/layout/TrackingHeader';

interface PartnerInfo {
  trackingId: string;
  name: string;
  email: string;
  createdAt: string;
}

const PartnerHub: React.FC = () => {
  const navigate = useNavigate();
  const [partnerInfo, setPartnerInfo] = useState<PartnerInfo | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [customCampaign, setCustomCampaign] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  useEffect(() => {
    // TODO: Fetch partner info from API
    // For now, use demo data
    setPartnerInfo({
      trackingId: 'demo_partner_123',
      name: 'Demo Partner',
      email: 'partner@example.com',
      createdAt: new Date().toISOString(),
    });
  }, []);

  useEffect(() => {
    if (partnerInfo) {
      // Generate QR code URL
      const trackingUrl = getTrackingUrl();
      setQrCodeUrl(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(trackingUrl)}`);
    }
  }, [partnerInfo, customCampaign]);

  const getTrackingUrl = (campaign?: string) => {
    if (!partnerInfo) return '';
    const baseUrl = window.location.origin;
    const campaignParam = campaign || customCampaign || 'default';
    return `${baseUrl}/?ref=${partnerInfo.trackingId}&campaign=${encodeURIComponent(campaignParam)}`;
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const downloadQRCode = () => {
    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = `wihy-qr-${partnerInfo?.trackingId}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const presetCampaigns = [
    { name: 'Instagram Story', value: 'instagram_story' },
    { name: 'Instagram Post', value: 'instagram_post' },
    { name: 'TikTok', value: 'tiktok' },
    { name: 'YouTube', value: 'youtube' },
    { name: 'Twitter/X', value: 'twitter' },
    { name: 'Email Newsletter', value: 'email_newsletter' },
    { name: 'Blog Post', value: 'blog_post' },
    { name: 'Podcast', value: 'podcast' },
  ];

  if (!partnerInfo) {
    return (
      <div className="min-h-screen overflow-hidden" style={{ backgroundColor: '#f0f7ff' }}>
        <TrackingHeader />
        <div className="mx-auto max-w-6xl px-6 py-10">
          <div className="rounded-3xl bg-white p-10 text-center shadow-sm ring-1 ring-slate-200">
            <div className="mx-auto h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900" />
            <div className="mt-3 text-sm text-slate-600">Loading your hub...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-hidden" style={{ backgroundColor: '#f0f7ff' }}>
      <TrackingHeader />
      
      <div className="mx-auto max-w-6xl px-6 py-10">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              Your Partner Hub
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Get your tracking links, QR codes, and promotional materials
            </p>
          </div>

          <button
            onClick={() => navigate('/engagement-dashboard')}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
          >
            <ExternalLink className="h-4 w-4" />
            <span>View Dashboard</span>
          </button>
        </div>

        {/* Partner Info */}
        <div className="mt-6 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Partner Details</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <div className="text-xs font-medium text-slate-500">Name</div>
              <div className="mt-1 text-sm font-semibold text-slate-900">{partnerInfo.name}</div>
            </div>
            <div>
              <div className="text-xs font-medium text-slate-500">Email</div>
              <div className="mt-1 text-sm font-semibold text-slate-900">{partnerInfo.email}</div>
            </div>
            <div>
              <div className="text-xs font-medium text-slate-500">Tracking ID</div>
              <div className="mt-1 font-mono text-sm font-semibold text-slate-900">{partnerInfo.trackingId}</div>
            </div>
          </div>
        </div>

        {/* Main Tracking Link */}
        <div className="mt-8 rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
              <Link2 className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Your Main Tracking Link</h2>
              <p className="text-sm text-slate-600">Share this link to track all your referrals</p>
            </div>
          </div>

          <div className="mt-6 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
            <div className="flex items-center gap-3">
              <div className="flex-1 overflow-hidden">
                <input
                  type="text"
                  value={getTrackingUrl()}
                  readOnly
                  className="w-full border-0 bg-transparent font-mono text-sm text-slate-900 focus:outline-none"
                />
              </div>
              <button
                onClick={() => copyToClipboard(getTrackingUrl(), 'main')}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
              >
                {copied === 'main' ? (
                  <>
                    <Check className="h-4 w-4" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* QR Code Section */}
        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 ring-1 ring-purple-100">
                <QrCode className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-900">QR Code</h2>
                <p className="text-sm text-slate-600">For print materials and in-person sharing</p>
              </div>
            </div>

            <div className="mt-6 flex flex-col items-center">
              <div className="rounded-2xl bg-white p-4 shadow-lg ring-1 ring-slate-200">
                <img
                  src={qrCodeUrl}
                  alt="QR Code"
                  className="h-64 w-64"
                />
              </div>

              <button
                onClick={downloadQRCode}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-purple-700"
              >
                <Download className="h-4 w-4" />
                <span>Download QR Code</span>
              </button>

              <p className="mt-4 text-center text-xs text-slate-500">
                High-resolution PNG • 300x300px • Perfect for printing
              </p>
            </div>
          </div>

          {/* Campaign-Specific Links */}
          <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-green-600 ring-1 ring-green-100">
                <Share2 className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Campaign Links</h2>
                <p className="text-sm text-slate-600">Track performance by platform</p>
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-slate-700">
                Custom Campaign Name
              </label>
              <input
                type="text"
                value={customCampaign}
                onChange={(e) => setCustomCampaign(e.target.value)}
                placeholder="e.g., spring_promotion"
                className="mt-2 block w-full rounded-xl border-0 px-4 py-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-slate-900 sm:text-sm"
              />
            </div>

            <div className="mt-6 space-y-3">
              <div className="text-sm font-medium text-slate-700">Quick Presets</div>
              {presetCampaigns.map((campaign) => (
                <div key={campaign.value} className="flex items-center justify-between rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="text-sm font-medium text-slate-900">{campaign.name}</div>
                    <div className="font-mono text-xs text-slate-500">{campaign.value}</div>
                  </div>
                  <button
                    onClick={() => copyToClipboard(getTrackingUrl(campaign.value), campaign.value)}
                    className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50"
                  >
                    {copied === campaign.value ? (
                      <span className="flex items-center gap-1">
                        <Check className="h-3 w-3" />
                        Copied
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <Copy className="h-3 w-3" />
                        Copy
                      </span>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* How to Use Section */}
        <div className="mt-8 rounded-3xl bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-8 ring-1 ring-slate-200">
          <h2 className="text-xl font-semibold text-slate-900">How to Use Your Links</h2>
          
          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="rounded-2xl bg-white/80 p-6 shadow-sm ring-1 ring-slate-200">
              <div className="text-3xl">📱</div>
              <h3 className="mt-4 text-base font-semibold text-slate-900">Social Media</h3>
              <p className="mt-2 text-sm text-slate-600">
                Add your tracking link to your Instagram bio, TikTok profile, or YouTube description. Use campaign-specific links in posts.
              </p>
            </div>

            <div className="rounded-2xl bg-white/80 p-6 shadow-sm ring-1 ring-slate-200">
              <div className="text-3xl">🖨️</div>
              <h3 className="mt-4 text-base font-semibold text-slate-900">Print Materials</h3>
              <p className="mt-2 text-sm text-slate-600">
                Download your QR code and add it to business cards, flyers, posters, or any printed materials.
              </p>
            </div>

            <div className="rounded-2xl bg-white/80 p-6 shadow-sm ring-1 ring-slate-200">
              <div className="text-3xl">✉️</div>
              <h3 className="mt-4 text-base font-semibold text-slate-900">Email & Newsletter</h3>
              <p className="mt-2 text-sm text-slate-600">
                Include your tracking link in email signatures, newsletters, or promotional emails to track engagement.
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-2xl bg-white/80 p-6 shadow-sm ring-1 ring-slate-200">
            <h3 className="text-base font-semibold text-slate-900">💡 Pro Tips</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li className="flex items-start gap-2">
                <span className="text-green-600">•</span>
                <span>Use different campaign names for each platform to see which drives the most engagement</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600">•</span>
                <span>Check your dashboard regularly to see real-time performance</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600">•</span>
                <span>QR codes work great for live events, packaging, and physical locations</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600">•</span>
                <span>Create custom campaign names that are easy to remember and track</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PartnerHub;
