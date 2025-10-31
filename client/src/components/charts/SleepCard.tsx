import React from 'react';

interface SleepCardProps {
  sleepHours?: number;
  sleepQuality?: number;
  unit?: string;
  progressPercentage?: number;
}

const SleepCard: React.FC<SleepCardProps> = ({
  sleepHours = 7.2,
  sleepQuality = 82,
  unit = 'hrs',
  progressPercentage = 82
}) => {
  return (
    <div className="health-metric-card">
      <div className="metric-header">
        <h3 className="metric-title">Sleep Last Night</h3>
        <div className="metric-icon sleep">
          🌙
        </div>
      </div>
      <div className="metric-value">
        <span className="metric-value-number">{sleepHours}</span>
        <span className="metric-value-unit">{unit}</span>
      </div>
      <p className="metric-goal">Quality: {sleepQuality}%</p>
      <div className="progress-bar">
        <div className="progress-fill sleep" style={{ width: `${progressPercentage}%` }}></div>
      </div>
    </div>
  );
};

export default SleepCard;