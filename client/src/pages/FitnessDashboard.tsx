import React from 'react';
import Header from '../components/shared/Header';
import FitnessDashboard, { FitnessDashboardModel, buildProgramKey } from '../components/dashboard/FitnessDashboard';

interface FitnessDashboardPageProps {
  windowWidth: number;
}

const FitnessDashboardPage: React.FC<FitnessDashboardPageProps> = ({ windowWidth }) => {
  // Mock fitness dashboard data
  const mockFitnessDashboard: FitnessDashboardModel = {
    title: "Your Training Program",
    subtitle: "",
    
    phases: [
      { id: "phase1", name: "Foundation (Weeks 1-4)" },
      { id: "phase2", name: "Building (Weeks 5-8)" },
      { id: "phase3", name: "Strength (Weeks 9-12)" }
    ],
    
    levels: [
      { id: "beginner", label: "Beginner" },
      { id: "intermediate", label: "Intermediate" },
      { id: "advanced", label: "Advanced" }
    ],
    
    days: [
      { id: "day1", label: "Day 1" },
      { id: "day2", label: "Day 2" },
      { id: "day3", label: "Day 3" },
      { id: "day4", label: "Day 4" }
    ],
    
    variants: {
      // Beginner - Phase 1 - Day 1
      [buildProgramKey("phase1", "beginner", "day1")]: [
        {
          meta: {
            id: "ex1",
            name: "Bodyweight Squats",
            equipment: "NONE",
            fitnessLoad: { STRENGTH: 1, ENDURANCE: 2 },
            muscleLoad: { QUADS: 2, GLUTES: 2, CORE: 1 }
          },
          prescription: {
            exerciseId: "ex1",
            sets: 3,
            intensityLabel: "12-15 reps"
          }
        },
        {
          meta: {
            id: "ex2",
            name: "Push-ups (Knee)",
            equipment: "NONE",
            fitnessLoad: { STRENGTH: 1, ENDURANCE: 2 },
            muscleLoad: { CHEST: 2, ARMS: 2, SHOULDERS: 1 }
          },
          prescription: {
            exerciseId: "ex2",
            sets: 3,
            intensityLabel: "8-12 reps"
          }
        },
        {
          meta: {
            id: "ex3",
            name: "Plank",
            equipment: "NONE",
            fitnessLoad: { ENDURANCE: 2, STRENGTH: 1 },
            muscleLoad: { CORE: 3 }
          },
          prescription: {
            exerciseId: "ex3",
            sets: 3,
            intensityLabel: "20-30 sec"
          }
        }
      ]
    },
    
    programTitle: "12-Week Progressive Strength Program",
    programDescription: "Build strength and muscle across all fitness levels with our structured program",
    
    defaultPhaseId: "phase1",
    defaultLevelId: "beginner",
    defaultDayId: "day1"
  };

  const handleStartSession = (params: any) => {
    console.log('Start fitness session:', params);
    // Could open a workout tracking view here
  };

  return (
    <div style={{ 
      minHeight: '100vh',
      backgroundColor: '#f0f7ff' 
    }}>
      <Header
        variant="results"
        showLogin={true}
        showSearchInput={false}
        onSearchSubmit={() => {}}
        onChatMessage={() => {}}
        isInChatMode={false}
        showProgressMenu={true}
        onProgressMenuClick={undefined}
      />
      
      <div style={{ 
        paddingTop: windowWidth < 768 ? '120px' : '100px',
        padding: windowWidth < 768 ? '120px 16px 40px' : '100px 32px 40px',
        maxWidth: '1400px',
        margin: '0 auto'
      }}>
        <FitnessDashboard
          onStartSession={handleStartSession}
        />
      </div>
    </div>
  );
};

export default FitnessDashboardPage;