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
import { Line, Bar, Doughnut } from 'react-chartjs-2';
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

interface BloodPressureChartProps {
  period?: 'day' | 'week' | 'month';
  onAnalyze?: (userMessage: string, assistantMessage: string) => void;
}

const BloodPressureChart: React.FC<BloodPressureChartProps> = ({ 
  period = 'week',
  onAnalyze
}) => {
  // Blood pressure data generation based on period
  const generateData = () => {
    switch (period) {
      case 'day':
        return {
          labels: ['6am', '9am', '12pm', '3pm', '6pm', '9pm', '12am'],
          systolic: [118, 122, 125, 128, 130, 124, 115],
          diastolic: [75, 78, 80, 82, 85, 79, 72],
        };
      case 'month':
        return {
          labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
          systolic: [125, 122, 120, 118],
          diastolic: [80, 78, 76, 74],
        };
      default: // week
        return {
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          systolic: [120, 118, 125, 122, 128, 115, 119],
          diastolic: [75, 74, 80, 78, 82, 72, 76],
        };
    }
  };

  const { labels, systolic, diastolic } = generateData();

  // Blood Pressure Chart
  const data = {
    labels,
    datasets: [
      {
        label: 'Systolic',
        data: systolic,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        pointRadius: 5,
        pointHoverRadius: 7,
        fill: true,
      },
      {
        label: 'Diastolic',
        data: diastolic,
        borderColor: '#8b5cf6',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        tension: 0.4,
        pointRadius: 5,
        pointHoverRadius: 7,
        fill: true,
      }
    ],
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        align: 'end' as const,
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 20,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#3b82f6',
        borderWidth: 1,
        cornerRadius: 8,
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${context.parsed.y} mmHg`; 
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
        min: 50,
        max: 200,
        title: {
          display: true,
          text: 'mmHg',
          color: '#3b82f6',
          font: {
            size: 12,
            weight: 'bold',
          },
        },
        grid: {
          color: 'rgba(148, 163, 184, 0.1)',
        },
        ticks: {
          color: '#3b82f6',
          font: {
            size: 11,
          },
          callback: function(value) {
            return `${value} mmHg`;
          }
        },
      },
    },
    interaction: {
      intersect: false,
      mode: 'index',
    },
  };

  // Internal CardShell component
  const CardShell = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <section className="flex flex-col p-5 rounded-2xl bg-white border border-gray-200 shadow-md col-span-full h-auto min-h-[280px] max-h-[350px] w-full overflow-hidden">
      <h3 className="text-lg font-semibold text-gray-700 m-0 mb-5 text-left">{title}</h3>
      <div className="flex-1 flex flex-col justify-center min-h-[180px] max-h-[220px] mb-3">{children}</div>
    </section>
  );

  return (
    <CardShell title="Blood Pressure Trends">
      {/* Blood Pressure Chart Display */}
      <div className="h-[240px] w-full">
        <Line data={data} options={options} />
      </div>
      
      <div className="flex justify-center mt-4 flex-shrink-0">
        <AnalyzeWithWihyButton
          cardContext={`Blood Pressure Chart: Showing systolic and diastolic blood pressure trends over ${period} period. Tracks cardiovascular health indicators for hypertension monitoring and heart health assessment.`}
          userQuery="Analyze my blood pressure patterns and provide insights about my cardiovascular health, risk factors, and lifestyle recommendations"
          onAnalyze={onAnalyze}
        />
      </div>
    </CardShell>
  );
};

export default BloodPressureChart;