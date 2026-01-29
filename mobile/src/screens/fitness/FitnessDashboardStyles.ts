/**
 * FitnessDashboard Styles
 * Extracted for performance optimization
 */

import { StyleSheet, Dimensions } from 'react-native';
import { colors } from '../../theme/design-tokens';

// Responsive StyleSheet
const { width: screenWidth } = Dimensions.get('window');
const isTablet = screenWidth > 768;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: '#e0f2fe', // theme.colors.background
  },
  animatedHeader: {
    backgroundColor: '#fa5f06',
    overflow: 'hidden',
  },
  animatedHeaderContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  animatedHeaderTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  animatedHeaderSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 12,
  },
  animatedHeaderStatsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
  },
  animatedHeaderStatsLabel: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '500',
  },
  statusBarBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 200,
    backgroundColor: '#f59e0b', // Orange gradient top color for fitness
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    // backgroundColor: '#e0f2fe', // theme.colors.background
  },
  notificationSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    // backgroundColor: '#e0f2fe', // theme.colors.background
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  topBox: {
    // backgroundColor: '#ffffff', // theme.colors.surface
  },
  topBoxContent: {
    height: 0,
  },
  scrollContainer: {
    flex: 1,
    // backgroundColor: '#e0f2fe', // theme.colors.background
    paddingBottom: 24,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 32,
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  headerContent: {
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.5,
    marginBottom: 6,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
    marginBottom: 16,
    letterSpacing: 0.2,
  },
  headerStats: {
    alignSelf: 'stretch',
  },
  statBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  headerStatContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  headerStatText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '600',
    textAlign: 'center',
  },
  title: {
    fontSize: isTablet ? 28 : 22,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: isTablet ? 16 : 14,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 20,
  },
  guideContainer: {
    paddingHorizontal: isTablet ? 24 : 16,
    marginBottom: 16,
    marginTop: 20,
  },
  toggleGroup: {
    flexDirection: 'row',
    gap: 12,
  },
  toggleButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    minHeight: 44,
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  toggleTextActive: {
    color: 'white',
  },
  guideContent: {
    marginHorizontal: isTablet ? 24 : 16,
    marginBottom: 16,
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  guideTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  guideText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  scrollContent: {
    flex: 1,
  },
  controlsContainer: {
    paddingHorizontal: isTablet ? 24 : 16,
    marginBottom: 24,
  },
  controlGroup: {
    marginBottom: isTablet ? 20 : 16,
  },
  controlLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  pickerContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  picker: {
    height: 50,
  },
  levelContainer: {
    flexDirection: isTablet ? 'row' : 'column',
    gap: 8,
  },
  levelButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    flex: isTablet ? 1 : undefined,
  },
  levelButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  levelButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  levelButtonTextActive: {
    color: 'white',
  },
  dayScrollView: {
    flexGrow: 0,
  },
  dayContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 16,
  },
  dayButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    minWidth: 80,
    alignItems: 'center',
  },
  dayButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dayButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  dayButtonTextActive: {
    color: 'white',
  },
  startButton: {
    backgroundColor: '#4cbb17',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    letterSpacing: 0.5,
  },
  stopButton: {
    backgroundColor: '#dc3545',
    borderColor: '#b02a37',
  },
  timerContainer: {
    backgroundColor: 'rgba(76, 187, 23, 0.1)',
    borderRadius: 16,
    padding: isTablet ? 24 : 20,
    marginTop: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(76, 187, 23, 0.3)',
  },
  timerLabel: {
    fontSize: isTablet ? 16 : 14,
    fontWeight: '600',
    color: '#4cbb17',
    marginBottom: 8,
  },
  timerDisplay: {
    fontSize: isTablet ? 48 : 36,
    fontWeight: 'bold',
    color: '#4cbb17',
    fontVariant: ['tabular-nums'],
  },
  workoutContent: {
    paddingHorizontal: isTablet ? 24 : 16,
    paddingBottom: 24,
    // backgroundColor: '#e0f2fe', // theme.colors.background
    marginHorizontal: isTablet ? 16 : 8,
    marginTop: 16,
    borderRadius: 20,
  },
  workoutTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#3b82f6',
    marginBottom: 8,
    marginTop: 16,
  },
  exerciseCount: {
    fontSize: 14,
    color: '#6366f1',
    marginBottom: 16,
    fontWeight: '600',
  },
  exerciseList: {
    gap: 12,
  },
  exerciseCard: {
    // backgroundColor: '#ffffff', // theme.colors.surface
    borderRadius: 16,
    padding: isTablet ? 20 : 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderLeftWidth: 6,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  exerciseEquipment: {
    fontSize: 14,
    color: '#6b7280',
  },
  setsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  setsText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary,
  },
  intensityText: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 12,
    fontWeight: '500',
  },
  loadContainer: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  loadBadge: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  loadText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  expandedContent: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  expandedTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },

  // Create Workout Section
  createWorkoutSection: {
    paddingHorizontal: 16,
    marginTop: -20,
    marginBottom: 16,
  },
  createWorkoutButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#4cbb17',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  createWorkoutButtonInHeader: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#4cbb17',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  createButtonContainer: {
    paddingHorizontal: 16,
    marginTop: -10,
    marginBottom: 8,
    backgroundColor: 'transparent',
  },
  createWorkoutGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 16,
  },
  createWorkoutTextContainer: {
    flex: 1,
  },
  createWorkoutTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 2,
  },
  createWorkoutSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },

  // Modal styles
  modalContainer: {
    flex: 1,
    // backgroundColor: '#e0f2fe', // theme.colors.background
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    // backgroundColor: '#ffffff', // theme.colors.surface
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    flex: 1,
  },
  modalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  closeButton: {
    padding: 8,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },

  // Section styles
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 12,
  },
  
  // Collapsible Section Styles
  collapsibleSection: {
    marginTop: 12,
    // backgroundColor: '#ffffff', // theme.colors.surface
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
  },
  collapsibleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    // backgroundColor: '#ffffff', // theme.colors.surface
  },
  collapsibleHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  collapsibleIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    // backgroundColor: '#f3f4f6', // theme.colors.surface
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  collapsibleIconBgActive: {
    backgroundColor: '#dcfce7',
  },
  collapsibleTitleContainer: {
    flex: 1,
  },
  collapsibleTitle: {
    fontSize: 15,
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
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  selectedBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  collapsibleContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  
  clearSelectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    marginTop: 8,
    gap: 4,
  },
  clearSelectionText: {
    fontSize: 13,
    color: '#6B7280',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  checkboxSelected: {
    backgroundColor: '#4cbb17',
    borderColor: '#4cbb17',
  },
  selectedGoalsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f0fdf4',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  selectedGoalsText: {
    fontSize: 13,
    color: '#166534',
    fontWeight: '500',
    flex: 1,
  },

  // Category Filter
  categoryFilterScroll: {
    marginBottom: 12,
  },
  categoryFilterContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  categoryFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    // backgroundColor: '#f3f4f6', // theme.colors.surface
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  categoryFilterButtonSelected: {
    backgroundColor: '#4cbb17',
    borderColor: '#4cbb17',
  },
  categoryFilterText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
  },
  categoryFilterTextSelected: {
    color: '#ffffff',
  },

  // Quick Goals
  quickGoalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
  },
  quickGoalButton: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 4,
    paddingVertical: 12,
    paddingHorizontal: 12,
    // backgroundColor: '#ffffff', // theme.colors.surface
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    width: '48%',
    minHeight: 70,
  },
  quickGoalContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quickGoalSelected: {
    borderColor: '#4cbb17',
    backgroundColor: '#f0fdf4',
  },
  quickGoalText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    flexShrink: 1,
  },
  quickGoalTextSelected: {
    color: '#166534',
  },
  quickGoalDescription: {
    fontSize: 10,
    color: '#9ca3af',
    marginTop: 2,
    flexShrink: 1,
  },

  // Body Parts
  bodyPartsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  bodyPartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    // backgroundColor: '#ffffff', // theme.colors.surface
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    gap: 8,
    minWidth: '45%',
    flex: 1,
  },
  bodyPartSelected: {
    borderColor: '#4cbb17',
    backgroundColor: '#f0fdf4',
  },
  bodyPartFromPerformance: {
    borderColor: '#4cbb17',
    backgroundColor: '#f0fdf4',
    borderStyle: 'solid',
  },
  bodyPartCheckContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bodyPartIcon: {
    width: 24,
  },
  bodyPartLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#374151',
    flex: 1,
  },
  bodyPartLabelSelected: {
    color: '#166534',
    fontWeight: '600',
  },

  // Natural language input
  goalTextInput: {
    // backgroundColor: '#ffffff', // theme.colors.surface
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    padding: 16,
    fontSize: 15,
    color: '#1f2937',
    minHeight: 80,
    textAlignVertical: 'top',
  },

  // Equipment
  equipmentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  equipmentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    // backgroundColor: '#ffffff', // theme.colors.surface
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    gap: 8,
    minWidth: '45%',
    flex: 1,
  },
  equipmentSelected: {
    borderColor: '#4cbb17',
    backgroundColor: '#f0fdf4',
  },
  equipmentLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    flex: 1,
  },
  equipmentLabelSelected: {
    color: '#166534',
    fontWeight: '600',
  },

  // Difficulty
  difficultyContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  difficultyButton: {
    flex: 1,
    paddingVertical: 14,
    // backgroundColor: '#ffffff', // theme.colors.surface
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  difficultySelected: {
    borderColor: '#4cbb17',
    backgroundColor: '#f0fdf4',
  },
  difficultyText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  difficultyTextSelected: {
    color: '#166534',
    fontWeight: '600',
  },

  // Duration
  durationContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  durationButton: {
    flex: 1,
    paddingVertical: 14,
    // backgroundColor: '#ffffff', // theme.colors.surface
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  durationSelected: {
    borderColor: '#f59e0b',
    backgroundColor: '#fffbeb',
  },
  durationText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  durationTextSelected: {
    color: '#b45309',
    fontWeight: '600',
  },

  // Generate button
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4cbb17',
    paddingVertical: 18,
    borderRadius: 16,
    marginTop: 32,
    gap: 10,
    shadowColor: '#4cbb17',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  generateButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  generateButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },

  // Step Indicator styles
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  stepDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotActive: {
    backgroundColor: '#4cbb17',
  },
  stepDotCompleted: {
    backgroundColor: '#22c55e',
  },
  stepLine: {
    width: 40,
    height: 3,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 8,
  },
  stepLineActive: {
    backgroundColor: '#22c55e',
  },

  // Level Selection styles
  levelSelectionContainer: {
    flex: 1,
    padding: 20,
  },
  levelSelectionHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  levelSelectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginTop: 12,
  },
  levelSelectionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 4,
  },
  levelCard: {
    // backgroundColor: '#ffffff', // theme.colors.surface
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  levelCardSelected: {
    backgroundColor: '#fafafa',
  },
  levelCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  levelIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    // backgroundColor: '#f3f4f6', // theme.colors.surface
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  levelIconContainerSelected: {
    backgroundColor: '#dcfce7',
  },
  levelCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
  },
  levelCardTitleSelected: {
    color: '#166534',
  },
  levelCardDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  levelFeatures: {
    gap: 8,
  },
  levelFeatureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  levelFeatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  levelFeatureText: {
    fontSize: 13,
    color: '#4b5563',
  },
  levelNote: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 20,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4cbb17',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 16,
    gap: 8,
  },
  continueButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },

  // Level and Clear Row
  levelAndClearRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingTop: 4,
  },

  // Current Level Badge
  currentLevelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
    minHeight: 40,
  },
  currentLevelContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  currentLevelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#166534',
  },
  changeLevelText: {
    fontSize: 12,
    color: '#4cbb17',
    fontWeight: '500',
  },
  
  // Clear All Button
  clearAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
    minHeight: 40,
  },
  clearAllButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ef4444',
  },

  // Program Overview Styles
  programHeader: {
    alignItems: 'center',
    paddingVertical: 24,
    marginBottom: 16,
  },
  programIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0fdf4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  programTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  programDescription: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  // Schedule Pattern Badge (for beginner/intermediate/advanced)
  schedulePatternBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#eef2ff',
    borderRadius: 16,
  },
  schedulePatternText: {
    fontSize: 12,
    color: '#4f46e5',
    fontWeight: '500',
  },
  programStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
  },
  programStatCard: {
    flex: 1,
    // backgroundColor: '#ffffff', // theme.colors.surface
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  programStatValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    marginTop: 8,
  },
  programStatLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  startDayScroll: {
    marginTop: 12,
  },
  startDayContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 4,
  },
  startDayButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    // backgroundColor: '#ffffff', // theme.colors.surface
    borderWidth: 2,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    minWidth: 90,
  },
  startDayButtonSelected: {
    borderColor: '#4cbb17',
    backgroundColor: '#f0fdf4',
  },
  startDayName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  startDayNameSelected: {
    color: '#166534',
  },
  startDayDate: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  startDayDateSelected: {
    color: '#4cbb17',
  },
  workoutDayCard: {
    // backgroundColor: '#ffffff', // theme.colors.surface
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  workoutDayCardSelected: {
    borderColor: '#4cbb17',
    backgroundColor: '#f0fdf4',
  },
  restDayCard: {
    // backgroundColor: '#f9fafb', // theme.colors.surface
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
  },
  workoutDayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  workoutDayNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4cbb17',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  workoutDayNumberText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  workoutDayInfo: {
    flex: 1,
  },
  workoutDayTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  workoutDayMuscles: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  workoutDayMeta: {
    alignItems: 'flex-end',
  },
  workoutDayMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  workoutDayMetaText: {
    fontSize: 13,
    color: '#6B7280',
  },
  // Intensity Badge Styles (for beginner/intermediate/advanced scheduling)
  workoutIntensityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginBottom: 4,
  },
  workoutIntensityText: {
    fontSize: 11,
    fontWeight: '600',
  },
  // Consecutive Day Indicator
  consecutiveDayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    backgroundColor: '#dbeafe',
    marginBottom: 4,
  },
  consecutiveDayText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#1d4ed8',
  },
  workoutDayExercises: {
    paddingLeft: 52,
    marginBottom: 12,
  },
  workoutDayExerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  workoutDayExerciseText: {
    fontSize: 14,
    color: '#6B7280',
  },
  workoutDayMoreText: {
    fontSize: 13,
    color: '#9CA3AF',
    fontStyle: 'italic',
    marginTop: 4,
  },
  // Motivation Message Styles (for workout cards)
  motivationContainer: {
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 8,
  },
  motivationText: {
    fontSize: 12,
    color: '#92400e',
    fontWeight: '500',
    textAlign: 'center',
  },
  // Workout Card Progression Note Styles
  workoutCardProgressionNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#f3e8ff',
    borderRadius: 6,
  },
  workoutCardProgressionText: {
    fontSize: 11,
    color: '#7c3aed',
    fontWeight: '500',
    flex: 1,
  },
  workoutDayAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  workoutDayActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4cbb17',
  },
  startProgramButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4cbb17',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 24,
    marginHorizontal: 4,
    gap: 10,
    shadowColor: '#4cbb17',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  startProgramButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#ffffff',
  },
  programBackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginTop: 8,
    gap: 8,
  },
  programBackButtonText: {
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '500',
  },

  // Workout Preview styles
  previewContainer: {
    flex: 1,
    padding: 20,
  },
  previewSummaryCard: {
    // backgroundColor: '#ffffff', // theme.colors.surface
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  previewTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  previewTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
  },
  previewDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
    lineHeight: 20,
  },
  previewStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    marginBottom: 16,
  },
  previewStatItem: {
    alignItems: 'center',
    gap: 4,
  },
  previewStatText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  previewStatValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginTop: 4,
  },
  previewStatLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  previewFocusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  previewFocusText: {
    fontSize: 14,
    color: '#4b5563',
  },
  previewSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
    marginTop: 8,
  },
  previewExercisesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  previewExercisesTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  previewExerciseCard: {
    // backgroundColor: '#ffffff', // theme.colors.surface
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  previewExerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  previewExerciseNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    // backgroundColor: '#f3f4f6', // theme.colors.surface
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  previewExerciseNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  previewExerciseInfo: {
    flex: 1,
  },
  previewExerciseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  previewExerciseMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  previewExerciseMetaText: {
    fontSize: 13,
    color: '#6b7280',
  },
  previewExerciseIcon: {
    marginLeft: 8,
  },
  previewExerciseDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    marginBottom: 12,
  },
  previewDetailItem: {
    alignItems: 'center',
  },
  previewDetailLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  previewDetailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  previewExerciseEquipment: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  previewEquipmentText: {
    fontSize: 13,
    color: '#6b7280',
  },
  runningInstructionsCard: {
    // backgroundColor: '#ffffff', // theme.colors.surface
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  runningInstructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  runningInstructionBullet: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4cbb17',
    alignItems: 'center',
    justifyContent: 'center',
  },
  runningInstructionBulletText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  runningInstructionText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  exerciseInstructionsContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  exerciseInstructionText: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
    marginBottom: 4,
  },
  previewActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    marginBottom: 20,
  },
  previewBackButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    // backgroundColor: '#f3f4f6', // theme.colors.surface
    paddingVertical: 14,
    borderRadius: 12,
    gap: 6,
  },
  previewBackButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
  },
  previewStartButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4cbb17',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#4cbb17',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  previewStartButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  previewButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    marginBottom: 20,
  },
  startWorkoutButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4cbb17',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#4cbb17',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  startWorkoutButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  regenerateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    // backgroundColor: '#ffffff', // theme.colors.surface
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    gap: 6,
  },
  regenerateButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },

  // Exercise Execution styles
  executionContainer: {
    flex: 1,
    // backgroundColor: '#e0f2fe', // theme.colors.background
  },
  executionHeader: {
    // Gradient fills the entire header area including status bar
  },
  executionHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  executionHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  executionBackButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  executionHeaderCenter: {
    flex: 1,
    alignItems: 'center',
  },
  executionHeaderTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
  },
  executionHeaderSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 2,
  },
  executionProgressContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    // backgroundColor: '#e0f2fe', // theme.colors.background
  },
  executionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  executionCloseButton: {
    padding: 8,
  },
  executionProgress: {
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    overflow: 'hidden',
  },
  executionProgressBar: {
    height: '100%',
    backgroundColor: '#4cbb17',
    borderRadius: 3,
  },
  executionProgressFill: {
    height: '100%',
    backgroundColor: '#4cbb17',
    borderRadius: 3,
  },
  executionProgressText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
    textAlign: 'center',
  },
  executionContent: {
    flex: 1,
    padding: 20,
    // backgroundColor: '#e0f2fe', // theme.colors.background
  },
  executionExerciseHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  executionExerciseName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginTop: 12,
  },
  executionInfoCard: {
    // backgroundColor: '#ffffff', // theme.colors.surface
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  executionInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 10,
  },
  executionInfoText: {
    fontSize: 14,
    color: '#4b5563',
  },
  executionActions: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 20,
  },
  currentExerciseCard: {
    // backgroundColor: '#ffffff', // theme.colors.surface
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  currentExerciseName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  currentExerciseMeta: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  setProgressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  setDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#e5e7eb',
  },
  setDotCompleted: {
    backgroundColor: '#22c55e',
  },
  setDotCurrent: {
    backgroundColor: '#4cbb17',
    transform: [{ scale: 1.2 }],
  },
  logSetSection: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  logSetTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 16,
  },
  logInputsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  logInputGroup: {
    flex: 1,
    alignItems: 'center',
  },
  logInputContainer: {
    flex: 1,
    alignItems: 'center',
  },
  logInputLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8,
  },
  logInput: {
    // backgroundColor: '#ffffff', // theme.colors.surface
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    width: '100%',
  },
  logSetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4cbb17',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 16,
    gap: 8,
  },
  logSetButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  completedSetsSection: {
    marginTop: 20,
  },
  completedSetsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 12,
  },
  completedSetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
    marginBottom: 8,
  },
  completedSetText: {
    fontSize: 14,
    color: '#166534',
    flex: 1,
  },
  completeSetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4cbb17',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  completeSetButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  restTimerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(17, 24, 39, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  restTimerContent: {
    alignItems: 'center',
  },
  restTimerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 16,
  },
  restTimerValue: {
    fontSize: 72,
    fontWeight: '700',
    color: '#4cbb17',
    marginBottom: 24,
  },
  skipRestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    gap: 8,
  },
  skipRestButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  skipRestText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  executionBottomButtons: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    // backgroundColor: '#ffffff', // theme.colors.surface
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  skipExerciseButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    // backgroundColor: '#f3f4f6', // theme.colors.surface
    paddingVertical: 14,
    borderRadius: 12,
    gap: 6,
  },
  skipExerciseText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  endWorkoutButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fef2f2',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 6,
  },
  endWorkoutText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#DC2626',
  },
  startLaterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    // backgroundColor: '#f3f4f6', // theme.colors.surface
    paddingVertical: 16,
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 32,
    gap: 8,
  },
  startLaterText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  lockedWorkoutContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    // backgroundColor: '#ffffff', // theme.colors.surface
  },
  lockedWorkoutTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 24,
    marginBottom: 12,
    textAlign: 'center',
  },
  lockedWorkoutMessage: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  lockedWorkoutButton: {
    backgroundColor: '#4cbb17',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  lockedWorkoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  modalBackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    gap: 4,
  },
  modalForwardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    backgroundColor: '#ecfdf5',
    borderRadius: 20,
    marginRight: 8,
  },

  // Section Title styles (like NutritionFacts)
  sectionTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 20,
    marginBottom: 12,
  },
  workoutSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  clearWorkoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#fef2f2',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  clearWorkoutButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ef4444',
  },

  // Current Workout Section styles (kept for compatibility)
  currentWorkoutSection: {
    // backgroundColor: '#ffffff', // theme.colors.surface
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  
  // Program Progress Card (separate card style)
  programProgressCard: {
    // backgroundColor: '#ffffff', // theme.colors.surface
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  
  // Program Progress styles
  programProgressSection: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  programProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  programProgressTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
    flex: 1,
  },
  programProgressBadge: {
    backgroundColor: '#fff7ed',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fed7aa',
  },
  programProgressBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ea580c',
  },
  programProgressBarContainer: {
    marginBottom: 10,
  },
  programProgressBarBackground: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  programProgressBarFill: {
    height: '100%',
    backgroundColor: '#4cbb17',
    borderRadius: 4,
  },
  programProgressPercentage: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
    textAlign: 'right',
  },
  programProgressStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  programProgressStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  programProgressStatText: {
    fontSize: 13,
    color: '#6b7280',
  },
  progressionNoteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    backgroundColor: '#fffbeb',
    marginHorizontal: -16,
    paddingHorizontal: 16,
    paddingBottom: 12,
    marginBottom: -16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  progressionNoteText: {
    fontSize: 13,
    color: '#92400e',
    fontWeight: '500',
    flex: 1,
  },

  // Rest Day Card Style (defined earlier in workoutDayCard section)
  restDayHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  restDayIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#dbeafe',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  restDayTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  restDaySubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  restDayTips: {
    gap: 12,
    marginBottom: 20,
  },
  restDayTipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    // backgroundColor: '#ffffff', // theme.colors.surface
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  restDayTipIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    // backgroundColor: '#e0f2fe', // theme.colors.background
    justifyContent: 'center',
    alignItems: 'center',
  },
  restDayTipContent: {
    flex: 1,
  },
  restDayTipTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
  },
  restDayTipText: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  nextWorkoutPreview: {
    backgroundColor: '#fa5f06',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#fa5f06',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  nextWorkoutLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  nextWorkoutDate: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },

  // Progressive Overload Badge
  exerciseMuscleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  progressiveOverloadBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  progressiveOverloadText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4cbb17',
  },

  // Workout Info Card (standalone like NutritionFacts)
  workoutInfoCard: {
    // backgroundColor: '#ffffff', // theme.colors.surface
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  workoutInfoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  workoutInfoLeft: {
    flex: 1,
  },
  workoutInfoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  workoutInfoSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },

  // Exercise Cards Container
  exerciseCardsContainer: {
    paddingHorizontal: 16,
    gap: 12,
  },
  exerciseCardItem: {
    // backgroundColor: '#ffffff', // theme.colors.surface
    borderRadius: 14,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  exerciseCardAccent: {
    width: 4,
  },
  exerciseCardContent: {
    flex: 1,
    padding: 14,
  },
  exerciseCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  exerciseCardName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
    marginRight: 8,
  },
  exerciseCardMeta: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fa5f06',
    backgroundColor: '#fff7ed',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  exerciseCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  exerciseCardMuscle: {
    fontSize: 13,
    color: '#6b7280',
  },

  // Stretches Card
  stretchesCard: {
    // backgroundColor: '#ffffff', // theme.colors.surface
    marginHorizontal: 16,
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  stretchesCardContent: {
    flex: 1,
  },
  stretchesCardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
  },
  stretchesCardSubtitle: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },

  currentWorkoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  currentWorkoutTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  currentWorkoutTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  startNowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4cbb17',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 20,
    gap: 8,
  },
  startNowButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  workoutStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    marginTop: 12,
    marginBottom: 0,
  },
  workoutStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  workoutStatValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  exercisePreviewList: {
    gap: 10,
  },
  exercisePreviewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    // backgroundColor: '#f9fafb', // theme.colors.surface
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  exercisePreviewDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  exercisePreviewInfo: {
    flex: 1,
  },
  exercisePreviewName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  exercisePreviewMuscle: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  exercisePreviewMeta: {
    fontSize: 13,
    color: '#6366f1',
    fontWeight: '600',
    backgroundColor: '#eff6ff',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  moreExercisesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    marginTop: 4,
  },
  moreExercisesText: {
    fontSize: 13,
    color: '#fa5f06',
    fontWeight: '500',
  },
  currentWorkoutTitleContainer: {
    flex: 1,
  },
  currentWorkoutSubtitle: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 2,
  },
  stretchesPreview: {
    backgroundColor: '#ecfdf5',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 12,
  },
  stretchesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stretchesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#065f46',
  },
  stretchesCount: {
    fontSize: 12,
    color: '#10b981',
    marginTop: 4,
  },

  // Empty State styles
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },

  // Weather Toggle styles
  weatherToggleContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  weatherToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    // backgroundColor: '#ffffff', // theme.colors.surface
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  weatherToggleActive: {
    backgroundColor: '#fffbeb',
    borderColor: '#f59e0b',
  },
  weatherToggleText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  weatherToggleTextActive: {
    color: '#b45309',
  },

  // New Weather Card styles
  weatherCard: {
    // backgroundColor: '#ffffff', // theme.colors.surface
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  weatherCardExpanded: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    marginBottom: 0,
  },
  weatherCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weatherCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  weatherCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  weatherCardSubtitle: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  weatherCardTemp: {
    fontSize: 28,
    fontWeight: '700',
    color: '#f59e0b',
    marginRight: 12,
  },
  weatherExpandedCard: {
    // backgroundColor: '#ffffff', // theme.colors.surface
    marginHorizontal: 16,
    marginTop: 0,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  weatherStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
  },
  weatherStatBox: {
    alignItems: 'center',
    gap: 4,
  },
  weatherStatValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  weatherStatLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  weatherAlertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
  },
  weatherAlertContent: {
    flex: 1,
  },
  weatherAlertTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#dc2626',
  },
  weatherAlertSubtitle: {
    fontSize: 13,
    color: '#991b1b',
  },
  weatherRecommendationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    gap: 12,
  },
  weatherOutdoorBanner: {
    backgroundColor: '#ecfdf5',
  },
  weatherIndoorBanner: {
    backgroundColor: '#f5f3ff',
  },
  weatherRecommendationContent: {
    flex: 1,
  },
  weatherRecommendationTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  weatherOutdoorText: {
    color: '#059669',
  },
  weatherIndoorText: {
    color: '#7c3aed',
  },
  weatherRecommendationTip: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },

  // Day Picker Styles (Horizontal Scroll)
  dayPickerContainer: {
    // backgroundColor: '#ffffff', // theme.colors.surface
    marginHorizontal: 16,
    borderRadius: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 8,
    marginTop: 16,
  },
  dayPickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  dayPickerNavButton: {
    padding: 6,
    borderRadius: 8,
    // backgroundColor: '#f3f4f6', // theme.colors.surface
  },
  dayPickerMonthText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
  },
  dayPickerScroll: {
    paddingHorizontal: 12,
    gap: 8,
  },
  dayPickerItem: {
    width: 52,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    // backgroundColor: '#f3f4f6', // theme.colors.surface
    paddingVertical: 8,
  },
  dayPickerItemWorkout: {
    backgroundColor: '#fff7ed',
    borderWidth: 2,
    borderColor: '#fa5f06',
  },
  dayPickerItemToday: {
    backgroundColor: '#fa5f06',
    borderWidth: 0,
  },
  dayPickerItemSelected: {
    backgroundColor: '#fff7ed',
    borderWidth: 2,
    borderColor: '#fa5f06',
  },
  dayPickerItemCompleted: {
    backgroundColor: '#fffbeb',
    borderWidth: 2,
    borderColor: '#f59e0b',
  },
  dayPickerItemSkipped: {
    // backgroundColor: '#f3f4f6', // theme.colors.surface
    borderWidth: 2,
    borderColor: '#d1d5db',
  },
  dayPickerTextSkipped: {
    color: '#9ca3af',
  },
  dayPickerDayName: {
    fontSize: 11,
    fontWeight: '500',
    color: '#9ca3af',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  dayPickerDayNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#374151',
  },
  dayPickerTextWorkout: {
    color: '#fa5f06',
  },
  dayPickerTextCompleted: {
    color: '#f59e0b',
  },
  dayPickerTextToday: {
    color: '#ffffff',
  },
  dayPickerTextSelected: {
    color: '#fa5f06',
  },
  dayPickerCheckmark: {
    position: 'absolute',
    bottom: 4,
  },
  dayPickerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Exercise Card Meta Container
  exerciseCardMetaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  // Enhanced Execution Styles
  executionExerciseCard: {
    // backgroundColor: '#ffffff', // theme.colors.surface
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  restTimerHint: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 24,
  },
  // Workout Complete Modal Styles
  workoutCompleteOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  workoutCompleteContainer: {
    // backgroundColor: '#ffffff', // theme.colors.surface
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    minHeight: '50%',
  },
  workoutCompleteSafeArea: {
    padding: 24,
  },
  workoutCompleteHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  celebrationIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  celebrationEmoji: {
    fontSize: 40,
  },
  workoutCompleteTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  workoutCompleteSubtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  workoutStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  workoutStatCard: {
    flex: 1,
    alignItems: 'center',
    // backgroundColor: '#f9fafb', // theme.colors.surface
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 8,
    marginHorizontal: 4,
  },
  workoutCompleteStatValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginTop: 8,
  },
  workoutCompleteStatLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  achievementsSection: {
    backgroundColor: '#fffbeb',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  achievementsSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400e',
    marginBottom: 12,
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#fef3c7',
  },
  achievementIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  achievementText: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  achievementDesc: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  workoutCompleteDoneButton: {
    backgroundColor: '#4cbb17',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  workoutCompleteDoneText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  
  // User Saved Programs Section Styles
  savedProgramsSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    // backgroundColor: '#e0f2fe', // theme.colors.background
  },
  programCount: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
    fontWeight: '400',
  },
  programsScrollView: {
    marginTop: 12,
  },
  programsScrollContent: {
    paddingRight: 16,
    gap: 12,
  },
  savedProgramCard: {
    width: 220,
    // backgroundColor: '#ffffff', // theme.colors.surface
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  savedProgramHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  savedProgramName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
    lineHeight: 22,
  },
  deleteProgramButton: {
    padding: 6,
    marginLeft: 8,
    marginTop: -4,
  },
  savedProgramGoal: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 12,
  },
  savedProgramStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  savedProgramStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  savedProgramStatText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  savedProgramProgressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  savedProgramProgressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    overflow: 'hidden',
  },
  savedProgramProgressFill: {
    height: '100%',
    backgroundColor: '#4cbb17',
    borderRadius: 3,
  },
  savedProgramProgressText: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: '600',
    minWidth: 28,
  },
  savedProgramStartButton: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  startProgramGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 6,
  },
  startProgramText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  programsLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 10,
  },
  programsLoadingText: {
    fontSize: 14,
    color: '#6b7280',
  },
  
  // Delete Confirmation Modal (Bottom Sheet Style)
  deleteModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  deleteModalBackdrop: {
    flex: 1,
  },
  deleteModalContainer: {
    // backgroundColor: '#ffffff', // theme.colors.surface
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    minHeight: 320,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 20,
  },
  deleteModalSafeArea: {
    flex: 1,
  },
  deleteModalHeader: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
  },
  deleteModalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#d1d5db',
    borderRadius: 2,
  },
  deleteModalContent: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  deleteModalIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  deleteModalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  deleteModalSubtitle: {
    fontSize: 16,
    color: '#374151',
    textAlign: 'center',
    marginBottom: 8,
  },
  deleteModalWarning: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  deleteModalActions: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingBottom: 24, // Base padding, insets added dynamically
    gap: 12,
  },
  deleteModalCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    // backgroundColor: '#f3f4f6', // theme.colors.surface
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteModalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  deleteModalConfirmButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#dc2626',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  deleteModalConfirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});



export { styles };
