// Spinner.tsx
import React from 'react';
import './Spinner.css'; // or styles from './Spinner.module.css'

type SpinnerProps = {
  overlay?: boolean;      // full-screen overlay
  message?: string;       // Changed from 'text' to 'message'
};

export default function Spinner({ overlay = false, message }: SpinnerProps) {
  if (overlay) {
    return (
      <div className="results-loading-overlay" role="status" aria-live="polite">
        <div className="results-loading-content">
          <div className="clean-spinner" />
          {message && <p>{message}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="clean-loader" role="status" aria-live="polite">
      <div className="clean-spinner" />
      {message && <p style={{ marginTop: 12 }}>{message}</p>}
    </div>
  );
}