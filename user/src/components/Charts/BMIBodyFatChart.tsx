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

interface BMIBodyFatChartProps {
  period?: 'day' | 'week' | 'month';
}

const BMIBodyFatChart: React.FC<BMIBodyFatChartProps> = ({ period = 'week' }) => {
  const generateData = () => {
    switch (period) {
      case 'month':
        return {
          labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
          bmiData: [22.8, 22.6, 22.4, 22.2],
          bodyFatData: [19.2, 18.8, 18.5, 18.2],
        };
      default:
        return {
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          bmiData: [22.6, 22.5, 22.4, 22.3, 22.4, 22.3, 22.2],
          bodyFatData: [18.8, 18.6, 18.5, 18.4, 18.5, 18.3, 18.2],
        };
    }
  };

  const { labels, bmiData, bodyFatData } = generateData();

  const data = {
    labels,
    datasets: [
      {
        label: 'BMI',
        data: bmiData,
        borderColor: '#8b5cf6',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        tension: 0.4,
        pointRadius: 5,
        pointHoverRadius: 7,
        yAxisID: 'y',
      },
      {
        label: 'Body Fat %',
        data: bodyFatData,
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        tension: 0.4,
        pointRadius: 5,
        pointHoverRadius: 7,
        yAxisID: 'y1',
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
        borderColor: '#8b5cf6',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: function(context) {
            const suffix = context.datasetIndex === 0 ? '' : '%';
            return `${context.dataset.label}: ${context.parsed.y}${suffix}`;
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
        title: {
          display: true,
          text: 'BMI',
          color: '#8b5cf6',
          font: {
            size: 12,
            weight: 'bold',
          },
        },
        min: 20,
        max: 25,
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
        title: {
          display: true,
          text: 'Body Fat %',
          color: '#f59e0b',
          font: {
            size: 12,
            weight: 'bold',
          },
        },
        min: 15,
        max: 22,
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
    interaction: {
      intersect: false,
      mode: 'index',
    },
  };

  return (
    <div className="chart-container">
      <div className="chart-canvas-wrapper">
        <Line data={data} options={options} />
      </div>
    </div>
  );
};

export default BMIBodyFatChart;