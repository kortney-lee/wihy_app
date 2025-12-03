import React, { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
  TimeScale,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';
import AnalyzeWithWihyButton from '../shared/AnalyzeWithWihyButton';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

export interface PublicationData {
  year: number;
  month?: number;
  count: number;
  studyTypes?: {
    'Clinical Trial': number;
    'Meta-Analysis': number;
    'Observational': number;
    'Review': number;
    'Laboratory': number;
  };
  totalStudies?: number;
}

interface ResearchCoverageData {
  earliest_year: number;
  latest_year: number;
  year_span: number;
  recent_studies_count: number;
  recent_studies_percentage: number;
  total_research_available: number;
  sample_size_analyzed: number;
}

interface StudyTypeDistribution {
  [key: string]: number;
}

interface ChartDataPayload {
  evidence_grade?: string;
  research_quality_score?: number;
  study_count?: number;
  confidence_level?: string;
  research_coverage?: ResearchCoverageData;
  study_type_distribution?: StudyTypeDistribution;
  evidence_distribution?: Record<string, number>;
  journal_impact_scores?: number[];
}

interface PublicationTimelineChartProps {
  publications?: PublicationData[];
  researchData?: ChartDataPayload; // Renamed from chartData to avoid conflict
  size?: 'small' | 'medium' | 'large';
  showLabels?: boolean;
  title?: string;
  timeRange?: 'recent' | 'decade' | 'all-time';
  showTrendline?: boolean;
  categories?: Record<string, string[]>; // Custom research categories for API
  onAnalyze?: (userMessage: string, assistantMessage: string) => void;
}

const PublicationTimelineChart: React.FC<PublicationTimelineChartProps> = ({
  publications = [],
  researchData,
  size = 'medium',
  showLabels = true,
  title = 'Research Publication Timeline',
  timeRange = 'decade',
  showTrendline = true,
  categories,
  onAnalyze
}) => {
  const [apiData, setApiData] = useState<PublicationData[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Convert research_coverage data to publication timeline format
  const convertResearchCoverageToTimeline = (coverage: ResearchCoverageData, studyTypes?: StudyTypeDistribution): PublicationData[] => {
    const { earliest_year, latest_year, total_research_available, sample_size_analyzed } = coverage;
    const yearSpan = latest_year - earliest_year + 1;
    const data: PublicationData[] = [];
    
    // Distribute studies across years proportionally
    const avgPerYear = Math.floor(sample_size_analyzed / yearSpan);
    const remainder = sample_size_analyzed % yearSpan;
    
    for (let i = 0; i < yearSpan; i++) {
      const year = earliest_year + i;
      // Add extra to recent years from remainder
      const count = avgPerYear + (i >= yearSpan - remainder ? 1 : 0);
      
      // Build study types from distribution
      const studyTypesForYear: PublicationData['studyTypes'] = studyTypes ? {
        'Clinical Trial': Math.floor((studyTypes['Clinical Trial'] || 0) * count / sample_size_analyzed),
        'Meta-Analysis': Math.floor((studyTypes['Meta-Analysis'] || 0) * count / sample_size_analyzed),
        'Observational': Math.floor((studyTypes['Observational'] || 0) * count / sample_size_analyzed),
        'Review': Math.floor((studyTypes['Review'] || 0) * count / sample_size_analyzed),
        'Laboratory': Math.floor((studyTypes['Laboratory'] || 0) * count / sample_size_analyzed)
      } : undefined;
      
      data.push({
        year,
        count,
        studyTypes: studyTypesForYear,
        totalStudies: count
      });
    }
    
    return data;
  };

  // Default to Mental Illness if no categories provided
  const defaultCategories = {
    'Mental Illness': [
      'depression',
      'anxiety',
      'panic disorder',
      'bipolar disorder'
    ]
  };

  // Fetch data from Analytics Service API
  useEffect(() => {
    // Priority 1: Use researchData prop if provided (research_coverage)
    if (researchData?.research_coverage) {
      console.log('[PublicationTimelineChart] Using research_coverage from researchData prop:', researchData.research_coverage);
      const timelineData = convertResearchCoverageToTimeline(
        researchData.research_coverage,
        researchData.study_type_distribution
      );
      setApiData(timelineData);
      return;
    }
    
    // Priority 2: Use publications prop if provided
    if (publications.length > 0) {
      console.log('[PublicationTimelineChart] Using provided publications prop');
      return;
    }
    
    // Priority 3: Fetch from API
    const fetchAnalytics = async () => {
      console.log('[PublicationTimelineChart] Starting API fetch...');
      setLoading(true);
      setError(null);
      try {
        // Use services.wihy.ai in production, localhost only in development
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        const apiUrl = isLocalhost ? (process.env.REACT_APP_API_URL || 'http://localhost:5000') : 'https://services.wihy.ai';
        console.log('[PublicationTimelineChart] API URL:', apiUrl);
        const categoriesToUse = categories || defaultCategories;
        console.log('[PublicationTimelineChart] Categories:', categoriesToUse);
        
        const response = await fetch(`${apiUrl}/api/analytics/dashboard`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            researchCategories: categoriesToUse
          })
        });
        
        console.log('[PublicationTimelineChart] Response status:', response.status);
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('[PublicationTimelineChart] API response:', data);
        
        // Extract publication timeline from analytics.research_metrics.publications_by_year
        const publicationsByYear = data.analytics?.research_metrics?.publications_by_year || {};
        console.log('[PublicationTimelineChart] Publications by year:', publicationsByYear);
        
        // Convert object to array format and sort by year
        const formattedData: PublicationData[] = Object.entries(publicationsByYear)
          .map(([year, count]) => ({
            year: parseInt(year),
            count: count as number,
            totalStudies: count as number
          }))
          .sort((a, b) => a.year - b.year);
        
        setApiData(formattedData.length > 0 ? formattedData : null);
      } catch (err) {
        console.error('[PublicationTimelineChart] Failed to fetch analytics:', err);
        setError('Failed to load publication timeline');
        setApiData(null);
      } finally {
        console.log('[PublicationTimelineChart] Fetch complete');
        setLoading(false);
      }
    };
    
    fetchAnalytics();
  }, [publications.length, categories, researchData]);  // Generate sample data based on timeRange
  const generateSampleData = (): PublicationData[] => {
    const currentYear = new Date().getFullYear();
    const data: PublicationData[] = [];
    
    switch (timeRange) {
      case 'recent':
        // Last 5 years
        for (let i = 4; i >= 0; i--) {
          const year = currentYear - i;
          data.push({
            year,
            count: Math.floor(Math.random() * 50) + 10,
            studyTypes: {
              'Clinical Trial': Math.floor(Math.random() * 15) + 5,
              'Meta-Analysis': Math.floor(Math.random() * 8) + 2,
              'Observational': Math.floor(Math.random() * 20) + 5,
              'Review': Math.floor(Math.random() * 12) + 3,
              'Laboratory': Math.floor(Math.random() * 10) + 2
            }
          });
        }
        break;
        
      case 'decade':
        // Last 10 years
        for (let i = 9; i >= 0; i--) {
          const year = currentYear - i;
          data.push({
            year,
            count: Math.floor(Math.random() * 80) + 20,
            studyTypes: {
              'Clinical Trial': Math.floor(Math.random() * 25) + 5,
              'Meta-Analysis': Math.floor(Math.random() * 15) + 3,
              'Observational': Math.floor(Math.random() * 30) + 8,
              'Review': Math.floor(Math.random() * 20) + 5,
              'Laboratory': Math.floor(Math.random() * 15) + 3
            }
          });
        }
        break;
        
      case 'all-time':
        // Last 20 years
        for (let i = 19; i >= 0; i--) {
          const year = currentYear - i;
          data.push({
            year,
            count: Math.floor(Math.random() * 100) + 10,
            studyTypes: {
              'Clinical Trial': Math.floor(Math.random() * 30) + 5,
              'Meta-Analysis': Math.floor(Math.random() * 20) + 2,
              'Observational': Math.floor(Math.random() * 40) + 10,
              'Review': Math.floor(Math.random() * 25) + 5,
              'Laboratory': Math.floor(Math.random() * 20) + 3
            }
          });
        }
        break;
    }
    
    return data;
  };

  const publicationData = publications.length > 0 ? publications : (apiData || generateSampleData());

  // Chart dimensions based on size
  const dimensions = {
    small: { width: 300, height: 180 },
    medium: { width: 450, height: 250 },
    large: { width: 600, height: 320 }
  };

  // Calculate trend line data using simple linear regression
  const calculateTrendline = (data: PublicationData[]) => {
    const n = data.length;
    const sumX = data.reduce((sum, item, index) => sum + index, 0);
    const sumY = data.reduce((sum, item) => sum + item.count, 0);
    const sumXY = data.reduce((sum, item, index) => sum + index * item.count, 0);
    const sumXX = data.reduce((sum, item, index) => sum + index * index, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return data.map((_, index) => slope * index + intercept);
  };

  const trendlineData = showTrendline ? calculateTrendline(publicationData) : [];

  const chartData = {
    labels: publicationData.map(p => p.year.toString()),
    datasets: [
      {
        label: 'Publications per Year',
        data: publicationData.map(p => p.count),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        pointBackgroundColor: '#3b82f6',
        pointBorderColor: '#1d4ed8',
        pointRadius: size === 'small' ? 3 : 4,
        pointHoverRadius: size === 'small' ? 5 : 6,
        tension: 0.3,
        fill: true,
        borderWidth: 2
      },
      ...(showTrendline ? [{
        label: 'Trend',
        data: trendlineData,
        borderColor: '#ef4444',
        backgroundColor: 'transparent',
        borderDash: [5, 5],
        pointRadius: 0,
        tension: 0,
        borderWidth: 2
      }] : [])
    ]
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: showLabels,
        position: 'top' as const,
        labels: {
          font: {
            size: size === 'small' ? 10 : 12
          },
          color: '#374151'
        }
      },
      title: {
        display: showLabels,
        text: title,
        font: {
          size: size === 'small' ? 12 : size === 'medium' ? 14 : 16,
          weight: 'bold'
        },
        color: '#374151'
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#3b82f6',
        borderWidth: 1,
        cornerRadius: 8,
        callbacks: {
          label: (context) => {
            const pub = publicationData[context.dataIndex];
            const lines = [`${pub.count} publications in ${pub.year}`];
            
            if (pub.studyTypes) {
              lines.push('', 'Study breakdown:');
              Object.entries(pub.studyTypes).forEach(([type, count]) => {
                if (count > 0) {
                  lines.push(`${type}: ${count}`);
                }
              });
            }
            
            return lines;
          }
        }
      }
    },
    scales: {
      x: {
        title: {
          display: showLabels,
          text: 'Year',
          font: {
            size: size === 'small' ? 10 : 12
          },
          color: '#6b7280'
        },
        ticks: {
          font: {
            size: size === 'small' ? 10 : 12
          },
          color: '#6b7280',
          maxTicksLimit: timeRange === 'all-time' ? 10 : undefined
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        }
      },
      y: {
        title: {
          display: showLabels,
          text: 'Number of Publications',
          font: {
            size: size === 'small' ? 10 : 12
          },
          color: '#6b7280'
        },
        beginAtZero: true,
        ticks: {
          font: {
            size: size === 'small' ? 10 : 12
          },
          color: '#6b7280'
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index'
    }
  };

  // Calculate statistics
  const totalPublications = publicationData.reduce((sum, p) => sum + p.count, 0);
  const avgPerYear = Math.round(totalPublications / publicationData.length);
  const recentYears = publicationData.slice(-3);
  const recentTotal = recentYears.reduce((sum, p) => sum + p.count, 0);
  const recentAvg = Math.round(recentTotal / recentYears.length);

  return (
    <div className="flex flex-col p-6 rounded-2xl bg-white border border-gray-200 shadow-md h-[500px] overflow-hidden">
      <h3 className="text-2xl font-semibold text-vh-muted mb-5">
        {title} {loading && <span className="text-sm text-gray-400">(Loading...)</span>}
      </h3>
      
      {error && (
        <div className="text-xs text-red-500 mb-2">{error}</div>
      )}
      
      <div className="flex-1 relative">
        <Line data={chartData} options={options} />
      </div>
      
      {/* Research summary */}
      {showLabels && (
        <div className="mt-3 text-xs text-gray-500 grid grid-cols-[repeat(auto-fit,minmax(120px,1fr))] gap-2">
          <div>
            <strong className="text-gray-700">Total:</strong> {totalPublications} studies
          </div>
          <div>
            <strong className="text-gray-700">Avg/Year:</strong> {avgPerYear}
          </div>
          <div>
            <strong className="text-gray-700">Recent Avg:</strong> {recentAvg}
          </div>
          <div className={recentAvg > avgPerYear ? 'text-green-500' : 'text-red-500'}>
            <strong>Trend:</strong> {recentAvg > avgPerYear ? '↗️ Increasing' : '↘️ Declining'}
          </div>
        </div>
      )}
      
      <div className="flex justify-center mt-4 flex-shrink-0">
        <AnalyzeWithWihyButton
          cardContext={`Publication timeline analysis: ${title} showing ${timeRange} data. Total publications: ${totalPublications} studies. Average per year: ${avgPerYear}. Recent average: ${recentAvg}. Trend: ${recentAvg > avgPerYear ? 'Increasing' : 'Declining'} research activity. Data spans from ${publicationData[0]?.year} to ${publicationData[publicationData.length - 1]?.year}`}
          userQuery="Analyze this publication timeline and explain what the research trends indicate about scientific interest and evidence development in this area"
          onAnalyze={onAnalyze}
        />
      </div>
    </div>
  );
};

export default PublicationTimelineChart;