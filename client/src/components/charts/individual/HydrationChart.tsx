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
  Filler,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import AnalyzeWithWihyButton from '../shared/AnalyzeWithWihyButton';

// Self-contained styling for HydrationChart
const hydrationChartStyles = {
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
  Legend,
  Filler
);

interface HydrationData {
  time: string;
  intake: number;
  cumulative: number;
  type?: 'water' | 'coffee' | 'tea' | 'sports' | 'other';
}

interface HydrationChartProps {
  data?: HydrationData[];
  target?: number; // Daily water target in ml
  type?: 'daily' | 'hourly' | 'weekly' | 'sources';
  title?: string;
  showLabels?: boolean;
  onAnalyze?: (userMessage: string, assistantMessage: string) => void;
}

const HydrationChart: React.FC<HydrationChartProps> = ({ 
  data = [], 
  target = 2000, // 2 liters default
  type = 'daily',
  title = 'Hydration Tracking',
  showLabels = true,
  onAnalyze
}) => {
  const generateData = (): HydrationData[] => {
    if (data.length > 0) return data;
    
    if (type === 'hourly') {
      // Hourly intake for today
      return Array.from({ length: 16 }, (_, i) => {
        const hour = i + 6; // Start from 6 AM
        const intake = Math.floor(Math.random() * 300) + 50; // 50-350ml per hour
        const cumulative = Math.floor((i + 1) * (target / 16)) + Math.random() * 200 - 100;
        
        return {
          time: `${hour}:00`,
          intake,
          cumulative: Math.max(0, cumulative),
          type: ['water', 'coffee', 'tea', 'sports'][Math.floor(Math.random() * 4)] as any
        };
      });
    } else if (type === 'weekly') {
      // Weekly averages
      return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => ({
        time: day,
        intake: Math.floor(Math.random() * 500) + 1500, // 1500-2000ml per day
        cumulative: Math.floor(Math.random() * 500) + 1500,
        type: 'water' as any
      }));
    }
    
    // Default: daily progress over recent days
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      const intake = Math.floor(Math.random() * 600) + 1400; // 1400-2000ml
      
      return {
        time: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        intake,
        cumulative: intake,
        type: 'water' as any
      };
    });
  };

  const hydrationData = generateData();

  // Hydration Sources Distribution
  if (type === 'sources') {
    const sourcesData = {
      labels: ['Water', 'Coffee', 'Tea', 'Sports Drinks', 'Other'],
      datasets: [
        {
          label: 'Hydration Sources',
          data: [65, 15, 12, 5, 3], // percentages
          backgroundColor: [
            '#06b6d4', // Water - Cyan
            '#8b5cf6', // Coffee - Purple
            '#10b981', // Tea - Green
            '#f59e0b', // Sports - Orange
            '#6b7280', // Other - Gray
          ],
          borderColor: [
            '#0891b2',
            '#7c3aed',
            '#059669',
            '#d97706',
            '#4b5563',
          ],
          borderWidth: 2,
        },
      ],
    };

    const sourcesOptions: ChartOptions<'doughnut'> = {
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
      <div style={hydrationChartStyles.container}>
        {showLabels && (
          <h3 style={hydrationChartStyles.title}>{title} - Sources</h3>
        )}
        
        <div style={hydrationChartStyles.chartContainer}>
          <Doughnut data={sourcesData} options={sourcesOptions} />
        </div>
        
        <div style={hydrationChartStyles.footerRow}>
          <AnalyzeWithWihyButton
            cardContext={`Hydration Sources: Water (65%), Coffee (15%), Tea (12%), Sports drinks (5%), Other (3%). Daily target: ${target}ml.`}
            userQuery="Analyze my hydration sources and suggest optimal fluid intake strategies"
            onAnalyze={onAnalyze}
          />
        </div>
      </div>
    );
  }

  // Hourly Intake (Bar Chart)
  if (type === 'hourly') {
    const hourlyData = {
      labels: hydrationData.map(d => d.time),
      datasets: [
        {
          label: 'Hourly Intake (ml)',
          data: hydrationData.map(d => d.intake),
          backgroundColor: hydrationData.map(d => {
            switch (d.type) {
              case 'water': return 'rgba(6, 182, 212, 0.6)';
              case 'coffee': return 'rgba(139, 92, 246, 0.6)';
              case 'tea': return 'rgba(16, 185, 129, 0.6)';
              case 'sports': return 'rgba(245, 158, 11, 0.6)';
              default: return 'rgba(107, 114, 128, 0.6)';
            }
          }),
          borderColor: hydrationData.map(d => {
            switch (d.type) {
              case 'water': return '#06b6d4';
              case 'coffee': return '#8b5cf6';
              case 'tea': return '#10b981';
              case 'sports': return '#f59e0b';
              default: return '#6b7280';
            }
          }),
          borderWidth: 2,
          borderRadius: 4,
        },
      ],
    };

    const hourlyOptions: ChartOptions<'bar'> = {
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
              const index = context.dataIndex;
              const type = hydrationData[index].type || 'water';
              return `${context.parsed.y}ml (${type})`;
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
            text: 'Intake (ml)',
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
          },
        },
      },
    };

    return (
      <div style={hydrationChartStyles.container}>
        {showLabels && (
          <h3 style={hydrationChartStyles.title}>{title} - Hourly Intake</h3>
        )}
        
        <div style={hydrationChartStyles.chartContainer}>
          <Bar data={hourlyData} options={hourlyOptions} />
        </div>
        
        <div style={hydrationChartStyles.footerRow}>
          <AnalyzeWithWihyButton
            cardContext={`Hourly Hydration: Total intake ${hydrationData.reduce((sum, d) => sum + d.intake, 0)}ml of ${target}ml target. Peak hours and intake patterns tracked.`}
            userQuery="Analyze my hourly hydration patterns and suggest optimal timing for fluid intake"
            onAnalyze={onAnalyze}
          />
        </div>
      </div>
    );
  }

  // Default: Daily/Weekly Progress (Line Chart with Area Fill)
  const progressData = {
    labels: hydrationData.map(d => d.time),
    datasets: [
      {
        label: 'Daily Intake (ml)',
        data: hydrationData.map(d => d.intake),
        borderColor: '#06b6d4',
        backgroundColor: 'rgba(6, 182, 212, 0.1)',
        tension: 0.4,
        pointRadius: 6,
        pointHoverRadius: 8,
        fill: true,
        pointBackgroundColor: '#06b6d4',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
      },
      {
        label: `Target (${target}ml)`,
        data: Array(hydrationData.length).fill(target),
        borderColor: '#10b981',
        backgroundColor: 'transparent',
        borderDash: [5, 5],
        pointRadius: 0,
        fill: false,
      },
      {
        label: 'Minimum (1500ml)',
        data: Array(hydrationData.length).fill(1500),
        borderColor: '#f59e0b',
        backgroundColor: 'transparent',
        borderDash: [3, 3],
        pointRadius: 0,
        fill: false,
      }
    ],
  };

  const progressOptions: ChartOptions<'line'> = {
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
        borderColor: '#06b6d4',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: function(context) {
            if (context.datasetIndex === 0) {
              const intake = context.parsed.y;
              const percentage = ((intake / target) * 100).toFixed(1);
              return `${context.dataset.label}: ${intake}ml (${percentage}% of target)`;
            }
            return `${context.dataset.label}: ${context.parsed.y}ml`;
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
        max: Math.max(target * 1.2, Math.max(...hydrationData.map(d => d.intake)) * 1.1),
        title: {
          display: true,
          text: 'Intake (ml)',
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
        },
      },
    },
    interaction: {
      intersect: false,
      mode: 'index',
    },
  };

  const totalIntake = hydrationData.reduce((sum, d) => sum + d.intake, 0);
  const averageIntake = type === 'daily' ? totalIntake / hydrationData.length : totalIntake;
  const targetPercent = ((averageIntake / target) * 100).toFixed(1);

  return (
    <div style={hydrationChartStyles.container}>
      {showLabels && (
        <h3 style={hydrationChartStyles.title}>
          {title} - {type.charAt(0).toUpperCase() + type.slice(1)} Progress
        </h3>
      )}
      
      <div style={hydrationChartStyles.chartContainer}>
        <Line data={progressData} options={progressOptions} />
      </div>

      {/* Hydration summary */}
      <div style={{ 
        marginTop: 8, 
        fontSize: 12,
        color: '#6b7280',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          Average: {Math.round(averageIntake)}ml ({targetPercent}% of target)
        </div>
        <div style={{ 
          color: averageIntake >= target ? '#10b981' : averageIntake >= 1500 ? '#f59e0b' : '#ef4444',
          fontWeight: 500 
        }}>
          {averageIntake >= target ? '✅ Target met' : 
           averageIntake >= 1500 ? '⚠️ Below target' : '❌ Dehydration risk'}
        </div>
      </div>
      
      <div style={hydrationChartStyles.footerRow}>
        <AnalyzeWithWihyButton
          cardContext={`Hydration Tracking: ${type} view showing average ${Math.round(averageIntake)}ml intake vs ${target}ml target (${targetPercent}%). Total tracked: ${totalIntake}ml.`}
          userQuery="Analyze my hydration patterns and provide recommendations for optimal daily fluid intake"
          onAnalyze={onAnalyze}
        />
      </div>
    </div>
  );
};

export default HydrationChart;