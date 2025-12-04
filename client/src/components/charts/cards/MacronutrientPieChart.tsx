/**
 * Macronutrient Pie Chart - Priority 1
 * Protein/Carbs/Fat breakdown with Nova-style donut pattern
 */

import React from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import AnalyzeWithWihyButton from '../shared/AnalyzeWithWihyButton';

ChartJS.register(ArcElement, Tooltip, Legend);

interface MacronutrientData {
  protein: number; // grams or percentage
  carbohydrates: number; // grams or percentage  
  fat: number; // grams or percentage
  fiber?: number; // optional fiber breakdown
}

interface MacronutrientPieChartProps {
  data: MacronutrientData;
  displayMode?: 'grams' | 'calories' | 'percentage';
  size?: 'small' | 'medium' | 'large';
  showLegend?: boolean;
  showCenter?: boolean;
  title?: string;
  onAnalyze?: (userMessage: string, assistantMessage: string) => void;
}

const MacronutrientPieChart: React.FC<MacronutrientPieChartProps> = ({
  data,
  displayMode = 'percentage',
  size = 'medium',
  showLegend = true,
  showCenter = true,
  title = 'Macronutrient Breakdown',
  onAnalyze
}) => {
  // Provide default data if none is provided
  const defaultData: MacronutrientData = {
    protein: 25,
    carbohydrates: 45,
    fat: 30
  };
  
  const macroData = data || defaultData;
  
  // Calculate display values based on mode
  const calculateDisplayValues = () => {
    const { protein, carbohydrates, fat } = macroData;
    
    switch (displayMode) {
      case 'grams':
        return {
          protein: Math.round(protein),
          carbs: Math.round(carbohydrates),
          fat: Math.round(fat),
          total: protein + carbohydrates + fat,
          unit: 'g'
        };
        
      case 'calories':
        // Convert grams to calories (protein: 4 cal/g, carbs: 4 cal/g, fat: 9 cal/g)
        const proteinCal = protein * 4;
        const carbsCal = carbohydrates * 4;
        const fatCal = fat * 9;
        return {
          protein: Math.round(proteinCal),
          carbs: Math.round(carbsCal),
          fat: Math.round(fatCal),
          total: proteinCal + carbsCal + fatCal,
          unit: 'cal'
        };
        
      case 'percentage':
      default:
        const total = protein + carbohydrates + fat;
        if (total === 0) return { protein: 0, carbs: 0, fat: 0, total: 0, unit: '%' };
        return {
          protein: Math.round((protein / total) * 100),
          carbs: Math.round((carbohydrates / total) * 100),
          fat: Math.round((fat / total) * 100),
          total: 100,
          unit: '%'
        };
    }
  };

  const displayValues = calculateDisplayValues();
  const safeTotal = displayValues.total || 1; // avoid divide-by-zero

  // Macronutrient color scheme (match other charts)
  const colors = {
    protein: '#EF4444', // Red
    carbs: '#3B82F6',   // Blue
    fat: '#F59E0B',     // Yellow
    fiber: '#10B981'    // Green (if included later)
  };

  const chartData = {
    labels: ['Protein', 'Carbohydrates', 'Fat'],
    datasets: [
      {
        data: [displayValues.protein, displayValues.carbs, displayValues.fat],
        backgroundColor: [colors.protein, colors.carbs, colors.fat],
        borderColor: ['#ffffff', '#ffffff', '#ffffff'],
        borderWidth: 2,
        hoverOffset: 6,
        cutout: '70%', // donut cutout to match Nova pattern
      },
    ],
  };

  const options: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false, // use custom side legend instead
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const label = context.label;
            const value = context.parsed;
            const percentage = displayMode !== 'percentage'
              ? Math.round((value / safeTotal) * 100)
              : value;

            return `${label}: ${value}${displayValues.unit} (${percentage}%)`;
          },
        },
      },
    },
  };

  // Helper to get percentage regardless of displayMode
  const toPercent = (value: number) =>
    Math.round((value / safeTotal) * 100);

  return (
    <div className="flex flex-col p-6 rounded-2xl bg-white border border-gray-200 h-[420px] overflow-hidden text-center">
      <h3 className="text-xl font-semibold text-gray-400 mb-1">
        {title}
      </h3>
      <p className="text-sm text-gray-500 mb-4 max-w-xs mx-auto">
        Visual breakdown of protein, carbs, and fat in your current intake.
      </p>

      {/* Main content: donut + custom side legend (Nova-style pattern) */}
      <div className="flex flex-row items-center justify-center gap-6 flex-1 overflow-hidden min-h-0">
        {/* Donut chart */}
        <div className="relative w-full h-full max-w-[240px] max-h-[240px] flex-shrink-0 overflow-hidden">
          <Doughnut data={chartData} options={options} />

          {/* Center total display */}
          {showCenter && displayMode !== 'percentage' && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
              <div
                className={`font-bold text-gray-700 leading-none ${
                  size === 'small'
                    ? 'text-base'
                    : size === 'large'
                    ? 'text-2xl'
                    : 'text-xl'
                }`}
              >
                {displayValues.total}
              </div>
              <div
                className={`text-gray-500 mt-0.5 ${
                  size === 'small'
                    ? 'text-xs'
                    : size === 'large'
                    ? 'text-base'
                    : 'text-sm'
                }`}
              >
                total {displayValues.unit}
              </div>
            </div>
          )}
        </div>

        {/* Custom legend / details on the right */}
        {showLegend && (
          <div className="flex flex-col justify-center space-y-3 text-left max-w-[220px]">
            <div className="text-xs uppercase tracking-wide text-gray-400 mb-1">
              Macro distribution
            </div>

            <div className="flex items-center justify-between text-sm gap-3">
              <div className="flex items-center">
                <span
                  className="w-3 h-3 rounded-sm mr-2 flex-shrink-0"
                  style={{ backgroundColor: colors.protein }}
                />
                <span className="font-medium text-gray-700 whitespace-nowrap">
                  Protein
                </span>
              </div>
              <div className="text-right">
                <div className="font-semibold text-gray-800">
                  {displayValues.protein}
                  {displayValues.unit}
                </div>
                <div className="text-xs text-gray-500">
                  {toPercent(displayValues.protein)}%
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm gap-3">
              <div className="flex items-center">
                <span
                  className="w-3 h-3 rounded-sm mr-2 flex-shrink-0"
                  style={{ backgroundColor: colors.carbs }}
                />
                <span className="font-medium text-gray-700 whitespace-nowrap">
                  Carbs
                </span>
              </div>
              <div className="text-right">
                <div className="font-semibold text-gray-800">
                  {displayValues.carbs}
                  {displayValues.unit}
                </div>
                <div className="text-xs text-gray-500">
                  {toPercent(displayValues.carbs)}%
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm gap-3">
              <div className="flex items-center">
                <span
                  className="w-3 h-3 rounded-sm mr-2 flex-shrink-0"
                  style={{ backgroundColor: colors.fat }}
                />
                <span className="font-medium text-gray-700 whitespace-nowrap">
                  Fat
                </span>
              </div>
              <div className="text-right">
                <div className="font-semibold text-gray-800">
                  {displayValues.fat}
                  {displayValues.unit}
                </div>
                <div className="text-xs text-gray-500">
                  {toPercent(displayValues.fat)}%
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Analyze with WiHy */}
      <div className="flex justify-center mt-4 flex-shrink-0">
        <AnalyzeWithWihyButton
          cardContext={`Macronutrient analysis: ${title} showing ${displayMode} breakdown - Protein: ${toPercent(displayValues.protein)}% (${displayValues.protein}${displayMode === 'grams' ? 'g' : displayMode === 'calories' ? ' cal' : '%'}), Carbs: ${toPercent(displayValues.carbs)}% (${displayValues.carbs}${displayMode === 'grams' ? 'g' : displayMode === 'calories' ? ' cal' : '%'}), Fat: ${toPercent(displayValues.fat)}% (${displayValues.fat}${displayMode === 'grams' ? 'g' : displayMode === 'calories' ? ' cal' : '%'})`}
          userQuery="Analyze this macronutrient breakdown and provide insights about the protein, carbohydrate, and fat distribution"
          onAnalyze={onAnalyze}
        />
      </div>
    </div>
  );
};

export default MacronutrientPieChart;