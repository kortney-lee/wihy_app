import React from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

interface BodyCompositionChartProps {
  bodyFatPercent?: number;
  leanMassPercent?: number;
}

const BodyCompositionChart: React.FC<BodyCompositionChartProps> = ({ 
  bodyFatPercent = 18.2, 
  leanMassPercent = 81.8 
}) => {
  const data = {
    labels: ['Body Fat', 'Lean Mass'],
    datasets: [
      {
        data: [bodyFatPercent, leanMassPercent],
        backgroundColor: [
          '#ef4444', // Red for body fat
          '#10b981', // Green for lean mass
        ],
        borderColor: [
          '#dc2626',
          '#059669',
        ],
        borderWidth: 2,
        hoverBackgroundColor: [
          '#f87171',
          '#34d399',
        ],
        hoverBorderWidth: 3,
      },
    ],
  };

  const options: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle',
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: function(context) {
            return `${context.label}: ${context.parsed}%`;
          }
        }
      },
    },
    cutout: '60%', // Creates the donut hole
    elements: {
      arc: {
        borderJoinStyle: 'round',
      },
    },
  };

  return (
    <div className="chart-container" style={{ position: 'relative' }}>
      <div className="chart-canvas-wrapper">
        <Doughnut data={data} options={options} />
      </div>
      {/* Center text */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        textAlign: 'center',
        pointerEvents: 'none',
      }}>
        <div style={{ 
          fontSize: '18px', 
          fontWeight: 'bold', 
          color: '#1f2937',
          lineHeight: '1.2'
        }}>
          {bodyFatPercent}%
        </div>
        <div style={{ 
          fontSize: '11px', 
          color: '#6b7280',
          marginTop: '2px'
        }}>
          Body Fat
        </div>
      </div>
    </div>
  );
};

export default BodyCompositionChart;