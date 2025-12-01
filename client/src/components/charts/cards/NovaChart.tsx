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
import '../../../styles/charts.css';

ChartJS.register(ArcElement, Tooltip, Legend);

interface NovaChartProps {
  apiResponse?: UnifiedResponse | any;
  query?: string;
  onAnalyze?: (userMessage: string, assistantMessage: string) => void;
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

const NovaChart: React.FC<NovaChartProps> = ({ apiResponse, query, onAnalyze }) => {
  // Extract nova data using new unified approach
  let novaData = extractNovaData(apiResponse);

  // If no API data, show sample data for demonstration
  if (!novaData) {
    console.log('No API data available, showing sample NOVA data');
    novaData = {
      type: 'sample',
      novaScore: 2,
      processedLevel: 'Processed culinary ingredients'
    };
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
    <div className="flex flex-col p-6 rounded-2xl bg-white border border-gray-200 shadow-md h-[420px] overflow-hidden">
      <h3 className="text-2xl font-semibold text-vh-muted mb-5">
        NOVA Food Processing
      </h3>
      
      <div className="flex-1 flex flex-col justify-center overflow-hidden min-h-0">
        <div className="relative h-36 w-36 mx-auto">
          <Doughnut data={data} options={options} />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
            <div className="text-2xl font-bold text-gray-700">
              {novaScore}
            </div>
            <div className="text-xs text-gray-500">
              NOVA
            </div>
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-center mb-2">
            <div
              className="w-4 h-4 rounded mr-2"
              style={{
                backgroundColor: novaColors[novaScore as keyof typeof novaColors],
              }}
            />
            <span className="font-semibold text-gray-700 text-base">
              Group {novaScore}
            </span>
          </div>
          
          <div className="text-sm text-gray-700 italic mb-3">
            {processedLevel}
          </div>
        </div>
      </div>
      
      <div className="flex justify-center mt-2 flex-shrink-0">
        <AnalyzeWithWihyButton
          cardContext={`
NOVA Score Analysis:
- NOVA Group: ${novaData?.novaScore || 'Unknown'}
- Processing Level: ${novaData?.processedLevel || 'Unknown'}  
- Food Item: ${query || 'Food item'}

Please provide detailed analysis of this NOVA score and its health implications.
          `.trim()}
          userQuery={`Analyze this NOVA score: ${query || 'food item'}`}
          onAnalyze={onAnalyze}
        />
      </div>
    </div>
  );
};

export default NovaChart;