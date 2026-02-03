/**
 * Embedded Stripe Checkout Component
 * 
 * Renders the Stripe embedded checkout form in a modal overlay.
 * This provides a seamless checkout experience without leaving the app.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { Platform } from 'react-native';

// Only import Stripe on web
let loadStripe: any = null;
if (Platform.OS === 'web') {
  loadStripe = require('@stripe/stripe-js').loadStripe;
}

// Get publishable key from environment
const STRIPE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';

interface EmbeddedCheckoutProps {
  clientSecret: string;
  onComplete: () => void;
  onCancel: () => void;
  planName?: string;
}

export const EmbeddedCheckout: React.FC<EmbeddedCheckoutProps> = ({
  clientSecret,
  onComplete,
  onCancel,
  planName = 'Subscription',
}) => {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [checkoutInstance, setCheckoutInstance] = useState<any>(null);

  // Initialize Stripe and mount embedded checkout
  useEffect(() => {
    if (Platform.OS !== 'web' || !clientSecret) return;

    let checkout: any = null;
    let mounted = true;

    const initCheckout = async () => {
      try {
        setIsLoading(true);
        setError(null);

        if (!STRIPE_PUBLISHABLE_KEY) {
          throw new Error('Stripe publishable key not configured');
        }

        const stripe = await loadStripe(STRIPE_PUBLISHABLE_KEY);
        if (!stripe) {
          throw new Error('Failed to initialize Stripe');
        }

        if (!mounted) return;

        checkout = await stripe.initEmbeddedCheckout({
          clientSecret,
        });

        if (!mounted) {
          checkout?.destroy();
          return;
        }

        setCheckoutInstance(checkout);

        // Mount to the container
        const container = document.getElementById('stripe-checkout-container');
        if (container) {
          checkout.mount(container);
          setIsLoading(false);
        } else {
          throw new Error('Checkout container not found');
        }

      } catch (err: any) {
        console.error('[EmbeddedCheckout] Error:', err);
        if (mounted) {
          setError(err.message || 'Failed to load checkout');
          setIsLoading(false);
        }
      }
    };

    initCheckout();

    // Cleanup on unmount
    return () => {
      mounted = false;
      if (checkout) {
        try {
          checkout.destroy();
        } catch (e) {
          console.log('[EmbeddedCheckout] Cleanup error (safe to ignore):', e);
        }
      }
    };
  }, [clientSecret]);

  // Handle cancel button
  const handleCancel = useCallback(() => {
    if (checkoutInstance) {
      try {
        checkoutInstance.destroy();
      } catch (e) {
        console.log('[EmbeddedCheckout] Destroy error (safe to ignore):', e);
      }
    }
    onCancel();
  }, [checkoutInstance, onCancel]);

  // Don't render on non-web platforms
  if (Platform.OS !== 'web') {
    return null;
  }

  return (
    <div className="embedded-checkout-overlay" style={styles.overlay}>
      <div className="embedded-checkout-modal" style={styles.modal}>
        {/* Header */}
        <div style={styles.header}>
          <h2 style={styles.title}>Complete Your Purchase</h2>
          <p style={styles.subtitle}>{planName}</p>
          <button 
            onClick={handleCancel}
            style={styles.closeButton}
            aria-label="Close checkout"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div style={styles.content}>
          {isLoading && (
            <div style={styles.loadingContainer}>
              <div style={styles.spinner}></div>
              <p style={styles.loadingText}>Loading secure checkout...</p>
            </div>
          )}

          {error && (
            <div style={styles.errorContainer}>
              <p style={styles.errorText}>⚠️ {error}</p>
              <button onClick={handleCancel} style={styles.retryButton}>
                Go Back
              </button>
            </div>
          )}

          {/* Stripe checkout will be mounted here */}
          <div 
            id="stripe-checkout-container" 
            style={{
              ...styles.checkoutContainer,
              display: isLoading || error ? 'none' : 'block',
            }}
          />
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          <button onClick={handleCancel} style={styles.cancelButton}>
            ← Cancel and go back
          </button>
          <p style={styles.secureText}>
            🔒 Secured by Stripe
          </p>
        </div>
      </div>
    </div>
  );
};

// Inline styles for the modal
const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10000,
    padding: '20px',
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: '16px',
    width: '100%',
    maxWidth: '550px',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    overflow: 'hidden',
  },
  header: {
    padding: '24px 24px 16px',
    borderBottom: '1px solid #e5e7eb',
    position: 'relative',
  },
  title: {
    margin: 0,
    fontSize: '24px',
    fontWeight: 700,
    color: '#111827',
  },
  subtitle: {
    margin: '4px 0 0',
    fontSize: '14px',
    color: '#6b7280',
  },
  closeButton: {
    position: 'absolute',
    top: '16px',
    right: '16px',
    width: '32px',
    height: '32px',
    border: 'none',
    background: '#f3f4f6',
    borderRadius: '50%',
    cursor: 'pointer',
    fontSize: '16px',
    color: '#6b7280',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    overflow: 'auto',
    padding: '24px',
    minHeight: '400px',
  },
  checkoutContainer: {
    minHeight: '350px',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 20px',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '3px solid #e5e7eb',
    borderTopColor: '#3b82f6',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    marginTop: '16px',
    color: '#6b7280',
    fontSize: '14px',
  },
  errorContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 20px',
    textAlign: 'center',
  },
  errorText: {
    color: '#dc2626',
    fontSize: '16px',
    marginBottom: '16px',
  },
  retryButton: {
    padding: '12px 24px',
    backgroundColor: '#3b82f6',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 600,
  },
  footer: {
    padding: '16px 24px',
    borderTop: '1px solid #e5e7eb',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cancelButton: {
    background: 'none',
    border: 'none',
    color: '#6b7280',
    cursor: 'pointer',
    fontSize: '14px',
    padding: '8px 0',
  },
  secureText: {
    fontSize: '12px',
    color: '#9ca3af',
    margin: 0,
  },
};

// Add CSS animation for spinner
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = `
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(styleSheet);
}

export default EmbeddedCheckout;
