import React, { useContext, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from './shared';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { hasFamilyAccess, hasCoachAccess } from '../utils/capabilities';
import PlansModal from './PlansModal';
import { RootStackParamList } from '../types/navigation';

export type DashboardContext = 'personal' | 'family' | 'coach';

interface DashboardSwitcherProps {
  currentContext: DashboardContext;
  onContextChange: (context: DashboardContext) => void;
}

export const DashboardSwitcher: React.FC<DashboardSwitcherProps> = ({
  currentContext,
  onContextChange,
}) => {
  const { theme } = useTheme();
  const { user } = useContext(AuthContext);
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [showPlansModal, setShowPlansModal] = useState(false);
  const [pendingContext, setPendingContext] = useState<DashboardContext | null>(null);

  if (!user) return null;

  const handleTabPress = (tabId: DashboardContext, hasAccess: boolean) => {
    if (hasAccess) {
      onContextChange(tabId);
    } else {
      // User doesn't have access - show plans modal
      setPendingContext(tabId);
      setShowPlansModal(true);
    }
  };

  const handleEnrollment = (type: 'coach' | 'family') => {
    setShowPlansModal(false);
    // Navigate to enrollment screen
    navigation.navigate('Enrollment');
  };

  const tabs: Array<{
    id: DashboardContext;
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    available: boolean;
  }> = [
    {
      id: 'personal',
      label: 'Personal',
      icon: 'person',
      available: true, // Always available
    },
    // Only show Family tab if user has family access AND not currently in coach context
    ...(hasFamilyAccess(user) && currentContext !== 'coach' ? [{
      id: 'family' as DashboardContext,
      label: 'Family',
      icon: 'people' as keyof typeof Ionicons.glyphMap,
      available: true,
    }] : []),
    // Only show Coach tab if user has coach access AND not currently in family context
    ...(hasCoachAccess(user) && currentContext !== 'family' ? [{
      id: 'coach' as DashboardContext,
      label: 'Coach',
      icon: 'briefcase' as keyof typeof Ionicons.glyphMap,
      available: true,
    }] : []),
  ];

  // Always show all tabs, but handle locked ones differently
  // Always render the white safe area bar, even if tabs are hidden
  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.tabContainer}>
          {tabs.map(tab => {
            const isActive = currentContext === tab.id;
            const isLocked = !tab.available && tab.id !== 'personal';
            return (
              <TouchableOpacity
                key={tab.id}
                style={[
                  styles.tab,
                  isActive && styles.activeTab,
                  isLocked && styles.lockedTab,
                ]}
                onPress={() => handleTabPress(tab.id, tab.available)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={isLocked ? 'lock-closed' : tab.icon}
                  size={20}
                  color={isActive ? '#3b82f6' : isLocked ? '#9ca3af' : '#6b7280'}
                />
                <Text style={[
                  styles.tabLabel,
                  isActive && styles.activeTabLabel,
                  isLocked && styles.lockedTabLabel,
                ]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
      
      {/* Plans Modal for upgrading */}
      <PlansModal
        visible={showPlansModal}
        onClose={() => setShowPlansModal(false)}
        onEnrollment={handleEnrollment}
        title={pendingContext === 'coach' ? 'Become a Coach' : 'Family Plans'}
        subtitle={pendingContext === 'coach' 
          ? 'Start coaching clients with WiHY' 
          : 'Manage your family\'s health together'}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    // backgroundColor: '#ffffff', // theme.colors.surface
  },
  container: {
    // backgroundColor: '#ffffff', // theme.colors.surface
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingHorizontal: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    // backgroundColor: '#f3f4f6', // theme.colors.surface // Use theme.colors.background
    gap: 6,
  },
  activeTab: {
    backgroundColor: '#dbeafe',
  },
  lockedTab: {
    // backgroundColor: '#f9fafb', // theme.colors.surface // Use theme.colors.surface
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  activeTabLabel: {
    color: '#3b82f6',
  },
  lockedTabLabel: {
    color: '#9ca3af',
  },
});
