import React, { useState, useEffect } from 'react';
import {
  Dumbbell,
  Target,
  Calendar,
  Clock,
  Flame,
  Trophy,
  ChevronRight,
  Plus,
  Star,
  History,
  Zap,
  TrendingUp,
  Play,
  Activity,
  Sparkles,
  Heart,
  Waves
} from 'lucide-react';
import { FitnessLevel, FitnessProgram, SavedProgram, WorkoutType, ProgramListItem } from '../../types/fitness';
import { fitnessService } from '../../services/fitnessService';

// Brand colors from BRAND_GUIDE.md - Desktop Web Standard
const BRAND_COLORS = {
  primary: '#fa5f06',      // WiHY Orange
  success: '#4cbb17',      // Kelly Green
  background: '#e0f2fe',   // Light Blue - Standard page background
  textPrimary: '#1f2937',  // Gray-800
  textSecondary: '#6b7280', // Gray-500
  border: '#e5e7eb',       // Gray-200 (standard border)
  white: '#ffffff'
};

interface EnhancedFitnessDashboardProps {
  userFitnessLevel?: FitnessLevel;
  savedPrograms?: SavedProgram[];
  recentWorkouts?: RecentWorkout[];
  onStartNewWorkout: () => void;
  onQuickWorkout: (type: WorkoutType, duration: number) => void;
  onSelectProgram: (programId: string) => void;
  onViewCalendar: (programId?: string) => void;
  onViewHistory: () => void;
  onChangeFitnessLevel: () => void;
}

interface RecentWorkout {
  id: string;
  name: string;
  date: string;
  duration: number;
  caloriesBurned: number;
  muscleGroups: string[];
}

interface QuickWorkoutOption {
  type: WorkoutType;
  duration: number;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const quickWorkoutOptions: QuickWorkoutOption[] = [
  {
    type: 'strength',
    duration: 30,
    label: 'Strength',
    description: 'Build muscle',
    icon: <Dumbbell className="w-5 h-5" />,
    color: 'from-blue-400 to-blue-600'
  },
  {
    type: 'cardio',
    duration: 30,
    label: 'Cardio',
    description: 'Heart health',
    icon: <Heart className="w-5 h-5" />,
    color: 'from-red-400 to-red-600'
  },
  {
    type: 'hiit',
    duration: 25,
    label: 'HIIT',
    description: 'Burn fast',
    icon: <Zap className="w-5 h-5" />,
    color: 'from-yellow-400 to-orange-500'
  },
  {
    type: 'yoga',
    duration: 30,
    label: 'Yoga',
    description: 'Flexibility',
    icon: <Waves className="w-5 h-5" />,
    color: 'from-purple-400 to-purple-600'
  }
];

const getLevelColor = (level?: FitnessLevel): string => {
  switch (level) {
    case 'beginner': return BRAND_COLORS.success;
    case 'intermediate': return BRAND_COLORS.primary;
    case 'advanced': return '#DC2626';
    default: return BRAND_COLORS.textSecondary;
  }
};

const getLevelIcon = (level?: FitnessLevel): React.ReactNode => {
  const iconClass = "w-4 h-4";
  switch (level) {
    case 'beginner': return <Activity className={iconClass} />;
    case 'intermediate': return <Dumbbell className={iconClass} />;
    case 'advanced': return <Flame className={iconClass} />;
    default: return <Dumbbell className={iconClass} />;
  }
};

const EnhancedFitnessDashboard: React.FC<EnhancedFitnessDashboardProps> = ({
  userFitnessLevel = 'intermediate',
  savedPrograms = [],
  recentWorkouts = [],
  onStartNewWorkout,
  onQuickWorkout,
  onSelectProgram,
  onViewCalendar,
  onViewHistory,
  onChangeFitnessLevel
}) => {
  const [showAllPrograms, setShowAllPrograms] = useState(false);
  const [programList, setProgramList] = useState<ProgramListItem[]>([]);
  const [isLoadingPrograms, setIsLoadingPrograms] = useState(true);

  // Fetch user's programs from API
  useEffect(() => {
    const fetchPrograms = async () => {
      setIsLoadingPrograms(true);
      try {
        const response = await fitnessService.getUserPrograms();
        if (response.success && response.programs) {
          setProgramList(response.programs);
        }
      } catch (error) {
        console.warn('Failed to fetch programs:', error);
      } finally {
        setIsLoadingPrograms(false);
      }
    };
    fetchPrograms();
  }, []);

  // Calculate stats
  const weeklyWorkouts = recentWorkouts.filter(w => {
    const workoutDate = new Date(w.date);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return workoutDate >= weekAgo;
  }).length;

  const totalCaloriesThisWeek = recentWorkouts
    .filter(w => {
      const workoutDate = new Date(w.date);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return workoutDate >= weekAgo;
    })
    .reduce((sum, w) => sum + (w.caloriesBurned || 0), 0);

  const displayedPrograms = showAllPrograms 
    ? (programList.length > 0 ? programList : savedPrograms) 
    : (programList.length > 0 ? programList : savedPrograms).slice(0, 3);

  return (
    <div className="min-h-screen" style={{ backgroundColor: BRAND_COLORS.background }}>
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${BRAND_COLORS.primary}15` }}
              >
                <Dumbbell className="w-5 h-5" style={{ color: BRAND_COLORS.primary }} />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: BRAND_COLORS.textPrimary }}>
                Fitness Dashboard
              </h1>
            </div>
            <button
              onClick={onChangeFitnessLevel}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full hover:shadow-md transition-all"
              style={{ backgroundColor: BRAND_COLORS.white, border: `2px solid ${BRAND_COLORS.border}` }}
            >
              <span 
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: getLevelColor(userFitnessLevel) }}
              />
              <span className="text-sm font-medium flex items-center gap-1" style={{ color: BRAND_COLORS.textPrimary }}>
                <span style={{ color: getLevelColor(userFitnessLevel) }}>{getLevelIcon(userFitnessLevel)}</span>
                {userFitnessLevel?.charAt(0).toUpperCase()}{userFitnessLevel?.slice(1)}
              </span>
            </button>
          </div>
          <p style={{ color: BRAND_COLORS.textSecondary }}>
            Choose your workout or let AI create the perfect routine for you
          </p>
        </div>

        {/* Weekly Stats Banner */}
        <div 
          className="rounded-2xl p-5 mb-6 text-white"
          style={{ background: `linear-gradient(135deg, ${BRAND_COLORS.primary}, #e55505)` }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-white/80">This Week</p>
              <p className="text-2xl font-bold">{weeklyWorkouts} Workouts</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-white/80">Calories Burned</p>
              <p className="text-2xl font-bold">{totalCaloriesThisWeek.toLocaleString()}</p>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="mb-2">
            <div className="flex justify-between text-sm text-white/80 mb-1">
              <span>Weekly Goal: 4 workouts</span>
              <span>{Math.min(weeklyWorkouts, 4)}/4</span>
            </div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white rounded-full transition-all"
                style={{ width: `${Math.min((weeklyWorkouts / 4) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Primary CTA - New Workout */}
        <button
          onClick={onStartNewWorkout}
          className="w-full mb-6 p-5 rounded-2xl text-white shadow-lg transition-all active:scale-[0.99]"
          style={{ 
            background: `linear-gradient(135deg, ${BRAND_COLORS.success}, #3da814)`,
            boxShadow: `0 8px 24px ${BRAND_COLORS.success}40`
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                <Plus className="w-8 h-8" />
              </div>
              <div className="text-left">
                <p className="text-xl font-bold">Create New Workout</p>
                <p className="text-sm text-white/80">AI-powered personalized routine</p>
              </div>
            </div>
            <ChevronRight className="w-6 h-6" />
          </div>
        </button>

        {/* Quick Workout Options */}
        <section className="mb-6">
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2 overflow-hidden" style={{ color: BRAND_COLORS.textPrimary }}>
            <Zap className="w-5 h-5 flex-shrink-0" style={{ color: BRAND_COLORS.primary }} />
            <span className="truncate">Quick Workouts</span>
          </h2>
          <div className="grid grid-cols-4 gap-2">
            {quickWorkoutOptions.map(option => (
              <button
                key={option.type}
                onClick={() => onQuickWorkout(option.type, option.duration)}
                className="flex flex-col items-center p-3 rounded-xl hover:shadow-md transition-all"
                style={{ backgroundColor: BRAND_COLORS.white, border: `2px solid ${BRAND_COLORS.border}` }}
              >
                <div className={`w-10 h-10 bg-gradient-to-br ${option.color} rounded-lg flex items-center justify-center text-white mb-2`}>
                  {option.icon}
                </div>
                <p className="text-sm font-bold" style={{ color: BRAND_COLORS.textPrimary }}>{option.label}</p>
                <p className="text-xs" style={{ color: BRAND_COLORS.textSecondary }}>{option.description}</p>
              </button>
            ))}
          </div>
        </section>

        {/* Saved Programs */}
        {(savedPrograms.length > 0 || programList.length > 0) && (
          <section className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold flex items-center gap-2 overflow-hidden" style={{ color: BRAND_COLORS.textPrimary }}>
                <Star className="w-5 h-5 flex-shrink-0" style={{ color: BRAND_COLORS.primary }} />
                <span className="truncate">My Programs</span>
              </h2>
              {(programList.length > 3 || savedPrograms.length > 3) && (
                <button
                  onClick={() => setShowAllPrograms(!showAllPrograms)}
                  className="text-sm font-medium"
                  style={{ color: BRAND_COLORS.primary }}
                >
                  {showAllPrograms ? 'Show Less' : 'View All'}
                </button>
              )}
            </div>
            
            {isLoadingPrograms ? (
              <div className="flex items-center justify-center py-8">
                <div 
                  className="w-8 h-8 border-3 rounded-full animate-spin"
                  style={{ 
                    borderColor: `${BRAND_COLORS.primary}20`,
                    borderTopColor: BRAND_COLORS.primary 
                  }}
                />
              </div>
            ) : (
              <div className="space-y-3">
                {displayedPrograms.map((program: any) => {
                  // Handle both ProgramListItem and SavedProgram types
                  const programId = program.program_id || program.id;
                  const programName = program.name || program.program_name;
                  const isFavorite = program.is_favorite || program.isFavorite;
                  const durationWeeks = program.duration_weeks || program.durationWeeks;
                  const completionPercent = program.completion_percentage || program.completionPercentage || 0;
                  const programType = program.type || program.program_type || 'strength';
                  
                  return (
                    <button
                      key={programId}
                      onClick={() => onSelectProgram(programId)}
                      className="w-full flex items-center gap-4 p-4 rounded-xl hover:shadow-md transition-all text-left"
                      style={{ backgroundColor: BRAND_COLORS.white, border: `2px solid ${BRAND_COLORS.border}` }}
                    >
                      <div 
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-white flex-shrink-0"
                        style={{ background: `linear-gradient(135deg, ${BRAND_COLORS.primary}, #e55505)` }}
                      >
                        <Dumbbell className="w-6 h-6" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold truncate" style={{ color: BRAND_COLORS.textPrimary }}>
                            {programName}
                          </h3>
                          {isFavorite && (
                            <Star className="w-4 h-4 flex-shrink-0" style={{ color: BRAND_COLORS.primary, fill: BRAND_COLORS.primary }} />
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-sm" style={{ color: BRAND_COLORS.textSecondary }}>
                          <span className="capitalize">{programType}</span>
                          {durationWeeks && (
                            <>
                              <span>•</span>
                              <span>{durationWeeks} weeks</span>
                            </>
                          )}
                          <span>•</span>
                          <span>{completionPercent}% complete</span>
                        </div>
                        
                        {/* Progress bar */}
                        <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: `${BRAND_COLORS.primary}15` }}>
                          <div 
                            className="h-full rounded-full"
                            style={{ width: `${completionPercent}%`, backgroundColor: BRAND_COLORS.primary }}
                          />
                        </div>
                      </div>

                      <div className="flex-shrink-0">
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: `${BRAND_COLORS.primary}15` }}
                        >
                          <Play className="w-5 h-5" style={{ color: BRAND_COLORS.primary }} />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* Recent Activity */}
        {recentWorkouts.length > 0 && (
          <section className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold flex items-center gap-2 overflow-hidden" style={{ color: BRAND_COLORS.textPrimary }}>
                <History className="w-5 h-5 flex-shrink-0" style={{ color: BRAND_COLORS.textSecondary }} />
                <span className="truncate">Recent Activity</span>
              </h2>
              <button
                onClick={onViewHistory}
                className="text-sm font-medium"
                style={{ color: BRAND_COLORS.primary }}
              >
                View All
              </button>
            </div>
            
            <div className="space-y-2">
              {recentWorkouts.slice(0, 3).map(workout => (
                <div
                  key={workout.id}
                  className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ backgroundColor: BRAND_COLORS.white, border: `2px solid ${BRAND_COLORS.border}` }}
                >
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${BRAND_COLORS.success}15` }}
                  >
                    <Dumbbell className="w-5 h-5" style={{ color: BRAND_COLORS.success }} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate" style={{ color: BRAND_COLORS.textPrimary }}>{workout.name}</p>
                    <p className="text-sm" style={{ color: BRAND_COLORS.textSecondary }}>
                      {new Date(workout.date).toLocaleDateString('en-US', { 
                        weekday: 'short', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>

                  <div className="text-right text-sm">
                    <p className="font-medium" style={{ color: BRAND_COLORS.textPrimary }}>{workout.duration} min</p>
                    <p style={{ color: BRAND_COLORS.textSecondary }}>{workout.caloriesBurned} cal</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Action Cards */}
        <div className="grid grid-cols-2 gap-3">
          {/* Calendar */}
          <button
            onClick={() => onViewCalendar()}
            className="flex flex-col items-center p-5 rounded-xl hover:shadow-md transition-all"
            style={{ backgroundColor: BRAND_COLORS.white, border: `2px solid ${BRAND_COLORS.border}` }}
          >
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
              style={{ backgroundColor: `${BRAND_COLORS.primary}15` }}
            >
              <Calendar className="w-6 h-6" style={{ color: BRAND_COLORS.primary }} />
            </div>
            <p className="font-semibold" style={{ color: BRAND_COLORS.textPrimary }}>Calendar</p>
            <p className="text-xs" style={{ color: BRAND_COLORS.textSecondary }}>View schedule</p>
          </button>

          {/* Progress */}
          <button
            onClick={onViewHistory}
            className="flex flex-col items-center p-5 rounded-xl hover:shadow-md transition-all"
            style={{ backgroundColor: BRAND_COLORS.white, border: `2px solid ${BRAND_COLORS.border}` }}
          >
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
              style={{ backgroundColor: `${BRAND_COLORS.primary}15` }}
            >
              <TrendingUp className="w-6 h-6" style={{ color: BRAND_COLORS.primary }} />
            </div>
            <p className="font-semibold" style={{ color: BRAND_COLORS.textPrimary }}>Progress</p>
            <p className="text-xs" style={{ color: BRAND_COLORS.textSecondary }}>Track growth</p>
          </button>
        </div>

        {/* Motivational Footer */}
        <div className="mt-8 text-center">
          <div 
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full"
            style={{ backgroundColor: `${BRAND_COLORS.primary}10`, border: `1px solid ${BRAND_COLORS.primary}30` }}
          >
            <Trophy className="w-5 h-5" style={{ color: BRAND_COLORS.primary }} />
            <span className="text-sm font-medium" style={{ color: BRAND_COLORS.primary }}>
              Keep pushing! You're {weeklyWorkouts > 0 ? `${weeklyWorkouts} workout${weeklyWorkouts > 1 ? 's' : ''} in` : 'ready to start'} this week!
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedFitnessDashboard;
