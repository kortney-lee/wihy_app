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
import AnalyzeWithWihyButton from '../shared/AnalyzeWithWihyButton';

// Self-contained styling for HealthRiskChart
const healthRiskChartStyles = {
  container: {
    display: "flex" as const,
    flexDirection: "column" as const,
    padding: 20,
    borderRadius: 16,
    background: "white",
    border: "1px solid #e5e7eb",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
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

interface HealthRiskChartProps {
  period?: 'day' | 'week' | 'month';
  chartType?: 'risk-factors' | 'risk-score' | 'prevention' | 'categories';
  title?: string;
  showLabels?: boolean;
  onAnalyze?: (userMessage: string, assistantMessage: string) => void;
}

const HealthRiskChart: React.FC<HealthRiskChartProps> = ({ 
  period = 'week', 
  chartType = 'risk-factors',
  title = 'Health Risk Assessment',
  showLabels = true,
  onAnalyze
}) => {
  const generateData = () => {
    switch (period) {
      case 'day':
        return {
          labels: ['Morning', 'Afternoon', 'Evening', 'Night'],
          riskScores: [6.5, 7.2, 6.8, 6.1], // Overall risk score (1-10, lower is better)
          riskFactors: ['Diet', 'Exercise', 'Sleep', 'Stress', 'Smoking', 'Alcohol'],
          riskLevels: [5, 3, 6, 8, 0, 2], // Individual risk levels
          preventionActions: [3, 2, 4, 1], // Prevention actions taken per period
        };
      case 'month':
        return {
          labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
          riskScores: [7.2, 6.8, 6.5, 6.1],
          riskFactors: ['Diet', 'Exercise', 'Sleep', 'Stress', 'Smoking', 'Alcohol'],
          riskLevels: [6, 4, 5, 7, 0, 3],
          preventionActions: [8, 9, 7, 6],
        };
      default: // week
        return {
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          riskScores: [7.1, 6.8, 6.9, 6.5, 6.2, 6.8, 6.4],
          riskFactors: ['Diet', 'Exercise', 'Sleep', 'Stress', 'Smoking', 'Alcohol'],
          riskLevels: [6, 4, 5, 7, 0, 3],
          preventionActions: [2, 3, 1, 4, 3, 2, 1],
        };
    }
  };

  const { labels, riskScores, riskFactors, riskLevels, preventionActions } = generateData();

  // Risk Categories (Doughnut Chart)
  if (chartType === 'categories') {
    const categoriesData = {
      labels: ['Low Risk', 'Moderate Risk', 'High Risk', 'Critical Risk'],
      datasets: [
        {
          label: 'Risk Distribution',
          data: [35, 40, 20, 5], // percentages
          backgroundColor: [
            '#10b981', // Low - Green
            '#f59e0b', // Moderate - Orange
            '#ef4444', // High - Red
            '#7f1d1d', // Critical - Dark Red
          ],
          borderColor: [
            '#059669',
            '#d97706',
            '#dc2626',
            '#991b1b',
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
            usePointStyle: true,
            pointStyle: 'circle',
            padding: 15,
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
    };

    return (
      <div style={healthRiskChartStyles.container}>
        {showLabels && (
          <h3 style={healthRiskChartStyles.title}>{title} - Categories</h3>
        )}
        
        <div style={healthRiskChartStyles.chartContainer}>
          <Doughnut data={categoriesData} options={categoriesOptions} />
        </div>
        
        <div style={healthRiskChartStyles.footerRow}>
          <AnalyzeWithWihyButton
            cardContext={`Health Risk Categories: Distribution showing ${35}% low risk, ${40}% moderate risk, ${20}% high risk, ${5}% critical risk factors.`}
            userQuery="Analyze my health risk categories and provide recommendations to reduce high-risk factors"
            onAnalyze={onAnalyze}
          />
        </div>
      </div>
    );
  }

  // Risk Factors (Bar Chart)
  if (chartType === 'risk-factors') {
    const getBarColor = (level: number) => {
      if (level === 0) return '#6b7280'; // No risk - Gray
      if (level <= 3) return '#10b981'; // Low - Green
      if (level <= 5) return '#f59e0b'; // Moderate - Orange
      if (level <= 7) return '#ef4444'; // High - Red
      return '#7f1d1d'; // Critical - Dark Red
    };

    const riskFactorsData = {
      labels: riskFactors,
      datasets: [
        {
          label: 'Risk Level',
          data: riskLevels,
          backgroundColor: riskLevels.map(level => getBarColor(level)),
          borderColor: riskLevels.map(level => getBarColor(level)),
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
              let riskText = 'No Risk';
              if (level > 7) riskText = 'Critical Risk';
              else if (level > 5) riskText = 'High Risk';
              else if (level > 3) riskText = 'Moderate Risk';
              else if (level > 0) riskText = 'Low Risk';
              
              return `${context.label}: ${level}/10 (${riskText})`;
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
            maxRotation: 45,
          },
        },
        y: {
          beginAtZero: true,
          max: 10,
          title: {
            display: true,
            text: 'Risk Level (0-10)',
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
      <div style={healthRiskChartStyles.container}>
        {showLabels && (
          <h3 style={healthRiskChartStyles.title}>{title} - Risk Factors</h3>
        )}
        
        <div style={healthRiskChartStyles.chartContainer}>
          <Bar data={riskFactorsData} options={riskFactorsOptions} />
        </div>
        
        <div style={healthRiskChartStyles.footerRow}>
          <AnalyzeWithWihyButton
            cardContext={`Health Risk Factors: ${riskFactors.join(', ')} with levels ${riskLevels.join(', ')} respectively. Higher numbers indicate greater risk.`}
            userQuery="Analyze my health risk factors and provide specific recommendations to reduce my highest risks"
            onAnalyze={onAnalyze}
          />
        </div>
      </div>
    );
  }

  // Prevention Actions (Bar Chart)
  if (chartType === 'prevention') {
    const preventionData = {
      labels,
      datasets: [
        {
          label: 'Prevention Actions',
          data: preventionActions,
          backgroundColor: 'rgba(16, 185, 129, 0.6)',
          borderColor: '#10b981',
          borderWidth: 2,
          borderRadius: 4,
        },
      ],
    };

    const preventionOptions: ChartOptions<'bar'> = {
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
          borderColor: '#10b981',
          borderWidth: 1,
          cornerRadius: 8,
          callbacks: {
            label: function(context) {
              return `${context.parsed.y} prevention actions taken`;
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
      <div style={healthRiskChartStyles.container}>
        {showLabels && (
          <h3 style={healthRiskChartStyles.title}>{title} - Prevention</h3>
        )}
        
        <div style={healthRiskChartStyles.chartContainer}>
          <Bar data={preventionData} options={preventionOptions} />
        </div>
        
        <div style={healthRiskChartStyles.footerRow}>
          <AnalyzeWithWihyButton
            cardContext={`Health Prevention Actions: Tracking ${preventionActions.reduce((a, b) => a + b, 0)} total prevention actions over ${period} period.`}
            userQuery="Analyze my health prevention efforts and suggest additional preventive measures I should consider"
            onAnalyze={onAnalyze}
          />
        </div>
      </div>
    );
  }

  // Default: Risk Score Over Time (Line Chart)
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
        label: 'Target Risk Level (5.0)',
        data: Array(labels.length).fill(5.0),
        borderColor: '#10b981',
        backgroundColor: 'transparent',
        borderDash: [5, 5],
        pointRadius: 0,
        fill: false,
      },
      {
        label: 'High Risk Threshold (8.0)',
        data: Array(labels.length).fill(8.0),
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
              const score = context.parsed.y;
              let riskLevel = 'Low Risk';
              if (score >= 8) riskLevel = 'High Risk';
              else if (score >= 6) riskLevel = 'Moderate Risk';
              
              return `${context.dataset.label}: ${score}/10 (${riskLevel})`;
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
    <div style={healthRiskChartStyles.container}>
      {showLabels && (
        <h3 style={healthRiskChartStyles.title}>{title} - Score Trend</h3>
      )}
      
      <div style={healthRiskChartStyles.chartContainer}>
        <Line data={data} options={options} />
      </div>
      
      <div style={healthRiskChartStyles.footerRow}>
        <AnalyzeWithWihyButton
          cardContext={`Health Risk Score: Tracking overall risk score over ${period} period. Current average: ${(riskScores.reduce((a, b) => a + b, 0) / riskScores.length).toFixed(1)}/10. Lower scores indicate better health.`}
          userQuery="Analyze my health risk score trends and provide recommendations to lower my overall health risks"
          onAnalyze={onAnalyze}
        />
      </div>
    </div>
  );
};

export default HealthRiskChart;