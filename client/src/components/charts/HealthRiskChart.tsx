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
import { Bar, Doughnut, Line } from 'react-chartjs-2';

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

interface HealthRiskChartProps {
  period?: 'day' | 'week' | 'month';
  chartType?: 'risk-factors' | 'risk-score' | 'prevention' | 'categories';
}

const HealthRiskChart: React.FC<HealthRiskChartProps> = ({ 
  period = 'week', 
  chartType = 'risk-factors' 
}) => {
  const generateData = () => {
    switch (period) {
      case 'month':
        return {
          labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
          riskScores: [7.2, 6.8, 6.5, 6.1], // Overall risk score (1-10, lower is better)
          riskFactors: ['Diet', 'Exercise', 'Sleep', 'Stress', 'Smoking', 'Alcohol'],
          riskLevels: [6, 4, 5, 7, 0, 3], // Individual risk levels
          preventionActions: [8, 9, 7, 6], // Prevention actions taken per week
        };
      default: // week
        return {
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          riskScores: [7.1, 6.8, 6.9, 6.5, 6.2, 6.8, 6.4],
          riskFactors: ['Diet', 'Exercise', 'Sleep', 'Stress', 'Smoking', 'Alcohol'],
          riskLevels: [6, 4, 5, 7, 0, 3],
          preventionActions: [2, 1, 2, 1, 3, 2, 1], // Actions per day
        };
    }
  };

  const { labels, riskScores, riskFactors, riskLevels, preventionActions } = generateData();

  // Risk Categories Distribution
  if (chartType === 'categories') {
    const categoriesData = {
      labels: ['Low Risk', 'Moderate Risk', 'High Risk', 'Critical Risk'],
      datasets: [
        {
          data: [45, 35, 15, 5], // Percentage distribution
          backgroundColor: [
            '#10b981', // Low - Green
            '#f59e0b', // Moderate - Orange
            '#ef4444', // High - Red
            '#7c2d12', // Critical - Dark Red
          ],
          borderColor: [
            '#059669',
            '#d97706',
            '#dc2626',
            '#581c0c',
          ],
          borderWidth: 2,
        },
      ],
    };

    const categoriesOptions: ChartOptions<'doughnut'> = {
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
      <div style={{ height: '220px', width: '100%' }}>
        <Doughnut data={categoriesData} options={categoriesOptions} />
      </div>
    );
  }

  // Prevention Actions
  if (chartType === 'prevention') {
    const preventionData = {
      labels,
      datasets: [
        {
          label: 'Prevention Actions',
          data: preventionActions,
          backgroundColor: '#10b981',
          borderColor: '#059669',
          borderWidth: 2,
          borderRadius: 4,
        },
        {
          label: 'Target (2 per day)',
          data: Array(labels.length).fill(period === 'month' ? 14 : 2),
          backgroundColor: 'rgba(59, 130, 246, 0.3)',
          borderColor: '#3b82f6',
          borderWidth: 1,
          borderDash: [5, 5],
        }
      ],
    };

    const preventionOptions: ChartOptions<'bar'> = {
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
          borderColor: '#10b981',
          borderWidth: 1,
          cornerRadius: 8,
          callbacks: {
            label: function(context) {
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
          beginAtZero: true,
          title: {
            display: true,
            text: 'Actions Taken',
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
          },
        },
      },
    };

    return (
      <div style={{ height: '220px', width: '100%' }}>
        <Bar data={preventionData} options={preventionOptions} />
      </div>
    );
  }

  // Risk Factors Analysis
  if (chartType === 'risk-factors') {
    const riskFactorsData = {
      labels: riskFactors,
      datasets: [
        {
          label: 'Risk Level (1-10)',
          data: riskLevels,
          backgroundColor: riskLevels.map(level => {
            if (level <= 3) return '#10b981'; // Low risk - Green
            if (level <= 6) return '#f59e0b'; // Moderate risk - Orange
            if (level <= 8) return '#ef4444'; // High risk - Red
            return '#7c2d12'; // Critical risk - Dark Red
          }),
          borderColor: riskLevels.map(level => {
            if (level <= 3) return '#059669';
            if (level <= 6) return '#d97706';
            if (level <= 8) return '#dc2626';
            return '#581c0c';
          }),
          borderWidth: 2,
          borderRadius: 4,
        },
      ],
    };

    const riskFactorsOptions: ChartOptions<'bar'> = {
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
              const level = context.parsed.y;
              let riskCategory = '';
              if (level <= 3) riskCategory = 'Low Risk';
              else if (level <= 6) riskCategory = 'Moderate Risk';
              else if (level <= 8) riskCategory = 'High Risk';
              else riskCategory = 'Critical Risk';
              
              return `${context.label}: ${level}/10 (${riskCategory})`;
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
          max: 10,
          title: {
            display: true,
            text: 'Risk Level (1-10)',
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
      <div style={{ height: '220px', width: '100%' }}>
        <Bar data={riskFactorsData} options={riskFactorsOptions} />
      </div>
    );
  }

  // Default: Overall Risk Score Trend
  const data = {
    labels,
    datasets: [
      {
        label: 'Overall Risk Score',
        data: riskScores,
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.4,
        pointRadius: 6,
        pointHoverRadius: 8,
        fill: true,
        pointBackgroundColor: '#ef4444',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
      },
      {
        label: 'Target Risk Level (5)',
        data: Array(labels.length).fill(5),
        borderColor: '#10b981',
        backgroundColor: 'transparent',
        borderDash: [5, 5],
        pointRadius: 0,
        fill: false,
      },
      {
        label: 'High Risk Threshold (8)',
        data: Array(labels.length).fill(8),
        borderColor: '#f59e0b',
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
        borderColor: '#ef4444',
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
          text: 'Risk Score (1-10, lower is better)',
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

export default HealthRiskChart;