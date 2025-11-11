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

interface SleepCardProps {
  sleepHours?: number;
  sleepQuality?: number;
  unit?: string;
}

const SleepCard: React.FC<SleepCardProps> = ({
  sleepHours = 7.2,
  sleepQuality = 82,
  unit = 'hrs'
}) => {
  // Determine color based on sleep quality
  const getSleepColor = (quality: number): string => {
    if (quality >= 85) return '#10B981'; // Green - Excellent
    if (quality >= 70) return '#3B82F6'; // Blue - Good
    if (quality >= 60) return '#F59E0B'; // Yellow - Fair
    return '#EF4444'; // Red - Poor
  };

  const getSleepLabel = (quality: number): string => {
    if (quality >= 85) return 'Excellent Sleep';
    if (quality >= 70) return 'Good Sleep';
    if (quality >= 60) return 'Fair Sleep';
    return 'Poor Sleep';
  };

  const sleepColor = getSleepColor(sleepQuality);
  const sleepLabel = getSleepLabel(sleepQuality);

  return (
    <CardShell title="Sleep Last Night">
      {/* Main Value Display */}
      <div style={{ textAlign: "center", marginBottom: "24px" }}>
        <div style={{ 
          fontSize: 48, 
          fontWeight: 700, 
          color: sleepColor,
          lineHeight: 1.5,
          marginBottom: "8px"
        }}>
          {sleepHours}
        </div>
        <div style={{
          fontSize: 14,
          color: '#9ca3af',
          fontWeight: 400
        }}>
          {unit} of sleep
        </div>
      </div>

      {/* Quality Display */}
      <div style={{ width: "100%", maxWidth: "200px", marginBottom: "16px", textAlign: "center" }}>
        <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
          Sleep Quality
        </div>
        <div style={{
          width: '100%',
          height: '12px',
          backgroundColor: '#f3f4f6',
          borderRadius: '6px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${sleepQuality}%`,
            height: '100%',
            background: sleepColor,
            borderRadius: '6px',
            transition: 'width 0.8s ease'
          }} />
        </div>
        <div style={{ fontSize: '14px', fontWeight: 600, color: sleepColor, marginTop: '4px' }}>
          {sleepQuality}% quality
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
            color: sleepColor,
            backgroundColor: `${sleepColor}20`,
            border: `1px solid ${sleepColor}33`,
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
          {sleepLabel}
        </span>
      </div>

      <div style={footerRow}>
        <AnalyzeWithWihyButton
          cardContext={`Sleep tracking: Slept ${sleepHours} ${unit} with ${sleepQuality}% quality score. Status: ${sleepLabel}. Sleep quality and duration metrics for health assessment.`}
          userQuery="Analyze my sleep patterns and provide insights about sleep quality, duration, and recommendations for better rest"
        />
      </div>
    </CardShell>
  );
};

export default SleepCard;