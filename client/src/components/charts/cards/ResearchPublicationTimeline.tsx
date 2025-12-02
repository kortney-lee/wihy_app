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
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import AnalyzeWithWihyButton from '../shared/AnalyzeWithWihyButton';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface PublicationData {
  year: number;
  count: number;
}

interface ResearchPublicationTimelineProps {
  researchData?: {
    publication_timeline?: Record<string, number>;
  };
  onAnalyze?: (userMessage: string, assistantMessage: string) => void;
}

/**
 * ResearchPublicationTimeline - Dedicated component for research context only
 * Shows publication timeline from research results
 */
const ResearchPublicationTimeline: React.FC<ResearchPublicationTimelineProps> = ({
  researchData,
  onAnalyze
}) => {
  const [publicationData, setPublicationData] = useState<PublicationData[]>([]);

  useEffect(() => {
    if (researchData?.publication_timeline) {
      const timeline = researchData.publication_timeline;
      
      const formatted: PublicationData[] = Object.entries(timeline)
        .map(([year, count]) => ({
          year: parseInt(year),
          count
        }))
        .sort((a, b) => a.year - b.year);
      
      setPublicationData(formatted);
    } else {
      setPublicationData([]);
    }
  }, [researchData]);

  const totalPublications = publicationData.reduce((sum, p) => sum + p.count, 0);
  const avgPerYear = publicationData.length > 0 ? Math.round(totalPublications / publicationData.length) : 0;
  
  const recentYears = publicationData.slice(-3);
  const recentTotal = recentYears.reduce((sum, p) => sum + p.count, 0);
  const recentAvg = recentYears.length > 0 ? Math.round(recentTotal / recentYears.length) : 0;

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
        pointRadius: 4,
        pointHoverRadius: 6,
        tension: 0.3,
        fill: true,
        borderWidth: 2
      }
    ]
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
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
            return `${pub.count} publications in ${pub.year}`;
          }
        }
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Year',
          font: { size: 12 },
          color: '#6b7280'
        },
        ticks: {
          font: { size: 12 },
          color: '#6b7280'
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        }
      },
      y: {
        title: {
          display: true,
          text: 'Publications',
          font: { size: 12 },
          color: '#6b7280'
        },
        beginAtZero: true,
        ticks: {
          font: { size: 12 },
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

  return (
    <div className="flex flex-col p-6 rounded-2xl bg-white border border-gray-200 shadow-md h-[500px] overflow-hidden">
      <h3 className="text-2xl font-semibold text-vh-muted mb-5">
        Publication Timeline
      </h3>
      
      {publicationData.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-gray-400">
          Waiting for research results...
        </div>
      ) : (
        <>
          <div className="flex-1 relative">
            <Line data={chartData} options={options} />
          </div>
          
          <div className="mt-3 text-xs text-gray-500 grid grid-cols-2 md:grid-cols-4 gap-2">
            <div>
              <strong className="text-gray-700">Total:</strong> {totalPublications}
            </div>
            <div>
              <strong className="text-gray-700">Avg/Year:</strong> {avgPerYear}
            </div>
            <div>
              <strong className="text-gray-700">Recent:</strong> {recentAvg}
            </div>
            <div className={recentAvg > avgPerYear ? 'text-green-500' : 'text-red-500'}>
              <strong>Trend:</strong> {recentAvg > avgPerYear ? '↗️ Up' : '↘️ Down'}
            </div>
          </div>
        </>
      )}
      
      <div className="flex justify-center mt-4 flex-shrink-0">
        <AnalyzeWithWihyButton
          cardContext={`Publication timeline: ${totalPublications} total publications. Average: ${avgPerYear}/year. Recent average: ${recentAvg}. Trend: ${recentAvg > avgPerYear ? 'Increasing' : 'Declining'}`}
          userQuery="Analyze this publication timeline and explain what research trends indicate about evidence development"
          onAnalyze={onAnalyze}
        />
      </div>
    </div>
  );
};

export default ResearchPublicationTimeline;
