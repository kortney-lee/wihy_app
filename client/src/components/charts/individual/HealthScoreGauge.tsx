/**
 * Health Score Gauge Chart - Priority 1
 * Doughnut chart showing overall health score (0-100 scale)
 */

import React from 'react';
import AnalyzeWithWihyButton from '../shared/AnalyzeWithWihyButton';

/* ================= Unified card styling ================= */

const CARD_HEIGHT = 420; // consistent height for grid alignment

const cardChrome: React.CSSProperties = {
  position: "relative",
  backgroundColor: "#ffffff", // pure white background
  borderRadius: 16,
  padding: 24,
  boxShadow: "0 4px 20px rgba(26,115,232,0.08)",
  border: "1px solid #f3f4f6",
  display: "flex",
  flexDirection: "column",
  height: CARD_HEIGHT,
  overflow: "hidden", // ensures no scrollbars
};

const titleStyle: React.CSSProperties = {
  margin: "0 0 12px 0",
  fontSize: 24,
  fontWeight: 600,
  color: "#9CA3AF",
};

const sectionGrow: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: 20,
  flex: 1,
  minHeight: 0,
  paddingBottom: 8,
};

const footerRow: React.CSSProperties = {
  marginTop: "auto",
  textAlign: "center",
  paddingTop: 12,
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

interface HealthScoreGaugeProps {
  score?: number; // 0-100
  label?: string;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
  onAnalyze?: (userMessage: string, assistantMessage: string) => void;
}

const HealthScoreGauge: React.FC<HealthScoreGaugeProps> = ({
  score = 75,
  label = 'Health Score',
  size = 'medium',
  showLabel = true,
  onAnalyze
}) => {
  // Clamp score between 0-100
  const clampedScore = Math.max(0, Math.min(100, score));
  
  // Determine color based on score
  const getScoreColor = (score: number): string => {
    if (score >= 80) return '#10B981'; // Green - Excellent
    if (score >= 60) return '#F59E0B'; // Yellow - Good  
    if (score >= 40) return '#EF4444'; // Red - Fair
    return '#6B7280'; // Gray - Poor
  };

  const getScoreLabel = (score: number): string => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good'; 
    if (score >= 40) return 'Fair';
    return 'Poor';
  };

  const scoreColor = getScoreColor(clampedScore);
  const currentScoreLabel = getScoreLabel(clampedScore);

  return (
    <CardShell title={showLabel ? label : "Health Score"}>
      <Donut
        value={clampedScore}
        color={scoreColor}
        track="#f3f4f6"
        stroke={12}
        size={160}
        label={
          <div style={{ whiteSpace: "nowrap" }}>
            <span
              style={{ fontSize: 32, fontWeight: 700, color: scoreColor }}
            >
              {clampedScore}
            </span>
            <span style={{ fontSize: 14, color: "#6b7280", marginLeft: 4 }}>
              /100
            </span>
          </div>
        }
      />

      {/* Pill */}
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
            color: scoreColor,
            backgroundColor: `${scoreColor}20`,
            border: `1px solid ${scoreColor}33`,
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
          {currentScoreLabel}
        </span>
      </div>

      <div style={footerRow}>
        <AnalyzeWithWihyButton
          cardContext={`Health Score Gauge: Overall health score is ${clampedScore}/100. Status: ${currentScoreLabel}. ${label} assessment for comprehensive health evaluation.`}
          userQuery="Analyze my health score and explain what it means for my overall wellness, including specific areas for improvement"
          onAnalyze={onAnalyze}
        />
      </div>
    </CardShell>
  );
};

export default HealthScoreGauge;