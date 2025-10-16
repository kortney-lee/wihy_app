import React from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { UnifiedResponse } from '../services/wihyAPI';

ChartJS.register(ArcElement, Tooltip, Legend);

interface NutritionChartProps {
  apiResponse?: UnifiedResponse | any;
  query?: string;
  results?: string;
  dataSource?: "error" | "openai" | "local" | "vnutrition" | "wihy";
}

// Extract nutrition data from unified API response or legacy format
const extractNutritionData = (apiResponse?: UnifiedResponse | any, results?: string, dataSource?: string) => {
  console.log('=== EXTRACTING NUTRITION DATA IN NUTRITIONCHART ===');
  console.log('API Response:', apiResponse);
  console.log('DataSource:', dataSource);
  
  // Handle unified API response first
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
    
    // Use nutrition facts if available
    if (apiResponse.data.nutrition?.facts) {
      const nutrition = apiResponse.data.nutrition;
      const extractedData = {
        type: 'nutrition_facts',
        calories: nutrition.facts.calories_per_serving || 0,
        protein: nutrition.facts.protein_g || 0,
        carbs: nutrition.facts.carbs_g || 0,
        fat: nutrition.facts.fat_g || 0,
        fiber: nutrition.facts.fiber_g || 0,
        sugar: nutrition.facts.sugar_g || 0,
        sodium: nutrition.facts.sodium_mg || 0,
        nourish_score: nutrition.nourish_score?.score || 0,
        nourish_category: nutrition.nourish_score?.category || 'Unknown',
        macronutrients: nutrition.macronutrients || null
      };
      
      console.log('=== EXTRACTED UNIFIED NUTRITION DATA ===');
      console.log('Final extracted data:', extractedData);
      return extractedData;
    }
  }
  
  // Fallback to legacy extraction
  if (dataSource === 'vnutrition' && results) {
    try {
      console.log('Processing vnutrition data source');
      let nutrition;
      
      if (typeof results === 'string') {
        console.log('Parsing string results');
        
        // Check if this is markdown/formatted text instead of JSON
        if (results.startsWith('#') || results.includes('AI Chat response')) {
          console.log('Results appear to be formatted text, not JSON nutrition data');
          return null;
        }
        
        nutrition = JSON.parse(results);
      } else {
        console.log('Using object results directly');
        nutrition = results;
      }
      
      console.log('=== RAW NUTRITION OBJECT ===');
      console.log('Full object:', nutrition);
      console.log('Object keys:', Object.keys(nutrition || {}));
      
      if (nutrition && nutrition.found !== false) {
        const extractedData = {
          calories: nutrition.calories_per_serving || 0,
          protein: nutrition.protein_g || 0,
          carbs: nutrition.carbs_g || 0,
          fat: nutrition.fat_g || 0,
          fiber: nutrition.fiber_g || 0,
          sugar: nutrition.sugar_g || 0,
          sodium: nutrition.sodium_mg || 0,
          novaScore: nutrition.nova_classification || 1,
          processedLevel: nutrition.nova_description || nutrition.processed_level || 'Unknown'
        };
        
        console.log('=== EXTRACTED DATA ===');
        console.log('Final extracted data:', extractedData);
        
        return extractedData;
      } else {
        console.log('No valid nutrition data - found:', nutrition?.found);
        return null;
      }
    } catch (error) {
      console.error('Error parsing nutrition data:', error);
      console.log('This is likely because results are formatted text, not JSON nutrition data');
      return null;
    }
  }
  
  console.log('Not vnutrition source');
  return null;
};

const NutritionChart: React.FC<NutritionChartProps> = ({ apiResponse, query, results, dataSource }) => {
  // Extract nutrition data using new unified approach
  const nutritionData = extractNutritionData(apiResponse, results, dataSource);

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
          position: 'bottom' as const,
          labels: {
            padding: 20,
            font: {
              size: 14,
            },
          },
        },
        tooltip: {
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
      <div className="nutrition-chart-container">
        <h4 style={{ marginBottom: '15px', color: '#666' }}>Nutrition Breakdown</h4>
        <div style={{ width: '300px', height: '300px', margin: '0 auto' }}>
          <Doughnut data={data} options={options} />
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

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ position: 'relative', height: '200px', width: '200px', margin: '0 auto' }}>
        <Doughnut data={data} options={options} />
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#374151' }}>
            {calories}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>
            Calories
          </div>
        </div>
      </div>
      
      <div style={{ marginTop: '1rem' }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          marginBottom: '0.5rem' 
        }}>
          <span style={{ 
            fontSize: '1.2rem', 
            marginRight: '0.5rem' 
          }}>
            ⚡
          </span>
          <span style={{ 
            fontWeight: '500', 
            color: '#374151',
            fontSize: '1rem'
          }}>
            Good
          </span>
        </div>
        
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          gap: '1rem',
          fontSize: '0.875rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <div
              style={{
                width: '12px',
                height: '12px',
                backgroundColor: '#10B981',
                borderRadius: '2px',
              }}
            />
            <span>Protein: {total > 0 ? Math.round((protein / total) * 100) : 0}%</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <div
              style={{
                width: '12px',
                height: '12px',
                backgroundColor: '#F59E0B',
                borderRadius: '2px',
              }}
            />
            <span>Carbs: {total > 0 ? Math.round((carbs / total) * 100) : 0}%</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <div
              style={{
                width: '12px',
                height: '12px',
                backgroundColor: '#EF4444',
                borderRadius: '2px',
              }}
            />
            <span>Fat: {total > 0 ? Math.round((fat / total) * 100) : 0}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NutritionChart;