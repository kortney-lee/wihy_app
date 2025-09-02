const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
app.use(cors());
app.use(express.json());

// Simple test endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'vHealth API is working!' });
});

// Add nutrition API endpoint
app.get('/api/nutrition/:query', (req, res) => {
  const query = req.params.query;
  // Mock response for testing
  res.json({
    success: true,
    item: query,
    calories_per_serving: 250,
    macros: {
      protein: '10g',
      carbs: '30g',
      fat: '12g'
    },
    processed_level: 'medium',
    verdict: 'Generally healthy option with moderate processing.',
    snap_eligible: true
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});