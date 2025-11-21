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

interface SleepCardProps {
  sleepHours?: number;
  sleepQuality?: number;
  unit?: string;
  onAnalyze?: (userMessage: string, assistantMessage: string) => void;
}

const SleepCard: React.FC<SleepCardProps> = ({
  sleepHours = 7.2,
  sleepQuality = 82,
  unit = 'hrs',
  onAnalyze
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
      <div className="flex flex-col items-center min-w-0 overflow-hidden text-center mb-3">
        <div className="text-3xl lg:text-4xl font-bold mb-1 truncate" style={{color: sleepColor}}>
          {sleepHours}
        </div>
        <div className="text-xs text-gray-400 font-normal truncate">
          {unit} of sleep
        </div>
      </div>

      {/* Quality Display */}
      <div className="w-full max-w-[200px] mb-4 text-center">
        <div className="text-xs text-gray-500 mb-2">
          Sleep Quality
        </div>
        <div className="w-full h-3 bg-gray-100 rounded-md overflow-hidden">
          <div className="h-full rounded-md transition-all duration-700 ease-in-out" style={{
            width: `${sleepQuality}%`,
            backgroundColor: sleepColor
          }} />
        </div>
        <div className="text-sm font-semibold mt-1" style={{color: sleepColor}}>
          {sleepQuality}% quality
        </div>
      </div>

      {/* Status Pill */}
      <div className="text-center">
        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm" style={{
          color: sleepColor,
          backgroundColor: `${sleepColor}20`,
          border: `1px solid ${sleepColor}33`
        }}>
          <span className="w-2 h-2 rounded-full bg-current opacity-85" />
          {sleepLabel}
        </span>
      </div>

      <div className="flex justify-center mt-2 flex-shrink-0">
        <AnalyzeWithWihyButton
          cardContext={`Sleep tracking: Slept ${sleepHours} ${unit} with ${sleepQuality}% quality score. Status: ${sleepLabel}. Sleep quality and duration metrics for health assessment.`}
          userQuery="Analyze my sleep patterns and provide insights about sleep quality, duration, and recommendations for better rest"
          onAnalyze={onAnalyze}
        />
      </div>
    </CardShell>
  );
};

export default SleepCard;