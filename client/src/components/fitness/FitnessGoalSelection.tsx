import React, { useState } from 'react';
import { 
  Dumbbell, 
  Target, 
  Clock, 
  Sparkles, 
  ChevronDown, 
  Check,
  Zap,
  Heart,
  Flame,
  Activity,
  User,
  Send,
  Move,
  Footprints,
  CircleDot,
  Layers,
  Timer,
  StretchHorizontal,
  Battery,
  BatteryMedium,
  BatteryFull
} from 'lucide-react';
import { 
  FitnessLevel, 
  BodyPart, 
  Equipment, 
  QuickGoal,
  BodyPartOption,
  EquipmentOption,
  IntensityLevel
} from '../../types/fitness';

// Brand colors from BRAND_GUIDE.md - Desktop Web Standard
const BRAND_COLORS = {
  primary: '#fa5f06',      // WiHY Orange
  success: '#4cbb17',      // Kelly Green
  background: '#e0f2fe',   // Light Blue - Standard page background
  cardBackground: '#ffffff', // White for cards
  textPrimary: '#1f2937',  // Gray-800
  textSecondary: '#6b7280', // Gray-500
  border: '#e5e7eb',       // Gray-200 (standard border)
  borderStrong: '#d1d5db', // Gray-300 (stronger border)
  white: '#ffffff'
};

interface FitnessGoalSelectionProps {
  fitnessLevel: FitnessLevel;
  onGenerateWorkout: (config: WorkoutConfig) => void;
  onChangeFitnessLevel: () => void;
  targetUserId?: string;
  isGenerating?: boolean;
}

export interface WorkoutConfig {
  description: string;
  difficulty: FitnessLevel;
  duration: number;
  equipment: Equipment[];
  targetMuscles: BodyPart[];
  daysPerWeek?: number;
  goalText?: string;
  intensity?: IntensityLevel;
}

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
    description: 'Easy pace',
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

// Icon components for body parts
const BodyPartIcon: React.FC<{ id: BodyPart; className?: string }> = ({ id, className = "w-5 h-5" }) => {
  switch (id) {
    case 'chest': return <Dumbbell className={className} />;
    case 'back': return <Layers className={className} />;
    case 'shoulders': return <Move className={className} />;
    case 'arms': return <Dumbbell className={className} />;
    case 'legs': return <Footprints className={className} />;
    case 'core': return <Flame className={className} />;
    case 'glutes': return <Target className={className} />;
    case 'calves': return <Footprints className={className} />;
    default: return <Target className={className} />;
  }
};

// Icon components for quick goals
const QuickGoalIcon: React.FC<{ id: string; className?: string }> = ({ id, className = "w-6 h-6" }) => {
  switch (id) {
    case 'full-body': return <Dumbbell className={className} />;
    case 'leg-day': return <Footprints className={className} />;
    case 'upper-body': return <Move className={className} />;
    case 'core-blast': return <Flame className={className} />;
    case 'cardio': return <Heart className={className} />;
    case 'hiit': return <Zap className={className} />;
    default: return <Target className={className} />;
  }
};

// Icon components for equipment
const EquipmentIcon: React.FC<{ id: Equipment; className?: string }> = ({ id, className = "w-5 h-5" }) => {
  switch (id) {
    case 'dumbbells': return <Dumbbell className={className} />;
    case 'barbell': return <StretchHorizontal className={className} />;
    case 'resistance_bands': return <Layers className={className} />;
    case 'bodyweight': return <User className={className} />;
    case 'cable_machine': return <Activity className={className} />;
    case 'kettlebell': return <CircleDot className={className} />;
    default: return <Dumbbell className={className} />;
  }
};

const bodyParts: (BodyPartOption & { icon: BodyPart })[] = [
  { id: 'chest', label: 'Chest', emoji: '', icon: 'chest' },
  { id: 'back', label: 'Back', emoji: '', icon: 'back' },
  { id: 'shoulders', label: 'Shoulders', emoji: '', icon: 'shoulders' },
  { id: 'arms', label: 'Arms', emoji: '', icon: 'arms' },
  { id: 'legs', label: 'Legs', emoji: '', icon: 'legs' },
  { id: 'core', label: 'Core', emoji: '', icon: 'core' },
  { id: 'glutes', label: 'Glutes', emoji: '', icon: 'glutes' },
  { id: 'calves', label: 'Calves', emoji: '', icon: 'calves' }
];

const equipmentOptions: (EquipmentOption & { icon: Equipment })[] = [
  { id: 'dumbbells', label: 'Dumbbells', emoji: '', icon: 'dumbbells' },
  { id: 'barbell', label: 'Barbell', emoji: '', icon: 'barbell' },
  { id: 'resistance_bands', label: 'Bands', emoji: '', icon: 'resistance_bands' },
  { id: 'bodyweight', label: 'Bodyweight', emoji: '', icon: 'bodyweight' },
  { id: 'cable_machine', label: 'Cable', emoji: '', icon: 'cable_machine' },
  { id: 'kettlebell', label: 'Kettlebell', emoji: '', icon: 'kettlebell' }
];

const quickGoals: (QuickGoal & { iconId: string })[] = [
  { id: 'full-body', label: 'Full Body', emoji: '', iconId: 'full-body', bodyParts: ['chest', 'back', 'legs', 'shoulders'], duration: 45, type: 'strength' },
  { id: 'leg-day', label: 'Leg Day', emoji: '', iconId: 'leg-day', bodyParts: ['legs', 'glutes', 'calves'], duration: 40, type: 'strength' },
  { id: 'upper-body', label: 'Upper Body', emoji: '', iconId: 'upper-body', bodyParts: ['chest', 'back', 'shoulders', 'arms'], duration: 35, type: 'strength' },
  { id: 'core-blast', label: 'Core Blast', emoji: '', iconId: 'core-blast', bodyParts: ['core'], duration: 20, type: 'strength' },
  { id: 'cardio', label: 'Cardio', emoji: '', iconId: 'cardio', bodyParts: [], duration: 30, type: 'cardio' },
  { id: 'hiit', label: 'HIIT', emoji: '', iconId: 'hiit', bodyParts: [], duration: 25, type: 'hiit' }
];

const durationOptions = [
  { value: 15, label: '15 min', description: 'Quick session' },
  { value: 30, label: '30 min', description: 'Balanced workout' },
  { value: 45, label: '45 min', description: 'Complete session' },
  { value: 60, label: '60 min', description: 'Full training' }
];

const getLevelColor = (level: FitnessLevel): string => {
  switch (level) {
    case 'beginner': return BRAND_COLORS.success;
    case 'intermediate': return BRAND_COLORS.primary;
    case 'advanced': return '#DC2626';
    default: return BRAND_COLORS.textSecondary;
  }
};

const getLevelIcon = (level: FitnessLevel): React.ReactNode => {
  const iconClass = "w-4 h-4";
  switch (level) {
    case 'beginner': return <Activity className={iconClass} />;
    case 'intermediate': return <Dumbbell className={iconClass} />;
    case 'advanced': return <Flame className={iconClass} />;
    default: return <Dumbbell className={iconClass} />;
  }
};

const FitnessGoalSelection: React.FC<FitnessGoalSelectionProps> = ({
  fitnessLevel,
  onGenerateWorkout,
  onChangeFitnessLevel,
  targetUserId,
  isGenerating = false
}) => {
  const [selectedBodyParts, setSelectedBodyParts] = useState<BodyPart[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment[]>([]);
  const [duration, setDuration] = useState<number>(30);
  const [intensity, setIntensity] = useState<IntensityLevel>('moderate');
  const [goalText, setGoalText] = useState<string>('');
  const [activeQuickGoal, setActiveQuickGoal] = useState<string | null>(null);

  const toggleBodyPart = (bodyPartId: BodyPart) => {
    setActiveQuickGoal(null);
    setSelectedBodyParts(prev =>
      prev.includes(bodyPartId)
        ? prev.filter(bp => bp !== bodyPartId)
        : [...prev, bodyPartId]
    );
  };

  const toggleEquipment = (equipmentId: Equipment) => {
    setSelectedEquipment(prev =>
      prev.includes(equipmentId)
        ? prev.filter(eq => eq !== equipmentId)
        : [...prev, equipmentId]
    );
  };

  const selectQuickGoal = (goal: QuickGoal) => {
    setActiveQuickGoal(goal.id);
    setSelectedBodyParts(goal.bodyParts);
    setDuration(goal.duration);
  };

  const handleGenerateWorkout = () => {
    // Build natural language description
    let description = goalText.trim();
    
    if (!description && selectedBodyParts.length > 0) {
      description = `I want to focus on ${selectedBodyParts.join(', ')}`;
      if (selectedEquipment.length > 0) {
        description += ` using ${selectedEquipment.join(', ')}`;
      }
    }

    if (!description) {
      description = "Give me a full body workout";
    }

    const config: WorkoutConfig = {
      description,
      difficulty: fitnessLevel,
      duration,
      equipment: selectedEquipment,
      targetMuscles: selectedBodyParts,
      daysPerWeek: 3,
      goalText: goalText.trim() || undefined,
      intensity
    };

    onGenerateWorkout(config);
  };

  const canGenerate = selectedBodyParts.length > 0 || goalText.trim().length > 0 || activeQuickGoal;

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
              <Target className="w-5 h-5" style={{ color: BRAND_COLORS.primary }} />
            </div>
            <div>
              <h2 className="text-lg font-bold" style={{ color: BRAND_COLORS.textPrimary }}>
                What's Your Fitness Goal Today?
              </h2>
              <p className="text-sm" style={{ color: BRAND_COLORS.textSecondary }}>
                Select goals, body parts, or describe your ideal workout
              </p>
            </div>
          </div>
          
          {/* Fitness Level Badge */}
          <button
            onClick={onChangeFitnessLevel}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 transition-all"
            style={{ border: `1px solid ${BRAND_COLORS.border}` }}
          >
            <span 
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: getLevelColor(fitnessLevel) }}
            />
            <span className="flex items-center gap-1 text-sm font-medium" style={{ color: getLevelColor(fitnessLevel) }}>
              {getLevelIcon(fitnessLevel)}
              {fitnessLevel.charAt(0).toUpperCase() + fitnessLevel.slice(1)}
            </span>
            <ChevronDown className="w-4 h-4" style={{ color: BRAND_COLORS.textSecondary }} />
          </button>
        </div>
      </div>

      <div className="p-6">
        {/* Quick Goals */}
        <section className="mb-8">
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2 overflow-hidden" style={{ color: BRAND_COLORS.textPrimary }}>
            <Zap className="w-4 h-4 flex-shrink-0" style={{ color: BRAND_COLORS.primary }} />
            <span className="truncate">Quick Goals</span>
          </h2>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {quickGoals.map(goal => {
              const isSelected = activeQuickGoal === goal.id;
              return (
                <button
                  key={goal.id}
                  onClick={() => selectQuickGoal(goal)}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                    isSelected ? 'shadow-lg' : 'hover:shadow-md'
                  }`}
                  style={{
                    borderColor: isSelected ? BRAND_COLORS.primary : BRAND_COLORS.border,
                    backgroundColor: isSelected ? `${BRAND_COLORS.primary}08` : BRAND_COLORS.white
                  }}
                >
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center mb-2"
                    style={{ 
                      backgroundColor: isSelected ? `${BRAND_COLORS.primary}15` : `${BRAND_COLORS.primary}08`
                    }}
                  >
                    <QuickGoalIcon 
                      id={goal.id} 
                      className="w-5 h-5"
                    />
                  </div>
                  <span 
                    className="text-xs font-medium text-center"
                    style={{ color: isSelected ? BRAND_COLORS.primary : BRAND_COLORS.textPrimary }}
                  >
                    {goal.label}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Body Part Selector */}
        <section className="mb-8">
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2 overflow-hidden" style={{ color: BRAND_COLORS.textPrimary }}>
            <Target className="w-4 h-4 flex-shrink-0" style={{ color: BRAND_COLORS.primary }} />
            <span className="truncate">Target Specific Body Parts</span>
          </h2>
          <div className="grid grid-cols-4 gap-3">
            {bodyParts.map(part => {
              const isSelected = selectedBodyParts.includes(part.id);
              return (
                <button
                  key={part.id}
                  onClick={() => toggleBodyPart(part.id)}
                  className={`relative flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                    isSelected ? 'shadow-md' : 'hover:shadow-sm'
                  }`}
                  style={{
                    borderColor: isSelected ? BRAND_COLORS.primary : BRAND_COLORS.border,
                    backgroundColor: isSelected ? `${BRAND_COLORS.primary}08` : BRAND_COLORS.white
                  }}
                >
                  {isSelected && (
                    <div 
                      className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: BRAND_COLORS.primary }}
                    >
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                  <div 
                    className="w-9 h-9 rounded-lg flex items-center justify-center mb-2"
                    style={{ 
                      backgroundColor: isSelected ? `${BRAND_COLORS.primary}15` : `${BRAND_COLORS.primary}08`
                    }}
                  >
                    <BodyPartIcon 
                      id={part.id}
                      className="w-4 h-4"
                    />
                  </div>
                  <span 
                    className="text-xs font-medium"
                    style={{ color: isSelected ? BRAND_COLORS.primary : BRAND_COLORS.textPrimary }}
                  >
                    {part.label}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Equipment Selector */}
        <section className="mb-8">
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2 overflow-hidden" style={{ color: BRAND_COLORS.textPrimary }}>
            <Dumbbell className="w-4 h-4 flex-shrink-0" style={{ color: BRAND_COLORS.textSecondary }} />
            <span className="truncate">Equipment Available</span>
          </h2>
          <div className="flex flex-wrap gap-2">
            {equipmentOptions.map(eq => {
              const isSelected = selectedEquipment.includes(eq.id);
              return (
                <button
                  key={eq.id}
                  onClick={() => toggleEquipment(eq.id)}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 transition-all ${
                    isSelected ? 'shadow-sm' : 'hover:shadow-sm'
                  }`}
                  style={{
                    borderColor: isSelected ? BRAND_COLORS.primary : BRAND_COLORS.border,
                    backgroundColor: isSelected ? `${BRAND_COLORS.primary}08` : BRAND_COLORS.white,
                    color: isSelected ? BRAND_COLORS.primary : BRAND_COLORS.textPrimary
                  }}
                >
                  {isSelected ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <EquipmentIcon id={eq.id} className="w-4 h-4" />
                  )}
                  <span className="text-sm font-medium">{eq.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Natural Language Input */}
        <section className="mb-8">
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2 overflow-hidden" style={{ color: BRAND_COLORS.textPrimary }}>
            <Sparkles className="w-4 h-4 flex-shrink-0" style={{ color: BRAND_COLORS.primary }} />
            <span className="truncate">Or Describe Your Goal</span>
          </h2>
          <div className="relative">
            <textarea
              value={goalText}
              onChange={(e) => {
                setGoalText(e.target.value);
                if (e.target.value.trim()) {
                  setActiveQuickGoal(null);
                }
              }}
              placeholder="e.g., I want to build chest and triceps with dumbbells"
              className="w-full p-4 pr-12 rounded-xl border-2 outline-none resize-none transition-all"
              style={{ 
                borderColor: goalText.trim() ? BRAND_COLORS.primary : BRAND_COLORS.border,
                backgroundColor: BRAND_COLORS.white
              }}
              onFocus={(e) => {
                e.target.style.borderColor = BRAND_COLORS.primary;
                e.target.style.boxShadow = `0 0 0 3px ${BRAND_COLORS.primary}20`;
              }}
              onBlur={(e) => {
                if (!goalText.trim()) {
                  e.target.style.borderColor = BRAND_COLORS.border;
                }
                e.target.style.boxShadow = 'none';
              }}
              rows={2}
            />
            {goalText.trim() && (
              <div className="absolute right-3 bottom-3">
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: BRAND_COLORS.primary }}
                >
                  <Send className="w-4 h-4 text-white" />
                </div>
              </div>
            )}
          </div>
          <p className="mt-2 text-xs flex items-center gap-1.5" style={{ color: BRAND_COLORS.textSecondary }}>
            <Sparkles className="w-3 h-3" />
            Describe your workout in natural language and our AI will create the perfect routine
          </p>
        </section>

        {/* Intensity Level Selector */}
        <section className="mb-8">
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2 overflow-hidden" style={{ color: BRAND_COLORS.textPrimary }}>
            <Flame className="w-4 h-4 flex-shrink-0" style={{ color: '#F59E0B' }} />
            <span className="truncate">Workout Intensity</span>
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {INTENSITY_LEVELS.map(level => {
              const Icon = level.icon;
              const isSelected = level.id === intensity;
              
              return (
                <button
                  key={level.id}
                  onClick={() => setIntensity(level.id)}
                  className={`relative flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                    isSelected ? 'shadow-md' : 'hover:shadow-sm'
                  }`}
                  style={{
                    borderColor: isSelected ? level.color : BRAND_COLORS.border,
                    backgroundColor: isSelected ? `${level.color}10` : BRAND_COLORS.white
                  }}
                >
                  {isSelected && (
                    <div 
                      className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: level.color }}
                    >
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                  <Icon 
                    className="w-6 h-6 mb-2"
                    style={{ color: isSelected ? level.color : BRAND_COLORS.textSecondary }}
                  />
                  <span 
                    className="text-sm font-semibold"
                    style={{ color: isSelected ? level.color : BRAND_COLORS.textPrimary }}
                  >
                    {level.name}
                  </span>
                  <span 
                    className="text-[10px] mt-0.5"
                    style={{ color: BRAND_COLORS.textSecondary }}
                  >
                    {level.description}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Duration Selector */}
        <section className="mb-8">
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2 overflow-hidden" style={{ color: BRAND_COLORS.textPrimary }}>
            <Clock className="w-4 h-4 flex-shrink-0" style={{ color: BRAND_COLORS.success }} />
            <span className="truncate">Workout Duration</span>
          </h2>
          <div className="grid grid-cols-4 gap-3">
            {durationOptions.map(option => {
              const isSelected = duration === option.value;
              return (
                <button
                  key={option.value}
                  onClick={() => setDuration(option.value)}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                    isSelected ? 'shadow-md' : 'hover:shadow-sm'
                  }`}
                  style={{
                    borderColor: isSelected ? BRAND_COLORS.success : BRAND_COLORS.border,
                    backgroundColor: isSelected ? `${BRAND_COLORS.success}08` : BRAND_COLORS.white
                  }}
                >
                  <Timer 
                    className="w-5 h-5 mb-1"
                    style={{ color: isSelected ? BRAND_COLORS.success : BRAND_COLORS.textSecondary }}
                  />
                  <span 
                    className="text-base font-bold"
                    style={{ color: isSelected ? BRAND_COLORS.success : BRAND_COLORS.textPrimary }}
                  >
                    {option.label}
                  </span>
                </button>
              );
            })}
          </div>
          {duration === 15 && (
            <div 
              className="mt-3 text-xs px-4 py-3 rounded-xl flex items-center gap-2"
              style={{ backgroundColor: `${BRAND_COLORS.success}10`, color: BRAND_COLORS.success }}
            >
              <Zap className="w-4 h-4" />
              <span className="font-medium">Perfect for busy days - 3-4 focused exercises</span>
            </div>
          )}
        </section>

        {/* Selection Summary & Generate Button */}
        <div 
          className="mt-6 p-4 rounded-xl flex items-center justify-between"
          style={{ backgroundColor: '#f9fafb', border: `1px solid ${BRAND_COLORS.border}` }}
        >
          <div className="flex flex-wrap items-center gap-2">
            {selectedBodyParts.length > 0 || selectedEquipment.length > 0 ? (
              <>
                {selectedBodyParts.map(part => {
                  const partData = bodyParts.find(p => p.id === part);
                  return (
                    <span 
                      key={part}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                      style={{ backgroundColor: `${BRAND_COLORS.primary}15`, color: BRAND_COLORS.primary }}
                    >
                      <BodyPartIcon id={part} className="w-3 h-3" />
                      {partData?.label}
                    </span>
                  );
                })}
                {selectedEquipment.slice(0, 3).map(eq => {
                  const eqData = equipmentOptions.find(e => e.id === eq);
                  return (
                    <span 
                      key={eq}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                      style={{ backgroundColor: `${BRAND_COLORS.primary}10`, color: BRAND_COLORS.textPrimary }}
                    >
                      <EquipmentIcon id={eq} className="w-3 h-3" />
                      {eqData?.label}
                    </span>
                  );
                })}
                {selectedEquipment.length > 3 && (
                  <span className="text-xs" style={{ color: BRAND_COLORS.textSecondary }}>+{selectedEquipment.length - 3} more</span>
                )}
                <span 
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
                  style={{ backgroundColor: `${BRAND_COLORS.success}15`, color: BRAND_COLORS.success }}
                >
                  <Clock className="w-3 h-3" /> 
                  {duration} min
                </span>
              </>
            ) : (
              <span className="text-sm" style={{ color: BRAND_COLORS.textSecondary }}>
                Select body parts, equipment, or describe your goal
              </span>
            )}
          </div>
          
          <button
            onClick={handleGenerateWorkout}
            disabled={!canGenerate || isGenerating}
            className={`px-6 py-2.5 rounded-xl font-semibold transition-all flex items-center gap-2 ${!canGenerate || isGenerating ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'}`}
            style={{
              backgroundColor: BRAND_COLORS.primary,
              color: BRAND_COLORS.white,
              boxShadow: canGenerate && !isGenerating ? `0 4px 12px ${BRAND_COLORS.primary}30` : 'none'
            }}
          >
            {isGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Workout</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FitnessGoalSelection;
