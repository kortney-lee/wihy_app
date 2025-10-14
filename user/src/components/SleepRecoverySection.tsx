import React, { useState } from 'react';
import { SleepChart } from './Charts';

type TimePeriod = 'day' | 'week' | 'month';
type SleepView = 'duration' | 'quality' | 'correlation';

const SleepRecoverySection: React.FC = () => {
  const [activePeriod, setActivePeriod] = useState<TimePeriod>('week');
  const [activeView, setActiveView] = useState<SleepView>('duration');

  return (
    <div className="section-card">
      <div className="section-title">
        <h3>💤 Sleep & Recovery</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button 
            className="analyze-wihy-btn"
            onClick={() => console.log("Analyze my sleep and recovery data: sleep quality, duration patterns, recovery metrics, sleep hygiene")}
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
          className={`btn btn--sm ${activeView === 'duration' ? 'btn--primary' : 'btn--secondary'}`}
          onClick={() => setActiveView('duration')}
        >
          Duration & Quality
        </button>
        <button 
          className={`btn btn--sm ${activeView === 'quality' ? 'btn--primary' : 'btn--secondary'}`}
          onClick={() => setActiveView('quality')}
        >
          Quality Distribution
        </button>
        <button 
          className={`btn btn--sm ${activeView === 'correlation' ? 'btn--primary' : 'btn--secondary'}`}
          onClick={() => setActiveView('correlation')}
        >
          Sleep vs Activity
        </button>
      </div>

      <div className="chart-row">
        <div className="chart-box">
          {activeView === 'duration' && (
            <>
              <SleepChart period={activePeriod} chartType="duration" />
              <div className="chart-legend">
                <span className="legend-swatch swatch-indigo"></span>
                <span>Sleep Duration</span>
                <span className="legend-swatch swatch-purple"></span>
                <span>Sleep Quality</span>
                <span className="legend-swatch swatch-green"></span>
                <span>Target (7.5h)</span>
              </div>
            </>
          )}
          
          {activeView === 'quality' && (
            <>
              <SleepChart period={activePeriod} chartType="quality" />
              <div className="chart-legend">
                <span className="legend-swatch" style={{ backgroundColor: '#ef4444' }}></span>
                <span>Poor (0-60%)</span>
                <span className="legend-swatch" style={{ backgroundColor: '#f59e0b' }}></span>
                <span>Fair (60-80%)</span>
                <span className="legend-swatch" style={{ backgroundColor: '#10b981' }}></span>
                <span>Good (80-90%)</span>
                <span className="legend-swatch" style={{ backgroundColor: '#3b82f6' }}></span>
                <span>Excellent (90%+)</span>
              </div>
            </>
          )}

          {activeView === 'correlation' && (
            <div style={{ height: '220px', padding: '16px' }}>
              <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#374151' }}>
                Sleep vs Activity Correlation
              </h4>
              
              {/* Scatter plot simulation */}
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
                  Sleep Quality (%)
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

                {/* Sample correlation points */}
                {[
                  { x: 25, y: 30, steps: '7.8k', quality: '75%' },
                  { x: 45, y: 45, steps: '9.2k', quality: '82%' },
                  { x: 65, y: 60, steps: '10.5k', quality: '85%' },
                  { x: 75, y: 75, steps: '11.2k', quality: '88%' },
                  { x: 85, y: 85, steps: '8.7k', quality: '90%' },
                ].map((point, index) => (
                  <div
                    key={index}
                    style={{
                      position: 'absolute',
                      left: `${point.x}%`,
                      top: `${100 - point.y}%`,
                      width: '8px',
                      height: '8px',
                      backgroundColor: '#3b82f6',
                      borderRadius: '50%',
                      transform: 'translate(-50%, -50%)',
                      cursor: 'pointer'
                    }}
                    title={`${point.steps} steps, ${point.quality} quality`}
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
                    y1="75%" 
                    x2="85%" 
                    y2="15%" 
                    stroke="#10b981" 
                    strokeWidth="2" 
                    strokeDasharray="4,4"
                  />
                </svg>
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
                  color: '#15803d',
                  fontWeight: 'bold'
                }}>
                  📈 Positive correlation: More active days = better sleep quality
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Sleep Summary Cards */}
        <div className="metric-col">
          <div style={{ marginBottom: '16px' }}>
            <p className="card-title">Last Night</p>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '12px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#6366f1' }}>7.2</div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>hours</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#8b5cf6' }}>82%</div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>quality</div>
              </div>
            </div>

            <div style={{ marginTop: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '12px', color: '#64748b' }}>Sleep Stages</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '8px', height: '8px', backgroundColor: '#3b82f6', borderRadius: '50%' }}></div>
                  <span style={{ fontSize: '11px', color: '#64748b', flex: 1 }}>Deep</span>
                  <span style={{ fontSize: '11px', fontWeight: 'bold' }}>1.8h</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '8px', height: '8px', backgroundColor: '#8b5cf6', borderRadius: '50%' }}></div>
                  <span style={{ fontSize: '11px', color: '#64748b', flex: 1 }}>REM</span>
                  <span style={{ fontSize: '11px', fontWeight: 'bold' }}>1.5h</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '8px', height: '8px', backgroundColor: '#06b6d4', borderRadius: '50%' }}></div>
                  <span style={{ fontSize: '11px', color: '#64748b', flex: 1 }}>Light</span>
                  <span style={{ fontSize: '11px', fontWeight: 'bold' }}>3.9h</span>
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <p className="card-title">Weekly Average</p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '8px' }}>
              <h4 className="card-value">7.3h</h4>
              <span style={{ fontSize: '12px', color: '#059669', fontWeight: 500 }}>
                +0.2h vs last week
              </span>
            </div>
          </div>

          {/* Sleep Optimization Tip */}
          <div style={{ 
            padding: '12px', 
            backgroundColor: '#f0f9ff', 
            borderRadius: '8px',
            border: '1px solid #e0f2fe'
          }}>
            <p className="card-title" style={{ fontSize: '12px', marginBottom: '6px', color: '#0369a1' }}>
              💡 Sleep Optimization
            </p>
            <p style={{ 
              margin: 0, 
              fontSize: '11px', 
              color: '#0369a1',
              lineHeight: '1.4'
            }}>
              Your best sleep follows 10k+ step days. Consider morning walks to boost tonight's rest.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SleepRecoverySection;