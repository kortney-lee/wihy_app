import express from 'express';
import cors from 'cors';
import nutritionRoutes from './routes/nutritionRoutes';

const app = express();
app.use(cors());
app.use(express.json());

console.log('About to mount nutrition routes at /api'); // Add this
app.use('/api', nutritionRoutes);
console.log('Nutrition routes mounted successfully'); // Add this

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Available routes should be:');
  console.log('GET  http://localhost:5000/api/health');
  console.log('POST http://localhost:5000/api/analyze-image');
});