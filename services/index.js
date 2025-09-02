const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  try {
    res.json({ 
      status: 'OK', 
      message: 'vHealth API is running',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: 'Health check failed' });
  }
});

// Basic nutrition analysis endpoint
app.post('/api/analyze', (req, res) => {
  try {
    const { query } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }
    
    // Mock response for now
    const mockResponse = {
      food: query,
      nutrition: {
        calories: Math.floor(Math.random() * 300) + 50,
        protein: Math.floor(Math.random() * 25) + 5,
        carbs: Math.floor(Math.random() * 50) + 10,
        fat: Math.floor(Math.random() * 15) + 2
      },
      healthScore: Math.floor(Math.random() * 100) + 1,
      analysis: `Nutritional analysis for ${query}`
    };
    
    res.json(mockResponse);
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ error: 'Analysis failed' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.listen(PORT, () => {
  console.log(`✅ vHealth API Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
});
