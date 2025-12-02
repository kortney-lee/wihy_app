// Card Components Export (Dashboard-style components)
export { default as GenericHealthCard } from './GenericHealthCard';
export { default as QuickInsights } from './QuickInsights';

// General Chart Cards (can be used as standalone components or in dashboards)
export { default as MacronutrientPieChart } from './MacronutrientPieChart';
export { default as NovaChart } from './NovaChart';
export { default as ResultQualityPie } from './ResultQualityPie';
export { default as NutritionChart } from './NutritionChart';
export { default as ResearchQualityGauge } from './ResearchQualityGauge';
export { default as NutritionGradeBadge } from './NutritionGradeBadge';

// Demo versions (for AboutPage, examples, static demos)
export { default as StudyTypeDistributionChartDemo } from './StudyTypeDistributionChart';
export { default as PublicationTimelineChartDemo } from './PublicationTimelineChart';

// Research-specific components (for ResearchPanel, HealthDashboardGrid)
export { default as ResearchQualityPie } from './ResearchQualityPie';
export { default as ResearchStudyTypeDistribution } from './ResearchStudyTypeDistribution';
export { default as ResearchPublicationTimeline } from './ResearchPublicationTimeline';

// Note: Individual health metric components in ../individual/
// These include: ActiveMinutesCard, BMIDomainCard, CaloriesCard, CurrentWeightCard, 
// HealthRiskCard, HydrationCard, NutritionAnalysisCard, SleepCard, StepsCard