import React, { useState } from 'react';

type TimePeriod = 'day' | 'week' | 'month';
type InsightView = 'health-score' | 'correlations' | 'personal-bests' | 'goal-progress';

interface CorrelationData {
  metric1: string;
  metric2: string;
  correlation: number; // -1 to 1
  strength: 'weak' | 'moderate' | 'strong';
  insight: string;
}

interface PersonalBest {
  metric: string;
  value: string;
  date: string;
  improvement: string;
  category: string;
}

const InsightsDashboardSection: React.FC = () => {
  const [activePeriod, setActivePeriod] = useState<TimePeriod>('week');
  const [activeView, setActiveView] = useState<InsightView>('health-score');

  const correlations: CorrelationData[] = [
    {
      metric1: 'Steps', 
      metric2: 'Sleep Quality', 
      correlation: 0.78, 
      strength: 'strong',
      insight: '10k+ step days improve sleep quality by avg 15%'
    },
    {
      metric1: 'Morning Meditation', 
      metric2: 'Daily Mood', 
      correlation: 0.65, 
      strength: 'moderate',
      insight: 'Meditation sessions boost average mood from 6.2 to 8.1'
    },
    {
      metric1: 'Screen Time', 
      metric2: 'Energy Levels', 
      correlation: -0.52, 
      strength: 'moderate',
      insight: 'High screen time days correlate with 20% lower energy'
    },
    {
      metric1: 'Water Intake', 
      metric2: 'Headache Frequency', 
      correlation: -0.71, 
      strength: 'strong',
      insight: 'Proper hydration reduces headache incidents by 80%'
    }
  ];

  const personalBests: PersonalBest[] = [
    { metric: 'Daily Steps', value: '15,420', date: '3 days ago', improvement: '+23% vs avg', category: 'Activity' },
    { metric: 'Sleep Quality', value: '94%', date: '1 week ago', improvement: 'Personal best', category: 'Recovery' },
    { metric: 'Hydration Goal', value: '7 days', date: 'Current', improvement: 'Longest streak', category: 'Nutrition' },
    { metric: 'Morning Routine', value: '100%', date: '2 weeks ago', improvement: '14-day streak', category: 'Habits' },
    { metric: 'Stress Score', value: '18/100', date: '5 days ago', improvement: 'Lowest ever', category: 'Mental Health' }
  ];

  const healthScoreComponents = [
    { category: 'Physical Activity', score: 92, weight: 25, color: '#10b981' },
    { category: 'Nutrition', score: 78, weight: 20, color: '#06b6d4' },
    { category: 'Sleep & Recovery', score: 85, weight: 20, color: '#8b5cf6' },
    { category: 'Mental Health', score: 88, weight: 15, color: '#f59e0b' },
    { category: 'Hydration', score: 74, weight: 10, color: '#3b82f6' },
    { category: 'Vital Signs', score: 95, weight: 10, color: '#ef4444' }
  ];

  const overallHealthScore = Math.round(
    healthScoreComponents.reduce((sum, comp) => sum + (comp.score * comp.weight / 100), 0)
  );

  return (
    <div className="section-card">
      <div className="section-title">
        <h3>📊 Insights & Combined Dashboard</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button 
            className="analyze-wihy-btn"
            onClick={() => console.log("Analyze my comprehensive health insights: health correlations, predictive insights, performance trends, holistic analysis")}
          >
            <span>Analyze with WiHy</span>
          </button>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              className={`btn btn--pill ${activePeriod === 'day' ? 'btn-tab--active' : 'btn-tab'}`}
              onClick={() => setActivePeriod('day')}
            >
              Day
            </button>
            <button 
              className={`btn btn--pill ${activePeriod === 'week' ? 'btn-tab--active' : 'btn-tab'}`}
              onClick={() => setActivePeriod('week')}
            >
              Week
            </button>
            <button 
              className={`btn btn--pill ${activePeriod === 'month' ? 'btn-tab--active' : 'btn-tab'}`}
              onClick={() => setActivePeriod('month')}
            >
              Month
            </button>
          </div>
        </div>
      </div>

      {/* View Selector */}
      <div style={{ 
        display: 'flex', 
        gap: '8px', 
        marginBottom: '16px',
        flexWrap: 'wrap'
      }}>
        <button 
          className={`btn btn--sm ${activeView === 'health-score' ? 'btn--primary' : 'btn--secondary'}`}
          onClick={() => setActiveView('health-score')}
        >
          7-Day Health Score
        </button>
        <button 
          className={`btn btn--sm ${activeView === 'correlations' ? 'btn--primary' : 'btn--secondary'}`}
          onClick={() => setActiveView('correlations')}
        >
          Correlation Matrix
        </button>
        <button 
          className={`btn btn--sm ${activeView === 'personal-bests' ? 'btn--primary' : 'btn--secondary'}`}
          onClick={() => setActiveView('personal-bests')}
        >
          Personal Bests
        </button>
        <button 
          className={`btn btn--sm ${activeView === 'goal-progress' ? 'btn--primary' : 'btn--secondary'}`}
          onClick={() => setActiveView('goal-progress')}
        >
          Goal Progress Radial
        </button>
      </div>

      <div style={{ padding: '24px' }}>
        <div className="chart-split-layout">
          <div className="chart-full-width">
          {activeView === 'health-score' && (
            <div style={{ height: '220px', padding: '16px' }}>
              <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#374151' }}>
                Composite Health Score Breakdown
              </h4>
              
              {/* Health score components */}
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column',
                gap: '8px'
              }}>
                {healthScoreComponents.map((component, index) => (
                  <div key={index} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '8px',
                    backgroundColor: '#f8fafc',
                    borderRadius: '6px'
                  }}>
                    {/* Category name and weight */}
                    <div style={{ flex: 1, minWidth: '120px' }}>
                      <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#374151' }}>
                        {component.category}
                      </div>
                      <div style={{ fontSize: '9px', color: '#64748b' }}>
                        {component.weight}% weight
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div style={{ flex: 2, minWidth: '80px' }}>
                      <div style={{ 
                        width: '100%', 
                        height: '8px', 
                        backgroundColor: '#e2e8f0', 
                        borderRadius: '4px',
                        overflow: 'hidden'
                      }}>
                        <div style={{ 
                          width: `${component.score}%`, 
                          height: '100%', 
                          backgroundColor: component.color,
                          borderRadius: '4px',
                          transition: 'width 0.5s ease'
                        }} />
                      </div>
                    </div>

                    {/* Score */}
                    <div style={{ 
                      fontSize: '12px', 
                      fontWeight: 'bold', 
                      color: component.color,
                      minWidth: '32px',
                      textAlign: 'right'
                    }}>
                      {component.score}
                    </div>
                  </div>
                ))}
              </div>

              {/* Overall score */}
              <div style={{ 
                marginTop: '12px',
                padding: '12px',
                backgroundColor: '#f0fdf4',
                borderRadius: '8px',
                border: '1px solid #bbf7d0',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#15803d' }}>
                  {overallHealthScore}/100
                </div>
                <div style={{ fontSize: '11px', color: '#15803d' }}>
                  Overall Health Score
                </div>
              </div>
            </div>
          )}

          {activeView === 'correlations' && (
            <div style={{ height: '220px', padding: '16px' }}>
              <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#374151' }}>
                Health Metric Correlations
              </h4>
              
              {/* Correlation heatmap simulation */}
              <div style={{ 
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '4px',
                marginBottom: '12px'
              }}>
                {[
                  { x: 'Sleep', y: 'Mood', r: 0.82, color: '#10b981' },
                  { x: 'Exercise', y: 'Energy', r: 0.75, color: '#10b981' },
                  { x: 'Screen Time', y: 'Sleep', r: -0.61, color: '#f59e0b' },
                  { x: 'Stress', y: 'HRV', r: -0.58, color: '#f59e0b' },
                  { x: 'Hydration', y: 'Focus', r: 0.67, color: '#06b6d4' },
                  { x: 'Steps', y: 'Mood', r: 0.54, color: '#06b6d4' },
                  { x: 'Meditation', y: 'Stress', r: -0.71, color: '#10b981' },
                  { x: 'Social', y: 'Happiness', r: 0.63, color: '#06b6d4' }
                ].map((cell, index) => (
                  <div
                    key={index}
                    style={{
                      aspectRatio: '1',
                      backgroundColor: cell.color,
                      borderRadius: '4px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '8px',
                      textAlign: 'center',
                      padding: '2px',
                      cursor: 'pointer',
                      opacity: 0.8 + Math.abs(cell.r) * 0.2
                    }}
                    title={`${cell.x} vs ${cell.y}: ${cell.r > 0 ? '+' : ''}${(cell.r * 100).toFixed(0)}%`}
                  >
                    <div style={{ fontWeight: 'bold', fontSize: '6px', lineHeight: 1 }}>
                      {cell.x}
                    </div>
                    <div style={{ fontSize: '5px', margin: '1px 0' }}>vs</div>
                    <div style={{ fontWeight: 'bold', fontSize: '6px', lineHeight: 1 }}>
                      {cell.y}
                    </div>
                    <div style={{ fontSize: '7px', marginTop: '1px' }}>
                      {(Math.abs(cell.r) * 100).toFixed(0)}%
                    </div>
                  </div>
                ))}
              </div>

              {/* Key correlations */}
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column',
                gap: '4px'
              }}>
                {correlations.slice(0, 3).map((corr, index) => (
                  <div key={index} style={{ 
                    padding: '6px 8px',
                    backgroundColor: '#f8fafc',
                    borderRadius: '4px',
                    fontSize: '10px'
                  }}>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      marginBottom: '2px'
                    }}>
                      <span style={{ fontWeight: 'bold', color: '#374151' }}>
                        {corr.metric1} → {corr.metric2}
                      </span>
                      <span style={{ 
                        color: corr.correlation > 0.6 ? '#10b981' : 
                               corr.correlation > 0.3 ? '#f59e0b' : '#64748b'
                      }}>
                        {corr.correlation > 0 ? '+' : ''}{(corr.correlation * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div style={{ color: '#64748b', fontSize: '9px' }}>
                      {corr.insight}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeView === 'personal-bests' && (
            <div style={{ height: '220px', padding: '16px' }}>
              <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#374151' }}>
                Personal Best Timeline
              </h4>
              
              {/* Personal bests list with timeline */}
              <div style={{ position: 'relative', paddingLeft: '16px' }}>
                {/* Timeline line */}
                <div style={{
                  position: 'absolute',
                  left: '6px',
                  top: '0',
                  bottom: '0',
                  width: '2px',
                  backgroundColor: '#e2e8f0'
                }} />

                {personalBests.map((best, index) => (
                  <div key={index} style={{
                    position: 'relative',
                    marginBottom: '12px',
                    paddingLeft: '12px'
                  }}>
                    {/* Timeline dot */}
                    <div style={{
                      position: 'absolute',
                      left: '-5px',
                      top: '2px',
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      backgroundColor: '#fbbf24',
                      border: '2px solid white',
                      boxShadow: '0 0 0 1px #e2e8f0'
                    }} />
                    
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: '8px'
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#374151' }}>
                          {best.metric}
                        </div>
                        <div style={{ fontSize: '9px', color: '#64748b' }}>
                          {best.category} • {best.date}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#fbbf24' }}>
                          {best.value}
                        </div>
                        <div style={{ fontSize: '8px', color: '#059669' }}>
                          {best.improvement}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ 
                marginTop: '8px',
                padding: '8px',
                backgroundColor: '#fef3c7',
                borderRadius: '6px',
                border: '1px solid #fbbf24'
              }}>
                <p style={{ 
                  margin: 0, 
                  fontSize: '10px', 
                  color: '#92400e'
                }}>
                  🏆 You've set 5 personal bests this month! Keep up the momentum.
                </p>
              </div>
            </div>
          )}

          {activeView === 'goal-progress' && (
            <div style={{ height: '220px', padding: '16px' }}>
              <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#374151' }}>
                Goal Progress Radial Dashboard
              </h4>
              
              {/* Radial progress rings */}
              <div style={{ 
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '12px',
                marginBottom: '12px'
              }}>
                {[
                  { goal: 'Daily Steps', progress: 84, color: '#10b981', current: '8,420', target: '10,000' },
                  { goal: 'Water Intake', progress: 74, color: '#06b6d4', current: '1.85L', target: '2.5L' },
                  { goal: 'Sleep Hours', progress: 96, color: '#8b5cf6', current: '7.2h', target: '7.5h' },
                  { goal: 'Active Minutes', progress: 70, color: '#f59e0b', current: '42 min', target: '60 min' },
                  { goal: 'Meditation', progress: 100, color: '#ef4444', current: '15 min', target: '15 min' },
                  { goal: 'Screen Time', progress: 78, color: '#64748b', current: '5.2h', target: '<6h' }
                ].map((goal, index) => (
                  <div key={index} style={{ textAlign: 'center' }}>
                    <div style={{ position: 'relative', width: '60px', height: '60px', margin: '0 auto 6px' }}>
                      <svg width="60" height="60" style={{ transform: 'rotate(-90deg)' }}>
                        <circle
                          cx="30"
                          cy="30"
                          r="25"
                          fill="none"
                          stroke="#f1f5f9"
                          strokeWidth="6"
                        />
                        <circle
                          cx="30"
                          cy="30"
                          r="25"
                          fill="none"
                          stroke={goal.color}
                          strokeWidth="6"
                          strokeDasharray={`${2 * Math.PI * 25}`}
                          strokeDashoffset={`${2 * Math.PI * 25 * (1 - goal.progress / 100)}`}
                          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        fontSize: '10px',
                        fontWeight: 'bold',
                        color: goal.color
                      }}>
                        {goal.progress}%
                      </div>
                    </div>
                    <div style={{ fontSize: '9px', color: '#64748b', marginBottom: '2px' }}>
                      {goal.goal}
                    </div>
                    <div style={{ fontSize: '8px', fontWeight: 'bold', color: '#374151' }}>
                      {goal.current}
                    </div>
                  </div>
                ))}
              </div>

              {/* Weekly goal summary */}
              <div style={{ 
                padding: '8px',
                backgroundColor: '#f0fdf4',
                borderRadius: '6px',
                border: '1px solid #bbf7d0',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#15803d', marginBottom: '2px' }}>
                  5/6 Daily Goals Met This Week
                </div>
                <div style={{ fontSize: '10px', color: '#15803d' }}>
                  Average completion: 83% • Best day: 100% (2 days ago)
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Insights Summary Cards */}
        <div className="metric-col">
          <div style={{ marginBottom: '16px' }}>
            <p className="card-title">Key Insights</p>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '12px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>{overallHealthScore}</div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>health score</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#fbbf24' }}>5</div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>new bests</div>
              </div>
            </div>

            {/* Top correlation */}
            <div style={{ marginTop: '12px' }}>
              <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>
                Strongest Pattern
              </div>
              <div style={{ 
                fontSize: '11px', 
                fontWeight: 'bold', 
                color: '#10b981',
                padding: '6px 8px',
                backgroundColor: '#f0fdf4',
                borderRadius: '4px',
                border: '1px solid #bbf7d0'
              }}>
                Steps → Sleep Quality (+78%)
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <p className="card-title">Weekly Trend</p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '8px' }}>
              <h4 className="card-value">Improving</h4>
              <span style={{ fontSize: '12px', color: '#059669', fontWeight: 500 }}>
                +7 points
              </span>
            </div>
          </div>

          {/* AI Health Insight */}
          <div style={{ 
            padding: '12px', 
            backgroundColor: '#f0f9ff', 
            borderRadius: '8px',
            border: '1px solid #e0f2fe'
          }}>
            <p className="card-title" style={{ fontSize: '12px', marginBottom: '6px', color: '#0369a1' }}>
              🤖 AI Health Coach
            </p>
            <p style={{ 
              margin: 0, 
              fontSize: '11px', 
              color: '#0369a1',
              lineHeight: '1.4'
            }}>
              Your data shows that maintaining 10k+ steps consistently could boost your overall health score by 8-12 points within 2 weeks.
            </p>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InsightsDashboardSection;