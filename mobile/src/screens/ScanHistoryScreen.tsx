import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  Pressable,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { wihyApiService } from '../services/wihyApiService';
import { AuthContext } from '../context/AuthContext';
import type { ScanHistoryItem } from '../services/types';

type NavigationProp = StackNavigationProp<RootStackParamList>;

export default function ScanHistoryScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useContext(AuthContext);
  const [scans, setScans] = useState<ScanHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'barcode' | 'image' | 'pill' | 'label'>('all');

  // Update user ID in service when user changes
  useEffect(() => {
    if (user?.email) {
      wihyApiService.setUserId(user.email);
    }
  }, [user?.email]);

  // Load history when screen comes into focus or filter changes
  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [filter])
  );

  const loadHistory = async () => {
    try {
      setLoading(true);
      const scanType = filter === 'all' ? undefined : filter;
      const result = await wihyApiService.getScanHistory(50, scanType, false);

      if (result.success) {
        setScans(result.scans || []);
      }
    } catch (error) {
      console.error('Error loading scan history:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadHistory();
  };

  const handleDeleteScan = (scanId: number) => {
    Alert.alert(
      'Delete Scan',
      'Are you sure you want to remove this scan from your history?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const result = await wihyApiService.deleteScan(scanId);
            if (result.success) {
              setScans(scans.filter(s => s.id !== scanId));
            } else {
              Alert.alert('Error', result.error || 'Failed to delete scan');
            }
          },
        },
      ]
    );
  };

  const getScanIcon = (scanType: string) => {
    switch (scanType) {
      case 'barcode':
        return 'barcode';
      case 'image':
        return 'restaurant';
      case 'pill':
        return 'medical';
      case 'label':
        return 'document-text';
      default:
        return 'scan';
    }
  };

  const getScanColor = (scanType: string) => {
    switch (scanType) {
      case 'barcode':
        return '#3b82f6';
      case 'image':
        return '#10b981';
      case 'pill':
        return '#f59e0b';
      case 'label':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const getGradeColor = (grade?: string) => {
    if (!grade) return '#6b7280';
    switch (grade.toUpperCase()) {
      case 'A':
        return '#10b981';
      case 'B':
        return '#84cc16';
      case 'C':
        return '#eab308';
      case 'D':
        return '#f97316';
      case 'F':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const renderScanItem = ({ item }: { item: ScanHistoryItem }) => {
    const scanColor = getScanColor(item.scan_type);
    const gradeColor = item.health_score !== undefined ? getGradeColor(String.fromCharCode(65 + Math.floor((100 - item.health_score) / 20))) : undefined;

    return (
      <Pressable
        style={styles.scanCard}
        onLongPress={() => handleDeleteScan(item.id)}
      >
        <View style={styles.scanHeader}>
          <View style={[styles.iconContainer, { backgroundColor: scanColor + '20' }]}>
            <Ionicons name={getScanIcon(item.scan_type) as any} size={24} color={scanColor} />
          </View>
          <View style={styles.scanInfo}>
            <Text style={styles.scanTitle}>
              {item.product?.name || item.medication?.name || 'Scan'}
            </Text>
            <Text style={styles.scanDate}>
              {new Date(item.scan_timestamp).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
              })}
            </Text>
          </View>
          {item.health_score !== undefined && (
            <View style={[styles.scoreBadge, { backgroundColor: gradeColor }]}>
              <Text style={styles.scoreText}>{item.health_score}</Text>
            </View>
          )}
        </View>

        {item.image_url && (
          <Image source={{ uri: item.image_url }} style={styles.scanImage} />
        )}

        {item.product?.detected_items && (
          <View style={styles.detectedItems}>
            <Text style={styles.detectedItemsText}>
              Detected: {item.product.detected_items.join(', ')}
            </Text>
          </View>
        )}

        {item.medication && (
          <View style={styles.medicationInfo}>
            <Text style={styles.medicationText}>RxCUI: {item.medication.rxcui}</Text>
          </View>
        )}
      </Pressable>
    );
  };

  const FilterButton = ({ 
    label, 
    value, 
    icon 
  }: { 
    label: string; 
    value: typeof filter; 
    icon: string;
  }) => (
    <Pressable
      style={[
        styles.filterButton,
        filter === value && styles.filterButtonActive,
      ]}
      onPress={() => setFilter(value)}
    >
      <Ionicons 
        name={icon as any} 
        size={18} 
        color={filter === value ? '#fff' : '#6b7280'} 
      />
      <Text style={[
        styles.filterButtonText,
        filter === value && styles.filterButtonTextActive,
      ]}>
        {label}
      </Text>
    </Pressable>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading history...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </Pressable>
        <Text style={styles.headerTitle}>Scan History</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <FilterButton label="All" value="all" icon="grid" />
        <FilterButton label="Barcodes" value="barcode" icon="barcode" />
        <FilterButton label="Photos" value="image" icon="restaurant" />
        <FilterButton label="Pills" value="pill" icon="medical" />
        <FilterButton label="Labels" value="label" icon="document-text" />
      </View>

      {/* Scan List */}
      <FlatList
        data={scans}
        renderItem={renderScanItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="scan" size={64} color="#d1d5db" />
            <Text style={styles.emptyText}>No scans yet</Text>
            <Text style={styles.emptySubtext}>
              Your scan history will appear here
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginRight: 40,
  },
  headerSpacer: {
    width: 40,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    gap: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    gap: 4,
  },
  filterButtonActive: {
    backgroundColor: '#3b82f6',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  listContent: {
    padding: 16,
  },
  scanCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  scanHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanInfo: {
    flex: 1,
    marginLeft: 12,
  },
  scanTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  scanDate: {
    fontSize: 14,
    color: '#6b7280',
  },
  scoreBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  scoreText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  scanImage: {
    width: '100%',
    height: 180,
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: '#f3f4f6',
  },
  detectedItems: {
    padding: 12,
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  detectedItemsText: {
    fontSize: 14,
    color: '#166534',
  },
  medicationInfo: {
    padding: 12,
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  medicationText: {
    fontSize: 14,
    color: '#92400e',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 8,
  },
});
