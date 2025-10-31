import React from 'react';

interface CurrentWeightCardProps {
  currentWeight?: number;
  goalWeight?: number;
  unit?: string;
  progressPercentage?: number;
}

const CurrentWeightCard: React.FC<CurrentWeightCardProps> = ({
  currentWeight = 68.5,
  goalWeight = 65,
  unit = 'kg',
  progressPercentage = 70
}) => {
  return (
    <div className="health-metric-card">
      <div className="metric-header">
        <h3 className="metric-title">Current Weight</h3>
        <div className="metric-icon weight">
          ⏰
        </div>
      </div>
      <div className="metric-value">
        <span className="metric-value-number">{currentWeight}</span>
        <span className="metric-value-unit">{unit}</span>
      </div>
      <p className="metric-goal">Goal: {goalWeight} {unit}</p>
      <div className="progress-bar">
        <div className="progress-fill weight" style={{ width: `${progressPercentage}%` }}></div>
      </div>
    </div>
  );
};

export default CurrentWeightCard;