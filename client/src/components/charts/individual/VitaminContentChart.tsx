import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import AnalyzeWithWihyButton from '../shared/AnalyzeWithWihyButton';

// Self-contained styling for VitaminContentChart
const vitaminContentChartStyles = {
  container: (height: number = 400) => ({
    display: "flex" as const,
    flexDirection: "column" as const,
    padding: 24,
    borderRadius: 16,
    background: "white",
    border: "1px solid #e5e7eb",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
    height,
    overflow: "hidden" as const,
  }),
  title: {
    fontSize: 24,
    fontWeight: 600,
    color: "#9CA3AF",
    margin: 0,
    marginBottom: 20,
    textAlign: "center" as const,
  },
  chartContainer: {
    flex: 1,
    display: "flex",
    flexDirection: "column" as const,
    justifyContent: "center",
    minHeight: 200,
    marginBottom: 16,
  },
  footerRow: {
    display: "flex",
    justifyContent: "center",
    marginTop: 16,
    flexShrink: 0,
  }
};

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export interface VitaminData {
  name: string;
  current: number; // mg, mcg, or IU
  dailyValue: number; // recommended daily value
  percentage: number; // % of daily value
  unit: string; // mg, mcg, IU
}

interface VitaminContentChartProps {
  vitamins?: VitaminData[];
  size?: 'small' | 'medium' | 'large';
  showLabels?: boolean;
  title?: string;
  highlightDeficiency?: boolean;
  height?: number;
}

const VitaminContentChart: React.FC<VitaminContentChartProps> = ({
  vitamins = [],
  size = 'medium',
  showLabels = true,
  title = 'Vitamin & Mineral Content',
  highlightDeficiency = true,
  height = 400
}) => {
  // Default sample data
  const defaultVitamins: VitaminData[] = [
    { name: 'Vitamin A', current: 900, dailyValue: 900, percentage: 100, unit: 'mcg' },
    { name: 'Vitamin C', current: 45, dailyValue: 90, percentage: 50, unit: 'mg' },
    { name: 'Vitamin D', current: 10, dailyValue: 20, percentage: 50, unit: 'mcg' },
    { name: 'Vitamin E', current: 8, dailyValue: 15, percentage: 53, unit: 'mg' },
    { name: 'Vitamin K', current: 60, dailyValue: 120, percentage: 50, unit: 'mcg' },
    { name: 'B12', current: 1.2, dailyValue: 2.4, percentage: 50, unit: 'mcg' },
    { name: 'Folate', current: 200, dailyValue: 400, percentage: 50, unit: 'mcg' },
    { name: 'Iron', current: 9, dailyValue: 18, percentage: 50, unit: 'mg' },
    { name: 'Calcium', current: 500, dailyValue: 1000, percentage: 50, unit: 'mg' },
    { name: 'Zinc', current: 5.5, dailyValue: 11, percentage: 50, unit: 'mg' }
  ];

  const vitaminData = vitamins.length > 0 ? vitamins : defaultVitamins;

  // Create color mapping based on percentage thresholds
  const getBarColor = (percentage: number) => {
    if (percentage >= 100) return '#10b981'; // Green - Complete
    if (percentage >= 75) return '#3b82f6'; // Blue - Good
    if (percentage >= 50) return '#f59e0b'; // Orange - Moderate
    if (percentage >= 25) return '#ef4444'; // Red - Low
    return '#7f1d1d'; // Dark red - Very low
  };

  // Chart.js data structure
  const data = {
    labels: vitaminData.map(v => v.name),
    datasets: [
      {
        label: '% of Daily Value',
        data: vitaminData.map(v => v.percentage),
        backgroundColor: vitaminData.map(v => getBarColor(v.percentage)),
        borderColor: vitaminData.map(v => getBarColor(v.percentage)),
        borderWidth: 2,
        borderRadius: 4,
      }
    ],
  };

  const maxValue = Math.max(110, Math.max(...vitaminData.map(v => v.percentage)) + 10);

  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y' as const,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderWidth: 1,
        cornerRadius: 8,
        callbacks: {
          label: function(context) {
            const index = context.dataIndex;
            const vitamin = vitaminData[index];
            return [
              `${vitamin.percentage}% of Daily Value`,
              `Current: ${vitamin.current}${vitamin.unit}`,
              `Recommended: ${vitamin.dailyValue}${vitamin.unit}`
            ];
          }
        }
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        max: maxValue,
        title: {
          display: true,
          text: 'Percentage of Daily Value (%)',
          color: '#6b7280',
          font: {
            size: 12,
            weight: 'bold',
          },
        },
        grid: {
          color: 'rgba(148, 163, 184, 0.1)',
        },
        ticks: {
          color: '#6b7280',
          font: {
            size: size === 'small' ? 10 : 12,
          },
          callback: function(value) {
            return `${value}%`;
          }
        },
      },
      y: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#374151',
          font: {
            size: size === 'small' ? 10 : 12,
          },
        },
      },
    },
  };

  return (
    <div style={vitaminContentChartStyles.container(height)}>
      {showLabels && (
        <h3 style={vitaminContentChartStyles.title}>{title}</h3>
      )}
      
      <div style={vitaminContentChartStyles.chartContainer}>
        <Bar data={data} options={options} />
      </div>
      
      {/* Deficiency warnings */}
      {highlightDeficiency && (
        <div style={{ 
          marginTop: 8, 
          fontSize: size === 'small' ? 10 : 12,
          color: '#6b7280'
        }}>
          {vitaminData.filter(v => v.percentage < 50).length > 0 && (
            <div style={{ color: '#ef4444', fontWeight: 500 }}>
              ⚠️ {vitaminData.filter(v => v.percentage < 50).length} nutrients below 50% DV
            </div>
          )}
          {vitaminData.filter(v => v.percentage >= 100).length > 0 && (
            <div style={{ color: '#10b981', fontWeight: 500 }}>
              ✅ {vitaminData.filter(v => v.percentage >= 100).length} nutrients meeting DV
            </div>
          )}
        </div>
      )}
      
      <div style={vitaminContentChartStyles.footerRow}>
        <AnalyzeWithWihyButton
          cardContext={`Vitamin Content Analysis: ${title} showing ${vitaminData.length} vitamins tracked. Deficient vitamins: ${vitaminData.filter(v => v.percentage < 100).length}. Adequate vitamins: ${vitaminData.filter(v => v.percentage >= 100).length}. Vitamin details: ${vitaminData.map(v => `${v.name}: ${v.current}${v.unit} (${v.percentage}% DV)`).join(', ')}.`}
          userQuery="Analyze my vitamin intake and identify any deficiencies or areas where I can improve my micronutrient consumption"
        />
      </div>
    </div>
  );
};

export default VitaminContentChart;