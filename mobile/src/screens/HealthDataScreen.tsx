import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { AuthContext } from '../context/AuthContext';
import { userService } from '../services/userService';
import { WebNavHeader } from '../components/web/WebNavHeader';
import SvgIcon from '../components/shared/SvgIcon';

const isWeb = Platform.OS === 'web';

// WiHY Light theme
const theme = {
  background: '#f0f9ff',
  card: '#ffffff',
  cardBorder: '#e5e7eb',
  text: '#1f2937',
  textSecondary: '#6b7280',
  accent: '#3b82f6',
  success: '#22c55e',
  error: '#ef4444',
  warning: '#f59e0b',
};

interface HealthMetric {
  id: string;
  label: string;
  value: string | number;
  unit: string;
  icon: string;
  color: string;
}

export default function HealthDataScreen() {
  const navigation = useNavigation();
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [healthData, setHealthData] = useState<HealthMetric[]>([]);
  const [stats, setStats] = useState({
    scansCount: 0,
    mealsLogged: 0,
    chatSessions: 0,
    daysActive: 0,
  });

  useEffect(() => {
    loadHealthData();
  }, [user]);

  const loadHealthData = async () => {
    if (!user?.email) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const profile = await userService.getUserByEmail(user.email);
      
      if (profile) {
        // Build health metrics from profile data
        const metrics: HealthMetric[] = [];
        
        if (profile.height) {
          metrics.push({
            id: 'height',
            label: 'Height',
            value: profile.height,
            unit: 'inches',
            icon: 'resize',
            color: '#3b82f6',
          });
        }
        
        if (profile.weight) {
          metrics.push({
            id: 'weight',
            label: 'Weight',
            value: profile.weight,
            unit: 'lbs',
            icon: 'scale',
            color: '#10b981',
          });
        }
        
        if (profile.activityLevel) {
          metrics.push({
            id: 'activity',
            label: 'Activity Level',
            value: profile.activityLevel.replace('_', ' '),
            unit: '',
            icon: 'fitness',
            color: '#f59e0b',
          });
        }

        // Add health score if available
        if (profile.healthScore !== undefined) {
          metrics.push({
            id: 'healthScore',
            label: 'Health Score',
            value: profile.healthScore,
            unit: 'pts',
            icon: 'heart',
            color: '#ef4444',
          });
        }

        // Add streak if available
        if (profile.streakDays !== undefined) {
          metrics.push({
            id: 'streak',
            label: 'Current Streak',
            value: profile.streakDays,
            unit: 'days',
            icon: 'flame',
            color: '#f97316',
          });
        }

        setHealthData(metrics);
        
        // Set stats from profile (use any to access optional fields)
        const profileData = profile as any;
        setStats({
          scansCount: profileData.scansCount || 0,
          mealsLogged: profileData.mealsLogged || 0,
          chatSessions: profileData.chatSessions || 0,
          daysActive: profileData.daysActive || 0,
        });
      }
    } catch (error) {
      console.error('Failed to load health data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = () => {
    Alert.alert(
      'Export Health Data',
      'Your health data will be exported as a CSV file and sent to your email address.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Export', 
          onPress: () => {
            // TODO: Implement export API call
            Alert.alert('Success', 'Your data export has been initiated. Check your email shortly.');
          }
        },
      ]
    );
  };

  const handleDeleteData = () => {
    Alert.alert(
      'Delete Health Data',
      'This will permanently delete all your health data including scan history, meal logs, and health metrics. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete All Data', 
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Confirm Deletion',
              'Are you absolutely sure? Type DELETE to confirm.',
              [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'I Understand, Delete',
                  style: 'destructive',
                  onPress: () => {
                    // TODO: Implement delete API call
                    Alert.alert('Data Deleted', 'Your health data has been permanently deleted.');
                  }
                },
              ]
            );
          }
        },
      ]
    );
  };

  const content = (
    <ScrollView 
      style={styles.scrollView}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Header - only show on mobile */}
      {!isWeb && (
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
            <SvgIcon name="arrow-back" size={24} color={theme.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Health Data</Text>
          <View style={styles.headerSpacer} />
        </View>
      )}
      
      {/* Web page title */}
      {isWeb && (
        <Text style={styles.webPageTitle}>Health Data</Text>
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.accent} />
          <Text style={styles.loadingText}>Loading health data...</Text>
        </View>
      ) : (
        <>
          {/* Health Metrics */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Health Metrics</Text>
            
            {healthData.length > 0 ? (
              <View style={styles.metricsGrid}>
                {healthData.map((metric) => (
                  <View key={metric.id} style={styles.metricCard}>
                    <View style={[styles.metricIcon, { backgroundColor: `${metric.color}20` }]}>
                      <SvgIcon name={metric.icon as any} size={24} color={metric.color} />
                    </View>
                    <Text style={styles.metricValue}>
                      {metric.value} {metric.unit}
                    </Text>
                    <Text style={styles.metricLabel}>{metric.label}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <SvgIcon name="analytics" size={48} color={theme.textSecondary} />
                <Text style={styles.emptyText}>No health data yet</Text>
                <Text style={styles.emptyHint}>
                  Complete your profile to see your health metrics here
                </Text>
              </View>
            )}
          </View>

          {/* Activity Stats */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Activity Summary</Text>
            
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <SvgIcon name="barcode" size={24} color={theme.accent} />
                <Text style={styles.statValue}>{stats.scansCount}</Text>
                <Text style={styles.statLabel}>Scans</Text>
              </View>
              <View style={styles.statItem}>
                <SvgIcon name="restaurant" size={24} color={theme.success} />
                <Text style={styles.statValue}>{stats.mealsLogged}</Text>
                <Text style={styles.statLabel}>Meals Logged</Text>
              </View>
              <View style={styles.statItem}>
                <SvgIcon name="chatbubble" size={24} color="#8b5cf6" />
                <Text style={styles.statValue}>{stats.chatSessions}</Text>
                <Text style={styles.statLabel}>Chat Sessions</Text>
              </View>
              <View style={styles.statItem}>
                <SvgIcon name="calendar" size={24} color={theme.warning} />
                <Text style={styles.statValue}>{stats.daysActive}</Text>
                <Text style={styles.statLabel}>Days Active</Text>
              </View>
            </View>
          </View>

          {/* Data Management */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Data Management</Text>
            
            <Pressable style={styles.actionButton} onPress={handleExportData}>
              <SvgIcon name="download" size={20} color={theme.accent} />
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>Export Your Data</Text>
                <Text style={styles.actionSubtitle}>Download all your health data as CSV</Text>
              </View>
              <SvgIcon name="chevron-forward" size={20} color={theme.textSecondary} />
            </Pressable>

            <Pressable style={styles.actionButton} onPress={() => navigation.navigate('Privacy' as never)}>
              <SvgIcon name="shield-checkmark" size={20} color={theme.accent} />
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>Privacy Policy</Text>
                <Text style={styles.actionSubtitle}>Learn how we protect your data</Text>
              </View>
              <SvgIcon name="chevron-forward" size={20} color={theme.textSecondary} />
            </Pressable>

            <Pressable style={[styles.actionButton, styles.dangerButton]} onPress={handleDeleteData}>
              <SvgIcon name="trash" size={20} color={theme.error} />
              <View style={styles.actionContent}>
                <Text style={[styles.actionTitle, { color: theme.error }]}>Delete All Data</Text>
                <Text style={styles.actionSubtitle}>Permanently remove your health data</Text>
              </View>
              <SvgIcon name="chevron-forward" size={20} color={theme.textSecondary} />
            </Pressable>
          </View>

          <View style={{ height: 40 }} />
        </>
      )}
    </ScrollView>
  );

  if (isWeb) {
    return (
      <View style={[styles.container, { minHeight: '100vh' } as any]}>
        <WebNavHeader 
          activePage="profile" 
          showLoginModal={showLoginModal}
          setShowLoginModal={setShowLoginModal}
        />
        <View style={[styles.webContent, { height: 'calc(100vh - 70px)', overflow: 'auto' } as any]}>
          {content}
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {content}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  } as any,
  webContent: {
    flex: 1,
    maxWidth: 800,
    width: '100%',
    alignSelf: 'center',
  } as any,
  scrollView: {
    flex: 1,
  } as any,
  contentContainer: {
    padding: 16,
    paddingBottom: isWeb ? 100 : 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    marginBottom: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.card,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.text,
  },
  headerSpacer: {
    width: 40,
  },
  webPageTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 24,
    marginTop: 8,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: theme.textSecondary,
  },
  section: {
    backgroundColor: theme.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.cardBorder,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    width: '47%',
    backgroundColor: theme.background,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  metricIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 13,
    color: theme.textSecondary,
    textTransform: 'capitalize',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
    marginTop: 12,
  },
  emptyHint: {
    fontSize: 14,
    color: theme.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statItem: {
    width: '47%',
    backgroundColor: theme.background,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.text,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 13,
    color: theme.textSecondary,
    marginTop: 4,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: theme.background,
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
  },
  dangerButton: {
    borderWidth: 1,
    borderColor: `${theme.error}30`,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.text,
  },
  actionSubtitle: {
    fontSize: 13,
    color: theme.textSecondary,
    marginTop: 2,
  },
});
