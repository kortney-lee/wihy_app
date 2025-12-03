// src/components/dashboard/FitnessDashboard.tsx
import React, { useMemo, useState } from "react";
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
  id: string;          // e.g. "phase1"
  name: string;        // e.g. "Phase 1 - Foundation"
}

export interface ProgramLevel {
  id: string;          // e.g. "beginner" | "intermediate" | "advanced"
  label: string;       // human readable
}

export interface ProgramDay {
  id: string;          // e.g. "day1"
  label: string;       // e.g. "Day 1", "Upper A", "Full Body"
}

/**
 * We store all program variants (phase + level + day)
 * as a keyed dictionary of ExerciseRowView[].
 *
 * Example key: "phase1__beginner__day1"
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
 * Mobile-friendly cards for each exercise (instead of full grid)
 */

const MobileExerciseCard: React.FC<{ row: ExerciseRowView }> = ({ row }) => {
  const { meta, prescription } = row;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 mb-2 shadow-sm">
      <div className="flex justify-between items-start mb-2">
        <div>
          <p className="text-sm font-semibold text-gray-900">{meta.name}</p>
          <p className="text-xs text-gray-500">
            {meta.equipment === "NONE" ? "Bodyweight" : meta.equipment}
          </p>
        </div>
        <span className="inline-flex items-center justify-center rounded-full bg-gray-50 px-2 py-1 text-xs font-semibold text-gray-700">
          {prescription.sets}x
        </span>
      </div>
      <p className="text-xs text-gray-700 mb-2">
        {prescription.intensityLabel}
      </p>

      {/* Simple load summary */}
      <div className="flex flex-wrap gap-1 text-xs text-gray-600">
        <span className="px-2 py-0.5 rounded-full bg-gray-50 border border-gray-100">
          Strength: {meta.fitnessLoad.STRENGTH ?? 0}/3
        </span>
        <span className="px-2 py-0.5 rounded-full bg-gray-50 border border-gray-100">
          Cardio: {meta.fitnessLoad.CARDIO ?? 0}/3
        </span>
        <span className="px-2 py-0.5 rounded-full bg-gray-50 border border-gray-100">
          Mobility: {meta.fitnessLoad.MOBILITY ?? 0}/3
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
    title = "Fitness Program",
    subtitle = "Your personalized program based on physical education and progression.",
    phases,
    levels,
    days,
    variants,
    programTitle = "Program overview",
    programDescription = "Designed with your goals, baseline, and PE-aligned progression.",
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
    <div className="w-full bg-[#f0f7ff] min-h-[70vh] px-4 sm:px-6 pb-10">
      {/* Header */}
      <header className="flex flex-col items-center gap-2 py-6">
        <h1 className="text-3xl font-semibold text-gray-900 text-center">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-gray-600 text-center max-w-2xl">
            {subtitle}
          </p>
        )}
      </header>

      <div className="max-w-6xl mx-auto space-y-4">
        {/* Controls: Phase selector, Level toggle, Day picker */}
        <section className="rounded-lg bg-white border border-gray-200 shadow-sm p-4">
          <div className="grid gap-4 sm:grid-cols-[2fr,2fr,3fr] items-start">
            {/* Phase selector */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Phase
              </label>
              <select
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
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
              <p className="block text-sm font-semibold text-gray-700 mb-2">
                Level
              </p>
              <div className="flex flex-wrap gap-2">
                {levels.map((level) => (
                  <button
                    key={level.id}
                    type="button"
                    onClick={() => setLevelId(level.id)}
                    className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                      levelId === level.id
                        ? "bg-emerald-500 border-emerald-500 text-white"
                        : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {level.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Day picker */}
            <div>
              <p className="block text-sm font-semibold text-gray-700 mb-2">
                Day
              </p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {days.map((day) => (
                  <button
                    key={day.id}
                    type="button"
                    onClick={() => setDayId(day.id)}
                    className={`px-4 py-2 rounded-full text-sm font-medium border whitespace-nowrap transition-colors ${
                      dayId === day.id
                        ? "bg-gray-900 border-gray-900 text-white"
                        : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Session context + Start button */}
          <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              <p className="font-semibold text-gray-800">
                {currentPhase ? currentPhase.name : "Phase"} /{" "}
                {currentLevel ? currentLevel.label : "Level"} /{" "}
                {currentDay ? currentDay.label : "Day"}
              </p>
              {programDescription && (
                <p className="mt-1 max-w-2xl text-sm">{programDescription}</p>
              )}
            </div>
            <button
              type="button"
              onClick={handleStartSession}
              className="inline-flex items-center justify-center self-start sm:self-auto rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={currentRows.length === 0}
            >
              Start Session
            </button>
          </div>
        </section>

        {/* Desktop: Program grid */}
        <section className="hidden sm:block">
          <div className="rounded-lg bg-white shadow-sm border border-gray-200 p-4">
            <WorkoutProgramGrid title={programTitle} rows={currentRows} />
          </div>
        </section>

        {/* Mobile: Accordion-style list */}
        <section className="sm:hidden">
          <div className="rounded-lg bg-white shadow-sm border border-gray-200 p-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">
              {programTitle}
            </h2>
            {currentRows.length === 0 && (
              <p className="text-sm text-gray-500">
                No exercises scheduled yet for this combination. Your coach may
                not have configured this phase, level, and day.
              </p>
            )}
            {currentRows.map((row) => (
              <MobileExerciseCard key={row.meta.id} row={row} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default FitnessDashboard;

/**
 * Optional: Adapter types to "auto-type" ExerciseRowView
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

/**
 * Helper to build a ProgramVariantMap from a nested structure:
 *
 * programConfig[phaseId][levelId][dayId] = ServiceExerciseDto[]
 */

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
