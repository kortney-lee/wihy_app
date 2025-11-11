import React from 'react';
import ActivityChart from '../components/charts/individual/ActivityChart';
import DopamineChart from '../components/charts/individual/DopamineChart';
import HealthRiskChart from '../components/charts/individual/HealthRiskChart';
import { HealthDashboardGrid } from '../components/charts';

const TestChartsPage: React.FC = () => {
  return (
    <div style={{ padding: '20px' }}>
      <h1>Chart Test Page</h1>
      <p>If you can see this, the React app is working!</p>
      
      <div style={{ 
        width: '600px', 
        height: '300px', 
        border: '1px solid #ccc', 
        padding: '20px',
        margin: '20px 0'
      }}>
        <h3>Activity Chart Test</h3>
        <ActivityChart period="week" chartType="steps" />
      </div>

      <div style={{ 
        width: '600px', 
        height: '300px', 
        border: '1px solid #ccc', 
        padding: '20px',
        margin: '20px 0'
      }}>
        <h3>🧠 Dopamine Levels Chart</h3>
        <DopamineChart period="week" chartType="levels" />
      </div>

      <div style={{ 
        width: '600px', 
        height: '300px', 
        border: '1px solid #ccc', 
        padding: '20px',
        margin: '20px 0'
      }}>
        <h3>⚠️ Health Risk Assessment</h3>
        <HealthRiskChart period="week" chartType="risk-factors" />
      </div>

      <div style={{ 
        width: '600px', 
        height: '300px', 
        border: '1px solid #ccc', 
        padding: '20px',
        margin: '20px 0'
      }}>
        <h3>🎯 Dopamine Triggers</h3>
        <DopamineChart period="week" chartType="triggers" />
      </div>
    </div>
  );
};

export default TestChartsPage;