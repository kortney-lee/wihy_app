import React from 'react';
import Header from '../components/shared/Header';
import ConsumptionDashboard from '../components/dashboard/ConsumptionDashboard';

interface IntakeConsumptionDashboardPageProps {
  windowWidth: number;
}

const IntakeConsumptionDashboardPage: React.FC<IntakeConsumptionDashboardPageProps> = ({ windowWidth }) => {
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
    <div style={{ 
      minHeight: '100vh',
      backgroundColor: '#f0f7ff' 
    }}>
      <Header
        variant="results"
        showLogin={true}
        showSearchInput={false}
        onSearchSubmit={() => {}}
        onChatMessage={() => {}}
        isInChatMode={false}
        showProgressMenu={true}
        onProgressMenuClick={undefined}
      />
      
      <div style={{ 
        paddingTop: windowWidth < 768 ? '120px' : '100px',
        padding: windowWidth < 768 ? '120px 16px 40px' : '100px 32px 40px',
        maxWidth: '1400px',
        margin: '0 auto'
      }}>
        <ConsumptionDashboard
          period={period}
          onAnalyze={handleAnalyze}
          onUploadReceipt={handleUploadReceipt}
        />
      </div>
    </div>
  );
};

export default IntakeConsumptionDashboardPage;