import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/shared/Header';
import ConsumptionDashboard from '../components/dashboard/ConsumptionDashboard';

interface IntakeConsumptionDashboardPageProps {
  windowWidth: number;
}

const IntakeConsumptionDashboardPage: React.FC<IntakeConsumptionDashboardPageProps> = ({ windowWidth = 1200 }) => {
  const navigate = useNavigate();

  const handleSearch = (query: string) => {
    if (query.trim()) {
      // Navigate to search results or handle search
      navigate('/results', { state: { initialQuery: query.trim() } });
    }
  };

  // Mock handlers for dashboard interactions
  const handleAnalyze = (userMessage: string, assistantMessage: string) => {
    console.log('Analyze clicked:', { userMessage, assistantMessage });
  };

  const handleUploadReceipt = () => {
    console.log('Upload receipt clicked');
  };

  // Calculate period based on window width (mobile gets daily, desktop gets weekly)
  const period = windowWidth < 768 ? 'day' : 'week';

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
        <div className="max-w-full mx-auto">
          <ConsumptionDashboard
            period={period}
            onAnalyze={handleAnalyze}
            onUploadReceipt={handleUploadReceipt}
          />
        </div>
      </div>
    </div>
  );
};

export default IntakeConsumptionDashboardPage;