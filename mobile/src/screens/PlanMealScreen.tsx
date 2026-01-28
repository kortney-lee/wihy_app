import React, { useState, useContext, useCallback } from 'react';
import { View, StyleSheet, Alert, Platform, StatusBar, Modal, ScrollView, TouchableOpacity, Text } from 'react-native';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ManualMealForm } from '../components/ManualMealForm';
import SvgIcon from '../components/shared/SvgIcon';
import { AuthContext } from '../context/AuthContext';
import { useCreateMealWithShopping } from '../hooks/useCreateMealWithShopping';
import { SavedMeal, MealTemplate } from '../services/mealService';
import { mealService } from '../services/mealService';
import { dashboardTheme } from '../theme/dashboardTheme';
import type { RootStackParamList } from '../types/navigation';

interface PlanMealScreenProps {
  isDashboardMode?: boolean;
  onBack?: () => void;
}

type NavigationProp = StackNavigationProp<RootStackParamList>;

/**
 * PlanMealScreen - Standalone dashboard for manual meal planning
 * 
 * This is a separate production from CreateMeals (AI meal plans).
 * Users can:
 * - Create meals manually by adding ingredients
 * - Search 4M+ products for nutrition data
 * - Build shopping lists and send to Instacart
 * - Use templates for quick meal creation
 * - Scan recipes from images
 * 
 * Follows the dashboard pattern from DESIGN_PATTERNS.md
 */
export default function PlanMealScreen({ 
  isDashboardMode = false, 
  onBack 
}: PlanMealScreenProps) {
  const { user } = useContext(AuthContext);
  const userId = user?.id || '';
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  
  // Product search is now inline in ManualMealForm
  
  // Meal templates modal state
  const [showTemplates, setShowTemplates] = useState(false);
  
  // Library modal state
  const [showLibrary, setShowLibrary] = useState(false);
  
  // Scanning state
  const [scanning, setScanning] = useState(false);
  
  // Saved meal ID
  const [savedMealId, setSavedMealId] = useState<string | null>(null);
  
  // Library meals
  const [libraryMeals, setLibraryMeals] = useState<SavedMeal[]>([]);
  
  // Templates
  const [templates, setTemplates] = useState<MealTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  
  // Meal shopping hook for product search
  const mealShoppingHook = useCreateMealWithShopping(userId);

  const handleBack = () => {
    if (isDashboardMode && onBack) {
      onBack();
    } else {
      navigation.goBack();
    }
  };

  const handleShowProductSearch = () => {
    // Product search is now inline in ManualMealForm
    // This callback is kept for interface compatibility but does nothing
  };

  const handleShowLibrary = () => {
    // TODO: Open library modal with saved meals
    Alert.alert('My Meals', 'View your saved meals library', [
      { text: 'OK' }
    ]);
  };

  const handleShowTemplates = async () => {
    setLoadingTemplates(true);
    setShowTemplates(true);
    try {
      const fetchedTemplates = await mealService.getTemplates();
      setTemplates(fetchedTemplates);
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoadingTemplates(false);
    }
  };

  const handleScanRecipe = async () => {
    setScanning(true);
    try {
      // Navigate to camera for food scanning (recipe scanning uses food mode)
      navigation.navigate('Camera', { mode: 'food' });
    } catch (error) {
      console.error('Error scanning recipe:', error);
      Alert.alert('Error', 'Failed to open camera for recipe scanning');
    } finally {
      setScanning(false);
    }
  };

  const handleSavedMealId = (id: string) => {
    setSavedMealId(id);
  };

  const loadLibraryMeals = useCallback(async () => {
    if (!userId) return;
    try {
      const result = await mealService.getUserMeals(userId);
      setLibraryMeals(result.meals);
    } catch (error) {
      console.error('Error loading library meals:', error);
    }
  }, [userId]);

  const handleTemplateSelect = (template: any) => {
    // Apply template to form
    // This would need to be implemented with a callback to ManualMealForm
    setShowTemplates(false);
    Alert.alert('Template Applied', `Using template: ${template.name}`);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#3b82f6" />
      
      {/* Main Form - Now includes inline product search */}
      <ManualMealForm
        userId={userId}
        onBack={handleBack}
        onShowProductSearch={handleShowProductSearch}
        onShowLibrary={handleShowLibrary}
        onShowTemplates={handleShowTemplates}
        onScanRecipe={handleScanRecipe}
        onSavedMealId={handleSavedMealId}
        scanning={scanning}
        onLoadLibraryMeals={loadLibraryMeals}
      />

      {/* Meal Templates Modal */}
      <Modal
        visible={showTemplates}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowTemplates(false)}
      >
        <SafeAreaView style={styles.modalContainer} edges={['top', 'left', 'right']}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Meal Templates</Text>
            <TouchableOpacity 
              onPress={() => setShowTemplates(false)}
              style={styles.modalCloseButton}
            >
              <SvgIcon name="close" size={24} color="#374151" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            {loadingTemplates ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading templates...</Text>
              </View>
            ) : templates.length === 0 ? (
              <View style={styles.emptyContainer}>
                <SvgIcon name="restaurant" size={48} color="#9ca3af" />
                <Text style={styles.emptyText}>No templates available</Text>
                <Text style={styles.emptySubtext}>Templates will appear here once created</Text>
              </View>
            ) : (
              templates.map((template) => (
                <TouchableOpacity
                  key={template.template_id}
                  style={styles.templateCard}
                  onPress={() => {
                    handleTemplateSelect(template);
                  }}
                >
                  <View style={styles.templateInfo}>
                    <Text style={styles.templateName}>{template.name}</Text>
                    <Text style={styles.templateDescription}>{template.description}</Text>
                    <View style={styles.templateMeta}>
                      <Text style={styles.templateMetaText}>
                        {template.nutrition?.calories || 0} cal • {template.servings} servings
                      </Text>
                    </View>
                  </View>
                  <SvgIcon name="chevron-forward" size={20} color="#9ca3af" />
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: dashboardTheme.colors.background,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  modalCloseButton: {
    padding: 8,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#6b7280',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  templateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  templateInfo: {
    flex: 1,
    gap: 4,
  },
  templateName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  templateDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  templateMeta: {
    flexDirection: 'row',
    marginTop: 4,
  },
  templateMetaText: {
    fontSize: 12,
    color: '#9ca3af',
  },
});
