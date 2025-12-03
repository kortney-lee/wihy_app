import React from 'react';
import HealthDashboardGrid from './HealthDashboardGrid';
import { ChartType } from '../chartTypes';
import '../../../styles/Dashboard.css';
import '../../../styles/charts.css';

interface DashboardChartsProps {
  period?: 'day' | 'week' | 'month';
  maxCards?: number;
  showAllCharts?: boolean;
  excludeChartTypes?: ChartType[];
  isInsightsLayout?: boolean;
  isResearchLayout?: boolean;
  isNutritionLayout?: boolean;
  researchChartData?: {
    evidence_grade?: string;
    research_quality_score?: number;
    study_count?: number;
    confidence_level?: string;
    publication_timeline?: Record<string, number>;
    study_type_distribution?: Record<string, number>;
    evidence_distribution?: Record<string, number>;
    research_coverage?: {
      earliest_year?: number;
      latest_year?: number;
      year_span?: number;
      sample_size_analyzed?: number;
      total_research_available?: number;
    };
  };
  onAnalyze?: (userMessage: string, assistantMessage: string) => void;
}

const DashboardCharts: React.FC<DashboardChartsProps> = ({ 
  period = 'week',
  maxCards = 20, // Show more cards by default to display all available charts
  showAllCharts = true, // Enable showing all charts by default
  excludeChartTypes = [],
  isInsightsLayout = false,
  isResearchLayout = false,
  isNutritionLayout = false,
  researchChartData,
  onAnalyze
}) => {
  return (
    <div className="health-dashboard-content">
      {/* Use HealthDashboardGrid to display all available charts */}
      <HealthDashboardGrid 
        period={period}
        maxCards={maxCards}
        showAllCharts={showAllCharts}
        excludeChartTypes={excludeChartTypes}
        isInsightsLayout={isInsightsLayout}
        isResearchLayout={isResearchLayout}
        isNutritionLayout={isNutritionLayout}
        researchChartData={researchChartData}
        className="chart-sections-grid"
        onAnalyze={onAnalyze}
      />
    </div>
  );
};

export default DashboardCharts;