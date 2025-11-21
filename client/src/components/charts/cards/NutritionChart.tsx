import React from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { UnifiedResponse } from '../../../services/wihyAPI';
import AnalyzeWithWihyButton from '../shared/AnalyzeWithWihyButton';

ChartJS.register(ArcElement, Tooltip, Legend);

interface NutritionChartProps {
  apiResponse?: UnifiedResponse | any;
  query?: string;
  onAnalyze?: (userMessage: string, assistantMessage: string) => void;
}

// Extract nutrition data from unified API response only
const extractNutritionData = (apiResponse?: UnifiedResponse | any) => {
  console.log('=== EXTRACTING NUTRITION DATA FROM NEW API ===');
  console.log('API Response:', apiResponse);
  
  // Handle unified API response
  if (apiResponse && apiResponse.success && apiResponse.data) {
    console.log('Processing unified API nutrition data');
    
    // Use charts_data if available for direct rendering
    if (apiResponse.data.charts_data?.nutrition_breakdown) {
      const chartData = apiResponse.data.charts_data.nutrition_breakdown;
      console.log('Using charts_data for nutrition breakdown:', chartData);
      return {
        type: 'chart_data',
        labels: chartData.labels,
        values: chartData.values,
        colors: chartData.colors,
        chart_type: chartData.chart_type
      };
    }
    
    // Use nutrition_data from the API response
    if (apiResponse.data.nutrition_data) {
      const nutrition = apiResponse.data.nutrition_data;
      const extractedData = {
        type: 'nutrition_facts',
        calories: nutrition.estimated_calories || 0,
        protein: nutrition.protein || 0,
        carbs: nutrition.carbohydrates || 0,
        fat: nutrition.fat || 0,
        fiber: nutrition.fiber || 0,
        sugar: nutrition.sugar || 0,
        sodium: nutrition.sodium || 0,
        nourish_score: nutrition.nourish_score || 0,
        nourish_category: nutrition.nourish_category || 'Unknown',
        macronutrients: nutrition.macronutrients || null
      };
      
      console.log('=== EXTRACTED NUTRITION DATA FROM NEW API ===');
      console.log('Final extracted data:', extractedData);
      return extractedData;
    }
  }
  
  console.log('No nutrition data available in API response');
  return null;
};

const NutritionChart: React.FC<NutritionChartProps> = ({ apiResponse, query, onAnalyze }) => {
  // Extract nutrition data using new unified approach
  const nutritionData = extractNutritionData(apiResponse);

  // Only render if we have nutrition data
  if (!nutritionData) {
    return null;
  }

  // Handle chart_data type (direct from API charts_data)
  if ((nutritionData as any).type === 'chart_data') {
    const chartData = nutritionData as any;
    const data = {
      datasets: [
        {
          data: chartData.values,
          backgroundColor: chartData.colors,
          borderColor: chartData.colors.map((color: string) => color),
          borderWidth: 2,
        },
      ],
      labels: chartData.labels,
    };

    const options = {
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
            label: function(context: any) {
              const label = context.label || '';
              const value = context.parsed;
              return `${label}: ${value}%`;
            },
          },
        },
      },
    };

    return (
      <div className="flex flex-col p-6 rounded-2xl bg-white border border-gray-200 shadow-md h-96 overflow-hidden">
        <h3 className="text-2xl font-semibold text-vh-muted mb-5">Nutrition Breakdown</h3>
        <div className="flex flex-col items-center justify-center flex-1 overflow-hidden min-h-0">
          <div className="w-full h-full max-w-[280px] max-h-[280px]">
            <Doughnut data={data} options={options} />
          </div>
        </div>
        <div className="flex justify-center mt-4 flex-shrink-0">
          <AnalyzeWithWihyButton
            cardContext={`Nutrition breakdown: ${chartData.labels.join(', ')} with values ${chartData.values.join(', ')}% respectively.`}
            userQuery="Analyze this nutrition breakdown and provide insights about the nutritional balance"
            onAnalyze={onAnalyze}
          />
        </div>
      </div>
    );
  }

  // Handle nutrition_facts type (calculated from nutrition.facts)
  const nutritionFacts = nutritionData as any;
  let protein, carbs, fat, total;
  
  if (nutritionFacts.macronutrients) {
    // Use pre-calculated macronutrients percentages
    protein = nutritionFacts.macronutrients.protein;
    carbs = nutritionFacts.macronutrients.carbs;
    fat = nutritionFacts.macronutrients.fat;
    total = protein + carbs + fat;
  } else {
    // Calculate percentages from gram values
    total = nutritionFacts.protein + nutritionFacts.carbs + nutritionFacts.fat;
    if (total > 0) {
      protein = Math.round((nutritionFacts.protein / total) * 100);
      carbs = Math.round((nutritionFacts.carbs / total) * 100);
      fat = Math.round((nutritionFacts.fat / total) * 100);
    } else {
      protein = carbs = fat = 0;
    }
  }

  const { calories } = nutritionFacts;
  
  // Prepare data for the pie chart
  const data = {
    datasets: [
      {
        data: [protein, carbs, fat],
        backgroundColor: [
          '#10B981', // Green for protein
          '#F59E0B', // Yellow for carbs  
          '#EF4444', // Red for fat
        ],
        borderWidth: 0,
        cutout: '60%',
      },
    ],
  };

  const options = {
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
          label: function(context: any) {
            const labels = ['Protein', 'Carbs', 'Fat'];
            const label = labels[context.dataIndex];
            const value = context.parsed;
            const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
            return `${label}: ${value}g (${percentage}%)`;
          },
        },
      },
    },
  };

  // Update chart options to show legend
  const optionsWithLegend = {
    ...options,
    plugins: {
      ...options.plugins,
      legend: {
        display: true,
        position: 'bottom' as const,
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 15,
          font: {
            size: 12,
          },
        },
      },
    },
  };

  return (
    <div className="flex flex-col p-6 rounded-2xl bg-white border border-gray-200 shadow-md h-96 overflow-hidden">
      <h3 className="text-2xl font-semibold text-vh-muted mb-5">Macronutrient Breakdown</h3>
      
      <div className="flex flex-col items-center justify-center flex-1 overflow-hidden min-h-0">
        <div className="relative w-full h-full max-w-[280px] max-h-[280px]">
          <Doughnut data={data} options={optionsWithLegend} />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
            <div className="text-2xl font-bold text-gray-700">
              {calories}
            </div>
            <div className="text-xs text-gray-500">
              Calories
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex justify-center mt-4 flex-shrink-0">
        <AnalyzeWithWihyButton
          cardContext={`Nutrition analysis: ${calories} calories total with macronutrient breakdown - Protein: ${total > 0 ? Math.round((protein / total) * 100) : 0}%, Carbs: ${total > 0 ? Math.round((carbs / total) * 100) : 0}%, Fat: ${total > 0 ? Math.round((fat / total) * 100) : 0}%. Additional nutrition data: ${JSON.stringify(nutritionFacts)}`}
          userQuery="Analyze this nutrition data and provide insights about the macronutrient balance and overall nutritional value"
          onAnalyze={onAnalyze}
        />
      </div>
    </div>
  );
};

export default NutritionChart;