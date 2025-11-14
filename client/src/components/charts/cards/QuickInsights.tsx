import React from 'react';
import { CardData } from '../cardConfig';
import '../../../styles/Dashboard.css';
import '../../../styles/charts.css';
import AnalyzeWithWihyButton from '../shared/AnalyzeWithWihyButton';

// Member badge configuration (shared with MembersCard)
export type MemberCardType = 'bronze' | 'silver' | 'gold' | 'platinum' | 'green';

const badgeConfig = {
  bronze: {
    image: '/assets/WihyBadgesBronze_1.png',
    title: 'Bronze',
    color: '#CD7F32'
  },
  silver: {
    image: '/assets/WihyBadgesSilver_2.png',
    title: 'Silver',
    color: '#C0C0C0'
  },
  gold: {
    image: '/assets/WihyBadgesGold_3.png',
    title: 'Gold',
    color: '#FFD700'
  },
  platinum: {
    image: '/assets/WihyBadgesPlatinum__4.png',
    title: 'Platinum',
    color: '#E5E4E2'
  },
  green: {
    image: '/assets/WihyBadgesGreen_5.png',
    title: 'Green',
    color: '#50C878'
  }
};

interface QuickInsightsProps {
  data?: CardData;
  className?: string;
  memberCardType?: MemberCardType;
  memberName?: string;
  onAnalyze?: (userMessage: string, assistantMessage: string) => void;
}

/**
 * QuickInsights - The stable Card 1 component
 * Always visible and provides health overview with quick navigation
 */
const QuickInsights: React.FC<QuickInsightsProps> = ({ 
  data, 
  className = '', 
  memberCardType = 'bronze', 
  memberName = 'Health Enthusiast',
  onAnalyze
}) => {
  // Extract insights data from API response or use defaults
  // Insight 1: Overall Health/Quality Score (0-100)
  const healthScore = data?.data?.healthScore || 
                     data?.data?.health_score || 
                     data?.data?.overallScore || 
                     75; // Default health score
  
  // Insight 2: Processing Level/Evidence Grade
  const processingLevel = data?.data?.processingLevel || 
                         data?.data?.processing_level || 
                         data?.data?.grade || 
                         data?.data?.novaGroup ? `NOVA ${data.data.novaGroup}` : 
                         'B+'; // Default grade
  
  // Insight 3: Recommendation Frequency/Action
  const recommendations = data?.data?.recommendations || 
                         data?.data?.recommendationCount || 
                         3; // Default recommendation count
  
  // Insight 4: Alternative/Improvement Score
  const improvementScore = data?.data?.improvementScore || 
                          data?.data?.alternativeScore || 
                          data?.data?.confidenceScore ? Math.round(data.data.confidenceScore * 100) :
                          data?.data?.confidence ? Math.round(data.data.confidence * 100) :
                          85; // Default improvement score
  
  const lastUpdate = data?.data?.lastUpdate || new Date().toLocaleDateString();
  
  // Get member badge info
  const memberBadge = badgeConfig[memberCardType];

  return (
    <div className={`quick-insights-card ${className}`}>
      <h3 className="quick-insights-title">
        📊 {data?.title || 'Quick Insights'}
      </h3>
      <div className="insights-grid">
        <div className="insight-item">
          <div className="member-badge-container">
            <img 
              src={memberBadge.image} 
              alt={memberBadge.title}
              className="member-badge-image"
              style={{
                width: '64px',
                height: '64px',
                objectFit: 'contain',
                marginBottom: '8px'
              }}
            />
            <div className="insight-value" style={{ color: memberBadge.color, fontSize: '18px', fontWeight: '600' }}>
              {memberBadge.title}
            </div>
          </div>
          <div className="insight-label">Member Status</div>
        </div>
        
        {/* Insight 1: Overall Health/Quality Score (0-100) */}
        <div className="insight-item">
          <div className="insight-value health-score">{healthScore}</div>
          <div className="insight-label">Health Score</div>
        </div>
        
        {/* Insight 2: Processing Level/Evidence Grade */}
        <div className="insight-item">
          <div className="insight-value processing-level">{processingLevel}</div>
          <div className="insight-label">Quality Grade</div>
        </div>
        
        {/* Insight 3: Recommendation Frequency/Action */}
        <div className="insight-item">
          <div className="insight-value recommendations-count">{recommendations}</div>
          <div className="insight-label">Recommendations</div>
        </div>
        
        {/* Insight 4: Alternative/Improvement Score */}
        <div className="insight-item">
          <div className="insight-value improvement-score">{improvementScore}%</div>
          <div className="insight-label">Improvement Score</div>
        </div>
      </div>
      
      <div style={{ display: "flex", justifyContent: "center", marginTop: 16, flexShrink: 0 }}>
        <AnalyzeWithWihyButton
          cardContext={`Health overview for ${memberName} (${memberBadge.title} Member): Overall health score is ${healthScore}/100. Last updated: ${lastUpdate}. Current stats: Steps ${data?.data?.steps || '8432'}, Sleep ${data?.data?.sleep || '7.5h'}, Calories ${data?.data?.calories || '1842'}. Member status: ${memberBadge.title}. Current alerts: ${data?.data?.alerts || 0}, Recommendations: ${data?.data?.recommendations || 3}`}
          userQuery="Analyze my current health overview and provide personalized recommendations based on my health score, member status, and available data"
          onAnalyze={onAnalyze}
        />
      </div>
    </div>
  );
};

export default QuickInsights;