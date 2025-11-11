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

interface ActiveMinutesCardProps {
  currentMinutes?: number;
  goalMinutes?: number;
  unit?: string;
}

const ActiveMinutesCard: React.FC<ActiveMinutesCardProps> = ({
  currentMinutes = 45,
  goalMinutes = 60,
  unit = 'min'
}) => {
  const progressPercentage = Math.min(100, (currentMinutes / goalMinutes) * 100);
  
  // Determine color based on progress
  const getProgressColor = (progress: number): string => {
    if (progress >= 100) return '#10B981'; // Green - Goal achieved
    if (progress >= 75) return '#F59E0B';  // Yellow - Close to goal
    if (progress >= 50) return '#3B82F6';  // Blue - Halfway
    return '#EF4444'; // Red - Needs improvement
  };

  const getProgressLabel = (progress: number): string => {
    if (progress >= 100) return 'Goal Achieved';
    if (progress >= 75) return 'Almost There';
    if (progress >= 50) return 'Halfway';
    return 'Keep Moving';
  };

  const progressColor = getProgressColor(progressPercentage);
  const progressLabel = getProgressLabel(progressPercentage);

  return (
    <CardShell title="Active Minutes">
      {/* Main Value Display */}
      <div style={{ textAlign: "center", marginBottom: "24px" }}>
        <div style={{ 
          fontSize: 48, 
          fontWeight: 700, 
          color: progressColor,
          lineHeight: 1.5,
          marginBottom: "8px"
        }}>
          {currentMinutes}
        </div>
        <div style={{
          fontSize: 14,
          color: '#9ca3af',
          fontWeight: 400
        }}>
          {unit} active today
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{ width: "100%", maxWidth: "200px", marginBottom: "16px" }}>
        <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px', textAlign: 'center' }}>
          Goal: {goalMinutes} {unit}
        </div>
        <div style={{
          width: '100%',
          height: '12px',
          backgroundColor: '#f3f4f6',
          borderRadius: '6px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${progressPercentage}%`,
            height: '100%',
            background: progressColor,
            borderRadius: '6px',
            transition: 'width 0.8s ease'
          }} />
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
            color: progressColor,
            backgroundColor: `${progressColor}20`,
            border: `1px solid ${progressColor}33`,
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
          {progressLabel} • {Math.round(progressPercentage)}%
        </span>
      </div>

      <div style={footerRow}>
        <AnalyzeWithWihyButton
          cardContext={`Active Minutes tracking: Currently at ${currentMinutes} ${unit} out of ${goalMinutes} ${unit} goal (${progressPercentage.toFixed(1)}% progress). Status: ${progressLabel}. This represents physical activity and fitness engagement.`}
          userQuery="Analyze my active minutes data and provide insights about my physical activity levels and recommendations for improvement"
          style={{
            fontSize: '12px',
            padding: '8px 12px',
            width: 'auto',
            minWidth: '140px',
            maxWidth: '200px'
          }}
        />
      </div>
    </CardShell>
  );
};

export default ActiveMinutesCard;