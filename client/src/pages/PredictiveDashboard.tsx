/**
 * Predictive Dashboard - Prediction & Insights
 * 
 * Purpose: Help users understand where their habits are trending and what is 
 * likely to happen next if patterns continue — without fear, judgment, or guarantees.
 * 
 * WIHY Apple/Google Style Design
 */

import React, { useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

// Types
type TrendDirection = 'improving' | 'stable' | 'at-risk';
type TimeWindow = 7 | 30 | 90;
type SignalLevel = 'low' | 'moderate' | 'high';
type EffortLevel = 'low' | 'medium';
type ImpactLevel = 'low' | 'medium' | 'high';

interface OverallTrend {
  direction: TrendDirection;
  summary: string;
  lastUpdated: string;
}

interface HabitIndicator {
  trend: 'up' | 'down' | 'stable';
  insight: string;
  confidence: number;
}

interface BehaviorSignal {
  name: string;
  level: SignalLevel;
  description: string;
  trend: 'increasing' | 'stable' | 'decreasing';
}

interface NutritionTrend {
  nutrient: string;
  trend: 'adequate' | 'below' | 'above';
  insight: string;
}

interface Suggestion {
  action: string;
  effort: EffortLevel;
  impact: ImpactLevel;
}

interface ScenarioOutcome {
  scenario: string;
  description: string;
  confidence: string;
}

const PredictiveDashboard: React.FC = () => {
  const [timeWindow, setTimeWindow] = useState<TimeWindow>(30);
  const [showExplanation, setShowExplanation] = useState(false);

  // Mock data
  const [overallTrend] = useState<OverallTrend>({
    direction: 'improving',
    summary: 'Your eating behaviors, weight trend, and activity are moving in a positive direction based on recent patterns.',
    lastUpdated: '2 hours ago'
  });

  const [eatingPattern] = useState<HabitIndicator>({
    trend: 'up',
    insight: 'More home-cooked meals and balanced portions',
    confidence: 78
  });

  const [weightDirection] = useState<HabitIndicator>({
    trend: 'stable',
    insight: 'Gradual, sustainable rate consistent with your goals',
    confidence: 72
  });

  const [activityConsistency] = useState<HabitIndicator>({
    trend: 'up',
    insight: 'Regular activity most days of the week',
    confidence: 85
  });

  const [behaviorSignals] = useState<BehaviorSignal[]>([
    {
      name: 'Late-night eating',
      level: 'low',
      description: 'Eating after 8pm has decreased',
      trend: 'decreasing'
    },
    {
      name: 'Emotional eating',
      level: 'moderate',
      description: 'Some stress-driven food choices',
      trend: 'stable'
    },
    {
      name: 'Meal skipping',
      level: 'low',
      description: 'Consistent breakfast and lunch',
      trend: 'decreasing'
    },
    {
      name: 'Ultra-processed intake',
      level: 'moderate',
      description: 'Improving but room for growth',
      trend: 'decreasing'
    },
    {
      name: 'Grocery vs. eating out',
      level: 'low',
      description: 'Mostly home cooking',
      trend: 'stable'
    }
  ]);

  const [nutritionTrends] = useState<NutritionTrend[]>([
    {
      nutrient: 'Protein',
      trend: 'adequate',
      insight: 'Meeting targets most days'
    },
    {
      nutrient: 'Fiber',
      trend: 'below',
      insight: 'Could benefit from more vegetables and whole grains'
    },
    {
      nutrient: 'Added sugar',
      trend: 'adequate',
      insight: 'Staying within recommended limits'
    },
    {
      nutrient: 'Sodium',
      trend: 'above',
      insight: 'Trending higher, watch processed foods'
    }
  ]);

  const [scenarioOutcomes] = useState<ScenarioOutcome[]>([
    {
      scenario: 'Energy levels',
      description: 'Likely to feel more consistent energy throughout the day',
      confidence: 'Moderate confidence'
    },
    {
      scenario: 'Weight trajectory',
      description: 'On track for sustainable, gradual progress toward goals',
      confidence: 'High confidence'
    },
    {
      scenario: 'Habit sustainability',
      description: 'Current patterns appear maintainable long-term',
      confidence: 'Moderate confidence'
    }
  ]);

  const [suggestions] = useState<Suggestion[]>([
    {
      action: 'Add a serving of vegetables to dinner',
      effort: 'low',
      impact: 'medium'
    },
    {
      action: 'Prep grab-and-go protein snacks for afternoons',
      effort: 'low',
      impact: 'medium'
    },
    {
      action: 'Switch one ultra-processed snack to whole food option',
      effort: 'low',
      impact: 'medium'
    },
    {
      action: 'Set a consistent bedtime to support sleep quality',
      effort: 'medium',
      impact: 'high'
    },
    {
      action: 'Try one new vegetable recipe per week',
      effort: 'low',
      impact: 'low'
    },
    {
      action: 'Plan one additional home-cooked meal on weekends',
      effort: 'medium',
      impact: 'medium'
    }
  ]);

  const getSignalColor = (level: SignalLevel) => {
    switch (level) {
      case 'low':
        return 'from-green-50 to-emerald-50 border-green-400 text-green-700';
      case 'moderate':
        return 'from-yellow-50 to-amber-50 border-yellow-400 text-yellow-700';
      case 'high':
        return 'from-red-50 to-orange-50 border-red-400 text-red-700';
    }
  };

  const getSignalIcon = (level: SignalLevel) => {
    switch (level) {
      case 'low':
        return (
          <svg className="w-5 h-5 text-green-600" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="12" r="10"/>
          </svg>
        );
      case 'moderate':
        return (
          <svg className="w-5 h-5 text-yellow-600" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="12" r="10"/>
          </svg>
        );
      case 'high':
        return (
          <svg className="w-5 h-5 text-red-600" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="12" r="10"/>
          </svg>
        );
    }
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return (
          <svg className="w-5 h-5 text-green-600" viewBox="0 0 24 24" fill="currentColor">
            <path d="M7 14l5-5 5 5z"/>
          </svg>
        );
      case 'down':
        return (
          <svg className="w-5 h-5 text-red-600" viewBox="0 0 24 24" fill="currentColor">
            <path d="M7 10l5 5 5-5z"/>
          </svg>
        );
      case 'stable':
        return (
          <svg className="w-5 h-5 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 12h8"/>
            <rect x="8" y="11" width="8" height="2"/>
          </svg>
        );
    }
  };

  const getNutritionIcon = (trend: 'adequate' | 'below' | 'above') => {
    switch (trend) {
      case 'adequate':
        return (
          <svg className="w-5 h-5 text-green-600" viewBox="0 0 24 24" fill="currentColor">
            <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/>
          </svg>
        );
      case 'below':
        return (
          <svg className="w-5 h-5 text-red-600" viewBox="0 0 24 24" fill="currentColor">
            <path d="M7 10l5 5 5-5z"/>
          </svg>
        );
      case 'above':
        return (
          <svg className="w-5 h-5 text-red-600" viewBox="0 0 24 24" fill="currentColor">
            <path d="M7 14l5-5 5 5z"/>
          </svg>
        );
    }
  };

  const getNutritionColor = (trend: 'adequate' | 'below' | 'above') => {
    switch (trend) {
      case 'adequate':
        return 'text-green-600';
      case 'below':
        return 'text-amber-600';
      case 'above':
        return 'text-amber-600';
    }
  };

  return (
    <div className="min-h-screen overflow-y-auto" style={{ backgroundColor: '#f0f7ff', height: '100%' }}>
      <div className="w-full px-2 sm:px-4 pb-8">
        {/* Time Window Selector */}
        <div className="flex items-center justify-end gap-2 mb-6 pt-4">
        <span className="text-sm text-gray-600">View:</span>
        <div className="inline-flex rounded-full border-0 bg-gray-100 p-1 shadow-sm">
          {[7, 30, 90].map((days) => (
            <button
              key={days}
              onClick={() => setTimeWindow(days as TimeWindow)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                timeWindow === days
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'bg-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {days} days
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-3xl mx-auto space-y-6">
        {/* 1. Top Summary (BLUF) */}
        <div className={`rounded-2xl border-0 p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 active:scale-95 active:shadow-md active:translate-y-0 cursor-pointer transform overflow-hidden ${
          overallTrend.direction === 'improving' ? 'bg-gradient-to-r from-green-50 to-emerald-50' :
          overallTrend.direction === 'stable' ? 'bg-gradient-to-r from-blue-50 to-indigo-50' :
          'bg-gradient-to-r from-amber-50 to-orange-50'
        }`}>
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-3 flex items-center gap-3">
                {overallTrend.direction === 'improving' && (
                  <svg className="w-8 h-8 text-green-600" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/>
                  </svg>
                )}
                {overallTrend.direction === 'stable' && (
                  <svg className="w-8 h-8 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
                  </svg>
                )}
                {overallTrend.direction === 'at-risk' && (
                  <svg className="w-8 h-8 text-amber-600" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
                  </svg>
                )}
                <span className="bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  {overallTrend.direction === 'improving' ? 'Positive Trajectory' :
                   overallTrend.direction === 'stable' ? 'Steady Progress' : 'Needs Attention'}
                </span>
              </h2>
              <p className="text-base text-gray-700 leading-relaxed font-medium">{overallTrend.summary}</p>
            </div>
            
            {/* Trend Chart */}
            <div className="mt-4 h-32">
              <Line
                data={{
                  labels: timeWindow === 7 ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] :
                         timeWindow === 30 ? ['Week 1', 'Week 2', 'Week 3', 'Week 4'] :
                         ['Month 1', 'Month 2', 'Month 3'],
                  datasets: [{
                    label: 'Overall Progress',
                    data: timeWindow === 7 ? [65, 68, 70, 72, 75, 78, 82] :
                          timeWindow === 30 ? [65, 70, 76, 82] :
                          [65, 74, 82],
                    borderColor: overallTrend.direction === 'improving' ? 'rgb(34, 197, 94)' :
                                 overallTrend.direction === 'stable' ? 'rgb(59, 130, 246)' : 'rgb(251, 146, 60)',
                    backgroundColor: overallTrend.direction === 'improving' ? 'rgba(34, 197, 94, 0.1)' :
                                     overallTrend.direction === 'stable' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(251, 146, 60, 0.1)',
                    tension: 0.4,
                    fill: true,
                    pointRadius: 4,
                    pointHoverRadius: 6
                  }]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { display: false },
                    tooltip: {
                      backgroundColor: 'rgba(0, 0, 0, 0.8)',
                      padding: 12,
                      cornerRadius: 8
                    }
                  },
                  scales: {
                    y: {
                      display: false,
                      min: 0,
                      max: 100
                    },
                    x: {
                      grid: { display: false },
                      ticks: { font: { size: 10 } }
                    }
                  }
                }}
              />
            </div>
          </div>
          <div className="text-xs text-gray-500 bg-white/60 px-3 py-1 rounded-full inline-block">
            Updated {overallTrend.lastUpdated}
          </div>
        </div>

        {/* 2. Habit Direction Indicators */}
        <div className="bg-white rounded-2xl border-0 p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 active:scale-95 active:shadow-md active:translate-y-0 cursor-pointer transform overflow-hidden">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <svg className="w-7 h-7 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
              <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/>
            </svg>
            <span className="text-gray-900">Habit Trends</span>
          </h2>
          
          <div className="space-y-4">
            {/* Eating Pattern */}
            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-l-4 border-blue-400 overflow-hidden">
              <div className="mb-3">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-base font-bold text-gray-900">Eating Behavior</h3>
                  <div className="flex items-center justify-center w-8 h-8 bg-white/60 rounded-full">
                    {getTrendIcon(eatingPattern.trend)}
                  </div>
                </div>
                <p className="text-sm text-gray-700 font-medium mb-3">{eatingPattern.insight}</p>
                
                {/* Mini Sparkline */}
                <div className="h-16 mb-2">
                  <Line
                    data={{
                      labels: ['', '', '', '', '', '', ''],
                      datasets: [{
                        data: [72, 68, 75, 78, 74, 80, 82],
                        borderColor: 'rgb(59, 130, 246)',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        tension: 0.4,
                        fill: true,
                        pointRadius: 0,
                        borderWidth: 2
                      }]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: { legend: { display: false }, tooltip: { enabled: false } },
                      scales: {
                        y: { display: false },
                        x: { display: false }
                      }
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Weight Direction */}
            <div className="p-4 bg-gradient-to-r from-purple-50 to-violet-50 rounded-xl border-l-4 border-purple-400 overflow-hidden">
              <div className="mb-3">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-base font-bold text-gray-900">Weight Trend</h3>
                  <div className="flex items-center justify-center w-8 h-8 bg-white/60 rounded-full">
                    {getTrendIcon(weightDirection.trend)}
                  </div>
                </div>
                <p className="text-sm text-gray-700 font-medium mb-3">{weightDirection.insight}</p>
                
                {/* Mini Sparkline */}
                <div className="h-16 mb-2">
                  <Line
                    data={{
                      labels: ['', '', '', '', '', '', ''],
                      datasets: [{
                        data: [180, 179, 178, 177, 176.5, 176, 175],
                        borderColor: 'rgb(168, 85, 247)',
                        backgroundColor: 'rgba(168, 85, 247, 0.1)',
                        tension: 0.4,
                        fill: true,
                        pointRadius: 0,
                        borderWidth: 2
                      }]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: { legend: { display: false }, tooltip: { enabled: false } },
                      scales: {
                        y: { display: false },
                        x: { display: false }
                      }
                    }}
                  />
                </div>
              </div>
              <div className="mt-3 p-2 bg-amber-100/60 rounded-lg overflow-hidden">
                <p className="text-xs text-amber-800 font-medium">
                  <svg className="w-4 h-4 inline-block mr-1" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                  </svg>
                  Directional insight based on habits, not a medical prediction
                </p>
              </div>
            </div>

            {/* Activity Consistency */}
            <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border-l-4 border-green-400 overflow-hidden">
              <div className="mb-3">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-base font-bold text-gray-900">Activity Level</h3>
                  <div className="flex items-center justify-center w-8 h-8 bg-white/60 rounded-full">
                    {getTrendIcon(activityConsistency.trend)}
                  </div>
                </div>
                <p className="text-sm text-gray-700 font-medium mb-3">{activityConsistency.insight}</p>
                
                {/* Mini Sparkline */}
                <div className="h-16 mb-2">
                  <Line
                    data={{
                      labels: ['', '', '', '', '', '', ''],
                      datasets: [{
                        data: [45, 52, 48, 65, 70, 68, 72],
                        borderColor: 'rgb(34, 197, 94)',
                        backgroundColor: 'rgba(34, 197, 94, 0.1)',
                        tension: 0.4,
                        fill: true,
                        pointRadius: 0,
                        borderWidth: 2
                      }]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: { legend: { display: false }, tooltip: { enabled: false } },
                      scales: {
                        y: { display: false },
                        x: { display: false }
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Behavior Signals */}
        <div className="bg-white rounded-2xl border-0 p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 active:scale-95 active:shadow-md active:translate-y-0 cursor-pointer transform overflow-hidden">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <svg className="w-7 h-7 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            <span className="text-gray-900">Behavior Signals</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              {behaviorSignals.map((signal, index) => {
                const colors = [
                  'from-blue-50 to-blue-100 border-blue-400',      // Late-night eating
                  'from-orange-50 to-orange-100 border-orange-400', // Emotional eating
                  'from-green-50 to-green-100 border-green-400',    // Meal skipping
                  'from-purple-50 to-purple-100 border-purple-400', // Ultra-processed
                  'from-pink-50 to-pink-100 border-pink-400'        // Grocery vs eating out
                ];
                const dotColors = [
                  'text-blue-600',   // Late-night eating
                  'text-orange-600', // Emotional eating  
                  'text-green-600',  // Meal skipping
                  'text-purple-600', // Ultra-processed
                  'text-pink-600'    // Grocery vs eating out
                ];
                return (
                  <div 
                    key={index}
                    className={`p-4 mb-3 bg-gradient-to-r rounded-xl border-l-4 hover:brightness-95 transition-all duration-200 cursor-pointer overflow-hidden ${colors[index]}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-1">
                          <svg className={`w-5 h-5 ${dotColors[index]}`} viewBox="0 0 24 24" fill="currentColor">
                            <circle cx="12" cy="12" r="10"/>
                          </svg>
                          {signal.name}
                        </h3>
                        <p className="text-xs text-gray-700 font-medium">{signal.description}</p>
                      </div>
                      <div className="flex items-center justify-center w-8 h-8 bg-white/60 rounded-full">
                        {signal.trend === 'increasing' ? (
                          <svg className="w-4 h-4 text-gray-900" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M7 14l5-5 5 5z"/>
                          </svg>
                        ) : signal.trend === 'decreasing' ? (
                          <svg className="w-4 h-4 text-gray-900" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M7 10l5 5 5-5z"/>
                          </svg>
                        ) : (
                          <svg className="w-4 h-4 text-gray-900" viewBox="0 0 24 24" fill="currentColor">
                            <rect x="8" y="11" width="8" height="2"/>
                          </svg>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Behavior Distribution Chart */}
            <div className="flex items-center justify-center">
              <div className="w-full max-w-xs">
                <Doughnut
                  data={{
                    labels: behaviorSignals.map(s => s.name),
                    datasets: [{
                      label: 'Signal Status',
                      data: [40, 25, 15, 10, 10], // Relative importance/frequency
                      backgroundColor: [
                        'rgba(59, 130, 246, 0.8)',   // Late-night eating - Blue
                        'rgba(251, 146, 60, 0.8)',   // Emotional eating - Orange
                        'rgba(34, 197, 94, 0.8)',    // Meal skipping - Green
                        'rgba(168, 85, 247, 0.8)',   // Ultra-processed - Purple
                        'rgba(236, 72, 153, 0.8)'    // Grocery vs eating out - Pink
                      ],
                      borderColor: [
                        'rgb(59, 130, 246)',
                        'rgb(251, 146, 60)',
                        'rgb(34, 197, 94)',
                        'rgb(168, 85, 247)',
                        'rgb(236, 72, 153)'
                      ],
                      borderWidth: 2
                    }]
                  }}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: {
                        display: false
                      },
                      tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        cornerRadius: 8,
                        callbacks: {
                          label: function(context) {
                            const signal = behaviorSignals[context.dataIndex];
                            return `${signal.name}: ${signal.level}`;
                          }
                        }
                      }
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 4. Nutrition Balance Forecast */}
        <div className="bg-white rounded-2xl border-0 p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 active:scale-95 active:shadow-md active:translate-y-0 cursor-pointer transform overflow-hidden">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <svg className="w-7 h-7 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
            <span className="text-gray-900">Nutrition Trends</span>
          </h2>
          
          {/* Bar Chart */}
          <div className="mb-4 h-48">
            <Bar
              data={{
                labels: nutritionTrends.map(t => t.nutrient),
                datasets: [{
                  label: 'Intake Level (%)',
                  data: [85, 72, 95, 68],
                  backgroundColor: [
                    'rgba(34, 197, 94, 0.8)',
                    'rgba(239, 68, 68, 0.8)',
                    'rgba(34, 197, 94, 0.8)',
                    'rgba(239, 68, 68, 0.8)'
                  ],
                  borderColor: [
                    'rgb(34, 197, 94)',
                    'rgb(239, 68, 68)',
                    'rgb(34, 197, 94)',
                    'rgb(239, 68, 68)'
                  ],
                  borderWidth: 2,
                  borderRadius: 8
                }]
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    cornerRadius: 8
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    max: 100,
                    grid: { color: 'rgba(0, 0, 0, 0.05)' },
                    ticks: { font: { size: 11 } }
                  },
                  x: {
                    grid: { display: false },
                    ticks: { font: { size: 11, weight: 'bold' } }
                  }
                }
              }}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            {nutritionTrends.map((trend, index) => (
              <div 
                key={index}
                className="p-3 bg-gradient-to-r from-gray-50 to-slate-50 rounded-lg border-l-4 border-gray-400 hover:bg-gradient-to-r hover:from-gray-100 hover:to-slate-100 transition-all duration-200 cursor-pointer overflow-hidden"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold text-gray-900">{trend.nutrient}</h3>
                  <div className="flex items-center justify-center w-8 h-8 bg-white/60 rounded-full">
                    {getNutritionIcon(trend.trend)}
                  </div>
                </div>
                <p className="text-xs text-gray-700 font-medium">{trend.insight}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 5. Scenario Preview */}
        <div className="bg-white rounded-2xl border-0 p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 active:scale-95 active:shadow-md active:translate-y-0 cursor-pointer transform overflow-hidden">
          <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
            <svg className="w-7 h-7 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
            </svg>
            <span className="text-gray-900">If Current Patterns Continue...</span>
          </h2>
          <p className="text-xs text-gray-600 mb-4 font-medium">These are possibilities, not guarantees. Your choices shape outcomes.</p>
          
          {/* Scenario Comparison Chart */}
          <div className="mb-4 h-40">
            <Bar
              data={{
                labels: scenarioOutcomes.map(s => s.scenario),
                datasets: [{
                  label: 'Likelihood (%)',
                  data: [75, 65, 80],
                  backgroundColor: [
                    'rgba(59, 130, 246, 0.8)',
                    'rgba(168, 85, 247, 0.8)',
                    'rgba(34, 197, 94, 0.8)'
                  ],
                  borderColor: [
                    'rgb(59, 130, 246)',
                    'rgb(168, 85, 247)',
                    'rgb(34, 197, 94)'
                  ],
                  borderWidth: 2,
                  borderRadius: 8
                }]
              }}
              options={{
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    cornerRadius: 8
                  }
                },
                scales: {
                  x: {
                    beginAtZero: true,
                    max: 100,
                    grid: { color: 'rgba(0, 0, 0, 0.05)' },
                    ticks: { font: { size: 10 } }
                  },
                  y: {
                    grid: { display: false },
                    ticks: { font: { size: 11, weight: 'bold' } }
                  }
                }
              }}
            />
          </div>
          
          <div className="space-y-3">
            {scenarioOutcomes.map((outcome, index) => (
              <div key={index} className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-l-4 border-blue-400 overflow-hidden">
                <h3 className="text-sm font-bold text-gray-900 mb-1">{outcome.scenario}</h3>
                <p className="text-sm text-gray-700 font-medium mb-2">{outcome.description}</p>
                <span className="text-xs text-blue-600 font-semibold bg-white/60 px-2 py-1 rounded-full">
                  {outcome.confidence}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 6. Small Changes, Big Impact */}
        <div className="bg-white rounded-2xl border-0 p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 active:scale-95 active:shadow-md active:translate-y-0 cursor-pointer transform overflow-hidden">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <svg className="w-7 h-7 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
              <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/>
            </svg>
            <span className="text-gray-900">Suggested Actions</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {suggestions.map((suggestion, index) => (
              <div 
                key={index}
                className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border-l-4 border-green-400 hover:bg-gradient-to-r hover:from-green-100 hover:to-emerald-100 transition-all duration-200 cursor-pointer overflow-hidden"
              >
                <p className="text-sm text-gray-900 font-bold mb-2">{suggestion.action}</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                    {suggestion.effort === 'low' ? 'Easy' : 'Medium'}
                  </span>
                  <span className="text-xs font-semibold bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                    {suggestion.impact === 'high' ? 'High' : suggestion.impact === 'medium' ? 'Med' : 'Low'} Impact
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 7. How This Works (Collapsible) */}
        <div className="bg-white rounded-2xl border-0 p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 active:scale-95 active:shadow-md active:translate-y-0 cursor-pointer transform overflow-hidden">
          <button
            onClick={() => setShowExplanation(!showExplanation)}
            className="w-full flex items-center justify-between text-left"
          >
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <svg className="w-6 h-6 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11 18h2v-2h-2v2zm1-16C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-2.21 0-4 1.79-4 4h2c0-1.1.9-2 2-2s2 .9 2 2c0 2-3 1.75-3 5h2c0-2.25 3-2.5 3-5 0-2.21-1.79-4-4-4z"/>
              </svg>
              <span className="text-gray-900">How This Works</span>
            </h2>
            <span className="text-2xl text-gray-400">
              {showExplanation ? '−' : '+'}
            </span>
          </button>
          
          {showExplanation && (
            <div className="mt-4 p-4 bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl space-y-3 overflow-hidden">
              <p className="text-sm text-gray-700 leading-relaxed font-medium">
                <strong className="text-gray-900">This dashboard shows directional intelligence</strong> — insights about where your habits are heading, based on your recent patterns.
              </p>
              <p className="text-sm text-gray-700 leading-relaxed font-medium">
                <strong className="text-gray-900">We analyze:</strong> Food logging patterns, activity consistency, sleep quality, and behavioral trends over your chosen time window.
              </p>
              <p className="text-sm text-gray-700 leading-relaxed font-medium">
                <strong className="text-gray-900">Confidence levels</strong> reflect how consistent your data is. More consistent patterns = higher confidence.
              </p>
              <p className="text-sm text-gray-700 leading-relaxed font-medium">
                <strong className="text-gray-900">Important:</strong> These are <em>possibilities, not promises</em>. Your daily choices shape outcomes more than any algorithm.
              </p>
              <div className="mt-4 p-3 bg-blue-100/60 rounded-lg border-l-4 border-blue-500">
                <p className="text-xs text-blue-900 font-semibold">
                  <svg className="w-4 h-4 inline-block mr-1" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
                  </svg>
                  This is not medical advice. For health concerns, consult a healthcare provider.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
};

export default PredictiveDashboard;
