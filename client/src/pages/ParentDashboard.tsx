import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/shared/Header';
import ParentDashboardComponent from '../components/dashboard/ParentDashboard';

interface ParentDashboardPageProps {
  windowWidth?: number;
}

const ParentDashboardPage: React.FC<ParentDashboardPageProps> = ({ windowWidth = 1200 }) => {
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
      
      {/* Main content area */}
      <div className="flex-1 overflow-auto pt-[220px] sm:pt-[240px] lg:pt-[260px]">
        {/* Page Header */}
        <div className="bg-[#f0f7ff] px-3 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
              Parent Dashboard
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Monitor your children's health and wellness journey
            </p>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="bg-[#f0f7ff]">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-6">
            <ParentDashboardComponent />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParentDashboardPage;