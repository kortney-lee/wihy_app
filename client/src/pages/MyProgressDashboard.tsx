import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/shared/Header';
import MyProgressDashboardComponent from '../components/dashboard/MyProgressDashboard';

interface MyProgressDashboardPageProps {
  windowWidth?: number;
}

// Mock coach data for demonstration
const mockCoachData = {
  summary: "Your progress this week shows consistent improvement in nutrition tracking and workout completion.",
  motivation: "Keep up the great work with your nutrition logging! Your consistency is paying off with better energy levels and sleep quality.",
  priorities: [
    {
      id: "p1",
      title: "Daily Protein Target",
      description: "Aim for 120g protein daily to support muscle recovery"
    },
    {
      id: "p2", 
      title: "Workout Consistency",
      description: "Complete 4 workouts this week"
    },
    {
      id: "p3",
      title: "Sleep Schedule",
      description: "Maintain 7-8 hours of sleep nightly"
    }
  ],
  actions: [
    {
      id: "a1",
      type: "meal" as const,
      title: "Log breakfast",
      description: "Track your morning meal and macros",
      status: "pending" as const,
      meta: "30 min"
    },
    {
      id: "a2", 
      type: "workout" as const,
      title: "Upper body strength",
      description: "Focus on compound movements",
      status: "pending" as const,
      meta: "45 min"
    },
    {
      id: "a3",
      type: "hydration" as const,
      title: "Morning hydration",
      description: "Start with 16oz water",
      status: "completed" as const,
      meta: "2 cups"
    }
  ],
  workout: {
    title: "Upper Body Strength Training",
    durationLabel: "45-50 min",
    intensityLabel: "Moderate-High",
    steps: [
      {
        id: "s1",
        label: "Warm-up",
        detail: "5 min dynamic stretching"
      },
      {
        id: "s2", 
        label: "Push movements",
        detail: "Push-ups, overhead press, dips"
      },
      {
        id: "s3",
        label: "Pull movements", 
        detail: "Rows, pull-ups, lat pulldowns"
      },
      {
        id: "s4",
        label: "Cool down",
        detail: "5 min stretching"
      }
    ]
  },
  consumption: {
    mealsLogged: 2,
    mealsPlanned: 3,
    calories: 1450,
    caloriesTarget: 2000,
    protein: 85,
    proteinTarget: 120
  },
  hydration: {
    cups: 4,
    goalCups: 8
  },
  streaks: [
    {
      id: "st1",
      label: "7-day nutrition logging"
    },
    {
      id: "st2",
      label: "5-day workout streak"
    }
  ],
  checkin: {
    question: "How are you feeling today?",
    inputType: "mood" as const
  },
  education: {
    title: "The Role of Protein in Recovery",
    summary: "Learn how protein timing and quality affect muscle recovery and adaptation to training.",
    linkLabel: "Read full article"
  }
};

const MyProgressDashboardPage: React.FC<MyProgressDashboardPageProps> = ({ windowWidth = 1200 }) => {
  const navigate = useNavigate();

  const handleSearch = (query: string) => {
    if (query.trim()) {
      // Navigate to search results or handle search
      navigate('/results', { state: { initialQuery: query.trim() } });
    }
  };

  return (
    <div className="w-full h-full bg-[#f0f7ff] overflow-hidden flex flex-col">
      {/* Header */}
      <Header
        searchQuery=""
        onSearchSubmit={handleSearch}
        showSearchInput={true}
        variant="results"
        showLogin={true}
      />
      
      {/* Main content area - matches the Header's top positioning */}
      <div className="flex-1 overflow-auto pt-[220px] sm:pt-[240px] lg:pt-[260px]">
        <div className="max-w-full mx-auto">
          <MyProgressDashboardComponent 
            coach={mockCoachData}
            onToggleAction={(actionId) => console.log('Toggle action:', actionId)}
            onStartWorkout={() => console.log('Start workout')}
            onAddHydration={() => console.log('Add hydration')}
            onLogMeal={() => console.log('Log meal')}
            onEducationClick={() => console.log('Education clicked')}
          />
        </div>
      </div>
    </div>
  );
};

export default MyProgressDashboardPage;