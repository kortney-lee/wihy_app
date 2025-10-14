import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface SleepChartProps {
  period?: 'day' | 'week' | 'month';
  chartType?: 'duration' | 'quality';
}

const SleepChart: React.FC<SleepChartProps> = ({ 
  period = 'week', 
  chartType = 'duration' 
}) => {
  const generateData = () => {
    switch (period) {
      case 'month':
        return {
          labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
          duration: [7.2, 7.5, 7.1, 7.3], // hours
          quality: [82, 85, 78, 84], // percentage
        };
      default: // week
        return {
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          duration: [7.5, 7.2, 6.8, 7.0, 7.3, 8.1, 7.8],
          quality: [85, 82, 75, 78, 83, 90, 88],
        };
    }
  };

  const { labels, duration, quality } = generateData();

  if (chartType === 'quality') {
    // Quality distribution chart
    const qualityData = {
      labels: ['Poor (0-60%)', 'Fair (60-80%)', 'Good (80-90%)', 'Excellent (90%+)'],
      datasets: [
        {
          data: [1, 2, 4, 0], // Number of nights in each category
          backgroundColor: [
            '#ef4444', // Red for poor
            '#f59e0b', // Orange for fair
            '#10b981', // Green for good
            '#3b82f6', // Blue for excellent
          ],
          borderColor: [
            '#dc2626',
            '#d97706',
            '#059669',
            '#2563eb',
          ],
          borderWidth: 2,
        },
      ],
    };

    const qualityOptions: ChartOptions<'bar'> = {
      responsive: true,
      maintainAspectRatio: false,
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
              const nights = context.parsed.y === 1 ? 'night' : 'nights';
              return `${context.parsed.y} ${nights}`;
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
              size: 10,
            },
          },
        },
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Nights',
            color: '#64748b',
            font: {
              size: 12,
              weight: 'bold',
            },
          },
          grid: {
            color: 'rgba(148, 163, 184, 0.1)',
          },
          ticks: {
            color: '#64748b',
            font: {
              size: 11,
            },
            stepSize: 1,
          },
        },
      },
    };

    return (
      <div style={{ height: '200px', width: '100%' }}>
        <Bar data={qualityData} options={qualityOptions} />
      </div>
    );
  }

  // Duration trend chart
  const data = {
    labels,
    datasets: [
      {
        label: 'Sleep Duration (hours)',
        data: duration,
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        tension: 0.4,
        pointRadius: 5,
        pointHoverRadius: 7,
        fill: true,
      },
      {
        label: 'Sleep Quality (%)',
        data: quality,
        borderColor: '#8b5cf6',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        tension: 0.4,
        pointRadius: 5,
        pointHoverRadius: 7,
        yAxisID: 'y1',
      },
      {
        label: 'Target (7.5h)',
        data: Array(labels.length).fill(7.5),
        borderColor: '#10b981',
        backgroundColor: 'transparent',
        borderDash: [5, 5],
        pointRadius: 0,
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
        borderColor: '#6366f1',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: function(context) {
            if (context.datasetIndex === 0) {
              return `${context.dataset.label}: ${context.parsed.y}h`;
            } else if (context.datasetIndex === 1) {
              return `${context.dataset.label}: ${context.parsed.y}%`;
            }
            return `${context.dataset.label}: ${context.parsed.y}h`;
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
          text: 'Hours',
          color: '#6366f1',
          font: {
            size: 12,
            weight: 'bold',
          },
        },
        min: 6,
        max: 9,
        grid: {
          color: 'rgba(148, 163, 184, 0.1)',
        },
        ticks: {
          color: '#6366f1',
          font: {
            size: 11,
          },
          callback: function(value) {
            return `${value}h`;
          }
        },
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: 'Quality %',
          color: '#8b5cf6',
          font: {
            size: 12,
            weight: 'bold',
          },
        },
        min: 70,
        max: 95,
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          color: '#8b5cf6',
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
    <div style={{ height: '220px', width: '100%' }}>
      <Line data={data} options={options} />
    </div>
  );
};

export default SleepChart;