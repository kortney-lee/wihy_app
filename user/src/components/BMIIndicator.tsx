import React from 'react';

interface BMIIndicatorProps {
  value: number;
}

const BMIIndicator: React.FC<BMIIndicatorProps> = ({ value }) => (
  <div className="slider-track">
    <div className="slider-gradient"></div>
    <div 
      className="slider-thumb" 
      style={{ left: `${Math.max(0, Math.min(100, (value - 16) * 5))}%` }}
    ></div>
  </div>
);

export default BMIIndicator;