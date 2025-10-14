import React from 'react';
import './styles/VHealthSearch.css';
import Header from './components/components/shared/components/Header';
import HealthSnapshot from './components/HealthSnapshot';
import WeightMetrics from './components/WeightMetrics';
import Activity from './components/Activity';
import { ModalProvider } from './providers/ModalProvider';

const Dashboard: React.FC = () => {
  const handleSearchSubmit = (query: string) => {
    // For dashboard, open search results in the client app (new tab)
    // This maintains separation between dashboard and search functionality
    console.log('Dashboard search:', query);
    const searchUrl = `http://localhost:3002/results?q=${encodeURIComponent(query)}`;
    window.open(searchUrl, '_blank');
  };

  const handleLogoClick = () => {
    // Navigate to dashboard home or refresh
    console.log('Dashboard logo clicked');
    window.location.href = '/';
  };

  return (
    <ModalProvider>
      <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
        <Header 
          onSearchSubmit={handleSearchSubmit}
          onLogoClick={handleLogoClick}
          variant="results"
          showSearchInput={true}
          showLogin={true}
          className="dashboard-header dashboard"
          searchQuery=""
        />
        <HealthSnapshot />
        
        <div className="section-wrap">
          <WeightMetrics />
          <Activity />
        </div>

        <footer className="dashboard-footer">
          © {new Date().getFullYear()} vHealth
        </footer>
      </div>
    </ModalProvider>
  );
};

export default Dashboard;