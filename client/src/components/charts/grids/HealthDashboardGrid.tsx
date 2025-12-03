import React, { useState } from 'react';
import { CardData } from '../cardConfig';
import { ChartType, getChartTypesByPriority } from '../chartTypes';
import { getChartComponent } from '../chartRegistry';

interface HealthDashboardGridProps {
  cards?: CardData[];
  className?: string;
  maxCards?: number;
  showAllCharts?: boolean;
  period?: 'day' | 'week' | 'month';
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

const gridStyles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '24px'
  },
  cardContainer: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column' as const
  },
  cardContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'center'
  },
  placeholder: {
    textAlign: 'center' as const,
    padding: '32px 0',
    color: '#6b7280'
  },
  placeholderText: {
    fontSize: '14px',
    marginTop: '8px'
  },
  linksContainer: {
    display: 'flex',
    gap: '8px',
    marginTop: '12px',
    paddingTop: '8px',
    borderTop: '1px solid #f3f4f6'
  },
  link: {
    fontSize: '12px',
    color: '#2563eb',
    textDecoration: 'none'
  },
  linkHover: {
    color: '#1d4ed8'
  },
  periodControls: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '8px',
    padding: '16px',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
  },
  periodLabel: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
    marginRight: '16px'
  },
  periodButton: {
    padding: '8px 16px',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '500',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  periodButtonActive: {
    backgroundColor: '#2563eb',
    color: 'white'
  },
  periodButtonInactive: {
    backgroundColor: '#f3f4f6',
    color: '#374151'
  },
  periodButtonHover: {
    backgroundColor: '#e5e7eb'
  },
  chartsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '24px'
  },
  insightsGrid: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '24px'
  },
  insightsRow: {
    display: 'grid',
    gap: '24px'
  },
  insightsFirstRow: {
    gridTemplateColumns: 'repeat(3, 1fr)'
  },
  insightsSecondRow: {
    gridTemplateColumns: 'repeat(2, 1fr)',
    maxWidth: '66.666%', // 2/3 of the full width to center the 2 cards
    margin: '0 auto',
    width: '100%',
    justifySelf: 'center'
  },
  insightsGridMobile: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '24px'
  },
  researchGrid: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '24px'
  },
  researchRow: {
    display: 'grid',
    gap: '24px',
    gridTemplateColumns: 'repeat(2, 1fr)'
  },
  nutritionGrid: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '24px'
  },
  nutritionFirstRow: {
    display: 'grid',
    gap: '24px',
    gridTemplateColumns: 'repeat(3, 1fr)'
  },
  nutritionOtherRows: {
    display: 'grid',
    gap: '24px',
    gridTemplateColumns: 'repeat(2, 1fr)'
  },
  nutritionWideRow: {
    display: 'grid',
    gap: '24px',
    gridTemplateColumns: 'repeat(2, 1fr)',
    marginBottom: '24px'
  },
  fullWidthCard: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '24px',
    marginBottom: '24px'
  }
};

const HealthDashboardGrid: React.FC<HealthDashboardGridProps> = ({ 
  cards = [], 
  className = '',
  maxCards = 26,
  showAllCharts = false,
  period = 'week',
  excludeChartTypes = [],
  isInsightsLayout = false,
  isResearchLayout = false,
  isNutritionLayout = false,
  researchChartData,
  onAnalyze
}) => {
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);

  // Handle responsive window resizing
  React.useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const renderCard = (cardData: CardData, height?: number) => {
    const ChartComponent = getChartComponent(cardData.chartType);
    
    return (
      <div key={cardData.id} style={gridStyles.cardContainer}>
        <div style={gridStyles.cardContent}>
          {ChartComponent ? (
            <ChartComponent 
              period={period}
              data={cardData.data}
              config={cardData.config}
              height={height}
              onAnalyze={onAnalyze}
              researchData={researchChartData}
              {...(cardData.config || {})}
            />
          ) : (
            <div style={gridStyles.placeholder}>
              <p>Chart component not found</p>
              <p style={gridStyles.placeholderText}>Type: {cardData.chartType}</p>
            </div>
          )}
        </div>
        
        {cardData.links && cardData.links.length > 0 && (
          <div style={gridStyles.linksContainer}>
            {cardData.links.map((link, linkIndex) => (
              <a
                key={linkIndex}
                href={link.href}
                style={gridStyles.link}
                onMouseEnter={(e) => e.currentTarget.style.color = gridStyles.linkHover.color}
                onMouseLeave={(e) => e.currentTarget.style.color = gridStyles.link.color}
              >
                {link.label}
              </a>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Helper function to determine if a chart should be full-width (Mon-Sun patterns)
  const isFullWidthChart = (chartType: ChartType): boolean => {
    const fullWidthCharts = [
      ChartType.ACTIVITY,
      ChartType.WEIGHT_TREND,
      ChartType.SLEEP_CHART,
      ChartType.BLOOD_PRESSURE,
      ChartType.HEART_RATE,
      ChartType.HYDRATION_CHART,
      ChartType.CALORIES_CHART,
      // ChartType.NUTRITION_TRACKING, // Now NutritionTrackingCard - grid card for dashboard layout
      // ChartType.MOOD_CHART, // Removed - should be grid card in insights  
      ChartType.BMI_BODY_FAT,
      ChartType.HEALTH_RISK_CHART,
      // ChartType.STEPS_CHART, // Moved to grid cards to position next to Nutrition Analysis
      // ChartType.DOPAMINE, // Removed - should be grid card in insights
      // ChartType.VITAMIN_CONTENT, // Moved to grid cards for nutrition layout
      ChartType.DAILY_VALUE_PROGRESS // Full width for better horizontal bar display
    ];
    return fullWidthCharts.includes(chartType);
  };

  // Helper function to determine if a card should be full-width
  const isFullWidthCard = (chartType: ChartType): boolean => {
    const fullWidthCards = [
      ChartType.QUICK_INSIGHTS,
      ChartType.MEMBERS_CARD,
      // Add other card types that should be full-width here
    ];
    return fullWidthCards.includes(chartType);
  };

  // Generate comprehensive card list from all available charts
  const generateAllAvailableCards = (): CardData[] => {
    // Get all charts and filter out excluded ones
    const allCharts = getChartTypesByPriority();
    const filteredCharts = allCharts.filter(chartConfig => !excludeChartTypes.includes(chartConfig.type));
    
    console.log('🔍 HealthDashboardGrid - All available charts:', allCharts.length);
    console.log('🔍 HealthDashboardGrid - Excluded chart types:', excludeChartTypes);
    console.log('🔍 HealthDashboardGrid - Filtered charts:', filteredCharts.length);
    
    return filteredCharts.map((chartConfig) => ({
      id: `chart-${chartConfig.type}`,
      title: chartConfig.label,
      chartType: chartConfig.type,
      priority: chartConfig.priority,
      isAlwaysVisible: chartConfig.type === ChartType.QUICK_INSIGHTS,
    }));
  };

  // Determine which cards to display
  const getDisplayCards = (): CardData[] => {
    if (showAllCharts) {
      return generateAllAvailableCards();
    }
    
    if (cards.length > 0) {
      return cards;
    }
    
    // Default high-priority cards - ALL CHART TYPES INCLUDED
    return [
      // Priority 100: Always visible core components
      { id: 'card-1', title: 'Quick Insights', chartType: ChartType.QUICK_INSIGHTS, priority: 100 },
      
      // Priority 80-90: Essential health metrics
      { id: 'card-members', title: 'Awards & Achievements', chartType: ChartType.MEMBERS_CARD, priority: 95 },
      { id: 'card-2', title: 'BMI Analysis', chartType: ChartType.BMI_DOMAIN, priority: 90 },
      { id: 'card-3', title: 'Health Score', chartType: ChartType.HEALTH_SCORE, priority: 85 },
      { id: 'card-4', title: 'Health Risk Analysis', chartType: ChartType.HEALTH_RISK, priority: 80 },
      { id: 'card-26', title: 'Health Risk Chart', chartType: ChartType.HEALTH_RISK_CHART, priority: 81 },
      
      // Weight Management
      { id: 'card-5', title: 'Current Weight', chartType: ChartType.CURRENT_WEIGHT, priority: 75 },
      { id: 'card-6', title: 'Weight Trend', chartType: ChartType.WEIGHT_TREND, priority: 70 },
      { id: 'card-24', title: 'BMI & Body Fat', chartType: ChartType.BMI_BODY_FAT, priority: 73 },
      
      // Activity & Movement - Priority 60-70
      { id: 'card-7', title: 'Steps & Activity Trends', chartType: ChartType.ACTIVITY, priority: 67 },
      { id: 'card-9a', title: 'Steps Today', chartType: ChartType.STEPS_CHART, priority: 44 },
      { id: 'card-8', title: 'Active Minutes', chartType: ChartType.ACTIVE_MINUTES, priority: 65 },
      { id: 'card-9', title: 'Daily Steps', chartType: ChartType.STEPS, priority: 60 },
      
      // Sleep & Recovery
      { id: 'card-10', title: 'Sleep Analysis', chartType: ChartType.SLEEP, priority: 60 },
      { id: 'card-25', title: 'Sleep Patterns', chartType: ChartType.SLEEP_CHART, priority: 62 },
      
      // Cardiovascular Health
      { id: 'card-bp', title: 'Blood Pressure', chartType: ChartType.BLOOD_PRESSURE, priority: 65 },
      { id: 'card-hr', title: 'Heart Rate', chartType: ChartType.HEART_RATE, priority: 64 },
      
      // Mental Health & Neurotransmitters - Priority 30-40
      { id: 'card-11', title: 'Dopamine Tracking', chartType: ChartType.DOPAMINE, priority: 58 },
      { id: 'card-mood', title: 'Mood & Well-being', chartType: ChartType.MOOD_CHART, priority: 55 },
      
      // Nutrition & Diet - Priority 40-50
      { id: 'card-12', title: 'Hydration', chartType: ChartType.HYDRATION, priority: 55 },
      { id: 'card-hydration-chart', title: 'Hydration Chart', chartType: ChartType.HYDRATION_CHART, priority: 54 },
      { id: 'card-13', title: 'Calories', chartType: ChartType.CALORIES, priority: 50 },
      { id: 'card-calories-chart', title: 'Calories Chart', chartType: ChartType.CALORIES_CHART, priority: 51 },
      { id: 'card-15', title: 'Nutrition', chartType: ChartType.NUTRITION, priority: 45 },
      { id: 'card-nutrition-tracking', title: 'Nutrition Tracking', chartType: ChartType.NUTRITION_TRACKING, priority: 46 },
      { id: 'card-14', title: 'Nutrition Grade', chartType: ChartType.NUTRITION_GRADE_BADGE, priority: 48 },
      { id: 'card-16', title: 'Macronutrient Breakdown', chartType: ChartType.MACRONUTRIENTS, priority: 40 },
      
      // Nutrition Analysis
      { id: 'card-17', title: 'NOVA Score', chartType: ChartType.NOVA_SCORE, priority: 30 },
      { id: 'card-22', title: 'Vitamin Content', chartType: ChartType.VITAMIN_CONTENT, priority: 15 },
      { id: 'card-23', title: 'Daily Value Progress', chartType: ChartType.DAILY_VALUE_PROGRESS, priority: 10 },
      
      // Research & Evidence - Priority 20-30
      { id: 'card-18', title: 'Research Quality', chartType: ChartType.RESEARCH_QUALITY, priority: 25 },
      { id: 'card-19', title: 'Study Types', chartType: ChartType.STUDY_TYPE_DISTRIBUTION, priority: 25 },
      { id: 'card-20', title: 'Publication Timeline', chartType: ChartType.PUBLICATION_TIMELINE, priority: 22 },
      { id: 'card-21', title: 'Result Quality', chartType: ChartType.RESULT_QUALITY_PIE, priority: 20 },
    ];
  };

  const displayCards = getDisplayCards();
  const sortedCards = displayCards
    .sort((a, b) => (b.priority || 0) - (a.priority || 0))
    .slice(0, maxCards);

  // Separate items into different layout categories
  const fullWidthCardItems = sortedCards.filter(card => isFullWidthCard(card.chartType));
  const fullWidthChartItems = sortedCards.filter(card => isFullWidthChart(card.chartType));
  const gridCardItems = sortedCards.filter(card => !isFullWidthCard(card.chartType) && !isFullWidthChart(card.chartType));

  return (
    <div style={gridStyles.container}>
      {/* Full Width Cards (like Quick Insights) */}
      {fullWidthCardItems.length > 0 && (
        <div style={gridStyles.fullWidthCard}>
          {fullWidthCardItems.map(cardData => renderCard(cardData))}
        </div>
      )}

      {/* Grid Cards */}
      {gridCardItems.length > 0 && (
        isInsightsLayout && windowWidth >= 768 ? (
          // Special layout for insights: 3 cards on first row, 2 on second row
          <div style={gridStyles.insightsGrid}>
            {/* First row: 3 cards */}
            <div style={{ ...gridStyles.insightsRow, ...gridStyles.insightsFirstRow }}>
              {gridCardItems.slice(0, 3).map(cardData => renderCard(cardData))}
            </div>
            {/* Second row: 2 cards centered (if there are more than 3) */}
            {gridCardItems.length > 3 && (
              <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                width: '100%' 
              }}>
                <div style={{ ...gridStyles.insightsRow, ...gridStyles.insightsSecondRow }}>
                  {gridCardItems.slice(3, 5).map(cardData => renderCard(cardData))}
                </div>
              </div>
            )}
          </div>
        ) : isResearchLayout && windowWidth >= 768 ? (
          // Special layout for research: 2 cards per row
          <div style={gridStyles.researchGrid}>
            {/* First row: 2 cards */}
            <div style={gridStyles.researchRow}>
              {gridCardItems.slice(0, 2).map(cardData => renderCard(cardData))}
            </div>
            {/* Second row: 2 cards (if there are more than 2) */}
            {gridCardItems.length > 2 && (
              <div style={gridStyles.researchRow}>
                {gridCardItems.slice(2, 4).map(cardData => renderCard(cardData))}
              </div>
            )}
            {/* Additional rows if more cards */}
            {gridCardItems.length > 4 && (
              <div style={gridStyles.researchRow}>
                {gridCardItems.slice(4, 6).map(cardData => renderCard(cardData))}
              </div>
            )}
          </div>
        ) : isNutritionLayout && windowWidth >= 768 ? (
          // Special layout for nutrition: first row 3 cards, wide row for vitamin/nutrition analysis, other rows 2 cards each
          <div style={gridStyles.nutritionGrid}>
            {/* First row: 3 cards */}
            <div style={gridStyles.nutritionFirstRow}>
              {gridCardItems.slice(0, 3).map(cardData => renderCard(cardData))}
            </div>
            
            {/* Special wide row for Vitamin Content and Nutrition Analysis (taller cards side by side) */}
            {(() => {
              const vitaminCard = gridCardItems.find(card => card.chartType === ChartType.VITAMIN_CONTENT);
              const nutritionCard = gridCardItems.find(card => card.chartType === ChartType.NUTRITION);
              const wideRowCards = [vitaminCard, nutritionCard].filter(Boolean);
              
              if (wideRowCards.length > 0) {
                return (
                  <div style={gridStyles.nutritionWideRow}>
                    {wideRowCards.map(cardData => (
                      <div key={cardData.id} style={{ height: '500px' }}>
                        {renderCard(cardData, 500)}
                      </div>
                    ))}
                  </div>
                );
              }
              return null;
            })()}
            
            {/* Subsequent rows: 2 cards each (excluding the wide row cards) */}
            {(() => {
              const remainingCards = gridCardItems.slice(3).filter(card => 
                card.chartType !== ChartType.VITAMIN_CONTENT && card.chartType !== ChartType.NUTRITION
              );
              
              if (remainingCards.length > 0) {
                return Array.from({ length: Math.ceil(remainingCards.length / 2) }, (_, rowIndex) => (
                  <div key={`nutrition-row-${rowIndex}`} style={gridStyles.nutritionOtherRows}>
                    {remainingCards.slice(rowIndex * 2, (rowIndex + 1) * 2).map(cardData => renderCard(cardData))}
                  </div>
                ));
              }
              return null;
            })()}
          </div>
        ) : (
          // Default grid layout for non-insights/non-research or mobile
          <div style={{ 
            ...(isInsightsLayout || isResearchLayout || isNutritionLayout
              ? gridStyles.insightsGridMobile
              : gridStyles.chartsGrid
            ), 
            ...(className ? { className } : {}) 
          }}>
            {gridCardItems.map(cardData => renderCard(cardData))}
          </div>
        )
      )}

      {/* Full Width Charts (Mon-Sun pattern charts) */}
      {fullWidthChartItems.length > 0 && (
        <div style={gridStyles.fullWidthCard}>
          {fullWidthChartItems.map(cardData => renderCard(cardData))}
        </div>
      )}
    </div>
  );
};

export default HealthDashboardGrid;