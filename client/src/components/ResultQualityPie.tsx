import React from 'react';

interface ResultQualityPieProps {
  qualityScore: number; // 0 to 1, where 1 is 100% good
}

const ResultQualityPie: React.FC<ResultQualityPieProps> = ({ qualityScore }) => {
  // Calculate the stroke dasharray for the SVG circle
  const circumference = 2 * Math.PI * 90; // 2πr where r=90
  const goodOffset = circumference * (1 - qualityScore);
  const goodPercentage = Math.round(qualityScore * 100);
  const badPercentage = 100 - goodPercentage;
  
  return (
    <div style={{ width: 220, margin: '0 auto', textAlign: 'center' }}>
      <svg width="220" height="220" viewBox="0 0 220 220">
        {/* Background circle (red - bad) */}
        <circle 
          cx="110" 
          cy="110" 
          r="90" 
          fill="transparent" 
          stroke="#f44336" 
          strokeWidth="30"
        />
        {/* Foreground circle (green - good) */}
        <circle 
          cx="110" 
          cy="110" 
          r="90" 
          fill="transparent" 
          stroke="#4caf50" 
          strokeWidth="30"
          strokeDasharray={circumference}
          strokeDashoffset={goodOffset}
          transform="rotate(-90, 110, 110)"
        />
        {/* White center */}
        <circle 
          cx="110" 
          cy="110" 
          r="70" 
          fill="white" 
        />
        {/* Score text */}
        <text 
          x="110" 
          y="105" 
          textAnchor="middle" 
          fontSize="24" 
          fontWeight="bold"
        >
          {goodPercentage}%
        </text>
        <text 
          x="110" 
          y="130" 
          textAnchor="middle" 
          fontSize="16"
        >
          Quality
        </text>
      </svg>
      
      {/* Verdict */}
      <div style={{ fontWeight: 600, marginTop: 8 }}>
        {qualityScore > 0.7 ? '👍 Good Result' : '⚠️ Needs Review'}
      </div>
      
      {/* Legend */}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', marginRight: 16 }}>
          <div style={{ width: 12, height: 12, backgroundColor: '#4caf50', marginRight: 4 }}></div>
          <span>Good: {goodPercentage}%</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ width: 12, height: 12, backgroundColor: '#f44336', marginRight: 4 }}></div>
          <span>Bad: {badPercentage}%</span>
        </div>
      </div>
    </div>
  );
};

export default ResultQualityPie;