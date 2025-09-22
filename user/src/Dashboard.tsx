import React from 'react';
import './Dashboard.css';
import Header from './components/Header';
import HealthSnapshot from './components/HealthSnapshot';
import WeightMetrics from './components/WeightMetrics';
import Activity from './components/Activity';
import { ModalProvider } from './providers/ModalProvider';

const Dashboard: React.FC = () => {
  return (
    <ModalProvider>
      <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
        <Header />
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