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

/* ================= Unified card styling ================= */

const cardChrome: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  padding: 24,
  borderRadius: 16,
  background: "white",
  border: "1px solid #e5e7eb",
  boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
  height: 420,
  overflow: "hidden",
};

const titleStyle: React.CSSProperties = {
  margin: "0 0 20px 0",
  fontSize: 24,
  fontWeight: 600,
  color: "#9CA3AF",
};

const sectionGrow: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  flex: 1,
  overflow: "hidden",
  minHeight: 0,
};

const footerRow: React.CSSProperties = {
  display: "flex",
  justifyContent: "center",
  marginTop: 16,
  flexShrink: 0,
};

/* ================= Card shell ================= */

function CardShell({
  title = "",
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <section style={cardChrome}>
      <h3 style={titleStyle}>{title}</h3>
      <div style={sectionGrow}>{children}</div>
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
      <div style={{ textAlign: "center", marginBottom: "24px" }}>
        <div style={{ 
          fontSize: 48, 
          fontWeight: 700, 
          color: progressColor,
          lineHeight: 1.5,
          marginBottom: "8px"
        }}>
          {totalSteps.toLocaleString()}
        </div>
        <div style={{
          fontSize: 14,
          color: '#9ca3af',
          fontWeight: 400
        }}>
          steps this week
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{ width: "100%", maxWidth: "200px", marginBottom: "16px" }}>
        <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px', textAlign: 'center' }}>
          Weekly Goal: {totalGoal.toLocaleString()} steps
        </div>
        <div style={{
          width: '100%',
          height: '12px',
          backgroundColor: '#f3f4f6',
          borderRadius: '6px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${progressPercentage}%`,
            height: '100%',
            background: progressColor,
            borderRadius: '6px',
            transition: 'width 0.8s ease'
          }} />
        </div>
      </div>

      {/* Status Pill */}
      <div style={{ textAlign: "center" }}>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 16px",
            borderRadius: 9999,
            fontWeight: 600,
            fontSize: 14,
            color: progressColor,
            backgroundColor: `${progressColor}20`,
            border: `1px solid ${progressColor}33`,
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: 9999,
              background: "currentColor",
              opacity: 0.85,
            }}
          />
          {progressLabel} • {Math.round(progressPercentage)}%
        </span>
      </div>

      <div style={footerRow}>
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