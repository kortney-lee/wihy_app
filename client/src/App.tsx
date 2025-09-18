import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useSearchParams, useNavigate } from 'react-router-dom';
import VHealthSearch from './VHealthSearch';
import SearchResults from './SearchResults';
import openaiAPI from './services/openaiAPI';
import './VHealthSearch.css';

// Create or update this function in your existing API service
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export const searchFoodDatabase = async (query: string) => {
  try {
    console.log('Calling food database API for:', query);
    
    const response = await fetch(`${API_BASE_URL}/api/food/search?q=${encodeURIComponent(query)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Food API response:', data);
    
    return data;
  } catch (error) {
    console.error('Food database API error:', error);
    throw error;
  }
};

// Add to your existing openaiAPI object or create a new foodAPI object
export const foodAPI = {
  searchFood: searchFoodDatabase
};

// Define a type for the allowed data sources that matches SearchResults requirements
type AllowedDataSource = "error" | "openai" | "local" | "vnutrition";

// Results page wrapper to handle URL parameters
const ResultsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get('q') || '';
  const [isLoading, setIsLoading] = useState(true);
  const [results, setResults] = useState<string>('');
  const [dataSource, setDataSource] = useState<AllowedDataSource>("local");
  const [citations, setCitations] = useState<string[]>([]);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [disclaimer, setDisclaimer] = useState<string>('');
  
  // Fetch results when query changes
  useEffect(() => {
    const fetchResults = async () => {
      if (!query) {
        setIsLoading(false);
        return;
      }
      
      console.log("Fetching results for query:", query);
      setIsLoading(true);
      
      try {
        // STEP 1: First try the nutrition database
        try {
          console.log('Trying nutrition database first...');
          console.log('API URL:', `${API_BASE_URL}/api/search/food?q=${encodeURIComponent(query)}`);
          
          const nutritionResponse = await fetch(`${API_BASE_URL}/api/search/food?q=${encodeURIComponent(query)}`);
          
          console.log('Nutrition response status:', nutritionResponse.status);
          console.log('Nutrition response ok:', nutritionResponse.ok);
          
          if (nutritionResponse.ok) {
            const nutritionData = await nutritionResponse.json();
            console.log('Nutrition API response:', nutritionData);
            console.log('Found status:', nutritionData.found);
            console.log('Nova classification:', nutritionData.nova_classification);
            
            if (nutritionData && nutritionData.found === true) {
              console.log('Found nutrition data - using vnutrition source');
              setResults(JSON.stringify(nutritionData));
              setDataSource('vnutrition');
              setIsLoading(false);
              return; // Exit early - we have nutrition data
            } else {
              console.log('No nutrition data found, falling back to OpenAI');
            }
          } else {
            console.log('Nutrition API request failed with status:', nutritionResponse.status);
            const errorText = await nutritionResponse.text();
            console.log('Error response:', errorText);
          }
        } catch (nutritionError) {
          console.log('Nutrition API error:', nutritionError);
        }
        
        // STEP 2: Fall back to OpenAI if no nutrition data found
        console.log('Using OpenAI as fallback...');
        const result: ChatGPTResponse = await openaiAPI.searchHealthInfo(query);
        console.log("OpenAI Search result:", result);
        
        // Safely extract the text content
        const resultText = result.details || result.response || JSON.stringify(result);
        setResults(resultText);
        setDataSource("openai");
        
        setCitations(result.sources || []);
        setRecommendations(result.recommendations || []);
        setDisclaimer(result.medicalDisclaimer || '');
        
      } catch (error) {
        console.error("Search error:", error);
        setResults("Sorry, there was an error processing your request.");
        setDataSource("error");
        setCitations([]);
        setRecommendations([]);
        setDisclaimer('');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchResults();
  }, [query]);

  const handleBackToSearch = () => {
    navigate('/');
  };

  const handleNewSearch = (newQuery: string) => {
    navigate(`/results?q=${encodeURIComponent(newQuery)}`);
  };

  return (
    <SearchResults
      query={query}
      results={results}
      onBackToSearch={handleBackToSearch}
      onNewSearch={handleNewSearch}
      isLoading={isLoading}
      dataSource={dataSource}
      citations={citations}
      recommendations={recommendations}
      disclaimer={disclaimer}
    />
  );
};

// Main App with routing
const App: React.FC = () => {
  console.log("App component rendered");
  
  return (
    <Router>
      <Routes>
        <Route path="/" element={<VHealthSearch />} />
        <Route path="/results" element={<ResultsPage />} />
      </Routes>
    </Router>
  );
};

export default App;

interface ChatGPTResponse {
  details: string;
  sources?: string[];
  recommendations?: string[];
  medicalDisclaimer?: string;
  response?: string; // Alternative field name
}