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
import { Bar } from 'react-chartjs-2';
import AnalyzeWithWihyButton from '../shared/AnalyzeWithWihyButton';

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

interface CaloriesChartProps {
  period?: 'day' | 'week' | 'month';
  goal?: number;
  onAnalyze?: (userMessage: string, assistantMessage: string) => void;
}

const CaloriesChart: React.FC<CaloriesChartProps> = ({ 
  period = 'week',
  goal = 500,
  onAnalyze
}) => {
  // Generate calorie data based on period
  const generateData = () => {
    switch (period) {
      case 'day':
        return {
          labels: ['6am', '8am', '10am', '12pm', '2pm', '4pm', '6pm', '8pm'],
          calories: [45, 68, 120, 200, 240, 388, 485, 525],
          goal
        };
      case 'month':
        return {
          labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
          calories: [3200, 3450, 3100, 3380],
          goal: goal * 7
        };
      default: // week
        return {
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          calories: [420, 580, 380, 520, 460, 680, 620],
          goal
        };
    }
  };

  const { labels, calories, goal: targetGoal } = generateData();
  const totalCalories = calories.reduce((sum, item) => sum + item, 0);
  const averageCalories = Math.round(totalCalories / calories.length);
  const isGoalMet = averageCalories >= targetGoal;

  // Chart.js data structure
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
      },
      {
        label: `Goal (${targetGoal} cal)`,
        data: Array(labels.length).fill(targetGoal),
        backgroundColor: 'rgba(245, 158, 11, 0.3)',
        borderColor: '#f59e0b',
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
        position: 'top' as const,
        align: 'end' as const,
        labels: {
          usePointStyle: true,
          pointStyle: 'rect',
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
        borderColor: '#f59e0b',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${context.parsed.y} cal`;
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
    <div className="flex flex-col p-6 rounded-2xl bg-white border border-gray-200 shadow-md h-[400px] overflow-hidden">
      <h3 className="text-xl font-semibold text-gray-400 m-0 mb-3 text-center">Calories Burned</h3>
      
      <div className="flex-1 flex flex-col justify-center min-h-[180px] mb-2">
        <Bar data={data} options={options} />
      </div>
      
      <div className="flex justify-center mt-2 flex-shrink-0">
        <AnalyzeWithWihyButton
          cardContext={`Calories Chart: Total burned ${totalCalories} calories, average ${averageCalories} per ${period === 'day' ? 'hour' : 'day'}, goal ${targetGoal} calories (${period} view). Performance ${isGoalMet ? 'exceeds' : 'below'} target.`}
          userQuery="Analyze my calorie burn patterns and provide insights about my energy expenditure and recommendations for optimizing my workout intensity"
          onAnalyze={onAnalyze}
        />
      </div>
    </div>
  );
};

export default CaloriesChart;