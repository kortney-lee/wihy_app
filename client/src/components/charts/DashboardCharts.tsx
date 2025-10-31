import React, { useState } from 'react';
import ActivityChart from './ActivityChart';
import WeightTrendChart from './WeightTrendChart';
import SleepChart from './SleepChart';
import BMIBodyFatChart from './BMIBodyFatChart';
import DopamineChart from './DopamineChart';
import HealthRiskChart from './HealthRiskChart';
import '../../styles/Dashboard.css';

interface DashboardChartsProps {
  period?: 'day' | 'week' | 'month';
}

const DashboardCharts: React.FC<DashboardChartsProps> = ({ period = 'week' }) => {
  const [selectedPeriod, setSelectedPeriod] = useState<'day' | 'week' | 'month'>(period);

  const handlePeriodChange = (newPeriod: 'day' | 'week' | 'month') => {
    setSelectedPeriod(newPeriod);
  };

  return (
    <div className="health-dashboard-content">
      <div className="chart-sections-grid">
        
        {/* Period Controls */}
        <div className="chart-section-tabs" style={{ 
          gridColumn: '1 / -1',
          justifyContent: 'center',
          marginBottom: '20px'
        }}>
          {(['day', 'week', 'month'] as const).map((p) => (
            <button
              key={p}
              className={`chart-tab ${selectedPeriod === p ? 'active' : 'inactive'}`}
              onClick={() => handlePeriodChange(p)}
              style={{
                textTransform: 'capitalize'
              }}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Charts Grid */}
        <div>
          
          {/* Activity Chart */}
          <div className="chart-section-card">
            <h3 className="chart-section-title">Activity Overview</h3>
            <div className="chart-section-tabs">
              <button className="chart-tab active">Steps</button>
              <button className="chart-tab inactive">Distance</button>
              <button className="chart-tab inactive">Calories</button>
            </div>
            <ActivityChart period={selectedPeriod} chartType="steps" />
          </div>

          {/* Weight Trend Chart */}
          <div className="chart-section-card">
            <h3 className="chart-section-title">Weight Tracking</h3>
            <WeightTrendChart period={selectedPeriod} />
          </div>

          {/* Sleep Chart */}
          <div className="chart-section-card">
            <h3 className="chart-section-title">Sleep Analysis</h3>
            <div className="chart-section-tabs">
              <button className="chart-tab active">Duration</button>
              <button className="chart-tab inactive">Quality</button>
            </div>
            <SleepChart period={selectedPeriod} chartType="duration" />
          </div>

          {/* BMI Body Fat Chart */}
          <div className="chart-section-card">
            <h3 className="chart-section-title">Body Composition</h3>
            <BMIBodyFatChart period={selectedPeriod} />
          </div>

          {/* Activity Distribution */}
          <div className="chart-section-card">
            <h3 className="chart-section-title">Activity Distribution</h3>
            <ActivityChart period={selectedPeriod} chartType="activity" />
          </div>

          {/* Hydration Chart */}
          <div className="chart-section-card">
            <h3 className="chart-section-title">Hydration Tracking</h3>
            <ActivityChart period={selectedPeriod} chartType="hydration" />
          </div>

          {/* Dopamine Chart */}
          <div className="chart-section-card">
            <h3 className="chart-section-title">Dopamine Levels & Triggers</h3>
            <div className="chart-section-tabs">
              <button className="chart-tab active">Levels</button>
              <button className="chart-tab inactive">Triggers</button>
              <button className="chart-tab inactive">Activities</button>
            </div>
            <DopamineChart period={selectedPeriod} chartType="levels" />
          </div>

          {/* Health Risk Chart */}
          <div className="chart-section-card">
            <h3 className="chart-section-title">Health Risk Assessment</h3>
            <div className="chart-section-tabs">
              <button className="chart-tab active">Risk Score</button>
              <button className="chart-tab inactive">Risk Factors</button>
              <button className="chart-tab inactive">Prevention</button>
              <button className="chart-tab inactive">Categories</button>
            </div>
            <HealthRiskChart period={selectedPeriod} chartType="risk-score" />
          </div>

        </div>
      </div>
    </div>
  );
};

export default DashboardCharts;