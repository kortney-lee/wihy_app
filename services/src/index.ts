import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import nutritionRoutes from './routes/nutritionRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'vHealth API is working!' });
});

// Mount the nutrition routes at /api
app.use('/api', nutritionRoutes);

app.listen(PORT, () => {
  console.log(`🚀 vHealth API server running on port ${PORT}`);
});