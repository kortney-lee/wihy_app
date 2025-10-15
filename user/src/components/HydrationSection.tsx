import React, { useState } from 'react';
import { ActivityChart } from './Charts';

type TimePeriod = 'day' | 'week' | 'month';
type HydrationView = 'intake' | 'goals' | 'correlation';

const HydrationSection: React.FC = () => {
  const [activePeriod, setActivePeriod] = useState<TimePeriod>('week');
  const [activeView, setActiveView] = useState<HydrationView>('intake');

  const dailyGoal = 2500; // ml
  const todaysIntake = 1850; // ml
  const percentageComplete = Math.round((todaysIntake / dailyGoal) * 100);

  return (
    <div className="section-card">
      <div className="section-title">
        <h3>💧 Hydration</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button 
            className="analyze-wihy-btn"
            onClick={() => console.log("Analyze my hydration data: hydration levels, intake patterns, goal achievement, fluid balance")}
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
          className={`btn btn--sm ${activeView === 'intake' ? 'btn--primary' : 'btn--secondary'}`}
          onClick={() => setActiveView('intake')}
        >
          Daily Intake
        </button>
        <button 
          className={`btn btn--sm ${activeView === 'goals' ? 'btn--primary' : 'btn--secondary'}`}
          onClick={() => setActiveView('goals')}
        >
          Goal Progress
        </button>
        <button 
          className={`btn btn--sm ${activeView === 'correlation' ? 'btn--primary' : 'btn--secondary'}`}
          onClick={() => setActiveView('correlation')}
        >
          Hydration vs Activity
        </button>
      </div>

      <div className="chart-row">
        <div className="chart-box">
          {activeView === 'intake' && (
            <>
              <ActivityChart period={activePeriod} chartType="hydration" />
              <div className="chart-legend">
                <span className="legend-swatch swatch-blue"></span>
                <span>Water Intake (ml)</span>
                <span className="legend-swatch swatch-green"></span>
                <span>Daily Goal (2500ml)</span>
              </div>
            </>
          )}

          {activeView === 'goals' && (
            <div style={{ height: '220px', padding: '16px' }}>
              <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#374151' }}>
                Goal Achievement This {activePeriod === 'day' ? 'Hour' : activePeriod === 'week' ? 'Week' : 'Month'}
              </h4>
              
              {/* Circular Progress Indicator */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center',
                height: '120px'
              }}>
                <div style={{ position: 'relative', width: '100px', height: '100px' }}>
                  <svg width="100" height="100" style={{ transform: 'rotate(-90deg)' }}>
                    {/* Background circle */}
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="#e2e8f0"
                      strokeWidth="8"
                    />
                    {/* Progress circle */}
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="#06b6d4"
                      strokeWidth="8"
                      strokeDasharray={`${2 * Math.PI * 45}`}
                      strokeDashoffset={`${2 * Math.PI * 45 * (1 - percentageComplete / 100)}`}
                      style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                    />
                  </svg>
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#06b6d4' }}>
                      {percentageComplete}%
                    </div>
                    <div style={{ fontSize: '10px', color: '#64748b' }}>
                      of goal
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                marginTop: '16px',
                padding: '12px',
                backgroundColor: '#f8fafc',
                borderRadius: '8px'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#06b6d4' }}>
                    {todaysIntake}ml
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>Current</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#10b981' }}>
                    {dailyGoal}ml
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>Goal</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#f59e0b' }}>
                    {dailyGoal - todaysIntake}ml
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>Remaining</div>
                </div>
              </div>
            </div>
          )}

          {activeView === 'correlation' && (
            <div style={{ height: '220px', padding: '16px' }}>
              <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#374151' }}>
                Hydration vs Activity Levels
              </h4>
              
              {/* Bar chart simulation showing hydration vs activity correlation */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'end', 
                justifyContent: 'space-between',
                height: '140px',
                padding: '0 12px'
              }}>
                {[
                  { day: 'Mon', hydration: 85, activity: 60, water: 2100, steps: 8200 },
                  { day: 'Tue', hydration: 92, activity: 88, water: 2300, steps: 12100 },
                  { day: 'Wed', hydration: 78, activity: 45, water: 1950, steps: 6800 },
                  { day: 'Thu', hydration: 95, activity: 92, water: 2380, steps: 13500 },
                  { day: 'Fri', hydration: 88, activity: 75, water: 2200, steps: 10200 },
                  { day: 'Sat', hydration: 91, activity: 85, water: 2275, steps: 11800 },
                  { day: 'Sun', hydration: 74, activity: 40, water: 1850, steps: 5900 }
                ].map((data, index) => (
                  <div key={index} style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <div style={{ 
                      display: 'flex',
                      alignItems: 'end',
                      gap: '2px'
                    }}>
                      {/* Hydration bar */}
                      <div
                        style={{
                          width: '10px',
                          height: `${data.hydration}px`,
                          backgroundColor: '#06b6d4',
                          borderRadius: '2px 2px 0 0'
                        }}
                        title={`${data.water}ml water`}
                      />
                      {/* Activity bar */}
                      <div
                        style={{
                          width: '10px',
                          height: `${data.activity}px`,
                          backgroundColor: '#10b981',
                          borderRadius: '2px 2px 0 0'
                        }}
                        title={`${data.steps} steps`}
                      />
                    </div>
                    <span style={{ fontSize: '10px', color: '#64748b' }}>
                      {data.day}
                    </span>
                  </div>
                ))}
              </div>

              <div style={{ 
                display: 'flex', 
                justifyContent: 'center',
                gap: '16px',
                marginTop: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <div style={{ width: '8px', height: '8px', backgroundColor: '#06b6d4', borderRadius: '2px' }}></div>
                  <span style={{ fontSize: '10px', color: '#64748b' }}>Hydration</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <div style={{ width: '8px', height: '8px', backgroundColor: '#10b981', borderRadius: '2px' }}></div>
                  <span style={{ fontSize: '10px', color: '#64748b' }}>Activity</span>
                </div>
              </div>

              <div style={{ 
                marginTop: '12px',
                padding: '8px',
                backgroundColor: '#f0fdf4',
                borderRadius: '6px',
                border: '1px solid #bbf7d0'
              }}>
                <p style={{ 
                  margin: 0, 
                  fontSize: '11px', 
                  color: '#15803d'
                }}>
                  📈 Pattern: Higher activity days correlate with better hydration habits
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Hydration Summary Cards */}
        <div className="metric-col">
          <div style={{ marginBottom: '16px' }}>
            <p className="card-title">Today's Progress</p>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '12px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#06b6d4' }}>1.85</div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>liters</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>{percentageComplete}%</div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>of goal</div>
              </div>
            </div>

            {/* Hourly intake visualization */}
            <div style={{ marginTop: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '12px', color: '#64748b' }}>Hourly Intake</span>
                <span style={{ fontSize: '11px', color: '#64748b' }}>Last 8 hours</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'end', gap: '2px', height: '32px' }}>
                {[250, 0, 300, 200, 0, 400, 350, 350].map((ml, index) => (
                  <div
                    key={index}
                    style={{
                      flex: 1,
                      height: `${Math.max(ml / 400 * 28, 2)}px`,
                      backgroundColor: ml > 0 ? '#06b6d4' : '#e2e8f0',
                      borderRadius: '2px'
                    }}
                    title={`${ml}ml`}
                  />
                ))}
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <p className="card-title">Weekly Average</p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '8px' }}>
              <h4 className="card-value">2.2L</h4>
              <span style={{ fontSize: '12px', color: '#dc2626', fontWeight: 500 }}>
                -0.1L vs target
              </span>
            </div>
          </div>

          {/* Hydration Reminder */}
          <div style={{ 
            padding: '12px', 
            backgroundColor: '#fef3c7', 
            borderRadius: '8px',
            border: '1px solid #fbbf24'
          }}>
            <p className="card-title" style={{ fontSize: '12px', marginBottom: '6px', color: '#92400e' }}>
              ⏰ Hydration Reminder
            </p>
            <p style={{ 
              margin: 0, 
              fontSize: '11px', 
              color: '#92400e',
              lineHeight: '1.4'
            }}>
              You're behind today's goal. Aim for 250ml in the next hour to stay on track.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HydrationSection;