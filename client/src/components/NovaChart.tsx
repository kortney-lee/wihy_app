import React from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

interface NovaChartProps {
  novaDistribution: Array<{
    label: string;
    count: number;
    color: string;
    percentage: number;
  }>;
}

const NovaChart: React.FC<NovaChartProps> = ({ novaDistribution }) => {
  if (!novaDistribution || novaDistribution.length === 0) {
    return null;
  }

  const chartData = {
    labels: novaDistribution.map(item => item.label.replace('Group ', '').replace(': ', ':\n')),
    datasets: [{
      data: novaDistribution.map(item => item.percentage),
      backgroundColor: novaDistribution.map(item => item.color),
      borderWidth: 2,
      borderColor: '#fff',
      hoverBorderWidth: 3
    }]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '50%',
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          boxWidth: 12,
          padding: 8,
          font: { size: 11 },
          usePointStyle: true
        }
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return `${context.label}: ${context.parsed}%`;
          }
        }
      }
    }
  };

  return (
    <div>
      <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: '600' }}>
        NOVA Food Classification
      </h3>
      <div style={{ height: '200px' }}>
        <Doughnut data={chartData} options={options} />
      </div>
      <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#666' }}>
        {novaDistribution.map((item, index) => (
          <div key={index} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
            <span>{item.label.replace('Group ', '')}</span>
            <span>{item.count} items</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NovaChart;