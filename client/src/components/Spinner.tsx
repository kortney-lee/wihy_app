// Spinner.tsx
import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import './Spinner.css';

interface SpinnerProps {
  /** Full-screen overlay modal */
  overlay?: boolean;
  /** Bold heading (defaults to “Analyzing with AI…”) */
  title?: string;
  /** Secondary line (defaults to “This may take a few moments…”) */
  subtitle?: string;
  /** Prevent closing with Esc (defaults true for blocking tasks) */
  disableEsc?: boolean;
  /** Called if Esc is allowed and user presses it */
  onClose?: () => void;
  /** 0–100 for determinate; omit for indeterminate */
  progress?: number;
  /** Specify spinner type: 'circle' or 'gif' */
  type?: 'circle' | 'gif';
  /** Custom GIF source, used if type is 'gif' */
  gifSrc?: string;
}

const portalId = 'vh-spinner-portal';

function ensurePortal(): HTMLElement {
  let el = document.getElementById(portalId);
  if (!el) {
    el = document.createElement('div');
    el.id = portalId;
    document.body.appendChild(el);
  }
  return el;
}

export default function Spinner({
  overlay = false,
  title = 'Analyzing with AI...',
  subtitle = 'This may take a few moments...',
  progress,
  disableEsc = true,
  onClose,
  type = 'gif', // Force it to always be GIF
  gifSrc = '/assets/whatishealthyspinner.gif'
}: SpinnerProps) {
  // Optional: trap/allow ESC when overlayed
  useEffect(() => {
    if (!overlay) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (disableEsc) {
          e.preventDefault();
          e.stopPropagation();
        } else {
          onClose?.();
        }
      }
    };
    document.addEventListener('keydown', onKey, { capture: true });
    return () => document.removeEventListener('keydown', onKey, { capture: true } as any);
  }, [overlay, disableEsc, onClose]);

  // Non-overlay inline spinner (kept for compatibility)
  if (!overlay) {
    return (
      <div className="clean-loader" role="status" aria-live="polite">
        <div className="arc-spinner" />
        {subtitle && <p style={{ marginTop: 12 }} className="spinner-text">{subtitle}</p>}
      </div>
    );
  }

  // Overlay modal via portal to avoid z-index issues
  const portal = ensurePortal();
  const clamped =
    typeof progress === 'number'
      ? Math.max(0, Math.min(100, Math.round(progress)))
      : undefined;

  const modal = (
    <div className="spinner-overlay" role="dialog" aria-modal="true" aria-labelledby="spinner-title" aria-describedby="spinner-subtitle">
      <div className="spinner-container">
        {/* Always show GIF for testing */}
        <div className="spinner-gif">
          <img 
            src="/assets/whatishealthyspinner.gif" 
            alt="Loading..." 
            className="spinner-image"
          />
        </div>
        <h2 id="spinner-title" className="spinner-title">{title}</h2>
        {subtitle && <p id="spinner-subtitle" className="spinner-message">{subtitle}</p>}

        {type !== 'gif' && (
          <div className="spinner-progress">
            <div className="spinner-track">
              <div
                className={`spinner-fill ${clamped === undefined ? 'indeterminate' : ''}`}
                style={clamped !== undefined ? { width: `${clamped}%` } : undefined}
              />
            </div>
            <div className="spinner-percent">
              {clamped !== undefined ? `${clamped}% Complete` : 'Working…'}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return ReactDOM.createPortal(modal, portal);
}
