import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  ReferenceLine
} from 'recharts';

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

  const formatTooltip = (value: any, name: string) => {
    if (name === 'duration') return [`${value} min`, 'Duration'];
    if (name === 'calories') return [`${value} cal`, 'Calories'];
    if (name === 'intensity') return [`${value}/10`, 'Intensity'];
    return [value, name];
  };

  const renderChart = () => {
    if (type === 'bar') {
      return (
        <BarChart data={mockData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e4e7" />
          <XAxis 
            dataKey="date" 
            stroke="#64748b"
            fontSize={12}
          />
          <YAxis stroke="#64748b" fontSize={12} />
          <Tooltip 
            formatter={formatTooltip}
            labelStyle={{ color: '#1e293b' }}
            contentStyle={{ 
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '8px'
            }}
          />
          <Legend />
          <Bar dataKey="duration" fill="#3b82f6" name="Duration (min)" radius={[2, 2, 0, 0]} />
          <Bar dataKey="calories" fill="#ef4444" name="Calories" radius={[2, 2, 0, 0]} />
        </BarChart>
      );
    }

    return (
      <LineChart data={mockData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e0e4e7" />
        <XAxis 
          dataKey="date" 
          stroke="#64748b"
          fontSize={12}
        />
        <YAxis stroke="#64748b" fontSize={12} />
        <Tooltip 
          formatter={formatTooltip}
          labelStyle={{ color: '#1e293b' }}
          contentStyle={{ 
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '8px'
          }}
        />
        <Legend />
        <Line 
          type="monotone" 
          dataKey="duration" 
          stroke="#3b82f6" 
          strokeWidth={2}
          dot={{ r: 4 }}
          activeDot={{ r: 6 }}
          name="Duration (min)"
        />
        <Line 
          type="monotone" 
          dataKey="calories" 
          stroke="#ef4444" 
          strokeWidth={2}
          dot={{ r: 4 }}
          activeDot={{ r: 6 }}
          name="Calories"
        />
        <Line 
          type="monotone" 
          dataKey="intensity" 
          stroke="#22c55e" 
          strokeWidth={2}
          dot={{ r: 4 }}
          activeDot={{ r: 6 }}
          name="Intensity"
        />
        <ReferenceLine y={averages.duration} stroke="#3b82f6" strokeDasharray="5 5" label="Avg Duration" />
      </LineChart>
    );
  };

  return (
    <div className="flex flex-col p-6 rounded-2xl bg-white border border-gray-200 shadow-md h-[420px] overflow-hidden">
      <h3 className="text-2xl font-semibold text-gray-400 m-0 mb-5 text-center">Exercise Tracking</h3>
      
      <ResponsiveContainer width="100%" height={300}>
        {renderChart()}
      </ResponsiveContainer>

      <div className="mt-4 text-sm text-gray-600">
        <div className="mb-3">
          <div className="font-semibold text-gray-700 mb-2">Key Metrics</div>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span>Average Duration:</span>
              <span className="font-medium">{averages.duration} minutes</span>
            </div>
            <div className="flex justify-between">
              <span>Average Calories:</span>
              <span className="font-medium">{averages.calories} cal/session</span>
            </div>
            <div className="flex justify-between">
              <span>Average Intensity:</span>
              <span className="font-medium">{averages.intensity}/10</span>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <div className="font-semibold text-gray-700 mb-2">Recommendations</div>
          <div className="space-y-1 text-xs">
            <div>• Aim for 150+ minutes moderate activity weekly</div>
            <div>• Include strength training 2-3 times per week</div>
            <div>• Maintain consistent workout schedule</div>
            <div>• Monitor intensity to avoid overtraining</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExerciseChart;