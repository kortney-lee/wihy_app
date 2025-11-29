import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/shared/Header';
import HealthNewsFeed from '../components/HealthNewsFeed';
import { CSS_CLASSES } from '../constants/cssConstants';
import './NewsPage.css';

const NewsPage: React.FC = () => {
  const navigate = useNavigate();

  const handleAnalyzeArticle = (query: string) => {
    // Navigate to main search page with the query
    navigate('/', { state: { searchQuery: query, autoSearch: true } });
  };

  const handleUniversalSearch = (searchQuery: string) => {
    // Navigate to home page with search query
    navigate('/', { state: { searchQuery, autoSearch: true } });
  };

  return (
    <div className="news-page">
      <Header 
        variant="results"
        showLogin={true}
        showSearchInput={true}
        onSearchSubmit={handleUniversalSearch}
      />
      <div style={{ height: '40px' }}></div>
      <div className={CSS_CLASSES.DASHBOARD_CONTAINER}>
        <HealthNewsFeed 
          maxArticles={24}
          onAnalyzeArticle={handleAnalyzeArticle}
        />
      </div>
    </div>
  );
};

export default NewsPage;
