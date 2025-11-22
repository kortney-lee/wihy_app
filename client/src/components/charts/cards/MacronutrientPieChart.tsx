/**
 * Macronutrient Pie Chart - Priority 1
 * Protein/Carbs/Fat breakdown with customizable styling
 */

import React from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Pie } from 'react-chartjs-2';
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

  // Macronutrient color scheme
  const colors = {
    protein: '#EF4444', // Red
    carbs: '#3B82F6',   // Blue  
    fat: '#F59E0B',     // Yellow
    fiber: '#10B981'    // Green (if included)
  };

  const chartData = {
    labels: ['Protein', 'Carbohydrates', 'Fat'],
    datasets: [
      {
        data: [displayValues.protein, displayValues.carbs, displayValues.fat],
        backgroundColor: [colors.protein, colors.carbs, colors.fat],
        borderColor: ['#ffffff', '#ffffff', '#ffffff'],
        borderWidth: 2,
        hoverOffset: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: showLegend,
        position: 'bottom' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
          font: {
            size: size === 'small' ? 12 : size === 'large' ? 16 : 14,
          },
          generateLabels: (chart: any) => {
            const datasets = chart.data.datasets;
            return chart.data.labels.map((label: string, index: number) => ({
              text: `${label}: ${datasets[0].data[index]}${displayValues.unit}`,
              fillStyle: datasets[0].backgroundColor[index],
              hidden: false,
              index: index,
              pointStyle: 'circle'
            }));
          }
        },
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const label = context.label;
            const value = context.parsed;
            const percentage = displayMode !== 'percentage' 
              ? Math.round((value / displayValues.total) * 100) 
              : value;
            
            return `${label}: ${value}${displayValues.unit} (${percentage}%)`;
          },
        },
      },
    },
  };

  return (
    <div className="flex flex-col p-6 rounded-2xl bg-white border border-gray-200 h-[420px] overflow-hidden text-center">
      <h3 className="text-xl font-semibold text-gray-400 mb-5">
        {title}
      </h3>
      
      <div className="flex flex-col items-center justify-center flex-1 overflow-hidden min-h-0">
        <div className="relative w-full h-full max-w-[280px] max-h-[280px]">
          <Pie data={chartData} options={options} />
          
          {/* Center total display */}
          {showCenter && displayMode !== 'percentage' && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
              <div className={`font-bold text-gray-700 leading-none ${
                size === 'small' ? 'text-base' : size === 'large' ? 'text-2xl' : 'text-xl'
              }`}>
                {displayValues.total}
              </div>
              <div className={`text-gray-500 mt-0.5 ${
                size === 'small' ? 'text-xs' : size === 'large' ? 'text-base' : 'text-sm'
              }`}>
                total {displayValues.unit}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Nutritional insights */}
      <div className={`mt-4 text-gray-500 text-left max-w-[280px] mx-auto ${
        size === 'small' ? 'text-xs' : 'text-sm'
      }`}>
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center">
            <div className="font-bold" style={{ color: colors.protein }}>
              {Math.round((displayValues.protein / displayValues.total) * 100)}%
            </div>
            <div className="text-xs">Protein</div>
          </div>
          <div className="text-center">
            <div className="font-bold" style={{ color: colors.carbs }}>
              {Math.round((displayValues.carbs / displayValues.total) * 100)}%
            </div>
            <div className="text-xs">Carbs</div>
          </div>
          <div className="text-center">
            <div className="font-bold" style={{ color: colors.fat }}>
              {Math.round((displayValues.fat / displayValues.total) * 100)}%
            </div>
            <div className="text-xs">Fat</div>
          </div>
        </div>
      </div>
      
      <div className="flex justify-center mt-4 flex-shrink-0">
        <AnalyzeWithWihyButton
          cardContext={`Macronutrient analysis: ${title} showing ${displayMode} breakdown - Protein: ${Math.round((displayValues.protein / displayValues.total) * 100)}% (${displayValues.protein}${displayMode === 'grams' ? 'g' : displayMode === 'calories' ? ' cal' : '%'}), Carbs: ${Math.round((displayValues.carbs / displayValues.total) * 100)}% (${displayValues.carbs}${displayMode === 'grams' ? 'g' : displayMode === 'calories' ? ' cal' : '%'}), Fat: ${Math.round((displayValues.fat / displayValues.total) * 100)}% (${displayValues.fat}${displayMode === 'grams' ? 'g' : displayMode === 'calories' ? ' cal' : '%'})`}
          userQuery="Analyze this macronutrient breakdown and provide insights about the protein, carbohydrate, and fat distribution"
          onAnalyze={onAnalyze}
        />
      </div>
    </div>
  );
};

export default MacronutrientPieChart;