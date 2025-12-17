/**
 * Admin Link Generator Page
 * Simple page to generate and manage tracking links
 */

import React from 'react';
import { LinkGenerator } from '../components/tracking/LinkTracker';
import { useNavigate } from 'react-router-dom';

const AdminLinkGenerator: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f5f7fa',
      padding: '24px'
    }}>
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto' 
      }}>
        {/* Header */}
        <div style={{ 
          marginBottom: '32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h1 style={{ 
            margin: 0, 
            color: '#333',
            fontSize: '32px'
          }}>
            Link Tracking Admin
          </h1>
          <button
            onClick={() => navigate('/tracking-dashboard')}
            style={{
              padding: '12px 24px',
              backgroundColor: '#0066cc',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            View Dashboard
          </button>
        </div>

        {/* Two Column Layout */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr',
          gap: '24px',
          marginBottom: '32px'
        }}>
          {/* Link Generator */}
          <div>
            <LinkGenerator onLinkGenerated={(link) => console.log('Generated:', link)} />
          </div>

          {/* Quick Guide */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ marginTop: 0, marginBottom: '16px', color: '#333' }}>
              Quick Guide
            </h2>
            
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#555', marginBottom: '8px' }}>
                What is this for?
              </h3>
              <p style={{ margin: 0, color: '#666', fontSize: '14px', lineHeight: '1.6' }}>
                Generate unique Kickstarter links to track which partners, influencers, or campaigns 
                drive the most traffic to your Kickstarter page. Each link has a unique ID that identifies the source.
              </p>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#555', marginBottom: '8px' }}>
                Example Use Cases
              </h3>
              <ul style={{ margin: 0, paddingLeft: '20px', color: '#666', fontSize: '14px', lineHeight: '1.8' }}>
                <li><strong>Partners:</strong> Create unique links for each business partner</li>
                <li><strong>Influencers:</strong> Track which influencers drive the most traffic</li>
                <li><strong>Campaigns:</strong> Measure Kickstarter, email, or social media effectiveness</li>
                <li><strong>Beta Testers:</strong> See which testers are most engaged</li>
              </ul>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#555', marginBottom: '8px' }}>
                How it works
              </h3>
              <ol style={{ margin: 0, paddingLeft: '20px', color: '#666', fontSize: '14px', lineHeight: '1.8' }}>
                <li>Enter a unique ID (partner name, influencer ID, etc.)</li>
                <li>Optionally add a campaign name</li>
                <li>Click "Generate Link" to create a unique Kickstarter URL</li>
                <li>Share the link with that person/partner/campaign</li>
                <li>When someone clicks it, the click is tracked with that ID</li>
                <li>View all clicks in the tracking dashboard</li>
              </ol>
            </div>

            <div style={{
              padding: '16px',
              backgroundColor: '#e8f4f8',
              borderRadius: '6px',
              border: '1px solid #b3d9e8'
            }}>
              <p style={{ margin: 0, fontSize: '13px', color: '#0066cc' }}>
                💡 <strong>Tip:</strong> These links go to your Kickstarter page. The ref parameter tracks 
                who shared the link so you can see which partners, influencers, or campaigns drive the most traffic.
              </p>
            </div>
          </div>
        </div>

        {/* Example Links */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ marginTop: 0, marginBottom: '16px', color: '#333' }}>
            Example Tracking Links
          </h2>
          
          <div style={{ display: 'grid', gap: '12px' }}>
            {[
              { ref: 'partner_acme', campaign: 'partnership', description: 'For business partner ACME Corp' },
              { ref: 'influencer_jane', campaign: 'beta_launch', description: 'For Instagram influencer Jane' },
              { ref: 'email_newsletter_jan', campaign: 'january_2024', description: 'For January email newsletter' },
              { ref: 'beta_tester_42', campaign: 'beta', description: 'For beta tester #42' },
            ].map((example, index) => {
              const kickstarterUrl = 'https://www.kickstarter.com/projects/wihy/wihy-a-new-way-to-explore-food-knowledge-and-choices';
              const params = new URLSearchParams({
                ref: example.ref,
                utm_campaign: example.campaign,
                utm_source: 'wihy',
                utm_medium: 'referral'
              });
              const fullUrl = `${kickstarterUrl}?${params.toString()}`;
              
              return (
                <div key={index} style={{
                  padding: '12px',
                  backgroundColor: '#f9f9f9',
                  borderRadius: '4px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>
                      {example.description}
                    </div>
                    <div style={{ fontSize: '11px', fontFamily: 'monospace', color: '#0066cc', wordBreak: 'break-all' }}>
                      {fullUrl}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLinkGenerator;
