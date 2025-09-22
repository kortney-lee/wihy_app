import React from 'react';

const Activity: React.FC = () => {
  return (
    <div className="section-card">
      <div className="section-title">
        <h3>Activity</h3>
        <button className="btn btn--pill btn-tab--active">Today</button>
      </div>

      <div className="activity-list">
        <div className="activity-item">
          <span>Steps</span>
          <span>8,742/10,000</span>
        </div>
        <div className="progress progress--purple" style={{ marginBottom: '12px' }}>
          <div className="progress__bar" style={{ width: '87%' }}></div>
        </div>

        <div className="activity-item">
          <span>Distance</span>
          <span>6.2/8 km</span>
        </div>
        <div className="progress progress--blue" style={{ marginBottom: '12px' }}>
          <div className="progress__bar" style={{ width: '78%' }}></div>
        </div>

        <div className="activity-item">
          <span>Active Minutes</span>
          <span>45/60 min</span>
        </div>
        <div className="progress progress--green" style={{ marginBottom: '12px' }}>
          <div className="progress__bar" style={{ width: '75%' }}></div>
        </div>
      </div>

      {/* Activity Chart Placeholder */}
      <div style={{ 
        height: '160px', 
        backgroundColor: '#f8fafc', 
        borderRadius: '8px',
        marginTop: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#64748b',
        fontSize: '14px',
        border: '2px dashed #e2e8f0'
      }}>
        Activity Chart
      </div>
    </div>
  );
};

export default Activity;