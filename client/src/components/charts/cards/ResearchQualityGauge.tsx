/**
 * Research Quality Score Gauge - Priority 1
 * Evidence reliability gauge (0-100 scale) with confidence indicators
 * Integrated with Analytics Service API
 */

import React, { useEffect, useState } from 'react';
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
  score?: number; // 0-100 research quality score (optional, fetched from API if not provided)
  studyCount?: number; // Number of supporting studies
  evidenceLevel?: 'I' | 'II' | 'III' | 'IV'; // Evidence hierarchy
  size?: 'small' | 'medium' | 'large';
  showDetails?: boolean;
  showCategoryButtons?: boolean; // Show category selection buttons
  categories?: Record<string, string[]>; // Custom research categories for API
  apiResponse?: any; // API response from analytics service
  onAnalyze?: (userMessage: string, assistantMessage: string) => void;
}

// Predefined research categories
const RESEARCH_CATEGORIES = {
  'Mental Illness': {
    'Mental Illness': [
      'depression',
      'anxiety',
      'panic disorder',
      'bipolar disorder'
    ]
  },
  'Diabetes': {
    'Diabetes': [
      'type 2 diabetes',
      'insulin resistance',
      'metformin',
      'GLP-1'
    ]
  },
  'Nutrition': {
    'Nutrition': [
      'micronutrient deficiencies',
      'ultra-processed foods',
      'dietary patterns',
      'intermittent fasting',
      'protein intake',
      'fiber intake',
      'omega-3 fatty acids'
    ]
  },
  'Obesity': {
    'Obesity': [
      'obesity',
      'metabolic syndrome',
      'waist circumference',
      'body composition',
      'energy balance'
    ]
  },
  'Cancer': {
    'Cancer': [
      'breast cancer',
      'lung cancer',
      'colon cancer',
      'prostate cancer',
      'immunotherapy',
      'chemotherapy outcomes'
    ]
  }
};

const ResearchQualityGauge: React.FC<ResearchQualityGaugeProps> = ({
  score,
  studyCount,
  evidenceLevel,
  size = 'medium',
  showDetails = true,
  showCategoryButtons = true,
  categories,
  apiResponse,
  onAnalyze
}) => {
  const [apiData, setApiData] = useState<{
    score: number;
    studyCount: number;
    evidenceLevel: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>('Mental Illness');
  const [activeCategories, setActiveCategories] = useState<Record<string, string[]> | null>(
    categories || RESEARCH_CATEGORIES['Mental Illness']
  );

  // Parse evidence level from API response string format "Level III - Moderate" -> "III"
  const parseEvidenceLevel = (levelString?: string): 'I' | 'II' | 'III' | 'IV' => {
    if (!levelString) return 'II';
    const match = levelString.match(/Level\s+(I{1,3}|IV)/i);
    return match ? match[1].toUpperCase() as 'I' | 'II' | 'III' | 'IV' : 'II';
  };

  // Extract data from API response
  useEffect(() => {
    if (apiResponse?.success && apiResponse?.analytics?.research_metrics) {
      console.log('[ResearchQualityGauge] Using API response data');
      const metrics = apiResponse.analytics.research_metrics;
      
      setApiData({
        score: metrics.quality_score || metrics.quality_assessment?.overallScore || 70,
        studyCount: metrics.total_studies || metrics.quality_assessment?.totalStudies || 0,
        evidenceLevel: parseEvidenceLevel(metrics.evidence_level)
      });
    }
  }, [apiResponse]);

  // Fetch data from Analytics Service API
  const fetchAnalytics = async (categoriesToFetch: Record<string, string[]>) => {
    console.log('[ResearchQualityGauge] Starting API fetch...');
    setLoading(true);
    setError(null);
    try {
      // Use services.wihy.ai in production, localhost only in development
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const apiUrl = isLocalhost ? (process.env.REACT_APP_API_URL || 'http://localhost:5000') : 'https://services.wihy.ai';
      console.log('[ResearchQualityGauge] API URL:', apiUrl);
      console.log('[ResearchQualityGauge] Categories:', categoriesToFetch);
      
      const response = await fetch(`${apiUrl}/api/analytics/dashboard`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          researchCategories: categoriesToFetch
        })
      });
      
      console.log('[ResearchQualityGauge] Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('[ResearchQualityGauge] API response:', data);
          
      // Extract research quality metrics from analytics
      const qualityScore = data.researchQuality?.overallScore || 75;
      const totalStudies = data.researchQuality?.totalStudies || 42;
      const level = data.researchQuality?.evidenceLevel || 'II';
      
      setApiData({
        score: qualityScore,
        studyCount: totalStudies,
        evidenceLevel: level
      });
    } catch (err) {
      console.error('[ResearchQualityGauge] Failed to fetch analytics:', err);
      setError('Failed to load research quality data');
      // Fallback to default values
      setApiData({
        score: 75,
        studyCount: 42,
        evidenceLevel: 'II'
      });
    } finally {
      console.log('[ResearchQualityGauge] Fetch complete');
      setLoading(false);
    }
  };

  // Handle category button click
  const handleCategoryClick = (categoryName: string) => {
    setSelectedCategory(categoryName);
    const categoryData = RESEARCH_CATEGORIES[categoryName as keyof typeof RESEARCH_CATEGORIES];
    setActiveCategories(categoryData);
    fetchAnalytics(categoryData);
  };

  // Initial load with provided categories
  useEffect(() => {
    if (score === undefined && activeCategories) {
      fetchAnalytics(activeCategories);
    } else if (score !== undefined) {
      console.log('[ResearchQualityGauge] Using provided score prop:', score);
    }
  }, [score]);

  // Use API data if available, otherwise use props or defaults
  const defaultScore = score !== undefined ? score : (apiData?.score || 75);
  const defaultStudyCount = studyCount !== undefined ? studyCount : (apiData?.studyCount || 42);
  const defaultEvidenceLevel = evidenceLevel || (apiData?.evidenceLevel as 'I' | 'II' | 'III' | 'IV') || 'II';
  
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
    <div className="flex flex-col p-6 rounded-2xl bg-white border border-gray-200 shadow-md h-[500px] overflow-hidden">
      <h3 className="text-xl font-semibold text-vh-muted mb-3">
        Research Quality {loading && <span className="text-sm text-gray-400">(Loading...)</span>}
      </h3>
      
      {error && (
        <div className="text-xs text-red-500 mb-2">{error}</div>
      )}

      {/* Category Selection Buttons */}
      {showCategoryButtons && (
        <div className="mb-4 flex flex-wrap gap-2">
          {Object.keys(RESEARCH_CATEGORIES).map((categoryName) => (
            <button
              key={categoryName}
              onClick={() => handleCategoryClick(categoryName)}
              disabled={loading}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                selectedCategory === categoryName
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              {categoryName}
            </button>
          ))}
        </div>
      )}
      
      <div className="flex-1 flex flex-col justify-center overflow-y-auto min-h-0">
        <div className="relative h-36 w-36 mx-auto flex-shrink-0">
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
          {/* Quality label and research details inline */}
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <div 
              className="font-semibold text-base"
              style={{ color: qualityColor }}
            >
              {qualityLabel} Evidence
            </div>
            
            {showDetails && (
              <>
                <span className="text-gray-500 text-xs">
                  📊 {defaultStudyCount} studies
                </span>
                
                <span 
                  className="text-white px-1.5 py-0.5 rounded text-xs font-bold"
                  style={{ backgroundColor: getEvidenceLevelColor(defaultEvidenceLevel) }}
                >
                  Level {defaultEvidenceLevel}
                </span>
              </>
            )}
          </div>
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