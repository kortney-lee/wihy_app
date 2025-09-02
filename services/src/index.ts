import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'vHealth API is working!' });
});

// Basic nutrition route
app.get('/api/nutrition/:query', (req, res) => {
  const query = req.params.query;
  
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
  console.log(`🚀 vHealth API server running on port ${PORT}`);
});