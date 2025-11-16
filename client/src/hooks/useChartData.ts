import { useState, useEffect } from 'react';
import { getApiEndpoint } from '../config/apiConfig';

interface ChartData {
  novaDistribution: Array<{
    label: string;
    count: number;
    color: string;
    percentage: number;
  }>;
  nutritionBreakdown: Array<{
    nutrient: string;
    value: number;
    color: string;
  }>;
  qualityScore: number;
  nutritionAverages: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    sugar: number;
    sodium: number;
  };
  healthInsights: {
    unprocessed_percentage: number;
    ultra_processed_percentage: number;
    avg_fiber: number;
    avg_sugar: number;
  };
  totalFoods: number;
}

export const useChartData = (query: string) => {
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!query || query.trim() === '') {
      setChartData(null);
      return;
    }

    // Don't load charts for non-food queries like "test" or general health topics
    const foodKeywords = ['apple', 'banana', 'chicken', 'beef', 'salmon', 'rice', 'bread', 'milk', 'egg', 'potato', 'quinoa', 'spinach', 'broccoli', 'yogurt', 'cheese', 'pasta', 'oats', 'nuts', 'beans', 'avocado'];
    const isLikelyFoodQuery = foodKeywords.some(keyword => 
      query.toLowerCase().includes(keyword.toLowerCase())
    ) || query.toLowerCase().includes('food') || query.toLowerCase().includes('nutrition');

    if (!isLikelyFoodQuery) {
      setChartData(null);
      return;
    }

    const fetchChartData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetch(getApiEndpoint('/ask'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            query: query,
            include_charts: true,
            user_context: {}
          })
        });
        const data = await response.json();

        if (data.success && data.data.totalFoods > 0) {
          setChartData(data.data);
        } else {
          setChartData(null);
        }
      } catch (err) {
        console.error('Error fetching chart data:', err);
        setError('Failed to load chart data');
        setChartData(null);
      } finally {
        setIsLoading(false);
      }
    };

    // Add a small delay to avoid too many API calls
    const timeoutId = setTimeout(fetchChartData, 300);
    
    return () => clearTimeout(timeoutId);
  }, [query]);

  return { chartData, isLoading, error };
};