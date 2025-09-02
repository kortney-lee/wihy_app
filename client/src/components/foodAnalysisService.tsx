// src/services/foodAnalysisService.ts
import axios from 'axios';

interface FoodAnalysisResult {
  classification: {
    foodName: string;
    confidence: number;
    category: string;
    portionSize?: string;
    alternatives?: string[];
  };
  nutrition: {
    calories: number;
    macros: {
      protein: number;
      carbs: number;
      fat: number;
      saturatedFat: number;
      sugar: number;
      fiber: number;
      sodium: number;
    };
    healthScore: number;
    novaClassification: 1 | 2 | 3 | 4;
    allergens: string[];
    snapEligible: boolean;
  };
  healthInsight: string;
  recommendations: string[];
}

// Add a type for the API response
interface AnalyzeImageResponse {
  foodName: string;
  name?: string;  // Alternative field name
  nutrition?: any;
  confidence?: number;
  // Add other fields as needed
}

const API_URL = 'http://localhost:5000/api';

export const foodAnalysisService = {
  // Analyze food image via API
  analyzeFoodImage: async (imageFile: File): Promise<string | FoodAnalysisResult | null> => {
    try {
      console.log("Analyzing food image:", imageFile.name);
      
      // For demo purposes: if filename contains "blueberry", treat as blueberry image
      if (imageFile.name.toLowerCase().includes("blueberr")) {
        console.log("Detected blueberries in image name");
      }
      
      // Mock API call with typed response
      const response = await axios.post<AnalyzeImageResponse>(
        `${API_URL}/analyze-image`, 
        {
          fileName: imageFile.name,
          foodName: imageFile.name.toLowerCase().includes("blueberr") ? "blueberries" : "Sample Food"
        }
      );
      
      console.log("Image analysis response:", response.data);
      
      // Return the food name for search or the whole analysis result
      if (response.data.foodName) {
        return response.data.foodName;
      } else if (response.data.name) {
        return response.data.name;
      } else {
        return JSON.stringify(response.data);
      }
    } catch (error) {
      console.error("Error analyzing food image:", error);
      throw error;
    }
  },

  // Fix the private method syntax - can't use 'private' keyword in object literals
  formatFoodAnalysisResults: function(analysis: FoodAnalysisResult): string {
    const { classification, nutrition, healthInsight, recommendations } = analysis;
    
    return `🍽️ **Food Analysis Results**

**📸 Detected Item:** ${classification.foodName}
**🎯 Confidence:** ${classification.confidence}%
**📂 Category:** ${classification.category}
${classification.portionSize ? `**📏 Portion Size:** ${classification.portionSize}` : ''}

**📊 Nutrition Facts (per serving):**
• **Calories:** ${nutrition.calories} kcal
• **Protein:** ${nutrition.macros.protein}g
• **Carbs:** ${nutrition.macros.carbs}g (${nutrition.macros.sugar}g sugar)
• **Fat:** ${nutrition.macros.fat}g (${nutrition.macros.saturatedFat}g saturated)
• **Fiber:** ${nutrition.macros.fiber}g
• **Sodium:** ${nutrition.macros.sodium}mg

**🎯 Health Score:** ${nutrition.healthScore}/100
**🏷️ Processing Level:** NOVA ${nutrition.novaClassification}
${nutrition.allergens.length > 0 ? `**⚠️ Potential Allergens:** ${nutrition.allergens.join(', ')}` : ''}
**💳 SNAP Eligible:** ${nutrition.snapEligible ? 'Yes ✅' : 'No ❌'}

**💡 Health Insight:**
${healthInsight}

**📋 Recommendations:**
${recommendations.map((rec: string) => `• ${rec}`).join('\n')}

**🔬 Sources:** AI Image Recognition, USDA FoodData Central, Nutritionix Database
*This analysis is for educational purposes. Consult healthcare professionals for medical advice.*`;
  }
};