/**
 * WIHY API Chart Integration Helper
 * Maps WIHY API responses to chart component props
 */

import { WIHYAskResponse } from '../types/wihyApi';
import { VitaminData } from '../components/charts/individual/VitaminContentChart';
import { PublicationData } from '../components/charts/cards/PublicationTimelineChart';
import { StudyTypeData } from '../components/charts/cards/StudyTypeDistributionChart';
import { NutrientProgress } from '../components/charts/individual/DailyValueProgressChart';

// Type for chart-ready data extracted from WIHY API
export interface ChartDataExtraction {
  // Priority 1: Essential Health Scoring Charts
  healthScore?: number;
  nutritionGrade?: string;
  nutritionScore?: number;
  researchQuality?: number;
  studyCount?: number;
  evidenceLevel?: 'I' | 'II' | 'III' | 'IV';
  macronutrients?: {
    protein: number;
    carbohydrates: number;
    fat: number;
  };
  
  // Priority 2: Core Analytics Charts
  vitamins?: VitaminData[];
  publications?: PublicationData[];
  studyTypes?: StudyTypeData[];
  dailyValues?: NutrientProgress[];
}

/**
 * Extract chart data from WIHY API response
 * Maps API response fields to chart component props
 */
export const extractChartData = (apiResponse: WIHYAskResponse): ChartDataExtraction => {
  const chartData: ChartDataExtraction = {};

  // Extract confidence as health score (0-100)
  if (apiResponse.confidence !== undefined) {
    chartData.healthScore = Math.round(apiResponse.confidence * 100);
  }

  // Map confidence to nutrition grade
  if (apiResponse.confidence !== undefined) {
    const score = apiResponse.confidence * 100;
    if (score >= 90) chartData.nutritionGrade = 'A+';
    else if (score >= 85) chartData.nutritionGrade = 'A';
    else if (score >= 80) chartData.nutritionGrade = 'B+';
    else if (score >= 75) chartData.nutritionGrade = 'B';
    else if (score >= 70) chartData.nutritionGrade = 'C+';
    else if (score >= 65) chartData.nutritionGrade = 'C';
    else if (score >= 60) chartData.nutritionGrade = 'D+';
    else if (score >= 50) chartData.nutritionGrade = 'D';
    else chartData.nutritionGrade = 'F';
    
    chartData.nutritionScore = Math.round(score);
  }

  // Research quality from source and confidence
  if (apiResponse.source && apiResponse.confidence) {
    const baseScore = apiResponse.confidence * 100;
    
    // Boost score based on source quality
    switch (apiResponse.source) {
      case 'azure_enhancer':
        chartData.researchQuality = Math.min(100, baseScore + 15);
        chartData.evidenceLevel = 'II'; // RCT level
        chartData.studyCount = Math.floor(Math.random() * 25) + 5; // Simulated
        break;
      case 'nova_enhancer':
        chartData.researchQuality = Math.min(100, baseScore + 10);
        chartData.evidenceLevel = 'III'; // Cohort level
        chartData.studyCount = Math.floor(Math.random() * 15) + 3;
        break;
      case 'openai_enhancer':
        chartData.researchQuality = baseScore;
        chartData.evidenceLevel = 'IV'; // Expert opinion
        chartData.studyCount = Math.floor(Math.random() * 10) + 1;
        break;
      default:
        chartData.researchQuality = Math.max(20, baseScore - 20);
        chartData.evidenceLevel = 'IV';
        chartData.studyCount = 1;
    }
  }

  // TODO: Extract actual macronutrient data from API response
  // For now, provide sample data structure
  chartData.macronutrients = {
    protein: 25,
    carbohydrates: 45,
    fat: 30
  };

  // Priority 2: Extract vitamin/mineral data
  chartData.vitamins = extractVitaminData(apiResponse);
  
  // Priority 2: Extract publication timeline
  chartData.publications = extractPublicationData(apiResponse);
  
  // Priority 2: Extract study type distribution
  chartData.studyTypes = extractStudyTypeData(apiResponse);
  
  // Priority 2: Extract daily value progress
  chartData.dailyValues = extractDailyValueData(apiResponse);

  return chartData;
};

/**
 * Extract vitamin/mineral content from WIHY API response
 */
const extractVitaminData = (apiResponse: WIHYAskResponse): VitaminData[] => {
  // TODO: Parse actual vitamin data from API response
  // For now, return sample data based on confidence level
  const confidence = apiResponse.confidence || 0.7;
  const baseMultiplier = confidence; // Higher confidence = better nutrition
  
  return [
    { name: 'Vitamin A', current: Math.round(900 * baseMultiplier), dailyValue: 900, percentage: Math.round(100 * baseMultiplier), unit: 'mcg' },
    { name: 'Vitamin C', current: Math.round(90 * baseMultiplier * 0.8), dailyValue: 90, percentage: Math.round(80 * baseMultiplier), unit: 'mg' },
    { name: 'Vitamin D', current: Math.round(20 * baseMultiplier * 0.6), dailyValue: 20, percentage: Math.round(60 * baseMultiplier), unit: 'mcg' },
    { name: 'Iron', current: Math.round(18 * baseMultiplier * 0.7), dailyValue: 18, percentage: Math.round(70 * baseMultiplier), unit: 'mg' },
    { name: 'Calcium', current: Math.round(1000 * baseMultiplier * 0.6), dailyValue: 1000, percentage: Math.round(60 * baseMultiplier), unit: 'mg' }
  ];
};

/**
 * Extract publication timeline from WIHY API response
 */
const extractPublicationData = (apiResponse: WIHYAskResponse): PublicationData[] => {
  // TODO: Parse actual publication dates from sources
  // For now, generate data based on source type
  const currentYear = new Date().getFullYear();
  const data: PublicationData[] = [];
  
  // Generate last 5 years of data
  for (let i = 4; i >= 0; i--) {
    const year = currentYear - i;
    const baseCount = apiResponse.source === 'azure_enhancer' ? 30 : 15;
    data.push({
      year,
      count: Math.floor(Math.random() * baseCount) + 5,
      studyTypes: {
        'Clinical Trial': Math.floor(Math.random() * 10) + 2,
        'Meta-Analysis': Math.floor(Math.random() * 5) + 1,
        'Observational': Math.floor(Math.random() * 15) + 3,
        'Review': Math.floor(Math.random() * 8) + 2,
        'Laboratory': Math.floor(Math.random() * 6) + 1
      }
    });
  }
  
  return data;
};

/**
 * Extract study type distribution from WIHY API response
 */
const extractStudyTypeData = (apiResponse: WIHYAskResponse): StudyTypeData[] => {
  // TODO: Parse actual study types from sources
  // Adjust distribution based on source quality
  const isHighQuality = apiResponse.source === 'azure_enhancer';
  
  return [
    { 
      type: 'Clinical Trials', 
      count: isHighQuality ? 25 : 15, 
      percentage: isHighQuality ? 35 : 25,
      evidenceLevel: 'high'
    },
    { 
      type: 'Meta-Analyses', 
      count: isHighQuality ? 15 : 8, 
      percentage: isHighQuality ? 20 : 15,
      evidenceLevel: 'high'
    },
    { 
      type: 'Observational Studies', 
      count: 20, 
      percentage: 30,
      evidenceLevel: 'medium'
    },
    { 
      type: 'Laboratory Studies', 
      count: isHighQuality ? 8 : 15, 
      percentage: isHighQuality ? 10 : 25,
      evidenceLevel: 'low'
    },
    { 
      type: 'Case Studies', 
      count: isHighQuality ? 3 : 8, 
      percentage: isHighQuality ? 5 : 15,
      evidenceLevel: 'low'
    }
  ];
};

/**
 * Extract daily value progress from WIHY API response
 */
const extractDailyValueData = (apiResponse: WIHYAskResponse): NutrientProgress[] => {
  // TODO: Parse actual nutrient data from API response
  // For now, generate based on confidence level
  const confidence = apiResponse.confidence || 0.7;
  const nutritionQuality = confidence; // Higher confidence = better nutrition
  
  return [
    { name: 'Protein', current: Math.round(60 * nutritionQuality), target: 60, percentage: Math.round(100 * nutritionQuality), unit: 'g', category: 'macronutrient', isEssential: true },
    { name: 'Vitamin A', current: Math.round(900 * nutritionQuality * 0.8), target: 900, percentage: Math.round(80 * nutritionQuality), unit: 'mcg', category: 'vitamin', isEssential: true },
    { name: 'Vitamin C', current: Math.round(90 * nutritionQuality * 0.7), target: 90, percentage: Math.round(70 * nutritionQuality), unit: 'mg', category: 'vitamin', isEssential: true },
    { name: 'Iron', current: Math.round(18 * nutritionQuality * 0.6), target: 18, percentage: Math.round(60 * nutritionQuality), unit: 'mg', category: 'mineral', isEssential: true },
    { name: 'Calcium', current: Math.round(1000 * nutritionQuality * 0.5), target: 1000, percentage: Math.round(50 * nutritionQuality), unit: 'mg', category: 'mineral', isEssential: true },
    { name: 'Fiber', current: Math.round(25 * nutritionQuality * 0.8), target: 25, percentage: Math.round(80 * nutritionQuality), unit: 'g', category: 'other', isEssential: true }
  ];
};

/**
 * Generate sample chart data for testing/demo purposes
 */
export const generateSampleChartData = (): ChartDataExtraction => {
  return {
    // Priority 1 data
    healthScore: Math.floor(Math.random() * 40) + 60, // 60-100
    nutritionGrade: ['A+', 'A', 'B+', 'B', 'C+', 'C'][Math.floor(Math.random() * 6)],
    nutritionScore: Math.floor(Math.random() * 30) + 70, // 70-100
    researchQuality: Math.floor(Math.random() * 40) + 60, // 60-100
    studyCount: Math.floor(Math.random() * 20) + 5, // 5-25
    evidenceLevel: (['I', 'II', 'III', 'IV'] as const)[Math.floor(Math.random() * 4)],
    macronutrients: {
      protein: Math.floor(Math.random() * 30) + 15, // 15-45
      carbohydrates: Math.floor(Math.random() * 40) + 30, // 30-70
      fat: Math.floor(Math.random() * 25) + 15, // 15-40
    },
    
    // Priority 2 data
    vitamins: generateSampleVitaminData(),
    publications: generateSamplePublicationData(),
    studyTypes: generateSampleStudyTypeData(),
    dailyValues: generateSampleDailyValueData()
  };
};

/**
 * Generate sample vitamin data
 */
const generateSampleVitaminData = (): VitaminData[] => {
  return [
    { name: 'Vitamin A', current: 720, dailyValue: 900, percentage: 80, unit: 'mcg' },
    { name: 'Vitamin C', current: 54, dailyValue: 90, percentage: 60, unit: 'mg' },
    { name: 'Vitamin D', current: 12, dailyValue: 20, percentage: 60, unit: 'mcg' },
    { name: 'Iron', current: 12.6, dailyValue: 18, percentage: 70, unit: 'mg' },
    { name: 'Calcium', current: 600, dailyValue: 1000, percentage: 60, unit: 'mg' }
  ];
};

/**
 * Generate sample publication data
 */
const generateSamplePublicationData = (): PublicationData[] => {
  const currentYear = new Date().getFullYear();
  const data: PublicationData[] = [];
  
  for (let i = 4; i >= 0; i--) {
    const year = currentYear - i;
    data.push({
      year,
      count: Math.floor(Math.random() * 50) + 10,
      studyTypes: {
        'Clinical Trial': Math.floor(Math.random() * 15) + 5,
        'Meta-Analysis': Math.floor(Math.random() * 8) + 2,
        'Observational': Math.floor(Math.random() * 20) + 5,
        'Review': Math.floor(Math.random() * 12) + 3,
        'Laboratory': Math.floor(Math.random() * 10) + 2
      }
    });
  }
  
  return data;
};

/**
 * Generate sample study type data
 */
const generateSampleStudyTypeData = (): StudyTypeData[] => {
  return [
    { type: 'Clinical Trials', count: 25, percentage: 35, evidenceLevel: 'high' },
    { type: 'Meta-Analyses', count: 15, percentage: 20, evidenceLevel: 'high' },
    { type: 'Observational Studies', count: 20, percentage: 30, evidenceLevel: 'medium' },
    { type: 'Laboratory Studies', count: 8, percentage: 10, evidenceLevel: 'low' },
    { type: 'Case Studies', count: 3, percentage: 5, evidenceLevel: 'low' }
  ];
};

/**
 * Generate sample daily value data
 */
const generateSampleDailyValueData = (): NutrientProgress[] => {
  return [
    { name: 'Protein', current: 45, target: 60, percentage: 75, unit: 'g', category: 'macronutrient', isEssential: true },
    { name: 'Vitamin A', current: 720, target: 900, percentage: 80, unit: 'mcg', category: 'vitamin', isEssential: true },
    { name: 'Vitamin C', current: 54, target: 90, percentage: 60, unit: 'mg', category: 'vitamin', isEssential: true },
    { name: 'Iron', current: 10.8, target: 18, percentage: 60, unit: 'mg', category: 'mineral', isEssential: true },
    { name: 'Calcium', current: 500, target: 1000, percentage: 50, unit: 'mg', category: 'mineral', isEssential: true },
    { name: 'Fiber', current: 20, target: 25, percentage: 80, unit: 'g', category: 'other', isEssential: true }
  ];
};

/**
 * Determine if chart data is sufficient for display
 */
export const hasValidChartData = (data: ChartDataExtraction): boolean => {
  return !!(
    // Priority 1 charts
    data.healthScore !== undefined ||
    data.nutritionGrade ||
    data.researchQuality !== undefined ||
    data.macronutrients ||
    
    // Priority 2 charts
    data.vitamins?.length ||
    data.publications?.length ||
    data.studyTypes?.length ||
    data.dailyValues?.length
  );
};

/**
 * Get chart display priority based on available data
 * Returns array of chart types to display in order of importance
 */
export const getChartDisplayPriority = (data: ChartDataExtraction): string[] => {
  const charts: string[] = [];
  
  // Priority 1: Essential Health Scoring Charts
  if (data.healthScore !== undefined) {
    charts.push('healthScore');
  }
  
  if (data.nutritionGrade) {
    charts.push('nutritionGrade');
  }
  
  if (data.macronutrients) {
    charts.push('macronutrients');
  }
  
  if (data.researchQuality !== undefined && data.researchQuality > 30) {
    charts.push('researchQuality');
  }
  
  // Priority 2: Core Analytics Charts
  if (data.vitamins?.length) {
    charts.push('vitamins');
  }
  
  if (data.dailyValues?.length) {
    charts.push('dailyValues');
  }
  
  if (data.studyTypes?.length) {
    charts.push('studyTypes');
  }
  
  if (data.publications?.length) {
    charts.push('publications');
  }
  
  return charts;
};

/**
 * Get available chart types for Priority 2
 */
export const getPriority2ChartTypes = (): string[] => {
  return ['vitamins', 'publications', 'studyTypes', 'dailyValues'];
};

/**
 * Check if Priority 2 chart data is available
 */
export const hasPriority2Data = (data: ChartDataExtraction): boolean => {
  return !!(
    data.vitamins?.length ||
    data.publications?.length ||
    data.studyTypes?.length ||
    data.dailyValues?.length
  );
};