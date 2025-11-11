import React from 'react';
import { HealthDashboardGrid } from '../components/charts';

const TestDashboardGrid: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Dashboard Grid Test</h1>
        
        {/* Test Default Cards */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Default Charts (maxCards: 16)</h2>
          <HealthDashboardGrid 
            maxCards={16}
            showAllCharts={false}
          />
        </div>
        
        {/* Test All Charts */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">All Available Charts (showAllCharts: true)</h2>
          <HealthDashboardGrid 
            showAllCharts={true}
            maxCards={20}
          />
        </div>
      </div>
    </div>
  );
};

export default TestDashboardGrid;