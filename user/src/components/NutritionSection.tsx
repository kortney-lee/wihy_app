import React, { useState } from 'react';
import { NutritionMacroChart } from './Charts';

type TimePeriod = 'day' | 'week' | 'month';
type NutritionView = 'macros' | 'micronutrients' | 'energy-balance';

const NutritionSection: React.FC = () => {
  const [activePeriod, setActivePeriod] = useState<TimePeriod>('week');
  const [activeView, setActiveView] = useState<NutritionView>('macros');

  // Sample micronutrient data (% of RDA)
  const micronutrients = [
    { name: 'Vitamin C', percentage: 120, color: '#10b981' },
    { name: 'Vitamin D', percentage: 85, color: '#f59e0b' },
    { name: 'Iron', percentage: 95, color: '#3b82f6' },
    { name: 'Calcium', percentage: 78, color: '#8b5cf6' },
    { name: 'B12', percentage: 110, color: '#ef4444' },
    { name: 'Folate', percentage: 88, color: '#06b6d4' },
  ];

  return (
    <div className="section-card">
      <div className="section-title">
        <h3>🍽 Nutrition & Intake</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button 
            className="analyze-wihy-btn"
            onClick={() => console.log("Analyze my nutrition data: macro/micronutrients, calorie intake, dietary patterns, nutritional balance")}
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
          className={`btn btn--sm ${activeView === 'macros' ? 'btn--primary' : 'btn--secondary'}`}
          onClick={() => setActiveView('macros')}
        >
          Macro Breakdown
        </button>
        <button 
          className={`btn btn--sm ${activeView === 'micronutrients' ? 'btn--primary' : 'btn--secondary'}`}
          onClick={() => setActiveView('micronutrients')}
        >
          Micronutrients
        </button>
        <button 
          className={`btn btn--sm ${activeView === 'energy-balance' ? 'btn--primary' : 'btn--secondary'}`}
          onClick={() => setActiveView('energy-balance')}
        >
          Energy Balance
        </button>
      </div>

      <div style={{ padding: '24px' }}>
        <div className="chart-split-layout">
          <div>
          {activeView === 'macros' && (
            <>
              <NutritionMacroChart period={activePeriod} />
              <div className="chart-legend">
                <span className="legend-swatch swatch-blue"></span>
                <span>Protein</span>
                <span className="legend-swatch swatch-green"></span>
                <span>Carbs</span>
                <span className="legend-swatch swatch-orange"></span>
                <span>Fats</span>
              </div>
            </>
          )}
          
          {activeView === 'micronutrients' && (
            <div style={{ height: '240px', padding: '16px' }}>
              <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#374151' }}>
                Micronutrient Coverage (% of RDA)
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {micronutrients.map((nutrient, index) => (
                  <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ 
                      width: '80px', 
                      fontSize: '12px', 
                      color: '#64748b',
                      textAlign: 'right',
                      flexShrink: 0
                    }}>
                      {nutrient.name}
                    </div>
                    <div style={{ 
                      flex: 1, 
                      height: '8px', 
                      backgroundColor: '#f1f5f9', 
                      borderRadius: '4px',
                      overflow: 'hidden',
                      position: 'relative'
                    }}>
                      <div style={{ 
                        width: `${Math.min(nutrient.percentage, 100)}%`, 
                        height: '100%', 
                        backgroundColor: nutrient.color,
                        borderRadius: '4px',
                        transition: 'width 0.3s ease'
                      }} />
                      {nutrient.percentage > 100 && (
                        <div style={{
                          position: 'absolute',
                          right: '-2px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          width: '6px',
                          height: '6px',
                          backgroundColor: nutrient.color,
                          borderRadius: '50%',
                          animation: 'pulse 2s infinite'
                        }} />
                      )}
                    </div>
                    <div style={{ 
                      width: '40px', 
                      fontSize: '11px', 
                      color: nutrient.percentage >= 100 ? '#059669' : '#64748b',
                      fontWeight: nutrient.percentage >= 100 ? 'bold' : 'normal',
                      textAlign: 'right',
                      flexShrink: 0
                    }}>
                      {nutrient.percentage}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeView === 'energy-balance' && (
            <div style={{ height: '240px', padding: '16px' }}>
              <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#374151' }}>
                Energy Balance (kcal)
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Energy In */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>Energy In (Food)</span>
                    <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#059669' }}>1,850 kcal</span>
                  </div>
                  <div style={{ 
                    width: '100%', 
                    height: '12px', 
                    backgroundColor: '#f1f5f9', 
                    borderRadius: '6px',
                    overflow: 'hidden'
                  }}>
                    <div style={{ 
                      width: '92%', 
                      height: '100%', 
                      backgroundColor: '#059669',
                      borderRadius: '6px'
                    }} />
                  </div>
                </div>

                {/* Energy Out */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>Energy Out (BMR + Activity)</span>
                    <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#dc2626' }}>2,100 kcal</span>
                  </div>
                  <div style={{ 
                    width: '100%', 
                    height: '12px', 
                    backgroundColor: '#f1f5f9', 
                    borderRadius: '6px',
                    overflow: 'hidden'
                  }}>
                    <div style={{ 
                      width: '100%', 
                      height: '100%', 
                      backgroundColor: '#dc2626',
                      borderRadius: '6px'
                    }} />
                  </div>
                </div>

                {/* Net Balance */}
                <div style={{ 
                  padding: '12px', 
                  backgroundColor: '#f0f9ff', 
                  borderRadius: '8px',
                  border: '1px solid #e0f2fe'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', color: '#0369a1', fontWeight: 'bold' }}>Net Balance</span>
                    <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#0369a1' }}>-250 kcal</span>
                  </div>
                  <p style={{ 
                    margin: '4px 0 0 0', 
                    fontSize: '11px', 
                    color: '#0369a1',
                    fontStyle: 'italic'
                  }}>
                    Healthy deficit for weight loss goal
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Nutrition Summary Cards */}
        <div className="metric-col">
          <div style={{ marginBottom: '16px' }}>
            <p className="card-title">Daily Targets</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: '#64748b' }}>Calories</span>
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#059669' }}>1,850 / 2,000</span>
              </div>
              <div style={{ 
                width: '100%', 
                height: '6px', 
                backgroundColor: '#f1f5f9', 
                borderRadius: '3px',
                overflow: 'hidden'
              }}>
                <div style={{ 
                  width: '93%', 
                  height: '100%', 
                  backgroundColor: '#059669',
                  borderRadius: '3px'
                }} />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: '#64748b' }}>Protein</span>
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#3b82f6' }}>125g / 130g</span>
              </div>
              <div style={{ 
                width: '100%', 
                height: '6px', 
                backgroundColor: '#f1f5f9', 
                borderRadius: '3px',
                overflow: 'hidden'
              }}>
                <div style={{ 
                  width: '96%', 
                  height: '100%', 
                  backgroundColor: '#3b82f6',
                  borderRadius: '3px'
                }} />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: '#64748b' }}>Water</span>
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#06b6d4' }}>1.8L / 2.5L</span>
              </div>
              <div style={{ 
                width: '100%', 
                height: '6px', 
                backgroundColor: '#f1f5f9', 
                borderRadius: '3px',
                overflow: 'hidden'
              }}>
                <div style={{ 
                  width: '72%', 
                  height: '100%', 
                  backgroundColor: '#06b6d4',
                  borderRadius: '3px'
                }} />
              </div>
            </div>
          </div>

          {/* Meal Timing Insight */}
          <div style={{ 
            padding: '12px', 
            backgroundColor: '#fef7ed', 
            borderRadius: '8px',
            border: '1px solid #fed7aa'
          }}>
            <p className="card-title" style={{ fontSize: '12px', marginBottom: '6px', color: '#9a3412' }}>
              💡 Meal Timing Insight
            </p>
            <p style={{ 
              margin: 0, 
              fontSize: '11px', 
              color: '#9a3412',
              lineHeight: '1.4'
            }}>
              Peak calorie intake: 7-9pm<br/>
              Consider earlier dinner for better metabolism
            </p>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NutritionSection;