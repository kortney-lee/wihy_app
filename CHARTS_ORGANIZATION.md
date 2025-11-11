# Charts Directory Organization Guide

This document outlines the new organized structure of the charts directory and explains the purpose of each component type.

## Directory Structure

```
src/components/charts/
├── cards/                          # Card-based components for dashboard display
├── grids/                          # Grid layout components and dashboard containers
├── individual/                     # Standalone chart components
├── chartTypes.ts                   # Chart type definitions and configurations
├── cardConfig.ts                   # Card configuration utilities
├── chartRegistry.tsx               # Component registry for dynamic chart loading
├── apiMapping.ts                   # API mapping configurations
├── dynamicApiMapping.ts            # Dynamic API mapping utilities
└── index.ts                        # Main export file
```

## Component Categories

### Cards (`/cards/`)
Card components are designed for dashboard display with consistent styling and compact presentation:
- `QuickInsights.tsx` - Essential health overview and navigation
- `BMIDomainCard.tsx` - BMI analysis card
- `HealthRiskCard.tsx` - Health risk assessment card
- `StepsCard.tsx` - Daily steps tracking card
- `CaloriesCard.tsx` - Calorie intake/burn card
- `SleepCard.tsx` - Sleep quality and duration card
- `HydrationCard.tsx` - Water intake tracking card
- `ActiveMinutesCard.tsx` - Exercise minutes card
- `CurrentWeightCard.tsx` - Current weight display card
- `NutritionAnalysisCard.tsx` - Nutrition overview card
- `GenericHealthCard.tsx` - Fallback generic card template

### Grids (`/grids/`)
Grid components manage layout and orchestrate multiple charts:
- `HealthDashboardGrid.tsx` - Main dashboard grid with all available charts
- `DashboardCharts.tsx` - Legacy dashboard layout (individual chart sections)

### Individual Charts (`/individual/`)
Standalone chart components for detailed analysis and full-size display:
- `ActivityChart.tsx` - Comprehensive activity visualization
- `WeightTrendChart.tsx` - Weight progression over time
- `SleepChart.tsx` - Detailed sleep pattern analysis
- `BMIBodyFatChart.tsx` - Body composition visualization
- `DopamineChart.tsx` - Dopamine level tracking
- `HealthRiskChart.tsx` - Detailed health risk assessment
- `NovaChart.tsx` - NOVA food processing classification
- `NutritionChart.tsx` - Comprehensive nutrition analysis
- `VitaminContentChart.tsx` - Vitamin and mineral content
- `PublicationTimelineChart.tsx` - Research publication timeline
- `StudyTypeDistributionChart.tsx` - Research study type distribution
- `DailyValueProgressChart.tsx` - Daily nutritional value progress
- `MacronutrientPieChart.tsx` - Macronutrient distribution pie chart
- `ResultQualityPie.tsx` - Research result quality visualization
- `HealthScoreGauge.tsx` - Health score gauge display
- `ResearchQualityGauge.tsx` - Research quality scoring
- `NutritionGradeBadge.tsx` - Nutrition grade badge display

## Usage Guidelines

### When to Use Cards vs Individual Charts

**Use Cards when:**
- Displaying multiple metrics in a dashboard
- Need compact, consistent presentation
- Building overview/summary interfaces
- Limited space requirements

**Use Individual Charts when:**
- Detailed analysis is required
- Full-screen chart display needed
- Interactive exploration of data
- Presentation or reporting contexts

### Component Selection

The `chartRegistry.tsx` provides automatic component selection:
```typescript
import { getChartComponent } from '../chartRegistry';

// Get card version of a chart
const CardComponent = getChartComponent(ChartType.STEPS, false);

// Get detailed version of a chart
const DetailedComponent = getChartComponent(ChartType.STEPS, true);
```

### Chart Types and Priorities

Charts are organized by priority (higher numbers display first):
- **Priority 100**: Quick Insights (always visible)
- **Priority 80-90**: Essential health metrics (BMI, Health Risk, Weight)
- **Priority 60-70**: Activity and lifestyle (Steps, Sleep, Activity)
- **Priority 40-50**: Nutrition and diet (Calories, Nutrition, Macros)
- **Priority 20-30**: Research and analysis (NOVA, Research Quality)
- **Priority 10**: Supplementary analytics (Vitamins, Daily Values)

### Categories

Charts are categorized for filtering and organization:
- **health**: Core health metrics and assessments
- **activity**: Physical activity and lifestyle tracking
- **nutrition**: Diet and nutrition analysis
- **research**: Scientific research and evidence
- **analysis**: Advanced analytics and derived metrics

## Integration Examples

### Basic Dashboard
```tsx
import { HealthDashboardGrid } from '../components/charts';

// Display default high-priority charts
<HealthDashboardGrid />

// Display all available charts
<HealthDashboardGrid showAllCharts={true} maxCards={16} />
```

### Custom Card Configuration
```tsx
import { CardData, ChartType } from '../components/charts';

const customCards: CardData[] = [
  {
    id: 'my-steps',
    title: 'Daily Steps',
    chartType: ChartType.STEPS,
    priority: 100
  }
];

<HealthDashboardGrid cards={customCards} />
```

### Individual Chart Usage
```tsx
import { ActivityChart } from '../components/charts';

<ActivityChart period="week" chartType="steps" />
```

## Migration Notes

- All chart imports should be updated to use the new directory structure
- The main `index.ts` exports all components with their new paths
- Legacy imports will continue to work through the barrel exports
- Component props and APIs remain unchanged

## Future Enhancements

- Add lazy loading for better performance
- Implement chart configuration persistence
- Add chart filtering and search capabilities
- Create themed chart variants
- Add chart export/sharing functionality