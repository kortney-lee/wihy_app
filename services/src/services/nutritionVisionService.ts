import { getPool, sql } from '../config/database';
import vision from '@google-cloud/vision';
import OpenAI from 'openai';

// Initialize clients
const googleVisionClient = new vision.ImageAnnotatorClient({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Type definitions
interface VisionAnalysisResult {
  success: boolean;
  foodName: string;
  confidence: number;
  tags: string[];
  provider: string;
  error?: string;
  googleResult?: GoogleVisionResult;
  openaiResult?: OpenAIVisionResult;
  comparison?: ComparisonResult;
}

interface GoogleVisionResult {
  success: boolean;
  foodName: string;
  confidence: number;
  allLabels: Array<{ name: string; confidence: number }>;
  provider: string;
  error?: string;
}

interface OpenAIVisionResult {
  success: boolean;
  foodName: string;
  confidence: number;
  description?: string;
  tags: string[];
  provider: string;
  rawResponse?: string;
  error?: string;
}

interface ComparisonResult {
  match: boolean;
  googleConfidence: number;
  openaiConfidence: number;
  finalChoice: string;
  reasoning: string;
}

interface NutritionData {
  success: boolean;
  item?: string;
  calories_per_serving?: number;
  macros?: {
    protein: string;
    carbs: string;
    fat: string;
  };
  processed_level?: string;
  verdict?: string;
  snap_eligible?: boolean;
  message?: string;
}

interface ProcessedImageResult {
  success: boolean;
  analysis?: VisionAnalysisResult;
  nutrition?: NutritionData;
  timestamp?: string;
  message?: string;
}

interface SaveResult {
  success: boolean;
  message: string;
}

// Utility functions
const handleError = (error: unknown): string => {
  return error instanceof Error ? error.message : 'Unknown error occurred';
};

// Google Vision API analysis
const analyzeWithGoogle = async (imageBuffer: Buffer): Promise<GoogleVisionResult> => {
  try {
    console.log('🔍 Analyzing with Google Vision API...');
    
    const [result] = await googleVisionClient.labelDetection({
      image: { content: imageBuffer },
    });

    const labels = result.labelAnnotations || [];
    console.log('Google Vision labels:', labels.map(l => `${l.description} (${l.score})`));

    // Look for food-related labels with better filtering
    const foodKeywords = ['food', 'fruit', 'vegetable', 'meal', 'dish', 'produce', 'ingredient'];
    const foodLabels = labels.filter(label => 
      foodKeywords.some(keyword => 
        label.description?.toLowerCase().includes(keyword)
      )
    );

    const bestLabel = foodLabels.length > 0 ? foodLabels[0] : labels[0];
    
    return {
      success: true,
      foodName: bestLabel?.description || 'Unknown Food',
      confidence: bestLabel?.score || 0,
      allLabels: labels.slice(0, 5).map(l => ({
        name: l.description || '',
        confidence: l.score || 0
      })),
      provider: 'google'
    };
  } catch (error: unknown) {
    console.error('Google Vision analysis failed:', error);
    return {
      success: false,
      foodName: 'Unknown Food',
      confidence: 0,
      allLabels: [],
      provider: 'google',
      error: handleError(error)
    };
  }
};

// OpenAI Vision API analysis
const analyzeWithOpenAI = async (imageBuffer: Buffer): Promise<OpenAIVisionResult> => {
  try {
    console.log('🔍 Analyzing with OpenAI Vision API...');
    
    const base64Image = imageBuffer.toString('base64');
    
    const response = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "user",
          content: [
            { 
              type: "text", 
              text: "Analyze this image and identify the main food item. Respond with JSON format: {\"foodName\": \"item name\", \"confidence\": 0.9, \"description\": \"brief description\", \"tags\": [\"tag1\", \"tag2\"]}" 
            },
            { 
              type: "image_url", 
              image_url: { url: `data:image/jpeg;base64,${base64Image}` } 
            }
          ],
        },
      ],
      max_tokens: 300,
    });

    const content = response.choices[0]?.message?.content;
    console.log('OpenAI raw response:', content);

    // Parse JSON response with fallback
    let parsedResult: any;
    try {
      parsedResult = JSON.parse(content || '{}');
    } catch (parseError) {
      parsedResult = {
        foodName: content?.split('\n')[0] || 'Unknown Food',
        confidence: 0.7,
        description: content,
        tags: []
      };
    }

    return {
      success: true,
      foodName: parsedResult.foodName || 'Unknown Food',
      confidence: parsedResult.confidence || 0.7,
      description: parsedResult.description,
      tags: Array.isArray(parsedResult.tags) ? parsedResult.tags : [],
      provider: 'openai',
      rawResponse: content || ''
    };
  } catch (error: unknown) {
    console.error('OpenAI Vision analysis failed:', error);
    return {
      success: false,
      foodName: 'Unknown Food',
      confidence: 0,
      tags: [],
      provider: 'openai',
      error: handleError(error)
    };
  }
};

// Compare results and choose best option
const compareResults = (googleResult: GoogleVisionResult, openaiResult: OpenAIVisionResult): ComparisonResult => {
  const googleFood = googleResult.foodName?.toLowerCase() || '';
  const openaiFood = openaiResult.foodName?.toLowerCase() || '';
  
  // Check if results match
  const match = googleFood.includes(openaiFood) || 
                openaiFood.includes(googleFood) ||
                googleFood === openaiFood;

  let finalChoice = '';
  let reasoning = '';

  if (match) {
    // Results agree - choose higher confidence
    if (googleResult.confidence > openaiResult.confidence) {
      finalChoice = googleResult.foodName;
      reasoning = 'Both APIs agree, Google had higher confidence';
    } else {
      finalChoice = openaiResult.foodName;
      reasoning = 'Both APIs agree, OpenAI had higher confidence';
    }
  } else {
    // Results differ - use weighted scoring
    const googleScore = googleResult.confidence * 0.6; // Google good at labels
    const openaiScore = openaiResult.confidence * 0.8; // OpenAI better at context

    if (openaiScore > googleScore) {
      finalChoice = openaiResult.foodName;
      reasoning = 'Results differ, chose OpenAI based on context analysis';
    } else {
      finalChoice = googleResult.foodName;
      reasoning = 'Results differ, chose Google based on label detection';
    }
  }

  return {
    match,
    googleConfidence: googleResult.confidence,
    openaiConfidence: openaiResult.confidence,
    finalChoice,
    reasoning
  };
};

// Generate mock nutrition data
const generateMockNutritionData = (query: string): NutritionData => {
  const mockDatabase: Record<string, Omit<NutritionData, 'success' | 'item'>> = {
    'apple': {
      calories_per_serving: 95,
      macros: { protein: '0.5g', carbs: '25g', fat: '0.3g' },
      processed_level: 'unprocessed',
      verdict: 'Fresh fruit, excellent source of fiber and vitamin C',
      snap_eligible: true
    },
    'banana': {
      calories_per_serving: 105,
      macros: { protein: '1.3g', carbs: '27g', fat: '0.4g' },
      processed_level: 'unprocessed',
      verdict: 'Fresh fruit, good source of potassium',
      snap_eligible: true
    },
    'bread': {
      calories_per_serving: 80,
      macros: { protein: '3g', carbs: '15g', fat: '1g' },
      processed_level: 'processed',
      verdict: 'Processed grain product, check ingredients for whole grains',
      snap_eligible: true
    },
    'chicken': {
      calories_per_serving: 165,
      macros: { protein: '31g', carbs: '0g', fat: '3.6g' },
      processed_level: 'minimally processed',
      verdict: 'Lean protein source, good for muscle building',
      snap_eligible: true
    }
  };
  
  // Find matching food item
  const lowerQuery = query.toLowerCase();
  const matchedKey = Object.keys(mockDatabase).find(key => 
    lowerQuery.includes(key) || key.includes(lowerQuery)
  );
  
  const baseData = matchedKey ? mockDatabase[matchedKey] : {
    calories_per_serving: 150,
    macros: { protein: '5g', carbs: '20g', fat: '3g' },
    processed_level: 'unknown',
    verdict: 'Nutrition information estimated',
    snap_eligible: false
  };
  
  return {
    success: true,
    item: query,
    ...baseData
  };
};

// Database operations
const fetchNutritionFromDatabase = async (query: string): Promise<NutritionData> => {
  try {
    const pool = getPool();
    const request = pool.request();
    request.input('query', sql.VarChar, query);
    
    const result = await request.query(`
      SELECT TOP 1 * FROM dbo.NutritionData 
      WHERE barcode = @query 
         OR itemName LIKE '%' + @query + '%'
         OR LOWER(itemName) LIKE '%' + LOWER(@query) + '%'
      ORDER BY 
        CASE 
          WHEN barcode = @query THEN 1
          WHEN itemName = @query THEN 2
          ELSE 3
        END
    `);
    
    if (result.recordset && result.recordset.length > 0) {
      const data = result.recordset[0];
      
      return {
        success: true,
        item: data.itemName || query,
        calories_per_serving: data.calories || 0,
        macros: {
          protein: data.protein || '0g',
          carbs: data.carbs || '0g',
          fat: data.fat || '0g'
        },
        processed_level: data.processedLevel || 'unknown',
        verdict: data.ingredients || 'No ingredient information available',
        snap_eligible: data.snapEligible === 1 || false
      };
    }
    
    return generateMockNutritionData(query);
    
  } catch (error: unknown) {
    console.error('Database error:', error);
    return generateMockNutritionData(query);
  }
};

// Main exported functions
export const analyzeFoodImage = async (imageBuffer: Buffer): Promise<VisionAnalysisResult> => {
  console.log('🔍 Starting dual API food analysis...');
  
  try {
    // Run both analyses in parallel for better performance
    const [googleResult, openaiResult] = await Promise.all([
      analyzeWithGoogle(imageBuffer),
      analyzeWithOpenAI(imageBuffer)
    ]);

    console.log('Analysis results:', { googleResult, openaiResult });

    // Compare and choose best result
    const comparison = compareResults(googleResult, openaiResult);
    
    // Extract tags from both sources
    const combinedTags = [
      ...(googleResult.allLabels?.map(l => l.name) || []),
      ...(openaiResult.tags || [])
    ].filter((tag, index, self) => self.indexOf(tag) === index); // Remove duplicates

    return {
      success: true,
      foodName: comparison.finalChoice,
      confidence: Math.max(googleResult.confidence, openaiResult.confidence),
      tags: combinedTags,
      provider: 'dual-api',
      googleResult,
      openaiResult,
      comparison
    };

  } catch (error: unknown) {
    console.error('Dual API analysis failed:', error);
    
    return {
      success: false,
      foodName: 'Unknown Food',
      confidence: 0,
      tags: [],
      provider: 'error',
      error: handleError(error)
    };
  }
};

export const processUploadedFoodImage = async (imageBuffer: Buffer): Promise<ProcessedImageResult> => {
  try {
    // Step 1: Analyze the image
    const analysisResult = await analyzeFoodImage(imageBuffer);
    
    if (!analysisResult.success) {
      return {
        success: false,
        message: 'Failed to analyze food image'
      };
    }
    
    // Step 2: Get nutrition data
    const nutritionData = await fetchNutritionFromDatabase(analysisResult.foodName);
    
    return {
      success: true,
      analysis: analysisResult,
      nutrition: nutritionData,
      timestamp: new Date().toISOString()
    };
    
  } catch (error: unknown) {
    console.error('Error processing uploaded image:', error);
    return {
      success: false,
      message: 'Error processing uploaded food image'
    };
  }
};

export const fetchNutritionData = async (query: string): Promise<NutritionData> => {
  return await fetchNutritionFromDatabase(query);
};

export const saveNutritionData = async (barcode: string, data: NutritionData): Promise<SaveResult> => {
  try {
    const pool = getPool();
    const request = pool.request();
    
    // Set up parameters
    request.input('barcode', sql.VarChar, barcode);
    request.input('itemName', sql.NVarChar, data.item || '');
    request.input('calories', sql.Float, data.calories_per_serving || null);
    request.input('protein', sql.NVarChar, data.macros?.protein || null);
    request.input('carbs', sql.NVarChar, data.macros?.carbs || null);
    request.input('fat', sql.NVarChar, data.macros?.fat || null);
    request.input('processedLevel', sql.NVarChar, data.processed_level || null);
    request.input('ingredients', sql.NVarChar, data.verdict || null);
    request.input('snapEligible', sql.Bit, data.snap_eligible || false);
    
    // Use MERGE for upsert operation
    await request.query(`
      MERGE INTO dbo.NutritionData AS target
      USING (SELECT @barcode AS barcode) AS source
      ON target.barcode = source.barcode
      WHEN MATCHED THEN
        UPDATE SET 
          itemName = @itemName,
          calories = @calories,
          protein = @protein,
          carbs = @carbs,
          fat = @fat,
          processedLevel = @processedLevel,
          ingredients = @ingredients,
          snapEligible = @snapEligible,
          lastUpdated = GETDATE()
      WHEN NOT MATCHED THEN
        INSERT (barcode, itemName, calories, protein, carbs, fat, processedLevel, ingredients, snapEligible, createDate, lastUpdated)
        VALUES (@barcode, @itemName, @calories, @protein, @carbs, @fat, @processedLevel, @ingredients, @snapEligible, GETDATE(), GETDATE());
    `);
    
    return { 
      success: true, 
      message: 'Nutrition data saved successfully' 
    };
    
  } catch (error: unknown) {
    console.error('Error saving nutrition data:', error);
    return { 
      success: false, 
      message: 'Failed to save nutrition data to database' 
    };
  }
};

export const lookupBarcode = async (barcode: string): Promise<NutritionData> => {
  try {
    // Try database lookup first
    const result = await fetchNutritionFromDatabase(barcode);
    
    if (result.success && result.item) {
      return result;
    }
    
    // If not found, return mock data with barcode info
    return generateMockNutritionData(`Product ${barcode}`);
    
  } catch (error: unknown) {
    console.error('Error looking up barcode:', error);
    return {
      success: false,
      message: `Error looking up barcode: ${barcode}`
    };
  }
};