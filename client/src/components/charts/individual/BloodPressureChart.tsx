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

// Self-contained styling for BloodPressureChart
const bloodPressureChartStyles = {
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

interface BloodPressureChartProps {
  period?: 'day' | 'week' | 'month';
}

const BloodPressureChart: React.FC<BloodPressureChartProps> = ({ 
  period = 'week'
}) => {
  // Blood pressure data generation based on period
  const generateData = () => {
    switch (period) {
      case 'day':
        return {
          labels: ['6am', '9am', '12pm', '3pm', '6pm', '9pm', '12am'],
          systolic: [118, 122, 125, 128, 130, 124, 115],
          diastolic: [75, 78, 80, 82, 85, 79, 72],
        };
      case 'month':
        return {
          labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
          systolic: [125, 122, 120, 118],
          diastolic: [80, 78, 76, 74],
        };
      default: // week
        return {
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          systolic: [120, 118, 125, 122, 128, 115, 119],
          diastolic: [75, 74, 80, 78, 82, 72, 76],
        };
    }
  };

  const { labels, systolic, diastolic } = generateData();

  // Blood Pressure Chart
  const data = {
    labels,
    datasets: [
      {
        label: 'Systolic',
        data: systolic,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        pointRadius: 5,
        pointHoverRadius: 7,
        fill: true,
      },
      {
        label: 'Diastolic',
        data: diastolic,
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
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${context.parsed.y} mmHg`; 
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
          text: 'mmHg',
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
          callback: function(value) {
            return `${value} mmHg`;
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
    <section style={bloodPressureChartStyles.container}>
      <h3 style={bloodPressureChartStyles.title}>{title}</h3>
      <div style={bloodPressureChartStyles.chartContainer}>{children}</div>
    </section>
  );

  return (
    <CardShell title="Blood Pressure Trends">
      {/* Blood Pressure Chart Display */}
      <div style={{ height: '240px', width: '100%' }}>
        <Line data={data} options={options} />
      </div>
      
      <div style={bloodPressureChartStyles.footerRow}>
        <AnalyzeWithWihyButton
          cardContext={`Blood Pressure Chart: Showing systolic and diastolic blood pressure trends over ${period} period. Tracks cardiovascular health indicators for hypertension monitoring and heart health assessment.`}
          userQuery="Analyze my blood pressure patterns and provide insights about my cardiovascular health, risk factors, and lifestyle recommendations"
        />
      </div>
    </CardShell>
  );
};

export default BloodPressureChart;