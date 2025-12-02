import React, { useState } from 'react';
import VitaminContentChart, { VitaminData } from '../charts/individual/VitaminContentChart';
import PublicationTimelineChartDemo, { PublicationData } from '../charts/cards/PublicationTimelineChart';
import StudyTypeDistributionChartDemo, { StudyTypeData } from '../charts/cards/StudyTypeDistributionChart';
import DailyValueProgressChart, { NutrientProgress } from '../charts/individual/DailyValueProgressChart';

const Priority2ChartsDemo: React.FC = () => {
  const [selectedSize, setSelectedSize] = useState<'small' | 'medium' | 'large'>('medium');

  // Sample data for vitamin content chart
  const sampleVitamins: VitaminData[] = [
    { name: 'Vitamin A', current: 720, dailyValue: 900, percentage: 80, unit: 'mcg' },
    { name: 'Vitamin C', current: 54, dailyValue: 90, percentage: 60, unit: 'mg' },
    { name: 'Vitamin D', current: 12, dailyValue: 20, percentage: 60, unit: 'mcg' },
    { name: 'Vitamin E', current: 12, dailyValue: 15, percentage: 80, unit: 'mg' },
    { name: 'Vitamin K', current: 60, dailyValue: 120, percentage: 50, unit: 'mcg' },
    { name: 'B12', current: 1.8, dailyValue: 2.4, percentage: 75, unit: 'mcg' },
    { name: 'Folate', current: 280, dailyValue: 400, percentage: 70, unit: 'mcg' },
    { name: 'Iron', current: 12.6, dailyValue: 18, percentage: 70, unit: 'mg' },
    { name: 'Calcium', current: 600, dailyValue: 1000, percentage: 60, unit: 'mg' },
    { name: 'Zinc', current: 7.7, dailyValue: 11, percentage: 70, unit: 'mg' }
  ];

  // Sample data for publication timeline
  const samplePublications: PublicationData[] = [
    { 
      year: 2020, 
      count: 45, 
      studyTypes: { 'Clinical Trial': 15, 'Meta-Analysis': 8, 'Observational': 12, 'Review': 7, 'Laboratory': 3 }
    },
    { 
      year: 2021, 
      count: 52, 
      studyTypes: { 'Clinical Trial': 18, 'Meta-Analysis': 10, 'Observational': 14, 'Review': 7, 'Laboratory': 3 }
    },
    { 
      year: 2022, 
      count: 48, 
      studyTypes: { 'Clinical Trial': 16, 'Meta-Analysis': 9, 'Observational': 13, 'Review': 6, 'Laboratory': 4 }
    },
    { 
      year: 2023, 
      count: 63, 
      studyTypes: { 'Clinical Trial': 22, 'Meta-Analysis': 12, 'Observational': 16, 'Review': 9, 'Laboratory': 4 }
    },
    { 
      year: 2024, 
      count: 58, 
      studyTypes: { 'Clinical Trial': 20, 'Meta-Analysis': 11, 'Observational': 15, 'Review': 8, 'Laboratory': 4 }
    }
  ];

  // Sample data for study type distribution
  const sampleStudyTypes: StudyTypeData[] = [
    { 
      type: 'Clinical Trials', 
      count: 91, 
      percentage: 34,
      description: 'Controlled human studies',
      evidenceLevel: 'high'
    },
    { 
      type: 'Observational Studies', 
      count: 70, 
      percentage: 26,
      description: 'Population-based studies',
      evidenceLevel: 'medium'
    },
    { 
      type: 'Meta-Analyses', 
      count: 50, 
      percentage: 19,
      description: 'Analysis of multiple studies',
      evidenceLevel: 'high'
    },
    { 
      type: 'Systematic Reviews', 
      count: 37, 
      percentage: 14,
      description: 'Comprehensive literature reviews',
      evidenceLevel: 'high'
    },
    { 
      type: 'Laboratory Studies', 
      count: 18, 
      percentage: 7,
      description: 'In vitro and animal studies',
      evidenceLevel: 'low'
    }
  ];

  // Sample data for daily value progress
  const sampleDailyValues: NutrientProgress[] = [
    { name: 'Protein', current: 45, target: 60, percentage: 75, unit: 'g', category: 'macronutrient', isEssential: true },
    { name: 'Vitamin A', current: 720, target: 900, percentage: 80, unit: 'mcg', category: 'vitamin', isEssential: true },
    { name: 'Vitamin C', current: 54, target: 90, percentage: 60, unit: 'mg', category: 'vitamin', isEssential: true },
    { name: 'Vitamin D', current: 12, target: 20, percentage: 60, unit: 'mcg', category: 'vitamin', isEssential: true },
    { name: 'Iron', current: 10.8, target: 18, percentage: 60, unit: 'mg', category: 'mineral', isEssential: true },
    { name: 'Calcium', current: 500, target: 1000, percentage: 50, unit: 'mg', category: 'mineral', isEssential: true },
    { name: 'Fiber', current: 20, target: 25, percentage: 80, unit: 'g', category: 'other', isEssential: true },
    { name: 'Magnesium', current: 280, target: 400, percentage: 70, unit: 'mg', category: 'mineral', isEssential: true },
    { name: 'Zinc', current: 6.6, target: 11, percentage: 60, unit: 'mg', category: 'mineral', isEssential: true },
    { name: 'Folate', current: 280, target: 400, percentage: 70, unit: 'mcg', category: 'vitamin', isEssential: true }
  ];

  return (
    <div style={{ 
      padding: '24px', 
      maxWidth: '1200px', 
      margin: '0 auto',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h1 style={{ 
          fontSize: '32px', 
          fontWeight: 'bold', 
          color: '#1f2937',
          marginBottom: '8px'
        }}>
          🎯 Priority 2: Core Analytics Charts
        </h1>
        <p style={{ 
          fontSize: '18px', 
          color: '#6b7280',
          marginBottom: '24px'
        }}>
          Week 3-4 Implementation Goals - Advanced Data Visualization
        </p>
        
        {/* Size selector */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          gap: '8px',
          marginBottom: '16px'
        }}>
          {(['small', 'medium', 'large'] as const).map(size => (
            <button
              key={size}
              onClick={() => setSelectedSize(size)}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                backgroundColor: selectedSize === size ? '#3b82f6' : '#ffffff',
                color: selectedSize === size ? '#ffffff' : '#374151',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                textTransform: 'capitalize'
              }}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      {/* Charts Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: '32px',
        alignItems: 'start'
      }}>
        
        {/* 1. Vitamin Content Chart */}
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <h3 style={{
            fontSize: '20px',
            fontWeight: '600',
            color: '#1f2937',
            marginBottom: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            🍊 Vitamin Content Analysis
          </h3>
          <p style={{
            fontSize: '14px',
            color: '#6b7280',
            marginBottom: '16px'
          }}>
            Daily value percentages for vitamins and minerals
          </p>
          <VitaminContentChart 
            vitamins={sampleVitamins}
            size={selectedSize}
            highlightDeficiency={true}
          />
        </div>

        {/* 2. Publication Timeline Chart */}
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <h3 style={{
            fontSize: '20px',
            fontWeight: '600',
            color: '#1f2937',
            marginBottom: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            📊 Publication Timeline
          </h3>
          <p style={{
            fontSize: '14px',
            color: '#6b7280',
            marginBottom: '16px'
          }}>
            Research publication trends over time
          </p>
          <PublicationTimelineChartDemo 
            publications={samplePublications}
            size={selectedSize}
            timeRange="recent"
            showTrendline={true}
          />
        </div>

        {/* 3. Study Type Distribution Chart */}
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <h3 style={{
            fontSize: '20px',
            fontWeight: '600',
            color: '#1f2937',
            marginBottom: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            🔬 Study Type Distribution
          </h3>
          <p style={{
            fontSize: '14px',
            color: '#6b7280',
            marginBottom: '16px'
          }}>
            Breakdown of research study methodologies
          </p>
          <StudyTypeDistributionChartDemo 
            studyTypes={sampleStudyTypes}
            size={selectedSize}
            chartStyle="doughnut"
            showPercentages={true}
          />
        </div>

        {/* 4. Daily Value Progress Chart */}
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <h3 style={{
            fontSize: '20px',
            fontWeight: '600',
            color: '#1f2937',
            marginBottom: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            📈 Daily Value Progress
          </h3>
          <p style={{
            fontSize: '14px',
            color: '#6b7280',
            marginBottom: '16px'
          }}>
            Progress toward recommended daily nutrient intake
          </p>
          <DailyValueProgressChart 
            nutrients={sampleDailyValues}
            size={selectedSize}
            showCategories={true}
            highlightDeficiencies={true}
          />
        </div>
      </div>

      {/* Implementation Summary */}
      <div style={{
        marginTop: '48px',
        backgroundColor: '#f9fafb',
        border: '1px solid #e5e7eb',
        borderRadius: '12px',
        padding: '24px'
      }}>
        <h2 style={{
          fontSize: '24px',
          fontWeight: 'bold',
          color: '#1f2937',
          marginBottom: '16px',
          textAlign: 'center'
        }}>
          ✅ Priority 2 Charts Complete (4/4)
        </h2>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '16px'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '20px', marginBottom: '8px' }}>🍊</div>
            <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>
              Vitamin Content Chart
            </h4>
            <p style={{ fontSize: '12px', color: '#6b7280' }}>
              Horizontal bar chart with daily value percentages
            </p>
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '20px', marginBottom: '8px' }}>📊</div>
            <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>
              Publication Timeline
            </h4>
            <p style={{ fontSize: '12px', color: '#6b7280' }}>
              Line chart with research trends and study breakdowns
            </p>
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '20px', marginBottom: '8px' }}>🔬</div>
            <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>
              Study Type Distribution
            </h4>
            <p style={{ fontSize: '12px', color: '#6b7280' }}>
              Doughnut chart with evidence quality indicators
            </p>
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '20px', marginBottom: '8px' }}>📈</div>
            <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>
              Daily Value Progress
            </h4>
            <p style={{ fontSize: '12px', color: '#6b7280' }}>
              Categorized progress bars with deficiency warnings
            </p>
          </div>
        </div>

        <div style={{
          marginTop: '24px',
          padding: '16px',
          backgroundColor: '#ecfdf5',
          border: '1px solid #a7f3d0',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: '#065f46',
            marginBottom: '8px'
          }}>
            🚀 Ready for Priority 3: Advanced Visualizations
          </h3>
          <p style={{
            fontSize: '14px',
            color: '#047857',
            marginBottom: '12px'
          }}>
            Next: Nutrient density radar, Bioavailability charts, Interaction matrices, Absorption timelines
          </p>
          <div style={{
            fontSize: '12px',
            color: '#064e3b',
            fontStyle: 'italic'
          }}>
            Week 5-6 Goals: Complex multi-dimensional analysis charts with scientific depth
          </div>
        </div>
      </div>
    </div>
  );
};

export default Priority2ChartsDemo;