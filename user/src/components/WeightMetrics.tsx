import React from 'react';
import BMIIndicator from './BMIIndicator';

const WeightMetrics: React.FC = () => {
  return (
    <div className="section-card">
      <div className="section-title">
        <h3>Weight & Body Metrics</h3>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn--pill btn-tab--active">Day</button>
          <button className="btn btn--pill btn-tab">Week</button>
          <button className="btn btn--pill btn-tab">Month</button>
        </div>
      </div>

      <div className="chart-row">
        {/* Chart placeholder */}
        <div className="chart-box">
          <div style={{ 
            height: '200px', 
            backgroundColor: '#f8fafc', 
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#64748b',
            fontSize: '14px',
            border: '2px dashed #e2e8f0'
          }}>
            Weight Chart
          </div>
          <div className="chart-legend">
            <span className="legend-swatch swatch-blue"></span>
            <span>Weight (kg)</span>
          </div>
        </div>

        {/* BMI and Body Fat */}
        <div className="metric-col">
          <div>
            <p className="card-title">BMI</p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '8px' }}>
              <h4 className="card-value">22.4</h4>
              <span style={{ fontSize: '12px', color: '#059669', fontWeight: 500 }}>
                Healthy
              </span>
            </div>
            <BMIIndicator value={22.4} />
            <div className="range-labels">
              <span>Underweight</span>
              <span>Overweight</span>
            </div>
          </div>

          <div>
            <p className="card-title">Body Fat %</p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '8px' }}>
              <h4 className="card-value">18.2%</h4>
              <span style={{ fontSize: '12px', color: '#059669', fontWeight: 500 }}>
                Good
              </span>
            </div>
            <BMIIndicator value={18.2} />
            <div className="range-labels">
              <span>High</span>
              <span>Low</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeightMetrics;