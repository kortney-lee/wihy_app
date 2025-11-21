/**
 * Steps Chart - Line chart for step tracking
 * Recharts implementation for step count over time
 */

import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
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

interface StepsChartProps {
  period?: 'day' | 'week' | 'month';
  goal?: number;
  onAnalyze?: (userMessage: string, assistantMessage: string) => void;
}

const StepsChart: React.FC<StepsChartProps> = ({ 
  period = 'week',
  goal = 10000,
  onAnalyze
}) => {
  // Generate sample data based on period
  const chartData = useMemo(() => {
    switch (period) {
      case 'day':
        return [
          { time: '6am', steps: 800, goal },
          { time: '8am', steps: 1200, goal },
          { time: '10am', steps: 2100, goal },
          { time: '12pm', steps: 3500, goal },
          { time: '2pm', steps: 4200, goal },
          { time: '4pm', steps: 6800, goal },
          { time: '6pm', steps: 8500, goal },
          { time: '8pm', steps: 9200, goal }
        ];
      case 'month':
        return [
          { time: 'Week 1', steps: 68500, goal: goal * 7 },
          { time: 'Week 2', steps: 72300, goal: goal * 7 },
          { time: 'Week 3', steps: 69800, goal: goal * 7 },
          { time: 'Week 4', steps: 71200, goal: goal * 7 }
        ];
      default: // week
        return [
          { time: 'Mon', steps: 8500, goal },
          { time: 'Tue', steps: 12300, goal },
          { time: 'Wed', steps: 9800, goal },
          { time: 'Thu', steps: 11200, goal },
          { time: 'Fri', steps: 10500, goal },
          { time: 'Sat', steps: 15600, goal },
          { time: 'Sun', steps: 13200, goal }
        ];
    }
  }, [period, goal]);

  // Calculate total steps for the period
  const totalSteps = chartData.reduce((sum, day) => sum + day.steps, 0);
  const totalGoal = period === 'month' ? goal * 7 * 4 : goal * 7; // Weekly goal * days
  const isGoalMet = totalSteps >= totalGoal;

  const progressPercentage = Math.min(100, (totalSteps / totalGoal) * 100);
  
  // Determine color based on progress
  const getProgressColor = (progress: number): string => {
    if (progress >= 100) return '#10B981'; // Green - Goal achieved
    if (progress >= 75) return '#F59E0B';  // Yellow - Close to goal
    if (progress >= 50) return '#3B82F6';  // Blue - Halfway
    return '#EF4444'; // Red - Needs improvement
  };

  const getProgressLabel = (progress: number): string => {
    if (progress >= 100) return 'Goal Achieved';
    if (progress >= 75) return 'Almost There';
    if (progress >= 50) return 'Halfway';
    return 'Keep Moving';
  };

  const progressColor = getProgressColor(progressPercentage);
  const progressLabel = getProgressLabel(progressPercentage);

  return (
    <CardShell title="Steps History">
      {/* Main Value Display */}
      <div className="flex flex-col items-center min-w-0 overflow-hidden text-center mb-3">
        <div className="text-3xl lg:text-4xl font-bold mb-1 truncate" style={{color: progressColor}}>
          {totalSteps.toLocaleString()}
        </div>
        <div className="text-xs text-gray-400 font-normal truncate">
          steps this week
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full max-w-[200px] mb-3">
        <div className="text-xs text-gray-500 mb-2 text-center">
          Weekly Goal: {totalGoal.toLocaleString()} steps
        </div>
        <div className="w-full h-3 bg-gray-100 rounded-md overflow-hidden">
          <div className="h-full rounded-md transition-all duration-700 ease-in-out" style={{
            width: `${progressPercentage}%`,
            backgroundColor: progressColor
          }} />
        </div>
      </div>

      {/* Status Pill */}
      <div className="text-center">
        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm" style={{
          color: progressColor,
          backgroundColor: `${progressColor}20`,
          border: `1px solid ${progressColor}33`
        }}>
          <span className="w-2 h-2 rounded-full bg-current opacity-85" />
          {progressLabel} • {Math.round(progressPercentage)}%
        </span>
      </div>

      <div className="flex justify-center mt-2 flex-shrink-0">
        <AnalyzeWithWihyButton
          cardContext={`Steps tracking: Currently at ${totalSteps.toLocaleString()} steps out of ${totalGoal.toLocaleString()} weekly goal (${progressPercentage.toFixed(1)}% progress). Status: ${progressLabel}. This represents 7-day step history and physical activity trends.`}
          userQuery="Analyze my weekly step patterns and provide insights about my physical activity levels and recommendations for improvement"
          onAnalyze={onAnalyze}
        />
      </div>
    </CardShell>
  );
};

export default StepsChart;