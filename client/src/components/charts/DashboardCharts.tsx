import React, { useState } from 'react';
import ActivityChart from './ActivityChart';
import WeightTrendChart from './WeightTrendChart';
import SleepChart from './SleepChart';
import BMIBodyFatChart from './BMIBodyFatChart';
import DopamineChart from './DopamineChart';
import HealthRiskChart from './HealthRiskChart';
import '../../styles/charts.css';

interface DashboardChartsProps {
  period?: 'day' | 'week' | 'month';
}

const DashboardCharts: React.FC<DashboardChartsProps> = ({ period = 'week' }) => {
  const [selectedPeriod, setSelectedPeriod] = useState<'day' | 'week' | 'month'>(period);

  const handlePeriodChange = (newPeriod: 'day' | 'week' | 'month') => {
    setSelectedPeriod(newPeriod);
  };

  return (
    <div style={{ padding: '20px', backgroundColor: '#f8fafc' }}>
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto',
        display: 'grid',
        gap: '20px'
      }}>
        
        {/* Period Controls */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '8px',
          marginBottom: '20px'
        }}>
          {(['day', 'week', 'month'] as const).map((p) => (
            <button
              key={p}
              className={`chart-controls ${selectedPeriod === p ? 'active' : ''}`}
              onClick={() => handlePeriodChange(p)}
              style={{
                padding: '8px 16px',
                border: selectedPeriod === p ? '1px solid #3b82f6' : '1px solid #d1d5db',
                background: selectedPeriod === p ? '#3b82f6' : 'white',
                color: selectedPeriod === p ? 'white' : '#374151',
                borderRadius: '6px',
                cursor: 'pointer',
                textTransform: 'capitalize',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Charts Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(550px, 1fr))',
          gap: '20px'
        }}>
          
          {/* Activity Chart */}
          <div className="dashboard-chart-card">
            <h3>Activity Overview</h3>
            <div className="chart-controls">
              <button>Steps</button>
              <button>Distance</button>
              <button>Calories</button>
            </div>
            <ActivityChart period={selectedPeriod} chartType="steps" />
          </div>

          {/* Weight Trend Chart */}
          <div className="dashboard-chart-card">
            <h3>Weight Tracking</h3>
            <WeightTrendChart period={selectedPeriod} />
          </div>

          {/* Sleep Chart */}
          <div className="dashboard-chart-card">
            <h3>Sleep Analysis</h3>
            <div className="chart-controls">
              <button>Duration</button>
              <button>Quality</button>
            </div>
            <SleepChart period={selectedPeriod} chartType="duration" />
          </div>

          {/* BMI Body Fat Chart */}
          <div className="dashboard-chart-card">
            <h3>Body Composition</h3>
            <BMIBodyFatChart period={selectedPeriod} />
          </div>

          {/* Activity Distribution */}
          <div className="dashboard-chart-card">
            <h3>Activity Distribution</h3>
            <ActivityChart period={selectedPeriod} chartType="activity" />
          </div>

          {/* Hydration Chart */}
          <div className="dashboard-chart-card">
            <h3>Hydration Tracking</h3>
            <ActivityChart period={selectedPeriod} chartType="hydration" />
          </div>

          {/* Dopamine Chart */}
          <div className="dashboard-chart-card">
            <h3>Dopamine Levels & Triggers</h3>
            <div className="chart-controls">
              <button>Levels</button>
              <button>Triggers</button>
              <button>Activities</button>
            </div>
            <DopamineChart period={selectedPeriod} chartType="levels" />
          </div>

          {/* Health Risk Chart */}
          <div className="dashboard-chart-card">
            <h3>Health Risk Assessment</h3>
            <div className="chart-controls">
              <button>Risk Score</button>
              <button>Risk Factors</button>
              <button>Prevention</button>
              <button>Categories</button>
            </div>
            <HealthRiskChart period={selectedPeriod} chartType="risk-score" />
          </div>

        </div>
      </div>
    </div>
  );
};

export default DashboardCharts;