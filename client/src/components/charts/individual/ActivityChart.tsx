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

// Self-contained styling for ActivityChart
const activityChartStyles = {
  container: {
    display: "flex" as const,
    flexDirection: "column" as const,
    padding: 24,
    borderRadius: 16,
    background: "white",
    border: "1px solid #e5e7eb",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
    gridColumn: "1 / -1", // Full width spanning
    height: "auto",
    minHeight: 300,
    width: "100%",
    overflow: "hidden" as const,
  },
  title: {
    fontSize: 18,
    fontWeight: 600,
    color: "#374151",
    margin: 0,
    marginBottom: 20,
    textAlign: "left" as const,
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

interface ActivityChartProps {
  period?: 'day' | 'week' | 'month';
  chartType?: 'steps' | 'distance' | 'calories' | 'activity' | 'hydration';
}

const ActivityChart: React.FC<ActivityChartProps> = ({ 
  period = 'week', 
  chartType = 'steps' 
}) => {
  // Sample data generation based on period
  const generateData = () => {
    switch (period) {
      case 'day':
        return {
          labels: ['6am', '8am', '10am', '12pm', '2pm', '4pm', '6pm', '8pm'],
          steps: [800, 1200, 2100, 3500, 4200, 6800, 8500, 9200],
          distance: [0.6, 0.9, 1.6, 2.8, 3.4, 5.4, 6.8, 7.4],
          calories: [45, 68, 120, 200, 240, 388, 485, 525],
          hydration: [0.25, 0.5, 0.75, 1.0, 1.5, 2.0, 2.3, 2.5],
        };
      case 'month':
        return {
          labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
          steps: [68500, 72300, 69800, 71200],
          distance: [48.2, 51.8, 49.6, 50.4],
          calories: [4820, 5180, 4960, 5040],
          hydration: [17.5, 18.2, 17.8, 18.0],
        };
      default: // week
        return {
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          steps: [8500, 12300, 9800, 11200, 10500, 15600, 13200],
          distance: [6.8, 9.8, 7.8, 9.0, 8.4, 12.5, 10.6],
          calories: [485, 702, 560, 648, 600, 890, 756],
          hydration: [2.1, 2.8, 2.3, 2.5, 2.4, 3.2, 2.7],
        };
    }
  };

  const { labels, steps, distance, calories, hydration } = generateData();

  // Activity Distribution Chart (Doughnut)
  if (chartType === 'activity') {
    const activityData = {
      labels: ['Cardio', 'Strength', 'Flexibility', 'Sports', 'Walking', 'Other'],
      datasets: [
        {
          data: [25, 20, 15, 18, 12, 10],
          backgroundColor: [
            '#ef4444',
            '#f97316', 
            '#eab308',
            '#22c55e',
            '#06b6d4',
            '#8b5cf6',
          ],
          borderColor: [
            '#dc2626',
            '#ea580c',
            '#ca8a04',
            '#16a34a',
            '#0891b2',
            '#7c3aed',
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

  // Distance Chart
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

  // Calories Chart
  if (chartType === 'calories') {
    const data = {
      labels,
      datasets: [
        {
          label: 'Calories Burned',
          data: calories,
          backgroundColor: '#f59e0b',
          borderColor: '#d97706',
          borderWidth: 2,
          borderRadius: 4,
        }
      ],
    };

    const options: ChartOptions<'bar'> = {
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
          borderColor: '#f59e0b',
          borderWidth: 1,
          cornerRadius: 8,
          callbacks: {
            label: function(context) {
              return `Calories: ${context.parsed.y}`;
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
            text: 'Calories',
            color: '#f59e0b',
            font: {
              size: 12,
              weight: 'bold',
            },
          },
          grid: {
            color: 'rgba(148, 163, 184, 0.1)',
          },
          ticks: {
            color: '#f59e0b',
            font: {
              size: 11,
            },
          },
        },
      },
    };

    return (
      <div style={{ height: '200px', width: '100%' }}>
        <Bar data={data} options={options} />
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

  // Internal CardShell component
  const CardShell = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <section style={activityChartStyles.container}>
      <h3 style={activityChartStyles.title}>{title}</h3>
      <div style={activityChartStyles.chartContainer}>{children}</div>
    </section>
  );

  return (
    <CardShell title="Steps & Activity Trends">
      <div style={{ height: '240px', width: '100%' }}>
        <Line data={data} options={options} />
      </div>
      
      <div style={activityChartStyles.footerRow}>
        <AnalyzeWithWihyButton
          cardContext={`Activity Chart: Showing ${chartType} data over ${period} period. Chart displays trends and patterns in daily activity metrics for health tracking and goal achievement.`}
          userQuery="Analyze my activity chart data and provide insights about my activity patterns, trends, and recommendations for improvement"
        />
      </div>
    </CardShell>
  );
};

export default ActivityChart;