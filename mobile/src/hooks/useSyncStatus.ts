/**
 * useSyncStatus Hook
 * 
 * Provides real-time sync status for UI components.
 * Shows pending items, sync progress, and connectivity.
 * 
 * Usage:
 *   const { isOnline, isSyncing, pendingCount, forceSync } = useSyncStatus();
 */

import { useState, useEffect, useCallback } from 'react';
import { syncEngine, SyncStatus } from '../services/sync/syncEngine';
import { connectivityService, ConnectivityInfo } from '../services/connectivity/connectivityService';

interface UseSyncStatusReturn extends SyncStatus {
  connectivity: ConnectivityInfo;
  forceSync: () => Promise<void>;
  clearQueue: () => Promise<void>;
}

export function useSyncStatus(): UseSyncStatusReturn {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: true,
    isSyncing: false,
    pendingCount: 0,
    failedCount: 0,
  });
  
  const [connectivity, setConnectivity] = useState<ConnectivityInfo>({
    isOnline: true,
    type: 'unknown',
    isWifi: false,
    isCellular: false,
  });

  // Subscribe to sync status changes
  useEffect(() => {
    // Get initial status
    syncEngine.getStatus().then(setSyncStatus);
    
    // Subscribe to updates
    const unsubscribe = syncEngine.subscribe(setSyncStatus);
    return unsubscribe;
  }, []);

  // Subscribe to connectivity changes
  useEffect(() => {
    const unsubscribe = connectivityService.subscribe(setConnectivity);
    return unsubscribe;
  }, []);

  const forceSync = useCallback(async () => {
    await syncEngine.forceSync();
  }, []);

  const clearQueue = useCallback(async () => {
    await syncEngine.clearQueue();
  }, []);

  return {
    ...syncStatus,
    connectivity,
    forceSync,
    clearQueue,
  };
}

export default useSyncStatus;
