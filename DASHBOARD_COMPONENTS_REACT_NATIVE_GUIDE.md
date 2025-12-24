# Dashboard Components for React Native - Complete Guide

## Overview

This document provides a comprehensive guide for converting all dashboard components from the web React app to React Native. Each dashboard serves specific health and wellness needs with distinct user interfaces and functionality patterns.

## Dashboard Architecture

### Core Dashboard Types

The app contains **8 primary dashboard components** organized in a modular architecture:

```
Dashboard Hierarchy:
├── DashboardPage.tsx (Main Container/Router)
├── OverviewDashboard.tsx (Primary Health Overview)
├── MyProgressDashboard.tsx (Personal Progress Tracking)
├── ResearchDashboard.tsx (Health Research & Studies)
├── ConsumptionDashboard.tsx (Food & Nutrition Intake)
├── FitnessDashboard.tsx (Workout & Exercise Programs)
├── CoachDashboard.tsx (AI Coach & Meal/Workout Plans)
├── ParentDashboard.tsx (Family & Child Health Monitoring)
└── WorkoutProgramGrid.tsx (Exercise Program Grid Component)
```

## React Native Conversion Strategy

### Navigation Architecture for Mobile

```typescript
// Main Dashboard Navigation (React Native)
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';

const DashboardTab = createBottomTabNavigator();
const DashboardStack = createStackNavigator();

const DashboardNavigator = () => {
  return (
    <DashboardTab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#4285f4',
        tabBarInactiveTintColor: '#6b7280',
        tabBarStyle: { paddingBottom: 8, height: 60 },
      }}
    >
      <DashboardTab.Screen 
        name="Overview" 
        component={OverviewDashboard}
        options={{
          tabBarIcon: ({ color }) => <Icon name="dashboard" color={color} />,
        }}
      />
      <DashboardTab.Screen 
        name="Progress" 
        component={MyProgressDashboard}
        options={{
          tabBarIcon: ({ color }) => <Icon name="trending-up" color={color} />,
        }}
      />
      <DashboardTab.Screen 
        name="Research" 
        component={ResearchDashboard}
        options={{
          tabBarIcon: ({ color }) => <Icon name="search" color={color} />,
        }}
      />
      <DashboardTab.Screen 
        name="Nutrition" 
        component={ConsumptionDashboard}
        options={{
          tabBarIcon: ({ color }) => <Icon name="restaurant" color={color} />,
        }}
      />
    </DashboardTab.Navigator>
  );
};
```

## Dashboard Component Specifications

### 1. OverviewDashboard (Primary Health Hub)

**Purpose**: Main health overview with personalized insights and navigation to specialized dashboards
**Mobile Priority**: **HIGH** - Primary landing dashboard

#### Core Functionality
- **Health Summary**: Key metrics and quick insights
- **Tab Navigation**: Summary, Insights, Wellness, Trends, Predictive
- **Chart Integration**: Displays priority health charts
- **Quick Actions**: Direct access to health tracking features

#### Mobile Layout Structure
```typescript
interface OverviewDashboardProps {
  onAnalyze?: (userMessage: string, assistantMessage: string) => void;
}

const OverviewDashboard: React.FC<OverviewDashboardProps> = ({ onAnalyze }) => {
  return (
    <ScrollView style={styles.container}>
      {/* Health Summary Header */}
      <View style={styles.summaryHeader}>
        <Text style={styles.headerTitle}>Health Overview</Text>
        <Text style={styles.headerSubtitle}>Your personalized health dashboard</Text>
      </View>

      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {tabs.map(tab => (
            <TouchableOpacity key={tab} style={styles.tabButton}>
              <Text style={styles.tabText}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Dynamic Content Area */}
      <View style={styles.contentArea}>
        {renderTabContent()}
      </View>

      {/* Quick Action Cards */}
      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionGrid}>
          {quickActionCards.map(renderActionCard)}
        </View>
      </View>
    </ScrollView>
  );
};
```

#### React Native Styling
```typescript
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  
  summaryHeader: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  
  tabContainer: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  
  tabButton: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  
  contentArea: {
    flex: 1,
    padding: 16,
  },
  
  quickActions: {
    padding: 16,
    backgroundColor: '#ffffff',
    marginTop: 8,
  },
  
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
});
```

### 2. MyProgressDashboard (Personal Progress Tracking)

**Purpose**: Personal health progress tracking with workouts, meals, and habit monitoring
**Mobile Priority**: **HIGH** - Daily interaction dashboard

#### Core Functionality
- **Progress Metrics**: Weight, fitness, nutrition progress
- **Action Tracking**: Workout completion, meal logging, habit tracking
- **Coach Integration**: AI coach recommendations and programs
- **Goal Management**: Health goal setting and achievement tracking

#### Mobile Implementation Focus
```typescript
interface MyProgressDashboardProps {
  coach: WihyCoachModel;
  onToggleAction: (actionId: string) => void;
  onStartWorkout: () => void;
  onAddHydration: () => void;
  onLogMeal: () => void;
  onEducationClick: () => void;
}

const MyProgressDashboard: React.FC<MyProgressDashboardProps> = (props) => {
  return (
    <ScrollView style={styles.progressContainer}>
      {/* Today's Summary */}
      <View style={styles.todaySummary}>
        <Text style={styles.todayTitle}>Today's Progress</Text>
        <View style={styles.progressCards}>
          <ProgressCard 
            title="Workouts" 
            completed={2} 
            target={3} 
            icon="fitness"
          />
          <ProgressCard 
            title="Meals" 
            completed={3} 
            target={4} 
            icon="restaurant"
          />
          <ProgressCard 
            title="Hydration" 
            completed={6} 
            target={8} 
            icon="water"
          />
        </View>
      </View>

      {/* Action Items */}
      <View style={styles.actionSection}>
        <Text style={styles.sectionTitle}>Today's Actions</Text>
        <FlatList
          data={todaysActions}
          renderItem={renderActionItem}
          keyExtractor={item => item.id}
        />
      </View>

      {/* Coach Recommendations */}
      <View style={styles.coachSection}>
        <Text style={styles.sectionTitle}>Coach Recommendations</Text>
        {renderCoachRecommendations()}
      </View>
    </ScrollView>
  );
};
```

### 3. ResearchDashboard (Health Research & Studies)

**Purpose**: Health research exploration with study analysis and evidence-based insights
**Mobile Priority**: **MEDIUM** - Educational/research focus

#### Core Functionality
- **Research Search**: Health topic research with filtering
- **Study Analysis**: Clinical study breakdowns and insights
- **Evidence Quality**: Research quality assessment
- **Saved Collections**: Bookmarked research topics

#### Mobile Adaptation Strategy
```typescript
const ResearchDashboard: React.FC<ResearchDashboardProps> = ({
  period,
  onAnalyze,
  onSearch,
  windowWidth
}) => {
  return (
    <View style={styles.researchContainer}>
      {/* Search Header */}
      <View style={styles.searchHeader}>
        <SearchBar
          placeholder="Search health research..."
          onSearch={handleSearch}
          style={styles.searchBar}
        />
        <TouchableOpacity style={styles.filterButton}>
          <Icon name="filter" size={20} color="#6b7280" />
        </TouchableOpacity>
      </View>

      {/* Research Categories */}
      <ScrollView horizontal style={styles.categoryScroll}>
        {researchCategories.map(category => (
          <TouchableOpacity key={category.id} style={styles.categoryChip}>
            <Text style={styles.categoryText}>{category.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Research Results */}
      <FlatList
        data={researchResults}
        renderItem={renderResearchItem}
        keyExtractor={item => item.id}
        style={styles.resultsList}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={handleRefresh} />
        }
      />
    </View>
  );
};
```

### 4. ConsumptionDashboard (Food & Nutrition Intake)

**Purpose**: Comprehensive nutrition tracking with meal planning and shopping integration
**Mobile Priority**: **HIGH** - Daily nutrition management

#### Core Functionality
- **Nutrition Tracking**: Calorie and nutrient intake monitoring
- **Meal Planning**: Weekly meal planning with nutritional goals
- **Shopping Integration**: Smart shopping lists from meal plans
- **Receipt Analysis**: Food purchase analysis and tracking

#### Mobile Implementation
```typescript
const ConsumptionDashboard: React.FC<ConsumptionDashboardProps> = ({
  period,
  onAnalyze,
  onUploadReceipt
}) => {
  return (
    <ScrollView style={styles.consumptionContainer}>
      {/* Nutrition Summary */}
      <View style={styles.nutritionSummary}>
        <View style={styles.calorieProgress}>
          <CircularProgress
            value={currentCalories}
            maxValue={targetCalories}
            radius={60}
            strokeWidth={8}
          />
          <Text style={styles.calorieText}>
            {currentCalories} / {targetCalories} cal
          </Text>
        </View>
        
        <View style={styles.macroBreakdown}>
          <MacroBar type="protein" current={proteinGrams} target={proteinTarget} />
          <MacroBar type="carbs" current={carbGrams} target={carbTarget} />
          <MacroBar type="fat" current={fatGrams} target={fatTarget} />
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.actionButton} onPress={onLogMeal}>
          <Icon name="camera" size={24} color="#4285f4" />
          <Text style={styles.actionText}>Log Meal</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton} onPress={onUploadReceipt}>
          <Icon name="receipt" size={24} color="#4285f4" />
          <Text style={styles.actionText}>Scan Receipt</Text>
        </TouchableOpacity>
      </View>

      {/* Recent Meals */}
      <View style={styles.recentMeals}>
        <Text style={styles.sectionTitle}>Today's Meals</Text>
        <FlatList
          data={todaysMeals}
          renderItem={renderMealItem}
          keyExtractor={item => item.id}
        />
      </View>
    </ScrollView>
  );
};
```

### 5. FitnessDashboard (Workout & Exercise Programs)

**Purpose**: Comprehensive fitness tracking with workout programs and exercise analytics
**Mobile Priority**: **HIGH** - Active fitness management

#### Core Functionality
- **Workout Programs**: Structured exercise programs with progression
- **Exercise Tracking**: Rep counts, weights, and performance metrics
- **Progress Analytics**: Fitness progress visualization
- **Program Customization**: Personalized workout adjustments

#### Mobile-First Design
```typescript
const FitnessDashboard: React.FC<FitnessDashboardProps> = ({
  workoutModel,
  onProgramSelect,
  onWorkoutStart
}) => {
  return (
    <View style={styles.fitnessContainer}>
      {/* Current Program Header */}
      <View style={styles.programHeader}>
        <Text style={styles.programTitle}>{currentProgram.name}</Text>
        <Text style={styles.programWeek}>Week {currentWeek} of {totalWeeks}</Text>
        <ProgressBar progress={weekProgress} style={styles.progressBar} />
      </View>

      {/* Today's Workout */}
      <View style={styles.todaysWorkout}>
        <Text style={styles.sectionTitle}>Today's Workout</Text>
        <WorkoutCard
          workout={todaysWorkout}
          onStart={onWorkoutStart}
          style={styles.workoutCard}
        />
      </View>

      {/* Exercise Grid */}
      <View style={styles.exerciseGrid}>
        <Text style={styles.sectionTitle}>Exercise Library</Text>
        <FlatList
          data={exerciseLibrary}
          renderItem={renderExerciseItem}
          numColumns={2}
          keyExtractor={item => item.id}
          columnWrapperStyle={styles.exerciseRow}
        />
      </View>

      {/* Progress Charts */}
      <View style={styles.progressCharts}>
        <Text style={styles.sectionTitle}>Progress Analytics</Text>
        {renderProgressCharts()}
      </View>
    </View>
  );
};
```

### 6. CoachDashboard (AI Coach & Programs)

**Purpose**: AI-powered coaching with personalized meal and workout programs
**Mobile Priority**: **HIGH** - Personalized guidance system

#### Core Functionality
- **AI Coach Integration**: Personalized health and fitness coaching
- **Program Management**: Meal and workout program creation and tracking
- **Progress Assessment**: Coach-driven progress evaluation
- **Recommendation Engine**: AI-powered health recommendations

#### Mobile Coach Interface
```typescript
const CoachDashboard: React.FC<CoachDashboardProps> = ({
  coachModel,
  onProgramUpdate,
  onCoachInteraction
}) => {
  return (
    <ScrollView style={styles.coachContainer}>
      {/* Coach Avatar & Status */}
      <View style={styles.coachHeader}>
        <Image source={{ uri: coachAvatar }} style={styles.coachAvatar} />
        <View style={styles.coachInfo}>
          <Text style={styles.coachName}>Your AI Coach</Text>
          <Text style={styles.coachStatus}>Online • Ready to help</Text>
        </View>
        <TouchableOpacity style={styles.chatButton} onPress={onCoachInteraction}>
          <Icon name="message-circle" size={24} color="#4285f4" />
        </TouchableOpacity>
      </View>

      {/* Today's Coaching */}
      <View style={styles.todaysCoaching}>
        <Text style={styles.sectionTitle}>Today's Guidance</Text>
        <CoachingCard
          type="workout"
          title="Adjust Today's Workout"
          message="Based on yesterday's performance, I recommend reducing intensity by 10%"
          onAction={handleWorkoutAdjustment}
        />
        <CoachingCard
          type="nutrition"
          title="Meal Plan Update"
          message="Your protein intake is below target. Let me suggest some adjustments."
          onAction={handleNutritionAdjustment}
        />
      </View>

      {/* Active Programs */}
      <View style={styles.activePrograms}>
        <Text style={styles.sectionTitle}>Active Programs</Text>
        <ProgramCard
          type="meal"
          program={activeMealProgram}
          progress={mealProgramProgress}
          onView={viewMealProgram}
        />
        <ProgramCard
          type="workout"
          program={activeWorkoutProgram}
          progress={workoutProgramProgress}
          onView={viewWorkoutProgram}
        />
      </View>
    </ScrollView>
  );
};
```

### 7. ParentDashboard (Family & Child Health)

**Purpose**: Family health monitoring with child health tracking and parental controls
**Mobile Priority**: **MEDIUM** - Family-focused health management

#### Core Functionality
- **Child Health Profiles**: Multiple child health monitoring
- **Family Meal Planning**: Family-wide nutrition planning
- **Growth Tracking**: Child development and growth metrics
- **Safety Controls**: Parental controls and privacy settings

#### Mobile Family Interface
```typescript
const ParentDashboard: React.FC<ParentDashboardProps> = ({
  childProfiles,
  onChildSelect,
  onAddChild
}) => {
  return (
    <ScrollView style={styles.parentContainer}>
      {/* Family Overview */}
      <View style={styles.familyOverview}>
        <Text style={styles.familyTitle}>Family Health Hub</Text>
        <Text style={styles.memberCount}>{childProfiles.length} family members</Text>
      </View>

      {/* Child Profiles */}
      <View style={styles.childProfiles}>
        <Text style={styles.sectionTitle}>Family Members</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {childProfiles.map(child => (
            <ChildProfileCard
              key={child.id}
              child={child}
              onSelect={onChildSelect}
              style={styles.childCard}
            />
          ))}
          <AddChildCard onPress={onAddChild} style={styles.addChildCard} />
        </ScrollView>
      </View>

      {/* Family Activities */}
      <View style={styles.familyActivities}>
        <Text style={styles.sectionTitle}>Family Activities</Text>
        <ActivityCard
          title="Family Meal Planning"
          description="Plan healthy meals for the whole family"
          icon="restaurant"
          onPress={openFamilyMealPlanning}
        />
        <ActivityCard
          title="Active Time"
          description="Track family exercise and outdoor activities"
          icon="fitness"
          onPress={openFamilyFitness}
        />
      </View>
    </ScrollView>
  );
};
```

## Universal React Native Patterns

### Shared Styling System
```typescript
// Dashboard theme for React Native
export const dashboardTheme = {
  colors: {
    primary: '#4285f4',
    secondary: '#34a853',
    background: '#f9fafb',
    surface: '#ffffff',
    text: '#1f2937',
    textSecondary: '#6b7280',
    border: '#e5e7eb',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  
  typography: {
    headerLarge: {
      fontSize: 28,
      fontWeight: '700',
      color: '#1f2937',
    },
    header: {
      fontSize: 24,
      fontWeight: '600',
      color: '#1f2937',
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
      color: '#1f2937',
    },
    body: {
      fontSize: 16,
      fontWeight: '400',
      color: '#374151',
    },
    caption: {
      fontSize: 14,
      fontWeight: '400',
      color: '#6b7280',
    },
  },
  
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
  },
};
```

### Responsive Layout Hook
```typescript
// Custom hook for responsive dashboard layouts
const useDashboardLayout = () => {
  const { width } = useWindowDimensions();
  
  const layout = useMemo(() => {
    if (width < 768) {
      return {
        type: 'mobile' as const,
        columns: 1,
        cardSpacing: 12,
        horizontalPadding: 16,
        showSidebar: false,
      };
    } else if (width < 1024) {
      return {
        type: 'tablet' as const,
        columns: 2,
        cardSpacing: 16,
        horizontalPadding: 24,
        showSidebar: false,
      };
    } else {
      return {
        type: 'desktop' as const,
        columns: 3,
        cardSpacing: 20,
        horizontalPadding: 32,
        showSidebar: true,
      };
    }
  }, [width]);
  
  return layout;
};
```

### Chart Integration for Mobile
```typescript
// Mobile-optimized chart components
import { VictoryChart, VictoryLine, VictoryArea } from 'victory-native';

const MobileChart: React.FC<ChartProps> = ({ data, type, height = 200 }) => {
  return (
    <View style={[styles.chartContainer, { height }]}>
      <VictoryChart
        height={height}
        padding={{ left: 40, right: 20, top: 20, bottom: 40 }}
      >
        {type === 'line' && (
          <VictoryLine
            data={data}
            style={{
              data: { stroke: dashboardTheme.colors.primary, strokeWidth: 2 },
            }}
          />
        )}
        {type === 'area' && (
          <VictoryArea
            data={data}
            style={{
              data: { 
                fill: dashboardTheme.colors.primary, 
                fillOpacity: 0.1,
                stroke: dashboardTheme.colors.primary,
                strokeWidth: 2,
              },
            }}
          />
        )}
      </VictoryChart>
    </View>
  );
};
```

## Implementation Roadmap

### Phase 1: Core Dashboards (MVP)
1. **OverviewDashboard**: Primary health hub with essential metrics
2. **MyProgressDashboard**: Daily progress tracking and action items
3. **ConsumptionDashboard**: Basic nutrition tracking and meal logging

### Phase 2: Enhanced Features
1. **FitnessDashboard**: Workout programs and exercise tracking
2. **ResearchDashboard**: Health research and evidence-based insights
3. **Chart Integration**: Mobile-optimized health data visualization

### Phase 3: Advanced Features
1. **CoachDashboard**: AI coaching and personalized programs
2. **ParentDashboard**: Family health monitoring
3. **Cross-Dashboard Integration**: Seamless data flow between dashboards

### Phase 4: Mobile Optimization
1. **Offline Support**: Cached data and offline functionality
2. **Wearable Integration**: Health device data sync
3. **Advanced Analytics**: Predictive insights and health trends
4. **Social Features**: Family sharing and health community features

## Technical Considerations

### Performance Optimization
- **Lazy Loading**: Dashboard components load on demand
- **Data Caching**: Local storage for frequently accessed health data
- **Image Optimization**: Compressed images for mobile bandwidth
- **Chart Performance**: Optimized charting for smooth mobile interactions

### Platform Integration
- **Health App Sync**: Native integration with Apple Health/Google Fit
- **Device Sensors**: Step counting, heart rate, activity detection
- **Camera Integration**: Food logging, barcode scanning, progress photos
- **Notifications**: Health reminders and achievement celebrations

### Security & Privacy
- **Data Encryption**: End-to-end encryption for health data
- **Local Storage**: Sensitive data stored securely on device
- **Privacy Controls**: Granular privacy settings for family features
- **Compliance**: HIPAA-compliant health data handling

This comprehensive guide provides the foundation for converting all dashboard components to React Native while maintaining the rich functionality and user experience of the original web application.