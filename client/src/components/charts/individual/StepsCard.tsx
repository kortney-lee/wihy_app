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

// Unified card styling
const cardChrome = {
  display: "flex",
  flexDirection: "column" as const,
  padding: 24,
  borderRadius: 16,
  background: "white",
  border: "1px solid #e5e7eb",
  height: 420,
  overflow: "hidden" as const,
};

const titleStyle = {
  fontSize: 24,
  fontWeight: 600,
  color: "#9CA3AF",
  margin: 0,
  marginBottom: 20,
};

const sectionGrow = {
  display: "flex",
  flexDirection: "column" as const,
  alignItems: "center",
  justifyContent: "center",
  flex: 1,
  gap: 8,
  overflow: "hidden" as const,
  minHeight: 0,
};

const footerRow = {
  display: "flex",
  justifyContent: "center",
  marginTop: 16,
  flexShrink: 0,
};

const CardShell = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section style={cardChrome}>
    <h3 style={titleStyle}>{title}</h3>
    <div style={sectionGrow}>{children}</div>
  </section>
);

interface StepsChartProps {
  period?: 'day' | 'week' | 'month';
  goal?: number;
}

const StepsChart: React.FC<StepsChartProps> = ({ 
  period = 'week',
  goal = 10000
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

  const currentSteps = chartData[chartData.length - 1]?.steps || 0;
  const isGoalMet = currentSteps >= goal;

  return (
    <CardShell title="Steps History">
      {/* Current Steps Display */}
      <div style={{ textAlign: "center", marginBottom: "16px" }}>
        <div style={{ 
          fontSize: 32, 
          fontWeight: 700, 
          color: isGoalMet ? '#10b981' : '#f59e0b',
          lineHeight: 1.1,
          marginBottom: "4px"
        }}>
          {currentSteps.toLocaleString()}
        </div>
        <div style={{
          fontSize: 14,
          color: '#9ca3af',
          fontWeight: 400
        }}>
          steps today
        </div>
      </div>
      
      {/* Larger Chart */}
      <div style={{ width: "100%", height: "240px", overflow: "hidden" }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 15, left: 15, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" />
            <XAxis 
              dataKey="time" 
              tick={{ fontSize: 12, fill: '#64748b' }}
              axisLine={false}
            />
            <YAxis 
              tick={{ fontSize: 12, fill: '#64748b' }}
              tickFormatter={(value) => {
                if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
                return value.toString();
              }}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                border: '1px solid #10b981',
                borderRadius: '8px',
                color: '#fff'
              }}
              formatter={(value, name) => [
                `${value.toLocaleString()} steps`,
                name === 'steps' ? 'Steps' : 'Goal'
              ]}
            />
            <Line 
              type="monotone" 
              dataKey="steps" 
              stroke="#10b981" 
              strokeWidth={3}
              dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
              name="Steps"
            />
            <Line 
              type="monotone" 
              dataKey="goal" 
              stroke="#f59e0b" 
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              name="Goal"
            />
          </LineChart>
        </ResponsiveContainer>
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
            color: isGoalMet ? '#10b981' : '#f59e0b',
            backgroundColor: isGoalMet ? '#10b98120' : '#f59e0b20',
            border: `1px solid ${isGoalMet ? '#10b98133' : '#f59e0b33'}`,
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
          {isGoalMet ? 'Goal Achieved!' : `${(goal - currentSteps).toLocaleString()} to go`}
        </span>
      </div>
      
      <div style={footerRow}>
        <AnalyzeWithWihyButton
          cardContext={`Steps Chart: Current steps ${currentSteps.toLocaleString()}, goal ${goal.toLocaleString()} (${period} view). Goal ${isGoalMet ? 'achieved' : 'not yet reached'}. Step tracking for fitness and activity monitoring.`}
          userQuery="Analyze my step patterns and provide insights about my daily activity levels and recommendations for reaching my step goals"
        />
      </div>
    </CardShell>
  );
};

export default StepsChart;