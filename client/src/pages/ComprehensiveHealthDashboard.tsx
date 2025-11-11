import React, { useState } from 'react';
import { HealthDashboardGrid } from '../components/charts';
import { ChartType } from '../components/charts/chartTypes';

const ComprehensiveHealthDashboard: React.FC = () => {
  const [viewMode, setViewMode] = useState<'default' | 'all'>('default');
  const [maxCards, setMaxCards] = useState(12);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Comprehensive Health Dashboard
          </h1>
          <p className="text-gray-600 mb-4">
            View all your health metrics, activity data, nutrition analysis, and research insights in one place.
          </p>
          
          {/* Controls */}
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex gap-2">
              <span className="text-sm font-medium text-gray-700">View Mode:</span>
              <button
                className={`px-3 py-1 rounded text-sm ${
                  viewMode === 'default'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                onClick={() => setViewMode('default')}
              >
                Essential
              </button>
              <button
                className={`px-3 py-1 rounded text-sm ${
                  viewMode === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                onClick={() => setViewMode('all')}
              >
                All Charts
              </button>
            </div>
            
            {viewMode === 'all' && (
              <div className="flex gap-2 items-center">
                <span className="text-sm font-medium text-gray-700">Max Cards:</span>
                <select
                  value={maxCards}
                  onChange={(e) => setMaxCards(Number(e.target.value))}
                  className="px-2 py-1 border border-gray-300 rounded text-sm"
                >
                  <option value={8}>8</option>
                  <option value={12}>12</option>
                  <option value={16}>16</option>
                  <option value={20}>20</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Dashboard Grid */}
        <HealthDashboardGrid
          showAllCharts={viewMode === 'all'}
          maxCards={maxCards}
          className="mb-6"
          period="week"
        />

        {/* Chart Categories Legend */}
        <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Chart Categories</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">health</span>
              <span className="text-sm text-gray-600">Core health metrics</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">activity</span>
              <span className="text-sm text-gray-600">Physical activity & lifestyle</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">nutrition</span>
              <span className="text-sm text-gray-600">Diet & nutrition analysis</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">research</span>
              <span className="text-sm text-gray-600">Scientific research data</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800">analysis</span>
              <span className="text-sm text-gray-600">Advanced analytics</span>
            </div>
          </div>
        </div>

        {/* Available Charts Summary */}
        <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Available Health Charts</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Core Health (Priority 80-100)</h3>
              <ul className="space-y-1 text-gray-600">
                <li>• Quick Insights Dashboard</li>
                <li>• BMI Domain Analysis</li>
                <li>• Health Risk Assessment</li>
                <li>• Weight Trend Tracking</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Activity & Lifestyle (Priority 55-70)</h3>
              <ul className="space-y-1 text-gray-600">
                <li>• Daily Steps Counter</li>
                <li>• Active Minutes Tracking</li>
                <li>• Sleep Analysis</li>
                <li>• Hydration Monitoring</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Nutrition & Diet (Priority 40-50)</h3>
              <ul className="space-y-1 text-gray-600">
                <li>• Calorie Analysis</li>
                <li>• Nutrition Overview</li>
                <li>• Macronutrient Distribution</li>
                <li>• Vitamin Content Analysis</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Research & Analysis (Priority 10-30)</h3>
              <ul className="space-y-1 text-gray-600">
                <li>• NOVA Food Processing</li>
                <li>• Research Quality Assessment</li>
                <li>• Publication Timeline</li>
                <li>• Daily Value Progress</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComprehensiveHealthDashboard;