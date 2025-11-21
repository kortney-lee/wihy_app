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
    <div className="flex flex-col p-6 rounded-2xl bg-white border border-gray-200 shadow-md h-[420px] overflow-hidden">
      <h3 className="text-xl font-semibold text-vh-muted mb-3">
        Research Quality
      </h3>
      
      <div className="flex-1 flex flex-col justify-center overflow-hidden min-h-0">
        <div className="relative h-36 w-36 mx-auto">
          <Doughnut data={data} options={options} />
          
          {/* Center text overlay */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
            <div 
              className="text-2xl font-bold"
              style={{ color: qualityColor }}
            >
              {clampedScore}
            </div>
            <div className="text-xs text-gray-500">
              /100
            </div>
          </div>
        </div>

        <div className="mt-4">
          {/* Quality label */}
          <div 
            className="font-semibold text-center text-base mb-2"
            style={{ color: qualityColor }}
          >
            {qualityLabel} Evidence
          </div>

          {/* Additional research details */}
          {showDetails && (
            <div className="text-gray-500 text-center text-xs mb-3">
              <div className="mb-1">
                📊 {defaultStudyCount} studies
              </div>
              
              <div className="flex items-center justify-center gap-1">
                <span 
                  className="text-white px-1.5 py-0.5 rounded text-xs font-bold"
                  style={{ backgroundColor: getEvidenceLevelColor(defaultEvidenceLevel) }}
                >
                  Level {defaultEvidenceLevel}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex justify-center mt-2 flex-shrink-0">
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