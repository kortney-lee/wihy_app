/**
 * Research Quality Score Gauge - Priority 1
 * Evidence reliability gauge (0-100 scale) with confidence indicators
 */

import React from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import AnalyzeWithWihyButton from '../shared/AnalyzeWithWihyButton';

ChartJS.register(ArcElement, Tooltip, Legend);

interface ResearchQualityGaugeProps {
  score: number; // 0-100 research quality score
  studyCount?: number; // Number of supporting studies
  evidenceLevel?: 'I' | 'II' | 'III' | 'IV'; // Evidence hierarchy
  size?: 'small' | 'medium' | 'large';
  showDetails?: boolean;
  onAnalyze?: (userMessage: string, assistantMessage: string) => void;
}

const ResearchQualityGauge: React.FC<ResearchQualityGaugeProps> = ({
  score,
  studyCount,
  evidenceLevel,
  size = 'medium',
  showDetails = true,
  onAnalyze
}) => {
  // Handle missing props with sample data
  const defaultScore = score !== undefined ? score : 75; // Default to 75 for demo purposes
  const defaultStudyCount = studyCount !== undefined ? studyCount : 42;
  const defaultEvidenceLevel = evidenceLevel || 'II';
  
  // Clamp score between 0-100
  const clampedScore = Math.max(0, Math.min(100, defaultScore));
  
  // Determine color scheme based on research quality
  const getQualityColor = (score: number): string => {
    if (score >= 90) return '#8B5CF6'; // Purple - Excellent research
    if (score >= 75) return '#06B6D4'; // Cyan - Strong research
    if (score >= 60) return '#10B981'; // Green - Good research
    if (score >= 40) return '#F59E0B'; // Yellow - Moderate research
    if (score >= 20) return '#EF4444'; // Red - Weak research
    return '#6B7280'; // Gray - Insufficient research
  };

  const getQualityLabel = (score: number): string => {
    if (score >= 90) return 'Excellent';
    if (score >= 75) return 'Strong';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Moderate';
    if (score >= 20) return 'Weak';
    return 'Insufficient';
  };

  const getEvidenceLevelColor = (level?: string): string => {
    switch (level) {
      case 'I': return '#8B5CF6'; // Systematic reviews, meta-analyses
      case 'II': return '#06B6D4'; // Randomized controlled trials
      case 'III': return '#10B981'; // Cohort studies
      case 'IV': return '#F59E0B'; // Case studies, expert opinion
      default: return '#6B7280';
    }
  };

  const getEvidenceLevelDescription = (level?: string): string => {
    switch (level) {
      case 'I': return 'Systematic Reviews & Meta-Analyses';
      case 'II': return 'Randomized Controlled Trials';
      case 'III': return 'Cohort & Case-Control Studies';
      case 'IV': return 'Case Reports & Expert Opinion';
      default: return 'Mixed Evidence Types';
    }
  };

  const qualityColor = getQualityColor(clampedScore);
  const qualityLabel = getQualityLabel(clampedScore);
  
  // Chart dimensions based on size
  const dimensions = {
    small: { width: 120, height: 120 },
    medium: { width: 180, height: 180 },
    large: { width: 240, height: 240 }
  };

  const data = {
    datasets: [
      {
        data: [clampedScore, 100 - clampedScore],
        backgroundColor: [qualityColor, '#F3F4F6'],
        borderWidth: 0,
        cutout: '70%',
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            if (context.dataIndex === 0) {
              return `Research Quality: ${clampedScore}/100 (${qualityLabel})`;
            }
            return null;
          },
        },
      },
    },
    elements: {
      arc: {
        borderRadius: 8,
      },
    },
  };

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      padding: 24,
      borderRadius: 16,
      background: "white",
      border: "1px solid #e5e7eb",
      boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
      height: 500,
      overflow: "hidden"
    }}>
      <h3 style={{ fontSize: 24, fontWeight: 600, color: "#9CA3AF", margin: 0, marginBottom: 20 }}>
        Research Quality
      </h3>
      
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, overflow: "hidden", minHeight: 0 }}>
        <div style={{ 
          position: 'relative', 
          width: '100%',
          height: '100%',
          maxWidth: '280px',
          maxHeight: '280px'
        }}>
        <Doughnut data={data} options={options} />
        
        {/* Center text overlay */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: size === 'small' ? '20px' : size === 'large' ? '32px' : '26px',
            fontWeight: 'bold',
            color: qualityColor,
            lineHeight: '1.5'
          }}>
            {clampedScore}
          </div>
          <div style={{
            fontSize: size === 'small' ? '10px' : size === 'large' ? '14px' : '12px',
            color: '#6B7280',
            marginTop: '2px'
          }}>
            /100
          </div>
        </div>
        </div>
      </div>
      
      {/* Quality label */}
      <div style={{ 
        marginTop: '10px',
        fontSize: size === 'small' ? '12px' : '14px',
        color: qualityColor,
        fontWeight: '600',
        textAlign: 'center'
      }}>
        {qualityLabel} Evidence
      </div>

      {/* Additional research details */}
      {showDetails && (
        <div style={{ 
          marginTop: '10px',
          fontSize: size === 'small' ? '11px' : '12px',
          color: '#6B7280',
          textAlign: 'center'
        }}>
          <div style={{ marginBottom: '4px' }}>
            📊 {defaultStudyCount} studies analyzed
          </div>
          
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            gap: '4px'
          }}>
            <span style={{
              backgroundColor: getEvidenceLevelColor(defaultEvidenceLevel),
              color: 'white',
              padding: '2px 6px',
              borderRadius: '4px',
              fontSize: '10px',
              fontWeight: 'bold'
            }}>
              Level {defaultEvidenceLevel}
            </span>
            <span style={{ fontSize: '10px' }}>
              {getEvidenceLevelDescription(defaultEvidenceLevel)}
            </span>
          </div>
        </div>
      )}
      
      <div style={{ display: "flex", justifyContent: "center", marginTop: 16, flexShrink: 0 }}>
        <AnalyzeWithWihyButton
          cardContext={`Research quality analysis: Quality score ${clampedScore}/100 (${getQualityLabel(clampedScore)}). ${defaultStudyCount} studies analyzed. Evidence level ${defaultEvidenceLevel} (${getEvidenceLevelDescription(defaultEvidenceLevel)})`}
          userQuery="Analyze this research quality data and explain what it means for the reliability of health recommendations"
          onAnalyze={onAnalyze}
        />
      </div>
    </div>
  );
};

export default ResearchQualityGauge;