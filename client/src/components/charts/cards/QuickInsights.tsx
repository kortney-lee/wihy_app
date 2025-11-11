import React from 'react';
import { CardData } from '../cardConfig';
import '../../../styles/Dashboard.css';
import '../../../styles/charts.css';
import AnalyzeWithWihyButton from '../shared/AnalyzeWithWihyButton';

interface QuickInsightsProps {
  data?: CardData;
  className?: string;
}

/**
 * QuickInsights - The stable Card 1 component
 * Always visible and provides health overview with quick navigation
 */
const QuickInsights: React.FC<QuickInsightsProps> = ({ data, className = '' }) => {
  // Default configuration for QuickInsights
  const defaultLinks = [
    { label: 'Health Dashboard', href: '/health', icon: '🏥' },
    { label: 'Nutrition Analysis', href: '/nutrition', icon: '🍎' },
    { label: 'Activity Tracking', href: '/activity', icon: '🏃' },
    { label: 'Research Portal', href: '/research', icon: '📊' }
  ];

  const links = data?.links || defaultLinks;
  const healthScore = data?.data?.healthScore || 75; // Default health score
  const lastUpdate = data?.data?.lastUpdate || new Date().toLocaleDateString();

  return (
    <div className={`quick-insights-card ${className}`}>
      <h3 className="quick-insights-title">
        📊 {data?.title || 'Quick Insights'}
      </h3>
      <div className="insights-grid">
        <div className="insight-item">
          <div className="insight-value health-score">{healthScore}</div>
          <div className="insight-label">Overall Health Score</div>
        </div>
        <div className="insight-item">
          <div className="insight-value sleep-quality">{data?.data?.sleep || '7.5h'}</div>
          <div className="insight-label">Avg Sleep Quality</div>
        </div>
        <div className="insight-item">
          <div className="insight-value daily-steps">{((parseInt(data?.data?.steps || '8432') / 1000).toFixed(1))}k</div>
          <div className="insight-label">Daily Steps (Avg)</div>
        </div>
        <div className="insight-item">
          <div className="insight-value personal-bests">{Math.floor(healthScore / 20)}</div>
          <div className="insight-label">Personal Bests This Month</div>
        </div>
      </div>
      
      <div style={{ display: "flex", justifyContent: "center", marginTop: 16, flexShrink: 0 }}>
        <AnalyzeWithWihyButton
          cardContext={`Health overview: Overall health score is ${healthScore}/100. Last updated: ${lastUpdate}. Current stats: Steps ${data?.data?.steps || '8432'}, Sleep ${data?.data?.sleep || '7.5h'}, Calories ${data?.data?.calories || '1842'}. Current alerts: ${data?.data?.alerts || 0}, Recommendations: ${data?.data?.recommendations || 3}`}
          userQuery="Analyze my current health overview and provide personalized recommendations based on my health score and available data"
        />
      </div>
    </div>
  );
};

export default QuickInsights;