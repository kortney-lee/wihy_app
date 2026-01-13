import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Dumbbell,
  Heart,
  Target,
  Layers,
  Activity,
  Check,
  ChevronDown,
  ChevronUp,
  Info,
  Filter,
  X
} from 'lucide-react';
import { FitnessLevel, EquipmentItem as EquipmentItemType } from '../../types/fitness';
import { fitnessService } from '../../services/fitnessService';

// Brand colors from BRAND_GUIDE.md - Desktop Web Standard
const BRAND_COLORS = {
  primary: '#fa5f06',      // WiHY Orange
  success: '#4cbb17',      // Kelly Green
  background: '#e0f2fe',   // Light Blue - Standard page background
  cardBackground: '#ffffff',
  textPrimary: '#1f2937',  // Gray-800
  textSecondary: '#6b7280', // Gray-500
  border: '#e5e7eb',       // Gray-200
  white: '#ffffff'
};

// Equipment categories with icons
const EQUIPMENT_CATEGORIES = [
  { id: 'cardio', name: 'Cardio', icon: Heart, color: '#EF4444' },
  { id: 'free_weights', name: 'Free Weights', icon: Dumbbell, color: '#3B82F6' },
  { id: 'strength_machines', name: 'Strength Machines', icon: Layers, color: '#8B5CF6' },
  { id: 'functional', name: 'Functional', icon: Activity, color: '#10B981' },
  { id: 'recovery', name: 'Recovery', icon: Target, color: '#F59E0B' }
];

// Default equipment data (fallback when API is not available)
const DEFAULT_EQUIPMENT: Record<string, Array<{ id: string; name: string; difficulty: string }>> = {
  cardio: [
    { id: 'treadmill', name: 'Treadmill', difficulty: 'all_levels' },
    { id: 'elliptical', name: 'Elliptical Machine', difficulty: 'all_levels' },
    { id: 'stationary_bike', name: 'Stationary Bike', difficulty: 'all_levels' },
    { id: 'spin_bike', name: 'Spin Bike / Indoor Cycle', difficulty: 'intermediate' },
    { id: 'rowing_machine', name: 'Rowing Machine', difficulty: 'beginner' },
    { id: 'stair_climber', name: 'Stair Climber / StairMaster', difficulty: 'intermediate' },
    { id: 'assault_bike', name: 'Assault Bike / Air Bike', difficulty: 'intermediate' },
    { id: 'ski_erg', name: 'Ski Erg', difficulty: 'intermediate' },
    { id: 'jacobs_ladder', name: 'Jacob\'s Ladder', difficulty: 'advanced' }
  ],
  free_weights: [
    { id: 'dumbbells', name: 'Dumbbells', difficulty: 'all_levels' },
    { id: 'barbell', name: 'Barbell', difficulty: 'intermediate' },
    { id: 'kettlebells', name: 'Kettlebells', difficulty: 'intermediate' },
    { id: 'ez_curl_bar', name: 'EZ Curl Bar', difficulty: 'beginner' },
    { id: 'trap_bar', name: 'Trap Bar / Hex Bar', difficulty: 'intermediate' },
    { id: 'weight_plates', name: 'Weight Plates', difficulty: 'all_levels' },
    { id: 'resistance_bands', name: 'Resistance Bands', difficulty: 'all_levels' }
  ],
  strength_machines: [
    { id: 'bench_press_station', name: 'Bench Press Station', difficulty: 'intermediate' },
    { id: 'incline_bench', name: 'Incline Bench', difficulty: 'beginner' },
    { id: 'squat_rack', name: 'Squat Rack / Power Rack', difficulty: 'intermediate' },
    { id: 'smith_machine', name: 'Smith Machine', difficulty: 'beginner' },
    { id: 'cable_machine', name: 'Cable Machine', difficulty: 'all_levels' },
    { id: 'lat_pulldown', name: 'Lat Pulldown Machine', difficulty: 'beginner' },
    { id: 'seated_cable_row', name: 'Seated Cable Row', difficulty: 'beginner' },
    { id: 'leg_press', name: 'Leg Press Machine', difficulty: 'beginner' },
    { id: 'leg_curl', name: 'Leg Curl Machine', difficulty: 'beginner' },
    { id: 'leg_extension', name: 'Leg Extension Machine', difficulty: 'beginner' },
    { id: 'chest_press', name: 'Chest Press Machine', difficulty: 'beginner' },
    { id: 'pec_deck', name: 'Pec Deck / Chest Fly Machine', difficulty: 'beginner' },
    { id: 'shoulder_press', name: 'Shoulder Press Machine', difficulty: 'beginner' },
    { id: 'assisted_dip_pullup', name: 'Assisted Dip/Pull-up Machine', difficulty: 'beginner' },
    { id: 'hack_squat', name: 'Hack Squat Machine', difficulty: 'intermediate' },
    { id: 'hip_abductor', name: 'Hip Abductor Machine', difficulty: 'beginner' },
    { id: 'hip_adductor', name: 'Hip Adductor Machine', difficulty: 'beginner' },
    { id: 'calf_raise', name: 'Calf Raise Machine', difficulty: 'beginner' },
    { id: 'hip_thrust', name: 'Hip Thrust Machine', difficulty: 'intermediate' },
    { id: 'ghd', name: 'Glute-Ham Raise (GHD)', difficulty: 'advanced' },
    { id: 'preacher_curl', name: 'Preacher Curl Station', difficulty: 'beginner' },
    { id: 'landmine', name: 'Landmine Attachment', difficulty: 'intermediate' }
  ],
  functional: [
    { id: 'pull_up_bar', name: 'Pull-up Bar', difficulty: 'intermediate' },
    { id: 'dip_station', name: 'Dip Station / Parallel Bars', difficulty: 'intermediate' },
    { id: 'medicine_ball', name: 'Medicine Ball', difficulty: 'all_levels' },
    { id: 'stability_ball', name: 'Stability Ball / Swiss Ball', difficulty: 'beginner' },
    { id: 'bosu_ball', name: 'BOSU Ball', difficulty: 'intermediate' },
    { id: 'trx', name: 'TRX Suspension Trainer', difficulty: 'intermediate' },
    { id: 'battle_ropes', name: 'Battle Ropes', difficulty: 'intermediate' },
    { id: 'plyo_box', name: 'Plyo Box / Jump Box', difficulty: 'intermediate' },
    { id: 'ab_bench', name: 'Ab Bench / Decline Bench', difficulty: 'beginner' },
    { id: 'hyperextension_bench', name: 'Hyperextension Bench / Roman Chair', difficulty: 'beginner' },
    { id: 'prowler', name: 'Prowler / Weight Sled', difficulty: 'advanced' },
    { id: 'gymnastic_rings', name: 'Gymnastic Rings', difficulty: 'advanced' },
    { id: 'ab_wheel', name: 'Ab Wheel / Ab Roller', difficulty: 'intermediate' }
  ],
  recovery: [
    { id: 'foam_roller', name: 'Foam Roller', difficulty: 'all_levels' },
    { id: 'yoga_mat', name: 'Yoga Mat', difficulty: 'all_levels' },
    { id: 'stretching_strap', name: 'Stretching Strap', difficulty: 'all_levels' },
    { id: 'lacrosse_ball', name: 'Lacrosse Ball / Massage Ball', difficulty: 'all_levels' },
    { id: 'massage_gun', name: 'Massage Gun / Percussion Device', difficulty: 'all_levels' },
    { id: 'mobility_bands', name: 'Mobility/Stretch Bands', difficulty: 'all_levels' }
  ]
};

interface EquipmentSelectionProps {
  fitnessLevel: FitnessLevel;
  selectedEquipment: string[];
  onEquipmentChange: (equipment: string[]) => void;
  onContinue: () => void;
  onBack: () => void;
  onChangeFitnessLevel: () => void;
}

interface CategoryEquipment {
  categoryId: string;
  categoryName: string;
  icon: React.ElementType;
  color: string;
  items: Array<{
    id: string;
    name: string;
    difficulty: string;
  }>;
}

const EquipmentSelection: React.FC<EquipmentSelectionProps> = ({
  fitnessLevel,
  selectedEquipment,
  onEquipmentChange,
  onContinue,
  onBack,
  onChangeFitnessLevel
}) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['free_weights', 'functional', 'strength_machines'])
  );
  const [isLoading, setIsLoading] = useState(true);
  const [equipmentData, setEquipmentData] = useState<CategoryEquipment[]>([]);
  const [filterByLevel, setFilterByLevel] = useState(false);

  // Fetch equipment from API or use defaults
  useEffect(() => {
    const fetchEquipment = async () => {
      setIsLoading(true);
      try {
        const response = await fitnessService.getEquipment(
          filterByLevel ? { difficulty: fitnessLevel } : undefined
        );
        
        if (response.success && response.equipment.length > 0) {
          const grouped: Record<string, EquipmentItemType[]> = {};
          response.equipment.forEach((item: EquipmentItemType) => {
            const category = item.category || 'other';
            if (!grouped[category]) grouped[category] = [];
            grouped[category].push(item);
          });
          
          const formattedData = EQUIPMENT_CATEGORIES.map(cat => ({
            categoryId: cat.id,
            categoryName: cat.name,
            icon: cat.icon,
            color: cat.color,
            items: (grouped[cat.id] || []).map(item => ({
              id: item.id,
              name: item.name,
              difficulty: item.difficulty
            }))
          })).filter(cat => cat.items.length > 0);
          
          setEquipmentData(formattedData);
        } else {
          useDefaultEquipment();
        }
      } catch (error) {
        console.warn('Failed to fetch equipment from API, using defaults:', error);
        useDefaultEquipment();
      } finally {
        setIsLoading(false);
      }
    };

    const useDefaultEquipment = () => {
      const formattedData = EQUIPMENT_CATEGORIES.map(cat => {
        let items = DEFAULT_EQUIPMENT[cat.id] || [];
        
        if (filterByLevel) {
          items = items.filter(item => 
            item.difficulty === 'all_levels' || 
            item.difficulty === fitnessLevel ||
            (fitnessLevel === 'intermediate' && item.difficulty === 'beginner') ||
            (fitnessLevel === 'advanced')
          );
        }
        
        return {
          categoryId: cat.id,
          categoryName: cat.name,
          icon: cat.icon,
          color: cat.color,
          items
        };
      }).filter(cat => cat.items.length > 0);
      
      setEquipmentData(formattedData);
    };

    fetchEquipment();
  }, [fitnessLevel, filterByLevel]);

  const toggleCategory = useCallback((categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  }, []);

  const toggleEquipment = useCallback((equipmentId: string) => {
    const newSelection = selectedEquipment.includes(equipmentId)
      ? selectedEquipment.filter(id => id !== equipmentId)
      : [...selectedEquipment, equipmentId];
    onEquipmentChange(newSelection);
  }, [selectedEquipment, onEquipmentChange]);

  const selectAllInCategory = useCallback((categoryId: string) => {
    const category = equipmentData.find(c => c.categoryId === categoryId);
    if (!category) return;
    
    const categoryItemIds = category.items.map(item => item.id);
    const allSelected = categoryItemIds.every(id => selectedEquipment.includes(id));
    
    if (allSelected) {
      onEquipmentChange(selectedEquipment.filter(id => !categoryItemIds.includes(id)));
    } else {
      const newSelection = [...new Set([...selectedEquipment, ...categoryItemIds])];
      onEquipmentChange(newSelection);
    }
  }, [equipmentData, selectedEquipment, onEquipmentChange]);

  const clearAll = useCallback(() => {
    onEquipmentChange([]);
  }, [onEquipmentChange]);

  const totalItems = useMemo(() => 
    equipmentData.reduce((sum, cat) => sum + cat.items.length, 0),
    [equipmentData]
  );

  const getDifficultyBadge = (difficulty: string) => {
    if (difficulty === 'all_levels') return null;
    
    const colors: Record<string, { bg: string; text: string }> = {
      beginner: { bg: '#10B98120', text: '#10B981' },
      intermediate: { bg: '#F59E0B20', text: '#F59E0B' },
      advanced: { bg: '#EF444420', text: '#EF4444' }
    };
    
    const style = colors[difficulty] || colors.intermediate;
    
    return (
      <span 
        className="text-xs font-medium px-2 py-0.5 rounded-full ml-2"
        style={{ backgroundColor: style.bg, color: style.text }}
      >
        {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
      </span>
    );
  };

  const getLevelColor = (level: FitnessLevel): string => {
    switch (level) {
      case 'beginner': return BRAND_COLORS.success;
      case 'intermediate': return BRAND_COLORS.primary;
      case 'advanced': return '#DC2626';
      default: return BRAND_COLORS.textSecondary;
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${BRAND_COLORS.primary}15` }}
            >
              <Dumbbell className="w-5 h-5" style={{ color: BRAND_COLORS.primary }} />
            </div>
            <div>
              <h2 className="text-lg font-bold" style={{ color: BRAND_COLORS.textPrimary }}>
                Available Equipment
              </h2>
              <p className="text-sm" style={{ color: BRAND_COLORS.textSecondary }}>
                Select the equipment you have access to
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Filter Toggle */}
            <button
              onClick={() => setFilterByLevel(!filterByLevel)}
              className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                filterByLevel ? 'shadow-sm' : 'hover:bg-gray-50'
              }`}
              style={{ 
                backgroundColor: filterByLevel ? `${BRAND_COLORS.primary}10` : 'transparent',
                border: `1px solid ${filterByLevel ? BRAND_COLORS.primary : BRAND_COLORS.border}`
              }}
            >
              <Filter className="w-4 h-4" style={{ color: filterByLevel ? BRAND_COLORS.primary : BRAND_COLORS.textSecondary }} />
              <span style={{ color: filterByLevel ? BRAND_COLORS.primary : BRAND_COLORS.textPrimary }}>
                Filter by Level
              </span>
            </button>
            
            {/* Level Badge */}
            <button
              onClick={onChangeFitnessLevel}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 transition-all"
              style={{ border: `1px solid ${BRAND_COLORS.border}` }}
            >
              <span 
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: getLevelColor(fitnessLevel) }}
              />
              <span className="text-sm font-medium" style={{ color: getLevelColor(fitnessLevel) }}>
                {fitnessLevel.charAt(0).toUpperCase() + fitnessLevel.slice(1)}
              </span>
              <ChevronDown className="w-4 h-4" style={{ color: BRAND_COLORS.textSecondary }} />
            </button>
          </div>
        </div>
      </div>

      {/* Selection Summary Bar */}
      <div 
        className="px-6 py-3 flex items-center justify-between"
        style={{ backgroundColor: '#f9fafb', borderBottom: `1px solid ${BRAND_COLORS.border}` }}
      >
        <div className="flex items-center gap-4">
          <span className="text-sm" style={{ color: BRAND_COLORS.textSecondary }}>
            <span className="font-semibold" style={{ color: BRAND_COLORS.primary }}>
              {selectedEquipment.length}
            </span> of {totalItems} items selected
          </span>
          
          {selectedEquipment.length > 0 && (
            <button
              onClick={clearAll}
              className="flex items-center gap-1 text-sm font-medium hover:underline"
              style={{ color: '#EF4444' }}
            >
              <X className="w-3.5 h-3.5" />
              Clear All
            </button>
          )}
        </div>
        
        <button
          onClick={onContinue}
          className="px-5 py-2 rounded-lg font-medium text-white transition-all hover:opacity-90"
          style={{ backgroundColor: BRAND_COLORS.primary }}
        >
          Continue →
        </button>
      </div>

      {/* Equipment Categories - Two Column Grid for Desktop */}
      <div className="p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div 
              className="w-8 h-8 border-3 rounded-full animate-spin"
              style={{ 
                borderColor: `${BRAND_COLORS.primary}20`,
                borderTopColor: BRAND_COLORS.primary 
              }}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {equipmentData.map(category => {
              const isExpanded = expandedCategories.has(category.categoryId);
              const selectedInCategory = category.items.filter(item => 
                selectedEquipment.includes(item.id)
              ).length;
              const Icon = category.icon;
              
              return (
                <div 
                  key={category.categoryId}
                  className="rounded-xl border overflow-hidden"
                  style={{ borderColor: BRAND_COLORS.border }}
                >
                  {/* Category Header */}
                  <button
                    onClick={() => toggleCategory(category.categoryId)}
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-9 h-9 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${category.color}15` }}
                      >
                        <Icon className="w-4 h-4" style={{ color: category.color }} />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold" style={{ color: BRAND_COLORS.textPrimary }}>
                          {category.categoryName}
                        </p>
                        <p className="text-xs" style={{ color: BRAND_COLORS.textSecondary }}>
                          {category.items.length} items
                          {selectedInCategory > 0 && (
                            <span className="ml-2 font-medium" style={{ color: BRAND_COLORS.primary }}>
                              • {selectedInCategory} selected
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          selectAllInCategory(category.categoryId);
                        }}
                        className="text-xs font-medium px-2 py-1 rounded hover:bg-gray-100 transition-all"
                        style={{ color: BRAND_COLORS.primary }}
                      >
                        {category.items.every(item => selectedEquipment.includes(item.id)) ? 'Deselect' : 'Select All'}
                      </button>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5" style={{ color: BRAND_COLORS.textSecondary }} />
                      ) : (
                        <ChevronDown className="w-5 h-5" style={{ color: BRAND_COLORS.textSecondary }} />
                      )}
                    </div>
                  </button>
                  
                  {/* Category Items */}
                  {isExpanded && (
                    <div className="px-4 pb-4 grid grid-cols-1 gap-1.5">
                      {category.items.map(item => {
                        const isSelected = selectedEquipment.includes(item.id);
                        
                        return (
                          <button
                            key={item.id}
                            onClick={() => toggleEquipment(item.id)}
                            className={`flex items-center justify-between p-2.5 rounded-lg border transition-all ${
                              isSelected ? 'shadow-sm' : 'hover:bg-gray-50'
                            }`}
                            style={{
                              borderColor: isSelected ? BRAND_COLORS.primary : BRAND_COLORS.border,
                              backgroundColor: isSelected ? `${BRAND_COLORS.primary}05` : 'transparent'
                            }}
                          >
                            <div className="flex items-center gap-2.5">
                              <div 
                                className={`w-5 h-5 rounded flex items-center justify-center border-2 transition-all`}
                                style={{
                                  borderColor: isSelected ? BRAND_COLORS.primary : '#d1d5db',
                                  backgroundColor: isSelected ? BRAND_COLORS.primary : 'transparent'
                                }}
                              >
                                {isSelected && <Check className="w-3 h-3 text-white" />}
                              </div>
                              <span 
                                className="text-sm"
                                style={{ color: isSelected ? BRAND_COLORS.primary : BRAND_COLORS.textPrimary }}
                              >
                                {item.name}
                              </span>
                              {getDifficultyBadge(item.difficulty)}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Tip */}
        <div 
          className="flex items-start gap-3 mt-6 p-4 rounded-xl"
          style={{ backgroundColor: `${BRAND_COLORS.success}08`, border: `1px solid ${BRAND_COLORS.success}20` }}
        >
          <Info className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: BRAND_COLORS.success }} />
          <div>
            <p className="text-sm font-medium" style={{ color: BRAND_COLORS.success }}>
              Don't worry if you have limited equipment!
            </p>
            <p className="text-sm mt-1" style={{ color: BRAND_COLORS.textSecondary }}>
              Our AI will create the perfect workout with whatever you have available. Even bodyweight-only workouts can be highly effective.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EquipmentSelection;
