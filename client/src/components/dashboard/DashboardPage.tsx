import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../../services/authService';
import { PlatformDetectionService } from '../../services/shared/platformDetectionService';
import ImageUploadModal from '../ui/ImageUploadModal';
import FullScreenChat, { FullScreenChatRef } from '../ui/FullScreenChat';
import MyProgressDashboard, { WihyCoachModel } from './MyProgressDashboard';
import CoachDashboard from './CoachDashboard';
import ParentDashboard from './ParentDashboard';
import ConsumptionDashboard from './ConsumptionDashboard';
import ResearchDashboard from './ResearchDashboard';
import FitnessDashboard, { FitnessDashboardModel, buildProgramKey } from './FitnessDashboard';
import OverviewDashboard from './OverviewDashboard';
import { CSS_CLASSES } from '../../constants/cssConstants';
import '../../styles/VHealthSearch.css';
import '../../styles/Dashboard.css';
import '../../styles/charts.css';
import '../../styles/chat-overlay.css';
import Header from '../shared/Header';

import { logger } from '../../utils/logger';

// Dashboard type definition
type DashboardType = 'overview' | 'myprogress' | 'intake' | 'research' | 'fitness' | 'coach' | 'parent';

interface DashboardPageProps {
  dashboardType?: DashboardType;
  apiResponse?: any;
}

const DashboardPage: React.FC<DashboardPageProps> = ({
  dashboardType,
  apiResponse
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Determine dashboard type from URL path
  const getDashboardType = (): DashboardType => {
    if (dashboardType) return dashboardType;
    
    const path = location.pathname;
    if (path.includes('/overview')) return 'overview';
    if (path.includes('/myprogress')) return 'myprogress';
    if (path.includes('/intake')) return 'intake';
    if (path.includes('/research')) return 'research';
    if (path.includes('/fitness')) return 'fitness';
    if (path.includes('/coach')) return 'coach';
    if (path.includes('/parent')) return 'parent';
    
    return 'overview'; // default
  };
  
  const currentDashboard = getDashboardType();
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const [isDarkMode, setIsDarkMode] = useState(false);
  const chatRef = useRef<FullScreenChatRef>(null);

  // Detect dark mode
  useEffect(() => {
    const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDarkMode(darkModeQuery.matches);
    
    const handler = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
    darkModeQuery.addEventListener('change', handler);
    return () => darkModeQuery.removeEventListener('change', handler);
  }, []);

  // Handle window resize for responsive layout
  useEffect(() => {
    let resizeTimeout: number;
    
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = window.setTimeout(() => {
        setWindowWidth(window.innerWidth);
      }, 150);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimeout);
    };
  }, []);

  // Mock coach data for My Progress tab
  const mockCoachData: WihyCoachModel = {
    summary: "",
    motivation: "Keep up the great work! 💪",
    priorities: [
      { id: "p1", title: "Morning Workout", icon: "🏃", description: "30 min cardio" },
      { id: "p2", title: "Hydration Goal", icon: "💧", description: "8 cups today" },
      { id: "p3", title: "Balanced Meals", icon: "🥗", description: "Track macros" }
    ],
    actions: [
      { 
        id: "a1", 
        type: "workout", 
        title: "Complete morning cardio", 
        description: "Get your heart rate up",
        status: "completed",
        meta: "30 min"
      },
      { 
        id: "a2", 
        type: "meal", 
        title: "Log breakfast", 
        description: "Track your morning meal",
        status: "completed",
        meta: "400 cal"
      },
      { 
        id: "a3", 
        type: "hydration", 
        title: "Drink water", 
        description: "Stay hydrated throughout the day",
        status: "in_progress",
        meta: "4/8 cups"
      },
      { 
        id: "a4", 
        type: "habit", 
        title: "Evening stretch routine", 
        description: "Flexibility and recovery",
        status: "pending",
        meta: "15 min"
      }
    ],
    workout: {
      title: "Upper Body Strength",
      durationLabel: "35–40 min",
      intensityLabel: "Moderate",
      steps: [
        { id: "s1", label: "Warm-up", detail: "5 min dynamic stretches" },
        { id: "s2", label: "Push-ups", detail: "3 sets of 12 reps" },
        { id: "s3", label: "Dumbbell rows", detail: "3 sets of 10 reps each arm" },
        { id: "s4", label: "Shoulder press", detail: "3 sets of 10 reps" },
        { id: "s5", label: "Cool-down", detail: "5 min stretching" }
      ]
    },
    workoutProgram: [
      {
        meta: {
          id: "ex1",
          name: "Squats",
          equipment: "BARBELL",
          fitnessLoad: { STRENGTH: 3, ENDURANCE: 1 },
          muscleLoad: { QUADS: 3, GLUTES: 2, HAMSTRINGS: 2, CORE: 1 }
        },
        prescription: {
          exerciseId: "ex1",
          sets: 4,
          intensityLabel: "75% 1RM"
        }
      },
      {
        meta: {
          id: "ex2",
          name: "Bench Press",
          equipment: "BARBELL",
          fitnessLoad: { STRENGTH: 3, ENDURANCE: 1 },
          muscleLoad: { CHEST: 3, SHOULDERS: 2, ARMS: 2 }
        },
        prescription: {
          exerciseId: "ex2",
          sets: 4,
          intensityLabel: "70% 1RM"
        }
      }
    ],
    consumption: {
      mealsLogged: 2,
      mealsPlanned: 4,
      calories: 850,
      caloriesTarget: 2000,
      protein: 45,
      proteinTarget: 150
    },
    hydration: {
      cups: 4,
      goalCups: 8
    },
    streaks: [
      { id: "str1", label: "7 day workout streak", icon: "🔥" },
      { id: "str2", label: "5 day meal tracking", icon: "✅" }
    ],
    checkin: {
      question: "How are you feeling today?",
      inputType: "mood"
    },
    education: {
      title: "Benefits of Progressive Overload",
      summary: "Learn how gradually increasing weight, frequency, or reps can boost muscle growth and strength gains.",
      linkLabel: "Read More →"
    }
  };

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
        }
      ]
    },
    programTitle: "12-Week Progressive Strength Program",
    programDescription: "Build strength and muscle across all fitness levels with our structured program",
    defaultPhaseId: "phase1",
    defaultLevelId: "beginner",
    defaultDayId: "day1"
  };



  // Universal Search handler for chat
  const handleUniversalSearch = async (searchQuery: string | any) => {
    console.log('🔍 DASHBOARD: Universal Search initiated:', { searchQuery });
    
    if (typeof searchQuery === 'object' && searchQuery !== null) {
      console.log('🔍 DASHBOARD: Received object result, opening chat');
      if (chatRef.current) {
        chatRef.current.addMessage('Image analysis', searchQuery);
      }
      setIsChatOpen(true);
      return;
    }
    
    if (!searchQuery || typeof searchQuery !== 'string' || !searchQuery.trim()) {
      console.warn('⚠️ DASHBOARD: Invalid search query:', searchQuery);
      return;
    }
    
    try {
      logger.debug('DashboardPage: Making Universal Search API call', { 
        query: searchQuery, 
        endpoint: 'https://ml.wihy.ai/ask' 
      });
      
      const response = await fetch('https://ml.wihy.ai/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: searchQuery,
          type: 'auto',
          options: {
            include_charts: true,
            include_recommendations: true
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }

      const universalResult = await response.json();
      
      if (universalResult.success && universalResult.results) {
        if (chatRef.current) {
          chatRef.current.addMessage(searchQuery, universalResult.results);
        }
        setIsChatOpen(true);
        logger.info('DashboardPage: Universal Search completed', { query: searchQuery });
      } else {
        throw new Error('Universal Search API request failed');
      }
    } catch (error) {
      logger.error('DashboardPage: Universal search failed:', error);
      if (chatRef.current) {
        chatRef.current.addMessage(searchQuery, 'Sorry, there was an error processing your search. Please try again.');
        setIsChatOpen(true);
      }
    }
  };

  // Handle adding messages to chat conversation
  const handleAddToChatConversation = (userMessage: string, assistantMessage: string) => {
    if (chatRef.current) {
      chatRef.current.addMessage(userMessage, assistantMessage);
      if (!isChatOpen) {
        setIsChatOpen(true);
      }
    }
  };

  // Handle image analysis completion
  const handleAnalysisComplete = (results: any) => {
    setIsUploadModalOpen(false);
    if (!results) return;
    
    if (results.type === 'error') {
      console.error('Analysis error:', results.error);
      return;
    }
    
    const isImageResult = results.type && (
      results.type === 'image_analysis' ||
      results.type === 'vision_analysis' ||
      results.type === 'barcode_scan' ||
      results.type === 'product_search' ||
      results.type === 'barcode_analysis'
    );
    
    if (isImageResult || results.imageUrl || results.userQuery) {
      const userMessage = results.userQuery || 'Uploaded image';
      if (chatRef.current) {
        chatRef.current.addMessage(userMessage, results);
      }
      setIsChatOpen(true);
    }
  };

  // Handle opening receipt upload modal
  const handleOpenReceiptUpload = () => {
    setIsUploadModalOpen(true);
  };

  // Get dashboard period based on window width
  const getDashboardPeriod = () => {
    return windowWidth < 768 ? 'day' : 'week';
  };

  return (
    <>
      <div style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000, 
        backgroundColor: 'white',
        paddingTop: PlatformDetectionService.isNative() ? '48px' : undefined
      }}>
        <Header
          variant="results"
          showLogin={true}
          showSearchInput={true}
          onSearchSubmit={handleUniversalSearch}
          onChatMessage={handleAddToChatConversation}
          isInChatMode={isChatOpen}
          showProgressMenu={true}
          onProgressMenuClick={undefined}
        />
      </div>

      {/* Main Content Area with Dashboard Layout */}
      <div className={CSS_CLASSES.DASHBOARD_CONTAINER} style={{ paddingTop: windowWidth < 768 ? '220px' : windowWidth < 1200 ? '220px' : '100px' }}>

        
        <div className={CSS_CLASSES.DASHBOARD_MAIN_CONTENT}>
          {/* Full Screen Chat */}
          <FullScreenChat
            ref={chatRef}
            isOpen={isChatOpen}
            onClose={() => setIsChatOpen(false)}
            onViewCharts={() => setIsChatOpen(false)}
          />

          {/* Floating Chat Button */}
          {!isChatOpen && !PlatformDetectionService.isNative() && (
            <button
              onClick={() => setIsChatOpen(!isChatOpen)}
              className="floating-chat-button"
            >
              💬
            </button>
          )}

          {/* Dashboard Content */}
          <div className="health-dashboard-content" style={{
            padding: windowWidth < 768 ? '25px 8px 0 8px' : '30px 20px',
            maxWidth: '100%',
            overflowX: 'hidden'
          }}>
            {(currentDashboard === 'overview' || !currentDashboard) && (
              <OverviewDashboard onAnalyze={handleAddToChatConversation} />
            )}

            {currentDashboard === 'myprogress' && (
              <MyProgressDashboard 
                coach={mockCoachData}
                onToggleAction={(actionId) => console.log('Toggle action:', actionId)}
                onStartWorkout={() => console.log('Start workout')}
                onAddHydration={() => console.log('Add hydration')}
                onLogMeal={() => console.log('Log meal')}
                onEducationClick={() => console.log('Education clicked')}
              />
            )}

            {currentDashboard === 'research' && (
              <ResearchDashboard
                period={getDashboardPeriod()}
                onAnalyze={handleAddToChatConversation}
                onSearch={handleUniversalSearch}
                windowWidth={windowWidth}
              />
            )}

            {currentDashboard === 'intake' && (
              <ConsumptionDashboard
                period={getDashboardPeriod()}
                onAnalyze={handleAddToChatConversation}
                onUploadReceipt={handleOpenReceiptUpload}
              />
            )}

            {currentDashboard === 'fitness' && (
              <FitnessDashboard
                data={mockFitnessDashboard}
                onStartSession={(params) => console.log('Start session:', params)}
              />
            )}

            {currentDashboard === 'coach' && <CoachDashboard />}

            {currentDashboard === 'parent' && <ParentDashboard />}
          </div>
        </div>
      </div>

      <ImageUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onAnalysisComplete={handleAnalysisComplete}
        title="Upload Image"
        subtitle="Upload images for analysis"
      />

      {/* Mobile Bottom Navigation */}
      {PlatformDetectionService.isNative() && (
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: '56px',
          backgroundColor: isDarkMode ? '#1f1f1f' : '#ffffff',
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          borderTop: `1px solid ${isDarkMode ? '#2d2d2d' : '#e0e0e0'}`,
          zIndex: 1200,
          boxShadow: isDarkMode ? 'none' : '0 -2px 8px rgba(0, 0, 0, 0.1)'
        }}>
          <button
            onClick={() => {
              if (isChatOpen) setIsChatOpen(false);
              navigate('/');
            }}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'flex-start',
              background: 'none',
              border: 'none',
              color: isDarkMode ? '#e0e0e0' : '#5f6368',
              padding: '0',
              cursor: 'pointer',
              gap: '4px'
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
            </svg>
            <span style={{ fontSize: '11px', fontWeight: '500' }}>Search</span>
          </button>

          <button
            onClick={() => setIsUploadModalOpen(true)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'flex-start',
              background: 'none',
              border: 'none',
              color: isDarkMode ? '#e0e0e0' : '#5f6368',
              padding: '0',
              cursor: 'pointer',
              gap: '4px'
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/>
            </svg>
            <span style={{ fontSize: '11px', fontWeight: '500' }}>Scan</span>
          </button>

          <button
            onClick={() => setIsChatOpen(!isChatOpen)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'flex-start',
              background: 'none',
              border: 'none',
              color: isChatOpen ? '#4cbb17' : (isDarkMode ? '#e0e0e0' : '#5f6368'),
              padding: '0',
              cursor: 'pointer',
              gap: '4px'
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
            </svg>
            <span style={{ fontSize: '11px', fontWeight: '500' }}>Chat</span>
          </button>

          <button
            onClick={() => {
              const loginButton = document.querySelector('.login-icon') as HTMLElement;
              if (loginButton) loginButton.click();
            }}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'flex-start',
              background: 'none',
              border: 'none',
              color: isDarkMode ? '#e0e0e0' : '#5f6368',
              padding: '0',
              cursor: 'pointer',
              gap: '4px'
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
            </svg>
            <span style={{ fontSize: '11px', fontWeight: '500' }}>Login</span>
          </button>
        </div>
      )}
    </>
  );
};

export default DashboardPage;
