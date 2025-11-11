import React from 'react';
import AnalyzeWithWihyButton from '../shared/AnalyzeWithWihyButton';
import '../../../styles/charts.css';

export interface NutrientProgress {
  name: string;
  current: number;
  target: number;
  percentage: number;
  unit: string;
  category: 'vitamin' | 'mineral' | 'macronutrient' | 'other';
  isEssential?: boolean;
  upperLimit?: number;
}

interface DailyValueProgressChartProps {
  nutrients?: NutrientProgress[];
  size?: 'small' | 'medium' | 'large';
  showLabels?: boolean;
  title?: string;
  showCategories?: boolean;
  highlightDeficiencies?: boolean;
  showTargetLines?: boolean;
}

const DailyValueProgressChart: React.FC<DailyValueProgressChartProps> = ({
  nutrients = [],
  size = 'medium',
  showLabels = true,
  title = 'Daily Value Progress',
  showCategories = true,
  highlightDeficiencies = true,
  showTargetLines = true
}) => {
  // Default sample data with various nutrients
  const defaultNutrients: NutrientProgress[] = [
    { name: 'Vitamin A', current: 720, target: 900, percentage: 80, unit: 'mcg', category: 'vitamin', isEssential: true },
    { name: 'Vitamin C', current: 54, target: 90, percentage: 60, unit: 'mg', category: 'vitamin', isEssential: true },
    { name: 'Vitamin D', current: 12, target: 20, percentage: 60, unit: 'mcg', category: 'vitamin', isEssential: true },
    { name: 'Calcium', current: 800, target: 1000, percentage: 80, unit: 'mg', category: 'mineral', isEssential: true },
    { name: 'Iron', current: 9, target: 18, percentage: 50, unit: 'mg', category: 'mineral', isEssential: true },
    { name: 'Protein', current: 45, target: 60, percentage: 75, unit: 'g', category: 'macronutrient', isEssential: true },
    { name: 'Fiber', current: 18, target: 25, percentage: 72, unit: 'g', category: 'other', isEssential: true },
    { name: 'Folate', current: 240, target: 400, percentage: 60, unit: 'mcg', category: 'vitamin', isEssential: true },
    { name: 'Magnesium', current: 280, target: 400, percentage: 70, unit: 'mg', category: 'mineral', isEssential: true },
    { name: 'Zinc', current: 6.6, target: 11, percentage: 60, unit: 'mg', category: 'mineral', isEssential: true }
  ];

  const nutrientData = nutrients.length > 0 ? nutrients : defaultNutrients;

  // Sort by category if showing categories
  const _sortedNutrients = showCategories 
    ? nutrientData.sort((a, b) => a.category.localeCompare(b.category))
    : nutrientData;

  // Chart dimensions based on size
  const dimensions = {
    small: { width: 320, height: 300, barHeight: 24, gap: 8 },
    medium: { width: 420, height: 400, barHeight: 32, gap: 12 },
    large: { width: 520, height: 500, barHeight: 40, gap: 16 }
  };

  const { width, height, barHeight, gap } = dimensions[size];

  // Color mapping based on percentage and category
  const getProgressColor = (percentage: number, _category: string) => {
    if (percentage >= 100) return '#10b981'; // Green - Complete/Exceeds
    if (percentage >= 75) return '#3b82f6'; // Blue - Good
    if (percentage >= 50) return '#f59e0b'; // Orange - Moderate  
    if (percentage >= 25) return '#ef4444'; // Red - Low
    return '#7f1d1d'; // Dark red - Very low
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      vitamin: '#8b5cf6', // Purple
      mineral: '#06b6d4', // Cyan
      macronutrient: '#10b981', // Green
      other: '#6b7280' // Gray
    };
    return colors[category as keyof typeof colors] || colors.other;
  };

  // Group nutrients by category
  const groupedNutrients = showCategories 
    ? nutrientData.reduce((groups, nutrient) => {
        const category = nutrient.category;
        if (!groups[category]) groups[category] = [];
        groups[category].push(nutrient);
        return groups;
      }, {} as Record<string, NutrientProgress[]>)
    : { all: nutrientData };

  const fontSize = {
    small: { title: 12, label: 10, value: 9 },
    medium: { title: 14, label: 12, value: 10 },
    large: { title: 16, label: 14, value: 12 }
  };

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      padding: 24,
      borderRadius: 16,
      background: "white",
      border: "1px solid #e5e7eb",
      boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
      height: 400,
      overflow: "hidden"
    }}>
      {/* Title */}
      {showLabels && (
        <h3 style={{
          fontSize: 24,
          fontWeight: 600,
          color: "#9CA3AF",
          margin: 0,
          marginBottom: 20,
          textAlign: 'center'
        }}>
          {title}
        </h3>
      )}

      {/* Progress bars by category */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: showCategories ? '20px' : '0' }}>
        {Object.entries(groupedNutrients).map(([category, categoryNutrients]) => (
          <div key={category}>
            {/* Category header */}
            {showCategories && category !== 'all' && (
              <div style={{
                fontSize: fontSize[size].label,
                fontWeight: '600',
                color: getCategoryColor(category),
                marginBottom: '8px',
                textTransform: 'capitalize',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <div 
                  style={{
                    width: '12px',
                    height: '12px',
                    backgroundColor: getCategoryColor(category),
                    borderRadius: '2px'
                  }}
                />
                {category === 'macronutrient' ? 'Macronutrients' : `${category}s`}
              </div>
            )}

            {/* Progress bars for this category */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: `${gap}px` }}>
              {categoryNutrients.map((nutrient, _index) => (
                <div key={nutrient.name} style={{ position: 'relative' }}>
                  {/* Nutrient name and values */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '4px'
                  }}>
                    <div style={{
                      fontSize: fontSize[size].label,
                      fontWeight: '500',
                      color: '#374151'
                    }}>
                      {nutrient.name}
                      {nutrient.isEssential && <span style={{ color: '#ef4444' }}>*</span>}
                    </div>
                    <div style={{
                      fontSize: fontSize[size].value,
                      color: '#6b7280'
                    }}>
                      {nutrient.current}{nutrient.unit} / {nutrient.target}{nutrient.unit} ({nutrient.percentage}%)
                    </div>
                  </div>

                  {/* Progress bar background */}
                  <div style={{
                    width: '100%',
                    height: `${barHeight}px`,
                    backgroundColor: '#f3f4f6',
                    borderRadius: '6px',
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    {/* Progress fill */}
                    <div style={{
                      width: `${Math.min(nutrient.percentage, 100)}%`,
                      height: '100%',
                      backgroundColor: getProgressColor(nutrient.percentage, nutrient.category),
                      borderRadius: '6px',
                      transition: 'width 0.3s ease',
                      position: 'relative'
                    }}>
                      {/* Gradient overlay for visual appeal */}
                      <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '50%',
                        background: 'linear-gradient(to bottom, rgba(255,255,255,0.2), transparent)',
                        borderRadius: '6px 6px 0 0'
                      }} />
                    </div>

                    {/* Target line at 100% */}
                    {showTargetLines && (
                      <div style={{
                        position: 'absolute',
                        left: '100%',
                        top: 0,
                        width: '2px',
                        height: '100%',
                        backgroundColor: '#374151',
                        transform: 'translateX(-1px)'
                      }} />
                    )}

                    {/* Excess indicator (if over 100%) */}
                    {nutrient.percentage > 100 && (
                      <div style={{
                        position: 'absolute',
                        right: '4px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        fontSize: fontSize[size].value,
                        color: '#374151',
                        fontWeight: 'bold'
                      }}>
                        +{nutrient.percentage - 100}%
                      </div>
                    )}
                  </div>

                  {/* Deficiency warning */}
                  {highlightDeficiencies && nutrient.percentage < 50 && nutrient.isEssential && (
                    <div style={{
                      fontSize: fontSize[size].value,
                      color: '#ef4444',
                      marginTop: '2px'
                    }}>
                      ⚠️ Below recommended intake
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Summary statistics */}
      {showLabels && (
        <div style={{
          marginTop: '20px',
          padding: '12px',
          backgroundColor: '#f9fafb',
          borderRadius: '8px',
          fontSize: fontSize[size].value,
          color: '#6b7280'
        }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', 
            gap: '8px' 
          }}>
            <div>
              <strong style={{ color: '#374151' }}>Total Nutrients:</strong> {nutrientData.length}
            </div>
            <div>
              <strong style={{ color: '#374151' }}>Meeting Target:</strong> {nutrientData.filter(n => n.percentage >= 100).length}
            </div>
            <div>
              <strong style={{ color: '#374151' }}>Deficient:</strong> {nutrientData.filter(n => n.percentage < 50).length}
            </div>
            <div>
              <strong style={{ color: '#374151' }}>Avg Progress:</strong> {Math.round(nutrientData.reduce((sum, n) => sum + n.percentage, 0) / nutrientData.length)}%
            </div>
          </div>
          
          {nutrientData.some(n => n.isEssential) && (
            <div style={{ marginTop: '8px', fontSize: '9px', color: '#9ca3af' }}>
              * Essential nutrients require special attention if deficient
            </div>
          )}
        </div>
      )}
      
      <div style={{ display: "flex", justifyContent: "center", marginTop: 16, flexShrink: 0 }}>
        <AnalyzeWithWihyButton
          cardContext={`Daily Value Progress: ${title} showing ${nutrientData.length} nutrients tracked. Deficient nutrients: ${nutrientData.filter(n => n.percentage < 100).length}. Essential nutrients present: ${nutrientData.filter(n => n.isEssential).length}. Nutrient details: ${nutrientData.map(n => `${n.name}: ${n.current}${n.unit} (${n.percentage}% of ${n.target}${n.unit})`).join(', ')}.`}
          userQuery="Analyze my daily nutrient intake progress and identify any deficiencies or areas where I can improve my nutrition"
        />
      </div>
    </div>
  );
};

export default DailyValueProgressChart;