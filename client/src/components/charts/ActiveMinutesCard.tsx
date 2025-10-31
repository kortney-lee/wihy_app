import React from 'react';

interface ActiveMinutesCardProps {
  currentMinutes?: number;
  goalMinutes?: number;
  unit?: string;
  progressPercentage?: number;
}

const ActiveMinutesCard: React.FC<ActiveMinutesCardProps> = ({
  currentMinutes = 45,
  goalMinutes = 60,
  unit = 'min',
  progressPercentage = 75
}) => {
  return (
    <div className="health-metric-card">
      <div className="metric-header">
        <h3 className="metric-title">Active Minutes</h3>
        <div className="metric-icon active">
          🔥
        </div>
      </div>
      <div className="metric-value">
        <span className="metric-value-number">{currentMinutes}</span>
        <span className="metric-value-unit">{unit}</span>
      </div>
      <p className="metric-goal">Goal: {goalMinutes} {unit}</p>
      <div className="progress-bar">
        <div className="progress-fill active" style={{ width: `${progressPercentage}%` }}></div>
      </div>
    </div>
  );
};

export default ActiveMinutesCard;