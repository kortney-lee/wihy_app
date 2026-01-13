import React, { useState } from 'react';
import {
  Clock,
  Target,
  Dumbbell,
  Play,
  Save,
  Edit3,
  ChevronDown,
  ChevronUp,
  Info,
  CheckCircle2,
  Calendar,
  Star,
  Share2,
  RotateCcw
} from 'lucide-react';
import { FitnessProgram, Exercise, Workout, FitnessLevel } from '../../types/fitness';

interface WorkoutPreviewProps {
  program: FitnessProgram;
  programId: string;
  onStartWorkout: () => void;
  onSaveProgram: () => void;
  onCustomize?: () => void;
  onViewExerciseDetail?: (exercise: Exercise) => void;
  onBack?: () => void;
  isSaving?: boolean;
}

const getLevelColor = (level?: FitnessLevel): string => {
  switch (level) {
    case 'beginner': return '#10B981';
    case 'intermediate': return '#2563EB';
    case 'advanced': return '#DC2626';
    default: return '#6B7280';
  }
};

const getLevelBgColor = (level?: FitnessLevel): string => {
  switch (level) {
    case 'beginner': return 'bg-green-50 text-green-700 border-green-200';
    case 'intermediate': return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'advanced': return 'bg-red-50 text-red-700 border-red-200';
    default: return 'bg-gray-50 text-gray-700 border-gray-200';
  }
};

const WorkoutPreview: React.FC<WorkoutPreviewProps> = ({
  program,
  programId,
  onStartWorkout,
  onSaveProgram,
  onCustomize,
  onViewExerciseDetail,
  onBack,
  isSaving = false
}) => {
  const [expandedExercise, setExpandedExercise] = useState<string | null>(null);
  const [showAllExercises, setShowAllExercises] = useState(false);

  // Get the first workout day (today's workout)
  const todayWorkout: Workout | undefined = program.workouts?.find(w => !w.is_rest_day);
  const exercises = todayWorkout?.exercises || [];
  
  // Calculate totals
  const totalSets = exercises.reduce((sum, ex) => sum + (ex.sets || 0), 0);
  const estimatedDuration = todayWorkout?.estimated_duration || program.workouts?.[0]?.estimated_duration || 35;
  
  // Get muscle focus breakdown
  const muscleFocus = exercises.reduce((acc, ex) => {
    const muscle = ex.target_muscle;
    if (muscle) {
      acc[muscle] = (acc[muscle] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const primaryMuscles = Object.entries(muscleFocus)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 2)
    .map(([muscle, count]) => ({
      muscle,
      percentage: Math.round((count / exercises.length) * 100)
    }));

  const displayedExercises = showAllExercises ? exercises : exercises.slice(0, 4);

  const toggleExercise = (exerciseId: string) => {
    setExpandedExercise(prev => prev === exerciseId ? null : exerciseId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-3xl mx-auto p-4 sm:p-6 pb-32">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            💪 {program.name || 'Your Workout'}
          </h1>
          {program.description && (
            <p className="text-gray-600">{program.description}</p>
          )}
        </div>

        {/* Summary Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 mb-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            {/* Duration */}
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-2">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
              <p className="text-xl font-bold text-gray-900">{estimatedDuration}</p>
              <p className="text-xs text-gray-500">minutes</p>
            </div>

            {/* Exercises */}
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-2">
                <Dumbbell className="w-6 h-6 text-purple-600" />
              </div>
              <p className="text-xl font-bold text-gray-900">{exercises.length}</p>
              <p className="text-xs text-gray-500">exercises</p>
            </div>

            {/* Total Sets */}
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-2">
                <Target className="w-6 h-6 text-green-600" />
              </div>
              <p className="text-xl font-bold text-gray-900">{totalSets}</p>
              <p className="text-xs text-gray-500">total sets</p>
            </div>
          </div>

          {/* Focus breakdown */}
          {primaryMuscles.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-sm text-gray-500 mb-2">🎯 Focus</p>
              <div className="flex flex-wrap gap-2">
                {primaryMuscles.map(({ muscle, percentage }) => (
                  <span 
                    key={muscle}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm font-medium"
                  >
                    {muscle} ({percentage}%)
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Difficulty badge */}
          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border ${getLevelBgColor(program.difficulty)}`}>
              <span 
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: getLevelColor(program.difficulty) }}
              />
              {program.difficulty?.charAt(0).toUpperCase()}{program.difficulty?.slice(1)} Level
            </span>
            
            {program.duration_weeks && (
              <span className="text-sm text-gray-500">
                <Calendar className="w-4 h-4 inline mr-1" />
                {program.duration_weeks} week program
              </span>
            )}
          </div>
        </div>

        {/* Exercise List */}
        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Dumbbell className="w-5 h-5 text-gray-400" />
            Today's Exercises
          </h2>
          
          <div className="space-y-3">
            {displayedExercises.map((exercise, index) => {
              const isExpanded = expandedExercise === exercise.exercise_id;
              
              return (
                <div
                  key={exercise.exercise_id}
                  className="bg-white rounded-xl border border-gray-200 overflow-hidden transition-all hover:shadow-md"
                >
                  {/* Exercise Header */}
                  <button
                    onClick={() => toggleExercise(exercise.exercise_id)}
                    className="w-full p-4 flex items-start gap-3 text-left"
                  >
                    {/* Number badge */}
                    <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">{index + 1}</span>
                    </div>

                    {/* Exercise info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 mb-1">{exercise.name}</h3>
                      <div className="flex flex-wrap items-center gap-2 text-sm">
                        <span className="inline-flex items-center gap-1 text-blue-600">
                          💪 {exercise.target_muscle}
                        </span>
                        {exercise.secondary_muscles && exercise.secondary_muscles.length > 0 && (
                          <span className="text-gray-400">
                            + {exercise.secondary_muscles.slice(0, 2).join(', ')}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Sets/Reps badge */}
                    <div className="flex-shrink-0 text-right">
                      <p className="text-sm font-semibold text-gray-900">
                        {exercise.sets} sets
                      </p>
                      <p className="text-xs text-gray-500">
                        {exercise.reps} reps
                      </p>
                    </div>

                    {/* Expand icon */}
                    <div className="flex-shrink-0">
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </button>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-gray-100">
                      {/* Equipment */}
                      {exercise.equipment && exercise.equipment.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {exercise.equipment.map(eq => (
                            <span 
                              key={eq}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs"
                            >
                              🏋️ {eq}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Weight recommendation */}
                      {exercise.weight_recommendation && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm text-blue-700">
                            <strong>Weight:</strong> {exercise.weight_recommendation}
                          </p>
                        </div>
                      )}

                      {/* Instructions */}
                      {exercise.instructions && exercise.instructions.length > 0 && (
                        <div className="mt-3">
                          <p className="text-xs font-semibold text-gray-500 mb-2">INSTRUCTIONS</p>
                          <ol className="space-y-1.5">
                            {exercise.instructions.map((instruction, i) => (
                              <li key={i} className="flex gap-2 text-sm text-gray-700">
                                <span className="flex-shrink-0 w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center text-xs text-gray-500">
                                  {i + 1}
                                </span>
                                {instruction}
                              </li>
                            ))}
                          </ol>
                        </div>
                      )}

                      {/* Form tips */}
                      {exercise.form_tips && exercise.form_tips.length > 0 && (
                        <div className="mt-3 p-3 bg-amber-50 rounded-lg">
                          <p className="text-xs font-semibold text-amber-700 mb-1.5">💡 FORM TIPS</p>
                          <ul className="space-y-1">
                            {exercise.form_tips.map((tip, i) => (
                              <li key={i} className="text-sm text-amber-700 flex gap-2">
                                <span>•</span>
                                {tip}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Rest time */}
                      <div className="mt-3 flex items-center justify-between text-sm">
                        <span className="text-gray-500">
                          ⏱️ Rest: {exercise.rest_seconds}s between sets
                        </span>
                        {onViewExerciseDetail && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onViewExerciseDetail(exercise);
                            }}
                            className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                          >
                            <Play className="w-4 h-4" />
                            Watch Demo
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Show more/less button */}
          {exercises.length > 4 && (
            <button
              onClick={() => setShowAllExercises(!showAllExercises)}
              className="w-full mt-3 py-3 text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center justify-center gap-1"
            >
              {showAllExercises ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  Show Less
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  Show All {exercises.length} Exercises
                </>
              )}
            </button>
          )}
        </section>

        {/* Warm Up / Cool Down Info */}
        {(todayWorkout?.warm_up || todayWorkout?.cool_down) && (
          <section className="mt-6">
            <div className="grid grid-cols-2 gap-3">
              {todayWorkout?.warm_up && (
                <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
                  <p className="text-sm font-semibold text-orange-700 mb-2">
                    🔥 Warm Up ({todayWorkout.warm_up.duration_minutes} min)
                  </p>
                  <ul className="space-y-1">
                    {todayWorkout.warm_up.activities.slice(0, 3).map((activity, i) => (
                      <li key={i} className="text-xs text-orange-600">
                        • {activity.name}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {todayWorkout?.cool_down && (
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                  <p className="text-sm font-semibold text-blue-700 mb-2">
                    ❄️ Cool Down ({todayWorkout.cool_down.duration_minutes} min)
                  </p>
                  <ul className="space-y-1">
                    {todayWorkout.cool_down.activities.slice(0, 3).map((activity, i) => (
                      <li key={i} className="text-xs text-blue-600">
                        • {activity.name}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Program Info */}
        {program.workouts && program.workouts.length > 1 && (
          <section className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Full Program Overview
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Duration</p>
                <p className="font-semibold text-gray-900">{program.duration_weeks} weeks</p>
              </div>
              <div>
                <p className="text-gray-500">Workouts/Week</p>
                <p className="font-semibold text-gray-900">{program.days_per_week} days</p>
              </div>
              <div>
                <p className="text-gray-500">Total Workouts</p>
                <p className="font-semibold text-gray-900">{program.total_workouts}</p>
              </div>
              <div>
                <p className="text-gray-500">Status</p>
                <p className="font-semibold text-green-600">Ready to Start</p>
              </div>
            </div>
          </section>
        )}
      </div>

      {/* Fixed Bottom Action Buttons */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 shadow-lg">
        <div className="max-w-3xl mx-auto">
          <div className="grid grid-cols-2 gap-3">
            {/* Save Program */}
            <button
              onClick={onSaveProgram}
              disabled={isSaving}
              className="py-3.5 px-4 bg-white border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <>
                  <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Save Program
                </>
              )}
            </button>

            {/* Start Workout */}
            <button
              onClick={onStartWorkout}
              className="py-3.5 px-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              <Play className="w-5 h-5" />
              Start Workout
            </button>
          </div>

          {/* Additional actions */}
          {onCustomize && (
            <button
              onClick={onCustomize}
              className="w-full mt-2 py-2 text-gray-500 hover:text-gray-700 text-sm font-medium flex items-center justify-center gap-1"
            >
              <Edit3 className="w-4 h-4" />
              Customize Exercises
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkoutPreview;
