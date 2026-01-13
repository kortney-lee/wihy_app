import React, { useState } from 'react';
import { Sprout, Dumbbell, Flame, Check, ChevronRight, Settings } from 'lucide-react';
import { FitnessLevel, FitnessLevelOption } from '../../types/fitness';

interface FitnessLevelSelectionProps {
  onSelectLevel: (level: FitnessLevel) => void;
  currentLevel?: FitnessLevel;
  isOnboarding?: boolean;
  targetUserId?: string;
}

const fitnessLevels: FitnessLevelOption[] = [
  {
    id: 'beginner',
    title: 'BEGINNER',
    emoji: '🌱',
    description: 'New to fitness or returning after a long break',
    features: [
      'Lower reps (8-10)',
      'Lighter weights',
      'More rest time',
      'Form-focused exercises'
    ],
    color: '#10B981',
    repsRange: '8-10',
    restTime: '90-120 seconds'
  },
  {
    id: 'intermediate',
    title: 'INTERMEDIATE',
    emoji: '💪',
    description: 'Comfortable with basic exercises and techniques',
    features: [
      'Moderate reps (10-12)',
      'Progressive weight',
      'Balanced rest periods',
      'Mixed exercises'
    ],
    color: '#2563EB',
    repsRange: '10-12',
    restTime: '60-90 seconds'
  },
  {
    id: 'advanced',
    title: 'ADVANCED',
    emoji: '🔥',
    description: 'Experienced lifter with strong technique',
    features: [
      'Higher reps (12-15)',
      'Heavy weights',
      'Shorter rest periods',
      'Complex movements'
    ],
    color: '#DC2626',
    repsRange: '12-15',
    restTime: '45-60 seconds'
  }
];

const getLevelIcon = (levelId: FitnessLevel, isSelected: boolean) => {
  const iconClass = `w-8 h-8 ${isSelected ? 'text-white' : 'text-current'}`;
  
  switch (levelId) {
    case 'beginner':
      return <Sprout className={iconClass} />;
    case 'intermediate':
      return <Dumbbell className={iconClass} />;
    case 'advanced':
      return <Flame className={iconClass} />;
    default:
      return null;
  }
};

const FitnessLevelSelection: React.FC<FitnessLevelSelectionProps> = ({
  onSelectLevel,
  currentLevel,
  isOnboarding = true,
  targetUserId
}) => {
  const [selectedLevel, setSelectedLevel] = useState<FitnessLevel | null>(currentLevel || null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSelectLevel = async (level: FitnessLevel) => {
    setSelectedLevel(level);
    setIsSubmitting(true);

    try {
      // Save user's fitness level to backend
      const preferenceBody: any = { fitnessLevel: level };
      
      // If setting level for another user (trainer scenario), include userId
      if (targetUserId) {
        preferenceBody.userId = targetUserId;
      }
      
      // API call would go here
      // await fetch('https://services.wihy.ai/api/users/preferences', {
      //   method: 'PUT',
      //   headers: { 
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${authToken}`
      //   },
      //   body: JSON.stringify(preferenceBody)
      // });

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300));

      // Navigate to goal selection
      onSelectLevel(level);
    } catch (error) {
      console.error('Failed to save fitness level:', error);
      // Still navigate even if save fails
      onSelectLevel(level);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-4 sm:p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl mb-4 shadow-lg">
            <Dumbbell className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            What's Your Fitness Level?
          </h1>
          <p className="text-gray-600 max-w-md mx-auto">
            Select your current fitness level to get appropriate exercises and reps
          </p>
        </div>

        {/* Level Cards */}
        <div className="space-y-4">
          {fitnessLevels.map((level) => {
            const isSelected = selectedLevel === level.id;
            
            return (
              <button
                key={level.id}
                onClick={() => handleSelectLevel(level.id)}
                disabled={isSubmitting}
                className={`w-full text-left rounded-2xl p-5 sm:p-6 transition-all duration-300 border-2 ${
                  isSelected
                    ? 'bg-white border-blue-500 shadow-lg shadow-blue-500/20 ring-2 ring-blue-500/20'
                    : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-md'
                } ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                style={{
                  borderLeftWidth: '4px',
                  borderLeftColor: isSelected ? level.color : '#E5E7EB'
                }}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div 
                    className={`flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center transition-colors ${
                      isSelected 
                        ? 'bg-gradient-to-br from-blue-500 to-blue-600' 
                        : 'bg-gray-100'
                    }`}
                    style={{
                      backgroundColor: isSelected ? level.color : undefined
                    }}
                  >
                    {getLevelIcon(level.id, isSelected)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                        {level.emoji} {level.title}
                      </h3>
                      {isSelected && (
                        <div className="flex items-center text-blue-600">
                          <Check className="w-5 h-5" />
                          <span className="ml-1 text-sm font-medium">Selected</span>
                        </div>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-4">
                      {level.description}
                    </p>

                    {/* Features */}
                    <div className="grid grid-cols-2 gap-2">
                      {level.features.map((feature, index) => (
                        <div 
                          key={index}
                          className="flex items-center text-sm text-gray-700"
                        >
                          <div 
                            className="w-1.5 h-1.5 rounded-full mr-2 flex-shrink-0"
                            style={{ backgroundColor: level.color }}
                          />
                          {feature}
                        </div>
                      ))}
                    </div>

                    {/* Additional info when selected */}
                    {isSelected && (
                      <div className="mt-4 pt-4 border-t border-gray-100 flex items-center text-sm text-gray-600">
                        <span className="font-medium text-gray-900 mr-4">
                          Rep range: {level.repsRange}
                        </span>
                        <span className="font-medium text-gray-900">
                          Rest: {level.restTime}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Arrow indicator */}
                  <ChevronRight 
                    className={`w-6 h-6 flex-shrink-0 transition-colors ${
                      isSelected ? 'text-blue-500' : 'text-gray-300'
                    }`}
                  />
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer note */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 text-sm text-gray-500 bg-gray-100 px-4 py-2 rounded-full">
            <Settings className="w-4 h-4" />
            <span>You can change this later in settings</span>
          </div>
        </div>

        {/* Continue button for non-onboarding mode */}
        {!isOnboarding && selectedLevel && (
          <div className="mt-6">
            <button
              onClick={() => onSelectLevel(selectedLevel)}
              disabled={isSubmitting}
              className="w-full py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all disabled:opacity-70"
            >
              {isSubmitting ? 'Saving...' : 'Continue'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FitnessLevelSelection;
