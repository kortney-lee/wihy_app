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
      <h3 className="text-xl font-semibold text-gray-400 m-0 mb-3 text-left">{title}</h3>
      <div className="flex flex-col items-center justify-center flex-1 overflow-hidden min-h-0">{children}</div>
    </section>
  );
}

interface ActiveMinutesCardProps {
  currentMinutes?: number;
  goalMinutes?: number;
  unit?: string;
  onAnalyze?: (userMessage: string, assistantMessage: string) => void;
}

const ActiveMinutesCard: React.FC<ActiveMinutesCardProps> = ({
  currentMinutes = 45,
  goalMinutes = 60,
  unit = 'min',
  onAnalyze
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
      <div className="flex flex-col items-center min-w-0 overflow-hidden text-center mb-3">
        <div 
          className="text-3xl lg:text-4xl font-bold mb-1 truncate"
          style={{ color: progressColor }}
        >
          {currentMinutes}
        </div>
        <div className="text-xs text-gray-400 font-normal truncate">
          {unit} active today
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full max-w-[200px] mb-2">
        <div className="text-xs text-gray-500 mb-1 text-center">
          Goal: {goalMinutes} {unit}
        </div>
        <div className="w-full h-3 bg-gray-100 rounded-md overflow-hidden">
          <div 
            className="h-full rounded-md transition-all duration-700 ease-out"
            style={{
              width: `${progressPercentage}%`,
              backgroundColor: progressColor
            }}
          />
        </div>
      </div>

      {/* Status Pill */}
      <div className="text-center">
        <span
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm"
          style={{
            color: progressColor,
            backgroundColor: `${progressColor}20`,
            borderColor: `${progressColor}33`,
            borderWidth: '1px'
          }}
        >
          <span
            className="w-2 h-2 rounded-full opacity-85"
            style={{ backgroundColor: progressColor }}
          />
          {progressLabel} • {Math.round(progressPercentage)}%
        </span>
      </div>

      <div className="flex justify-center mt-2 flex-shrink-0">
        <AnalyzeWithWihyButton
          cardContext={`Active Minutes tracking: Currently at ${currentMinutes} ${unit} out of ${goalMinutes} ${unit} goal (${progressPercentage.toFixed(1)}% progress). Status: ${progressLabel}. This represents physical activity and fitness engagement.`}
          userQuery="Analyze my active minutes data and provide insights about my physical activity levels and recommendations for improvement"
          onAnalyze={onAnalyze}
        />
      </div>
    </CardShell>
  );
};

export default ActiveMinutesCard;