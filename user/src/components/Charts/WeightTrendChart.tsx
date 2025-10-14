import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface WeightTrendChartProps {
  period?: 'day' | 'week' | 'month';
}

const WeightTrendChart: React.FC<WeightTrendChartProps> = ({ period = 'week' }) => {
  // Sample data - replace with real data from your API
  const generateData = () => {
    switch (period) {
      case 'day':
        return {
          labels: ['6am', '8am', '10am', '12pm', '2pm', '4pm', '6pm', '8pm'],
          datasets: [{
            label: 'Weight (kg)',
            data: [68.5, 68.3, 68.4, 68.6, 68.5, 68.3, 68.2, 68.1],
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.4,
            pointRadius: 4,
            pointHoverRadius: 6,
          }, {
            label: 'Goal (65 kg)',
            data: Array(8).fill(65),
            borderColor: '#10b981',
            backgroundColor: 'transparent',
            borderDash: [5, 5],
            pointRadius: 0,
          }]
        };
      case 'month':
        return {
          labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
          datasets: [{
            label: 'Weight (kg)',
            data: [69.2, 68.8, 68.5, 68.2],
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.4,
            pointRadius: 6,
            pointHoverRadius: 8,
          }, {
            label: 'Goal (65 kg)',
            data: Array(4).fill(65),
            borderColor: '#10b981',
            backgroundColor: 'transparent',
            borderDash: [5, 5],
            pointRadius: 0,
          }]
        };
      default: // week
        return {
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          datasets: [{
            label: 'Weight (kg)',
            data: [68.8, 68.6, 68.5, 68.4, 68.5, 68.3, 68.2],
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.4,
            pointRadius: 5,
            pointHoverRadius: 7,
            fill: true,
          }, {
            label: 'Goal (65 kg)',
            data: Array(7).fill(65),
            borderColor: '#10b981',
            backgroundColor: 'transparent',
            borderDash: [5, 5],
            pointRadius: 0,
          }]
        };
    }
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
        displayColors: true,
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${context.parsed.y} kg`;
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
        beginAtZero: false,
        min: 64,
        max: 70,
        grid: {
          color: 'rgba(148, 163, 184, 0.1)',
        },
        ticks: {
          color: '#64748b',
          font: {
            size: 11,
          },
          callback: function(value) {
            return `${value} kg`;
          }
        },
      },
    },
    interaction: {
      intersect: false,
      mode: 'index',
    },
  };

  const data = generateData();

  return (
    <div className="chart-container">
      <div className="chart-canvas-wrapper">
        <Line data={data} options={options} />
      </div>
    </div>
  );
};

export default WeightTrendChart;