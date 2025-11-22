import React, { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import { Pie, Doughnut } from 'react-chartjs-2';
import AnalyzeWithWihyButton from '../shared/AnalyzeWithWihyButton';

ChartJS.register(ArcElement, Tooltip, Legend);

export interface StudyTypeData {
  type: string;
  count: number;
  percentage: number;
  description?: string;
  evidenceLevel?: 'high' | 'medium' | 'low';
}

interface StudyTypeDistributionChartProps {
  studyTypes?: StudyTypeData[];
  size?: 'small' | 'medium' | 'large';
  showLabels?: boolean;
  title?: string;
  chartStyle?: 'pie' | 'doughnut';
  showPercentages?: boolean;
  showLegend?: boolean;
  categories?: Record<string, string[]>; // Custom research categories for API
  onAnalyze?: (userMessage: string, assistantMessage: string) => void;
}

const StudyTypeDistributionChart: React.FC<StudyTypeDistributionChartProps> = ({
  studyTypes = [],
  size = 'medium',
  showLabels = true,
  title = 'Study Type Distribution',
  chartStyle = 'doughnut',
  showPercentages = true,
  showLegend = true,
  categories,
  onAnalyze
}) => {
  const [apiData, setApiData] = useState<StudyTypeData[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch data from Analytics Service API
  useEffect(() => {
    if (studyTypes.length === 0) {
      const fetchAnalytics = async () => {
        console.log('[StudyTypeDistributionChart] Starting API fetch...');
        setLoading(true);
        setError(null);
        try {
          const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
          console.log('[StudyTypeDistributionChart] API URL:', apiUrl);
          console.log('[StudyTypeDistributionChart] Categories:', categories);
          
          const response = await fetch(`${apiUrl}/api/analytics/dashboard`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              researchCategories: categories
            })
          });
          
          console.log('[StudyTypeDistributionChart] Response status:', response.status);
          
          if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
          }
          
          const data = await response.json();
          console.log('[StudyTypeDistributionChart] API response:', data);
          
          // Extract study type distribution from analytics
          const studyTypeData = data.studyTypeDistribution || [];
          const formattedData: StudyTypeData[] = studyTypeData.map((item: any) => ({
            type: item.type,
            count: item.count,
            percentage: item.percentage,
            description: item.description,
            evidenceLevel: item.evidenceLevel
          }));
          
          setApiData(formattedData.length > 0 ? formattedData : null);
        } catch (err) {
          console.error('[StudyTypeDistributionChart] Failed to fetch analytics:', err);
          setError('Failed to load study type data');
          setApiData(null);
        } finally {
          console.log('[StudyTypeDistributionChart] Fetch complete');
          setLoading(false);
        }
      };
      
      fetchAnalytics();
    } else {
      console.log('[StudyTypeDistributionChart] Using provided studyTypes prop');
    }
  }, [studyTypes.length, categories]);

  // Default sample data representing typical research distribution
  const defaultStudyTypes: StudyTypeData[] = [
    { 
      type: 'Clinical Trials', 
      count: 45, 
      percentage: 30,
      description: 'Controlled human studies',
      evidenceLevel: 'high'
    },
    { 
      type: 'Observational Studies', 
      count: 60, 
      percentage: 40,
      description: 'Population-based studies',
      evidenceLevel: 'medium'
    },
    { 
      type: 'Meta-Analyses', 
      count: 18, 
      percentage: 12,
      description: 'Analysis of multiple studies',
      evidenceLevel: 'high'
    },
    { 
      type: 'Systematic Reviews', 
      count: 15, 
      percentage: 10,
      description: 'Comprehensive literature reviews',
      evidenceLevel: 'high'
    },
    { 
      type: 'Laboratory Studies', 
      count: 9, 
      percentage: 6,
      description: 'In vitro and animal studies',
      evidenceLevel: 'low'
    },
    { 
      type: 'Case Studies', 
      count: 3, 
      percentage: 2,
      description: 'Individual case reports',
      evidenceLevel: 'low'
    }
  ];

  const studyData = studyTypes.length > 0 ? studyTypes : (apiData || defaultStudyTypes);

  // Chart dimensions based on size
  const dimensions = {
    small: { width: 250, height: 200 },
    medium: { width: 320, height: 280 },
    large: { width: 400, height: 350 }
  };

  // Color mapping based on evidence level and study type
  const getStudyColor = (type: string, _evidenceLevel?: string) => {
    const colors = {
      'Clinical Trials': '#10b981', // Green - High evidence
      'Meta-Analyses': '#059669', // Dark green - Highest evidence
      'Systematic Reviews': '#047857', // Darker green - Highest evidence
      'Observational Studies': '#3b82f6', // Blue - Medium evidence
      'Laboratory Studies': '#f59e0b', // Orange - Lower evidence
      'Case Studies': '#ef4444', // Red - Lowest evidence
      'Cohort Studies': '#6366f1', // Indigo - Medium evidence
      'Cross-sectional': '#8b5cf6', // Purple - Medium evidence
      'Randomized Controlled': '#059669', // Dark green - High evidence
      'default': '#6b7280' // Gray - Unknown
    };
    
    return colors[type as keyof typeof colors] || colors.default;
  };

  const chartData = {
    labels: studyData.map(s => s.type),
    datasets: [
      {
        label: 'Number of Studies',
        data: studyData.map(s => s.count),
        backgroundColor: studyData.map(s => getStudyColor(s.type, s.evidenceLevel)),
        borderColor: studyData.map(s => getStudyColor(s.type, s.evidenceLevel)),
        borderWidth: 2,
        hoverOffset: 4
      }
    ]
  };

  const options: ChartOptions<'pie' | 'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: showLegend,
        position: 'bottom' as const,
        labels: {
          font: {
            size: size === 'small' ? 10 : 12
          },
          color: '#374151',
          padding: 15,
          usePointStyle: true,
          generateLabels: (chart) => {
            const data = chart.data;
            if (data.labels && data.datasets.length) {
              return data.labels.map((label, i) => {
                const dataset = data.datasets[0];
                const value = dataset.data[i] as number;
                const study = studyData[i];
                
                return {
                  text: showPercentages 
                    ? `${label} (${study.percentage}%)`
                    : `${label} (${value})`,
                  fillStyle: dataset.backgroundColor?.[i] as string,
                  strokeStyle: dataset.borderColor?.[i] as string,
                  lineWidth: 2,
                  hidden: false,
                  index: i,
                  pointStyle: 'circle'
                };
              });
            }
            return [];
          }
        }
      },
      title: {
        display: showLabels,
        text: title,
        font: {
          size: size === 'small' ? 12 : size === 'medium' ? 14 : 16,
          weight: 'bold'
        },
        color: '#374151',
        padding: {
          top: 10,
          bottom: 20
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#374151',
        borderWidth: 1,
        cornerRadius: 8,
        callbacks: {
          label: (context) => {
            const study = studyData[context.dataIndex];
            return [
              `${study.type}: ${study.count} studies`,
              `Percentage: ${study.percentage}%`,
              `Evidence Level: ${study.evidenceLevel || 'N/A'}`,
              ...(study.description ? [`Description: ${study.description}`] : [])
            ];
          }
        }
      }
    },
    // Doughnut-specific options
    ...(chartStyle === 'doughnut' && {
      cutout: '60%'
    })
  };

  // Calculate statistics
  const totalStudies = studyData.reduce((sum, s) => sum + s.count, 0);
  const highEvidenceStudies = studyData
    .filter(s => s.evidenceLevel === 'high')
    .reduce((sum, s) => sum + s.count, 0);
  const highEvidencePercentage = Math.round((highEvidenceStudies / totalStudies) * 100);

  const ChartComponent = chartStyle === 'pie' ? Pie : Doughnut;

  return (
    <div className="flex flex-col p-6 rounded-2xl bg-white border border-gray-200 shadow-md h-[650px] md:h-[500px] overflow-hidden">
      <h3 className="text-2xl font-semibold text-vh-muted mb-5">
        {title} {loading && <span className="text-sm text-gray-400">(Loading...)</span>}
      </h3>
      
      {error && (
        <div className="text-xs text-red-500 mb-2">{error}</div>
      )}
      
      <div className="flex-1 relative">
        <ChartComponent data={chartData} options={options} />
      </div>
      
      {/* Evidence quality summary */}
      {showLabels && (
        <div className="mt-3 text-xs md:text-xs text-gray-500 grid grid-cols-1 md:grid-cols-[repeat(auto-fit,minmax(120px,1fr))] gap-1.5 md:gap-2 text-center md:text-left">
          <div>
            <strong className="text-gray-700">Total Studies:</strong> {totalStudies}
          </div>
          <div>
            <strong className="text-gray-700">High Evidence:</strong> {highEvidenceStudies} ({highEvidencePercentage}%)
          </div>
          <div className={highEvidencePercentage >= 50 ? 'text-green-500' : 'text-yellow-500'}>
            <strong>Quality:</strong> {highEvidencePercentage >= 50 ? '✅ Strong' : '⚠️ Mixed'}
          </div>
          <div>
            <strong className="text-gray-700">Most Common:</strong> {studyData[0]?.type || 'N/A'}
          </div>
        </div>
      )}
      
      <div className="flex justify-center mt-4 flex-shrink-0">
        <AnalyzeWithWihyButton
          cardContext={`Study type analysis: ${title} - Total studies: ${totalStudies}. High evidence studies: ${highEvidenceStudies} (${highEvidencePercentage}%). Quality rating: ${highEvidencePercentage >= 50 ? 'Strong' : 'Mixed'}. Most common type: ${studyData[0]?.type || 'N/A'}. Distribution: ${studyData.map(study => `${study.type}: ${study.count} studies (${study.percentage}%)`).join(', ')}`}
          userQuery="Analyze this study type distribution and explain how different research methodologies affect the strength of evidence"
          onAnalyze={onAnalyze}
        />
      </div>
    </div>
  );
};

export default StudyTypeDistributionChart;