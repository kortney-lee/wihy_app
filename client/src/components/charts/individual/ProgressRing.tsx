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
  onAnalyze?: (userMessage: string, assistantMessage: string) => void;
}

const ProgressRing: React.FC<ProgressRingProps> = ({
  value = 75,
  maxValue = 100,
  label = 'Progress',
  unit = '%',
  color = '#10b981',
  size = 'medium',
  onAnalyze
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
    <div className="flex flex-col p-6 rounded-2xl bg-white border border-gray-200 shadow-md h-[420px] overflow-hidden">
      <h3 className="text-xl font-semibold text-gray-400 mb-3">{label}</h3>
      
      <div className="flex flex-col items-center justify-center flex-1">
        <div 
          className="relative mx-auto" 
          style={{ 
            width: dimensions[size].width, 
            height: dimensions[size].height
          }}
        >
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
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
            <div 
              className={`font-bold leading-none ${
                size === 'small' ? 'text-2xl' : size === 'large' ? 'text-4xl' : 'text-3xl'
              }`}
              style={{ color: color }}
            >
              {clampedValue}
            </div>
            <div className={`text-gray-500 mt-0.5 ${
              size === 'small' ? 'text-xs' : size === 'large' ? 'text-base' : 'text-sm'
            }`}>
              {unit}
            </div>
          </div>
        </div>
      
        {/* Progress status */}
        <div className={`text-center mt-3 text-gray-500 ${
          size === 'small' ? 'text-xs' : 'text-sm'
        }`}>
          {Math.round(progressPercent)}% of {maxValue}{unit} goal
        </div>
      </div>
      
      <div className="flex justify-center mt-2 flex-shrink-0">
        <AnalyzeWithWihyButton
          cardContext={`Progress Ring: ${label} showing ${clampedValue}${unit} out of ${maxValue}${unit} (${Math.round(progressPercent)}% completion). Current performance indicator for goal tracking and progress monitoring.`}
          userQuery={`Analyze my ${label.toLowerCase()} progress and provide insights about goal achievement and recommendations for improvement`}
          onAnalyze={onAnalyze}
        />
      </div>
    </div>
  );
};

export default ProgressRing;