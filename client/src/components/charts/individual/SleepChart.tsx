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
import { Line, Bar } from 'react-chartjs-2';
import AnalyzeWithWihyButton from '../shared/AnalyzeWithWihyButton';

// Self-contained styling for SleepChart
const sleepChartStyles = {
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
    // Quality distribution chart data
    const qualityDistribution = [1, 2, 4, 0]; // nights in each category
    const qualityLabels = ['Poor (0-60%)', 'Fair (60-80%)', 'Good (80-90%)', 'Excellent (90%+)'];
    
    const qualityData = {
      labels: qualityLabels,
      datasets: [
        {
          label: 'Nights',
          data: qualityDistribution,
          backgroundColor: ['#ef4444', '#f59e0b', '#10b981', '#3b82f6'],
          borderColor: ['#dc2626', '#d97706', '#059669', '#2563eb'],
          borderWidth: 2,
          borderRadius: 4,
        }
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
              const value = context.parsed.y;
              return `${value} ${value === 1 ? 'night' : 'nights'}`;
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
          },
        },
      },
    };

    return (
      <div style={sleepChartStyles.container}>
        <h3 style={sleepChartStyles.title}>Sleep Quality Distribution</h3>
        
        <div style={sleepChartStyles.chartContainer}>
          <Bar data={qualityData} options={qualityOptions} />
        </div>
        
        <div style={sleepChartStyles.footerRow}>
          <AnalyzeWithWihyButton
            cardContext={`Sleep Quality Chart: Distribution showing ${qualityDistribution[2]} good nights, ${qualityDistribution[1]} fair nights, ${qualityDistribution[0]} poor night. Sleep quality analysis over ${period} period.`}
            userQuery="Analyze my sleep quality patterns and provide insights about improving sleep quality and duration"
          />
        </div>
      </div>
    );
  }

  // Duration trend chart with Chart.js
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
        pointBackgroundColor: '#6366f1',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        yAxisID: 'y',
      },
      {
        label: 'Sleep Quality (%)',
        data: quality,
        borderColor: '#8b5cf6',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        tension: 0.4,
        pointRadius: 5,
        pointHoverRadius: 7,
        fill: false,
        pointBackgroundColor: '#8b5cf6',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        yAxisID: 'y1',
      },
      {
        label: 'Target (7.5h)',
        data: Array(labels.length).fill(7.5),
        borderColor: '#10b981',
        backgroundColor: 'transparent',
        borderDash: [5, 5],
        pointRadius: 0,
        fill: false,
        yAxisID: 'y',
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
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: function(context) {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            return label.includes('Quality') ? `${label}: ${value}%` : `${label}: ${value}h`;
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
        min: 6,
        max: 9,
        title: {
          display: true,
          text: 'Sleep Duration (hours)',
          color: '#6366f1',
          font: {
            size: 12,
            weight: 'bold',
          },
        },
        grid: {
          color: 'rgba(148, 163, 184, 0.1)',
        },
        ticks: {
          color: '#6366f1',
          font: {
            size: 11,
          },
        },
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        min: 70,
        max: 95,
        title: {
          display: true,
          text: 'Sleep Quality (%)',
          color: '#8b5cf6',
          font: {
            size: 12,
            weight: 'bold',
          },
        },
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
  };

  return (
    <div style={sleepChartStyles.container}>
      <h3 style={sleepChartStyles.title}>Sleep Analysis</h3>
      
      <div style={sleepChartStyles.chartContainer}>
        <Line data={data} options={options} />
      </div>
      
      <div style={sleepChartStyles.footerRow}>
        <AnalyzeWithWihyButton
          cardContext={`Sleep Chart: Tracking ${chartType} over ${period} period. Shows sleep patterns, quality metrics, and duration trends for sleep health analysis and improvement recommendations.`}
          userQuery="Analyze my sleep patterns and provide insights about my sleep quality, duration, and recommendations for better rest"
        />
      </div>
    </div>
  );
};

export default SleepChart;