import React, { useMemo } from 'react';
import AnalyzeWithWihyButton from '../shared/AnalyzeWithWihyButton';

/* ================= Card shell ================= */

function CardShell({
  title = "",
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col p-6 rounded-2xl bg-white border border-gray-200 shadow-md h-[420px] overflow-hidden">
      <h3 className="m-0 mb-3 text-xl font-semibold text-gray-400">{title}</h3>
      <div className="flex flex-col items-center justify-center flex-1 overflow-hidden min-h-0">{children}</div>
    </section>
  );
}

interface ExerciseData {
  date: string;
  duration: number;
  calories: number;
  intensity: number;
  type?: string;
}

interface ExerciseChartProps {
  data?: ExerciseData[];
  type?: 'line' | 'bar' | 'mixed';
  timeRange?: '7d' | '30d' | '90d';
  onAnalyze?: (userMessage: string, assistantMessage: string) => void;
}

export const ExerciseChart: React.FC<ExerciseChartProps> = ({ 
  data = [], 
  type = 'mixed',
  timeRange = '7d',
  onAnalyze
}) => {
  const mockData = useMemo(() => {
    if (data.length > 0) return data;
    
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    return Array.from({ length: days }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (days - 1 - i));
      return {
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        duration: Math.floor(Math.random() * 90) + 15, // 15-105 minutes
        calories: Math.floor(Math.random() * 400) + 100, // 100-500 calories
        intensity: Math.floor(Math.random() * 10) + 1, // 1-10 intensity
        type: ['Cardio', 'Strength', 'Yoga', 'Running', 'Cycling'][Math.floor(Math.random() * 5)]
      };
    });
  }, [data, timeRange]);

  const averages = useMemo(() => {
    if (mockData.length === 0) return { duration: 0, calories: 0, intensity: 0 };
    
    return {
      duration: Math.round(mockData.reduce((sum, item) => sum + item.duration, 0) / mockData.length),
      calories: Math.round(mockData.reduce((sum, item) => sum + item.calories, 0) / mockData.length),
      intensity: Math.round(mockData.reduce((sum, item) => sum + item.intensity, 0) / mockData.length * 10) / 10
    };
  }, [mockData]);

  // Metrics for horizontal bar display
  const metrics = [
    { name: 'Duration', value: averages.duration, max: 120, unit: 'min', color: '#3b82f6' },
    { name: 'Calories', value: averages.calories, max: 500, unit: 'cal', color: '#ef4444' },
    { name: 'Intensity', value: averages.intensity, max: 10, unit: '/10', color: '#22c55e' }
  ];

  return (
    <CardShell title="Exercise Tracking">
      {/* Metrics display without label */}
      <div className="w-full max-w-[280px] mb-2">
        {metrics.map((metric) => (
          <div key={metric.name} className="mb-3">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium text-gray-700">{metric.name}:</span>
              <span className="text-sm font-medium text-gray-900">
                {metric.value} {metric.unit}
              </span>
            </div>
            
            {/* Progress bar */}
            <div style={{
              height: '20px',
              backgroundColor: '#f3f4f6',
              borderRadius: '4px',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${Math.min((metric.value / metric.max) * 100, 100)}%`,
                height: '100%',
                backgroundColor: metric.color,
                borderRadius: '4px',
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-center mt-2 flex-shrink-0">
        <AnalyzeWithWihyButton
          cardContext={`Exercise Tracking: Average duration ${averages.duration} minutes, average calories ${averages.calories} per session, average intensity ${averages.intensity}/10. Based on ${mockData.length} workout sessions.`}
          userQuery="Analyze my exercise patterns and provide recommendations for improving my fitness routine"
          onAnalyze={onAnalyze}
        />
      </div>
    </CardShell>
  );
};

export default ExerciseChart;