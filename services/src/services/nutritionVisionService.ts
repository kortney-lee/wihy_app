import { getPool, sql } from '../config/database'; // Use getPool instead of pool directly
import vision from '@google-cloud/vision';
import OpenAI from 'openai';

// Initialize Google Vision client
const googleVisionClient = new vision.ImageAnnotatorClient({
  // You'll need to set up Google Cloud credentials
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS, // Path to your service account key
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
});

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Vision API interfaces
interface VisionAnalysisResult {
  success: boolean;
  foodName: string;
  confidence: number;
  tags: string[];
  provider: string;
  googleResult?: any;
  openaiResult?: any;
  comparison?: {
    match: boolean;
    googleConfidence: number;
    openaiConfidence: number;
    finalChoice: string;
    reasoning: string;
  };
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

// Analyze with Google Vision API
const analyzeWithGoogle = async (imageBuffer: Buffer): Promise<any> => {
  try {
    console.log('🔍 Analyzing with Google Vision API...');
    
    const [result] = await googleVisionClient.labelDetection({
      image: { content: imageBuffer },
    });

    const labels = result.labelAnnotations || [];
    console.log('Google Vision labels:', labels.map(l => `${l.description} (${l.score})`));

    // Look for food-related labels
    const foodLabels = labels.filter(label => 
      label.description?.toLowerCase().includes('food') ||
      label.description?.toLowerCase().includes('fruit') ||
      label.description?.toLowerCase().includes('vegetable') ||
      label.description?.toLowerCase().includes('meal') ||
      label.description?.toLowerCase().includes('dish')
    );

    const topLabel = labels[0];
    
    return {
      success: true,
      foodName: topLabel?.description || 'Unknown Food',
      confidence: topLabel?.score || 0,
      allLabels: labels.slice(0, 5).map(l => ({
        name: l.description,
        confidence: l.score
      })),
      provider: 'google'
    };
  } catch (error) {
    console.error('Google Vision analysis failed:', error);
    return {
      success: false,
      error: error.message,
      provider: 'google'
    };
  }
};

// Analyze with OpenAI Vision API
const analyzeWithOpenAI = async (imageBuffer: Buffer): Promise<any> => {
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

    // Try to parse JSON response
    let parsedResult;
    try {
      parsedResult = JSON.parse(content || '{}');
    } catch (parseError) {
      // Fallback if JSON parsing fails
      parsedResult = {
        foodName: content?.split('\n')[0] || 'Unknown Food',
        confidence: 0.7,
        description: content,
        tags: []
      };
    }

    return {
      success: true,
      ...parsedResult,
      provider: 'openai',
      rawResponse: content
    };
  } catch (error) {
    console.error('OpenAI Vision analysis failed:', error);
    return {
      success: false,
      error: error.message,
      provider: 'openai'
    };
  }
};

// Compare results from both APIs
const compareResults = (googleResult: any, openaiResult: any): any => {
  const googleFood = googleResult.foodName?.toLowerCase() || '';
  const openaiFood = openaiResult.foodName?.toLowerCase() || '';
  
  const match = googleFood.includes(openaiFood) || 
                openaiFood.includes(googleFood) ||
                googleFood === openaiFood;

  let finalChoice = '';
  let reasoning = '';

  if (match) {
    // Both agree - choose the one with higher confidence
    if (googleResult.confidence > openaiResult.confidence) {
      finalChoice = googleResult.foodName;
      reasoning = 'Both APIs agree, Google had higher confidence';
    } else {
      finalChoice = openaiResult.foodName;
      reasoning = 'Both APIs agree, OpenAI had higher confidence';
    }
  } else {
    // Results differ - use a scoring system
    const googleScore = googleResult.confidence * 0.6; // Google is good at labels
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

// Process uploaded food image
export const processUploadedFoodImage = async (imageBuffer: Buffer): Promise<any> => {
  try {
    // Analyze the image
    const visionResult = await analyzeFoodImage(imageBuffer);
    
    if (!visionResult.success) {
      return {
        success: false,
        message: 'Failed to analyze image'
      };
    }
    
    // Get nutrition data for the detected food
    const nutritionData = await fetchNutritionData(visionResult.foodName);
    
    return {
      success: true,
      analysis: visionResult,
      nutrition: nutritionData,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('Error processing uploaded image:', error);
    return {
      success: false,
      message: 'Error processing image'
    };
  }
};

// Fetch nutrition data from database
export const fetchNutritionData = async (query: string): Promise<NutritionData> => {
  try {
    // Use getPool() with proper error handling
    const pool = getPool();
    const request = pool.request();
    request.input('query', sql.VarChar, query);
    
    // Search by barcode or item name
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
    
    // Return mock data if not found in database
    return generateMockNutritionData(query);
    
  } catch (error) {
    console.error('Database error in fetchNutritionData:', error);
    // Return mock data on database error
    return generateMockNutritionData(query);
  }
};

// Generate mock nutrition data when database lookup fails
const generateMockNutritionData = (query: string): NutritionData => {
  // Simple mock data based on common foods
  const mockData: { [key: string]: Partial<NutritionData> } = {
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
    }
  };
  
  // Find the closest match or use default
  const lowerQuery = query.toLowerCase();
  const matchedKey = Object.keys(mockData).find(key => 
    lowerQuery.includes(key) || key.includes(lowerQuery)
  );
  
  const baseData = matchedKey ? mockData[matchedKey] : {
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

// Save nutrition data to database
export const saveNutritionData = async (barcode: string, data: any): Promise<{ success: boolean; message: string }> => {
  try {
    // Use getPool() with proper error handling
    const pool = getPool();
    const request = pool.request();
    request.input('barcode', sql.VarChar, barcode);
    request.input('itemName', sql.NVarChar, data.item || '');
    request.input('calories', sql.Float, data.calories_per_serving || null);
    request.input('protein', sql.NVarChar, data.macros?.protein || null);
    request.input('carbs', sql.NVarChar, data.macros?.carbs || null);
    request.input('fat', sql.NVarChar, data.macros?.fat || null);
    request.input('processedLevel', sql.NVarChar, data.processed_level || null);
    request.input('ingredients', sql.NVarChar, data.verdict || null);
    request.input('snapEligible', sql.Bit, data.snap_eligible || false);
    
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
    
    return { success: true, message: 'Nutrition data saved successfully' };
    
  } catch (error) {
    console.error('Error saving nutrition data:', error);
    return { success: false, message: 'Failed to save nutrition data' };
  }
};

// Barcode lookup function
export const lookupBarcode = async (barcode: string): Promise<NutritionData> => {
  try {
    // First try database lookup
    const dbResult = await fetchNutritionData(barcode);
    
    if (dbResult.success && dbResult.item) {
      return dbResult;
    }
    
    // TODO: If not found in database, try external APIs
    // For now, return mock data
    return generateMockNutritionData(`Product ${barcode}`);
    
  } catch (error) {
    console.error('Error looking up barcode:', error);
    return {
      success: false,
      message: 'Error looking up barcode'
    };
  }
};

// Main analysis function that uses both APIs
export const analyzeFoodImage = async (imageBuffer: Buffer): Promise<VisionAnalysisResult> => {
  console.log('🔍 Starting dual API food analysis...');
  
  try {
    // Run both analyses in parallel
    const [googleResult, openaiResult] = await Promise.all([
      analyzeWithGoogle(imageBuffer),
      analyzeWithOpenAI(imageBuffer)
    ]);

    console.log('Google result:', googleResult);
    console.log('OpenAI result:', openaiResult);

    // Compare and choose best result
    const comparison = compareResults(googleResult, openaiResult);
    
    console.log('Comparison result:', comparison);

    return {
      success: true,
      foodName: comparison.finalChoice,
      confidence: Math.max(googleResult.confidence || 0, openaiResult.confidence || 0),
      tags: [
        ...(googleResult.allLabels?.map((l: any) => l.name) || []),
        ...(openaiResult.tags || [])
      ],
      provider: 'dual-api',
      googleResult,
      openaiResult,
      comparison
    };

  } catch (error) {
    console.error('Dual API analysis failed:', error);
    
    // Fallback to filename analysis
    return {
      success: false,
      foodName: 'Unknown Food',
      confidence: 0,
      tags: [],
      provider: 'error',
      error: error.message
    };
  }
};