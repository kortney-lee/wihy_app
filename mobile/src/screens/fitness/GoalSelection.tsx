/**
 * GoalSelection Component
 * 
 * Step 2 of workout creation - allows user to select workout goals
 * with collapsible sections for Performance, Body Goals, Quick Workouts, etc.
 */

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '../../components/shared';
import { useTheme } from '../../context/ThemeContext';
import { ExpandedSections, PerformanceGoal, BodyGoal, QuickGoal, EquipmentCategory } from './types';
import { 
  FITNESS_LEVELS, 
  BODY_PARTS, 
  EQUIPMENT_OPTIONS,
  EQUIPMENT_CATEGORIES,
  getEquipmentByCategory,
  PERFORMANCE_GOALS, 
  BODY_GOALS, 
  QUICK_GOALS,
  PERFORMANCE_CATEGORIES,
  GOAL_CATEGORIES,
} from './constants';

interface GoalSelectionProps {
  levelId: string;
  selectedPerformanceGoals: string[];
  selectedBodyGoals: string[];
  selectedBodyParts: string[];
  selectedEquipment: string[];
  workoutDuration: number;
  programDays: number | null;
  goalText: string;
  isGenerating: boolean;
  expandedSections: ExpandedSections;
  performanceCategory: string;
  selectedGoalCategory: string;
  
  // Callbacks
  onLevelPress: () => void;
  onTogglePerformanceGoal: (goal: PerformanceGoal) => void;
  onToggleBodyGoal: (goal: BodyGoal) => void;
  onSelectQuickGoal: (goal: QuickGoal) => void;
  onToggleBodyPart: (partId: string) => void;
  onToggleEquipment: (equipmentId: string) => void;
  onDurationChange: (duration: number) => void;
  onProgramDaysChange: (days: number) => void;
  onGoalTextChange: (text: string) => void;
  onToggleSection: (section: string) => void;
  onPerformanceCategoryChange: (category: string) => void;
  onGoalCategoryChange: (category: string) => void;
  onClearAllSelections: () => void;
  onClearPerformanceGoals: () => void;
  onClearBodyGoals: () => void;
  onGenerateWorkout: () => void;
}

const { width } = Dimensions.get('window');
const isTablet = width > 768;

// Collapsible Section Header Component
const CollapsibleHeader: React.FC<{
  title: string;
  subtitle?: string;
  section: string;
  icon: string;
  selectedCount?: number;
  isExpanded: boolean;
  onToggle: () => void;
  theme: any;
}> = ({ title, subtitle, section, icon, selectedCount = 0, isExpanded, onToggle, theme }) => (
  <TouchableOpacity 
    style={styles.collapsibleHeader}
    onPress={onToggle}
    activeOpacity={0.7}
  >
    <View style={styles.collapsibleHeaderLeft}>
      <View style={[styles.collapsibleIconBg, isExpanded && styles.collapsibleIconBgActive]}>
        <Ionicons name={icon as any} size={20} color={isExpanded ? '#4cbb17' : '#6b7280'} />
      </View>
      <View style={styles.collapsibleTitleContainer}>
        <Text style={[styles.collapsibleTitle, { color: theme.colors.text }]}>{title}</Text>
        {subtitle && !isExpanded && (
          <Text style={[styles.collapsibleSubtitle, { color: theme.colors.textSecondary }]} numberOfLines={1}>{subtitle}</Text>
        )}
      </View>
    </View>
    <View style={styles.collapsibleHeaderRight}>
      {selectedCount > 0 && (
        <View style={styles.selectedBadge}>
          <Text style={styles.selectedBadgeText}>{selectedCount}</Text>
        </View>
      )}
      <Ionicons 
        name={isExpanded ? 'chevron-up' : 'chevron-down'} 
        size={20} 
        color="#6b7280" 
      />
    </View>
  </TouchableOpacity>
);

export const GoalSelection: React.FC<GoalSelectionProps> = ({
  levelId,
  selectedPerformanceGoals,
  selectedBodyGoals,
  selectedBodyParts,
  selectedEquipment,
  workoutDuration,
  programDays,
  goalText,
  isGenerating,
  expandedSections,
  performanceCategory,
  selectedGoalCategory,
  onLevelPress,
  onTogglePerformanceGoal,
  onToggleBodyGoal,
  onSelectQuickGoal,
  onToggleBodyPart,
  onToggleEquipment,
  onDurationChange,
  onProgramDaysChange,
  onGoalTextChange,
  onToggleSection,
  onPerformanceCategoryChange,
  onGoalCategoryChange,
  onClearAllSelections,
  onClearPerformanceGoals,
  onClearBodyGoals,
  onGenerateWorkout,
}) => {
  const { theme } = useTheme();
  // Get level color for dynamic styling
  const currentLevel = FITNESS_LEVELS.find(l => l.id === levelId);
  const levelColor = currentLevel?.color || '#2563EB';
  const levelBgColor = levelId === 'beginner' ? '#dcfce7' : levelId === 'advanced' ? '#fee2e2' : '#dbeafe';
  
  const hasSelections = selectedPerformanceGoals.length > 0 || 
    selectedBodyGoals.length > 0 || 
    selectedBodyParts.length > 0 || 
    selectedEquipment.length > 0 || 
    goalText;

  const selectedPerformanceGoal = selectedPerformanceGoals[0] || null;

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]} showsVerticalScrollIndicator={false}>
      {/* Top spacing for better touch targets */}
      <View style={{ height: 16 }} />
      
      {/* Current Level Badge and Clear All Row */}
      <View style={styles.levelAndClearRow}>
        <TouchableOpacity 
          style={[styles.currentLevelBadge, { backgroundColor: levelBgColor }]}
          onPress={onLevelPress}
        >
          <View style={styles.currentLevelContent}>
            <Ionicons 
              name={currentLevel?.icon as any || 'fitness-outline'} 
              size={18} 
              color={levelColor} 
            />
            <Text style={[styles.currentLevelText, { color: levelColor }]}>
              Level: {levelId.charAt(0).toUpperCase() + levelId.slice(1)}
            </Text>
            <Ionicons name="chevron-down" size={16} color={levelColor} />
          </View>
        </TouchableOpacity>
        
        {/* Clear All Button - only show when there are selections */}
        {hasSelections && (
          <TouchableOpacity 
            style={styles.clearAllButton}
            onPress={onClearAllSelections}
          >
            <Ionicons name="refresh-outline" size={16} color="#ef4444" />
            <Text style={styles.clearAllButtonText}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Natural Language Input */}
      <View style={styles.section}>
        <TextInput
          style={[styles.goalTextInput, { minHeight: 50 }]}
          placeholder="Or type your goal: e.g., build chest with dumbbells"
          placeholderTextColor="#9ca3af"
          value={goalText}
          onChangeText={onGoalTextChange}
          multiline
          numberOfLines={2}
        />
      </View>

      {/* SECTION 1: Body Goals - Collapsible */}
      <View style={styles.collapsibleSection}>
        <CollapsibleHeader 
          title="Body Goals" 
          subtitle="Build Muscle, Lose Weight, Get Toned..."
          section="body"
          icon="body-outline"
          selectedCount={selectedBodyGoals.length}
          isExpanded={expandedSections.body}
          onToggle={() => onToggleSection('body')}
          theme={theme}
        />
        
        {expandedSections.body && (
          <View style={styles.collapsibleContent}>
            <View style={styles.quickGoalsGrid}>
              {BODY_GOALS.map((goal) => {
                const isSelected = selectedBodyGoals.includes(goal.id);
                return (
                  <TouchableOpacity
                    key={goal.id}
                    style={[
                      styles.quickGoalButton,
                      isSelected && styles.quickGoalSelected
                    ]}
                    onPress={() => onToggleBodyGoal(goal)}
                  >
                    <View style={styles.quickGoalContent}>
                      <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                        {isSelected && <Ionicons name="checkmark" size={14} color="#fff" />}
                      </View>
                      <Ionicons
                        name={goal.icon as any}
                        size={20}
                        color={isSelected ? '#4cbb17' : '#6b7280'}
                      />
                      <Text style={[
                        styles.quickGoalText,
                        isSelected && styles.quickGoalTextSelected
                      ]}>{goal.label}</Text>
                    </View>
                    <Text style={styles.quickGoalDescription} numberOfLines={1}>
                      {goal.description}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            
            {selectedBodyGoals.length > 0 && (
              <View style={styles.selectedGoalsInfo}>
                <Text style={styles.selectedGoalsText}>
                  {selectedBodyGoals.length} goal{selectedBodyGoals.length > 1 ? 's' : ''} selected
                </Text>
                <TouchableOpacity 
                  style={styles.clearSelectionButton}
                  onPress={onClearBodyGoals}
                >
                  <Ionicons name="close-circle-outline" size={16} color="#6B7280" />
                  <Text style={styles.clearSelectionText}>Clear</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </View>

      {/* SECTION 2: Quick Workouts - Collapsible */}
      <View style={styles.collapsibleSection}>
        <CollapsibleHeader 
          title="Quick Workout" 
          subtitle="Full Body, Leg Day, Cardio, HIIT..."
          section="quick"
          icon="flash-outline"
          selectedCount={selectedBodyParts.length > 0 ? 1 : 0}
          isExpanded={expandedSections.quick}
          onToggle={() => onToggleSection('quick')}
        />
        
        {expandedSections.quick && (
          <View style={styles.collapsibleContent}>
            {/* Category Filter */}
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              style={styles.categoryFilterScroll}
              contentContainerStyle={styles.categoryFilterContainer}
            >
              {GOAL_CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryFilterButton,
                    selectedGoalCategory === cat.id && styles.categoryFilterButtonSelected
                  ]}
                  onPress={() => onGoalCategoryChange(cat.id)}
                >
                  <Ionicons 
                    name={cat.icon as any} 
                    size={16} 
                    color={selectedGoalCategory === cat.id ? '#ffffff' : '#6b7280'} 
                  />
                  <Text style={[
                    styles.categoryFilterText,
                    selectedGoalCategory === cat.id && styles.categoryFilterTextSelected
                  ]}>{cat.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.quickGoalsGrid}>
              {QUICK_GOALS
                .filter(goal => selectedGoalCategory === 'all' || goal.category === selectedGoalCategory)
                .map((goal) => {
                const isSelected = selectedBodyParts.length > 0 && 
                  goal.bodyParts.length > 0 &&
                  goal.bodyParts.every(bp => selectedBodyParts.includes(bp));
                return (
                  <TouchableOpacity
                    key={goal.label}
                    style={[
                      styles.quickGoalButton,
                      isSelected && styles.quickGoalSelected
                    ]}
                    onPress={() => onSelectQuickGoal(goal)}
                  >
                    <View style={styles.quickGoalContent}>
                      <Ionicons
                        name={goal.icon as any}
                        size={20}
                        color={isSelected ? '#4cbb17' : '#6b7280'}
                      />
                      <Text style={[
                        styles.quickGoalText,
                        isSelected && styles.quickGoalTextSelected
                      ]}>{goal.label}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}
      </View>

      {/* SECTION 3: Target Body Areas - Collapsible */}
      <View style={styles.collapsibleSection}>
        <CollapsibleHeader 
          title="Target Body Areas" 
          subtitle="Chest, Back, Legs, Core..."
          section="bodyAreas"
          icon="accessibility-outline"
          selectedCount={selectedBodyParts.length}
          isExpanded={expandedSections.bodyAreas}
          onToggle={() => onToggleSection('bodyAreas')}
        />
        
        {expandedSections.bodyAreas && (
          <View style={styles.collapsibleContent}>
            {selectedPerformanceGoal && (
              <Text style={styles.sectionSubtitle}>
                Highlighted areas will be improved by your selected training
              </Text>
            )}
            <View style={styles.bodyPartsGrid}>
              {BODY_PARTS.map((part) => {
                const isSelected = selectedBodyParts.includes(part.id);
                const isFromPerformance = selectedPerformanceGoal && 
                  PERFORMANCE_GOALS.find(p => p.id === selectedPerformanceGoal)?.targetAreas.includes(part.id);
                return (
                  <TouchableOpacity
                    key={part.id}
                    style={[
                      styles.bodyPartButton,
                      isSelected && styles.bodyPartSelected,
                      isFromPerformance && styles.bodyPartFromPerformance
                    ]}
                    onPress={() => onToggleBodyPart(part.id)}
                  >
                    <Ionicons
                      name={part.icon as any}
                      size={24}
                      color={isSelected ? '#4cbb17' : '#6b7280'}
                    />
                    <Text style={[
                      styles.bodyPartLabel,
                      isSelected && styles.bodyPartLabelSelected
                    ]}>
                      {part.label}
                    </Text>
                    {isSelected && (
                      <View style={styles.bodyPartCheckContainer}>
                        {isFromPerformance && (
                          <Ionicons name="fitness-outline" size={14} color="#4cbb17" style={{ marginRight: 2 }} />
                        )}
                        <Ionicons name="checkmark-circle" size={20} color="#4cbb17" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}
      </View>

      {/* SECTION 4: Equipment Available - Collapsible with Categories */}
      <View style={styles.collapsibleSection}>
        <CollapsibleHeader 
          title="Equipment Available" 
          subtitle={`${EQUIPMENT_OPTIONS.length} items in ${EQUIPMENT_CATEGORIES.length} categories`}
          section="equipment"
          icon="barbell-outline"
          selectedCount={selectedEquipment.length}
          isExpanded={expandedSections.equipment}
          onToggle={() => onToggleSection('equipment')}
        />
        
        {expandedSections.equipment && (
          <View style={styles.collapsibleContent}>
            {/* Equipment Categories */}
            {EQUIPMENT_CATEGORIES.map((category) => {
              const categoryEquipment = getEquipmentByCategory(category.id);
              const selectedInCategory = categoryEquipment.filter(eq => selectedEquipment.includes(eq.id)).length;
              
              return (
                <View key={category.id} style={styles.equipmentCategorySection}>
                  {/* Category Header */}
                  <View style={styles.equipmentCategoryHeader}>
                    <View style={styles.equipmentCategoryLeft}>
                      <Ionicons name={category.icon as any} size={18} color="#4cbb17" />
                      <Text style={styles.equipmentCategoryTitle}>{category.label}</Text>
                      <Text style={styles.equipmentCategoryCount}>({categoryEquipment.length} items)</Text>
                    </View>
                    {selectedInCategory > 0 && (
                      <View style={styles.categorySelectedBadge}>
                        <Text style={styles.categorySelectedText}>{selectedInCategory}</Text>
                      </View>
                    )}
                  </View>
                  
                  {/* Category Equipment Items */}
                  <View style={styles.equipmentGrid}>
                    {categoryEquipment.map((eq) => (
                      <TouchableOpacity
                        key={eq.id}
                        style={[
                          styles.equipmentButton,
                          selectedEquipment.includes(eq.id) && styles.equipmentSelected
                        ]}
                        onPress={() => onToggleEquipment(eq.id)}
                      >
                        <Ionicons
                          name={eq.icon as any}
                          size={24}
                          color={selectedEquipment.includes(eq.id) ? '#4cbb17' : '#6b7280'}
                        />
                        <Text style={[
                          styles.equipmentLabel,
                          selectedEquipment.includes(eq.id) && styles.equipmentLabelSelected
                        ]} numberOfLines={2}>
                          {eq.label}
                        </Text>
                        {selectedEquipment.includes(eq.id) && (
                          <Ionicons name="checkmark-circle" size={18} color="#4cbb17" />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>

      {/* Workout Duration Selector */}
      <View style={styles.durationSection}>
        <View style={styles.durationHeader}>
          <View style={styles.durationIconContainer}>
            <Ionicons name="time-outline" size={20} color="#4cbb17" />
          </View>
          <View>
            <Text style={styles.durationTitle}>Workout Duration</Text>
            <Text style={styles.durationSubtitle}>Duration per session</Text>
          </View>
        </View>
        <View style={styles.durationContainer}>
          {[15, 30, 45, 60].map((mins) => (
            <TouchableOpacity
              key={mins}
              style={[
                styles.durationButton,
                workoutDuration === mins && styles.durationSelected
              ]}
              onPress={() => onDurationChange(mins)}
            >
              <Text style={[
                styles.durationText,
                workoutDuration === mins && styles.durationTextSelected
              ]}>
                {mins} min
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Program Duration Selector - Optional */}
      <View style={styles.durationSection}>
        <View style={styles.durationHeader}>
          <View style={styles.durationIconContainer}>
            <Ionicons name="calendar-outline" size={20} color="#4cbb17" />
          </View>
          <View>
            <Text style={styles.durationTitle}>Program Duration</Text>
            <Text style={styles.durationSubtitle}>How many days? (optional)</Text>
          </View>
        </View>
        <View style={styles.programDaysContainer}>
          {[1, 3, 5, 7, 14, 21, 30].map((days) => (
            <TouchableOpacity
              key={days}
              style={[
                styles.programDayButton,
                programDays === days && styles.programDaySelected
              ]}
              onPress={() => onProgramDaysChange(days)}
            >
              <Text style={[
                styles.programDayText,
                programDays === days && styles.programDayTextSelected
              ]}>
                {days}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {programDays && (
          <Text style={styles.programDaysHint}>
            {programDays === 1 
              ? 'Single day = Quick workout session' 
              : programDays >= 7 
                ? 'Full program with progressive overload' 
                : `${programDays}-day focused training plan`}
          </Text>
        )}
      </View>

      {/* SECTION 5: Train for Sports/Running - Collapsible (LAST OPTION) */}
      <View style={styles.collapsibleSection}>
        <CollapsibleHeader 
          title="Train for Sports/Running" 
          subtitle="5K, Marathon, Football, Tennis..."
          section="performance"
          icon="trophy-outline"
          selectedCount={selectedPerformanceGoals.length}
          isExpanded={expandedSections.performance}
          onToggle={() => onToggleSection('performance')}
        />
        
        {expandedSections.performance && (
          <View style={styles.collapsibleContent}>
            {/* Performance Category Filter */}
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              style={styles.categoryFilterScroll}
              contentContainerStyle={styles.categoryFilterContainer}
            >
              {PERFORMANCE_CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryFilterButton,
                    performanceCategory === cat.id && styles.categoryFilterButtonSelected
                  ]}
                  onPress={() => onPerformanceCategoryChange(cat.id)}
                >
                  <Ionicons 
                    name={cat.icon as any} 
                    size={16} 
                    color={performanceCategory === cat.id ? '#ffffff' : '#6b7280'} 
                  />
                  <Text style={[
                    styles.categoryFilterText,
                    performanceCategory === cat.id && styles.categoryFilterTextSelected
                  ]}>{cat.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.quickGoalsGrid}>
              {PERFORMANCE_GOALS
                .filter(goal => performanceCategory === 'all' || goal.category === performanceCategory)
                .map((goal) => {
                const isSelected = selectedPerformanceGoals.includes(goal.id);
                return (
                  <TouchableOpacity
                    key={goal.id}
                    style={[
                      styles.quickGoalButton,
                      isSelected && styles.quickGoalSelected
                    ]}
                    onPress={() => onTogglePerformanceGoal(goal)}
                  >
                    <View style={styles.quickGoalContent}>
                      <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                        {isSelected && <Ionicons name="checkmark" size={14} color="#fff" />}
                      </View>
                      <Ionicons
                        name={goal.icon as any}
                        size={20}
                        color={isSelected ? '#4cbb17' : '#6b7280'}
                      />
                      <Text style={[
                        styles.quickGoalText,
                        isSelected && styles.quickGoalTextSelected
                      ]}>{goal.label}</Text>
                    </View>
                    <Text style={styles.quickGoalDescription} numberOfLines={1}>
                      {goal.description}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            
            {selectedPerformanceGoals.length > 0 && (
              <View style={styles.selectedGoalsInfo}>
                <Text style={styles.selectedGoalsText}>
                  {selectedPerformanceGoals.length} goal{selectedPerformanceGoals.length > 1 ? 's' : ''} selected
                </Text>
                <TouchableOpacity 
                  style={styles.clearSelectionButton}
                  onPress={onClearPerformanceGoals}
                >
                  <Ionicons name="close-circle-outline" size={16} color="#6B7280" />
                  <Text style={styles.clearSelectionText}>Clear</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Generate Button */}
      <TouchableOpacity
        style={[styles.generateButton, isGenerating && styles.generateButtonDisabled]}
        onPress={onGenerateWorkout}
        disabled={isGenerating}
      >
        {isGenerating ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <>
            <Ionicons name="flash" size={24} color="#ffffff" />
            <Text style={styles.generateButtonText}>Generate Workout</Text>
          </>
        )}
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: isTablet ? 24 : 16,
  },
  levelAndClearRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingTop: 8,
  },
  currentLevelBadge: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  currentLevelContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  currentLevelText: {
    fontSize: 14,
    fontWeight: '600',
  },
  clearAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#fee2e2',
    borderRadius: 16,
  },
  clearAllButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ef4444',
  },
  collapsibleSection: {
    // backgroundColor: '#ffffff', // theme.colors.surface // theme.colors.surface // Use theme.colors.surface
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  collapsibleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    // backgroundColor: '#f9fafb', // theme.colors.surface // theme.colors.surface // Use theme.colors.surface
  },
  collapsibleHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  collapsibleIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    // backgroundColor: '#f3f4f6', // theme.colors.surface // theme.colors.surface // Use theme.colors.background
    alignItems: 'center',
    justifyContent: 'center',
  },
  collapsibleIconBgActive: {
    backgroundColor: '#dcfce7',
  },
  collapsibleTitleContainer: {
    flex: 1,
  },
  collapsibleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  collapsibleSubtitle: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  collapsibleHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectedBadge: {
    backgroundColor: '#4cbb17',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  selectedBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  collapsibleContent: {
    padding: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  categoryFilterScroll: {
    marginBottom: 12,
  },
  categoryFilterContainer: {
    gap: 8,
  },
  categoryFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    // backgroundColor: '#f3f4f6', // theme.colors.surface // theme.colors.surface // Use theme.colors.background
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  categoryFilterButtonSelected: {
    backgroundColor: '#4cbb17',
    borderColor: '#4cbb17',
  },
  categoryFilterText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6b7280',
  },
  categoryFilterTextSelected: {
    color: '#ffffff',
  },
  quickGoalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickGoalButton: {
    // backgroundColor: '#f9fafb', // theme.colors.surface // theme.colors.surface // Use theme.colors.surface
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    minWidth: '48%',
    flex: 1,
  },
  quickGoalSelected: {
    backgroundColor: '#f0fdf4',
    borderColor: '#4cbb17',
    borderWidth: 2,
  },
  quickGoalContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#4cbb17',
    borderColor: '#4cbb17',
  },
  quickGoalText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    flex: 1,
  },
  quickGoalTextSelected: {
    color: '#166534',
    fontWeight: '600',
  },
  quickGoalDescription: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 4,
    marginLeft: 28,
  },
  selectedGoalsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  selectedGoalsText: {
    fontSize: 13,
    color: '#4cbb17',
    fontWeight: '600',
  },
  clearSelectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  clearSelectionText: {
    fontSize: 13,
    color: '#6B7280',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  bodyPartsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  bodyPartButton: {
    // backgroundColor: '#f9fafb', // theme.colors.surface // theme.colors.surface // Use theme.colors.surface
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    minWidth: '48%',
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  bodyPartSelected: {
    backgroundColor: '#f0fdf4',
    borderColor: '#4cbb17',
    borderWidth: 2,
  },
  bodyPartFromPerformance: {
    backgroundColor: '#fffbeb',
    borderColor: '#f59e0b',
  },
  bodyPartLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
  },
  bodyPartLabelSelected: {
    color: '#166534',
    fontWeight: '600',
  },
  bodyPartCheckContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    top: 8,
    right: 8,
  },
  equipmentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  equipmentButton: {
    // backgroundColor: '#f9fafb', // theme.colors.surface // theme.colors.surface // Use theme.colors.surface
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    minWidth: '48%',
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  equipmentSelected: {
    backgroundColor: '#f0fdf4',
    borderColor: '#4cbb17',
    borderWidth: 2,
  },
  equipmentLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
    flex: 1,
  },
  equipmentLabelSelected: {
    color: '#166534',
    fontWeight: '600',
  },
  // Duration Section Styles (Program & Workout)
  durationSection: {
    // backgroundColor: '#ffffff', // theme.colors.surface // theme.colors.surface // Use theme.colors.surface
    borderRadius: 16,
    marginBottom: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  durationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  durationIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  durationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  durationSubtitle: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  durationContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  durationButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    // backgroundColor: '#f9fafb', // theme.colors.surface // theme.colors.surface // Use theme.colors.surface
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  durationSelected: {
    backgroundColor: '#4cbb17',
    borderColor: '#4cbb17',
  },
  durationText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  durationTextSelected: {
    color: '#ffffff',
  },
  // Program Duration (Days) Styles
  programDaysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  programDayButton: {
    minWidth: 44,
    paddingVertical: 10,
    paddingHorizontal: 14,
    // backgroundColor: '#f9fafb', // theme.colors.surface // theme.colors.surface // Use theme.colors.surface
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  programDaySelected: {
    backgroundColor: '#4cbb17',
    borderColor: '#4cbb17',
  },
  programDayText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
  programDayTextSelected: {
    color: '#ffffff',
  },
  programDaysHint: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 10,
    fontStyle: 'italic',
  },
  goalTextInput: {
    // backgroundColor: '#f9fafb', // theme.colors.surface // theme.colors.surface // Use theme.colors.surface
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#1f2937',
    textAlignVertical: 'top',
    outlineStyle: 'none' as any,
  },
  generateButton: {
    backgroundColor: '#4cbb17',
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  generateButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  generateButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  // Equipment Category Styles
  equipmentCategorySection: {
    marginBottom: 16,
  },
  equipmentCategoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  equipmentCategoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  equipmentCategoryTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
  equipmentCategoryCount: {
    fontSize: 13,
    color: '#9ca3af',
  },
  categorySelectedBadge: {
    backgroundColor: '#4cbb17',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  categorySelectedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
});

export default GoalSelection;
