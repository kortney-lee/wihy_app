import React from 'react';
import HealthScoreGauge from '../components/charts/individual/HealthScoreGauge';
import CurrentWeightCard from '../components/charts/individual/CurrentWeightCard';
import ActivityChart from '../components/charts/individual/ActivityChart';
import DopamineChart from '../components/charts/individual/DopamineChart';

const TestIndividualComponents: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Individual Components Test</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-md p-4">
            <h2 className="text-lg font-semibold mb-4">Health Score Gauge</h2>
            <HealthScoreGauge score={75} />
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-4">
            <h2 className="text-lg font-semibold mb-4">Current Weight Card</h2>
            <CurrentWeightCard />
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-4">
            <h2 className="text-lg font-semibold mb-4">Activity Chart</h2>
            <ActivityChart period="week" chartType="activity" />
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-4">
            <h2 className="text-lg font-semibold mb-4">Dopamine Chart</h2>
            <DopamineChart period="week" chartType="levels" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestIndividualComponents;