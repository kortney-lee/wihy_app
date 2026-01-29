import React from 'react';
import OverviewDashboard from './OverviewDashboard';
import { useTheme } from '../context/ThemeContext';

// Enhanced Dashboard that uses the new OverviewDashboard component
const Dashboard: React.FC = () => {
  const { theme } = useTheme();
  const handleAnalyze = (userMessage: string, assistantMessage: string) => {
    console.log('Analyze triggered:', { userMessage, assistantMessage });
    // Here you could navigate to FullChat or handle the analysis
  };

  return (
    <OverviewDashboard onAnalyze={handleAnalyze} />
  );
};

export default Dashboard;
