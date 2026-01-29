import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Ionicons } from '../components/shared';
import {
  fitnessService,
  nutritionService,
  coachService,
  mealService,
  shoppingService,
  weatherService,
  researchService,
  scanService,
  chatService,
} from '../services';

interface TestResult {
  name: string;
  status: 'pending' | 'running' | 'success' | 'error' | 'skipped';
  message?: string;
  duration?: number;
  category: string;
}

interface TestCategory {
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  expanded: boolean;
}

const TEST_CATEGORIES: Record<string, TestCategory> = {
  fitness: { name: 'Fitness Service', icon: 'barbell', color: '#3b82f6', expanded: true },
  nutrition: { name: 'Nutrition Service', icon: 'nutrition', color: '#22c55e', expanded: true },
  meals: { name: 'Meal Service', icon: 'restaurant', color: '#f59e0b', expanded: true },
  shopping: { name: 'Shopping Service', icon: 'cart', color: '#8b5cf6', expanded: true },
  coach: { name: 'Coach Service', icon: 'people', color: '#ec4899', expanded: true },
  weather: { name: 'Weather Service', icon: 'cloud', color: '#06b6d4', expanded: true },
  research: { name: 'Research Service', icon: 'library', color: '#6366f1', expanded: true },
  scan: { name: 'Scan Service', icon: 'scan', color: '#ef4444', expanded: true },
  chat: { name: 'Chat Service', icon: 'chatbubbles', color: '#14b8a6', expanded: true },
};

const INITIAL_TESTS: TestResult[] = [
  // Fitness Service Tests
  { name: 'Get Profile', status: 'pending', category: 'fitness' },
  { name: 'Get Today Workout', status: 'pending', category: 'fitness' },
  { name: 'List Programs', status: 'pending', category: 'fitness' },
  { name: 'Get Muscle Groups', status: 'pending', category: 'fitness' },
  { name: 'Get Exercise Library', status: 'pending', category: 'fitness' },
  { name: 'Start/Cancel Session', status: 'pending', category: 'fitness' },
  { name: 'Get Workout History', status: 'pending', category: 'fitness' },
  { name: 'Get Stretch Coverage', status: 'pending', category: 'fitness' },

  // Nutrition Service Tests
  { name: 'Get Daily Summary', status: 'pending', category: 'nutrition' },
  { name: 'Get Weekly Trends', status: 'pending', category: 'nutrition' },
  { name: 'Get Nutrition Goals', status: 'pending', category: 'nutrition' },
  { name: 'Get Meal History', status: 'pending', category: 'nutrition' },
  { name: 'Log Water (250ml)', status: 'pending', category: 'nutrition' },

  // Meal Service Tests
  { name: 'Search Recipes', status: 'pending', category: 'meals' },
  { name: 'List Meal Programs', status: 'pending', category: 'meals' },
  { name: 'Get Meal Templates', status: 'pending', category: 'meals' },

  // Shopping Service Tests
  { name: 'Create Shopping List', status: 'pending', category: 'shopping' },
  { name: 'Get List by Category', status: 'pending', category: 'shopping' },

  // Coach Service Tests (Coach Only)
  { name: 'List Clients', status: 'pending', category: 'coach' },
  { name: 'Get Client Dashboard', status: 'pending', category: 'coach' },
  { name: 'Get Pending Invitations', status: 'pending', category: 'coach' },
  { name: 'Get Coach Overview', status: 'pending', category: 'coach' },

  // Weather Service Tests
  { name: 'Get Current Location', status: 'pending', category: 'weather' },
  { name: 'Get Current Weather', status: 'pending', category: 'weather' },
  { name: 'Get Weather Forecast', status: 'pending', category: 'weather' },

  // Research Service Tests
  { name: 'Search Articles', status: 'pending', category: 'research' },
  { name: 'Get Categories', status: 'pending', category: 'research' },

  // Scan Service Tests
  { name: 'Barcode Scan (Test)', status: 'pending', category: 'scan' },
  
  // Chat Service Tests
  { name: 'Ask Question', status: 'pending', category: 'chat' },
];

export default function IntegrationTestScreen() {
  const { userId, coachId, isCoach } = useAuth();
  const { theme } = useTheme();
  const [tests, setTests] = useState<TestResult[]>(INITIAL_TESTS);
  const [running, setRunning] = useState(false);
  const [categories, setCategories] = useState(TEST_CATEGORIES);
  const [refreshing, setRefreshing] = useState(false);

  // Temp storage for cross-test data
  const testData = React.useRef<{
    shoppingListId?: string;
    clientId?: string;
  }>({});

  const updateTest = (index: number, updates: Partial<TestResult>) => {
    setTests(prev => prev.map((test, i) => (i === index ? { ...test, ...updates } : test)));
  };

  const toggleCategory = (categoryKey: string) => {
    setCategories(prev => ({
      ...prev,
      [categoryKey]: { ...prev[categoryKey], expanded: !prev[categoryKey].expanded },
    }));
  };

  const resetTests = useCallback(() => {
    setTests(INITIAL_TESTS);
    testData.current = {};
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    resetTests();
    setRefreshing(false);
  }, [resetTests]);

  const runTest = async (index: number, testFn: () => Promise<string>) => {
    const testName = tests[index]?.name || `Test ${index + 1}`;
    const startTime = Date.now();
    updateTest(index, { status: 'running' });

    try {
      const message = await testFn();
      const duration = Date.now() - startTime;
      console.log(`✅ ${testName}: PASSED (${duration}ms) - ${message}`);
      updateTest(index, { status: 'success', message, duration });
      return true;
    } catch (error) {
      const duration = Date.now() - startTime;
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ ${testName}: FAILED (${duration}ms)`);
      console.error('Error details:', error);
      updateTest(index, { status: 'error', message, duration });
      return false;
    }
  };

  const skipTest = (index: number, reason: string) => {
    updateTest(index, { status: 'skipped', message: reason });
  };

  const runAllTests = async () => {
    console.log('\n========== INTEGRATION TESTS STARTING ==========');
    console.log('User ID:', userId);
    console.log('Coach ID:', coachId);
    console.log('Is Coach:', isCoach);
    console.log('================================================\n');

    setRunning(true);
    resetTests();

    let testIndex = 0;

    // ============= FITNESS SERVICE TESTS =============
    console.log('\n--- FITNESS SERVICE ---');

    // Get Profile
    await runTest(testIndex++, async () => {
      const profile = await fitnessService.getProfile(userId);
      console.log('[Fitness] Profile:', JSON.stringify(profile, null, 2));
      return profile?.name ? `Profile: ${profile.name}` : 'Profile loaded';
    });

    // Get Today Workout
    let workoutId: string | undefined;
    await runTest(testIndex++, async () => {
      const workout = await fitnessService.getTodayWorkout(userId);
      console.log('[Fitness] Today Workout:', JSON.stringify(workout, null, 2));
      workoutId = workout?.workout_id;
      return `${workout?.exercises?.length || 0} exercises, ${workout?.estimated_duration_min || 0} min`;
    });

    // List Programs
    await runTest(testIndex++, async () => {
      const programs = await fitnessService.listPrograms(userId);
      console.log('[Fitness] Programs:', JSON.stringify(programs, null, 2));
      return `${programs?.programs?.length || 0} programs found`;
    });

    // Get Muscle Groups
    await runTest(testIndex++, async () => {
      const groups = await fitnessService.getMuscleGroups();
      console.log('[Fitness] Muscle Groups:', JSON.stringify(groups, null, 2));
      return `${groups?.length || 0} muscle groups`;
    });

    // Get Exercise Library
    await runTest(testIndex++, async () => {
      const library = await fitnessService.getExerciseLibrary({ target: 'chest' });
      console.log('[Fitness] Exercise Library:', JSON.stringify(library, null, 2));
      return `${library?.exercises?.length || library?.total || 0} exercises for chest`;
    });

    // Start/Cancel Session
    await runTest(testIndex++, async () => {
      if (!workoutId) throw new Error('No workout ID from previous test');
      const session = await fitnessService.startSession({ userId, workoutId });
      console.log('[Fitness] Session started:', JSON.stringify(session, null, 2));
      if (!session?.id) throw new Error('No session ID returned');
      await fitnessService.cancelSession(session.id);
      return `Session ${session.id} created & cancelled`;
    });

    // Get Workout History
    await runTest(testIndex++, async () => {
      const history = await fitnessService.getHistory(userId, 10);
      console.log('[Fitness] History:', JSON.stringify(history, null, 2));
      const count = history?.sessions?.length || history?.data?.length || 0;
      return `${count} sessions in history`;
    });

    // Get Stretch Coverage
    await runTest(testIndex++, async () => {
      const coverage = await fitnessService.getStretchCoverage(userId);
      console.log('[Fitness] Stretch Coverage:', JSON.stringify(coverage, null, 2));
      return 'Stretch coverage loaded';
    });

    // ============= NUTRITION SERVICE TESTS =============
    console.log('\n--- NUTRITION SERVICE ---');

    // Get Daily Summary
    await runTest(testIndex++, async () => {
      const summary = await nutritionService.getDailySummary(userId);
      console.log('[Nutrition] Daily Summary:', JSON.stringify(summary, null, 2));
      return `${summary?.totals?.calories || 0} calories today`;
    });

    // Get Weekly Trends
    await runTest(testIndex++, async () => {
      const trends = await nutritionService.getWeeklyTrends(userId);
      console.log('[Nutrition] Weekly Trends:', JSON.stringify(trends, null, 2));
      return `Avg ${trends?.daily_averages?.calories || 0} cal/day`;
    });

    // Get Nutrition Goals
    await runTest(testIndex++, async () => {
      const goals = await nutritionService.getGoals(userId);
      console.log('[Nutrition] Goals:', JSON.stringify(goals, null, 2));
      return `Goal: ${goals?.daily_calories || 'not set'} cal`;
    });

    // Get Meal History
    await runTest(testIndex++, async () => {
      const history = await nutritionService.getHistory(userId);
      console.log('[Nutrition] History:', JSON.stringify(history, null, 2));
      const count = history?.meals?.length || history?.data?.length || 0;
      return `${count} meals in history`;
    });

    // Log Water
    await runTest(testIndex++, async () => {
      const result = await nutritionService.logWater({ userId, amountMl: 250 });
      console.log('[Nutrition] Water logged:', JSON.stringify(result, null, 2));
      return '250ml water logged';
    });

    // ============= MEAL SERVICE TESTS =============
    console.log('\n--- MEAL SERVICE ---');

    // Search Recipes
    await runTest(testIndex++, async () => {
      const recipes = await mealService.searchRecipes({ q: 'chicken', limit: 5 });
      console.log('[Meals] Search Results:', JSON.stringify(recipes, null, 2));
      return `Found ${recipes?.length || 0} recipes for "chicken"`;
    });

    // List Meal Programs
    await runTest(testIndex++, async () => {
      const programs = await mealService.listPrograms({ limit: 10 });
      console.log('[Meals] Programs:', JSON.stringify(programs, null, 2));
      const count = programs?.length || 0;
      return `${count} meal programs`;
    });

    // Get Meal Templates
    await runTest(testIndex++, async () => {
      const templates = await mealService.getTemplates();
      console.log('[Meals] Templates:', JSON.stringify(templates, null, 2));
      const count = templates?.length || 0;
      return `${count} meal templates`;
    });

    // ============= SHOPPING SERVICE TESTS =============
    console.log('\n--- SHOPPING SERVICE ---');

    // Create Shopping List
    await runTest(testIndex++, async () => {
      const list = await shoppingService.createList({
        userId,
        name: 'Integration Test List',
        items: [
          { name: 'Chicken Breast', item_name: 'Chicken Breast', quantity: '2 lbs', category: 'Proteins' },
          { name: 'Spinach', item_name: 'Spinach', quantity: '1 bunch', category: 'Produce' },
          { name: 'Greek Yogurt', item_name: 'Greek Yogurt', quantity: '32 oz', category: 'Dairy' },
        ],
      });
      console.log('[Shopping] List created:', JSON.stringify(list, null, 2));
      testData.current.shoppingListId = list?.id || list?.data?.id;
      return `List ${testData.current.shoppingListId} created`;
    });

    // Get List by Category
    await runTest(testIndex++, async () => {
      if (!testData.current.shoppingListId) throw new Error('No list ID from previous test');
      const categorized = await shoppingService.getByCategory(testData.current.shoppingListId);
      console.log('[Shopping] By Category:', JSON.stringify(categorized, null, 2));
      const categoryCount = Object.keys(categorized || {}).length;
      return `${categoryCount} categories`;
    });

    // ============= COACH SERVICE TESTS =============
    console.log('\n--- COACH SERVICE ---');

    if (isCoach && coachId) {
      // List Clients
      await runTest(testIndex++, async () => {
        const clients = await coachService.listClients(coachId);
        console.log('[Coach] Clients:', JSON.stringify(clients, null, 2));
        if (clients?.length > 0) {
          testData.current.clientId = clients[0].id;
        }
        return `${clients?.length || 0} clients`;
      });

      // Get Client Dashboard
      await runTest(testIndex++, async () => {
        if (!testData.current.clientId) {
          return 'Skipped - no clients';
        }
        const dashboard = await coachService.getClientDashboard(coachId, testData.current.clientId);
        console.log('[Coach] Client Dashboard:', JSON.stringify(dashboard, null, 2));
        return `Dashboard for ${dashboard?.client?.name || 'client'}`;
      });

      // Get Pending Invitations
      await runTest(testIndex++, async () => {
        const invitations = await coachService.getPendingInvitations(coachId);
        console.log('[Coach] Invitations:', JSON.stringify(invitations, null, 2));
        return `${invitations?.length || 0} pending invitations`;
      });

      // Get Coach Overview
      await runTest(testIndex++, async () => {
        const overview = await coachService.getCoachOverview(coachId);
        console.log('[Coach] Overview:', JSON.stringify(overview, null, 2));
        return `${overview?.total_clients || 0} total clients`;
      });
    } else {
      skipTest(testIndex++, 'Skipped (not a coach)');
      skipTest(testIndex++, 'Skipped (not a coach)');
      skipTest(testIndex++, 'Skipped (not a coach)');
      skipTest(testIndex++, 'Skipped (not a coach)');
    }

    // ============= WEATHER SERVICE TESTS =============
    console.log('\n--- WEATHER SERVICE ---');

    let weatherLocation: { latitude: number; longitude: number } | undefined;

    // Get Current Location
    await runTest(testIndex++, async () => {
      const location = await weatherService.getCurrentLocation();
      console.log('[Weather] Location:', JSON.stringify(location, null, 2));
      weatherLocation = location;
      return `${location?.city || 'Unknown'}, ${location?.region || location?.country || ''}`;
    });

    // Get Current Weather
    await runTest(testIndex++, async () => {
      const lat = weatherLocation?.latitude || 40.7128;
      const lon = weatherLocation?.longitude || -74.006;
      const weather = await weatherService.getCurrentWeather(lat, lon);
      console.log('[Weather] Current:', JSON.stringify(weather, null, 2));
      return `${weather?.temperature}°, ${weather?.condition}`;
    });

    // Get Weather Forecast
    await runTest(testIndex++, async () => {
      const lat = weatherLocation?.latitude || 40.7128;
      const lon = weatherLocation?.longitude || -74.006;
      const forecast = await weatherService.getForecast(lat, lon);
      console.log('[Weather] Forecast:', JSON.stringify(forecast, null, 2));
      return `${forecast?.length || 0} day forecast`;
    });

    // ============= RESEARCH SERVICE TESTS =============
    console.log('\n--- RESEARCH SERVICE ---');

    // Search Articles
    await runTest(testIndex++, async () => {
      const articles = await researchService.searchArticles({
        query: 'nutrition health',
        limit: 5,
      });
      console.log('[Research] Articles:', JSON.stringify(articles, null, 2));
      return `Found ${articles?.length || 0} articles`;
    });

    // Get Categories
    await runTest(testIndex++, async () => {
      const cats = researchService.getCategories();
      console.log('[Research] Categories:', JSON.stringify(cats, null, 2));
      return `${cats?.length || 0} categories`;
    });

    // ============= SCAN SERVICE TESTS =============
    console.log('\n--- SCAN SERVICE ---');

    // Barcode Scan (Test with known barcode)
    await runTest(testIndex++, async () => {
      // Using a common test barcode (Cheerios)
      const result = await scanService.scanBarcode('016000275287') as any;
      console.log('[Scan] Barcode Result:', JSON.stringify(result, null, 2));
      if (!result?.success && result?.error) {
        return `API responded: ${result.error}`;
      }
      return result?.product_name || result?.analysis?.summary?.product_name || 'Scan completed';
    });

    // ============= CHAT SERVICE TESTS =============
    console.log('\n--- CHAT SERVICE ---');

    // Ask Question
    await runTest(testIndex++, async () => {
      const response = await chatService.ask('What are the benefits of protein?');
      console.log('[Chat] Response:', JSON.stringify(response, null, 2));
      if (!response?.success) throw new Error(response?.error || 'Chat failed');
      return `Response: ${response.response?.substring(0, 50)}...`;
    });

    setRunning(false);

    // Calculate results
    const passed = tests.filter(t => t.status === 'success').length;
    const failed = tests.filter(t => t.status === 'error').length;
    const skipped = tests.filter(t => t.status === 'skipped').length;

    console.log('\n========== TESTS COMPLETE ==========');
    console.log(`Passed: ${passed}, Failed: ${failed}, Skipped: ${skipped}`);
    console.log('====================================\n');

    Alert.alert(
      'Tests Complete',
      `✅ Passed: ${passed}\n❌ Failed: ${failed}\n⏭️ Skipped: ${skipped}`
    );
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pending':
        return <Ionicons name="ellipse-outline" size={18} color="#9ca3af" />;
      case 'running':
        return <ActivityIndicator size="small" color="#3b82f6" />;
      case 'success':
        return <Ionicons name="checkmark-circle" size={18} color="#10b981" />;
      case 'error':
        return <Ionicons name="close-circle" size={18} color="#ef4444" />;
      case 'skipped':
        return <Ionicons name="remove-circle" size={18} color="#f59e0b" />;
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'pending':
        return '#f9fafb';
      case 'running':
        return '#dbeafe';
      case 'success':
        return '#d1fae5';
      case 'error':
        return '#fee2e2';
      case 'skipped':
        return '#fef3c7';
      default:
        return '#f9fafb';
    }
  };

  const passedTests = tests.filter(t => t.status === 'success').length;
  const failedTests = tests.filter(t => t.status === 'error').length;
  const skippedTests = tests.filter(t => t.status === 'skipped').length;

  // Group tests by category
  const testsByCategory = tests.reduce((acc, test, index) => {
    if (!acc[test.category]) acc[test.category] = [];
    acc[test.category].push({ ...test, index });
    return acc;
  }, {} as Record<string, (TestResult & { index: number })[]>);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>API Integration Tests</Text>
        <Text style={styles.headerSubtitle}>Test all backend endpoints</Text>
      </View>

      {/* User Info */}
      <View style={styles.userInfo}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>User ID:</Text>
          <Text style={styles.infoValue} numberOfLines={1}>
            {userId?.substring(0, 20)}...
          </Text>
        </View>
        {isCoach && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Coach ID:</Text>
            <Text style={styles.infoValue} numberOfLines={1}>
              {coachId?.substring(0, 20)}...
            </Text>
          </View>
        )}
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Role:</Text>
          <Text style={[styles.infoValue, { color: isCoach ? '#8b5cf6' : '#3b82f6' }]}>
            {isCoach ? '👨‍🏫 Coach' : '👤 User'}
          </Text>
        </View>
      </View>

      {/* Test Results Summary */}
      <View style={styles.summary}>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryCount, { color: '#10b981' }]}>{passedTests}</Text>
          <Text style={styles.summaryLabel}>Passed</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryCount, { color: '#ef4444' }]}>{failedTests}</Text>
          <Text style={styles.summaryLabel}>Failed</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryCount, { color: '#f59e0b' }]}>{skippedTests}</Text>
          <Text style={styles.summaryLabel}>Skipped</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryCount}>{tests.length}</Text>
          <Text style={styles.summaryLabel}>Total</Text>
        </View>
      </View>

      {/* Run Tests Button */}
      <TouchableOpacity
        style={[styles.runButton, running && styles.runButtonDisabled]}
        onPress={runAllTests}
        disabled={running}
      >
        {running ? (
          <>
            <ActivityIndicator size="small" color="#fff" />
            <Text style={styles.runButtonText}>Running Tests...</Text>
          </>
        ) : (
          <>
            <Ionicons name="play" size={20} color="#fff" />
            <Text style={styles.runButtonText}>Run All Tests ({tests.length})</Text>
          </>
        )}
      </TouchableOpacity>

      {/* Test List by Category */}
      <ScrollView
        style={styles.testList}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {Object.entries(testsByCategory).map(([categoryKey, categoryTests]) => {
          const category = categories[categoryKey];
          if (!category) return null;

          const categoryPassed = categoryTests.filter(t => t.status === 'success').length;
          const categoryFailed = categoryTests.filter(t => t.status === 'error').length;

          return (
            <View key={categoryKey} style={styles.categorySection}>
              <TouchableOpacity
                style={styles.categoryHeader}
                onPress={() => toggleCategory(categoryKey)}
              >
                <View style={styles.categoryHeaderLeft}>
                  <View style={[styles.categoryIcon, { backgroundColor: category.color + '20' }]}>
                    <Ionicons name={category.icon} size={18} color={category.color} />
                  </View>
                  <Text style={styles.categoryName}>{category.name}</Text>
                </View>
                <View style={styles.categoryHeaderRight}>
                  <Text style={styles.categoryStats}>
                    {categoryPassed > 0 && (
                      <Text style={{ color: '#10b981' }}>{categoryPassed}✓ </Text>
                    )}
                    {categoryFailed > 0 && (
                      <Text style={{ color: '#ef4444' }}>{categoryFailed}✗</Text>
                    )}
                  </Text>
                  <Ionicons
                    name={category.expanded ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color="#9ca3af"
                  />
                </View>
              </TouchableOpacity>

              {category.expanded && (
                <View style={styles.categoryTests}>
                  {categoryTests.map(test => (
                    <View
                      key={test.index}
                      style={[styles.testItem, { backgroundColor: getStatusColor(test.status) }]}
                    >
                      <View style={styles.testHeader}>
                        {getStatusIcon(test.status)}
                        <Text style={styles.testName}>{test.name}</Text>
                        {test.duration && (
                          <Text style={styles.testDuration}>{test.duration}ms</Text>
                        )}
                      </View>
                      {test.message && (
                        <Text
                          style={[
                            styles.testMessage,
                            test.status === 'error' && styles.testMessageError,
                          ]}
                          numberOfLines={2}
                        >
                          {test.message}
                        </Text>
                      )}
                    </View>
                  ))}
                </View>
              )}
            </View>
          );
        })}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    // backgroundColor: '#fff', // Now using theme.colors.surface dynamically
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#6b7280',
  },
  userInfo: {
    // backgroundColor: '#fff', // Now using theme.colors.surface dynamically
    margin: 12,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
  },
  infoValue: {
    fontSize: 13,
    color: '#111827',
    fontFamily: 'monospace',
    maxWidth: '60%',
  },
  summary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    // backgroundColor: '#fff', // Now using theme.colors.surface dynamically
    marginHorizontal: 12,
    marginBottom: 12,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryCount: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  summaryLabel: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 2,
  },
  runButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    marginHorizontal: 12,
    marginBottom: 12,
    padding: 14,
    borderRadius: 10,
    gap: 8,
  },
  runButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  runButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  testList: {
    flex: 1,
    paddingHorizontal: 12,
  },
  categorySection: {
    marginBottom: 12,
    // backgroundColor: '#fff', // Now using theme.colors.surface dynamically
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#fafafa',
  },
  categoryHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  categoryIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  categoryHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryStats: {
    fontSize: 12,
    fontWeight: '600',
  },
  categoryTests: {
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  testItem: {
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  testHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  testName: {
    fontSize: 13,
    fontWeight: '500',
    color: '#111827',
    flex: 1,
  },
  testMessage: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 4,
    marginLeft: 26,
  },
  testMessageError: {
    color: '#dc2626',
  },
  testDuration: {
    fontSize: 10,
    color: '#9ca3af',
    fontFamily: 'monospace',
  },
});
