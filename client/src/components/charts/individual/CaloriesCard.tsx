import React from 'react';
import AnalyzeWithWihyButton from '../shared/AnalyzeWithWihyButton';

const CardShell = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="flex flex-col p-6 rounded-2xl bg-white border border-gray-200 shadow-md h-[420px] overflow-hidden">
    <h3 className="text-xl font-semibold text-gray-400 m-0 mb-3 text-center">{title}</h3>
    <div className="flex flex-col items-center justify-center flex-1 gap-1 overflow-hidden min-h-0">{children}</div>
  </section>
);

interface CaloriesCardProps {
  consumedCalories?: number;
  burnedCalories?: number;
  unit?: string;
  onAnalyze?: (userMessage: string, assistantMessage: string) => void;
}

const CaloriesCard: React.FC<CaloriesCardProps> = ({
  consumedCalories = 2100,
  burnedCalories = 2450,
  unit = 'kcal',
  onAnalyze
}) => {
  const netCalories = burnedCalories - consumedCalories;
  const maxCalories = Math.max(consumedCalories, burnedCalories);
  const consumedWidth = (consumedCalories / maxCalories) * 100;
  const burnedWidth = (burnedCalories / maxCalories) * 100;
  
  return (
    <CardShell title="Calories Today">

      {/* Main Value Display */}
      <div className="flex flex-col items-center min-w-0 overflow-hidden mb-3">
        <div className="text-xl lg:text-2xl font-normal text-gray-800 leading-tight mb-1 truncate">
          {consumedCalories.toLocaleString()}
        </div>
        <div className="text-sm text-gray-400 font-normal">
          {unit} consumed
        </div>
      </div>

      {/* Simple Bar Display */}
      <div className="w-full max-w-[180px] mb-2">
        {/* Consumed vs Burned Bars */}
        <div className="mb-1.5">
          <div className="text-xs text-gray-500 mb-0.5 text-left">
            Consumed
          </div>
          <div className="w-full h-2.5 bg-gray-100 rounded-md overflow-hidden">
            <div className="h-full bg-blue-500 rounded-md transition-all duration-700 ease-in-out" style={{width: `${consumedWidth}%`}} />
          </div>
        </div>

        <div className="mb-1.5">
          <div className="text-xs text-gray-500 mb-0.5 text-left">
            Burned: {burnedCalories.toLocaleString()} {unit}
          </div>
          <div className="w-full h-2.5 bg-gray-100 rounded-md overflow-hidden">
            <div className="h-full bg-green-500 rounded-md transition-all duration-700 ease-in-out" style={{width: `${burnedWidth}%`}} />
          </div>
        </div>
      </div>

      {/* Status Pill */}
      <div className="text-center">
        <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm ${
          netCalories > 0 
            ? 'text-green-700 bg-green-500 bg-opacity-20 border border-green-500 border-opacity-20'
            : 'text-red-700 bg-red-500 bg-opacity-20 border border-red-500 border-opacity-20'
        }`}>
          <span className="w-2 h-2 rounded-full bg-current opacity-85" />
          Net: {netCalories > 0 ? '+' : ''}{netCalories} {unit}
        </span>
      </div>

      <div className="flex justify-center mt-2 flex-shrink-0">
        <AnalyzeWithWihyButton
          cardContext={`Calories: Consumed ${consumedCalories} ${unit}, Burned ${burnedCalories} ${unit}, Net ${netCalories} ${unit} ${netCalories > 0 ? 'deficit' : 'surplus'}`}
          userQuery="Analyze my calorie balance and metabolism"
          onAnalyze={onAnalyze}
        />
      </div>
    </CardShell>
  );
};

export default CaloriesCard;