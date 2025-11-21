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
      <h3 className="m-0 mb-3 text-xl font-semibold text-gray-400">{title}</h3>
      <div className="flex flex-col items-center justify-center flex-1 overflow-hidden min-h-0">{children}</div>
    </section>
  );
}

interface CurrentWeightCardProps {
  currentWeight?: number;
  goalWeight?: number;
  unit?: string;
  onAnalyze?: (userMessage: string, assistantMessage: string) => void;
}

const CurrentWeightCard: React.FC<CurrentWeightCardProps> = ({
  currentWeight = 68.5,
  goalWeight = 65,
  unit = 'kg',
  onAnalyze
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
      <div className="flex flex-col items-center min-w-0 overflow-hidden text-center mb-3">
        <div className="text-3xl lg:text-4xl font-bold mb-1 truncate" style={{color: weightColor}}>
          {currentWeight}
        </div>
        <div className="text-xs text-gray-400 font-normal truncate">
          {unit} current weight
        </div>
      </div>

      {/* Goal Comparison */}
      <div className="w-full max-w-[200px] mb-2 text-center">
        <div className="text-xs text-gray-500 mb-0.5">
          Goal: {goalWeight} {unit}
        </div>
        <div className="text-sm font-semibold" style={{color: weightColor}}>
          {isOverGoal ? '+' : ''}{difference.toFixed(1)} {unit} {isOverGoal ? 'above' : difference < 0 ? 'below' : 'at'} goal
        </div>
      </div>

      {/* Status Pill */}
      <div className="text-center">
        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm" style={{
          color: weightColor,
          backgroundColor: `${weightColor}20`,
          border: `1px solid ${weightColor}33`
        }}>
          <span className="w-2 h-2 rounded-full bg-current opacity-85" />
          {weightLabel}
        </span>
      </div>

      <div className="flex justify-center mt-2 flex-shrink-0">
        <AnalyzeWithWihyButton
          cardContext={`Current Weight: ${currentWeight} ${unit}, Goal: ${goalWeight} ${unit}. Difference: ${difference > 0 ? '+' : ''}${difference.toFixed(1)} ${unit}. Status: ${weightLabel}.`}
          userQuery="Analyze my weight progress and provide personalized guidance for reaching my weight goal"
          onAnalyze={onAnalyze}
        />
      </div>
    </CardShell>
  );
};

export default CurrentWeightCard;