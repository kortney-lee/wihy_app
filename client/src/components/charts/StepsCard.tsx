import React from 'react';

interface StepsCardProps {
  currentSteps?: number;
  goalSteps?: number;
  progressPercentage?: number;
}

const StepsCard: React.FC<StepsCardProps> = ({
  currentSteps = 8742,
  goalSteps = 10000,
  progressPercentage = 87
}) => {
  return (
    <div className="health-metric-card">
      <div className="metric-header">
        <h3 className="metric-title">Steps Today</h3>
        <div className="metric-icon steps">
          ✈️
        </div>
      </div>
      <div className="metric-value">
        <span className="metric-value-number">{currentSteps.toLocaleString()}</span>
      </div>
      <p className="metric-goal">Goal: {goalSteps.toLocaleString()}</p>
      <div className="progress-bar">
        <div className="progress-fill steps" style={{ width: `${progressPercentage}%` }}></div>
      </div>
    </div>
  );
};

export default StepsCard;