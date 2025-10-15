import React, { useState } from 'react';
import '../styles/dashboard-components.css';

const BehaviorDopamineSection: React.FC = () => {
  const [selectedTimePeriod, setSelectedTimePeriod] = useState<'day' | 'week' | 'month'>('day');
  const [activeView, setActiveView] = useState<'presence' | 'habits' | 'screen-time' | 'rewards'>('presence');

  // Calculate dynamic percentages based on behavioral data
  const calculatePresenceData = () => {
    const screenTime = 6.2; // hours
    const activityTime = 0.75; // 45 minutes in hours
    const socialConsumption = 2.5; // hours of social media/entertainment

    // Algorithm: presence increases with activity, decreases with excessive screen time
    // Connection increases with balanced consumption, decreases with excessive social media
    
    const presenceScore = Math.min(100, Math.max(0, 
      70 - (screenTime - 4) * 10 + activityTime * 20
    ));
    
    const connectionScore = Math.min(100, Math.max(0,
      80 - socialConsumption * 15 + activityTime * 10
    ));
    
    const absentScore = 100 - presenceScore;
    const distractedScore = 100 - connectionScore;
    
    return {
      presentConnected: Math.round((presenceScore * connectionScore) / 100),
      presentDistracted: Math.round((presenceScore * distractedScore) / 100),
      absentNumb: Math.round((absentScore * connectionScore) / 100),
      absentRestless: Math.round((absentScore * distractedScore) / 100)
    };
  };

  const presenceData = calculatePresenceData();

  // Single pie chart component for the center
  const SinglePieChart: React.FC<{ data: typeof presenceData }> = ({ data }) => {
    const size = 120;
    const strokeWidth = 12;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    
    // Calculate cumulative percentages for stroke positioning
    const total = data.presentConnected + data.presentDistracted + data.absentNumb + data.absentRestless;
    const segment1 = (data.presentConnected / total) * circumference;
    const segment2 = (data.presentDistracted / total) * circumference;
    const segment3 = (data.absentNumb / total) * circumference;
    const segment4 = (data.absentRestless / total) * circumference;

    return (
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#f1f5f9"
            strokeWidth={strokeWidth}
          />
          
          {/* Present + Connected (Green) */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#10b981"
            strokeWidth={strokeWidth}
            strokeDasharray={`${segment1} ${circumference - segment1}`}
            strokeDashoffset="0"
            strokeLinecap="round"
          />
          
          {/* Present + Distracted (Orange) */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#f59e0b"
            strokeWidth={strokeWidth}
            strokeDasharray={`${segment2} ${circumference - segment2}`}
            strokeDashoffset={`-${segment1}`}
            strokeLinecap="round"
          />
          
          {/* Absent + Numb (Gray) */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#6b7280"
            strokeWidth={strokeWidth}
            strokeDasharray={`${segment3} ${circumference - segment3}`}
            strokeDashoffset={`-${segment1 + segment2}`}
            strokeLinecap="round"
          />
          
          {/* Absent + Restless (Red) */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#ef4444"
            strokeWidth={strokeWidth}
            strokeDasharray={`${segment4} ${circumference - segment4}`}
            strokeDashoffset={`-${segment1 + segment2 + segment3}`}
            strokeLinecap="round"
          />
        </svg>
      </div>
    );
  };

  return (
    <div className="health-section">
      <div className="section-header">
        <h3>Behavior & Dopamine</h3>
        <div className="time-period-selector">
          <button 
            className={selectedTimePeriod === 'day' ? 'active' : ''}
            onClick={() => setSelectedTimePeriod('day')}
          >
            Day
          </button>
          <button 
            className={selectedTimePeriod === 'week' ? 'active' : ''}
            onClick={() => setSelectedTimePeriod('week')}
          >
            Week
          </button>
          <button 
            className={selectedTimePeriod === 'month' ? 'active' : ''}
            onClick={() => setSelectedTimePeriod('month')}
          >
            Month
          </button>
        </div>
      </div>

      <div className="behavior-content">
        {/* Tab Navigation */}
        <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', marginBottom: '16px' }}>
          {[
            { key: 'presence', label: 'Presence Matrix' },
            { key: 'habits', label: 'Habits' },
            { key: 'screen-time', label: 'Screen Time' },
            { key: 'rewards', label: 'Rewards' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveView(tab.key as any)}
              style={{
                padding: '8px 16px',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                fontSize: '12px',
                color: activeView === tab.key ? '#3b82f6' : '#64748b',
                borderBottom: activeView === tab.key ? '2px solid #3b82f6' : '2px solid transparent',
                fontWeight: activeView === tab.key ? 'bold' : 'normal'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {activeView === 'presence' && (
            <div style={{ padding: '16px' }}>
              {/* 4-Quadrant Layout with single pie chart in center */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gridTemplateRows: '1fr 1fr',
                gap: '8px',
                height: '200px',
                position: 'relative'
              }}>
                {/* Top Left - Present + Connected */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#f0f9ff',
                  borderRadius: '8px',
                  padding: '8px',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  color: '#374151'
                }}>
                  <div>PRESENT + CONNECTED</div>
                  <div style={{ fontSize: '16px', color: '#10b981', marginTop: '4px' }}>
                    {presenceData.presentConnected}%
                  </div>
                </div>

                {/* Top Right - Present + Distracted */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#fef3c7',
                  borderRadius: '8px',
                  padding: '8px',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  color: '#374151'
                }}>
                  <div>PRESENT + DISTRACTED</div>
                  <div style={{ fontSize: '16px', color: '#f59e0b', marginTop: '4px' }}>
                    {presenceData.presentDistracted}%
                  </div>
                </div>

                {/* Bottom Left - Absent + Numb */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#f3f4f6',
                  borderRadius: '8px',
                  padding: '8px',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  color: '#374151'
                }}>
                  <div>ABSENT + NUMB</div>
                  <div style={{ fontSize: '16px', color: '#6b7280', marginTop: '4px' }}>
                    {presenceData.absentNumb}%
                  </div>
                </div>

                {/* Bottom Right - Absent + Restless */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#fef2f2',
                  borderRadius: '8px',
                  padding: '8px',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  color: '#374151'
                }}>
                  <div>ABSENT + RESTLESS</div>
                  <div style={{ fontSize: '16px', color: '#ef4444', marginTop: '4px' }}>
                    {presenceData.absentRestless}%
                  </div>
                </div>

                {/* Single Pie Chart in Center */}
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  zIndex: 10
                }}>
                  <SinglePieChart data={presenceData} />
                </div>
              </div>
            </div>
          )}

          {activeView === 'habits' && (
            <div style={{ height: '220px', padding: '16px' }}>
              <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#374151' }}>
                Daily Habits Progress
              </h4>
              <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                Habits tracking coming soon...
              </div>
            </div>
          )}

          {activeView === 'screen-time' && (
            <div style={{ height: '220px', padding: '16px' }}>
              <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#374151' }}>
                Screen Time Analysis
              </h4>
              <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                Screen time breakdown coming soon...
              </div>
            </div>
          )}

          {activeView === 'rewards' && (
            <div style={{ height: '220px', padding: '16px' }}>
              <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#374151' }}>
                Dopamine Rewards
              </h4>
              <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                Reward system coming soon...
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BehaviorDopamineSection;