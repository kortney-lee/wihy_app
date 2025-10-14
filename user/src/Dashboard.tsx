import React, { useState } from 'react';
import './styles/VHealthSearch.css';
import Header from './components/components/shared/components/Header';
import {
  HealthSnapshot,
  WeightMetrics,
  Activity,
  NutritionSection,
  SleepRecoverySection,
  HydrationSection,
  ActivityMovementSection,
  BehaviorDopamineSection,
  HealthOutcomesSection,
  InsightsDashboardSection,
  ChatWidget
} from './components';
import { ModalProvider } from './providers/ModalProvider';

type DashboardView = 'overview' | 'detailed';

const Dashboard: React.FC = () => {
  const [dashboardView, setDashboardView] = useState<DashboardView>('overview');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [currentContext, setCurrentContext] = useState<string>('overview');
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
      <div style={{ minHeight: '100vh', backgroundColor: '#ffffffff' }}>
        <Header 
          onSearchSubmit={handleSearchSubmit}
          onLogoClick={handleLogoClick}
          variant="results"
          showSearchInput={true}
          showLogin={true}
          className="dashboard-header dashboard"
          searchQuery=""
        />
        
        {/* Main Content Area */}
        <div style={{
          marginLeft: isChatOpen ? '350px' : '0',
          transition: 'margin-left 0.3s ease-out',
          minHeight: 'calc(100vh - 80px)',
          padding: '0 20px'
        }}>
        
        {/* Dashboard View Toggle */}
        <div style={{ 
          padding: '0 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            {/* Header text removed */}
          </div>
          
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {/* Analyze with WiHy Button */}
            <div className="wihy-btn-wrapper" style={{
              display: 'inline-block',
              animation: 'wiH-border-sweep 2.2s linear infinite',
              background: 'linear-gradient(#fff, #fff) padding-box, linear-gradient(90deg, #fa5f06, #ffffff, #C0C0C0, #4cbb17) border-box',
              backgroundSize: '100% 100%, 200% 100%',
              border: '2px solid transparent',
              borderRadius: '16px'
            }}>
              <button 
                className="analyze-wihy-btn"
                onClick={() => {
                  setCurrentContext('overall health dashboard');
                  setIsChatOpen(true);
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  borderRadius: '16px',
                  padding: '8px 16px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  boxShadow: 'none',
                  transform: 'none',
                  color: '#1a73e8',
                  whiteSpace: 'nowrap'
                }}
              >
                Analyze with WiHy
              </button>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                className={`btn btn--sm ${dashboardView === 'overview' ? 'btn--primary' : 'btn--secondary'}`}
                onClick={() => {
                  setDashboardView('overview');
                  setCurrentContext('overview dashboard');
                }}
              >
                Overview
              </button>
              <button 
                className={`btn btn--sm ${dashboardView === 'detailed' ? 'btn--primary' : 'btn--secondary'}`}
                onClick={() => {
                  setDashboardView('detailed');
                  setCurrentContext('detailed analytics');
                }}
              >
                Detailed Analytics
              </button>
            </div>
          </div>
        </div>

        {/* Health Snapshot - Always visible */}
        <HealthSnapshot />
        
        {dashboardView === 'overview' && (
          <div className="overview-section">
            {/* Compact Overview Grid */}
            <div className="overview-grid">
              <div 
                className="section-card--compact"
                onMouseEnter={() => setCurrentContext('weight & body metrics')}
              >
                <div className="section-title--compact">
                  <h3>🧍‍♂️ Weight & Body</h3>
                </div>
                <div className="chart-container--compact">
                  <WeightMetrics />
                </div>
                <div className="wihy-btn-wrapper" style={{
                  display: 'inline-block',
                  animation: 'wiH-border-sweep 2.2s linear infinite',
                  background: 'linear-gradient(#fff, #fff) padding-box, linear-gradient(90deg, #fa5f06, #ffffff, #C0C0C0, #4cbb17) border-box',
                  backgroundSize: '100% 100%, 200% 100%',
                  border: '2px solid transparent',
                  borderRadius: '16px',
                  marginTop: '8px',
                  width: '100%'
                }}>
                  <button 
                    className="analyze-wihy-btn"
                    onClick={() => {
                      setCurrentContext('weight & body metrics');
                      setIsChatOpen(true);
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      borderRadius: '16px',
                      padding: '8px 16px',
                      fontSize: '11px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      color: '#1a73e8',
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    Analyze with WiHy
                  </button>
                </div>
              </div>

              <div 
                className="section-card--compact"
                onMouseEnter={() => setCurrentContext('activity & movement')}
              >
                <div className="section-title--compact">
                  <h3>🏃‍♂️ Activity</h3>
                </div>
                <div className="chart-container--compact">
                  <Activity />
                </div>
                <div className="wihy-btn-wrapper" style={{
                  display: 'inline-block',
                  animation: 'wiH-border-sweep 2.2s linear infinite',
                  background: 'linear-gradient(#fff, #fff) padding-box, linear-gradient(90deg, #fa5f06, #ffffff, #C0C0C0, #4cbb17) border-box',
                  backgroundSize: '100% 100%, 200% 100%',
                  border: '2px solid transparent',
                  borderRadius: '16px',
                  marginTop: '8px',
                  width: '100%'
                }}>
                  <button 
                    className="analyze-wihy-btn"
                    onClick={() => {
                      setCurrentContext('activity & movement');
                      setIsChatOpen(true);
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      borderRadius: '16px',
                      padding: '8px 16px',
                      fontSize: '11px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      color: '#1a73e8',
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    Analyze with WiHy
                  </button>
                </div>
              </div>

              <div 
                className="section-card--compact"
                onMouseEnter={() => setCurrentContext('nutrition & diet')}
              >
                <div className="section-title--compact">
                  <h3>🍽 Nutrition</h3>
                </div>
                <div className="chart-container--compact">
                  <NutritionSection />
                </div>
                <div className="wihy-btn-wrapper" style={{
                  display: 'inline-block',
                  animation: 'wiH-border-sweep 2.2s linear infinite',
                  background: 'linear-gradient(#fff, #fff) padding-box, linear-gradient(90deg, #fa5f06, #ffffff, #C0C0C0, #4cbb17) border-box',
                  backgroundSize: '100% 100%, 200% 100%',
                  border: '2px solid transparent',
                  borderRadius: '16px',
                  marginTop: '8px',
                  width: '100%'
                }}>
                  <button 
                    className="analyze-wihy-btn"
                    onClick={() => {
                      setCurrentContext('nutrition & diet');
                      setIsChatOpen(true);
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      borderRadius: '16px',
                      padding: '8px 16px',
                      fontSize: '11px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      color: '#1a73e8',
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    Analyze with WiHy
                  </button>
                </div>
              </div>

              <div 
                className="section-card--compact"
                onMouseEnter={() => setCurrentContext('sleep & recovery')}
              >
                <div className="section-title--compact">
                  <h3>💤 Sleep</h3>
                </div>
                <div className="chart-container--compact">
                  <SleepRecoverySection />
                </div>
                <div className="wihy-btn-wrapper" style={{
                  display: 'inline-block',
                  animation: 'wiH-border-sweep 2.2s linear infinite',
                  background: 'linear-gradient(#fff, #fff) padding-box, linear-gradient(90deg, #fa5f06, #ffffff, #C0C0C0, #4cbb17) border-box',
                  backgroundSize: '100% 100%, 200% 100%',
                  border: '2px solid transparent',
                  borderRadius: '16px',
                  marginTop: '8px',
                  width: '100%'
                }}>
                  <button 
                    className="analyze-wihy-btn"
                    onClick={() => {
                      setCurrentContext('sleep & recovery');
                      setIsChatOpen(true);
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      borderRadius: '16px',
                      padding: '8px 16px',
                      fontSize: '11px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      color: '#1a73e8',
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    Analyze with WiHy
                  </button>
                </div>
              </div>
            </div>
            
            {/* Quick Insights */}
            <div style={{ 
              padding: '20px',
              margin: '16px 0',
              backgroundColor: 'white',
              borderRadius: '12px',
              border: '1px solid #e5e7eb',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
            }}>
              <h3 style={{ margin: '0 0 16px 0', color: '#1f2937' }}>
                📊 Quick Insights
              </h3>
              <div style={{ 
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>85</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>Overall Health Score</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#3b82f6' }}>7.2h</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>Avg Sleep Quality</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f59e0b' }}>8.4k</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>Daily Steps (Avg)</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ef4444' }}>5</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>Personal Bests This Month</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {dashboardView === 'detailed' && (
          <div className="section-wrap">
            {/* All Detailed Sections */}
            <div onMouseEnter={() => setCurrentContext('weight & body metrics')}>
              <WeightMetrics />
            </div>
            <div onMouseEnter={() => setCurrentContext('nutrition & diet')}>
              <NutritionSection />
            </div>
            <div onMouseEnter={() => setCurrentContext('sleep & recovery')}>
              <SleepRecoverySection />
            </div>
            <div onMouseEnter={() => setCurrentContext('hydration')}>
              <HydrationSection />
            </div>
            <div onMouseEnter={() => setCurrentContext('activity & movement')}>
              <ActivityMovementSection />
            </div>
            <div onMouseEnter={() => setCurrentContext('behavior & dopamine')}>
              <BehaviorDopamineSection />
            </div>
            <div onMouseEnter={() => setCurrentContext('health outcomes & risk')}>
              <HealthOutcomesSection />
            </div>
            <div onMouseEnter={() => setCurrentContext('insights & analytics')}>
              <InsightsDashboardSection />
            </div>
          </div>
        )}

        <footer className="dashboard-footer" style={{ marginTop: '32px' }}>
          © {new Date().getFullYear()} vHealth - Your Comprehensive Health Platform
        </footer>
        
        </div> {/* End Main Content Area */}

        {/* Chat Widget */}
        <ChatWidget 
          isOpen={isChatOpen}
          onToggle={() => setIsChatOpen(!isChatOpen)}
          onClose={() => setIsChatOpen(false)}
          currentContext={currentContext}
        />

      </div>
    </ModalProvider>
  );
};

export default Dashboard;