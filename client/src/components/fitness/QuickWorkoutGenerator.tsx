import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Zap,
  Timer,
  Activity,
  Dumbbell,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Target,
  Flame,
  Battery,
  BatteryMedium,
  BatteryFull,
  Check,
  Loader2,
  Waves,
  MessageSquare,
  Clock,
  Settings
} from 'lucide-react';
import { 
  IntensityLevel, 
  WorkoutType, 
  QuickWorkout 
} from '../../types/fitness';
import { fitnessService, WorkoutOptions, QuickEquipment } from '../../services/fitnessService';

// Brand colors from BRAND_GUIDE.md - Desktop Web Standard
const BRAND_COLORS = {
  primary: '#fa5f06',      // WiHY Orange
  success: '#4cbb17',      // Kelly Green
  background: '#e0f2fe',   // Light Blue - Standard page background
  cardBackground: '#ffffff',
  textPrimary: '#1f2937',  // Gray-800
  textSecondary: '#6b7280', // Gray-500
  border: '#e5e7eb',       // Gray-200
  white: '#ffffff'
};

// Workout type options with icons and colors
const WORKOUT_TYPES: Array<{
  id: WorkoutType;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
}> = [
  { 
    id: 'strength', 
    name: 'Strength', 
    description: 'Build muscle & power',
    icon: Dumbbell, 
    color: '#3B82F6' 
  },
  { 
    id: 'cardio', 
    name: 'Cardio', 
    description: 'Improve heart health',
    icon: Activity, 
    color: '#EF4444' 
  },
  { 
    id: 'hiit', 
    name: 'HIIT', 
    description: 'Burn calories fast',
    icon: Zap, 
    color: '#F59E0B' 
  },
  { 
    id: 'yoga', 
    name: 'Yoga', 
    description: 'Flexibility & calm',
    icon: Waves, 
    color: '#8B5CF6' 
  },
  { 
    id: 'mobility', 
    name: 'Mobility', 
    description: 'Improve movement',
    icon: Target, 
    color: '#10B981' 
  },
  { 
    id: 'pilates', 
    name: 'Pilates', 
    description: 'Core & posture',
    icon: Activity, 
    color: '#EC4899' 
  }
];

// Intensity levels with visual indicators
const INTENSITY_LEVELS: Array<{
  id: IntensityLevel;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
}> = [
  { 
    id: 'light', 
    name: 'Light', 
    description: 'Easy pace, low impact',
    icon: Battery,
    color: '#10B981'
  },
  { 
    id: 'moderate', 
    name: 'Moderate', 
    description: 'Steady effort',
    icon: BatteryMedium,
    color: '#F59E0B'
  },
  { 
    id: 'intense', 
    name: 'Intense', 
    description: 'Max effort',
    icon: BatteryFull,
    color: '#EF4444'
  }
];

// Duration options
const DURATION_OPTIONS = [15, 30, 45, 60];

interface QuickWorkoutGeneratorProps {
  selectedEquipment: string[];
  fitnessLevel: string;
  onWorkoutGenerated: (workout: QuickWorkout) => void;
  onBack: () => void;
  onEditEquipment?: () => void;
}

const QuickWorkoutGenerator: React.FC<QuickWorkoutGeneratorProps> = ({
  selectedEquipment,
  fitnessLevel,
  onWorkoutGenerated,
  onBack,
  onEditEquipment
}) => {
  const [workoutType, setWorkoutType] = useState<WorkoutType>('strength');
  const [intensity, setIntensity] = useState<IntensityLevel>('moderate');
  const [duration, setDuration] = useState<number>(30);
  const [naturalLanguagePrompt, setNaturalLanguagePrompt] = useState('');
  const [isAdvancedMode, setIsAdvancedMode] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [workoutOptions, setWorkoutOptions] = useState<WorkoutOptions | null>(null);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);

  // Fetch available workout options
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const options = await fitnessService.getWorkoutOptions();
        if (options && options.workout_types) {
          setWorkoutOptions(options);
        }
      } catch (error) {
        console.warn('Failed to fetch workout options:', error);
      }
    };
    fetchOptions();
  }, []);

  // Calculate estimated calories
  const estimatedCalories = useMemo(() => {
    const baseRate: Partial<Record<WorkoutType, number>> = {
      strength: 5,
      cardio: 8,
      hiit: 10,
      yoga: 3,
      mobility: 2,
      pilates: 4,
      full_body: 6,
      upper_body: 5,
      lower_body: 6,
      core: 4
    };
    
    const intensityMultiplier: Record<IntensityLevel, number> = {
      light: 0.7,
      moderate: 1.0,
      intense: 1.3
    };
    
    const base = baseRate[workoutType] || 5;
    const multiplier = intensityMultiplier[intensity] || 1.0;
    
    return Math.round(base * multiplier * duration);
  }, [workoutType, intensity, duration]);

  const generateWorkout = useCallback(async () => {
    setIsGenerating(true);
    setError(null);
    
    try {
      const mappedEquipment: QuickEquipment[] = selectedEquipment.length > 0 
        ? selectedEquipment.map(eq => {
            if (eq.includes('dumbbell')) return 'dumbbells';
            if (eq.includes('band') || eq.includes('resistance')) return 'bands';
            if (eq.includes('kettlebell')) return 'kettlebell';
            return 'none';
          }).filter((v, i, a) => a.indexOf(v) === i) as QuickEquipment[]
        : ['none'];
      
      const requestData = {
        workout_type: workoutType,
        intensity,
        duration,
        equipment: mappedEquipment,
        mode: 'quick' as const
      };
      
      const response = await fitnessService.generateQuickWorkout(requestData);
      
      if (response && response.workout_id) {
        onWorkoutGenerated(response);
      } else {
        setError('Failed to generate workout. Please try again.');
      }
    } catch (err) {
      console.error('Error generating workout:', err);
      setError('Unable to generate workout. Please check your connection and try again.');
    } finally {
      setIsGenerating(false);
    }
  }, [workoutType, intensity, duration, selectedEquipment, onWorkoutGenerated]);

  const selectedWorkoutType = WORKOUT_TYPES.find(t => t.id === workoutType)!;
  const selectedIntensity = INTENSITY_LEVELS.find(i => i.id === intensity)!;

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${BRAND_COLORS.primary}15` }}
            >
              <Sparkles className="w-5 h-5" style={{ color: BRAND_COLORS.primary }} />
            </div>
            <div>
              <h2 className="text-lg font-bold" style={{ color: BRAND_COLORS.textPrimary }}>
                Quick Workout Generator
              </h2>
              <p className="text-sm" style={{ color: BRAND_COLORS.textSecondary }}>
                Configure your workout preferences
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Desktop Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Workout Configuration */}
          <div className="space-y-6">
            {/* Workout Type Selection */}
            <div>
              <label className="block text-sm font-semibold mb-3" style={{ color: BRAND_COLORS.textPrimary }}>
                Workout Type
              </label>
              
              <div className="relative">
                <button
                  onClick={() => setShowTypeDropdown(!showTypeDropdown)}
                  className="w-full flex items-center justify-between p-3 rounded-xl transition-all"
                  style={{ 
                    backgroundColor: BRAND_COLORS.white, 
                    border: `2px solid ${showTypeDropdown ? BRAND_COLORS.primary : BRAND_COLORS.border}` 
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-9 h-9 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${selectedWorkoutType.color}15` }}
                    >
                      <selectedWorkoutType.icon className="w-4 h-4" style={{ color: selectedWorkoutType.color }} />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-sm" style={{ color: BRAND_COLORS.textPrimary }}>
                        {selectedWorkoutType.name}
                      </p>
                      <p className="text-xs" style={{ color: BRAND_COLORS.textSecondary }}>
                        {selectedWorkoutType.description}
                      </p>
                    </div>
                  </div>
                  {showTypeDropdown ? (
                    <ChevronUp className="w-5 h-5" style={{ color: BRAND_COLORS.textSecondary }} />
                  ) : (
                    <ChevronDown className="w-5 h-5" style={{ color: BRAND_COLORS.textSecondary }} />
                  )}
                </button>
                
                {/* Dropdown */}
                {showTypeDropdown && (
                  <div 
                    className="absolute top-full left-0 right-0 mt-2 py-2 rounded-xl shadow-lg z-10 max-h-72 overflow-y-auto"
                    style={{ backgroundColor: BRAND_COLORS.white, border: `2px solid ${BRAND_COLORS.border}` }}
                  >
                    {WORKOUT_TYPES.map(type => {
                      const Icon = type.icon;
                      const isSelected = type.id === workoutType;
                      
                      return (
                        <button
                          key={type.id}
                          onClick={() => {
                            setWorkoutType(type.id);
                            setShowTypeDropdown(false);
                          }}
                          className={`w-full flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 transition-all ${
                            isSelected ? 'bg-gray-50' : ''
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-8 h-8 rounded-lg flex items-center justify-center"
                              style={{ backgroundColor: `${type.color}15` }}
                            >
                              <Icon className="w-4 h-4" style={{ color: type.color }} />
                            </div>
                            <div className="text-left">
                              <p className="font-medium text-sm" style={{ color: BRAND_COLORS.textPrimary }}>
                                {type.name}
                              </p>
                              <p className="text-xs" style={{ color: BRAND_COLORS.textSecondary }}>
                                {type.description}
                              </p>
                            </div>
                          </div>
                          {isSelected && (
                            <Check className="w-4 h-4" style={{ color: BRAND_COLORS.primary }} />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Intensity Selection */}
            <div>
              <label className="block text-sm font-semibold mb-3" style={{ color: BRAND_COLORS.textPrimary }}>
                Intensity Level
              </label>
              
              <div className="grid grid-cols-3 gap-3">
                {INTENSITY_LEVELS.map(level => {
                  const Icon = level.icon;
                  const isSelected = level.id === intensity;
                  
                  return (
                    <button
                      key={level.id}
                      onClick={() => setIntensity(level.id)}
                      className={`relative p-3 rounded-xl transition-all ${
                        isSelected ? 'shadow-md' : 'hover:shadow-sm'
                      }`}
                      style={{
                        backgroundColor: isSelected ? `${level.color}10` : BRAND_COLORS.white,
                        border: `2px solid ${isSelected ? level.color : BRAND_COLORS.border}`
                      }}
                    >
                      {isSelected && (
                        <div 
                          className="absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: level.color }}
                        >
                          <Check className="w-2.5 h-2.5 text-white" />
                        </div>
                      )}
                      <div className="flex flex-col items-center">
                        <Icon 
                          className="w-5 h-5 mb-1.5" 
                          style={{ color: isSelected ? level.color : BRAND_COLORS.textSecondary }} 
                        />
                        <p 
                          className="font-semibold text-sm"
                          style={{ color: isSelected ? level.color : BRAND_COLORS.textPrimary }}
                        >
                          {level.name}
                        </p>
                        <p 
                          className="text-[10px] mt-0.5 text-center"
                          style={{ color: BRAND_COLORS.textSecondary }}
                        >
                          {level.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Duration Selection */}
            <div>
              <label className="block text-sm font-semibold mb-3" style={{ color: BRAND_COLORS.textPrimary }}>
                <div className="flex items-center gap-2">
                  <Timer className="w-4 h-4" style={{ color: BRAND_COLORS.primary }} />
                  Duration
                </div>
              </label>
              
              <div className="grid grid-cols-4 gap-2">
                {DURATION_OPTIONS.map(mins => {
                  const isSelected = mins === duration;
                  
                  return (
                    <button
                      key={mins}
                      onClick={() => setDuration(mins)}
                      className={`relative py-3 px-2 rounded-xl transition-all ${
                        isSelected ? 'shadow-md' : 'hover:shadow-sm'
                      }`}
                      style={{
                        backgroundColor: isSelected ? `${BRAND_COLORS.primary}10` : BRAND_COLORS.white,
                        border: `2px solid ${isSelected ? BRAND_COLORS.primary : BRAND_COLORS.border}`
                      }}
                    >
                      <div className="flex flex-col items-center">
                        <p 
                          className="font-bold text-lg"
                          style={{ color: isSelected ? BRAND_COLORS.primary : BRAND_COLORS.textPrimary }}
                        >
                          {mins}
                        </p>
                        <p 
                          className="text-xs"
                          style={{ color: BRAND_COLORS.textSecondary }}
                        >
                          min
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Advanced Mode Toggle */}
            <div>
              <button
                onClick={() => setIsAdvancedMode(!isAdvancedMode)}
                className="flex items-center gap-2 text-sm font-medium"
                style={{ color: BRAND_COLORS.primary }}
              >
                <Settings className="w-4 h-4" />
                {isAdvancedMode ? 'Hide' : 'Show'} Natural Language Input
                {isAdvancedMode ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              
              {isAdvancedMode && (
                <div className="mt-3">
                  <textarea
                    value={naturalLanguagePrompt}
                    onChange={(e) => setNaturalLanguagePrompt(e.target.value)}
                    placeholder="Describe your ideal workout... e.g., 'I want to focus on my upper body and core, with some cardio intervals'"
                    className="w-full h-20 p-3 text-sm rounded-lg border-2 resize-none focus:outline-none transition-all"
                    style={{ 
                      borderColor: BRAND_COLORS.border,
                      color: BRAND_COLORS.textPrimary
                    }}
                  />
                  <p className="text-xs mt-1" style={{ color: BRAND_COLORS.textSecondary }}>
                    AI will incorporate your preferences into the workout
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Summary & Generate */}
          <div className="space-y-4">
            {/* Equipment Summary */}
            <div 
              className="p-4 rounded-xl"
              style={{ backgroundColor: '#f9fafb', border: `1px solid ${BRAND_COLORS.border}` }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-9 h-9 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${BRAND_COLORS.success}15` }}
                  >
                    <Dumbbell className="w-4 h-4" style={{ color: BRAND_COLORS.success }} />
                  </div>
                  <div>
                    <p className="font-medium text-sm" style={{ color: BRAND_COLORS.textPrimary }}>
                      Equipment Selected
                    </p>
                    <p className="text-xs" style={{ color: BRAND_COLORS.textSecondary }}>
                      {selectedEquipment.length === 0 
                        ? 'Bodyweight only'
                        : `${selectedEquipment.length} items`
                      }
                    </p>
                  </div>
                </div>
                {onEditEquipment && (
                  <button
                    onClick={onEditEquipment}
                    className="text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-all"
                    style={{ color: BRAND_COLORS.primary }}
                  >
                    Edit
                  </button>
                )}
              </div>
            </div>

            {/* Workout Preview Summary */}
            <div 
              className="p-4 rounded-xl"
              style={{ backgroundColor: `${BRAND_COLORS.primary}05`, border: `1px solid ${BRAND_COLORS.primary}20` }}
            >
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-4 h-4" style={{ color: BRAND_COLORS.primary }} />
                <p className="font-semibold text-sm" style={{ color: BRAND_COLORS.primary }}>
                  Workout Preview
                </p>
              </div>
              
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center p-3 bg-white rounded-lg">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Clock className="w-4 h-4" style={{ color: BRAND_COLORS.textSecondary }} />
                  </div>
                  <p className="font-bold text-lg" style={{ color: BRAND_COLORS.textPrimary }}>{duration}</p>
                  <p className="text-xs" style={{ color: BRAND_COLORS.textSecondary }}>minutes</p>
                </div>
                <div className="text-center p-3 bg-white rounded-lg">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Flame className="w-4 h-4" style={{ color: BRAND_COLORS.textSecondary }} />
                  </div>
                  <p className="font-bold text-lg" style={{ color: BRAND_COLORS.textPrimary }}>~{estimatedCalories}</p>
                  <p className="text-xs" style={{ color: BRAND_COLORS.textSecondary }}>calories</p>
                </div>
                <div className="text-center p-3 bg-white rounded-lg">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <selectedIntensity.icon className="w-4 h-4" style={{ color: selectedIntensity.color }} />
                  </div>
                  <p className="font-bold text-lg" style={{ color: selectedIntensity.color }}>{selectedIntensity.name}</p>
                  <p className="text-xs" style={{ color: BRAND_COLORS.textSecondary }}>intensity</p>
                </div>
              </div>

              {/* Workout Type Badge */}
              <div className="flex items-center gap-2 p-2 bg-white rounded-lg">
                <div 
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${selectedWorkoutType.color}15` }}
                >
                  <selectedWorkoutType.icon className="w-3.5 h-3.5" style={{ color: selectedWorkoutType.color }} />
                </div>
                <span className="text-sm font-medium" style={{ color: BRAND_COLORS.textPrimary }}>
                  {selectedWorkoutType.name} Workout
                </span>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div 
                className="p-3 rounded-xl flex items-start gap-3"
                style={{ backgroundColor: '#FEE2E2', border: '1px solid #FECACA' }}
              >
                <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">!</span>
                </div>
                <p className="text-sm" style={{ color: '#DC2626' }}>{error}</p>
              </div>
            )}

            {/* Generate Button */}
            <button
              onClick={generateWorkout}
              disabled={isGenerating}
              className={`w-full py-3.5 rounded-xl font-semibold text-base transition-all flex items-center justify-center gap-2 ${
                isGenerating ? 'opacity-75 cursor-not-allowed' : 'hover:opacity-90'
              }`}
              style={{
                backgroundColor: BRAND_COLORS.primary,
                color: BRAND_COLORS.white,
                boxShadow: `0 4px 12px ${BRAND_COLORS.primary}30`
              }}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Generating Your Workout...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>Generate Workout</span>
                </>
              )}
            </button>
            
            <p className="text-center text-xs" style={{ color: BRAND_COLORS.textSecondary }}>
              AI-powered workout tailored to your preferences
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickWorkoutGenerator;
