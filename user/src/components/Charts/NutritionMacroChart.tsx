import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface NutritionMacroChartProps {
  period?: 'day' | 'week' | 'month';
}

const NutritionMacroChart: React.FC<NutritionMacroChartProps> = ({ period = 'week' }) => {
  const generateData = () => {
    switch (period) {
      case 'day':
        return {
          labels: ['Breakfast', 'Lunch', 'Dinner', 'Snacks'],
          protein: [25, 35, 40, 15], // grams
          carbs: [40, 60, 55, 20],   // grams  
          fats: [15, 20, 25, 10],    // grams
        };
      case 'month':
        return {
          labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
          protein: [120, 125, 115, 130],
          carbs: [180, 175, 185, 170],
          fats: [65, 70, 60, 75],
        };
      default: // week
        return {
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          protein: [115, 120, 125, 110, 130, 135, 125],
          carbs: [175, 180, 170, 185, 160, 190, 175],
          fats: [70, 65, 75, 60, 80, 70, 68],
        };
    }
  };

  const { labels, protein, carbs, fats } = generateData();

  const data = {
    labels,
    datasets: [
      {
        label: 'Protein',
        data: protein,
        backgroundColor: '#3b82f6',
        borderColor: '#2563eb',
        borderWidth: 1,
      },
      {
        label: 'Carbs',
        data: carbs,
        backgroundColor: '#10b981',
        borderColor: '#059669',
        borderWidth: 1,
      },
      {
        label: 'Fats',
        data: fats,
        backgroundColor: '#f59e0b',
        borderColor: '#d97706',
        borderWidth: 1,
      },
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
        displayColors: true,
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${context.parsed.y}g`;
          }
        }
      },
    },
    scales: {
      x: {
        stacked: true,
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
        stacked: true,
        beginAtZero: true,
        title: {
          display: true,
          text: 'Grams',
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
          callback: function(value) {
            return `${value}g`;
          }
        },
      },
    },
    interaction: {
      intersect: false,
      mode: 'index',
    },
  };

  return (
    <div style={{ height: '240px', width: '100%' }}>
      <Bar data={data} options={options} />
    </div>
  );
};

export default NutritionMacroChart;