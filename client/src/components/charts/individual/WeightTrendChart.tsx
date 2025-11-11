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

// Self-contained styling for WeightTrendChart
const weightTrendChartStyles = {
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

interface WeightTrendChartProps {
  period?: 'day' | 'week' | 'month';
}

const WeightTrendChart: React.FC<WeightTrendChartProps> = ({ period = 'week' }) => {
  // Weight data generation based on period
  const generateData = () => {
    switch (period) {
      case 'day':
        return {
          labels: ['6am', '8am', '10am', '12pm', '2pm', '4pm', '6pm', '8pm'],
          weight: [68.5, 68.3, 68.4, 68.6, 68.5, 68.3, 68.2, 68.1],
          goal: 65
        };
      case 'month':
        return {
          labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
          weight: [69.2, 68.8, 68.5, 68.2],
          goal: 65
        };
      default: // week
        return {
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          weight: [68.8, 68.6, 68.5, 68.4, 68.5, 68.3, 68.2],
          goal: 65
        };
    }
  };

  const { labels, weight, goal } = generateData();

  const currentWeight = weight[weight.length - 1] || 0;
  const goalWeight = goal;

  // Chart.js data structure
  const data = {
    labels,
    datasets: [
      {
        label: 'Weight (kg)',
        data: weight,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        pointRadius: 6,
        pointHoverRadius: 8,
        fill: true,
        pointBackgroundColor: '#3b82f6',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
      },
      {
        label: `Goal (${goal} kg)`,
        data: Array(labels.length).fill(goal),
        borderColor: '#10b981',
        backgroundColor: 'transparent',
        borderDash: [5, 5],
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
        min: 64,
        max: 70,
        title: {
          display: true,
          text: 'Weight (kg)',
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
        },
      },
    },
    interaction: {
      intersect: false,
      mode: 'index',
    },
  };

  return (
    <div style={weightTrendChartStyles.container}>
      <h3 style={weightTrendChartStyles.title}>Weight Trends</h3>
      
      <div style={weightTrendChartStyles.chartContainer}>
        <Line data={data} options={options} />
      </div>
      
      <div style={weightTrendChartStyles.footerRow}>
        <AnalyzeWithWihyButton
          cardContext={`Weight Trend Chart: Current weight is ${currentWeight} kg, goal weight is ${goalWeight} kg. Tracking weight changes over ${period} period showing fluctuations, trends, and patterns for weight management.`}
          userQuery="Analyze my weight trend patterns and provide insights about my weight management progress and recommendations"
        />
      </div>
    </div>
  );
};

export default WeightTrendChart;