/**
 * Shared constants for Fitness Dashboard components
 */

import { 
  FitnessLevel, 
  BodyPartOption, 
  EquipmentOption, 
  EquipmentCategory,
  PerformanceGoal, 
  BodyGoal, 
  QuickGoal,
  GoalCategory 
} from './types';

// Fitness Levels with detailed descriptions
export const FITNESS_LEVELS: FitnessLevel[] = [
  {
    id: 'beginner',
    title: 'Beginner',
    icon: 'leaf-outline',
    description: 'New to fitness or returning after a long break',
    features: [
      'Lower reps (8-10)',
      'Lighter weights',
      'More rest time',
      'Form-focused exercises'
    ],
    color: '#10B981'
  },
  {
    id: 'intermediate',
    title: 'Intermediate',
    icon: 'fitness-outline',
    description: 'Comfortable with basic exercises and techniques',
    features: [
      'Moderate reps (10-12)',
      'Progressive weight',
      'Balanced rest periods',
      'Mixed exercises'
    ],
    color: '#2563EB'
  },
  {
    id: 'advanced',
    title: 'Advanced',
    icon: 'flame-outline',
    description: 'Experienced lifter with strong technique',
    features: [
      'Higher reps (12-15)',
      'Heavy weights',
      'Shorter rest periods',
      'Complex movements'
    ],
    color: '#DC2626'
  }
];

// Body Parts Options
export const BODY_PARTS: BodyPartOption[] = [
  { id: 'chest', label: 'Chest', icon: 'fitness-outline' },
  { id: 'back', label: 'Back', icon: 'body-outline' },
  { id: 'shoulders', label: 'Shoulders', icon: 'accessibility-outline' },
  { id: 'arms', label: 'Arms', icon: 'barbell-outline' },
  { id: 'legs', label: 'Legs', icon: 'walk-outline' },
  { id: 'core', label: 'Core', icon: 'flame-outline' },
  { id: 'glutes', label: 'Glutes', icon: 'trending-up-outline' },
  { id: 'calves', label: 'Calves', icon: 'footsteps-outline' },
];

// Equipment Categories for section headers
export const EQUIPMENT_CATEGORIES: { id: EquipmentCategory; label: string; icon: string }[] = [
  { id: 'cardio', label: 'Cardio', icon: 'heart-outline' },
  { id: 'free_weights', label: 'Free Weights', icon: 'barbell-outline' },
  { id: 'strength_machines', label: 'Strength Machines', icon: 'fitness-outline' },
  { id: 'functional', label: 'Functional', icon: 'body-outline' },
  { id: 'recovery', label: 'Recovery', icon: 'medical-outline' },
];

// Equipment Options - Full 59-item library organized by category
export const EQUIPMENT_OPTIONS: EquipmentOption[] = [
  // ========== CARDIO (9 items) ==========
  { id: 'treadmill', label: 'Treadmill', icon: 'walk-outline', category: 'cardio', difficulty: 'all_levels' },
  { id: 'elliptical', label: 'Elliptical Machine', icon: 'infinite-outline', category: 'cardio', difficulty: 'all_levels' },
  { id: 'stationary_bike', label: 'Stationary Bike', icon: 'bicycle-outline', category: 'cardio', difficulty: 'all_levels' },
  { id: 'spin_bike', label: 'Spin Bike / Indoor Cycle', icon: 'bicycle', category: 'cardio', difficulty: 'beginner' },
  { id: 'rowing_machine', label: 'Rowing Machine', icon: 'boat-outline', category: 'cardio', difficulty: 'beginner' },
  { id: 'stair_climber', label: 'Stair Climber / StairMaster', icon: 'trending-up-outline', category: 'cardio', difficulty: 'intermediate' },
  { id: 'assault_bike', label: 'Assault Bike / Air Bike', icon: 'flash-outline', category: 'cardio', difficulty: 'intermediate' },
  { id: 'ski_erg', label: 'Ski Erg', icon: 'snow-outline', category: 'cardio', difficulty: 'intermediate' },
  { id: 'jacobs_ladder', label: "Jacob's Ladder", icon: 'arrow-up-outline', category: 'cardio', difficulty: 'advanced' },

  // ========== FREE WEIGHTS (7 items) ==========
  { id: 'dumbbells', label: 'Dumbbells', icon: 'barbell-outline', category: 'free_weights', difficulty: 'all_levels' },
  { id: 'barbell', label: 'Barbell', icon: 'barbell', category: 'free_weights', difficulty: 'beginner' },
  { id: 'kettlebells', label: 'Kettlebells', icon: 'disc-outline', category: 'free_weights', difficulty: 'beginner' },
  { id: 'ez_curl_bar', label: 'EZ Curl Bar', icon: 'remove-outline', category: 'free_weights', difficulty: 'beginner' },
  { id: 'trap_bar', label: 'Trap Bar / Hex Bar', icon: 'square-outline', category: 'free_weights', difficulty: 'intermediate' },
  { id: 'weight_plates', label: 'Weight Plates', icon: 'ellipse-outline', category: 'free_weights', difficulty: 'all_levels' },
  { id: 'resistance_bands', label: 'Resistance Bands', icon: 'git-pull-request-outline', category: 'free_weights', difficulty: 'all_levels' },

  // ========== STRENGTH MACHINES (24 items) ==========
  { id: 'bench_press_station', label: 'Bench Press Station', icon: 'bed-outline', category: 'strength_machines', difficulty: 'beginner' },
  { id: 'incline_bench', label: 'Incline Bench', icon: 'trending-up-outline', category: 'strength_machines', difficulty: 'beginner' },
  { id: 'squat_rack', label: 'Squat Rack / Power Rack', icon: 'grid-outline', category: 'strength_machines', difficulty: 'beginner' },
  { id: 'smith_machine', label: 'Smith Machine', icon: 'apps-outline', category: 'strength_machines', difficulty: 'beginner' },
  { id: 'cable_machine', label: 'Cable Machine', icon: 'git-branch-outline', category: 'strength_machines', difficulty: 'all_levels' },
  { id: 'lat_pulldown', label: 'Lat Pulldown Machine', icon: 'arrow-down-outline', category: 'strength_machines', difficulty: 'beginner' },
  { id: 'seated_row', label: 'Seated Cable Row', icon: 'swap-horizontal-outline', category: 'strength_machines', difficulty: 'beginner' },
  { id: 'leg_press', label: 'Leg Press Machine', icon: 'footsteps-outline', category: 'strength_machines', difficulty: 'beginner' },
  { id: 'leg_curl', label: 'Leg Curl Machine', icon: 'return-down-back-outline', category: 'strength_machines', difficulty: 'beginner' },
  { id: 'leg_extension', label: 'Leg Extension Machine', icon: 'return-up-forward-outline', category: 'strength_machines', difficulty: 'beginner' },
  { id: 'chest_press', label: 'Chest Press Machine', icon: 'push-outline', category: 'strength_machines', difficulty: 'beginner' },
  { id: 'pec_deck', label: 'Pec Deck / Chest Fly Machine', icon: 'contract-outline', category: 'strength_machines', difficulty: 'beginner' },
  { id: 'shoulder_press_machine', label: 'Shoulder Press Machine', icon: 'chevron-up-outline', category: 'strength_machines', difficulty: 'beginner' },
  { id: 'assisted_dip_pullup', label: 'Assisted Dip/Pull-up Machine', icon: 'help-outline', category: 'strength_machines', difficulty: 'beginner' },
  { id: 'hack_squat', label: 'Hack Squat Machine', icon: 'analytics-outline', category: 'strength_machines', difficulty: 'intermediate' },
  { id: 'hip_abductor', label: 'Hip Abductor Machine', icon: 'expand-outline', category: 'strength_machines', difficulty: 'beginner' },
  { id: 'hip_adductor', label: 'Hip Adductor Machine', icon: 'contract-outline', category: 'strength_machines', difficulty: 'beginner' },
  { id: 'calf_raise', label: 'Calf Raise Machine', icon: 'footsteps-outline', category: 'strength_machines', difficulty: 'beginner' },
  { id: 'pendulum_squat', label: 'Pendulum Squat Machine', icon: 'timer-outline', category: 'strength_machines', difficulty: 'intermediate' },
  { id: 'belt_squat', label: 'Belt Squat Machine', icon: 'ribbon-outline', category: 'strength_machines', difficulty: 'intermediate' },
  { id: 'hip_thrust_machine', label: 'Hip Thrust Machine', icon: 'arrow-up-circle-outline', category: 'strength_machines', difficulty: 'beginner' },
  { id: 'ghd', label: 'Glute-Ham Raise (GHD)', icon: 'body-outline', category: 'strength_machines', difficulty: 'intermediate' },
  { id: 'preacher_curl', label: 'Preacher Curl Station', icon: 'hand-right-outline', category: 'strength_machines', difficulty: 'beginner' },
  { id: 'landmine', label: 'Landmine Attachment', icon: 'locate-outline', category: 'strength_machines', difficulty: 'intermediate' },

  // ========== FUNCTIONAL (13 items) ==========
  { id: 'pull_up_bar', label: 'Pull-up Bar', icon: 'resize-outline', category: 'functional', difficulty: 'beginner' },
  { id: 'dip_station', label: 'Dip Station / Parallel Bars', icon: 'remove-outline', category: 'functional', difficulty: 'intermediate' },
  { id: 'medicine_ball', label: 'Medicine Ball', icon: 'basketball-outline', category: 'functional', difficulty: 'all_levels' },
  { id: 'stability_ball', label: 'Stability Ball / Swiss Ball', icon: 'ellipse-outline', category: 'functional', difficulty: 'all_levels' },
  { id: 'bosu_ball', label: 'BOSU Ball', icon: 'radio-button-on-outline', category: 'functional', difficulty: 'beginner' },
  { id: 'trx', label: 'TRX Suspension Trainer', icon: 'git-pull-request-outline', category: 'functional', difficulty: 'intermediate' },
  { id: 'battle_ropes', label: 'Battle Ropes', icon: 'pulse-outline', category: 'functional', difficulty: 'intermediate' },
  { id: 'plyo_box', label: 'Plyo Box / Jump Box', icon: 'cube-outline', category: 'functional', difficulty: 'beginner' },
  { id: 'ab_bench', label: 'Ab Bench / Decline Bench', icon: 'trending-down-outline', category: 'functional', difficulty: 'beginner' },
  { id: 'hyperextension_bench', label: 'Hyperextension Bench / Roman Chair', icon: 'chevron-down-circle-outline', category: 'functional', difficulty: 'beginner' },
  { id: 'sled', label: 'Prowler / Weight Sled', icon: 'car-sport-outline', category: 'functional', difficulty: 'intermediate' },
  { id: 'gymnastic_rings', label: 'Gymnastic Rings', icon: 'radio-button-off-outline', category: 'functional', difficulty: 'advanced' },
  { id: 'ab_wheel', label: 'Ab Wheel / Ab Roller', icon: 'sync-outline', category: 'functional', difficulty: 'beginner' },

  // ========== RECOVERY (6 items) ==========
  { id: 'foam_roller', label: 'Foam Roller', icon: 'reload-outline', category: 'recovery', difficulty: 'all_levels' },
  { id: 'yoga_mat', label: 'Yoga Mat', icon: 'square-outline', category: 'recovery', difficulty: 'all_levels' },
  { id: 'stretching_strap', label: 'Stretching Strap', icon: 'link-outline', category: 'recovery', difficulty: 'all_levels' },
  { id: 'massage_ball', label: 'Lacrosse Ball / Massage Ball', icon: 'baseball-outline', category: 'recovery', difficulty: 'all_levels' },
  { id: 'massage_gun', label: 'Massage Gun / Percussion Device', icon: 'flashlight-outline', category: 'recovery', difficulty: 'all_levels' },
  { id: 'mobility_bands', label: 'Mobility/Stretch Bands', icon: 'git-commit-outline', category: 'recovery', difficulty: 'all_levels' },
];

// Helper function to get equipment by category
export const getEquipmentByCategory = (category: EquipmentCategory): EquipmentOption[] => {
  return EQUIPMENT_OPTIONS.filter(eq => eq.category === category);
};

// Helper function to get equipment counts by category
export const getEquipmentCounts = (): Record<EquipmentCategory, number> => {
  return {
    cardio: EQUIPMENT_OPTIONS.filter(eq => eq.category === 'cardio').length,
    free_weights: EQUIPMENT_OPTIONS.filter(eq => eq.category === 'free_weights').length,
    strength_machines: EQUIPMENT_OPTIONS.filter(eq => eq.category === 'strength_machines').length,
    functional: EQUIPMENT_OPTIONS.filter(eq => eq.category === 'functional').length,
    recovery: EQUIPMENT_OPTIONS.filter(eq => eq.category === 'recovery').length,
  };
};

// Performance Goals - What sport/activity you want to train for
export const PERFORMANCE_GOALS: PerformanceGoal[] = [
  // Running - primarily legs, core, and cardiovascular
  { id: 'run_5k_starter', label: '5K Starter', icon: 'footsteps-outline', category: 'running', duration: 30, description: '8-week beginner running', targetAreas: ['legs', 'core', 'calves'] },
  { id: 'run_5k', label: '5K Training', icon: 'speedometer-outline', category: 'running', duration: 35, description: 'Improve your 5K time', targetAreas: ['legs', 'core', 'calves'] },
  { id: 'run_10k', label: '10K Training', icon: 'timer-outline', category: 'running', duration: 45, description: 'Build endurance for 10K', targetAreas: ['legs', 'core', 'calves', 'glutes'] },
  { id: 'run_half', label: 'Half Marathon', icon: 'medal-outline', category: 'running', duration: 60, description: '12-week prep', targetAreas: ['legs', 'core', 'calves', 'glutes'] },
  { id: 'run_marathon', label: 'Marathon', icon: 'trophy-outline', category: 'running', duration: 90, description: '16-week training', targetAreas: ['legs', 'core', 'calves', 'glutes'] },
  { id: 'triathlon', label: 'Triathlon', icon: 'ribbon-outline', category: 'running', duration: 120, description: 'Swim, bike, run', targetAreas: ['legs', 'core', 'shoulders', 'back', 'arms'] },
  // Sports - various body part combinations
  { id: 'cycling', label: 'Cycling', icon: 'bicycle-outline', category: 'sports', duration: 45, description: 'Road & mountain biking', targetAreas: ['legs', 'core', 'glutes', 'calves'] },
  { id: 'football', label: 'Football', icon: 'american-football-outline', category: 'sports', duration: 60, description: 'Strength & agility', targetAreas: ['legs', 'core', 'shoulders', 'chest', 'arms'] },
  { id: 'soccer', label: 'Soccer', icon: 'football-outline', category: 'sports', duration: 50, description: 'Endurance & footwork', targetAreas: ['legs', 'core', 'calves', 'glutes'] },
  { id: 'basketball', label: 'Basketball', icon: 'basketball-outline', category: 'sports', duration: 45, description: 'Vertical leap & stamina', targetAreas: ['legs', 'core', 'shoulders', 'arms', 'calves'] },
  { id: 'tennis', label: 'Tennis', icon: 'tennisball-outline', category: 'sports', duration: 40, description: 'Agility & power', targetAreas: ['shoulders', 'arms', 'core', 'legs'] },
  { id: 'golf', label: 'Golf', icon: 'golf-outline', category: 'sports', duration: 35, description: 'Swing & flexibility', targetAreas: ['core', 'shoulders', 'back', 'arms'] },
  { id: 'swimming', label: 'Swimming', icon: 'water-outline', category: 'sports', duration: 45, description: 'Full-body aquatic', targetAreas: ['shoulders', 'back', 'core', 'arms', 'legs'] },
  { id: 'baseball', label: 'Baseball', icon: 'baseball-outline', category: 'sports', duration: 45, description: 'Throwing & batting', targetAreas: ['shoulders', 'arms', 'core', 'legs'] },
  { id: 'hockey', label: 'Hockey', icon: 'snow-outline', category: 'sports', duration: 50, description: 'Skating & stick work', targetAreas: ['legs', 'core', 'shoulders', 'arms', 'glutes'] },
  { id: 'volleyball', label: 'Volleyball', icon: 'hand-left-outline', category: 'sports', duration: 40, description: 'Jumping & spiking', targetAreas: ['shoulders', 'legs', 'core', 'arms', 'calves'] },
];

// Body Goals - What physical outcome you want
export const BODY_GOALS: BodyGoal[] = [
  { id: 'build_muscle', label: 'Build Muscle', icon: 'barbell-outline', description: 'Gain strength & size', targetAreas: ['chest', 'back', 'legs', 'shoulders', 'arms'] },
  { id: 'lose_weight', label: 'Lose Weight', icon: 'trending-down-outline', description: 'Burn fat & calories', targetAreas: [] },
  { id: 'get_toned', label: 'Get Toned', icon: 'body-outline', description: 'Lean & defined look', targetAreas: ['core', 'arms', 'legs'] },
  { id: 'improve_endurance', label: 'Endurance', icon: 'heart-outline', description: 'Better stamina & cardio', targetAreas: [] },
  { id: 'increase_flexibility', label: 'Flexibility', icon: 'fitness-outline', description: 'Mobility & stretching', targetAreas: [] },
  { id: 'general_fitness', label: 'General Fitness', icon: 'pulse-outline', description: 'Overall health & wellness', targetAreas: [] },
  { id: 'six_pack', label: 'Six Pack Abs', icon: 'flame-outline', description: 'Core strength & definition', targetAreas: ['core'] },
  { id: 'stronger_legs', label: 'Stronger Legs', icon: 'walk-outline', description: 'Lower body power', targetAreas: ['legs', 'glutes', 'calves'] },
  { id: 'upper_body', label: 'Upper Body', icon: 'fitness-outline', description: 'Chest, back & arms', targetAreas: ['chest', 'back', 'shoulders', 'arms'] },
];

// Quick workout types (for quick selection)
export const QUICK_GOALS: QuickGoal[] = [
  // Strength Training
  { label: 'Full Body', icon: 'fitness-outline', bodyParts: ['chest', 'back', 'legs', 'shoulders'], duration: 45, category: 'strength' },
  { label: 'Leg Day', icon: 'walk-outline', bodyParts: ['legs', 'glutes', 'calves'], duration: 40, category: 'strength' },
  { label: 'Upper Body', icon: 'barbell-outline', bodyParts: ['chest', 'back', 'shoulders', 'arms'], duration: 35, category: 'strength' },
  { label: 'Core Blast', icon: 'flame-outline', bodyParts: ['core'], duration: 20, category: 'strength' },
  // Cardio & HIIT
  { label: 'Cardio', icon: 'heart-outline', bodyParts: [], duration: 30, category: 'cardio' },
  { label: 'HIIT', icon: 'flash-outline', bodyParts: [], duration: 25, category: 'cardio' },
];

// Performance goal categories
export const PERFORMANCE_CATEGORIES: GoalCategory[] = [
  { id: 'all', label: 'All', icon: 'apps-outline' },
  { id: 'running', label: 'Running', icon: 'footsteps-outline' },
  { id: 'sports', label: 'Sports', icon: 'football-outline' },
];

// Goal categories for filtering
export const GOAL_CATEGORIES: GoalCategory[] = [
  { id: 'all', label: 'All', icon: 'apps-outline' },
  { id: 'strength', label: 'Strength', icon: 'barbell-outline' },
  { id: 'cardio', label: 'Cardio', icon: 'heart-outline' },
];

// Exercise Colors for preview cards
export const EXERCISE_COLORS = ['#4cbb17', '#6366f1', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4'];

// Day Names
export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Workout Day Colors for calendar
export const WORKOUT_DAY_COLORS = [
  { bg: '#fff7ed', border: '#fa5f06', text: '#fa5f06' }, // Orange
  { bg: '#ecfdf5', border: '#4cbb17', text: '#4cbb17' }, // Green  
  { bg: '#eff6ff', border: '#3b82f6', text: '#3b82f6' }, // Blue
  { bg: '#fdf4ff', border: '#a855f7', text: '#a855f7' }, // Purple
];
