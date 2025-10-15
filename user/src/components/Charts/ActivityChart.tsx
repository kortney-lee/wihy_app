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

interface ActivityChartProps {
  period?: 'day' | 'week' | 'month';
  chartType?: 'steps' | 'distance' | 'activity-types' | 'hydration';
}

const ActivityChart: React.FC<ActivityChartProps> = ({ 
  period = 'week', 
  chartType = 'steps' 
}) => {
  const generateData = () => {
    switch (period) {
      case 'day':
        return {
          labels: ['6am', '9am', '12pm', '3pm', '6pm', '9pm'],
          steps: [500, 2100, 4200, 6800, 8200, 8742],
          distance: [0.4, 1.6, 3.2, 5.1, 6.2, 6.8],
          hydration: [0.2, 0.6, 1.2, 1.8, 2.2, 2.5],
        };
      case 'month':
        return {
          labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
          steps: [9200, 8800, 9500, 8742],
          distance: [7.1, 6.8, 7.3, 6.8],
          hydration: [2.3, 2.1, 2.4, 2.5],
        };
      default: // week
        return {
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          steps: [9200, 8500, 10200, 7800, 9500, 11200, 8742],
          distance: [7.1, 6.6, 7.8, 6.0, 7.3, 8.6, 6.8],
          hydration: [2.3, 2.1, 2.6, 1.9, 2.4, 2.8, 2.5],
        };
    }
  };

  const { labels, steps, distance, hydration } = generateData();

  // Activity Types Donut Chart
  if (chartType === 'activity-types') {
    const activityData = {
      labels: ['Walking', 'Running', 'Cycling', 'Gym', 'Other'],
      datasets: [
        {
          data: [45, 20, 15, 15, 5], // Percentage of total activity
          backgroundColor: [
            '#3b82f6', // Blue for walking
            '#10b981', // Green for running
            '#f59e0b', // Orange for cycling
            '#8b5cf6', // Purple for gym
            '#6b7280', // Gray for other
          ],
          borderColor: [
            '#2563eb',
            '#059669',
            '#d97706',
            '#7c3aed',
            '#4b5563',
          ],
          borderWidth: 2,
        },
      ],
    };

    const activityOptions: ChartOptions<'doughnut'> = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right' as const,
          labels: {
            padding: 15,
            usePointStyle: true,
            pointStyle: 'circle',
            font: {
              size: 12,
            },
          },
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: '#fff',
          bodyColor: '#fff',
          borderWidth: 1,
          cornerRadius: 8,
          callbacks: {
            label: function(context) {
              return `${context.label}: ${context.parsed}%`;
            }
          }
        },
      },
      cutout: '50%',
    };

    return (
      <div style={{ height: '200px', width: '100%' }}>
        <Doughnut data={activityData} options={activityOptions} />
      </div>
    );
  }

  // Hydration Chart
  if (chartType === 'hydration') {
    const hydrationData = {
      labels,
      datasets: [
        {
          label: 'Hydration (L)',
          data: hydration,
          backgroundColor: '#06b6d4',
          borderColor: '#0891b2',
          borderWidth: 2,
          borderRadius: 4,
        }
      ],
    };

    const hydrationOptions: ChartOptions<'bar'> = {
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
          borderWidth: 1,
          cornerRadius: 8,
          callbacks: {
            label: function(context) {
              return `${context.dataset.label}: ${context.parsed.y}L`;
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
          beginAtZero: true,
          max: 3,
          title: {
            display: true,
            text: 'Liters',
            color: '#06b6d4',
            font: {
              size: 12,
              weight: 'bold',
            },
          },
          grid: {
            color: 'rgba(148, 163, 184, 0.1)',
          },
          ticks: {
            color: '#06b6d4',
            font: {
              size: 11,
            },
            callback: function(value) {
              return `${value}L`;
            }
          },
        },
      },
    };

    return (
      <div style={{ height: '200px', width: '100%' }}>
        <Bar data={hydrationData} options={hydrationOptions} />
      </div>
    );
  }

  // Steps and Distance Charts
  if (chartType === 'distance') {
    const data = {
      labels,
      datasets: [
        {
          label: 'Distance (km)',
          data: distance,
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
          display: false,
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: '#fff',
          bodyColor: '#fff',
          borderColor: '#8b5cf6',
          borderWidth: 1,
          cornerRadius: 8,
          callbacks: {
            label: function(context) {
              return `Distance: ${context.parsed.y} km`;
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
          beginAtZero: true,
          title: {
            display: true,
            text: 'Kilometers',
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
            callback: function(value) {
              return `${value} km`;
            }
          },
        },
      },
    };

    return (
      <div style={{ height: '200px', width: '100%' }}>
        <Line data={data} options={options} />
      </div>
    );
  }

  // Default: Steps Chart
  const data = {
    labels,
    datasets: [
      {
        label: 'Steps',
        data: steps,
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
        pointRadius: 5,
        pointHoverRadius: 7,
        fill: true,
      },
      {
        label: 'Goal (10,000)',
        data: Array(labels.length).fill(10000),
        borderColor: '#f59e0b',
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
        borderColor: '#10b981',
        borderWidth: 1,
        cornerRadius: 8,
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${context.parsed.y?.toLocaleString() || '0'}`;
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
        beginAtZero: true,
        title: {
          display: true,
          text: 'Steps',
          color: '#10b981',
          font: {
            size: 12,
            weight: 'bold',
          },
        },
        grid: {
          color: 'rgba(148, 163, 184, 0.1)',
        },
        ticks: {
          color: '#10b981',
          font: {
            size: 11,
          },
          callback: function(value) {
            return value.toLocaleString();
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
    <div style={{ height: '200px', width: '100%' }}>
      <Line data={data} options={options} />
    </div>
  );
};

export default ActivityChart;