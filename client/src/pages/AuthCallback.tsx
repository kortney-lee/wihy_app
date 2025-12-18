/**
 * OAuth Callback Page
 * Handles OAuth redirects from authentication providers (Google, Microsoft, Facebook, Apple, ADP/uKonnect)
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '../services/authService';

type CallbackStatus = 'working' | 'success' | 'error';

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');
  const errorDesc = searchParams.get('error_description') || searchParams.get('ERROR_DESCRIPTION');
  const provider = searchParams.get('provider') || 'unknown';

  const [status, setStatus] = useState<CallbackStatus>('working');
  const [message, setMessage] = useState('Finalizing connection...');
  const [details, setDetails] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const handleCallback = async () => {
      // Handle OAuth errors
      if (error) {
        setStatus('error');
        setMessage('Connection failed.');
        setDetails(errorDesc || error);
        setTimeout(() => navigate('/dashboard'), 3000);
        return;
      }

      // Validate required parameters
      if (!code || !state) {
        setStatus('error');
        setMessage('Missing callback parameters.');
        setDetails('Expected OAuth callback parameters were not present.');
        setTimeout(() => navigate('/dashboard'), 3000);
        return;
      }

      try {
        setStatus('working');
        setMessage('Exchanging authorization code...');

        // Option 1: If this is for auth login (not integrations)
        if (provider === 'google' || provider === 'microsoft' || provider === 'facebook' || provider === 'apple') {
          const result = await authService.handleOAuthCallback(provider as any, code, state);
          
          if (result.success) {
            if (cancelled) return;
            setStatus('success');
            setMessage('Authentication successful! Redirecting...');
            setTimeout(() => navigate('/'), 1000);
          } else {
            throw new Error(result.error || 'Authentication failed');
          }
        } 
        // Option 2: If this is for integrations (ADP, health apps, etc.)
        else {
          const res = await fetch('/api/oauth/callback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ code, state, provider }),
          });

          const data = await res.json().catch(() => ({}));

          if (!res.ok || data?.success === false) {
            const msg = data?.message || 'Token exchange failed.';
            throw new Error(msg);
          }

          if (cancelled) return;

          setStatus('success');
          setMessage('Connected successfully.');
          setDetails(null);

          // Redirect to settings with success message
          const redirectTo = data?.redirectTo || '/dashboard';
          setTimeout(() => navigate(redirectTo), 900);
        }
      } catch (e: any) {
        if (cancelled) return;
        setStatus('error');
        setMessage('Connection failed.');
        setDetails(e?.message || 'Unknown error');
        setTimeout(() => navigate('/dashboard'), 3000);
      }
    };

    handleCallback();
    return () => {
      cancelled = true;
    };
  }, [code, state, error, errorDesc, provider, navigate]);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#0f172a',
      color: '#f1f5f9'
    }}>
      <div style={{
        maxWidth: '600px',
        padding: '40px',
        margin: '0 16px'
      }}>
        <div style={{
          backgroundColor: '#1e293b',
          border: '1px solid #334155',
          borderRadius: '16px',
          padding: '32px'
        }}>
          <div style={{
            fontSize: '12px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: '#94a3b8',
            marginBottom: '8px'
          }}>
            OAuth Callback
          </div>

          <h1 style={{
            fontSize: '24px',
            fontWeight: 600,
            margin: '8px 0',
            color: status === 'error' ? '#ef4444' : status === 'success' ? '#10b981' : '#f1f5f9'
          }}>
            {status === 'working' && 'Connecting...'}
            {status === 'success' && 'Connected'}
            {status === 'error' && 'Could not connect'}
          </h1>

          <p style={{
            fontSize: '14px',
            color: '#cbd5e1',
            margin: '8px 0 0'
          }}>
            {message}
          </p>

          {/* Status indicator */}
          {status === 'working' && (
            <div style={{
              marginTop: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                border: '3px solid #334155',
                borderTopColor: '#3b82f6',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
              <span style={{ fontSize: '12px', color: '#64748b' }}>
                Please do not close this tab
              </span>
            </div>
          )}

          {/* Error details */}
          {details && (
            <div style={{
              marginTop: '16px',
              backgroundColor: '#0f172a',
              border: '1px solid #334155',
              borderRadius: '12px',
              padding: '16px'
            }}>
              <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>
                Details
              </div>
              <div style={{ fontSize: '14px', color: '#f1f5f9', wordBreak: 'break-word' }}>
                {details}
              </div>
            </div>
          )}

          {/* Action buttons */}
          {status !== 'working' && (
            <div style={{
              marginTop: '24px',
              display: 'flex',
              gap: '12px',
              flexWrap: 'wrap'
            }}>
              <button
                onClick={() => navigate('/dashboard')}
                style={{
                  padding: '10px 20px',
                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                  color: '#6ee7b7',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              >
                Go to {provider === 'google' || provider === 'microsoft' || provider === 'facebook' || provider === 'apple' ? 'Home' : 'Integrations'}
              </button>
              <button
                onClick={() => navigate('/')}
                style={{
                  padding: '10px 20px',
                  backgroundColor: 'rgba(100, 116, 139, 0.7)',
                  color: '#f1f5f9',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              >
                Home
              </button>
            </div>
          )}
        </div>

        {/* Help text */}
        <p style={{
          marginTop: '16px',
          fontSize: '12px',
          color: '#475569',
          textAlign: 'center'
        }}>
          If this keeps failing, the issue is usually an invalid redirect URI, state mismatch,
          or missing OAuth scopes/entitlements.
        </p>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default AuthCallback;
