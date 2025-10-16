import React from 'react';
import ReactDOM from 'react-dom/client';
import './utils/productionConsole'; // Must be first - disables console.log in production
import './styles/VHealthSearch.css';
import App from './App';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);