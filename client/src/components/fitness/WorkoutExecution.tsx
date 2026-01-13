import React, { useState, useEffect, useCallback } from 'react';
import {
  Play,
  Pause,
  SkipForward,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Target,
  Dumbbell,
  Timer,
  X,
  Edit3,
  AlertCircle,
  CheckCircle2,
  RotateCcw
} from 'lucide-react';
import { 
  FitnessProgram, 
  Workout, 
  Exercise, 
  CompletedSet, 
  ExerciseCompletion,
  WorkoutSessionState 
} from '../../types/fitness';

interface WorkoutExecutionProps {
  program: FitnessProgram;
  programId: string;
  workout?: Workout;
  onComplete: (completionData: WorkoutCompletionData) => void;
  onExit: () => void;
}

interface WorkoutCompletionData {
  completed_at: string;
  duration_minutes: number;
  exercises_completed: ExerciseCompletion[];
  notes?: string;
  energy_level?: 'low' | 'moderate' | 'high';
  calories_burned?: number;
}

type SetStatus = 'pending' | 'completed' | 'modified' | 'skipped';

interface CurrentSetLog {
  reps: string;
  weight: string;
  difficulty?: 'easy' | 'moderate' | 'challenging' | 'hard';
}

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const WorkoutExecution: React.FC<WorkoutExecutionProps> = ({
  program,
  programId,
  workout: providedWorkout,
  onComplete,
  onExit
}) => {
  // Get the workout to execute
  const workout = providedWorkout || program.workouts?.find(w => !w.is_rest_day);
  const exercises = workout?.exercises || [];
  const totalExercises = exercises.length;

  // Session state
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSetNumber, setCurrentSetNumber] = useState(1);
  const [completedExercises, setCompletedExercises] = useState<ExerciseCompletion[]>([]);
  const [startTime] = useState<Date>(new Date());
  
  // Rest timer state
  const [isResting, setIsResting] = useState(false);
  const [restTimeRemaining, setRestTimeRemaining] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Current set logging
  const [currentSetLog, setCurrentSetLog] = useState<CurrentSetLog>({
    reps: '',
    weight: ''
  });

  // UI state
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);

  const currentExercise = exercises[currentExerciseIndex];
  const totalSets = currentExercise?.sets || 3;

  // Rest timer countdown
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isResting && restTimeRemaining > 0 && !isPaused) {
      interval = setInterval(() => {
        setRestTimeRemaining(prev => {
          if (prev <= 1) {
            setIsResting(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isResting, restTimeRemaining, isPaused]);

  // Calculate progress
  const overallProgress = totalExercises > 0 
    ? ((currentExerciseIndex * totalSets + (currentSetNumber - 1)) / (totalExercises * totalSets)) * 100
    : 0;

  const handleLogSet = useCallback((status: SetStatus = 'completed') => {
    const reps = parseInt(currentSetLog.reps) || parseInt(currentExercise?.reps?.split('-')[0] || '10');
    const weight = currentSetLog.weight === 'bodyweight' ? 'bodyweight' : (parseFloat(currentSetLog.weight) || 0);

    const setData: CompletedSet = {
      set: currentSetNumber,
      reps,
      weight: weight as number | 'bodyweight',
      difficulty: currentSetLog.difficulty,
      timestamp: new Date().toISOString()
    };

    // Update completed exercises
    setCompletedExercises(prev => {
      const existingIndex = prev.findIndex(e => e.exercise_id === currentExercise.exercise_id);
      
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          sets_completed: [...updated[existingIndex].sets_completed, setData]
        };
        return updated;
      } else {
        return [...prev, {
          exercise_id: currentExercise.exercise_id,
          sets_completed: [setData]
        }];
      }
    });

    // Clear current set log
    setCurrentSetLog({ reps: '', weight: '' });

    // Move to next set or exercise
    if (currentSetNumber < totalSets) {
      // Start rest timer
      setRestTimeRemaining(currentExercise?.rest_seconds || 90);
      setIsResting(true);
      setCurrentSetNumber(prev => prev + 1);
    } else {
      // Move to next exercise
      if (currentExerciseIndex < totalExercises - 1) {
        setCurrentExerciseIndex(prev => prev + 1);
        setCurrentSetNumber(1);
        setRestTimeRemaining(currentExercise?.rest_seconds || 90);
        setIsResting(true);
      } else {
        // Workout complete!
        finishWorkout();
      }
    }
  }, [currentSetLog, currentSetNumber, currentExercise, totalSets, currentExerciseIndex, totalExercises]);

  const handleSkipExercise = () => {
    if (currentExerciseIndex < totalExercises - 1) {
      setCurrentExerciseIndex(prev => prev + 1);
      setCurrentSetNumber(1);
      setIsResting(false);
    } else {
      finishWorkout();
    }
  };

  const finishWorkout = () => {
    const endTime = new Date();
    const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / 60000);

    const completionData: WorkoutCompletionData = {
      completed_at: endTime.toISOString(),
      duration_minutes: durationMinutes,
      exercises_completed: completedExercises,
      energy_level: 'moderate',
      calories_burned: Math.round(durationMinutes * 8) // Rough estimate
    };

    onComplete(completionData);
  };

  const handleExit = () => {
    if (completedExercises.length > 0) {
      setShowExitConfirm(true);
    } else {
      onExit();
    }
  };

  if (!currentExercise) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No exercises found in this workout.</p>
          <button
            onClick={onExit}
            className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={handleExit}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="text-center">
            <p className="text-sm text-gray-800 font-medium">
              Exercise {currentExerciseIndex + 1} of {totalExercises}
            </p>
            <p className="text-xs text-gray-500">
              Set {currentSetNumber} of {totalSets}
            </p>
          </div>

          <button
            onClick={handleSkipExercise}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
          >
            <SkipForward className="w-5 h-5" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className="h-full transition-all duration-300"
            style={{ width: `${overallProgress}%`, backgroundColor: '#fa5f06' }}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {/* Exercise Name */}
        <div className="text-center mb-6">
          <h1 className="text-xl sm:text-2xl font-bold mb-2 text-gray-800">
            {currentExercise.name}
          </h1>
          <div className="flex items-center justify-center gap-3 text-gray-500">
            <span className="inline-flex items-center gap-1">
              💪 {currentExercise.target_muscle}
            </span>
            {currentExercise.secondary_muscles && currentExercise.secondary_muscles.length > 0 && (
              <span className="text-gray-400">
                + {currentExercise.secondary_muscles.join(', ')}
              </span>
            )}
          </div>
        </div>

        {/* Exercise Demo Area */}
        <div className="bg-gray-50 rounded-xl p-6 mb-6 text-center border border-gray-200">
          {currentExercise.video_url ? (
            <video
              src={currentExercise.video_url}
              className="w-full max-h-48 object-contain rounded-lg"
              autoPlay
              loop
              muted
              playsInline
            />
          ) : currentExercise.image_url ? (
            <img
              src={currentExercise.image_url}
              alt={currentExercise.name}
              className="w-full max-h-48 object-contain rounded-lg"
            />
          ) : (
            <div className="h-48 flex items-center justify-center">
              <Dumbbell className="w-24 h-24 text-gray-300" />
            </div>
          )}
        </div>

        {/* Instructions (Collapsible) */}
        {currentExercise.instructions && currentExercise.instructions.length > 0 && (
          <div className="mb-6">
            <button
              onClick={() => setShowInstructions(!showInstructions)}
              className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200"
            >
              <span className="text-sm font-medium text-gray-700">📋 Instructions</span>
              {showInstructions ? (
                <ChevronLeft className="w-5 h-5 rotate-90 text-gray-500" />
              ) : (
                <ChevronRight className="w-5 h-5 rotate-90 text-gray-500" />
              )}
            </button>
            
            {showInstructions && (
              <div className="mt-2 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <ol className="space-y-2">
                  {currentExercise.instructions.map((instruction, i) => (
                    <li key={i} className="flex gap-3 text-sm text-gray-600">
                      <span className="flex-shrink-0 w-6 h-6 text-white rounded-full flex items-center justify-center text-xs font-medium" style={{ backgroundColor: '#fa5f06' }}>
                        {i + 1}
                      </span>
                      {instruction}
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        )}

        {/* Target reps display */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full" style={{ backgroundColor: '#fa5f0615', border: '1px solid #fa5f0630' }}>
            <Target className="w-5 h-5" style={{ color: '#fa5f06' }} />
            <span className="text-lg font-bold" style={{ color: '#fa5f06' }}>
              Target: {currentExercise.reps} reps
            </span>
          </div>
        </div>

        {/* Rest Timer Overlay */}
        {isResting && (
          <div className="fixed inset-0 z-20 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center p-4">
            <div className="text-center">
              <Timer className="w-16 h-16 mx-auto mb-4" style={{ color: '#fa5f06' }} />
              <p className="text-xl text-gray-500 mb-2">Rest Time</p>
              <p className="text-6xl font-bold mb-6 text-gray-800">{formatTime(restTimeRemaining)}</p>
              
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => setIsPaused(!isPaused)}
                  className="p-4 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
                >
                  {isPaused ? (
                    <Play className="w-8 h-8 text-gray-700" />
                  ) : (
                    <Pause className="w-8 h-8 text-gray-700" />
                  )}
                </button>
                
                <button
                  onClick={() => {
                    setIsResting(false);
                    setRestTimeRemaining(0);
                  }}
                  className="p-4 rounded-full hover:opacity-90 transition-colors"
                  style={{ backgroundColor: '#fa5f06' }}
                >
                  <SkipForward className="w-8 h-8 text-white" />
                </button>
              </div>
              
              <p className="mt-6 text-gray-500">
                Next: Set {currentSetNumber} of {totalSets}
              </p>
            </div>
          </div>
        )}

        {/* Log Set Section */}
        <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Log Set {currentSetNumber}</h3>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            {/* Reps Input */}
            <div>
              <label className="block text-sm text-gray-500 mb-2">Reps Completed</label>
              <input
                type="number"
                value={currentSetLog.reps}
                onChange={(e) => setCurrentSetLog(prev => ({ ...prev, reps: e.target.value }))}
                placeholder={currentExercise.reps?.split('-')[0] || '10'}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-800 text-lg text-center focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none"
              />
            </div>

            {/* Weight Input */}
            <div>
              <label className="block text-sm text-gray-500 mb-2">Weight (lbs)</label>
              <input
                type="text"
                value={currentSetLog.weight}
                onChange={(e) => setCurrentSetLog(prev => ({ ...prev, weight: e.target.value }))}
                placeholder="0 or bodyweight"
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-800 text-lg text-center focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none"
              />
            </div>
          </div>

          {/* Difficulty Selector */}
          <div>
            <label className="block text-sm text-gray-500 mb-2">How did it feel?</label>
            <div className="grid grid-cols-4 gap-2">
              {(['easy', 'moderate', 'challenging', 'hard'] as const).map(difficulty => (
                <button
                  key={difficulty}
                  onClick={() => setCurrentSetLog(prev => ({ ...prev, difficulty }))}
                  className={`py-2 px-3 rounded-lg text-sm font-medium transition-all border ${
                    currentSetLog.difficulty === difficulty
                      ? difficulty === 'easy' ? 'bg-green-500 text-white border-green-500' :
                        difficulty === 'moderate' ? 'bg-blue-500 text-white border-blue-500' :
                        difficulty === 'challenging' ? 'bg-orange-500 text-white border-orange-500' :
                        'bg-red-500 text-white border-red-500'
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 p-4 rounded-xl" style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb' }}>
          {/* Main action button */}
          <button
            onClick={() => handleLogSet('completed')}
            className="w-full py-3.5 text-white font-bold text-base rounded-xl shadow-lg hover:opacity-90 transition-all flex items-center justify-center gap-2"
            style={{ backgroundColor: '#4cbb17' }}
          >
            <CheckCircle2 className="w-5 h-5" />
            {currentSetNumber < totalSets ? 'Log Set & Rest' : 
             currentExerciseIndex < totalExercises - 1 ? 'Log Set & Next Exercise' : 
             'Complete Workout'}
          </button>

          {/* Secondary actions */}
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => handleLogSet('modified')}
              className="flex-1 py-2.5 bg-white text-gray-600 font-medium rounded-xl border border-gray-200 hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
            >
              <Edit3 className="w-4 h-4" />
              Modified
            </button>
            <button
              onClick={handleSkipExercise}
              className="flex-1 py-2.5 bg-white text-gray-600 font-medium rounded-xl border border-gray-200 hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
            >
              <SkipForward className="w-4 h-4" />
              Skip Exercise
            </button>
          </div>
        </div>
      </div>

      {/* Exit Confirmation Modal */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full border border-gray-200">
            <h3 className="text-xl font-bold mb-2 text-gray-800">Exit Workout?</h3>
            <p className="text-gray-500 mb-6">
              You've completed {completedExercises.length} exercise(s). Your progress will be saved.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowExitConfirm(false)}
                className="flex-1 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200"
              >
                Continue Workout
              </button>
              <button
                onClick={() => {
                  finishWorkout();
                }}
                className="flex-1 py-3 bg-red-500 text-white font-medium rounded-xl hover:bg-red-600"
              >
                Save & Exit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkoutExecution;
