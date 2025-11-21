/**
 * Nutrition Grade Badge - Priority 1
 * Letter grade display (A-F) with color coding and description
 */

import React from 'react';
import AnalyzeWithWihyButton from '../shared/AnalyzeWithWihyButton';

/* ================= Card shell ================= */

function CardShell({
  title = "",
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col p-6 rounded-2xl bg-white border border-gray-200 shadow-md h-[420px] overflow-hidden">
      <h3 className="mb-5 text-2xl font-semibold text-vh-muted">{title}</h3>
      <div className="flex flex-col items-center justify-center flex-1 overflow-hidden min-h-0">{children}</div>
    </section>
  );
}

interface NutritionGradeBadgeProps {
  grade?: 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D+' | 'D' | 'F' | string;
  score?: number; // Optional numerical score
  size?: 'small' | 'medium' | 'large';
  showDescription?: boolean;
  category?: string; // e.g., "Overall", "Protein", "Vitamins"
  onAnalyze?: (userMessage: string, assistantMessage: string) => void;
}

const NutritionGradeBadge: React.FC<NutritionGradeBadgeProps> = ({
  grade,
  score,
  size = 'medium',
  showDescription = true,
  category = 'Nutrition',
  onAnalyze
}) => {
  // Provide demo data if no grade is provided (for dashboard display)
  const defaultGrade = 'B+';
  const defaultScore = 85;
  
  // Normalize grade to standard format
  const normalizedGrade = grade?.toUpperCase() || defaultGrade;
  const displayScore = score || defaultScore;
  
  // Grade to color mapping
  const getGradeColor = (grade: string): { bg: string; text: string; border: string } => {
    switch (grade) {
      case 'A+':
      case 'A':
        return { bg: '#DCFCE7', text: '#166534', border: '#10B981' }; // Green
      case 'B+':
      case 'B':
        return { bg: '#FEF3C7', text: '#92400E', border: '#F59E0B' }; // Yellow
      case 'C+':
      case 'C':
        return { bg: '#FED7AA', text: '#C2410C', border: '#F97316' }; // Orange
      case 'D+':
      case 'D':
        return { bg: '#FEE2E2', text: '#DC2626', border: '#EF4444' }; // Red
      case 'F':
        return { bg: '#F3F4F6', text: '#374151', border: '#6B7280' }; // Gray
      default:
        return { bg: '#EBF8FF', text: '#1E40AF', border: '#3B82F6' }; // Blue
    }
  };

  // Grade descriptions
  const getGradeDescription = (grade: string): string => {
    switch (grade) {
      case 'A+': return 'Exceptional nutritional value';
      case 'A': return 'Excellent nutritional profile';
      case 'B+': return 'Very good nutrition quality';
      case 'B': return 'Good nutritional content';
      case 'C+': return 'Above average nutrition';
      case 'C': return 'Average nutritional value';
      case 'D+': return 'Below average nutrition';
      case 'D': return 'Poor nutritional quality';
      case 'F': return 'Very poor nutritional value';
      default: return 'Nutritional assessment';
    }
  };

  const colors = getGradeColor(normalizedGrade);
  const description = getGradeDescription(normalizedGrade);
  
  // Size configurations
  const sizeConfig = {
    small: {
      badgeSize: '40px',
      fontSize: '16px',
      padding: '8px',
      titleSize: '12px',
      descSize: '10px'
    },
    medium: {
      badgeSize: '60px',
      fontSize: '24px',
      padding: '12px',
      titleSize: '14px',
      descSize: '12px'
    },
    large: {
      badgeSize: '80px',
      fontSize: '32px',
      padding: '16px',
      titleSize: '16px',
      descSize: '14px'
    }
  };

  const config = sizeConfig[size];

  return (
    <CardShell title={`${category} Grade`}>

      {/* Grade Badge */}
      <div
        className={`flex items-center justify-center mx-auto rounded-xl border-2 shadow-sm ${
          size === 'small' ? 'w-10 h-10' : size === 'large' ? 'w-20 h-20' : 'w-16 h-16'
        }`}
        style={{
          backgroundColor: colors.bg,
          borderColor: colors.border,
        }}
      >
        <span
          className={`font-bold ${
            size === 'small' ? 'text-base' : size === 'large' ? 'text-3xl' : 'text-2xl'
          }`}
          style={{ color: colors.text }}
        >
          {normalizedGrade}
        </span>
      </div>

      {/* Optional Score */}
      {displayScore !== undefined && (
        <div className={`text-gray-500 mt-1 ${
          size === 'small' ? 'text-xs' : size === 'large' ? 'text-sm' : 'text-xs'
        }`}>
          {displayScore}/100
        </div>
      )}

      {/* Description */}
      {showDescription && (
        <div className={`text-gray-700 mt-2 max-w-[200px] mx-auto text-center ${
          size === 'small' ? 'text-xs' : size === 'large' ? 'text-sm' : 'text-xs'
        }`}>
          {description}
        </div>
      )}

      <div className="flex justify-center mt-4 flex-shrink-0">
        <AnalyzeWithWihyButton
          cardContext={`Nutrition grade assessment: ${category} grade is ${normalizedGrade}${displayScore !== undefined ? ` with a score of ${displayScore}/100` : ''}. Grade description: ${description}`}
          userQuery="Analyze this nutrition grade and explain what it means for overall health and dietary choices"
          onAnalyze={onAnalyze}
        />
      </div>
    </CardShell>
  );
};

export default NutritionGradeBadge;