import React from 'react';
import AnalyzeWithWihyButton from '../shared/AnalyzeWithWihyButton';

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
        overflow: "hidden",
        maxWidth: size,
        maxHeight: size,
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
  <section className="flex flex-col p-6 rounded-2xl bg-white border border-gray-200 shadow-md h-[420px] overflow-hidden">
    <h3 className="text-xl font-semibold text-gray-400 m-0 mb-3">{title}</h3>
    <div className="flex flex-col items-center justify-center flex-1 gap-1 overflow-hidden min-h-0">{children}</div>
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
        stroke={10}
        size={160}
        label={
          <div style={{ whiteSpace: "nowrap", textAlign: "center", overflow: "hidden" }}>
            <div style={{
              fontSize: 20,
              fontWeight: 400,
              color: progressColor,
              lineHeight: 1.5,
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
        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm" style={{
          color: progressColor,
          backgroundColor: `${progressColor}20`,
          border: `1px solid ${progressColor}33`
        }}>
          <span className="w-2 h-2 rounded-full bg-current opacity-85" />
          {progressLabel}
        </span>
      </div>

      <div className="flex justify-center flex-shrink-0">
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