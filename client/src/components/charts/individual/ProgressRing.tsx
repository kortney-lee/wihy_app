/**
 * Progress Ring Chart - Recharts Implementation
 * Circular progress indicator for various health metrics
 */

import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import AnalyzeWithWihyButton from '../shared/AnalyzeWithWihyButton';
import '../../../styles/charts.css';

interface ProgressRingProps {
  value?: number; // 0-100
  maxValue?: number;
  label?: string;
  unit?: string;
  color?: string;
  size?: 'small' | 'medium' | 'large';
}

const ProgressRing: React.FC<ProgressRingProps> = ({
  value = 75,
  maxValue = 100,
  label = 'Progress',
  unit = '%',
  color = '#10b981',
  size = 'medium'
}) => {
  // Ensure value is within bounds
  const clampedValue = Math.max(0, Math.min(maxValue, value));
  const progressPercent = (clampedValue / maxValue) * 100;
  
  // Chart dimensions based on size
  const dimensions = {
    small: { width: 120, height: 120 },
    medium: { width: 180, height: 180 },
    large: { width: 240, height: 240 }
  };

  // Progress ring data for PieChart
  const progressData = useMemo(() => [
    {
      name: 'completed',
      value: progressPercent,
      fill: color
    },
    {
      name: 'remaining',
      value: 100 - progressPercent,
      fill: '#f3f4f6'
    }
  ], [progressPercent, color]);

  return (
    <div className="dashboard-chart-card">
      <h3 className="chart-section-title">{label}</h3>
      
      <div className="chart-container" style={{ 
        width: dimensions[size].width, 
        height: dimensions[size].height,
        margin: '0 auto'
      }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={progressData}
              cx="50%"
              cy="50%"
              innerRadius="60%"
              outerRadius="90%"
              startAngle={90}
              endAngle={-270}
              dataKey="value"
              stroke="none"
            >
              {progressData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        
        {/* Center text overlay */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          pointerEvents: 'none'
        }}>
          <div className="insight-value" style={{
            fontSize: size === 'small' ? '24px' : size === 'large' ? '36px' : '30px',
            fontWeight: 'bold',
            color: color,
            lineHeight: '1'
          }}>
            {clampedValue}
          </div>
          <div style={{
            fontSize: size === 'small' ? '12px' : size === 'large' ? '16px' : '14px',
            color: '#6b7280',
            marginTop: '2px'
          }}>
            {unit}
          </div>
        </div>
      </div>
      
      {/* Progress status */}
      <div style={{ 
        textAlign: 'center',
        marginTop: '10px',
        fontSize: size === 'small' ? '12px' : '14px',
        color: '#6b7280'
      }}>
        {Math.round(progressPercent)}% of {maxValue}{unit} goal
      </div>
      
      <AnalyzeWithWihyButton
        cardContext={`Progress Ring: ${label} showing ${clampedValue}${unit} out of ${maxValue}${unit} (${Math.round(progressPercent)}% completion). Current performance indicator for goal tracking and progress monitoring.`}
        userQuery={`Analyze my ${label.toLowerCase()} progress and provide insights about goal achievement and recommendations for improvement`}
      />
    </div>
  );
};

export default ProgressRing;