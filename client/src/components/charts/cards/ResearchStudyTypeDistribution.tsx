import React, { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import AnalyzeWithWihyButton from '../shared/AnalyzeWithWihyButton';

ChartJS.register(ArcElement, Tooltip, Legend);

interface StudyTypeData {
  type: string;
  count: number;
  percentage: number;
}

interface ResearchStudyTypeDistributionProps {
  researchData?: {
    study_type_distribution?: Record<string, number>;
  };
  onAnalyze?: (userMessage: string, assistantMessage: string) => void;
}

/**
 * ResearchStudyTypeDistribution - Dedicated component for research context only
 * Shows distribution of study types from research results
 */
const ResearchStudyTypeDistribution: React.FC<ResearchStudyTypeDistributionProps> = ({
  researchData,
  onAnalyze
}) => {
  const [studyData, setStudyData] = useState<StudyTypeData[]>([]);

  useEffect(() => {
    if (researchData?.study_type_distribution) {
      const distribution = researchData.study_type_distribution;
      const total = Object.values(distribution).reduce((sum, count) => sum + count, 0);
      
      if (total === 0) {
        setStudyData([]);
        return;
      }
      
      const formatted: StudyTypeData[] = Object.entries(distribution)
        .filter(([_, count]) => count > 0)
        .map(([type, count]) => ({
          type,
          count,
          percentage: Math.round((count / total) * 100)
        }))
        .sort((a, b) => b.count - a.count);
      
      setStudyData(formatted);
    } else {
      setStudyData([]);
    }
  }, [researchData]);

  const getStudyColor = (index: number): string => {
    const colors = [
      '#10b981', // Green
      '#3b82f6', // Blue
      '#f59e0b', // Orange
      '#8b5cf6', // Purple
      '#ef4444', // Red
      '#06b6d4', // Cyan
      '#84cc16', // Lime
    ];
    return colors[index % colors.length];
  };

  const totalStudies = studyData.reduce((sum, s) => sum + s.count, 0);

  const chartData = {
    labels: studyData.map(s => s.type),
    datasets: [
      {
        label: 'Number of Studies',
        data: studyData.map(s => s.count),
        backgroundColor: studyData.map((_, i) => getStudyColor(i)),
        borderColor: studyData.map((_, i) => getStudyColor(i)),
        borderWidth: 2,
        hoverOffset: 4
      }
    ]
  };

  const options: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'bottom' as const,
        labels: {
          font: { size: 12 },
          color: '#374151',
          padding: 15,
          usePointStyle: true,
          generateLabels: (chart) => {
            const data = chart.data;
            if (data.labels && data.datasets.length) {
              return data.labels.map((label, i) => {
                const dataset = data.datasets[0];
                const study = studyData[i];
                
                return {
                  text: `${label} (${study.percentage}%)`,
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
              `Percentage: ${study.percentage}%`
            ];
          }
        }
      }
    },
    cutout: '60%'
  };

  return (
    <div className="flex flex-col p-6 rounded-2xl bg-white border border-gray-200 shadow-md h-[500px] overflow-hidden">
      <h3 className="text-2xl font-semibold text-vh-muted mb-5">
        Study Type Distribution
      </h3>
      
      {studyData.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-gray-400">
          Waiting for research results...
        </div>
      ) : (
        <>
          <div className="flex-1 relative">
            <Doughnut data={chartData} options={options} />
          </div>
          
          <div className="mt-3 text-xs text-gray-500 grid grid-cols-2 gap-2 text-center">
            <div>
              <strong className="text-gray-700">Total Studies:</strong> {totalStudies}
            </div>
            <div>
              <strong className="text-gray-700">Most Common:</strong> {studyData[0]?.type || 'N/A'}
            </div>
          </div>
        </>
      )}
      
      <div className="flex justify-center mt-4 flex-shrink-0">
        <AnalyzeWithWihyButton
          cardContext={`Study type distribution: ${totalStudies} total studies. Distribution: ${studyData.map(s => `${s.type}: ${s.count} (${s.percentage}%)`).join(', ')}`}
          userQuery="Explain how different study types affect research quality and reliability"
          onAnalyze={onAnalyze}
        />
      </div>
    </div>
  );
};

export default ResearchStudyTypeDistribution;
