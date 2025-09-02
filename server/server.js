const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Initialize express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Define port
const PORT = process.env.PORT || 5000;

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Mock search endpoint for nutrition info
const foodDatabase = {
  blueberries: {
    text: `# Blueberries\n\nBlueberries are perennial flowering plants with blue or purple berries. They are classified in the section Cyanococcus within the genus Vaccinium.\n\n## Nutrition Facts\n\nBlueberries are low in calories but high in fiber, vitamin C, vitamin K and manganese. One cup (148 grams) of blueberries contains:\n\n- Calories: 84\n- Fiber: 3.6g\n- Vitamin C: 24% of RDI\n- Vitamin K: 36% of RDI\n- Manganese: 25% of RDI\n\n## Health Benefits\n\n- High in Antioxidants: Blueberries are believed to contain the highest antioxidant capacity among common fruits and vegetables.\n- May Reduce DNA Damage: Oxidative DNA damage is an unavoidable part of daily life, but blueberries can help neutralize some free radicals that damage your DNA.\n- May Protect Cholesterol: Blueberries may reduce LDL oxidation, a crucial step in heart disease development.\n- May Lower Blood Pressure: Regular blueberry intake is linked to lower blood pressure.\n- May Help Prevent Heart Disease: By reducing LDL oxidation, blueberries may lower the risk of heart disease.\n- Improve Brain Function: The antioxidants in blueberries accumulate in the brain and help improve brain function.`,
    source: "vnutrition",
    qualityScore: 0.95,
    details: `# Blueberries\n\nBlueberries are perennial flowering plants with blue or purple berries. They are classified in the section Cyanococcus within the genus Vaccinium.\n\n## Nutrition Facts\n\nBlueberries are low in calories but high in fiber, vitamin C, vitamin K and manganese. One cup (148 grams) of blueberries contains:\n\n- Calories: 84\n- Fiber: 3.6g\n- Vitamin C: 24% of RDI\n- Vitamin K: 36% of RDI\n- Manganese: 25% of RDI\n\n## Health Benefits\n\n- High in Antioxidants: Blueberries are believed to contain the highest antioxidant capacity among common fruits and vegetables.\n- May Reduce DNA Damage: Oxidative DNA damage is an unavoidable part of daily life, but blueberries can help neutralize some free radicals that damage your DNA.\n- May Protect Cholesterol: Blueberries may reduce LDL oxidation, a crucial step in heart disease development.\n- May Lower Blood Pressure: Regular blueberry intake is linked to lower blood pressure.\n- May Help Prevent Heart Disease: By reducing LDL oxidation, blueberries may lower the risk of heart disease.\n- Improve Brain Function: The antioxidants in blueberries accumulate in the brain and help improve brain function.`,
    citations: [
      "Smith A, et al. (2022). Antioxidant properties of blueberries. Journal of Nutrition, 45(2), 187-195.",
      "Johnson B, et al. (2021). Effects of blueberry consumption on cognitive function. Neuroscience Letters, 12(3), 112-118.",
      "USDA FoodData Central. (2023). Blueberries, raw."
    ],
    recommendations: [
      "Consume 1/2 to 1 cup of blueberries daily for optimal health benefits",
      "Choose organic blueberries when possible to minimize pesticide exposure",
      "Add blueberries to smoothies, oatmeal, or yogurt for a nutritional boost"
    ],
    disclaimer: "This information is for educational purposes only and not intended as medical advice."
  },
  // Add more foods as needed
  default: {
    text: "Information about this food item is not available in our database. We recommend consulting USDA resources for detailed nutrition information.",
    source: "vnutrition",
    qualityScore: 0.7,
    details: "# Food Database\n\nThis item isn't in our detailed database yet. We're continuously updating our nutrition information.",
    citations: ["USDA FoodData Central"],
    recommendations: ["Maintain a balanced diet with a variety of fruits, vegetables, lean proteins, and whole grains."],
    disclaimer: "This information is for educational purposes only and not intended as medical advice."
  }
};

app.post('/api/search', (req, res) => {
  const { query } = req.body;
  console.log(`Search request received for: ${query}`);
  
  // Process query to normalize it
  const normalizedQuery = query.toLowerCase().trim();
  
  // Check if we have specific data for this food
  const foodData = foodDatabase[normalizedQuery] || foodDatabase.default;
  
  // If query looks like a question, format response accordingly
  if (normalizedQuery.includes('?') || 
      normalizedQuery.startsWith('how') || 
      normalizedQuery.startsWith('what') || 
      normalizedQuery.startsWith('why') || 
      normalizedQuery.startsWith('when') || 
      normalizedQuery.startsWith('where') || 
      normalizedQuery.startsWith('can')) {
    
    foodData.text = `## Answer to: ${query}\n\n${foodData.text}`;
  }
  
  // Return enhanced data
  setTimeout(() => {
    res.json(foodData);
  }, 500);
});

// Mock API for food image analysis
app.post('/api/analyze-image', (req, res) => {
  const { fileName, foodName } = req.body;
  console.log(`Analyzing image: ${fileName}, detected food: ${foodName}`);
  
  // For demo purposes, if the filename or food name contains certain keywords,
  // return specific data for that food
  let detectedFood = 'default';
  
  // Check if the filename or foodName contains known foods
  const fileNameLower = fileName.toLowerCase();
  const foodNameLower = (foodName || '').toLowerCase();
  
  if (fileNameLower.includes('blueberr') || foodNameLower.includes('blueberr')) {
    detectedFood = 'blueberries';
  }
  // Add more food detection logic as needed
  
  // Get food data from our database
  const foodData = foodDatabase[detectedFood] || foodDatabase.default;
  
  // Return analysis result
  res.json({
    name: detectedFood === 'default' ? 'Unknown Food' : detectedFood,
    confidence: 0.92,
    nutritionFacts: {
      calories: detectedFood === 'blueberries' ? "84 kcal" : "120 kcal",
      protein: detectedFood === 'blueberries' ? "1.1g" : "5g",
      fat: detectedFood === 'blueberries' ? "0.5g" : "2g",
      carbs: detectedFood === 'blueberries' ? "21g" : "18g",
      fiber: detectedFood === 'blueberries' ? "3.6g" : "2g",
      sugar: detectedFood === 'blueberries' ? "15g" : "5g"
    },
    analysisText: foodData.details,
    healthBenefits: detectedFood === 'blueberries' ? 
      ["High in antioxidants", "May improve brain function", "Supports heart health"] : 
      ["Contains essential nutrients"]
  });
});

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  // Set static folder
  app.use(express.static(path.join(__dirname, '../client/build')));

  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client/build', 'index.html'));
  });
}

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API endpoints:`);
  console.log(`- Health check: http://localhost:${PORT}/api/health`);
  console.log(`- Search: http://localhost:${PORT}/api/search (POST)`);
  console.log(`- Analyze image: http://localhost:${PORT}/api/analyze-image (POST)`);
});