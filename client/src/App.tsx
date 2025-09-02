import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useSearchParams, useNavigate } from 'react-router-dom';
import VHealthSearch from './VHealthSearch';
import SearchResults from './SearchResults';
import openaiAPI from './services/openaiAPI';
import './VHealthSearch.css';

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
        // Try to use openaiAPI
        const result = await openaiAPI.searchHealthInfo(query);
        console.log("Search result:", result);
        
        setResults(result.details);
        setDataSource("openai");
        
        if (result.sources) {
          setCitations(result.sources);
        }
        
        if (result.recommendations) {
          setRecommendations(result.recommendations);
        }
        
        if (result.medicalDisclaimer) {
          setDisclaimer(result.medicalDisclaimer);
        }
      } catch (error) {
        console.error("Error fetching results:", error);
        setResults(`Sorry, we couldn't retrieve information about "${query}". Please try a different search or try again later.`);
        setDataSource("error");
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