/**
 * OfflineIndicator Component
 * 
 * Shows a banner when the app is offline and sync status.
 * Automatically hides when online with no pending syncs.
 * 
 * Usage:
 *   <OfflineIndicator />  // Place at top of app
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '../shared';
import { useSyncStatus } from '../../hooks/useSyncStatus';

interface OfflineIndicatorProps {
  showPendingCount?: boolean;
  onPress?: () => void;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  showPendingCount = true,
  onPress,
}) => {
  const { isOnline, isSyncing, pendingCount, failedCount, forceSync } = useSyncStatus();

  // Don't show if online and no pending items
  if (isOnline && pendingCount === 0 && failedCount === 0) {
    return null;
  }

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else if (isOnline && pendingCount > 0) {
      forceSync();
    }
  };

  const getBackgroundColor = () => {
    if (!isOnline) return '#6b7280'; // Gray - offline
    if (failedCount > 0) return '#ef4444'; // Red - errors
    if (isSyncing) return '#3b82f6'; // Blue - syncing
    if (pendingCount > 0) return '#f59e0b'; // Amber - pending
    return '#10b981'; // Green - all good
  };

  const getMessage = () => {
    if (!isOnline) return 'You\'re offline';
    if (isSyncing) return 'Syncing...';
    if (failedCount > 0) return `${failedCount} sync failed`;
    if (pendingCount > 0) return `${pendingCount} pending`;
    return 'All synced';
  };

  const getIcon = () => {
    if (!isOnline) return 'cloud-offline-outline';
    if (isSyncing) return 'sync-outline';
    if (failedCount > 0) return 'alert-circle-outline';
    if (pendingCount > 0) return 'cloud-upload-outline';
    return 'checkmark-circle-outline';
  };

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: getBackgroundColor() }]}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <Ionicons name={getIcon() as any} size={16} color="#ffffff" />
      <Text style={styles.text}>{getMessage()}</Text>
      {showPendingCount && pendingCount > 0 && !isSyncing && isOnline && (
        <Text style={styles.tapText}>Tap to sync</Text>
      )}
    </TouchableOpacity>
  );
};

/**
 * Compact version for use in headers
 */
export const OfflineIndicatorCompact: React.FC = () => {
  const { isOnline, isSyncing, pendingCount } = useSyncStatus();

  if (isOnline && pendingCount === 0) {
    return null;
  }

  return (
    <View style={styles.compactContainer}>
      <Ionicons
        name={!isOnline ? 'cloud-offline' : isSyncing ? 'sync' : 'cloud-upload'}
        size={18}
        color={!isOnline ? '#6b7280' : isSyncing ? '#3b82f6' : '#f59e0b'}
      />
      {pendingCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{pendingCount > 99 ? '99+' : pendingCount}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 8,
  },
  text: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  tapText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
  },
  compactContainer: {
    position: 'relative',
    padding: 4,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -6,
    backgroundColor: '#ef4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
});

export default OfflineIndicator;
