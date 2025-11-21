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
import { Line } from 'react-chartjs-2';
import AnalyzeWithWihyButton from '../shared/AnalyzeWithWihyButton';

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

interface BMIBodyFatChartProps {
  period?: 'day' | 'week' | 'month';
  onAnalyze?: (userMessage: string, assistantMessage: string) => void;
}

const BMIBodyFatChart: React.FC<BMIBodyFatChartProps> = ({ period = 'week', onAnalyze }) => {
  // Generate BMI and Body Fat data based on period
  const generateData = () => {
    switch (period) {
      case 'month':
        return {
          labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
          bmi: [22.8, 22.6, 22.4, 22.2],
          bodyFat: [19.2, 18.8, 18.5, 18.2]
        };
      default:
        return {
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          bmi: [22.6, 22.5, 22.4, 22.3, 22.4, 22.3, 22.2],
          bodyFat: [18.8, 18.6, 18.5, 18.4, 18.5, 18.3, 18.2]
        };
    }
  };

  const { labels, bmi, bodyFat } = generateData();

  // Chart.js data structure
  const data = {
    labels,
    datasets: [
      {
        label: 'BMI',
        data: bmi,
        borderColor: '#8b5cf6',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        tension: 0.4,
        pointRadius: 6,
        pointHoverRadius: 8,
        fill: false,
        pointBackgroundColor: '#8b5cf6',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        yAxisID: 'y',
      },
      {
        label: 'Body Fat %',
        data: bodyFat,
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        tension: 0.4,
        pointRadius: 6,
        pointHoverRadius: 8,
        fill: false,
        pointBackgroundColor: '#f59e0b',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        yAxisID: 'y1',
      }
    ],
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
        align: 'end' as const,
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 15,
          font: {
            size: 11,
          },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#8b5cf6',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: function(context) {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            return label === 'Body Fat %' ? `${label}: ${value}%` : `${label}: ${value}`;
          }
        }
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#64748b',
          font: {
            size: 11,
          },
        },
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        min: 20,
        max: 25,
        title: {
          display: true,
          text: 'BMI',
          color: '#8b5cf6',
          font: {
            size: 12,
            weight: 'bold',
          },
        },
        grid: {
          color: 'rgba(148, 163, 184, 0.1)',
        },
        ticks: {
          color: '#8b5cf6',
          font: {
            size: 11,
          },
        },
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        min: 15,
        max: 22,
        title: {
          display: true,
          text: 'Body Fat %',
          color: '#f59e0b',
          font: {
            size: 12,
            weight: 'bold',
          },
        },
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          color: '#f59e0b',
          font: {
            size: 11,
          },
          callback: function(value) {
            return `${value}%`;
          }
        },
      },
    },
  };

  return (
    <div className="flex flex-col p-5 rounded-2xl bg-white border border-gray-200 shadow-md col-span-full h-auto min-h-[280px] max-h-[350px] w-full overflow-hidden">
      <h3 className="text-lg font-semibold text-gray-700 m-0 mb-5 text-left">BMI & Body Fat Trends</h3>
      
      <div className="flex-1 flex flex-col justify-center min-h-[180px] max-h-[220px] mb-3">
        <Line data={data} options={options} />
      </div>
      
      <div className="flex justify-center mt-4 flex-shrink-0">
        <AnalyzeWithWihyButton
          cardContext={`BMI and Body Fat Chart: Tracking data over ${period} period. Shows trends in BMI and body fat percentage for body composition analysis and health monitoring.`}
          userQuery="Analyze my BMI and body fat trends, explain what these measurements mean for my health and body composition goals"
          onAnalyze={onAnalyze}
        />
      </div>
    </div>
  );
};

export default BMIBodyFatChart;