/**
 * Nutrition Grade Badge - Priority 1
 * Letter grade display (A-F) with color coding and description
 */

import React from 'react';
import AnalyzeWithWihyButton from '../shared/AnalyzeWithWihyButton';

/* ================= Unified card styling ================= */

const cardChrome: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  padding: 24,
  borderRadius: 16,
  background: "white",
  border: "1px solid #e5e7eb",
  boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
  height: 420,
  overflow: "hidden",
};

const titleStyle: React.CSSProperties = {
  margin: "0 0 20px 0",
  fontSize: 24,
  fontWeight: 600,
  color: "#9CA3AF",
};

const sectionGrow: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  flex: 1,
  overflow: "hidden",
  minHeight: 0,
};

const footerRow: React.CSSProperties = {
  display: "flex",
  justifyContent: "center",
  marginTop: 16,
  flexShrink: 0,
};

/* ================= Card shell ================= */

function CardShell({
  title = "",
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <section style={cardChrome}>
      <h3 style={titleStyle}>{title}</h3>
      <div style={sectionGrow}>{children}</div>
    </section>
  );
}

interface NutritionGradeBadgeProps {
  grade?: 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D+' | 'D' | 'F' | string;
  score?: number; // Optional numerical score
  size?: 'small' | 'medium' | 'large';
  showDescription?: boolean;
  category?: string; // e.g., "Overall", "Protein", "Vitamins"
}

const NutritionGradeBadge: React.FC<NutritionGradeBadgeProps> = ({
  grade,
  score,
  size = 'medium',
  showDescription = true,
  category = 'Nutrition'
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
      <div style={{
        width: config.badgeSize,
        height: config.badgeSize,
        backgroundColor: colors.bg,
        border: `2px solid ${colors.border}`,
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
      }}>
        <span style={{
          fontSize: config.fontSize,
          fontWeight: 'bold',
          color: colors.text
        }}>
          {normalizedGrade}
        </span>
      </div>

      {/* Optional Score */}
      {displayScore !== undefined && (
        <div style={{
          fontSize: config.descSize,
          color: '#6B7280',
          marginTop: '4px'
        }}>
          {displayScore}/100
        </div>
      )}

      {/* Description */}
      {showDescription && (
        <div style={{
          fontSize: config.descSize,
          color: '#374151',
          marginTop: '8px',
          maxWidth: '200px',
          margin: '8px auto 0'
        }}>
          {description}
        </div>
      )}

      <div style={footerRow}>
        <AnalyzeWithWihyButton
          cardContext={`Nutrition grade assessment: ${category} grade is ${normalizedGrade}${displayScore !== undefined ? ` with a score of ${displayScore}/100` : ''}. Grade description: ${description}`}
          userQuery="Analyze this nutrition grade and explain what it means for overall health and dietary choices"
        />
      </div>
    </CardShell>
  );
};

export default NutritionGradeBadge;