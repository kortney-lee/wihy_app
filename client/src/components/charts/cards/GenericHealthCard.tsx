import React from 'react';
import { ChartType } from '../chartTypes';
import AnalyzeWithWihyButton from '../shared/AnalyzeWithWihyButton';
import '../../../styles/charts.css';

// Import individual chart components (now in individual directory)
import ActiveMinutesCard from '../individual/ActiveMinutesCard';
import CaloriesCard from '../individual/CaloriesCard';
import CurrentWeightCard from '../individual/CurrentWeightCard';
import StepsCard from '../individual/StepsCard';
import SleepCard from '../individual/SleepCard';
import HydrationCard from '../individual/HydrationCard';

// Import more individual chart components
import BMIDomainCard from '../individual/BMIDomainCard';
import HealthRiskCard from '../individual/HealthRiskCard';
import NutritionAnalysisCard from '../individual/NutritionAnalysisCard';

interface GenericHealthCardProps {
  chartType: ChartType;
  data?: any;
  title?: string;
  className?: string;
  onAnalyze?: (userMessage: string, assistantMessage: string) => void;
}

/**
 * Generic health card that renders the appropriate component based on chart type
 */
const GenericHealthCard: React.FC<GenericHealthCardProps> = ({ 
  chartType, 
  data, 
  title, 
  className,
  onAnalyze
}) => {
  // Map chart types to their corresponding components
  const renderChart = () => {
    switch (chartType) {
      case ChartType.ACTIVE_MINUTES:
        return <ActiveMinutesCard />;
      
      case ChartType.CALORIES:
        return <CaloriesCard />;
      
      case ChartType.WEIGHT_TREND:
        return <CurrentWeightCard />;
      
      case ChartType.STEPS:
        return <StepsCard />;
      
      case ChartType.SLEEP:
        return <SleepCard />;
      
      case ChartType.HYDRATION:
        return <HydrationCard />;
      
      case ChartType.BMI_DOMAIN:
        return <BMIDomainCard data={data} />;
      
      case ChartType.HEALTH_RISK:
        return <HealthRiskCard data={data} />;
      
      case ChartType.NUTRITION:
      case ChartType.MACRONUTRIENTS:
        return <NutritionAnalysisCard data={data} />;
      
      case ChartType.NOVA_SCORE:
      case ChartType.RESEARCH_QUALITY:
      case ChartType.PUBLICATION_TIMELINE:
      case ChartType.VITAMIN_CONTENT:
      case ChartType.DAILY_VALUE_PROGRESS:
        // For chart types that don't have specific components yet,
        // render a placeholder card
        return (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              {title || chartType.replace('_', ' ')}
            </h3>
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">📊</div>
              <p>Chart component coming soon</p>
              {data && (
                <div className="mt-4 text-xs">
                  <pre className="bg-gray-50 p-2 rounded text-left overflow-x-auto">
                    {JSON.stringify(data, null, 2)}
                  </pre>
                </div>
              )}
              
              <AnalyzeWithWihyButton
                cardContext={`Health chart analysis: ${title || chartType.replace('_', ' ')} chart with data: ${data ? JSON.stringify(data) : 'No data available'}`}
                userQuery="Analyze this health data and provide insights about what it means for my overall health"
                onAnalyze={onAnalyze}
              />
            </div>
          </div>
        );
      
      default:
        return (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              {title || 'Unknown Chart'}
            </h3>
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">❓</div>
              <p>Unknown chart type: {chartType}</p>
              
              <AnalyzeWithWihyButton
                cardContext={`Unknown health chart: Chart type "${chartType}" is not recognized. ${data ? `Available data: ${JSON.stringify(data)}` : 'No data available'}`}
                userQuery="Help me understand what this health data means and how I can use it"
                onAnalyze={onAnalyze}
              />
            </div>
          </div>
        );
    }
  };

  return (
    <div className={className}>
      {renderChart()}
    </div>
  );
};

export default GenericHealthCard;