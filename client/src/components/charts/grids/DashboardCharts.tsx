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
}

const DashboardCharts: React.FC<DashboardChartsProps> = ({ 
  period = 'week',
  maxCards = 20, // Show more cards by default to display all available charts
  showAllCharts = true, // Enable showing all charts by default
  excludeChartTypes = [],
  isInsightsLayout = false,
  isResearchLayout = false,
  isNutritionLayout = false
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
        className="chart-sections-grid"
      />
    </div>
  );
};

export default DashboardCharts;