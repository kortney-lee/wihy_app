import React from 'react';
import ReactDOM from 'react-dom/client';
import './utils/productionConsole'; // Must be first - disables console.log in production
import './styles/VHealthSearch.css';
import App from './App';
import { BarcodeDetector as BarcodeDetectorPolyfill } from 'barcode-detector';

// Polyfill BarcodeDetector API for browsers that don't support it natively
if (typeof window !== 'undefined' && !('BarcodeDetector' in window)) {
  // @ts-ignore
  window.BarcodeDetector = BarcodeDetectorPolyfill;
}

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);