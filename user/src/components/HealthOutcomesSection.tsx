import React, { useState } from 'react';

type TimePeriod = 'day' | 'week' | 'month';
type HealthView = 'vitals' | 'symptoms' | 'risk-factors' | 'timeline';

interface VitalSign {
  name: string;
  current: number;
  normal: string;
  status: 'good' | 'warning' | 'alert';
  unit: string;
  trend: 'up' | 'down' | 'stable';
}

interface SymptomEntry {
  symptom: string;
  severity: number; // 1-10
  frequency: string;
  color: string;
}

const HealthOutcomesSection: React.FC = () => {
  const [activePeriod, setActivePeriod] = useState<TimePeriod>('week');
  const [activeView, setActiveView] = useState<HealthView>('vitals');

  const vitals: VitalSign[] = [
    { name: 'Resting Heart Rate', current: 68, normal: '60-100', status: 'good', unit: 'bpm', trend: 'stable' },
    { name: 'Blood Pressure', current: 118, normal: '<120/80', status: 'good', unit: 'mmHg', trend: 'down' },
    { name: 'HRV', current: 42, normal: '30-50', status: 'good', unit: 'ms', trend: 'up' },
    { name: 'Stress Score', current: 35, normal: '<50', status: 'good', unit: '/100', trend: 'down' },
    { name: 'Recovery Score', current: 78, normal: '>70', status: 'good', unit: '%', trend: 'up' }
  ];

  const symptoms: SymptomEntry[] = [
    { symptom: 'Headaches', severity: 2, frequency: 'Rare', color: '#10b981' },
    { symptom: 'Back Pain', severity: 4, frequency: 'Weekly', color: '#f59e0b' },
    { symptom: 'Fatigue', severity: 3, frequency: 'Occasional', color: '#06b6d4' },
    { symptom: 'Sleep Issues', severity: 2, frequency: 'Rare', color: '#8b5cf6' },
    { symptom: 'Digestive', severity: 1, frequency: 'Never', color: '#10b981' }
  ];

  const riskFactors = {
    cardiovascular: 15, // Low risk
    diabetes: 8,
    metabolic: 12,
    musculoskeletal: 25
  };

  return (
    <div className="section-card">
      <div className="section-title">
        <h3>🏥 Health Outcomes & Risk</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button 
            className="analyze-wihy-btn"
            onClick={() => console.log("Analyze my health outcomes and risk data: vital signs, health indicators, risk factors, medical trends, symptom tracking")}
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
          className={`btn btn--sm ${activeView === 'vitals' ? 'btn--primary' : 'btn--secondary'}`}
          onClick={() => setActiveView('vitals')}
        >
          Vital Signs
        </button>
        <button 
          className={`btn btn--sm ${activeView === 'symptoms' ? 'btn--primary' : 'btn--secondary'}`}
          onClick={() => setActiveView('symptoms')}
        >
          Symptom Tracking
        </button>
        <button 
          className={`btn btn--sm ${activeView === 'risk-factors' ? 'btn--primary' : 'btn--secondary'}`}
          onClick={() => setActiveView('risk-factors')}
        >
          Risk Assessment
        </button>
        <button 
          className={`btn btn--sm ${activeView === 'timeline' ? 'btn--primary' : 'btn--secondary'}`}
          onClick={() => setActiveView('timeline')}
        >
          Health Timeline
        </button>
      </div>

      <div style={{ padding: '24px' }}>
        <div className="chart-full-width">
          {activeView === 'vitals' && (
            <div style={{ height: '220px', padding: '16px' }}>
              <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#374151' }}>
                Current Vital Signs Status
              </h4>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {vitals.map((vital, index) => {
                  const statusColor = vital.status === 'good' ? '#10b981' : 
                                    vital.status === 'warning' ? '#f59e0b' : '#ef4444';
                  
                  return (
                    <div key={index} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px',
                      backgroundColor: '#f8fafc',
                      borderRadius: '8px',
                      border: `1px solid ${vital.status === 'good' ? '#e2e8f0' : 
                                         vital.status === 'warning' ? '#fed7aa' : '#fecaca'}`
                    }}>
                      {/* Status indicator */}
                      <div style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        backgroundColor: statusColor
                      }} />

                      {/* Vital info */}
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#374151' }}>
                          {vital.name}
                        </div>
                        <div style={{ fontSize: '10px', color: '#64748b' }}>
                          Normal: {vital.normal}
                        </div>
                      </div>

                      {/* Current value */}
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '16px', fontWeight: 'bold', color: statusColor }}>
                          {vital.current}{vital.unit}
                        </div>
                        <div style={{ 
                          fontSize: '9px', 
                          color: vital.trend === 'up' ? '#10b981' : vital.trend === 'down' ? '#ef4444' : '#64748b',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'flex-end',
                          gap: '2px'
                        }}>
                          {vital.trend === 'up' && '↗'} 
                          {vital.trend === 'down' && '↘'}
                          {vital.trend === 'stable' && '→'}
                          {vital.trend}
                        </div>
                      </div>
                    </div>
                  );
                })}
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
                  ✅ All vitals within healthy range. Recovery trending positive.
                </p>
              </div>
            </div>
          )}

          {activeView === 'symptoms' && (
            <div style={{ height: '220px', padding: '16px' }}>
              <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#374151' }}>
                Symptom Severity & Frequency
              </h4>
              
              {/* Symptom radar chart simulation */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center',
                height: '120px',
                position: 'relative'
              }}>
                <div style={{ position: 'relative', width: '100px', height: '100px' }}>
                  {/* Background circles */}
                  {[20, 35, 50].map((radius, i) => (
                    <circle
                      key={i}
                      cx="50"
                      cy="50"
                      r={radius}
                      fill="none"
                      stroke="#e2e8f0"
                      strokeWidth="1"
                      style={{ position: 'absolute' }}
                    />
                  ))}
                  
                  {/* Symptom points */}
                  <svg width="100" height="100" style={{ position: 'absolute' }}>
                    {symptoms.slice(0, 5).map((symptom, index) => {
                      const angle = (index * 72) - 90; // Pentagon layout
                      const radius = (symptom.severity / 10) * 40 + 10;
                      const x = 50 + radius * Math.cos(angle * Math.PI / 180);
                      const y = 50 + radius * Math.sin(angle * Math.PI / 180);
                      
                      return (
                        <circle
                          key={index}
                          cx={x}
                          cy={y}
                          r="4"
                          fill={symptom.color}
                          stroke="white"
                          strokeWidth="2"
                        />
                      );
                    })}
                  </svg>
                </div>
              </div>

              {/* Symptom list */}
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column',
                gap: '4px',
                marginTop: '16px'
              }}>
                {symptoms.map((symptom, index) => (
                  <div key={index} style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '4px 8px',
                    backgroundColor: '#f8fafc',
                    borderRadius: '4px',
                    fontSize: '11px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{ 
                        width: '8px', 
                        height: '8px', 
                        backgroundColor: symptom.color, 
                        borderRadius: '50%' 
                      }} />
                      <span style={{ color: '#64748b' }}>{symptom.symptom}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '10px', color: '#64748b' }}>
                        {symptom.frequency}
                      </span>
                      <span style={{ 
                        fontWeight: 'bold', 
                        color: symptom.severity <= 3 ? '#10b981' : symptom.severity <= 6 ? '#f59e0b' : '#ef4444'
                      }}>
                        {symptom.severity}/10
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeView === 'risk-factors' && (
            <div style={{ height: '220px', padding: '16px' }}>
              <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#374151' }}>
                Health Risk Assessment
              </h4>
              
              {/* Risk factor bars */}
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column',
                gap: '12px'
              }}>
                {[
                  { name: 'Cardiovascular Risk', value: riskFactors.cardiovascular, max: 100, color: '#10b981' },
                  { name: 'Type 2 Diabetes Risk', value: riskFactors.diabetes, max: 100, color: '#10b981' },
                  { name: 'Metabolic Syndrome', value: riskFactors.metabolic, max: 100, color: '#10b981' },
                  { name: 'Musculoskeletal Issues', value: riskFactors.musculoskeletal, max: 100, color: '#f59e0b' }
                ].map((risk, index) => (
                  <div key={index} style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      fontSize: '12px'
                    }}>
                      <span style={{ color: '#64748b' }}>{risk.name}</span>
                      <span style={{ 
                        fontWeight: 'bold', 
                        color: risk.value <= 20 ? '#10b981' : risk.value <= 40 ? '#f59e0b' : '#ef4444'
                      }}>
                        {risk.value}% risk
                      </span>
                    </div>
                    <div style={{ 
                      width: '100%', 
                      height: '8px', 
                      backgroundColor: '#f1f5f9', 
                      borderRadius: '4px',
                      overflow: 'hidden'
                    }}>
                      <div style={{ 
                        width: `${risk.value}%`, 
                        height: '100%', 
                        backgroundColor: risk.value <= 20 ? '#10b981' : risk.value <= 40 ? '#f59e0b' : '#ef4444',
                        borderRadius: '4px',
                        transition: 'width 0.5s ease'
                      }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Risk recommendations */}
              <div style={{ 
                marginTop: '16px',
                padding: '12px',
                backgroundColor: '#fef3c7',
                borderRadius: '8px',
                border: '1px solid #fbbf24'
              }}>
                <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#92400e', marginBottom: '4px' }}>
                  ⚠️ Areas for Improvement
                </div>
                <div style={{ fontSize: '10px', color: '#92400e', lineHeight: '1.4' }}>
                  • Consider strength training to reduce musculoskeletal risk
                  <br />
                  • Current activity levels are protective for other risk factors
                </div>
              </div>
            </div>
          )}

          {activeView === 'timeline' && (
            <div style={{ height: '220px', padding: '16px' }}>
              <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#374151' }}>
                Health Events Timeline (Last 6 Months)
              </h4>
              
              {/* Timeline */}
              <div style={{ position: 'relative', paddingLeft: '20px' }}>
                {/* Timeline line */}
                <div style={{
                  position: 'absolute',
                  left: '8px',
                  top: '0',
                  bottom: '0',
                  width: '2px',
                  backgroundColor: '#e2e8f0'
                }} />

                {/* Timeline events */}
                {[
                  { date: '2 weeks ago', event: 'Annual Physical', type: 'checkup', status: 'positive' },
                  { date: '1 month ago', event: 'Started Meditation', type: 'lifestyle', status: 'positive' },
                  { date: '2 months ago', event: 'Minor Back Pain Episode', type: 'symptom', status: 'resolved' },
                  { date: '3 months ago', event: 'Improved Sleep Schedule', type: 'lifestyle', status: 'positive' },
                  { date: '4 months ago', event: 'Flu Recovery', type: 'illness', status: 'resolved' },
                  { date: '6 months ago', event: 'Started Fitness Routine', type: 'lifestyle', status: 'positive' }
                ].map((item, index) => (
                  <div key={index} style={{
                    position: 'relative',
                    marginBottom: '16px',
                    paddingLeft: '12px'
                  }}>
                    {/* Timeline dot */}
                    <div style={{
                      position: 'absolute',
                      left: '-7px',
                      top: '2px',
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      backgroundColor: item.status === 'positive' ? '#10b981' : 
                                     item.status === 'resolved' ? '#06b6d4' : '#f59e0b',
                      border: '2px solid white',
                      boxShadow: '0 0 0 1px #e2e8f0'
                    }} />
                    
                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#374151' }}>
                      {item.event}
                    </div>
                    <div style={{ fontSize: '10px', color: '#64748b' }}>
                      {item.date} • {item.type}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Health Summary Cards */}
        <div className="metric-col">
          <div style={{ marginBottom: '16px' }}>
            <p className="card-title">Health Score</p>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '12px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>85</div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>overall</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#06b6d4' }}>92</div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>vitals</div>
              </div>
            </div>

            {/* Health score breakdown */}
            <div style={{ marginTop: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '12px', color: '#64748b' }}>Score Trend</span>
                <span style={{ fontSize: '11px', color: '#64748b' }}>6 months</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'end', gap: '2px', height: '32px' }}>
                {[75, 78, 82, 79, 83, 85].map((score, index) => (
                  <div
                    key={index}
                    style={{
                      flex: 1,
                      height: `${(score - 70) / 30 * 28}px`,
                      backgroundColor: '#10b981',
                      borderRadius: '2px'
                    }}
                    title={`Month ${index + 1}: ${score}`}
                  />
                ))}
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <p className="card-title">Risk Status</p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '8px' }}>
              <h4 className="card-value">Low Risk</h4>
              <span style={{ fontSize: '12px', color: '#059669', fontWeight: 500 }}>
                Improved
              </span>
            </div>
          </div>

          {/* Health Alert */}
          <div style={{ 
            padding: '12px', 
            backgroundColor: '#f0fdf4', 
            borderRadius: '8px',
            border: '1px solid #bbf7d0'
          }}>
            <p className="card-title" style={{ fontSize: '12px', marginBottom: '6px', color: '#15803d' }}>
              💚 Health Insight
            </p>
            <p style={{ 
              margin: 0, 
              fontSize: '11px', 
              color: '#15803d',
              lineHeight: '1.4'
            }}>
              Your consistent exercise routine is significantly improving cardiovascular health markers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HealthOutcomesSection;