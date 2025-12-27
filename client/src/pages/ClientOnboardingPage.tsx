import React, { useState, useEffect } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight, Target, Activity, Utensils, Calendar, CheckCircle, User, Mail, Phone } from 'lucide-react';
import { useRelationships } from '../contexts/RelationshipContext';
import Header from '../components/shared/Header';
import { PlatformDetectionService } from '../services/shared/platformDetectionService';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
}

interface ClientProfile {
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    age: string;
    gender: string;
  };
  goals: {
    primary: string;
    secondary: string[];
    targetWeight: string;
    timeline: string;
  };
  lifestyle: {
    activityLevel: string;
    workoutExperience: string;
    availableDays: string[];
    timePerWorkout: string;
  };
  nutrition: {
    dietaryRestrictions: string[];
    allergies: string[];
    cookingSkill: string;
    mealsPerDay: string;
  };
  health: {
    conditions: string[];
    medications: string[];
    injuries: string[];
    physicalLimitations: string[];
  };
}

const steps: OnboardingStep[] = [
  {
    id: 'personal',
    title: 'Personal Information',
    description: 'Tell us about yourself'
  },
  {
    id: 'goals',
    title: 'Your Goals',
    description: 'What do you want to achieve?'
  },
  {
    id: 'lifestyle',
    title: 'Lifestyle & Fitness',
    description: 'Your current activity level'
  },
  {
    id: 'nutrition',
    title: 'Nutrition Preferences',
    description: 'Your dietary needs and preferences'
  },
  {
    id: 'health',
    title: 'Health Information',
    description: 'Medical history and limitations'
  }
];

const ClientOnboardingPage: React.FC = () => {
  // Mock function for missing context property
  const addNewClient = (client: any) => console.log('Add new client:', client);
  
  const [currentStep, setCurrentStep] = useState(0);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [profile, setProfile] = useState<ClientProfile>({
    personalInfo: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      age: '',
      gender: ''
    },
    goals: {
      primary: '',
      secondary: [],
      targetWeight: '',
      timeline: ''
    },
    lifestyle: {
      activityLevel: '',
      workoutExperience: '',
      availableDays: [],
      timePerWorkout: ''
    },
    nutrition: {
      dietaryRestrictions: [],
      allergies: [],
      cookingSkill: '',
      mealsPerDay: ''
    },
    health: {
      conditions: [],
      medications: [],
      injuries: [],
      physicalLimitations: []
    }
  });

  // Window width detection for responsive padding
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const updateProfile = (section: keyof ClientProfile, field: string, value: any) => {
    setProfile(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const toggleArrayValue = (section: keyof ClientProfile, field: string, value: string) => {
    setProfile(prev => {
      const currentArray = (prev[section] as any)[field] as string[];
      const newArray = currentArray.includes(value)
        ? currentArray.filter(item => item !== value)
        : [...currentArray, value];
      
      return {
        ...prev,
        [section]: {
          ...prev[section],
          [field]: newArray
        }
      };
    });
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return profile.personalInfo.firstName && profile.personalInfo.lastName && 
               profile.personalInfo.email && profile.personalInfo.age;
      case 1:
        return profile.goals.primary && profile.goals.timeline;
      case 2:
        return profile.lifestyle.activityLevel && profile.lifestyle.workoutExperience;
      case 3:
        return profile.nutrition.cookingSkill && profile.nutrition.mealsPerDay;
      case 4:
        return true; // Health info is optional
      default:
        return false;
    }
  };

  const handleComplete = () => {
    const newClient = {
      id: `client-${Date.now()}`,
      name: `${profile.personalInfo.firstName} ${profile.personalInfo.lastName}`,
      email: profile.personalInfo.email,
      goal: profile.goals.primary,
      status: 'active' as const,
      phone: profile.personalInfo.phone,
      profile: profile
    };
    
    addNewClient(newClient);
    // TODO: Navigate to dashboard or success page
  };

  const renderPersonalInfo = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <User className="mx-auto h-12 w-12 text-orange-500 mb-4" />
        <h3 className="text-xl font-semibold text-gray-800">Let's get to know you</h3>
        <p className="text-gray-600">We'll use this information to personalize your experience</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">First Name*</label>
          <input
            type="text"
            value={profile.personalInfo.firstName}
            onChange={(e) => updateProfile('personalInfo', 'firstName', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            placeholder="Enter your first name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Last Name*</label>
          <input
            type="text"
            value={profile.personalInfo.lastName}
            onChange={(e) => updateProfile('personalInfo', 'lastName', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            placeholder="Enter your last name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Email*</label>
          <input
            type="email"
            value={profile.personalInfo.email}
            onChange={(e) => updateProfile('personalInfo', 'email', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            placeholder="Enter your email"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
          <input
            type="tel"
            value={profile.personalInfo.phone}
            onChange={(e) => updateProfile('personalInfo', 'phone', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            placeholder="(555) 123-4567"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Age*</label>
          <input
            type="number"
            value={profile.personalInfo.age}
            onChange={(e) => updateProfile('personalInfo', 'age', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            placeholder="25"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
          <select
            value={profile.personalInfo.gender}
            onChange={(e) => updateProfile('personalInfo', 'gender', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="">Select gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="non-binary">Non-binary</option>
            <option value="prefer-not-to-say">Prefer not to say</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderGoals = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <Target className="mx-auto h-12 w-12 text-orange-500 mb-4" />
        <h3 className="text-xl font-semibold text-gray-800">What are your goals?</h3>
        <p className="text-gray-600">Help us understand what you want to achieve</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Primary Goal*</label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {['Weight Loss', 'Muscle Gain', 'General Health', 'Athletic Performance', 'Stress Management', 'Better Nutrition'].map((goal) => (
            <button
              key={goal}
              onClick={() => updateProfile('goals', 'primary', goal)}
              className={`p-4 text-left border rounded-lg transition-colors ${
                profile.goals.primary === goal
                  ? 'border-orange-500 bg-orange-50 text-orange-700'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              {goal}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Secondary Goals (optional)</label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {['Improve Sleep', 'Increase Energy', 'Build Confidence', 'Reduce Pain', 'Better Mobility', 'Mental Health'].map((goal) => (
            <button
              key={goal}
              onClick={() => toggleArrayValue('goals', 'secondary', goal)}
              className={`p-3 text-left border rounded-lg transition-colors text-sm ${
                profile.goals.secondary.includes(goal)
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              {goal}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Target Weight (if applicable)</label>
          <input
            type="text"
            value={profile.goals.targetWeight}
            onChange={(e) => updateProfile('goals', 'targetWeight', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            placeholder="e.g., 150 lbs"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Timeline*</label>
          <select
            value={profile.goals.timeline}
            onChange={(e) => updateProfile('goals', 'timeline', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="">Select timeline</option>
            <option value="1-3 months">1-3 months</option>
            <option value="3-6 months">3-6 months</option>
            <option value="6-12 months">6-12 months</option>
            <option value="1+ years">1+ years</option>
            <option value="ongoing">Ongoing/Lifestyle</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderLifestyle = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <Activity className="mx-auto h-12 w-12 text-orange-500 mb-4" />
        <h3 className="text-xl font-semibold text-gray-800">Your Lifestyle</h3>
        <p className="text-gray-600">Help us understand your current activity level</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Current Activity Level*</label>
        <div className="space-y-3">
          {[
            { value: 'sedentary', label: 'Sedentary', desc: 'Little to no exercise, desk job' },
            { value: 'lightly-active', label: 'Lightly Active', desc: 'Light exercise 1-3 days per week' },
            { value: 'moderately-active', label: 'Moderately Active', desc: 'Moderate exercise 3-5 days per week' },
            { value: 'very-active', label: 'Very Active', desc: 'Hard exercise 6-7 days per week' },
            { value: 'extremely-active', label: 'Extremely Active', desc: 'Very hard exercise, physical job' }
          ].map((level) => (
            <button
              key={level.value}
              onClick={() => updateProfile('lifestyle', 'activityLevel', level.value)}
              className={`w-full p-4 text-left border rounded-lg transition-colors ${
                profile.lifestyle.activityLevel === level.value
                  ? 'border-orange-500 bg-orange-50 text-orange-700'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <div className="font-medium">{level.label}</div>
              <div className="text-sm text-gray-600">{level.desc}</div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Workout Experience*</label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { value: 'beginner', label: 'Beginner' },
            { value: 'intermediate', label: 'Intermediate' },
            { value: 'advanced', label: 'Advanced' }
          ].map((level) => (
            <button
              key={level.value}
              onClick={() => updateProfile('lifestyle', 'workoutExperience', level.value)}
              className={`p-3 text-center border rounded-lg transition-colors ${
                profile.lifestyle.workoutExperience === level.value
                  ? 'border-orange-500 bg-orange-50 text-orange-700'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              {level.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Available Days</label>
          <div className="space-y-2">
            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
              <label key={day} className="flex items-center">
                <input
                  type="checkbox"
                  checked={profile.lifestyle.availableDays.includes(day)}
                  onChange={() => toggleArrayValue('lifestyle', 'availableDays', day)}
                  className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                />
                <span className="ml-2">{day}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Time per Workout</label>
          <select
            value={profile.lifestyle.timePerWorkout}
            onChange={(e) => updateProfile('lifestyle', 'timePerWorkout', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="">Select duration</option>
            <option value="15-30 min">15-30 minutes</option>
            <option value="30-45 min">30-45 minutes</option>
            <option value="45-60 min">45-60 minutes</option>
            <option value="60+ min">60+ minutes</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderNutrition = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <Utensils className="mx-auto h-12 w-12 text-orange-500 mb-4" />
        <h3 className="text-xl font-semibold text-gray-800">Nutrition Preferences</h3>
        <p className="text-gray-600">Tell us about your dietary needs and preferences</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Dietary Restrictions</label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {['Vegetarian', 'Vegan', 'Keto', 'Paleo', 'Gluten-Free', 'Dairy-Free', 'Low-Carb', 'Mediterranean', 'None'].map((restriction) => (
            <button
              key={restriction}
              onClick={() => toggleArrayValue('nutrition', 'dietaryRestrictions', restriction)}
              className={`p-3 text-center border rounded-lg transition-colors text-sm ${
                profile.nutrition.dietaryRestrictions.includes(restriction)
                  ? 'border-orange-500 bg-orange-50 text-orange-700'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              {restriction}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Food Allergies</label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {['Nuts', 'Shellfish', 'Dairy', 'Eggs', 'Soy', 'Wheat', 'Fish', 'None'].map((allergy) => (
            <button
              key={allergy}
              onClick={() => toggleArrayValue('nutrition', 'allergies', allergy)}
              className={`p-2 text-center border rounded-lg transition-colors text-sm ${
                profile.nutrition.allergies.includes(allergy)
                  ? 'border-red-500 bg-red-50 text-red-700'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              {allergy}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Cooking Skill*</label>
          <select
            value={profile.nutrition.cookingSkill}
            onChange={(e) => updateProfile('nutrition', 'cookingSkill', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="">Select skill level</option>
            <option value="beginner">Beginner (Basic meals)</option>
            <option value="intermediate">Intermediate (Comfortable cooking)</option>
            <option value="advanced">Advanced (Love to cook)</option>
            <option value="minimal">Minimal (Prefer simple/prepared)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Meals per Day*</label>
          <select
            value={profile.nutrition.mealsPerDay}
            onChange={(e) => updateProfile('nutrition', 'mealsPerDay', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="">Select number</option>
            <option value="2">2 meals</option>
            <option value="3">3 meals</option>
            <option value="4">4 meals</option>
            <option value="5">5 meals</option>
            <option value="6">6+ meals</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderHealth = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <CheckCircle className="mx-auto h-12 w-12 text-orange-500 mb-4" />
        <h3 className="text-xl font-semibold text-gray-800">Health Information</h3>
        <p className="text-gray-600">This information helps us create safer, more effective plans</p>
        <p className="text-sm text-gray-500 mt-2">All information is confidential and optional</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Medical Conditions</label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {['Diabetes', 'High Blood Pressure', 'Heart Condition', 'Arthritis', 'Thyroid Issues', 'PCOS', 'None'].map((condition) => (
            <button
              key={condition}
              onClick={() => toggleArrayValue('health', 'conditions', condition)}
              className={`p-3 text-left border rounded-lg transition-colors ${
                profile.health.conditions.includes(condition)
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              {condition}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Previous Injuries</label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {['Knee Injury', 'Back Injury', 'Shoulder Injury', 'Ankle Injury', 'Wrist Injury', 'Other', 'None'].map((injury) => (
            <button
              key={injury}
              onClick={() => toggleArrayValue('health', 'injuries', injury)}
              className={`p-3 text-left border rounded-lg transition-colors ${
                profile.health.injuries.includes(injury)
                  ? 'border-yellow-500 bg-yellow-50 text-yellow-700'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              {injury}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: return renderPersonalInfo();
      case 1: return renderGoals();
      case 2: return renderLifestyle();
      case 3: return renderNutrition();
      case 4: return renderHealth();
      default: return null;
    }
  };

  return (
    <>
      {/* Fixed Header */}
      <div className={`fixed top-0 left-0 right-0 z-50 bg-white ${PlatformDetectionService.isNative() ? 'pt-12' : ''}`}>
        <Header
          variant="results"
          showLogin={true}
          showSearchInput={true}
          onSearchSubmit={() => {}}
          onChatMessage={() => {}}
          isInChatMode={false}
          showProgressMenu={true}
          onProgressMenuClick={undefined}
        />
      </div>

      <div className="min-h-screen bg-gray-50" style={{ paddingTop: windowWidth < 768 ? '320px' : windowWidth < 1200 ? '300px' : '180px' }}>
        <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Progress Header */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-800">Welcome to WiHY!</h1>
            <span className="text-sm text-gray-600">Step {currentStep + 1} of {steps.length}</span>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div 
              className="bg-orange-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>

          {/* Step Navigation */}
          <div className="flex items-center space-x-4 overflow-x-auto">
            {steps.map((step, index) => (
              <div 
                key={step.id}
                className={`flex items-center space-x-2 text-sm whitespace-nowrap ${
                  index === currentStep ? 'text-orange-600' : 
                  index < currentStep ? 'text-green-600' : 'text-gray-400'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                  index === currentStep ? 'border-orange-500 bg-orange-50' :
                  index < currentStep ? 'border-green-500 bg-green-50' : 'border-gray-300'
                }`}>
                  {index < currentStep ? (
                    <CheckCircle size={16} className="text-green-600" />
                  ) : (
                    <span className="font-medium">{index + 1}</span>
                  )}
                </div>
                <div>
                  <div className="font-medium">{step.title}</div>
                  <div className="text-xs text-gray-500">{step.description}</div>
                </div>
                {index < steps.length - 1 && (
                  <ArrowRight size={16} className="text-gray-300 ml-2" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-lg border border-gray-200 p-8 mb-8">
          {renderStepContent()}
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <button
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
            className={`flex items-center space-x-2 px-6 py-3 border rounded-lg transition-colors ${
              currentStep === 0 
                ? 'border-gray-200 text-gray-400 cursor-not-allowed' 
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <ChevronLeft size={16} />
            <span>Previous</span>
          </button>

          {currentStep === steps.length - 1 ? (
            <button
              onClick={handleComplete}
              className="flex items-center space-x-2 px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <CheckCircle size={16} />
              <span>Complete Setup</span>
            </button>
          ) : (
            <button
              onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
              disabled={!canProceed()}
              className={`flex items-center space-x-2 px-6 py-3 rounded-lg transition-colors ${
                canProceed()
                  ? 'bg-orange-500 text-white hover:bg-orange-600'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <span>Next</span>
              <ChevronRight size={16} />
            </button>
          )}
        </div>
        </div>
      </div>
    </>
  );
};

export default ClientOnboardingPage;