import React from 'react';

interface CaloriesCardProps {
  currentCalories?: number;
  caloriesBurned?: number;
  unit?: string;
  progressPercentage?: number;
}

const CaloriesCard: React.FC<CaloriesCardProps> = ({
  currentCalories = 1850,
  caloriesBurned = 2100,
  unit = 'kcal',
  progressPercentage = 85
}) => {
  return (
    <div className="health-metric-card">
      <div className="metric-header">
        <h3 className="metric-title">Calories</h3>
        <div className="metric-icon calories">
          📊
        </div>
      </div>
      <div className="metric-value">
        <span className="metric-value-number">{currentCalories.toLocaleString()}</span>
        <span className="metric-value-unit">{unit}</span>
      </div>
      <p className="metric-goal">Burned: {caloriesBurned.toLocaleString()} {unit}</p>
      <div className="progress-bar">
        <div className="progress-fill calories" style={{ width: `${progressPercentage}%` }}></div>
      </div>
    </div>
  );
};

export default CaloriesCard;