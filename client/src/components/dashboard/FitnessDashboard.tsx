// src/components/dashboard/FitnessDashboard.tsx
import React, { useMemo, useState } from "react";
import { Heart, Dumbbell, Timer, Move, Target, HelpCircle, X } from 'lucide-react';
import {
  WorkoutProgramGrid,
  ExerciseRowView,
  ExerciseMeta,
  ExercisePrescription,
  FitnessComponent,
  MuscleGroup,
  LoadLevel,
} from "./WorkoutProgramGrid";

/**
 * High-level program configuration
 */

export interface FitnessPhase {
  id: string;          // "phase1"
  name: string;        // "Phase 1 - Foundation"
}

export interface ProgramLevel {
  id: string;          // "beginner" | "intermediate" | "advanced"
  label: string;
}

export interface ProgramDay {
  id: string;          // "day1"
  label: string;       // "Day 1", "Full body A", etc.
}

/**
 * All program variants (phase + level + day) stored in a map
 * key: "phaseId__levelId__dayId"
 */

export type ProgramVariantMap = Record<string, ExerciseRowView[]>;

export const buildProgramKey = (
  phaseId: string,
  levelId: string,
  dayId: string
): string => `${phaseId}__${levelId}__${dayId}`;

/**
 * Main model for the dashboard
 */

export interface FitnessDashboardModel {
  title?: string;
  subtitle?: string;

  phases: FitnessPhase[];
  levels: ProgramLevel[];
  days: ProgramDay[];

  variants: ProgramVariantMap;

  programTitle?: string;
  programDescription?: string;

  defaultPhaseId?: string;
  defaultLevelId?: string;
  defaultDayId?: string;
}

/**
 * Props
 */

export interface FitnessDashboardProps {
  data: FitnessDashboardModel;
  onStartSession?: (params: {
    phaseId: string;
    levelId: string;
    dayId: string;
    rows: ExerciseRowView[];
  }) => void;
}

/**
 * Mobile-friendly card view for each exercise
 */

const MobileExerciseCard: React.FC<{ row: ExerciseRowView }> = ({ row }) => {
  const { meta, prescription } = row;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-4 shadow-sm transition-all duration-300 hover:shadow-md touch-manipulation">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1 min-w-0">
          <p className="text-base font-semibold text-gray-900 truncate leading-snug">{meta.name}</p>
          <p className="text-sm text-gray-500 mt-1">
            {meta.equipment === "NONE" ? "Bodyweight" : meta.equipment}
          </p>
        </div>
        <span className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-gray-100 to-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 ml-3 flex-shrink-0 min-h-[36px]">
          {prescription.sets} sets
        </span>
      </div>
      <p className="text-base text-gray-700 mb-4 leading-relaxed">
        {prescription.intensityLabel}
      </p>

      <div className="flex flex-wrap gap-2 text-sm text-gray-600">
        <span className="px-3 py-2 rounded-full bg-gradient-to-r from-red-50 to-red-100 text-red-700 border border-red-200 min-h-[32px] flex items-center">
          Cardio load {meta.fitnessLoad.CARDIO ?? 0}/3
        </span>
        <span className="px-3 py-2 rounded-full bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border border-blue-200 min-h-[32px] flex items-center">
          Strength load {meta.fitnessLoad.STRENGTH ?? 0}/3
        </span>
        <span className="px-3 py-2 rounded-full bg-gradient-to-r from-green-50 to-green-100 text-green-700 border border-green-200 min-h-[32px] flex items-center">
          Mobility load {meta.fitnessLoad.MOBILITY ?? 0}/3
        </span>
      </div>
    </div>
  );
};

/**
 * Main dashboard component
 */

const FitnessDashboard: React.FC<FitnessDashboardProps> = ({
  data,
  onStartSession,
}) => {
  const {
    title = "Start Your Workout",
    subtitle = "Choose your workout and start moving. Each session is designed to strengthen your body and improve your fitness.",
    phases,
    levels,
    days,
    variants,
    programTitle = "Today's Workout",
    programDescription = "See which body parts get worked and how hard each exercise will be.",
    defaultPhaseId,
    defaultLevelId,
    defaultDayId,
  } = data;

  const initialPhaseId = defaultPhaseId || (phases[0]?.id ?? "");
  const initialLevelId = defaultLevelId || (levels[0]?.id ?? "");
  const initialDayId = defaultDayId || (days[0]?.id ?? "");

  const [phaseId, setPhaseId] = useState<string>(initialPhaseId);
  const [levelId, setLevelId] = useState<string>(initialLevelId);
  const [dayId, setDayId] = useState<string>(initialDayId);
  const [showTooltip, setShowTooltip] = useState<boolean>(true); // Show by default for new users
  const [simplifiedView, setSimplifiedView] = useState<boolean>(true); // Start with simplified view

  const programKey = useMemo(
    () => buildProgramKey(phaseId, levelId, dayId),
    [phaseId, levelId, dayId]
  );

  const currentRows: ExerciseRowView[] = useMemo(
    () => variants[programKey] || [],
    [variants, programKey]
  );

  const currentPhase = phases.find((p) => p.id === phaseId);
  const currentLevel = levels.find((l) => l.id === levelId);
  const currentDay = days.find((d) => d.id === dayId);

  const handleStartSession = () => {
    if (!onStartSession) return;
    onStartSession({
      phaseId,
      levelId,
      dayId,
      rows: currentRows,
    });
  };

  return (
    <div className="w-full h-full bg-[#f0f7ff] overflow-hidden flex flex-col">
      <div className="flex-1 overflow-auto pt-16 sm:pt-[240px] lg:pt-[140px] p-4 sm:p-4 lg:p-6">
        <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        <header className="mb-2">
          <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
          <p className="text-sm text-gray-600 mt-1 max-w-3xl">{subtitle}</p>
        </header>
        {/* HOW TO READ THIS PROGRAM (Tooltip) */}
        <div className="relative mb-4">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex gap-1 bg-white/70 backdrop-blur border border-gray-200 rounded-full p-1">
              <button
                type="button"
                onClick={() => setShowTooltip(!showTooltip)}
                className={`px-4 py-2 text-sm font-medium rounded-full transition ${
                  showTooltip ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Guide
              </button>
              <button
                type="button"
                onClick={() => setSimplifiedView(!simplifiedView)}
                className={`px-4 py-2 text-sm font-medium rounded-full transition ${
                  simplifiedView ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {simplifiedView ? "Simplified" : "Detailed"}
              </button>
            </div>
          </div>
          
          {showTooltip && (
            <div className="mt-3 bg-white rounded-2xl border border-gray-200 shadow-lg p-5 animate-in slide-in-from-top-2">
              <div className="grid gap-4 text-sm text-gray-700">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">Quick guide</h4>
                  <p className="text-blue-800 leading-relaxed">
                    <span className="font-medium">Sets</span> = how many rounds • 
                    <span className="font-medium">Intensity</span> = how challenging • 
                    <span className="font-medium">Colored bars</span> = which body areas get worked
                  </p>
                </div>
                
                {!simplifiedView && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-700 text-sm leading-relaxed">
                      <strong>Blue bars:</strong> How much your heart and muscles work<br/>
                      <strong>Green bars:</strong> Which body parts get the most attention<br/>
                      Darker colors = more work for that area
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Controls: Phase selector, Level toggle, Day picker, Start session */}
        <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sm:p-6">
          <div className="grid gap-5 sm:grid-cols-[2fr,2fr,3fr] items-start">
            {/* Phase selector */}
            <div>
              <label className="block text-sm sm:text-sm font-semibold text-gray-700 mb-3">
                Workout Type
              </label>
              <select
                className="w-full rounded-xl border border-gray-300 bg-white px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 min-h-[44px]"
                value={phaseId}
                onChange={(e) => setPhaseId(e.target.value)}
              >
                {phases.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Level toggle */}
            <div>
              <p className="block text-sm sm:text-sm font-semibold text-gray-700 mb-3">
                Difficulty
              </p>
              <div className="flex flex-wrap gap-2">
                {levels.map((level) => (
                  <button
                    key={level.id}
                    type="button"
                    onClick={() => setLevelId(level.id)}
                    className={`px-4 sm:px-4 py-3 rounded-full text-sm sm:text-sm font-medium border transition-all duration-200 min-h-[48px] touch-manipulation ${
                      levelId === level.id
                        ? "bg-gradient-to-r from-blue-500 to-blue-600 border-blue-500 text-white shadow-sm"
                        : "bg-gradient-to-r from-gray-50 to-gray-100 border-gray-300 text-gray-700 hover:from-gray-100 hover:to-gray-200"
                    }`}
                  >
                    {level.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Day picker */}
            <div className="min-w-0">
              <p className="block text-sm sm:text-sm font-semibold text-gray-700 mb-3">
                Session
              </p>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide touch-pan-x min-w-full" style={{ WebkitOverflowScrolling: 'touch', scrollBehavior: 'smooth', touchAction: 'pan-x' }}>
                {days.map((day) => (
                  <button
                    key={day.id}
                    type="button"
                    onClick={() => setDayId(day.id)}
                    className={`px-4 sm:px-4 py-3 rounded-full text-sm sm:text-sm font-medium border whitespace-nowrap transition-all duration-200 min-h-[48px] touch-manipulation flex-shrink-0 ${
                      dayId === day.id
                        ? "bg-gradient-to-r from-gray-900 to-gray-800 border-gray-900 text-white shadow-sm"
                        : "bg-gradient-to-r from-gray-50 to-gray-100 border-gray-300 text-gray-700 hover:from-gray-100 hover:to-gray-200"
                    }`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Session context + Start button */}
          <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="text-sm sm:text-sm text-gray-600">
              <p className="font-semibold text-gray-800 mb-2">
                Ready to start: {currentPhase ? currentPhase.name : "Workout"} • {currentLevel ? currentLevel.label : "Level"} • {currentDay ? currentDay.label : "Session"}
              </p>
              {programDescription && (
                <p className="max-w-2xl text-gray-600">{programDescription}</p>
              )}
            </div>
            <button
              type="button"
              onClick={handleStartSession}
              disabled={currentRows.length === 0}
              className={`inline-flex items-center justify-center rounded-full px-7 py-3.5 text-sm font-semibold transition-all w-full sm:w-auto
                ${currentRows.length === 0
                  ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                  : "bg-gray-900 text-white hover:bg-gray-800 active:bg-gray-900 shadow-sm"
                }`}
            >
              Start workout
            </button>
          </div>
        </section>

        {/* Desktop: Program grid */}
        <section className="hidden sm:block">
          <WorkoutProgramGrid title={programTitle} rows={currentRows} simplifiedView={simplifiedView} />
        </section>

        {/* Mobile: Card list */}
        <section className="sm:hidden">
          <h2 className="text-lg sm:text-base font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-5">
            Your Exercises
          </h2>
          {currentRows.length === 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center">
              <p className="text-sm text-gray-500">
                Choose your workout type, difficulty, and session above to see your exercises!
              </p>
            </div>
          )}
          {currentRows.map((row) => (
            <MobileExerciseCard key={row.meta.id} row={row} />
          ))}
        </section>
        </div>
      </div>
    </div>
  );
};

export default FitnessDashboard;

/**
 * Optional: Adapter types to auto-type ExerciseRowView
 * from your service payloads.
 */

export interface ServiceExerciseDto {
  id: string;
  name: string;
  equipment: "NONE" | "DUMBBELLS" | "BARBELL" | "MACHINE";
  fitnessLoad?: Partial<Record<FitnessComponent, LoadLevel>>;
  muscleLoad?: Partial<Record<MuscleGroup, LoadLevel>>;
  sets: number;
  intensityLabel: string;
}

export function mapServiceExerciseToRow(
  dto: ServiceExerciseDto
): ExerciseRowView {
  const meta: ExerciseMeta = {
    id: dto.id,
    name: dto.name,
    equipment: dto.equipment,
    fitnessLoad: dto.fitnessLoad ?? {},
    muscleLoad: dto.muscleLoad ?? {},
  };

  const prescription: ExercisePrescription = {
    exerciseId: dto.id,
    sets: dto.sets,
    intensityLabel: dto.intensityLabel,
  };

  return { meta, prescription };
}

export type ServiceProgramConfig = {
  [phaseId: string]: {
    [levelId: string]: {
      [dayId: string]: ServiceExerciseDto[];
    };
  };
};

export function buildProgramVariantsFromService(
  config: ServiceProgramConfig
): ProgramVariantMap {
  const variants: ProgramVariantMap = {};

  Object.entries(config).forEach(([phaseId, levels]) => {
    Object.entries(levels).forEach(([levelId, days]) => {
      Object.entries(days).forEach(([dayId, exercises]) => {
        const key = buildProgramKey(phaseId, levelId, dayId);
        variants[key] = exercises.map(mapServiceExerciseToRow);
      });
    });
  });

  return variants;
}
