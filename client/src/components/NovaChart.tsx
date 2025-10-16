import React from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

interface NovaChartProps {
  query: string;
  results: string;
  dataSource: "error" | "openai" | "local" | "vnutrition";
}

// Extract nutrition data function moved from SearchResults
const extractNutritionData = (results: string, dataSource: string) => {
  console.log('=== EXTRACTING NUTRITION DATA IN NOVACHART ===');
  console.log('DataSource:', dataSource);
  console.log('Results type:', typeof results);
  
  if (dataSource === 'vnutrition') {
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
        console.log('NOVA Score:', extractedData.novaScore);
        
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

const NovaChart: React.FC<NovaChartProps> = ({ query, results, dataSource }) => {
  // Extract nutrition data using internal function
  const nutritionData = extractNutritionData(results, dataSource);

  // Only render if we have nutrition data
  if (!nutritionData || dataSource !== 'vnutrition') {
    return null;
  }

  const { novaScore, processedLevel } = nutritionData;

  // NOVA classification colors
  const novaColors = {
    1: '#10B981', // Green - Good
    2: '#F59E0B', // Yellow - Okay
    3: '#F97316', // Orange - Caution
    4: '#EF4444'  // Red - Avoid
  };

  // Create data for the current NOVA score (100% fill)
  const data = {
    datasets: [
      {
        data: [100, 0], // 100% for the current score, 0% for remaining
        backgroundColor: [
          novaColors[novaScore as keyof typeof novaColors],
          '#E5E7EB' // Light gray for empty portion
        ],
        borderWidth: 0,
        cutout: '70%',
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
        enabled: false,
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
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#374151' }}>
            {novaScore}
          </div>
          <div style={{ fontSize: '0.875rem', color: '#6B7280' }}>
            NOVA
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
          <div
            style={{
              width: '16px',
              height: '16px',
              backgroundColor: novaColors[novaScore as keyof typeof novaColors],
              borderRadius: '3px',
              marginRight: '0.5rem',
            }}
          />
          <span style={{ 
            fontWeight: '600', 
            color: '#374151',
            fontSize: '1rem'
          }}>
            Group {novaScore}
          </span>
        </div>
        
        <div style={{ 
          fontSize: '0.875rem',
          color: '#374151',
          fontStyle: 'italic'
        }}>
          {processedLevel}
        </div>
      </div>
    </div>
  );
};

export default NovaChart;