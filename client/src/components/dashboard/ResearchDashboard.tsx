import React from 'react';
import DashboardCharts from '../charts/grids/DashboardCharts';
import { ChartType } from '../charts/chartTypes';
import ResearchPanel from './ResearchPanel';
import '../../styles/research.css';

interface ResearchDashboardProps {
  period: 'day' | 'week' | 'month';
  onAnalyze: (userMessage: string, assistantMessage: string) => void;
  onSearch: (prompt: string) => void;
  windowWidth: number;
}

const ResearchDashboard: React.FC<ResearchDashboardProps> = ({
  period,
  onAnalyze,
  onSearch,
  windowWidth
}) => {
  return (
    <div className="research-dashboard">
      <h1
        className="dashboard-title"
        style={{
          fontSize: windowWidth < 768 ? '22px' : '28px',
          textAlign: 'center',
          marginBottom: windowWidth < 768 ? '8px' : '12px',
          marginTop: windowWidth < 768 ? '8px' : '10px',
          padding: windowWidth < 768 ? '0 8px' : '0'
        }}
      >
        Research & Evidence
      </h1>

      <p
        style={{
          fontSize: '13px',
          lineHeight: 1.4,
          color: '#4b5563',
          maxWidth: '800px',
          margin: windowWidth < 768 ? '0 auto 12px' : '0 auto 16px',
          padding: windowWidth < 768 ? '0 12px' : '0',
          textAlign: 'center'
        }}
      >
        Browse evidence by domain, launch focused literature searches in one click,
        and view how research connects to this person&apos;s nutrition, activity, and
        risk profile. Designed so a clinician can quickly move from{' '}
        <strong>question → evidence → action.</strong>
      </p>

      {/* Research Panel with tabbed workflow */}
      <div
        style={{
          padding: windowWidth < 768 ? '0 8px' : '0 4px',
          marginBottom: '16px'
        }}
      >
        <ResearchPanel
          windowWidth={windowWidth}
          onAskArticle={(pmcId, question) => {
            // Push question about article to WIHY chat with context
            onAnalyze(
              `Question about article ${pmcId}: ${question}`,
              'Use /api/research/pmc/:pmcId/content as context for this answer.'
            );
          }}
        />
      </div>
    </div>
  );
};

export default ResearchDashboard;
