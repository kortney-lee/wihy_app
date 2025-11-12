import React from 'react';
import { ChartType } from './chartTypes';

// Individual Charts
import ActivityChart from './individual/ActivityChart';
import WeightTrendChart from './individual/WeightTrendChart';
import SleepChart from './individual/SleepChart';
import BMIBodyFatChart from './individual/BMIBodyFatChart';
import DopamineChart from './individual/DopamineChart';
import HealthRiskChart from './individual/HealthRiskChart';
import HydrationChart from './individual/HydrationChart';
import NutritionTrackingCard from './individual/NutritionTrackingCard';
import CaloriesChart from './individual/CaloriesChart';
import HeartRateChart from './individual/HeartRateChart';
import MoodChart from './individual/MoodChart';
import NovaChart from './cards/NovaChart';
import NutritionChart from './cards/NutritionChart';
import VitaminContentChart from './individual/VitaminContentChart';
import PublicationTimelineChart from './cards/PublicationTimelineChart';
import StudyTypeDistributionChart from './cards/StudyTypeDistributionChart';
import DailyValueProgressChart from './individual/DailyValueProgressChart';
import MacronutrientPieChart from './cards/MacronutrientPieChart';
import ResultQualityPie from './cards/ResultQualityPie';
import HealthScoreGauge from './individual/HealthScoreGauge';
import ResearchQualityGauge from './cards/ResearchQualityGauge';
import NutritionGradeBadge from './cards/NutritionGradeBadge';

// Cards (Dashboard components)
import QuickInsights from './cards/QuickInsights';
import GenericHealthCard from './cards/GenericHealthCard';

// Individual Health Cards (moved to individual)
import CurrentWeightCard from './individual/CurrentWeightCard';
import CaloriesCard from './individual/CaloriesCard';
import StepsCard from './individual/StepsCard';
import StepsChart from './individual/StepsChart';
import SleepCard from './individual/SleepCard';
import HydrationCard from './individual/HydrationCard';
import ActiveMinutesCard from './individual/ActiveMinutesCard';
import BMIDomainCard from './individual/BMIDomainCard';
import HealthRiskCard from './individual/HealthRiskCard';
import NutritionAnalysisCard from './individual/NutritionAnalysisCard';
import BloodPressureChart from './individual/BloodPressureChart';
import MembersCard from './individual/MembersCard';

/**
 * Chart component registry - maps chart types to their React components
 */
export const CHART_COMPONENT_REGISTRY: Record<ChartType, React.ComponentType<any>> = {
  [ChartType.QUICK_INSIGHTS]: QuickInsights,
  [ChartType.BMI_DOMAIN]: BMIDomainCard,
  [ChartType.HEALTH_RISK]: HealthRiskCard,
  [ChartType.HEALTH_SCORE]: HealthScoreGauge,
  [ChartType.CURRENT_WEIGHT]: CurrentWeightCard,
  [ChartType.WEIGHT_TREND]: WeightTrendChart,
  [ChartType.ACTIVITY]: ActivityChart,
  [ChartType.STEPS]: StepsCard,
  [ChartType.STEPS_CHART]: StepsChart,
  [ChartType.ACTIVE_MINUTES]: ActiveMinutesCard,
  [ChartType.SLEEP]: SleepCard,
  [ChartType.HYDRATION]: HydrationCard,
  [ChartType.HYDRATION_CHART]: HydrationChart,
  [ChartType.BLOOD_PRESSURE]: BloodPressureChart,
  [ChartType.HEART_RATE]: HeartRateChart,
  [ChartType.CALORIES]: CaloriesCard,
  [ChartType.CALORIES_CHART]: CaloriesChart,
  [ChartType.DOPAMINE]: DopamineChart,
  [ChartType.MOOD_CHART]: MoodChart,
  [ChartType.MEMBERS_CARD]: MembersCard,
  [ChartType.NUTRITION]: NutritionAnalysisCard,
  [ChartType.NUTRITION_TRACKING]: NutritionTrackingCard,
  [ChartType.MACRONUTRIENTS]: MacronutrientPieChart,
  [ChartType.NOVA_SCORE]: NovaChart,
  [ChartType.RESEARCH_QUALITY]: ResearchQualityGauge,
  [ChartType.PUBLICATION_TIMELINE]: PublicationTimelineChart,
  [ChartType.VITAMIN_CONTENT]: VitaminContentChart,
  [ChartType.DAILY_VALUE_PROGRESS]: DailyValueProgressChart,
  [ChartType.STUDY_TYPE_DISTRIBUTION]: StudyTypeDistributionChart,
  [ChartType.RESULT_QUALITY_PIE]: ResultQualityPie,
  [ChartType.BMI_BODY_FAT]: BMIBodyFatChart,
  [ChartType.SLEEP_CHART]: SleepChart,
  [ChartType.HEALTH_RISK_CHART]: HealthRiskChart,
  [ChartType.NUTRITION_GRADE_BADGE]: NutritionGradeBadge,
};

/**
 * Alternative chart components for detailed views
 */
export const DETAILED_CHART_REGISTRY: Record<ChartType, React.ComponentType<any>> = {
  [ChartType.QUICK_INSIGHTS]: QuickInsights,
  [ChartType.BMI_DOMAIN]: BMIBodyFatChart,
  [ChartType.HEALTH_RISK]: HealthRiskChart,
  [ChartType.HEALTH_SCORE]: HealthScoreGauge,
  [ChartType.CURRENT_WEIGHT]: CurrentWeightCard,
  [ChartType.WEIGHT_TREND]: WeightTrendChart,
  [ChartType.ACTIVITY]: ActivityChart,
  [ChartType.STEPS]: ActivityChart,
  [ChartType.STEPS_CHART]: StepsChart,
  [ChartType.ACTIVE_MINUTES]: ActivityChart,
  [ChartType.SLEEP]: SleepChart,
  [ChartType.HYDRATION]: HydrationChart,
  [ChartType.HYDRATION_CHART]: HydrationChart,
  [ChartType.BLOOD_PRESSURE]: BloodPressureChart,
  [ChartType.HEART_RATE]: HeartRateChart,
  [ChartType.CALORIES]: CaloriesChart,
  [ChartType.CALORIES_CHART]: CaloriesChart,
  [ChartType.DOPAMINE]: DopamineChart,
  [ChartType.MOOD_CHART]: MoodChart,
  [ChartType.MEMBERS_CARD]: MembersCard,
  [ChartType.NUTRITION]: NutritionChart,
  [ChartType.NUTRITION_TRACKING]: NutritionTrackingCard,
  [ChartType.MACRONUTRIENTS]: MacronutrientPieChart,
  [ChartType.NOVA_SCORE]: NovaChart,
  [ChartType.RESEARCH_QUALITY]: ResearchQualityGauge,
  [ChartType.PUBLICATION_TIMELINE]: PublicationTimelineChart,
  [ChartType.VITAMIN_CONTENT]: VitaminContentChart,
  [ChartType.DAILY_VALUE_PROGRESS]: DailyValueProgressChart,
  [ChartType.STUDY_TYPE_DISTRIBUTION]: StudyTypeDistributionChart,
  [ChartType.RESULT_QUALITY_PIE]: ResultQualityPie,
  [ChartType.BMI_BODY_FAT]: BMIBodyFatChart,
  [ChartType.SLEEP_CHART]: SleepChart,
  [ChartType.HEALTH_RISK_CHART]: HealthRiskChart,
  [ChartType.NUTRITION_GRADE_BADGE]: NutritionGradeBadge,
};

/**
 * Get the appropriate chart component for a given chart type
 */
export function getChartComponent(
  chartType: ChartType, 
  isDetailed: boolean = false
): React.ComponentType<any> {
  const registry = isDetailed ? DETAILED_CHART_REGISTRY : CHART_COMPONENT_REGISTRY;
  return registry[chartType] || GenericHealthCard;
}

/**
 * Check if a chart type has a component available
 */
export function hasChartComponent(chartType: ChartType): boolean {
  return chartType in CHART_COMPONENT_REGISTRY;
}

/**
 * Get all available chart types that have components
 */
export function getAvailableChartTypes(): ChartType[] {
  return Object.keys(CHART_COMPONENT_REGISTRY) as ChartType[];
}