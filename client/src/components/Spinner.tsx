import React from 'react';
import './Spinner.css';

interface SpinnerProps {
  message?: string;
}

const Spinner: React.FC<SpinnerProps> = ({ message = "Searching for health information..." }) => {
  return (
    <div className="spinner-overlay">
      <div className="spinner-container">
        <div className="loading-spinner"></div>
        {message && <p className="spinner-message">{message}</p>}
      </div>
    </div>
  );
};

export default Spinner;