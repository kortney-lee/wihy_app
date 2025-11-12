import React from "react";
import AnalyzeWithWihyButton from "../shared/AnalyzeWithWihyButton";

/* ================= Unified card styling ================= */

const cardChrome: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  padding: 24,
  borderRadius: 16,
  background: "white",
  border: "1px solid #e5e7eb",
  boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
  height: 400,
  overflow: "hidden",
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

/* ================= Example: Health Risk ================= */

interface HealthRiskCardProps {
  data?: {
    riskLevel?: "Low" | "Moderate" | "High";
    riskScore?: number;
    factors?: string[];
    recommendations?: string[];
  };
  onAnalyze?: (userMessage: string, assistantMessage: string) => void;
}

const HealthRiskCard: React.FC<HealthRiskCardProps> = ({ data, onAnalyze }) => {
  const riskScore = Math.max(0, Math.min(100, data?.riskScore ?? 25));
  const factors =
    data?.factors ?? ["Regular exercise", "Balanced diet", "Normal BMI"];
  const recommendations =
    data?.recommendations ?? [
      "Maintain current lifestyle",
      "Regular health checkups",
      "Stay hydrated",
    ];

  const getScoreColor = (score: number) =>
    score <= 30 ? "#10b981" : score <= 70 ? "#f59e0b" : "#ef4444";
  const getRiskZone = (score: number) =>
    score <= 30 ? "Low" : score <= 70 ? "Moderate" : "High";

  const scoreColor = getScoreColor(riskScore);
  const currentRiskZone = getRiskZone(riskScore);

  return (
    <CardShell title="Health Risk Analysis">
      <Donut
        value={riskScore}
        color={scoreColor}
        track="#f3f4f6"
        stroke={12}
        size={160}
        label={
          <div style={{ whiteSpace: "nowrap" }}>
            <span
              style={{ fontSize: 32, fontWeight: 700, color: scoreColor }}
            >
              {riskScore}
            </span>
            <span style={{ fontSize: 14, color: "#6b7280", marginLeft: 4 }}>
              /100
            </span>
          </div>
        }
      />

      {/* Pill */}
      <div style={{ textAlign: "center", flexShrink: 0, paddingTop: 16, paddingBottom: 4 }}>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 16px", // slightly larger padding
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
          {currentRiskZone} Risk
        </span>
      </div>

      <div style={footerRow}>
        <AnalyzeWithWihyButton
          cardContext={`Health Risk Analysis: ${currentRiskZone} risk level with ${riskScore}/100 score. Key factors: ${factors.join(
            ", "
          )}. Recommendations: ${recommendations.join(", ")}.`}
          userQuery="Analyze my health risk assessment and provide detailed insights about my risk factors and personalized recommendations for improvement"
          onAnalyze={onAnalyze}
        />
      </div>
    </CardShell>
  );
};

export default HealthRiskCard;
