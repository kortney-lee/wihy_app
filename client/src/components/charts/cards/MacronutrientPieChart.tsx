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
  
  // Chart dimensions based on size
  const dimensions = {
    small: { width: 200, height: 200 },
    medium: { width: 300, height: 300 },
    large: { width: 400, height: 400 }
  };

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
    <div style={{
      display: "flex",
      flexDirection: "column",
      padding: 24,
      borderRadius: 16,
      background: "white",
      border: "1px solid #e5e7eb",
      boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
      height: window.innerWidth <= 768 ? 550 : 400,
      overflow: "hidden",
      textAlign: 'center'
    }}>
      <h3 style={{ 
        fontSize: 24,
        fontWeight: 600,
        color: "#9CA3AF",
        margin: 0,
        marginBottom: 20
      }}>
        {title}
      </h3>
      
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, overflow: "hidden", minHeight: 0 }}>
        <div style={{ 
          position: 'relative',
          width: '100%',
          height: '100%',
          maxWidth: '280px',
          maxHeight: '280px'
        }}>
          <Pie data={chartData} options={options} />
          
          {/* Center total display */}
          {showCenter && displayMode !== 'percentage' && (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              pointerEvents: 'none'
            }}>
              <div style={{
                fontSize: size === 'small' ? '16px' : size === 'large' ? '24px' : '20px',
                fontWeight: 'bold',
                color: '#374151',
                lineHeight: '1'
              }}>
                {displayValues.total}
            </div>
            <div style={{
              fontSize: size === 'small' ? '12px' : size === 'large' ? '16px' : '14px',
              color: '#6B7280',
              marginTop: '2px'
            }}>
              total {displayValues.unit}
            </div>
          </div>
        )}
        </div>
      </div>

      {/* Nutritional insights */}
      <div style={{ 
        marginTop: '15px',
        fontSize: size === 'small' ? '12px' : '14px',
        color: '#6B7280',
        textAlign: 'left',
        maxWidth: '280px',
        margin: '15px auto 0'
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: colors.protein, fontWeight: 'bold' }}>
              {Math.round((displayValues.protein / displayValues.total) * 100)}%
            </div>
            <div style={{ fontSize: '11px' }}>Protein</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: colors.carbs, fontWeight: 'bold' }}>
              {Math.round((displayValues.carbs / displayValues.total) * 100)}%
            </div>
            <div style={{ fontSize: '11px' }}>Carbs</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: colors.fat, fontWeight: 'bold' }}>
              {Math.round((displayValues.fat / displayValues.total) * 100)}%
            </div>
            <div style={{ fontSize: '11px' }}>Fat</div>
          </div>
        </div>
      </div>
      
      <div style={{ display: "flex", justifyContent: "center", marginTop: 16, flexShrink: 0 }}>
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