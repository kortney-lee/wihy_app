import React from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  goal?: string;
  icon: React.ReactNode;
  iconColor: string;
  progress: number;
}

const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  unit, 
  goal, 
  icon, 
  iconColor,
  progress 
}) => (
  <div className="card">
    <div className="card-row">
      <div>
        <p className="card-title">{title}</p>
        <h3 className="card-value">
          {value} {unit && <span style={{ fontSize: '14px', fontWeight: 400 }}>{unit}</span>}
        </h3>
        {goal && <p className="card-sub">{goal}</p>}
      </div>
      <div className={`icon-circle ${iconColor}`}>
        {icon}
      </div>
    </div>
    <div style={{ marginTop: '12px' }}>
      <div className={`progress progress--${iconColor.replace('icon--', '')}`}>
        <div className="progress__bar" style={{ width: `${progress}%` }}></div>
      </div>
    </div>
  </div>
);

export default MetricCard;