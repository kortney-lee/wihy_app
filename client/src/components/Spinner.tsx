// Spinner.tsx
import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import './Spinner.css';

type SpinnerProps = {
  /** Full-screen overlay modal */
  overlay?: boolean;
  /** Bold heading (defaults to “Analyzing with AI…”) */
  title?: string;
  /** Secondary line (defaults to “This may take a few moments…”) */
  subtitle?: string;
  /** 0–100 for determinate; omit for indeterminate */
  progress?: number;
  /** Legacy alias (treated as subtitle if provided) */
  message?: string;
  /** Prevent closing with Esc (defaults true for blocking tasks) */
  disableEsc?: boolean;
  /** Called if Esc is allowed and user presses it */
  onClose?: () => void;
};

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
  message,
  disableEsc = true,
  onClose
}: SpinnerProps) {
  // Preserve legacy "message" prop as subtitle if present
  const sub = message ?? subtitle;

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
        {sub && <p style={{ marginTop: 12 }} className="spinner-text">{sub}</p>}
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
        <div className="arc-spinner" aria-hidden />
        <h2 id="spinner-title" className="spinner-title">{title}</h2>
        {sub && <p id="spinner-subtitle" className="spinner-message">{sub}</p>}

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
      </div>
    </div>
  );

  return ReactDOM.createPortal(modal, portal);
}
