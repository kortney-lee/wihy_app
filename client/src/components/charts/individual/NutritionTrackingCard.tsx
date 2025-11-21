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

// Converted to use Tailwind CSS classes

const CardShell = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="flex flex-col p-6 rounded-2xl bg-white border border-gray-200 h-[420px] overflow-hidden">
    <h3 className="text-xl font-semibold text-gray-400 m-0 mb-5">{title}</h3>
    <div className="flex flex-col items-center justify-center flex-1 overflow-hidden min-h-0">{children}</div>
  </section>
);

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

interface NutrientData {
  name: string;
  value: number;
  daily_value?: number;
  unit: string;
  category: 'macros' | 'vitamins' | 'minerals';
}

interface NutritionTrackingCardProps {
  data?: NutrientData[];
  type?: 'macros' | 'micronutrients' | 'daily_intake' | 'calories';
  showDailyValues?: boolean;
  title?: string;
  showLabels?: boolean;
  onAnalyze?: (userMessage: string, assistantMessage: string) => void;
}

const NutritionTrackingCard: React.FC<NutritionTrackingCardProps> = ({ 
  data = [], 
  type = 'macros',
  showDailyValues = true,
  title = 'Nutrition Tracking',
  showLabels = true,
  onAnalyze
}) => {
  const generateData = (): NutrientData[] => {
    if (data.length > 0) return data;
    
    if (type === 'macros') {
      return [
        { name: 'Carbohydrates', value: 240, daily_value: 300, unit: 'g', category: 'macros' },
        { name: 'Protein', value: 85, daily_value: 100, unit: 'g', category: 'macros' },
        { name: 'Fat', value: 65, daily_value: 80, unit: 'g', category: 'macros' },
        { name: 'Fiber', value: 22, daily_value: 25, unit: 'g', category: 'macros' },
        { name: 'Sugar', value: 45, daily_value: 50, unit: 'g', category: 'macros' }
      ];
    }
    
    if (type === 'micronutrients') {
      return [
        { name: 'Vitamin A', value: 800, daily_value: 900, unit: 'mcg', category: 'vitamins' },
        { name: 'Vitamin C', value: 70, daily_value: 90, unit: 'mg', category: 'vitamins' },
        { name: 'Vitamin D', value: 15, daily_value: 20, unit: 'mcg', category: 'vitamins' },
        { name: 'Iron', value: 12, daily_value: 18, unit: 'mg', category: 'minerals' },
        { name: 'Calcium', value: 800, daily_value: 1000, unit: 'mg', category: 'minerals' },
        { name: 'Zinc', value: 8, daily_value: 11, unit: 'mg', category: 'minerals' }
      ];
    }
    
    // Default daily intake over time
    return [
      { name: 'Monday', value: 1850, daily_value: 2000, unit: 'kcal', category: 'macros' },
      { name: 'Tuesday', value: 2100, daily_value: 2000, unit: 'kcal', category: 'macros' },
      { name: 'Wednesday', value: 1950, daily_value: 2000, unit: 'kcal', category: 'macros' },
      { name: 'Thursday', value: 2250, daily_value: 2000, unit: 'kcal', category: 'macros' },
      { name: 'Friday', value: 1800, daily_value: 2000, unit: 'kcal', category: 'macros' },
      { name: 'Saturday', value: 2300, daily_value: 2000, unit: 'kcal', category: 'macros' },
      { name: 'Sunday', value: 2050, daily_value: 2000, unit: 'kcal', category: 'macros' }
    ];
  };

  const nutritionData = generateData();

  // Macronutrient Distribution (Doughnut Chart)
  if (type === 'macros') {
    const macrosData = {
      labels: nutritionData.map(d => d.name),
      datasets: [
        {
          label: 'Grams',
          data: nutritionData.map(d => d.value),
          backgroundColor: [
            '#3b82f6', // Carbs - Blue
            '#ef4444', // Protein - Red
            '#f59e0b', // Fat - Orange
            '#10b981', // Fiber - Green
            '#8b5cf6', // Sugar - Purple
          ],
          borderColor: [
            '#2563eb',
            '#dc2626',
            '#d97706',
            '#059669',
            '#7c3aed',
          ],
          borderWidth: 2,
        },
      ],
    };

    const macrosOptions: ChartOptions<'doughnut'> = {
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
              const index = context.dataIndex;
              const nutrient = nutritionData[index];
              const percentage = nutrient.daily_value ? 
                ((nutrient.value / nutrient.daily_value) * 100).toFixed(1) : 'N/A';
              return [
                `${context.label}: ${nutrient.value}${nutrient.unit}`,
                `${percentage}% of daily value`
              ];
            }
          }
        },
      },
    };

    return (
      <CardShell title={showLabels ? `${title} - Macronutrients` : "Macronutrients"}>
        <div style={{ width: '100%', height: '100%', maxWidth: '280px', maxHeight: '280px' }}>
          <Doughnut data={macrosData} options={macrosOptions} />
        </div>
        
        <div className="flex justify-center mt-4 flex-shrink-0">
          <AnalyzeWithWihyButton
            cardContext={`Macronutrient breakdown: ${nutritionData.map(n => `${n.name} ${n.value}${n.unit}`).join(', ')}. Daily values tracked for nutrition analysis.`}
            userQuery="Analyze my macronutrient distribution and suggest optimal ratios for my health goals"
            onAnalyze={onAnalyze}
          />
        </div>
      </CardShell>
    );
  }

  // Micronutrients (Bar Chart with Daily Value Comparison)
  if (type === 'micronutrients') {
    const getBarColor = (current: number, daily: number | undefined) => {
      if (!daily) return '#6b7280';
      const percentage = (current / daily) * 100;
      if (percentage >= 100) return '#10b981'; // Complete - Green
      if (percentage >= 75) return '#3b82f6';  // Good - Blue
      if (percentage >= 50) return '#f59e0b';  // Moderate - Orange
      return '#ef4444'; // Low - Red
    };

    const micronutrientsData = {
      labels: nutritionData.map(d => d.name),
      datasets: [
        {
          label: 'Current Intake',
          data: nutritionData.map(d => d.value),
          backgroundColor: nutritionData.map(d => getBarColor(d.value, d.daily_value)),
          borderColor: nutritionData.map(d => getBarColor(d.value, d.daily_value)),
          borderWidth: 2,
          borderRadius: 4,
        },
        ...(showDailyValues ? [{
          label: 'Daily Value',
          data: nutritionData.map(d => d.daily_value || 0),
          backgroundColor: 'rgba(107, 114, 128, 0.3)',
          borderColor: '#6b7280',
          borderWidth: 1,
          borderRadius: 4,
        }] : []),
      ],
    };

    const micronutrientsOptions: ChartOptions<'bar'> = {
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
          borderWidth: 1,
          cornerRadius: 8,
          callbacks: {
            label: function(context) {
              const index = context.dataIndex;
              const nutrient = nutritionData[index];
              if (context.datasetIndex === 0) {
                const percentage = nutrient.daily_value ? 
                  ((nutrient.value / nutrient.daily_value) * 100).toFixed(1) : 'N/A';
                return `Current: ${nutrient.value}${nutrient.unit} (${percentage}% DV)`;
              } else {
                return `Daily Value: ${context.parsed.y}${nutrient.unit}`;
              }
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
            text: 'Amount',
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
      <CardShell title={showLabels ? `${title} - Micronutrients` : "Micronutrients"}>
        <div className="w-full h-full max-w-[280px] max-h-[280px]">
          <Bar data={micronutrientsData} options={micronutrientsOptions} />
        </div>
        
        <div className="flex justify-center mt-4 flex-shrink-0">
          <AnalyzeWithWihyButton
            cardContext={`Micronutrient status: ${nutritionData.map(n => {
              const percentage = n.daily_value ? ((n.value / n.daily_value) * 100).toFixed(1) : 'N/A';
              return `${n.name} ${percentage}% DV`;
            }).join(', ')}.`}
            userQuery="Analyze my micronutrient intake and identify deficiencies or areas for improvement"
            onAnalyze={onAnalyze}
          />
        </div>
      </CardShell>
    );
  }

  // Default: Daily Calorie Intake (Line Chart)
  const dailyIntakeData = {
    labels: nutritionData.map(d => d.name),
    datasets: [
      {
        label: 'Daily Intake',
        data: nutritionData.map(d => d.value),
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
        label: 'Target Intake',
        data: nutritionData.map(d => d.daily_value || 2000),
        borderColor: '#10b981',
        backgroundColor: 'transparent',
        borderDash: [5, 5],
        pointRadius: 0,
        fill: false,
      },
    ],
  };

  const dailyIntakeOptions: ChartOptions<'line'> = {
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
            if (context.datasetIndex === 0) {
              const target = nutritionData[context.dataIndex].daily_value || 2000;
              const percentage = ((context.parsed.y / target) * 100).toFixed(1);
              return `${context.dataset.label}: ${context.parsed.y}${nutritionData[0].unit} (${percentage}% of target)`;
            }
            return `${context.dataset.label}: ${context.parsed.y}${nutritionData[0].unit}`;
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
          text: `Calories (${nutritionData[0]?.unit || 'kcal'})`,
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

  const averageIntake = nutritionData.reduce((sum, d) => sum + d.value, 0) / nutritionData.length;
  const targetIntake = nutritionData[0]?.daily_value || 2000;
  const targetPercent = ((averageIntake / targetIntake) * 100).toFixed(1);

  return (
    <CardShell title={showLabels ? `${title} - Daily Intake` : "Daily Intake"}>
      <div style={{ width: '100%', height: '100%', maxWidth: '280px', maxHeight: '280px' }}>
        <Line data={dailyIntakeData} options={dailyIntakeOptions} />
      </div>

      {/* Nutrition summary */}
      <div style={{ 
        marginTop: 8, 
        fontSize: 12,
        color: '#6b7280',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          Average: {Math.round(averageIntake)}{nutritionData[0]?.unit} ({targetPercent}% of target)
        </div>
        <div style={{ 
          color: Math.abs(averageIntake - targetIntake) <= targetIntake * 0.1 ? '#10b981' : 
                Math.abs(averageIntake - targetIntake) <= targetIntake * 0.2 ? '#f59e0b' : '#ef4444',
          fontWeight: 500 
        }}>
          {Math.abs(averageIntake - targetIntake) <= targetIntake * 0.1 ? '✅ On target' : 
           Math.abs(averageIntake - targetIntake) <= targetIntake * 0.2 ? '⚠️ Close to target' : 
           averageIntake > targetIntake ? '⬆️ Above target' : '⬇️ Below target'}
        </div>
      </div>
      
      <div className="flex justify-center mt-4 flex-shrink-0">
        <AnalyzeWithWihyButton
          cardContext={`Nutrition Tracking: Average daily intake ${Math.round(averageIntake)}${nutritionData[0]?.unit} vs target ${targetIntake}${nutritionData[0]?.unit} (${targetPercent}%). Weekly pattern analysis.`}
          userQuery="Analyze my nutrition intake patterns and provide recommendations for better nutritional balance"
          onAnalyze={onAnalyze}
        />
      </div>
    </CardShell>
  );
};

export default NutritionTrackingCard;
