// Spinner.tsx
import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';

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
    el.style.position = 'fixed';
    el.style.inset = '0';
    el.style.zIndex = '2000';
    el.style.pointerEvents = 'none'; // Allow clicks through when empty
    document.body.appendChild(el);
  }
  // Don't clear innerHTML - let React manage the portal content
  el.style.pointerEvents = 'auto'; // Block clicks when spinner is active
  return el;
}

export default function Spinner({
  overlay = false,
  title = 'Analyzing with AI...',
  subtitle = 'This may take a few moments...',
  progress,
  disableEsc = true,
  onClose,
  type = 'gif',
  gifSrc = '/assets/whatishealthyspinner.gif'
}: SpinnerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(overlay);

  // Handle fade in/out animations for seamless transitions
  useEffect(() => {
    if (overlay) {
      setShouldRender(true);
      // Small delay to trigger fade-in animation
      const timer = setTimeout(() => setIsVisible(true), 10);
      return () => clearTimeout(timer);
    } else {
      // Fade out before unmounting
      setIsVisible(false);
      const timer = setTimeout(() => setShouldRender(false), 200); // Match animation duration
      return () => clearTimeout(timer);
    }
  }, [overlay]);
  
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

  // Cleanup portal when overlay unmounts
  useEffect(() => {
    if (!overlay) return;
    
    return () => {
      // Just reset pointer events, don't touch the DOM
      const portal = document.getElementById(portalId);
      if (portal && portal.childNodes.length === 0) {
        portal.style.pointerEvents = 'none';
      }
    };
  }, [overlay]);

  // Non-overlay inline spinner (kept for compatibility)
  if (!overlay && !shouldRender) {
    return (
      <div className="flex flex-col items-center" role="status" aria-live="polite">
        <div className="w-10 h-10 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
        {subtitle && <p className="mt-3 text-gray-600 text-sm">{subtitle}</p>}
      </div>
    );
  }

  // Don't render anything if shouldn't be visible
  if (!shouldRender) return null;

  // Overlay modal via portal to avoid z-index issues
  const portal = ensurePortal();
  const clamped =
    typeof progress === 'number'
      ? Math.max(0, Math.min(100, Math.round(progress)))
      : undefined;

  const modal = (
    <div 
      className="fixed inset-0 bg-black/75 backdrop-blur-sm flex flex-col items-center justify-center z-[2000]" 
      style={{
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 200ms ease-in-out'
      }}
      role="dialog" 
      aria-modal="true" 
      aria-labelledby="spinner-title" 
      aria-describedby="spinner-subtitle"
    >
      <div className="flex flex-col items-center text-center">
        {/* Google-style GIF spinner */}
        <div className="mb-4">
          <img 
            src={gifSrc} 
            alt="Loading..." 
            className="w-16 h-16 object-contain"
          />
        </div>
        <h2 id="spinner-title" className="text-white text-xl font-normal mb-2 drop-shadow-md">{title}</h2>
        {subtitle && <p id="spinner-subtitle" className="text-white/90 text-sm drop-shadow-sm">{subtitle}</p>}
      </div>
    </div>
  );

  return ReactDOM.createPortal(modal, portal);
}
