import React from "react";
import AnalyzeWithWihyButton from "../shared/AnalyzeWithWihyButton";

function CardShell({
  title = "",
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col p-6 rounded-2xl bg-white border border-gray-200 shadow-md h-[420px] overflow-hidden">
      <h3 className="text-xl font-semibold text-gray-400 m-0 mb-3">{title}</h3>
      <div className="flex flex-col items-center justify-center flex-1 overflow-hidden min-h-0 gap-2">{children}</div>
    </section>
  );
}

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
        stroke={10}
        size={140}
        label={
          <div className="whitespace-nowrap">
            <span
              className="text-xl font-bold"
              style={{ color: scoreColor }}
            >
              {riskScore}
            </span>
            <span className="text-sm text-gray-500 ml-1">
              /100
            </span>
          </div>
        }
      />

      {/* Pill */}
      <div className="text-center flex-shrink-0 pt-3 pb-1">
        <span
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm"
          style={{
            color: scoreColor,
            backgroundColor: `${scoreColor}20`,
            border: `1px solid ${scoreColor}33`,
          }}
        >
          <span
            className="w-2 h-2 rounded-full opacity-85"
            style={{
              background: "currentColor",
            }}
          />
          {currentRiskZone} Risk
        </span>
      </div>

      <div className="flex justify-center mt-2">
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
