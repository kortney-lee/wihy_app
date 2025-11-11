// === INDIVIDUAL CHARTS ===
export { default as ActivityChart } from './individual/ActivityChart';
export { default as WeightTrendChart } from './individual/WeightTrendChart';
export { default as SleepChart } from './individual/SleepChart';
export { default as BMIBodyFatChart } from './individual/BMIBodyFatChart';
export { default as NovaChart } from './cards/NovaChart';
export { default as NutritionChart } from './cards/NutritionChart';
export { default as ResultQualityPie } from './cards/ResultQualityPie';
export { default as DopamineChart } from './individual/DopamineChart';
export { default as HealthRiskChart } from './individual/HealthRiskChart';

// Priority 1: Essential Health Scoring Charts
export { default as HealthScoreGauge } from './individual/HealthScoreGauge';
export { default as NutritionGradeBadge } from './cards/NutritionGradeBadge';
export { default as ResearchQualityGauge } from './cards/ResearchQualityGauge';
export { default as MacronutrientPieChart } from './cards/MacronutrientPieChart';

// Priority 2: Core Analytics Charts
export { default as VitaminContentChart } from './individual/VitaminContentChart';
export { default as PublicationTimelineChart } from './cards/PublicationTimelineChart';
export { default as StudyTypeDistributionChart } from './cards/StudyTypeDistributionChart';
export { default as DailyValueProgressChart } from './individual/DailyValueProgressChart';

// === NEW RECHARTS COMPONENTS ===
export { default as BloodPressureChart } from './individual/BloodPressureChart';
export { default as CaloriesChart } from './individual/CaloriesChart';
export { default as ExerciseChart } from './individual/ExerciseChart';
export { default as HeartRateChart } from './individual/HeartRateChart';
export { default as HydrationChart } from './individual/HydrationChart';
export { default as MoodChart } from './individual/MoodChart';
export { default as NutritionTrackingCard } from './individual/NutritionTrackingCard';
export { default as ProgressRing } from './individual/ProgressRing';
export { default as StepsChart } from './individual/StepsChart';

// === CARDS ===
export { default as CurrentWeightCard } from './individual/CurrentWeightCard';
export { default as CaloriesCard } from './individual/CaloriesCard';
export { default as StepsCard } from './individual/StepsCard';
export { default as SleepCard } from './individual/SleepCard';
export { default as HydrationCard } from './individual/HydrationCard';
export { default as ActiveMinutesCard } from './individual/ActiveMinutesCard';
export { default as BMIDomainCard } from './individual/BMIDomainCard';
export { default as HealthRiskCard } from './individual/HealthRiskCard';
export { default as NutritionAnalysisCard } from './individual/NutritionAnalysisCard';
export { default as QuickInsights } from './cards/QuickInsights';
export { default as GenericHealthCard } from './cards/GenericHealthCard';

// === GRIDS ===
export { default as HealthDashboardGrid } from './grids/HealthDashboardGrid';
export { default as DashboardCharts } from './grids/DashboardCharts';

// === CONFIGURATION AND UTILITIES ===
export * from './chartTypes';
export * from './cardConfig';
export * from './dynamicApiMapping';
export * from './chartRegistry';