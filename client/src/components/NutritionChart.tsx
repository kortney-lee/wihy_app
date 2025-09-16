import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface NutritionChartProps {
  nutritionBreakdown: Array<{
    nutrient: string;
    value: number;
    color: string;
  }>;
  nutritionAverages: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    sugar: number;
    sodium: number;
  };
}

const NutritionChart: React.FC<NutritionChartProps> = ({ nutritionBreakdown, nutritionAverages }) => {
  if (!nutritionBreakdown || nutritionBreakdown.length === 0) {
    return null;
  }

  const chartData = {
    labels: nutritionBreakdown.map(item => item.nutrient),
    datasets: [{
      data: nutritionBreakdown.map(item => item.value),
      backgroundColor: nutritionBreakdown.map(item => item.color),
      borderRadius: 4,
      borderSkipped: false,
    }]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { 
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return `${context.label}: ${context.parsed.y}g`;
          }
        }
      }
    },
    scales: {
      y: { 
        beginAtZero: true,
        grid: { color: '#f0f0f0' },
        ticks: { font: { size: 10 } }
      },
      x: { 
        grid: { display: false },
        ticks: { font: { size: 10 } }
      }
    }
  };

  return (
    <div>
      <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: '600' }}>
        Avg Nutrition (per serving)
      </h3>
      <div style={{ height: '180px', marginBottom: '1rem' }}>
        <Bar data={chartData} options={options} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.8rem' }}>
        <div style={{ textAlign: 'center', padding: '6px', background: '#f8f9fa', borderRadius: '4px' }}>
          <div style={{ fontWeight: '600' }}>{nutritionAverages.calories}</div>
          <div style={{ color: '#666', fontSize: '0.75rem' }}>Calories</div>
        </div>
        <div style={{ textAlign: 'center', padding: '6px', background: '#f8f9fa', borderRadius: '4px' }}>
          <div style={{ fontWeight: '600' }}>{nutritionAverages.fiber}g</div>
          <div style={{ color: '#666', fontSize: '0.75rem' }}>Fiber</div>
        </div>
        <div style={{ textAlign: 'center', padding: '6px', background: '#f8f9fa', borderRadius: '4px' }}>
          <div style={{ fontWeight: '600' }}>{nutritionAverages.sugar}g</div>
          <div style={{ color: '#666', fontSize: '0.75rem' }}>Sugar</div>
        </div>
        <div style={{ textAlign: 'center', padding: '6px', background: '#f8f9fa', borderRadius: '4px' }}>
          <div style={{ fontWeight: '600' }}>{nutritionAverages.sodium}mg</div>
          <div style={{ color: '#666', fontSize: '0.75rem' }}>Sodium</div>
        </div>
      </div>
    </div>
  );
};

export default NutritionChart;