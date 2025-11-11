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

interface CurrentWeightCardProps {
  currentWeight?: number;
  goalWeight?: number;
  unit?: string;
}

const CurrentWeightCard: React.FC<CurrentWeightCardProps> = ({
  currentWeight = 68.5,
  goalWeight = 65,
  unit = 'kg'
}) => {
  const difference = currentWeight - goalWeight;
  const isOverGoal = difference > 0;
  
  // Determine color based on progress toward goal
  const getWeightColor = (diff: number): string => {
    const absDiff = Math.abs(diff);
    if (absDiff === 0) return '#10B981'; // Green - At goal
    if (absDiff <= 2) return '#F59E0B';  // Yellow - Close to goal
    if (absDiff <= 5) return '#EF4444';  // Red - Moderately off
    return '#6B7280'; // Gray - Far from goal
  };

  const getWeightLabel = (diff: number): string => {
    const absDiff = Math.abs(diff);
    if (absDiff === 0) return 'At Goal';
    if (absDiff <= 2) return 'Close to Goal';
    if (absDiff <= 5) return isOverGoal ? 'Above Goal' : 'Below Goal';
    return isOverGoal ? 'Well Above Goal' : 'Well Below Goal';
  };

  const weightColor = getWeightColor(difference);
  const weightLabel = getWeightLabel(difference);

  return (
    <CardShell title="Current Weight">
      {/* Main Value Display */}
      <div style={{ textAlign: "center", marginBottom: "24px" }}>
        <div style={{ 
          fontSize: 48, 
          fontWeight: 700, 
          color: weightColor,
          lineHeight: 1.5,
          marginBottom: "8px"
        }}>
          {currentWeight}
        </div>
        <div style={{
          fontSize: 14,
          color: '#9ca3af',
          fontWeight: 400
        }}>
          {unit} current weight
        </div>
      </div>

      {/* Goal Comparison */}
      <div style={{ width: "100%", maxWidth: "200px", marginBottom: "16px", textAlign: "center" }}>
        <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
          Goal: {goalWeight} {unit}
        </div>
        <div style={{ fontSize: '14px', fontWeight: 600, color: weightColor }}>
          {isOverGoal ? '+' : ''}{difference.toFixed(1)} {unit} {isOverGoal ? 'above' : difference < 0 ? 'below' : 'at'} goal
        </div>
      </div>

      {/* Status Pill */}
      <div style={{ textAlign: "center" }}>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 16px",
            borderRadius: 9999,
            fontWeight: 600,
            fontSize: 14,
            color: weightColor,
            backgroundColor: `${weightColor}20`,
            border: `1px solid ${weightColor}33`,
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: 9999,
              background: "currentColor",
              opacity: 0.85,
            }}
          />
          {weightLabel}
        </span>
      </div>

      <div style={footerRow}>
        <AnalyzeWithWihyButton
          cardContext={`Current Weight: ${currentWeight} ${unit}, Goal: ${goalWeight} ${unit}. Difference: ${difference > 0 ? '+' : ''}${difference.toFixed(1)} ${unit}. Status: ${weightLabel}.`}
          userQuery="Analyze my weight progress and provide personalized guidance for reaching my weight goal"
        />
      </div>
    </CardShell>
  );
};

export default CurrentWeightCard;