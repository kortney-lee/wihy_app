import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import AnalyzeWithWihyButton from '../shared/AnalyzeWithWihyButton';

function CardShell({
  title = "",
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col p-6 rounded-2xl bg-white border border-gray-200 shadow-md h-[420px] overflow-hidden">
      <h3 className="text-xl font-semibold text-gray-400 m-0 mb-3">{title}</h3>
      <div className="flex flex-col flex-1 overflow-hidden min-h-0">{children}</div>
    </section>
  );
}


ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface MoodChartProps {
  period?: 'day' | 'week' | 'month';
  onAnalyze?: (userMessage: string, assistantMessage: string) => void;
}

const MoodChart: React.FC<MoodChartProps> = ({
  period = 'week',
  onAnalyze
}) => {
  // Generate mood data based on period
  const generateData = () => {
    switch (period) {
      case 'day':
        return {
          labels: ['6am', '9am', '12pm', '3pm', '6pm', '9pm', '12am'],
          mood: [6.5, 7.2, 8.0, 7.8, 8.5, 8.2, 7.0],
          energy: [5.0, 6.5, 7.5, 6.8, 7.0, 5.5, 4.0],
          stress: [3.0, 4.0, 5.5, 6.2, 4.5, 3.2, 2.8]
        };
      case 'month':
        return {
          labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
          mood: [7.5, 8.1, 7.8, 8.3],
          energy: [6.8, 7.2, 6.9, 7.5],
          stress: [4.2, 3.8, 4.5, 3.5]
        };
      default: // week
        return {
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          mood: [7.2, 8.0, 7.8, 8.2, 8.5, 8.8, 8.0],
          energy: [6.5, 7.0, 6.8, 7.2, 8.0, 7.5, 6.5],
          stress: [5.2, 4.8, 5.5, 4.2, 3.8, 2.5, 3.0]
        };
    }
  };

  const { labels, mood, energy, stress } = generateData();
  const averageMood = (mood.reduce((sum, val) => sum + val, 0) / mood.length).toFixed(1);

  // Chart.js data structure
  const data = {
    labels,
    datasets: [
      {
        label: 'Mood Rating',
        data: mood,
        borderColor: '#8b5cf6',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        tension: 0.4,
        pointRadius: 6,
        pointHoverRadius: 8,
        fill: false,
        pointBackgroundColor: '#8b5cf6',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
      },
      {
        label: 'Energy Level',
        data: energy,
        borderColor: '#06b6d4',
        backgroundColor: 'rgba(6, 182, 212, 0.1)',
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
        fill: false,
        pointBackgroundColor: '#06b6d4',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
      },
      {
        label: 'Stress Level',
        data: stress,
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
        fill: false,
        pointBackgroundColor: '#f59e0b',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
      }
    ],
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        align: 'end' as const,
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 15,
          font: {
            size: 11,
          },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#8b5cf6',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${context.parsed.y}/10`;
          }
        }
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#64748b',
          font: {
            size: 11,
          },
        },
      },
      y: {
        min: 0,
        max: 10,
        title: {
          display: true,
          text: 'Rating (1-10)',
          color: '#8b5cf6',
          font: {
            size: 12,
            weight: 'bold',
          },
        },
        grid: {
          color: 'rgba(148, 163, 184, 0.1)',
        },
        ticks: {
          color: '#8b5cf6',
          font: {
            size: 11,
          },
          stepSize: 1,
        },
      },
    },
    interaction: {
      intersect: false,
      mode: 'index',
    },
  };

  return (
    <CardShell title="Mood & Well-being">
      <div className="flex-1 flex flex-col justify-center min-h-0 mb-3">
        <Line data={data} options={options} />
      </div>
      
      <div className="flex justify-center mt-auto flex-shrink-0">
        <AnalyzeWithWihyButton
          cardContext={`Mood Chart: Showing mood, energy, and stress levels over ${period} period. Average mood rating: ${averageMood}/10. Tracks emotional well-being and mental health indicators for holistic wellness monitoring.`}
          userQuery="Analyze my mood patterns and emotional well-being, providing insights about stress management and mental health recommendations"
          onAnalyze={onAnalyze}
        />
      </div>
    </CardShell>
  );
};

export default MoodChart;