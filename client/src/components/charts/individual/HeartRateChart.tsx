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

function CardShell({
  title = "",
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col p-6 rounded-2xl bg-white border border-gray-200 shadow-md h-[420px] overflow-hidden">
      <h3 className="text-xl font-semibold text-gray-400 m-0 mb-3">{title}</h3>
      <div className="flex flex-col flex-1 overflow-hidden min-h-0">{children}</div>
    </section>
  );
}


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

interface HeartRateChartProps {
  period?: 'day' | 'week' | 'month';
  onAnalyze?: (userMessage: string, assistantMessage: string) => void;
}

const HeartRateChart: React.FC<HeartRateChartProps> = ({
  period = 'week',
  onAnalyze
}) => {
  // Generate heart rate data based on period
  const generateData = () => {
    switch (period) {
      case 'day':
        return {
          labels: ['6am', '9am', '12pm', '3pm', '6pm', '9pm', '12am'],
          resting: [65, 68, 70, 72, 75, 70, 65],
          active: [75, 85, 95, 110, 125, 90, 75],
          max: [145, 155, 165, 175, 185, 150, 140]
        };
      case 'month':
        return {
          labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
          resting: [68, 66, 64, 63],
          active: [95, 92, 88, 85],
          max: [165, 162, 158, 155]
        };
      default: // week
        return {
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          resting: [65, 67, 64, 66, 68, 70, 63],
          active: [85, 90, 95, 88, 100, 110, 80],
          max: [155, 160, 165, 158, 170, 175, 150]
        };
    }
  };

  const { labels, resting, active, max } = generateData();

  // Chart.js data structure
  const data = {
    labels,
    datasets: [
      {
        label: 'Resting HR',
        data: resting,
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
        pointRadius: 6,
        pointHoverRadius: 8,
        fill: false,
        pointBackgroundColor: '#10b981',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
      },
      {
        label: 'Active HR',
        data: active,
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        tension: 0.4,
        pointRadius: 6,
        pointHoverRadius: 8,
        fill: false,
        pointBackgroundColor: '#f59e0b',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
      },
      {
        label: 'Max HR',
        data: max,
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.4,
        pointRadius: 6,
        pointHoverRadius: 8,
        fill: false,
        pointBackgroundColor: '#ef4444',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
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
        borderColor: '#ef4444',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${context.parsed.y} bpm`;
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
          text: 'Heart Rate (BPM)',
          color: '#ef4444',
          font: {
            size: 12,
            weight: 'bold',
          },
        },
        grid: {
          color: 'rgba(148, 163, 184, 0.1)',
        },
        ticks: {
          color: '#ef4444',
          font: {
            size: 11,
          },
        },
      },
    },
    interaction: {
      intersect: false,
      mode: 'index',
    },
  };

  return (
    <CardShell title="Heart Rate Trends">
      <div className="flex-1 flex flex-col justify-center min-h-0 mb-3">
        <Line data={data} options={options} />
      </div>
      
      <div className="flex justify-center mt-auto flex-shrink-0">
        <AnalyzeWithWihyButton
          cardContext={`Heart Rate Chart: Showing heart rate trends over ${period} period. Tracks resting, active, and maximum heart rate patterns for cardiovascular health monitoring and fitness optimization.`}
          userQuery="Analyze my heart rate patterns and provide insights about my cardiovascular health, fitness level, and training recommendations"
          onAnalyze={onAnalyze}
        />
      </div>
    </CardShell>
  );
};

export default HeartRateChart;