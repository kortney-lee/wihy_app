import React from 'react';
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
  onAnalyze
}) => {
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

  const studyData = studyTypes.length > 0 ? studyTypes : defaultStudyTypes;

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
    <div style={{
      display: "flex",
      flexDirection: "column",
      padding: 24,
      borderRadius: 16,
      background: "white",
      border: "1px solid #e5e7eb",
      boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
      height: window.innerWidth <= 768 ? 650 : 500, // Much taller on mobile for text content
      overflow: "hidden"
    }}>
      <h3 style={{ fontSize: 24, fontWeight: 600, color: "#9CA3AF", margin: 0, marginBottom: 20 }}>
        {title}
      </h3>
      
      <div style={{ flex: 1, position: 'relative' }}>
        <ChartComponent data={chartData} options={options} />
      </div>
      
      {/* Evidence quality summary */}
      {showLabels && (
        <div style={{ 
          marginTop: '12px', 
          fontSize: window.innerWidth <= 768 ? '11px' : '12px',
          color: '#6b7280',
          display: 'grid',
          gridTemplateColumns: window.innerWidth <= 768 ? '1fr' : 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: window.innerWidth <= 768 ? '6px' : '8px',
          textAlign: window.innerWidth <= 768 ? 'center' : 'left'
        }}>
          <div>
            <strong style={{ color: '#374151' }}>Total Studies:</strong> {totalStudies}
          </div>
          <div>
            <strong style={{ color: '#374151' }}>High Evidence:</strong> {highEvidenceStudies} ({highEvidencePercentage}%)
          </div>
          <div style={{ color: highEvidencePercentage >= 50 ? '#10b981' : '#f59e0b' }}>
            <strong>Quality:</strong> {highEvidencePercentage >= 50 ? '✅ Strong' : '⚠️ Mixed'}
          </div>
          <div>
            <strong style={{ color: '#374151' }}>Most Common:</strong> {studyData[0]?.type || 'N/A'}
          </div>
        </div>
      )}
      
      <div style={{ display: "flex", justifyContent: "center", marginTop: 16, flexShrink: 0 }}>
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