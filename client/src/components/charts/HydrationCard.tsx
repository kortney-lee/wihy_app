import React from 'react';

interface HydrationCardProps {
  currentHydration?: number;
  goalHydration?: number;
  unit?: string;
  progressPercentage?: number;
}

const HydrationCard: React.FC<HydrationCardProps> = ({
  currentHydration = 1.8,
  goalHydration = 2.5,
  unit = 'L',
  progressPercentage = 72
}) => {
  return (
    <div className="health-metric-card">
      <div className="metric-header">
        <h3 className="metric-title">Hydration Today</h3>
        <div className="metric-icon hydration">
          💧
        </div>
      </div>
      <div className="metric-value">
        <span className="metric-value-number">{currentHydration}</span>
        <span className="metric-value-unit">{unit}</span>
      </div>
      <p className="metric-goal">Goal: {goalHydration} {unit}</p>
      <div className="progress-bar">
        <div className="progress-fill hydration" style={{ width: `${progressPercentage}%` }}></div>
      </div>
    </div>
  );
};

export default HydrationCard;