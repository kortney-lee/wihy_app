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

// Self-contained styling for HeartRateChart
const heartRateChartStyles = {
  container: {
    display: "flex" as const,
    flexDirection: "column" as const,
    padding: 20,
    borderRadius: 16,
    background: "white",
    border: "1px solid #e5e7eb",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
    gridColumn: "1 / -1", // Full width spanning
    height: "auto",
    minHeight: 280,
    maxHeight: 350,
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
    minHeight: 180,
    maxHeight: 220,
    marginBottom: 12,
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

interface HeartRateChartProps {
  period?: 'day' | 'week' | 'month';
}

const HeartRateChart: React.FC<HeartRateChartProps> = ({
  period = 'week'
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
    <div style={heartRateChartStyles.container}>
      <h3 style={heartRateChartStyles.title}>Heart Rate Trends</h3>
      
      <div style={heartRateChartStyles.chartContainer}>
        <Line data={data} options={options} />
      </div>
      
      <div style={heartRateChartStyles.footerRow}>
        <AnalyzeWithWihyButton
          cardContext={`Heart Rate Chart: Showing heart rate trends over ${period} period. Tracks resting, active, and maximum heart rate patterns for cardiovascular health monitoring and fitness optimization.`}
          userQuery="Analyze my heart rate patterns and provide insights about my cardiovascular health, fitness level, and training recommendations"
        />
      </div>
    </div>
  );
};

export default HeartRateChart;