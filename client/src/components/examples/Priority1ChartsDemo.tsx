/**
 * Priority 1 Charts Demo - Essential Health Scoring Charts
 * Demonstrates the core health and nutrition visualization components
 */

import React, { useState } from 'react';
import HealthScoreGauge from '../charts/individual/HealthScoreGauge';
import NutritionGradeBadge from '../charts/cards/NutritionGradeBadge';
import ResearchQualityGauge from '../charts/cards/ResearchQualityGauge';
import MacronutrientPieChart from '../charts/cards/MacronutrientPieChart';

const Priority1ChartsDemo: React.FC = () => {
  // Sample data for demonstration
  const [sampleData] = useState({
    healthScore: 78,
    nutritionGrade: 'B+',
    nutritionScore: 82,
    researchQuality: 85,
    studyCount: 23,
    evidenceLevel: 'II' as const,
    macronutrients: {
      protein: 25,
      carbohydrates: 45,
      fat: 30
    }
  });

  const [displayMode, setDisplayMode] = useState<'grams' | 'calories' | 'percentage'>('percentage');
  const [chartSize, setChartSize] = useState<'small' | 'medium' | 'large'>('medium');

  return (
    <div style={{ 
      padding: '20px', 
      maxWidth: '1200px', 
      margin: '0 auto',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <h1 style={{ 
        textAlign: 'center', 
        marginBottom: '10px',
        color: '#1F2937'
      }}>
        Priority 1: Essential Health Charts
      </h1>
      
      <p style={{ 
        textAlign: 'center', 
        color: '#6B7280',
        marginBottom: '30px',
        fontSize: '16px'
      }}>
        Core health scoring and nutrition visualization components
      </p>

      {/* Controls */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '20px',
        marginBottom: '30px',
        flexWrap: 'wrap'
      }}>
        <div>
          <label style={{ marginRight: '8px', fontSize: '14px', color: '#374151' }}>
            Chart Size:
          </label>
          <select 
            value={chartSize} 
            onChange={(e) => setChartSize(e.target.value as any)}
            style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #D1D5DB' }}
          >
            <option value="small">Small</option>
            <option value="medium">Medium</option>
            <option value="large">Large</option>
          </select>
        </div>
        
        <div>
          <label style={{ marginRight: '8px', fontSize: '14px', color: '#374151' }}>
            Macro Display:
          </label>
          <select 
            value={displayMode} 
            onChange={(e) => setDisplayMode(e.target.value as any)}
            style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #D1D5DB' }}
          >
            <option value="percentage">Percentage</option>
            <option value="grams">Grams</option>
            <option value="calories">Calories</option>
          </select>
        </div>
      </div>

      {/* Charts Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '30px',
        marginBottom: '40px'
      }}>
        {/* Health Score Gauge */}
        <div style={{
          backgroundColor: '#FFFFFF',
          padding: '20px',
          borderRadius: '12px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          border: '1px solid #E5E7EB'
        }}>
          <HealthScoreGauge 
            score={sampleData.healthScore}
            size={chartSize}
            label="Overall Health Score"
          />
          <div style={{ 
            marginTop: '15px', 
            padding: '10px', 
            backgroundColor: '#F9FAFB', 
            borderRadius: '6px',
            fontSize: '12px',
            color: '#6B7280'
          }}>
            <strong>Use Case:</strong> Primary health indicator for foods, supplements, or overall dietary patterns.
            Shows at-a-glance health value with color-coded scoring.
          </div>
        </div>

        {/* Nutrition Grade Badge */}
        <div style={{
          backgroundColor: '#FFFFFF',
          padding: '20px',
          borderRadius: '12px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          border: '1px solid #E5E7EB'
        }}>
          <NutritionGradeBadge 
            grade={sampleData.nutritionGrade}
            score={sampleData.nutritionScore}
            size={chartSize}
            category="Overall Nutrition"
          />
          <div style={{ 
            marginTop: '15px', 
            padding: '10px', 
            backgroundColor: '#F9FAFB', 
            borderRadius: '6px',
            fontSize: '12px',
            color: '#6B7280'
          }}>
            <strong>Use Case:</strong> Simple letter grade system familiar to users.
            Perfect for quick nutritional assessment and comparison between products.
          </div>
        </div>

        {/* Research Quality Gauge */}
        <div style={{
          backgroundColor: '#FFFFFF',
          padding: '20px',
          borderRadius: '12px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          border: '1px solid #E5E7EB'
        }}>
          <ResearchQualityGauge 
            score={sampleData.researchQuality}
            studyCount={sampleData.studyCount}
            evidenceLevel={sampleData.evidenceLevel}
            size={chartSize}
          />
          <div style={{ 
            marginTop: '15px', 
            padding: '10px', 
            backgroundColor: '#F9FAFB', 
            borderRadius: '6px',
            fontSize: '12px',
            color: '#6B7280'
          }}>
            <strong>Use Case:</strong> Shows reliability of health claims based on scientific evidence.
            Helps users understand confidence level in recommendations.
          </div>
        </div>

        {/* Macronutrient Pie Chart */}
        <div style={{
          backgroundColor: '#FFFFFF',
          padding: '20px',
          borderRadius: '12px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          border: '1px solid #E5E7EB',
          gridColumn: chartSize === 'large' ? 'span 2' : 'auto'
        }}>
          <MacronutrientPieChart 
            data={sampleData.macronutrients}
            displayMode={displayMode}
            size={chartSize}
            title="Macronutrient Distribution"
          />
          <div style={{ 
            marginTop: '15px', 
            padding: '10px', 
            backgroundColor: '#F9FAFB', 
            borderRadius: '6px',
            fontSize: '12px',
            color: '#6B7280'
          }}>
            <strong>Use Case:</strong> Visual breakdown of protein, carbs, and fat content.
            Essential for dietary planning and nutritional analysis.
          </div>
        </div>
      </div>

      {/* Implementation Notes */}
      <div style={{
        backgroundColor: '#EBF8FF',
        padding: '20px',
        borderRadius: '12px',
        border: '1px solid #BAE6FD'
      }}>
        <h3 style={{ 
          margin: '0 0 15px 0', 
          color: '#1E40AF',
          fontSize: '18px'
        }}>
          📋 Implementation Notes
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
          <div>
            <h4 style={{ margin: '0 0 8px 0', color: '#1F2937', fontSize: '14px' }}>
              ✅ Completed Components
            </h4>
            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '12px', color: '#4B5563' }}>
              <li>Health Score Gauge (Doughnut)</li>
              <li>Nutrition Grade Badge (Letter grade)</li>
              <li>Research Quality Gauge (Evidence)</li>
              <li>Macronutrient Pie Chart (Protein/Carbs/Fat)</li>
            </ul>
          </div>
          
          <div>
            <h4 style={{ margin: '0 0 8px 0', color: '#1F2937', fontSize: '14px' }}>
              🔄 Integration Points
            </h4>
            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '12px', color: '#4B5563' }}>
              <li>Connect to WIHY API response data</li>
              <li>Add to FullScreenChat interface</li>
              <li>Include in search results display</li>
              <li>Add to food analysis workflow</li>
            </ul>
          </div>
          
          <div>
            <h4 style={{ margin: '0 0 8px 0', color: '#1F2937', fontSize: '14px' }}>
              📱 Responsive Features
            </h4>
            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '12px', color: '#4B5563' }}>
              <li>3 size variants (small/medium/large)</li>
              <li>Mobile-optimized layouts</li>
              <li>Flexible display modes</li>
              <li>Accessible color schemes</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Next Steps */}
      <div style={{
        marginTop: '30px',
        textAlign: 'center',
        padding: '20px',
        backgroundColor: '#F3F4F6',
        borderRadius: '12px'
      }}>
        <h3 style={{ 
          margin: '0 0 10px 0', 
          color: '#374151',
          fontSize: '16px'
        }}>
          🚀 Ready for Priority 2: Core Analytics Charts
        </h3>
        <p style={{ 
          margin: 0, 
          color: '#6B7280',
          fontSize: '14px'
        }}>
          Next: Vitamin/Mineral bars, Daily Value progress, Publication timeline, Study type distribution
        </p>
      </div>
    </div>
  );
};

export default Priority1ChartsDemo;