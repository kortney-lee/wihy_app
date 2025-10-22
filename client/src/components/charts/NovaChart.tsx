import React from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { UnifiedResponse } from '../../services/wihyAPI';

ChartJS.register(ArcElement, Tooltip, Legend);

interface NovaChartProps {
  apiResponse?: UnifiedResponse | any;
  query?: string;
}

// Extract nova/processing data from unified API response
const extractNovaData = (apiResponse?: UnifiedResponse | any) => {
  console.log('=== EXTRACTING NOVA DATA FROM NEW API ===');
  console.log('API Response:', apiResponse);
  
  // Handle unified API response
  if (apiResponse && apiResponse.success && apiResponse.data) {
    console.log('Processing unified API nova data');
    
    // Use charts_data if available for direct rendering
    if (apiResponse.data.charts_data?.nova_chart) {
      const chartData = apiResponse.data.charts_data.nova_chart;
      console.log('Using charts_data for nova chart:', chartData);
      return {
        type: 'chart_data',
        novaScore: chartData.nova_score,
        processedLevel: chartData.description,
        chart_type: chartData.chart_type
      };
    }
    
    // Use nutrition_data from the API response
    if (apiResponse.data.nutrition_data) {
      const nutrition = apiResponse.data.nutrition_data;
      const extractedData = {
        type: 'nutrition_facts',
        novaScore: nutrition.nova_score || 1,
        processedLevel: nutrition.processing_level || 'Unknown'
      };
      
      console.log('=== EXTRACTED NOVA DATA FROM NEW API ===');
      console.log('Final extracted data:', extractedData);
      return extractedData;
    }
  }
  
  console.log('No nova data available in API response');
  return null;
};

const NovaChart: React.FC<NovaChartProps> = ({ apiResponse, query }) => {
  // Extract nova data using new unified approach
  const novaData = extractNovaData(apiResponse);

  // Only render if we have nova data
  if (!novaData) {
    return null;
  }

  const { novaScore, processedLevel } = novaData;

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