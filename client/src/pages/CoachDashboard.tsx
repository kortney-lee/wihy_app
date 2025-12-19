import React from 'react';
import Header from '../components/shared/Header';
import CoachDashboard from '../components/dashboard/CoachDashboard';

interface CoachDashboardPageProps {
  windowWidth: number;
}

const CoachDashboardPage: React.FC<CoachDashboardPageProps> = ({ windowWidth }) => {
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
        <CoachDashboard />
      </div>
    </div>
  );
};

export default CoachDashboardPage;