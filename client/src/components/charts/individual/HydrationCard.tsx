import React from 'react';
import AnalyzeWithWihyButton from '../shared/AnalyzeWithWihyButton';

// Unified card styling
const cardChrome = {
  display: "flex",
  flexDirection: "column" as const,
  padding: 24,
  borderRadius: 16,
  background: "white",
  border: "1px solid #e5e7eb",
  height: 420,
  overflow: "hidden" as const,
};

const titleStyle = {
  fontSize: 24,
  fontWeight: 600,
  color: "#9CA3AF",
  margin: 0,
  marginBottom: 20,
};

const sectionGrow = {
  display: "flex",
  flexDirection: "column" as const,
  alignItems: "center",
  justifyContent: "center",
  flex: 1,
  gap: 8,
  overflow: "hidden" as const,
  minHeight: 0,
};

const footerRow = {
  display: "flex",
  justifyContent: "center",
  marginTop: 16,
  flexShrink: 0,
};

/* ================= Donut (full circle) ================= */

function Donut({
  value,
  size = 160,
  track = "#f3f4f6",
  color = "#10b981",
  stroke = 12,
  label,
}: {
  value: number;
  size?: number;
  track?: string;
  color?: string;
  stroke?: number;
  label?: React.ReactNode;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = (clamped / 100) * c;

  return (
    <div
      style={{
        position: "relative",
        width: size,
        height: size,
        flexShrink: 0,
        overflow: "hidden", // ensures no scroll
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{
          display: "block",
          overflow: "hidden",
        }}
      >
        <g transform={`rotate(-90, ${size / 2}, ${size / 2})`}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={track}
            strokeWidth={stroke}
            strokeLinecap="round"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${c}`}
            style={{
              transition: "stroke-dasharray 600ms ease, stroke 200ms ease",
              filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))",
            }}
          />
        </g>
      </svg>

      {/* center label */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          pointerEvents: "none",
        }}
      >
        {label}
      </div>
    </div>
  );
}

const CardShell = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section style={cardChrome}>
    <h3 style={titleStyle}>{title}</h3>
    <div style={sectionGrow}>{children}</div>
  </section>
);

interface HydrationCardProps {
  currentHydration?: number;
  goalHydration?: number;
  unit?: string;
  onAnalyze?: (userMessage: string, assistantMessage: string) => void;
}

const HydrationCard: React.FC<HydrationCardProps> = ({
  currentHydration = 2.1,
  goalHydration = 2.5,
  unit = 'L',
  onAnalyze
}) => {
  const progressPercentage = Math.min(100, (currentHydration / goalHydration) * 100);
  
  // Determine color based on progress
  const getProgressColor = (progress: number): string => {
    if (progress >= 100) return '#10B981'; // Green - Goal achieved
    if (progress >= 75) return '#06b6d4';  // Cyan - Close to goal
    if (progress >= 50) return '#F59E0B';  // Yellow - Halfway
    return '#EF4444'; // Red - Needs improvement
  };

  const getProgressLabel = (progress: number): string => {
    if (progress >= 100) return 'Well Hydrated';
    if (progress >= 75) return 'Almost There';
    if (progress >= 50) return 'Halfway';
    return 'Keep Drinking';
  };

  const progressColor = getProgressColor(progressPercentage);
  const progressLabel = getProgressLabel(progressPercentage);
  
  // Prepare data for Recharts
  const data = [
    { name: 'Completed', value: progressPercentage, fill: progressColor },
    { name: 'Remaining', value: 100 - progressPercentage, fill: '#f3f4f6' }
  ];

  return (
    <CardShell title="Hydration Today">
      <Donut
        value={progressPercentage}
        color={progressColor}
        track="#f3f4f6"
        stroke={12}
        size={180}
        label={
          <div style={{ whiteSpace: "nowrap", textAlign: "center" }}>
            <div style={{
              fontSize: 24,
              fontWeight: 400,
              color: progressColor,
              lineHeight: 2,
              marginBottom: "2px"
            }}>
              {currentHydration}
            </div>
            <div style={{
              fontSize: 12,
              color: "#9ca3af",
              fontWeight: 400
            }}>
              Goal: {goalHydration} {unit}
            </div>
          </div>
        }
      />

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
          {progressLabel}
        </span>
      </div>

      <div style={footerRow}>
        <AnalyzeWithWihyButton
          cardContext={`Hydration: ${currentHydration} ${unit} / ${goalHydration} ${unit} (${Math.round(progressPercentage)}% complete). Status: ${progressLabel}.`}
          userQuery="Analyze my hydration levels and water intake patterns"
          onAnalyze={onAnalyze}
        />
      </div>
    </CardShell>
  );
};

export default HydrationCard;