import React, { useState } from 'react';
import { ActivityChart } from './Charts';

type TimePeriod = 'day' | 'week' | 'month';
type ActivityView = 'steps' | 'distance' | 'calories' | 'activities';

const ActivityMovementSection: React.FC = () => {
  const [activePeriod, setActivePeriod] = useState<TimePeriod>('week');
  const [activeView, setActiveView] = useState<ActivityView>('steps');

  const todaysStats = {
    steps: 8420,
    distance: 6.2, // km
    calories: 385,
    activeMinutes: 42
  };

  const goals = {
    steps: 10000,
    distance: 8.0,
    calories: 450,
    activeMinutes: 60
  };

  return (
    <div className="section-card">
      <div className="section-title">
        <h3>🏃‍♂️ Activity & Movement</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button 
            className="analyze-wihy-btn"
            onClick={() => console.log("Analyze my activity and movement data: activity levels, step counts, movement patterns, exercise performance, calorie burn")}
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
          className={`btn btn--sm ${activeView === 'steps' ? 'btn--primary' : 'btn--secondary'}`}
          onClick={() => setActiveView('steps')}
        >
          Steps Trend
        </button>
        <button 
          className={`btn btn--sm ${activeView === 'distance' ? 'btn--primary' : 'btn--secondary'}`}
          onClick={() => setActiveView('distance')}
        >
          Distance & Pace
        </button>
        <button 
          className={`btn btn--sm ${activeView === 'calories' ? 'btn--primary' : 'btn--secondary'}`}
          onClick={() => setActiveView('calories')}
        >
          Calories vs Steps
        </button>
        <button 
          className={`btn btn--sm ${activeView === 'activities' ? 'btn--primary' : 'btn--secondary'}`}
          onClick={() => setActiveView('activities')}
        >
          Activity Types
        </button>
      </div>

      <div className="chart-row">
        <div className="chart-box">
          {activeView === 'steps' && (
            <>
              <ActivityChart period={activePeriod} chartType="steps" />
              <div className="chart-legend">
                <span className="legend-swatch swatch-blue"></span>
                <span>Daily Steps</span>
                <span className="legend-swatch swatch-green"></span>
                <span>Goal (10k)</span>
                <span className="legend-swatch swatch-purple"></span>
                <span>7-day average</span>
              </div>
            </>
          )}

          {activeView === 'distance' && (
            <>
              <ActivityChart period={activePeriod} chartType="distance" />
              <div className="chart-legend">
                <span className="legend-swatch swatch-cyan"></span>
                <span>Distance (km)</span>
                <span className="legend-swatch swatch-orange"></span>
                <span>Avg Pace (min/km)</span>
              </div>
            </>
          )}

          {activeView === 'calories' && (
            <div style={{ height: '220px', padding: '16px' }}>
              <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#374151' }}>
                Calories Burned vs Steps Correlation
              </h4>
              
              {/* Scatter plot for calories vs steps */}
              <div style={{ 
                position: 'relative', 
                width: '100%', 
                height: '160px', 
                backgroundColor: '#f8fafc',
                borderRadius: '8px',
                border: '1px solid #e2e8f0'
              }}>
                {/* Y-axis label */}
                <div style={{
                  position: 'absolute',
                  left: '8px',
                  top: '50%',
                  transform: 'translateY(-50%) rotate(-90deg)',
                  fontSize: '11px',
                  color: '#64748b',
                  transformOrigin: 'center'
                }}>
                  Calories Burned
                </div>
                
                {/* X-axis label */}
                <div style={{
                  position: 'absolute',
                  bottom: '8px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  fontSize: '11px',
                  color: '#64748b'
                }}>
                  Daily Steps (thousands)
                </div>

                {/* Sample correlation points with different activity types */}
                {[
                  { x: 25, y: 25, steps: '6.2k', calories: '285', type: 'walking', color: '#3b82f6' },
                  { x: 35, y: 45, steps: '8.1k', calories: '350', type: 'mixed', color: '#10b981' },
                  { x: 45, y: 60, steps: '9.5k', calories: '420', type: 'jogging', color: '#f59e0b' },
                  { x: 65, y: 75, steps: '12k', calories: '485', type: 'running', color: '#ef4444' },
                  { x: 75, y: 85, steps: '13.2k', calories: '520', type: 'hiking', color: '#8b5cf6' },
                ].map((point, index) => (
                  <div
                    key={index}
                    style={{
                      position: 'absolute',
                      left: `${point.x}%`,
                      top: `${100 - point.y}%`,
                      width: '10px',
                      height: '10px',
                      backgroundColor: point.color,
                      borderRadius: '50%',
                      transform: 'translate(-50%, -50%)',
                      cursor: 'pointer',
                      border: '2px solid white',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                    title={`${point.steps} steps, ${point.calories} cal (${point.type})`}
                  />
                ))}

                {/* Trend line */}
                <svg style={{ 
                  position: 'absolute', 
                  top: 0, 
                  left: 0, 
                  width: '100%', 
                  height: '100%',
                  pointerEvents: 'none'
                }}>
                  <line 
                    x1="20%" 
                    y1="80%" 
                    x2="80%" 
                    y2="15%" 
                    stroke="#10b981" 
                    strokeWidth="2" 
                    strokeDasharray="4,4"
                  />
                </svg>
              </div>

              <div style={{ 
                display: 'flex', 
                gap: '8px',
                marginTop: '8px',
                fontSize: '10px',
                flexWrap: 'wrap'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <div style={{ width: '8px', height: '8px', backgroundColor: '#3b82f6', borderRadius: '50%' }}></div>
                  <span>Walking</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <div style={{ width: '8px', height: '8px', backgroundColor: '#10b981', borderRadius: '50%' }}></div>
                  <span>Mixed</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <div style={{ width: '8px', height: '8px', backgroundColor: '#f59e0b', borderRadius: '50%' }}></div>
                  <span>Jogging</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <div style={{ width: '8px', height: '8px', backgroundColor: '#ef4444', borderRadius: '50%' }}></div>
                  <span>Running</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <div style={{ width: '8px', height: '8px', backgroundColor: '#8b5cf6', borderRadius: '50%' }}></div>
                  <span>Hiking</span>
                </div>
              </div>
            </div>
          )}

          {activeView === 'activities' && (
            <>
              <ActivityChart period={activePeriod} chartType="activity-types" />
              <div className="chart-legend">
                <span className="legend-swatch" style={{ backgroundColor: '#3b82f6' }}></span>
                <span>Walking</span>
                <span className="legend-swatch" style={{ backgroundColor: '#10b981' }}></span>
                <span>Running</span>
                <span className="legend-swatch" style={{ backgroundColor: '#f59e0b' }}></span>
                <span>Cycling</span>
                <span className="legend-swatch" style={{ backgroundColor: '#ef4444' }}></span>
                <span>Other</span>
              </div>
            </>
          )}
        </div>

        {/* Activity Summary Cards */}
        <div className="metric-col">
          <div style={{ marginBottom: '16px' }}>
            <p className="card-title">Today's Progress</p>
            
            {/* Goal Progress Rings */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
              {[
                { label: 'Steps', value: todaysStats.steps, goal: goals.steps, unit: '', color: '#3b82f6' },
                { label: 'Distance', value: todaysStats.distance, goal: goals.distance, unit: 'km', color: '#10b981' },
                { label: 'Calories', value: todaysStats.calories, goal: goals.calories, unit: '', color: '#f59e0b' },
                { label: 'Active Min', value: todaysStats.activeMinutes, goal: goals.activeMinutes, unit: 'min', color: '#ef4444' }
              ].map((metric, index) => {
                const percentage = Math.min((metric.value / metric.goal) * 100, 100);
                return (
                  <div key={index} style={{ textAlign: 'center' }}>
                    <div style={{ position: 'relative', width: '60px', height: '60px', margin: '0 auto' }}>
                      <svg width="60" height="60" style={{ transform: 'rotate(-90deg)' }}>
                        <circle
                          cx="30"
                          cy="30"
                          r="25"
                          fill="none"
                          stroke="#e2e8f0"
                          strokeWidth="4"
                        />
                        <circle
                          cx="30"
                          cy="30"
                          r="25"
                          fill="none"
                          stroke={metric.color}
                          strokeWidth="4"
                          strokeDasharray={`${2 * Math.PI * 25}`}
                          strokeDashoffset={`${2 * Math.PI * 25 * (1 - percentage / 100)}`}
                          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                        />
                      </svg>
                      <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        fontSize: '9px',
                        fontWeight: 'bold',
                        color: metric.color,
                        textAlign: 'center'
                      }}>
                        {Math.round(percentage)}%
                      </div>
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                      {metric.label}
                    </div>
                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#374151' }}>
                      {typeof metric.value === 'number' && metric.value % 1 !== 0 ? 
                        metric.value.toFixed(1) : 
                        metric.value.toLocaleString()}{metric.unit}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <p className="card-title">This Week</p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '8px' }}>
              <h4 className="card-value">67.2k</h4>
              <span style={{ fontSize: '12px', color: '#059669', fontWeight: 500 }}>
                +8% vs last week
              </span>
            </div>
            <p style={{ fontSize: '11px', color: '#64748b', margin: '4px 0 0' }}>
              steps total
            </p>
          </div>

          {/* Activity Streak */}
          <div style={{ 
            padding: '12px', 
            backgroundColor: '#fef3c7', 
            borderRadius: '8px',
            border: '1px solid #fbbf24',
            marginBottom: '12px'
          }}>
            <p className="card-title" style={{ fontSize: '12px', marginBottom: '6px', color: '#92400e' }}>
              🔥 Activity Streak
            </p>
            <p style={{ 
              margin: 0, 
              fontSize: '11px', 
              color: '#92400e',
              lineHeight: '1.4'
            }}>
              5 days reaching your step goal! Keep it up to build the habit.
            </p>
          </div>

          {/* Most Active Time */}
          <div style={{ 
            padding: '12px', 
            backgroundColor: '#f0f9ff', 
            borderRadius: '8px',
            border: '1px solid #e0f2fe'
          }}>
            <p className="card-title" style={{ fontSize: '12px', marginBottom: '6px', color: '#0369a1' }}>
              📊 Peak Activity
            </p>
            <p style={{ 
              margin: 0, 
              fontSize: '11px', 
              color: '#0369a1',
              lineHeight: '1.4'
            }}>
              Most active: 6-8 PM (avg 2,100 steps/hour)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityMovementSection;