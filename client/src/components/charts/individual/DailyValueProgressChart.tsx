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
  onAnalyze?: (userMessage: string, assistantMessage: string) => void;
}

const DailyValueProgressChart: React.FC<DailyValueProgressChartProps> = ({
  nutrients = [],
  size = 'medium',
  showLabels = true,
  title = 'Daily Value Progress',
  showCategories = true,
  highlightDeficiencies = true,
  showTargetLines = true,
  onAnalyze
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
    <div className="flex flex-col p-4 md:p-6 rounded-2xl bg-white border border-gray-200 shadow-md overflow-visible">
      {/* Title */}
      {showLabels && (
        <h3 className="text-xl md:text-2xl font-semibold text-gray-400 m-0 mb-3 md:mb-5 text-center">
          {title}
        </h3>
      )}

      {/* Simple horizontal bar chart like Vitamin & Mineral Content */}
      <div className="flex flex-col gap-3 flex-1 overflow-visible">
        {nutrientData.map((nutrient, index) => (
          <div key={nutrient.name} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Nutrient name - flexible width for full text */}
            <div style={{
              minWidth: window.innerWidth <= 768 ? '80px' : '100px',
              fontSize: window.innerWidth <= 768 ? '12px' : '14px',
              fontWeight: '500',
              color: '#374151',
              textAlign: 'left',
              flexShrink: 0
            }}>
              {nutrient.name}
            </div>
            
            {/* Progress bar container */}
            <div style={{
              flex: 1,
              height: '20px',
              backgroundColor: '#f3f4f6',
              borderRadius: '4px',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Progress fill */}
              <div style={{
                width: `${Math.min(nutrient.percentage, 100)}%`,
                height: '100%',
                backgroundColor: getProgressColor(nutrient.percentage, nutrient.category),
                borderRadius: '4px',
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>
        ))}
        
        {/* Percentage scale at bottom */}
        <div className="flex justify-between items-center mt-2 ml-24 md:ml-[116px] text-xs text-gray-500">
          <span>0%</span>
          <span>20%</span>
          <span>40%</span>
          <span>60%</span>
          <span>80%</span>
          <span>100%</span>
          <span>110%</span>
        </div>
        
        {/* Summary like in Image 2 */}
        <div className="flex items-center gap-2 mt-4 ml-24 md:ml-[116px] text-sm text-green-500">
          <div className="w-3 h-3 bg-green-500 rounded-sm" />
          {nutrientData.filter(n => n.percentage >= 100).length} nutrients meeting DV
        </div>
      </div>

      
      <div className="flex justify-center mt-6 flex-shrink-0">
        <AnalyzeWithWihyButton
          cardContext={`Daily Value Progress: ${title} showing ${nutrientData.length} nutrients tracked. Meeting DV: ${nutrientData.filter(n => n.percentage >= 100).length}. Nutrient details: ${nutrientData.map(n => `${n.name}: ${n.percentage}%`).join(', ')}.`}
          userQuery="Analyze my daily nutrient intake progress and identify any deficiencies or areas where I can improve my nutrition"
          onAnalyze={onAnalyze}
        />
      </div>
    </div>
  );
};

export default DailyValueProgressChart;