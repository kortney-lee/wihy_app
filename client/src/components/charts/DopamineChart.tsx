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

interface DopamineChartProps {
  period?: 'day' | 'week' | 'month';
  chartType?: 'levels' | 'triggers' | 'activities';
}

const DopamineChart: React.FC<DopamineChartProps> = ({ 
  period = 'week', 
  chartType = 'levels' 
}) => {
  const generateData = () => {
    switch (period) {
      case 'day':
        return {
          labels: ['6am', '9am', '12pm', '3pm', '6pm', '9pm'],
          dopamineLevels: [3.2, 5.8, 7.2, 6.1, 8.4, 4.6], // 1-10 scale
          triggers: ['Exercise', 'Social', 'Work', 'Music', 'Food', 'Rest'],
          activities: [45, 30, 120, 25, 15, 90], // minutes spent
        };
      case 'month':
        return {
          labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
          dopamineLevels: [6.2, 6.8, 5.9, 7.1],
          triggers: ['Exercise', 'Social', 'Achievement', 'Recreation'],
          activities: [180, 210, 165, 195], // average minutes per week
        };
      default: // week
        return {
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          dopamineLevels: [5.5, 6.2, 5.8, 7.1, 6.9, 8.2, 6.4],
          triggers: ['Exercise', 'Social', 'Work', 'Music', 'Recreation', 'Achievement', 'Rest'],
          activities: [45, 60, 30, 75, 90, 120, 40], // minutes per day
        };
    }
  };

  const { labels, dopamineLevels, triggers, activities } = generateData();

  // Dopamine Triggers Distribution
  if (chartType === 'triggers') {
    const triggersData = {
      labels: triggers,
      datasets: [
        {
          label: 'Trigger Frequency',
          data: [8, 6, 9, 5, 7, 4, 3], // frequency per week
          backgroundColor: [
            '#10b981', // Exercise - Green
            '#3b82f6', // Social - Blue  
            '#f59e0b', // Work - Orange
            '#8b5cf6', // Music - Purple
            '#ef4444', // Recreation - Red
            '#06b6d4', // Achievement - Cyan
            '#6b7280', // Rest - Gray
          ],
          borderColor: [
            '#059669',
            '#2563eb',
            '#d97706',
            '#7c3aed',
            '#dc2626',
            '#0891b2',
            '#4b5563',
          ],
          borderWidth: 2,
          borderRadius: 4,
        },
      ],
    };

    const triggersOptions: ChartOptions<'bar'> = {
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
              return `${context.label}: ${context.parsed.y} times this week`;
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
            maxRotation: 45,
          },
        },
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Frequency',
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
          },
        },
      },
    };

    return (
      <div style={{ height: '220px', width: '100%' }}>
        <Bar data={triggersData} options={triggersOptions} />
      </div>
    );
  }

  // Activity Time Distribution
  if (chartType === 'activities') {
    const activitiesData = {
      labels: triggers,
      datasets: [
        {
          label: 'Time Spent (minutes)',
          data: activities,
          backgroundColor: 'rgba(139, 92, 246, 0.6)',
          borderColor: '#8b5cf6',
          borderWidth: 2,
          borderRadius: 4,
        },
      ],
    };

    const activitiesOptions: ChartOptions<'bar'> = {
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
              return `${context.label}: ${context.parsed.y} minutes`;
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
            maxRotation: 45,
          },
        },
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Minutes',
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
      },
    };

    return (
      <div style={{ height: '220px', width: '100%' }}>
        <Bar data={activitiesData} options={activitiesOptions} />
      </div>
    );
  }

  // Default: Dopamine Levels Over Time
  const data = {
    labels,
    datasets: [
      {
        label: 'Dopamine Level',
        data: dopamineLevels,
        borderColor: '#8b5cf6',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        tension: 0.4,
        pointRadius: 6,
        pointHoverRadius: 8,
        fill: true,
        pointBackgroundColor: '#8b5cf6',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
      },
      {
        label: 'Optimal Range (6-8)',
        data: Array(labels.length).fill(7),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderDash: [5, 5],
        pointRadius: 0,
        fill: false,
      },
      {
        label: 'Low Threshold (4)',
        data: Array(labels.length).fill(4),
        borderColor: '#ef4444',
        backgroundColor: 'transparent',
        borderDash: [3, 3],
        pointRadius: 0,
        fill: false,
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
        borderColor: '#8b5cf6',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: function(context) {
            if (context.datasetIndex === 0) {
              return `${context.dataset.label}: ${context.parsed.y}/10`;
            }
            return `${context.dataset.label}: ${context.parsed.y}`;
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
        min: 0,
        max: 10,
        title: {
          display: true,
          text: 'Dopamine Level (1-10)',
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
          stepSize: 1,
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

export default DopamineChart;