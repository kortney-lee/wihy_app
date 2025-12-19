import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/shared/Header';
import OverviewDashboardComponent from '../components/dashboard/OverviewDashboard';

interface OverviewDashboardPageProps {
  windowWidth?: number;
}

const OverviewDashboardPage: React.FC<OverviewDashboardPageProps> = ({ windowWidth = 1200 }) => {
  const navigate = useNavigate();

  const handleSearch = (query: string) => {
    if (query.trim()) {
      // Navigate to search results or handle search
      navigate('/', { state: { initialQuery: query.trim() } });
    }
  };

  return (
    <div className="w-full h-full bg-[#f0f7ff] overflow-hidden flex flex-col">
      {/* Header */}
      <Header
        searchQuery=""
        onSearchSubmit={handleSearch}
        showSearchInput={true}
        variant="results"
        showLogin={true}
      />
      
      {/* Main content area - matches the Header's top positioning */}
      <div className="flex-1 overflow-auto pt-[220px] sm:pt-[240px] lg:pt-[260px]">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-6">
          <OverviewDashboardComponent />
        </div>
      </div>
    </div>
  );
};

export default OverviewDashboardPage;