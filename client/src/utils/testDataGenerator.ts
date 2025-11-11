/**
 * Test Data Generator for Local Development
 * Generates realistic sample data for all dashboard charts
 */

// Health Metrics Test Data
export const generateHealthMetrics = () => ({
  bmi: {
    value: 23.4,
    category: 'Normal',
    healthScore: 85,
    goal: 22.0,
    trend: 'stable',
    lastUpdated: new Date().toISOString()
  },
  weight: {
    current: 68.5,
    target: 65.0,
    unit: 'kg',
    trend: 'decreasing',
    weeklyChange: -0.3,
    history: Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
      weight: 68.5 + (Math.random() - 0.5) * 2
    }))
  },
  healthScore: {
    overall: 85,
    nutrition: 78,
    activity: 92,
    sleep: 81,
    hydration: 88
  },
  vitals: {
    heartRate: 72,
    bloodPressure: { systolic: 120, diastolic: 80 },
    temperature: 36.8,
    oxygenSaturation: 98
  }
});

// Activity Metrics Test Data
export const generateActivityMetrics = () => ({
  steps: {
    daily: 8543,
    goal: 10000,
    weeklyAverage: 8234,
    history: Array.from({ length: 7 }, (_, i) => ({
      date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
      steps: Math.floor(Math.random() * 5000) + 6000
    }))
  },
  activeMinutes: {
    daily: 45,
    goal: 60,
    weeklyTotal: 280,
    breakdown: {
      light: 120,
      moderate: 135,
      vigorous: 25
    }
  },
  calories: {
    burned: 2450,
    consumed: 2100,
    goal: 2200,
    deficit: 350,
    bmr: 1680
  },
  sleep: {
    duration: 7.5,
    quality: 82,
    deep: 1.8,
    rem: 1.2,
    light: 4.5,
    bedtime: '22:30',
    wakeup: '06:00'
  },
  hydration: {
    daily: 2.1,
    goal: 2.5,
    percentage: 84,
    history: Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      intake: Math.random() * 0.3
    }))
  }
});

// Nutrition Analysis Test Data
export const generateNutritionData = () => ({
  macronutrients: {
    carbohydrates: { value: 245, percentage: 45, goal: 275 },
    protein: { value: 128, percentage: 25, goal: 120 },
    fat: { value: 82, percentage: 30, goal: 85 }
  },
  micronutrients: {
    vitamins: {
      vitaminC: { value: 85, dv: 90, unit: 'mg' },
      vitaminD: { value: 15, dv: 20, unit: 'mcg' },
      vitaminB12: { value: 2.8, dv: 2.4, unit: 'mcg' },
      folate: { value: 320, dv: 400, unit: 'mcg' },
      vitaminA: { value: 720, dv: 900, unit: 'mcg' },
      vitaminE: { value: 12, dv: 15, unit: 'mg' }
    },
    minerals: {
      iron: { value: 14, dv: 18, unit: 'mg' },
      calcium: { value: 950, dv: 1000, unit: 'mg' },
      magnesium: { value: 280, dv: 400, unit: 'mg' },
      zinc: { value: 9, dv: 11, unit: 'mg' }
    }
  },
  foodQuality: {
    novaScore: 2.3,
    processed: 25,
    ultraProcessed: 15,
    whole: 60,
    organic: 35
  },
  meals: [
    {
      name: 'Breakfast',
      calories: 420,
      time: '07:30',
      foods: ['Oatmeal with berries', 'Greek yogurt', 'Almonds']
    },
    {
      name: 'Lunch', 
      calories: 650,
      time: '12:30',
      foods: ['Grilled chicken salad', 'Quinoa', 'Avocado']
    },
    {
      name: 'Dinner',
      calories: 580,
      time: '19:00',
      foods: ['Salmon', 'Brown rice', 'Steamed broccoli']
    }
  ]
});

// Research Quality Test Data
export const generateResearchData = () => ({
  qualityScore: 78,
  evidenceStrength: 'Moderate',
  studyTypes: [
    { type: 'Randomized Controlled Trial', count: 12, percentage: 40 },
    { type: 'Cohort Study', count: 8, percentage: 27 },
    { type: 'Meta-Analysis', count: 5, percentage: 17 },
    { type: 'Cross-Sectional', count: 3, percentage: 10 },
    { type: 'Case Study', count: 2, percentage: 6 }
  ],
  publications: Array.from({ length: 10 }, (_, i) => ({
    year: 2024 - i,
    count: Math.floor(Math.random() * 20) + 5,
    impact: Math.random() * 5 + 1
  })),
  sources: [
    { name: 'PubMed', count: 15, reliability: 95 },
    { name: 'Cochrane', count: 8, reliability: 98 },
    { name: 'Nature', count: 6, reliability: 92 },
    { name: 'JAMA', count: 4, reliability: 94 }
  ],
  qualityMetrics: {
    hasSpecificNumbers: true,
    hasReferences: true,
    isRecent: true,
    noContradictions: true,
    reliableSources: true,
    peerReviewed: 85
  }
});

// Health Risk Assessment Test Data
export const generateHealthRiskData = () => ({
  overallRisk: 'Low-Moderate',
  riskScore: 25,
  categories: [
    {
      category: 'Cardiovascular',
      risk: 'Low',
      score: 15,
      factors: ['Normal BMI', 'Regular exercise', 'No smoking'],
      recommendations: ['Maintain current activity level', 'Monitor blood pressure']
    },
    {
      category: 'Metabolic',
      risk: 'Moderate', 
      score: 35,
      factors: ['Family history', 'Occasional high sugar intake'],
      recommendations: ['Reduce processed sugars', 'Regular glucose monitoring']
    },
    {
      category: 'Nutritional',
      risk: 'Low',
      score: 20,
      factors: ['Varied diet', 'Good micronutrient intake'],
      recommendations: ['Continue balanced eating', 'Consider B12 supplement']
    }
  ],
  lifestyle: {
    exercise: 'Good',
    diet: 'Very Good',
    sleep: 'Good',
    stress: 'Moderate',
    smoking: 'Never',
    alcohol: 'Moderate'
  }
});

// Generate complete test data for dashboard
export const generateCompleteTestData = () => {
  const healthMetrics = generateHealthMetrics();
  const activityMetrics = generateActivityMetrics();
  const nutritionData = generateNutritionData();
  const researchData = generateResearchData();
  const healthRiskData = generateHealthRiskData();

  return {
    // API Response structure
    success: true,
    data: {
      ai_response: {
        response: `Based on your health profile, here's your comprehensive analysis:

**Health Overview:**
- BMI: ${healthMetrics.bmi.value} (${healthMetrics.bmi.category})
- Overall Health Score: ${healthMetrics.healthScore.overall}/100
- Daily Steps: ${activityMetrics.steps.daily} (Goal: ${activityMetrics.steps.goal})

**Nutrition Highlights:**
- Calorie Balance: ${activityMetrics.calories.deficit > 0 ? 'Deficit' : 'Surplus'} of ${Math.abs(activityMetrics.calories.deficit)} calories
- Protein Intake: ${nutritionData.macronutrients.protein.value}g (${nutritionData.macronutrients.protein.percentage}% of total)
- Food Quality Score: ${nutritionData.foodQuality.novaScore}/5 (Lower is better)

**Key Recommendations:**
1. Maintain your current activity level - you're doing great with ${activityMetrics.activeMinutes.daily} active minutes daily
2. Consider increasing water intake to reach your ${activityMetrics.hydration.goal}L daily goal
3. Focus on whole foods - currently ${nutritionData.foodQuality.whole}% of your diet
4. Keep up the good sleep habits with ${activityMetrics.sleep.duration} hours nightly

**Research Quality:** This analysis is based on ${researchData.sources.reduce((sum, s) => sum + s.count, 0)} peer-reviewed studies with an evidence strength rating of "${researchData.evidenceStrength}".`,
        metadata: {
          confidence: 0.87,
          sources: researchData.sources.length,
          lastUpdated: new Date().toISOString()
        }
      },
      analysis: {
        health_metrics: healthMetrics,
        activity_metrics: activityMetrics,
        nutrition_data: nutritionData,
        research_quality: researchData,
        health_risk: healthRiskData
      }
    },
    // Additional properties for compatibility
    query: 'Health Dashboard Analysis',
    timestamp: new Date().toISOString(),
    dataSource: 'test_generator'
  };
};

// Quick test data for specific queries
export const getTestDataForQuery = (query: string) => {
  const lowerQuery = query.toLowerCase();
  
  if (lowerQuery.includes('bmi') || lowerQuery.includes('weight')) {
    return {
      ...generateCompleteTestData(),
      query,
      focus: 'bmi_weight'
    };
  }
  
  if (lowerQuery.includes('nutrition') || lowerQuery.includes('diet') || lowerQuery.includes('food')) {
    return {
      ...generateCompleteTestData(),
      query,
      focus: 'nutrition'
    };
  }
  
  if (lowerQuery.includes('exercise') || lowerQuery.includes('activity') || lowerQuery.includes('steps')) {
    return {
      ...generateCompleteTestData(),
      query,
      focus: 'activity'
    };
  }
  
  if (lowerQuery.includes('sleep') || lowerQuery.includes('rest')) {
    return {
      ...generateCompleteTestData(),
      query,
      focus: 'sleep'
    };
  }
  
  // Default comprehensive test data
  return generateCompleteTestData();
};

// Check if we're in development mode
export const isLocalDevelopment = () => {
  return process.env.NODE_ENV === 'development' || 
         process.env.REACT_APP_USE_TEST_DATA === 'true' ||
         window.location.hostname === 'localhost';
};