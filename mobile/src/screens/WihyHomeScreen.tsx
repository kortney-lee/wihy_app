import React, { useMemo, useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Image,
  Platform,
  useWindowDimensions,
  Alert,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { RootStackParamList, TabParamList } from '../types/navigation';
import type { CompositeNavigationProp } from '@react-navigation/native';
import { SweepBorder } from '../components/SweepBorder';
import { getResponsiveFontSize, getResponsiveButtonSize, getResponsiveSpacing, isTablet, getDeviceType } from '../utils/responsive';
import { colors, shadows, radii, spacing } from '../theme/design-tokens';
import { AuthContext } from '../context/AuthContext';
import { Ionicons } from '../components/shared';
import MultiAuthLogin from '../components/auth/MultiAuthLogin';
import { WebNavHeader } from '../components/web/WebNavHeader';

// Import CSS for web only
if (Platform.OS === 'web') {
  require('../styles/web-landing.css');
}

const isWeb = Platform.OS === 'web';

// Tablet breakpoint
const TABLET_BREAKPOINT = 768;

type NavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'Home'>,
  StackNavigationProp<RootStackParamList>
>;

type Props = {};

export default function WihyHomeScreen({}: Props = {}) {
  const navigation = useNavigation<NavigationProp>();
  const { width, height } = useWindowDimensions();
  const [query, setQuery] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadTextInput, setUploadTextInput] = useState('');
  const { user } = useContext(AuthContext);
  const [showLoginModal, setShowLoginModal] = useState(false);
  
  // Don't auto-show login modal - let user interact first
  // Modal will be triggered by clicking profile icon or protected features

  // Handle health button click - show subscription for non-logged-in users
  const handleHealthPress = () => {
    if (!user) {
      // Not logged in - redirect to subscription
      navigation.navigate('Subscription');
    } else {
      // Logged in (free or premium) - allow access to Health
      navigation.navigate('Health');
    }
  };
  
  // Tablet detection
  const isTabletDevice = width >= TABLET_BREAKPOINT;
  
  // Desktop detection for web features
  const isDesktop = width >= 1024;

  // Handle search submission
  const handleAnalyze = () => {
    if (query.trim() && navigation) {
      const searchQuery = query.trim().toLowerCase();
      console.log('Search query:', searchQuery);

      // Check for nutrition facts passcode (case-insensitive)
      if (searchQuery === 'nutrition apple') {
        console.log('Navigating to NutritionFacts...');
        // Navigate to NutritionFacts screen with complete mock data
        navigation.navigate('NutritionFacts', {
          foodItem: {
            name: 'Apple - Medium (182g)',
            brand: 'Fresh Produce',
            barcode: null,
            categories: ['Fresh Fruits', 'Produce'],
            analyzed: true,
            
            // Nutrition per 100g
            calories: 52,
            servingSize: { amount: 100, unit: 'g' },
            macros: {
              protein: 0.3,
              carbs: 14,
              fat: 0.2,
              fiber: 2.4,
              sugar: 10.4,
              saturated_fat: 0,
              sodium: 1,
            },
            
            // Health scoring
            health_score: 95,
            nutrition_score: 88,
            grade: 'A',
            confidence: 1.0,
            
            // Processing
            nova_group: 1,
            processing_level: 'unprocessed',
            total_additives: 0,
            total_ingredients: 1,
            
            // Health insights
            health_summary: 'Apple is a minimally processed whole food with a WIHY health score of 95/100 (Grade A - Excellent). Key finding: Excellent source of fiber and antioxidants. Recommended for daily consumption.',
            health_alerts: [],
            health_positive: [
              {
                aspect: 'high_fiber',
                message: 'Good source of dietary fiber (2.4g per 100g)',
                benefit: 'Supports digestive health and helps maintain stable blood sugar'
              },
              {
                aspect: 'low_calorie',
                message: 'Low calorie density (52 calories per 100g)',
                benefit: 'Supports healthy weight management'
              },
              {
                aspect: 'nutrient_rich',
                message: 'Rich in vitamins and antioxidants',
                benefit: 'Supports immune function and cellular health'
              }
            ],
            health_concerns: [],
            
            // Ingredients
            ingredientsText: 'Fresh Apple',
            ingredients: ['Fresh Apple'],
            allergens: [],
            additives: [],
            
            // Detailed nutrients
            nutrients: [
              { name: 'Vitamin C', amount: 4.6, unit: 'mg', dailyValue: 8, category: 'vitamin' },
              { name: 'Potassium', amount: 107, unit: 'mg', dailyValue: 2, category: 'mineral' },
              { name: 'Vitamin K', amount: 2.2, unit: 'mcg', dailyValue: 3, category: 'vitamin' },
              { name: 'Vitamin A', amount: 54, unit: 'IU', dailyValue: 1, category: 'vitamin' },
              { name: 'Folate', amount: 3, unit: 'mcg', dailyValue: 1, category: 'vitamin' },
            ],
            
            // Chart data
            charts: {
              macros: {
                protein: 0.3,
                carbs: 14,
                fat: 0.2
              },
              health_score: 95,
              nova_group: 1
            },
            
            // Chat context
            askWihy: 'Tell me about the health benefits of apples and how they support overall wellness',
          },
          context: {
            sessionId: `apple_search_${Date.now()}`,
            query: 'nutrition apple',
            type: 'search',
            scanType: 'manual',
            timestamp: new Date().toISOString(),
          },
        });
      } else if (searchQuery === 'beauty rose') {
        // Demo: Navigate to BeautyFacts with mock rose oil serum data
        console.log('Navigating to BeautyFacts...');
        navigation.navigate('BeautyFacts', {
          product: {
            success: true,
            found: true,
            search_type: 'text',
            search_value: 'rose oil serum',
            product_type: 'beauty',
            product: {
              barcode: '3700591912345',
              name: 'Rose Oil Face Serum',
              brand: 'Beauty Botanica',
              category: 'Face serums, Skincare',
              quantity: '30ml',
              packaging: 'Glass dropper bottle',
              origin_countries: 'France',
              certifications: 'Cruelty-free, Vegan',
              image_url: null,
            },
            ingredients: {
              full_list: 'Rosa Damascena Flower Oil, Squalane, Jojoba Seed Oil, Tocopherol (Vitamin E), Rosmarinus Officinalis (Rosemary) Leaf Extract, Helianthus Annuus (Sunflower) Seed Oil, Rosa Canina Fruit Oil, Fragrance',
              concerns: [
                {
                  ingredient: 'Fragrance',
                  reason: 'May contain undisclosed allergens that could cause sensitivity'
                }
              ],
              warnings: [],
              has_fragrance: true,
              has_parabens: false,
              has_sulfates: false,
            },
            metadata: {
              product_type: 'beauty',
              data_source: 'openbeautyfacts',
              database_size: '61,237 products',
            },
            timestamp: new Date().toISOString(),
          },
          context: {
            sessionId: `beauty_rose_${Date.now()}`,
            query: 'beauty rose',
            type: 'search',
            scanType: 'manual',
            timestamp: new Date().toISOString(),
          },
        });
      } else if (searchQuery === 'pet chicken') {
        // Demo: Navigate to PetFoodFacts with mock dog food data
        console.log('Navigating to PetFoodFacts...');
        navigation.navigate('PetFoodFacts', {
          product: {
            success: true,
            found: true,
            search_type: 'text',
            search_value: 'chicken dog food',
            product_type: 'pet_food',
            product: {
              barcode: '0017800158718',
              name: 'Chicken & Rice Adult Dog Food',
              brand: 'Healthy Paws',
              category: 'Dry dog food, Adult dog food',
              quantity: '6.8kg',
              packaging: 'Bag',
              origin_countries: 'United States',
              certifications: 'AAFCO approved',
              image_url: null,
            },
            nutrition: {
              grade: 'A',
              per_100g: {
                energy_kcal: 365,
                protein_g: 28,
                fat_g: 15,
                carbohydrates_g: 42,
              },
            },
            ingredients: {
              full_list: 'Deboned Chicken, Brown Rice, Chicken Meal, Oatmeal, Barley, Chicken Fat (preserved with Mixed Tocopherols), Dried Beet Pulp, Flaxseed, Natural Chicken Flavor, Fish Oil, Potassium Chloride, Salt, Choline Chloride, Dried Chicory Root, Vitamin E Supplement, Zinc Proteinate',
              protein_sources: ['Deboned Chicken', 'Chicken Meal'],
              concerns: [],
              has_grain: true,
              has_byproducts: false,
              has_artificial: false,
            },
            pet_info: {
              suggested_pet_type: 'dog',
            },
            metadata: {
              product_type: 'pet_food',
              data_source: 'openpetfoodfacts',
              database_size: '14,828 products',
            },
            timestamp: new Date().toISOString(),
          },
          context: {
            sessionId: `pet_chicken_${Date.now()}`,
            query: 'pet chicken',
            type: 'search',
            scanType: 'manual',
            timestamp: new Date().toISOString(),
          },
        });
      } else if (searchQuery === 'photo salad') {
        // Demo: Navigate to FoodPhotoFacts with mock salad data
        console.log('Navigating to FoodPhotoFacts...');
        navigation.navigate('FoodPhotoFacts', {
          photoData: {
            success: true,
            scan_id: `photo_demo_${Date.now()}`,
            scan_type: 'food_photo',
            image_url: null,
            timestamp: new Date().toISOString(),
            processing_time: 1.2,
            analysis: {
              detected_foods: ['Mixed Green Salad', 'Cherry Tomatoes', 'Cucumber', 'Feta Cheese', 'Olive Oil Dressing'],
              confidence_score: 0.94,
              meal_type: 'Lunch',
              summary: 'A healthy Mediterranean-style mixed green salad with fresh vegetables and feta cheese. Good source of fiber and vitamins.',
            },
            metadata: {
              product_name: 'Mixed Green Salad',
              health_score: 92,
              nutrition_score: 88,
              nutrition_grade: { grade: 'A', score: 92 },
              nova_group: 1,
              processing_level: 'unprocessed',
              vision_confidence: 0.94,
              detected_foods: ['Mixed Green Salad', 'Cherry Tomatoes', 'Cucumber', 'Feta Cheese'],
              nutrition_facts: {
                serving_size: '1 bowl (250g)',
                serving_size_g: 250,
                servings_per_container: 1,
                calories: 185,
                calories_serving: 185,
                protein: 8,
                carbohydrates: 12,
                fat: 14,
                saturated_fat: 4,
                fiber: 4,
                sugars: 6,
                sodium: 380,
                cholesterol: 20,
                trans_fat: 0,
                polyunsaturated_fat: 2,
                monounsaturated_fat: 8,
                potassium: 450,
                calcium: 150,
                iron: 2,
                vitamin_a: 3500,
                vitamin_c: 25,
                vitamin_d: 0,
              },
              nutrition_analysis: {
                health_alerts: [],
                positive_aspects: [
                  'High in dietary fiber',
                  'Rich in vitamins A and C',
                  'Good source of healthy fats from olive oil',
                  'Low in processed ingredients'
                ],
                areas_of_concern: [
                  'Moderate sodium from feta cheese'
                ],
              },
              categories: ['Salads', 'Lunch', 'Mediterranean'],
            },
            ask_wihy: 'Tell me about the health benefits of this salad and how it fits into a balanced diet',
          },
          capturedImage: null,
          context: {
            sessionId: `photo_salad_${Date.now()}`,
            query: 'photo salad',
            type: 'search',
            scanType: 'demo',
            timestamp: new Date().toISOString(),
          },
        });
      } else if (searchQuery === 'pill aspirin') {
        // Demo: Navigate to PillIdentification with mock aspirin data
        console.log('Navigating to PillIdentification...');
        navigation.navigate('PillIdentification', {
          pillData: {
            scanId: `pill_demo_${Date.now()}`,
            matches: [
              {
                rxcui: '1191',
                name: 'Aspirin',
                brandName: 'Bayer Aspirin',
                ndc11: '00280130005',
                imprint: 'BAYER',
                color: 'White',
                shape: 'Round',
                confidence: 0.95,
                image_url: null,
              },
              {
                rxcui: '1191',
                name: 'Aspirin',
                brandName: 'Generic Aspirin',
                ndc11: '00904197260',
                imprint: 'ASA',
                color: 'White',
                shape: 'Round',
                confidence: 0.82,
                image_url: null,
              }
            ],
            topMatch: {
              name: 'Aspirin',
              brandName: 'Bayer Aspirin',
              genericName: 'Acetylsalicylic Acid',
              imprint: 'BAYER',
              color: 'White',
              shape: 'Round',
              rxcui: '1191',
              confidence: 0.95,
              dosage: '325mg',
              manufacturer: 'Bayer Healthcare',
            },
          },
          capturedImage: null,
          context: {
            sessionId: `pill_aspirin_${Date.now()}`,
            query: 'pill aspirin',
            type: 'search',
            scanType: 'demo',
            timestamp: new Date().toISOString(),
          },
        });
      } else if (searchQuery === 'label organic') {
        // Demo: Navigate to LabelReader with mock organic label data
        console.log('Navigating to LabelReader...');
        navigation.navigate('LabelReader', {
          labelData: {
            productName: 'Organic Valley Whole Milk',
            summary: 'Certified organic milk with verified claims. Some marketing language may be exaggerated.',
            detectedText: 'USDA ORGANIC | Pasture-Raised | Non-GMO Project Verified | From Family Farms | Grade A | rBGH Free | Heart Healthy | Farm Fresh Goodness',
            detectedClaims: [
              {
                claim: 'USDA Organic',
                category: 'certification',
                verified: true,
                needs_verification: false,
                description: 'USDA certified organic product meeting federal organic standards',
              },
              {
                claim: 'Pasture-Raised',
                category: 'marketing',
                verified: false,
                needs_verification: true,
                description: 'Implies cows have access to pasture, but standards vary',
              },
              {
                claim: 'Non-GMO Project Verified',
                category: 'certification',
                verified: true,
                needs_verification: false,
                description: 'Third-party verified to meet Non-GMO Project standards',
              },
              {
                claim: 'Heart Healthy',
                category: 'health',
                verified: false,
                needs_verification: true,
                description: 'Health claim that may require FDA substantiation',
              },
              {
                claim: 'Farm Fresh Goodness',
                category: 'marketing',
                verified: false,
                needs_verification: false,
                description: 'Generic marketing term with no specific meaning',
              }
            ],
            greenwashingFlags: [
              {
                flag: 'Unverified Health Claim',
                severity: 'medium',
                detail: 'The "Heart Healthy" claim may not meet FDA requirements for health claims',
                claim_text: 'Heart Healthy',
              },
              {
                flag: 'Vague Marketing Language',
                severity: 'low',
                detail: '"Farm Fresh Goodness" is a marketing term with no regulated definition',
                claim_text: 'Farm Fresh Goodness',
              },
              {
                flag: 'Verified Organic Certification',
                severity: 'positive',
                detail: 'USDA Organic certification is legitimate and verified',
                claim_text: 'USDA ORGANIC',
              }
            ],
            greenwashingScore: 28,
            sustainabilityScore: 75,
            detectedCertifications: ['USDA Organic', 'Non-GMO Project'],
            healthClaims: ['Heart Healthy', 'rBGH Free'],
            ingredientsList: ['Organic Whole Milk', 'Vitamin D3'],
            recommendations: [
              'The organic and non-GMO certifications are legitimate',
              'Be cautious of "Heart Healthy" claims without FDA backing',
              'Marketing terms like "Farm Fresh" are not regulated'
            ],
          },
          capturedImage: null,
          context: {
            sessionId: `label_organic_${Date.now()}`,
            query: 'label organic',
            type: 'search',
            scanType: 'demo',
            timestamp: new Date().toISOString(),
          },
        });
      } else {
        // Navigate directly to FullChat for all other queries
        navigation.navigate('FullChat', {
          context: {
            query: query.trim(),
            type: 'search',
            timestamp: new Date(),
          },
          initialMessage: query.trim(),
        });
      }
    } else if (!navigation) {
      Alert.alert('Navigation Error', 'Navigation is not available yet. Please try again.');
    } else {
      Alert.alert('Enter Search Query', 'Please enter a health question to analyze.');
    }
  };

  // mimic the web max width feel (584px) while staying mobile-friendly
  // On tablets, allow wider content but cap at reasonable max
  const contentWidth = useMemo(() => {
    const maxPhone = 584;
    const maxTablet = 700;
    const padding = isTabletDevice ? 48 : 32;
    const max = isTabletDevice ? maxTablet : maxPhone;
    return Math.min(max, Math.max(320, width - padding));
  }, [width, isTabletDevice]);

  // Responsive search height - slightly larger on tablets
  const searchHeight = isTabletDevice ? 64 : 56;
  const pillRadius = searchHeight / 2;

  // WEB RENDER - Pure CSS with sweep animation
  if (isWeb) {
    // Navigate to other tabs - since we're inside TabNavigator, use direct navigation
    const navigateToTab = (tabName: 'Home' | 'Scan' | 'Chat' | 'Health' | 'Profile' | 'CoachSelection') => {
      console.log(`Navigating to tab: ${tabName}`);
      navigation.navigate(tabName as any);
    };

    // Navigate to stack screens (outside TabNavigator) - need to use parent navigation
    const navigateToStack = (screenName: string) => {
      console.log(`Navigating to stack: ${screenName}`);
      // Use parent navigation to go to root stack screens
      (navigation as any).getParent()?.navigate(screenName);
    };

    return (
      <div className="web-search-landing">
        {/* Top Navigation Bar */}
        {/* @ts-ignore */}
        <WebNavHeader 
          activePage="home" 
          showLoginModal={showLoginModal}
          setShowLoginModal={setShowLoginModal}
        />

        <div className="web-search-container">
          {/* Logo */}
          <div className="web-logo-container">
            <Image
              source={require('../../assets/Logo_wihy.png')}
              resizeMode="contain"
              // @ts-ignore - className and style for web
              className="web-logo-image"
              // @ts-ignore - web-only CSS properties
              style={{ width: '100%', maxWidth: 600, height: 'auto', aspectRatio: 2340 / 540, margin: '0 auto', display: 'block' }}
            />
          </div>

          {/* Search Input with CSS Border Sweep */}
          <div className="web-search-input-container">
            <input
              type="text"
              value={query}
              onChange={(e: any) => setQuery(e.target.value)}
              placeholder="Analyze my meals"
              className="web-search-input"
              onKeyDown={(e: any) => {
                if (e.key === 'Enter') handleAnalyze();
              }}
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
            />
            
            {/* Icons Container - 32px buttons, right 8px, gap 6px */}
            <div className="web-search-icons">
              {/* Clear Button - only show when query exists */}
              {query.length > 0 && (
                <button
                  onClick={() => setQuery('')}
                  className="web-icon-button clear-btn"
                  type="button"
                >
                  <svg viewBox="0 0 24 24" width="24" height="24" fill="#5f6368">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                  </svg>
                </button>
              )}
              
              {/* Camera Button - Opens Upload Modal on Web (Desktop only) */}
              {isDesktop && (
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="web-icon-button"
                  type="button"
                >
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="#5f6368">
                    <path d="M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/>
                  </svg>
                </button>
              )}
              
              {/* Voice Button */}
              <button
                onClick={() => alert('Voice input coming soon!')}
                className="web-icon-button"
                type="button"
              >
                <svg viewBox="0 0 24 24" width="20" height="20" fill="#5f6368">
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                  <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.28c3.39-.49 6-3.3 6-6.72h-2z"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Upload Image Modal */}
        {showUploadModal && (
          <div 
            className="web-upload-modal-overlay"
            onClick={(e: any) => {
              if (e.target === e.currentTarget) setShowUploadModal(false);
            }}
          >
            <div className="web-upload-modal">
              {/* Header */}
              <div className="web-upload-modal-header">
                <h2 className="web-upload-modal-title">Upload Image</h2>
                <p className="web-upload-modal-subtitle">Upload Image for Analysis</p>
                <button 
                  className="web-upload-modal-close"
                  onClick={() => setShowUploadModal(false)}
                >
                  ×
                </button>
              </div>

              {/* Content */}
              <div className="web-upload-modal-content">
                {/* Choose File Button */}
                <button 
                  className="web-upload-choose-file"
                  onClick={() => {
                    const input = document.getElementById('web-file-input');
                    if (input) input.click();
                  }}
                >
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="#ffffff">
                    <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
                  </svg>
                  Choose File
                </button>
                <input 
                  type="file" 
                  id="web-file-input"
                  className="web-upload-file-input"
                  accept="image/*"
                  onChange={(e: any) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      console.log('File selected:', file.name);
                      setShowUploadModal(false);
                      
                      // Convert file to base64 and pass to FoodPhotoFacts
                      const reader = new FileReader();
                      reader.onloadend = async () => {
                        const base64String = reader.result as string;
                        
                        // Navigate to FoodPhotoFacts with photo data
                        navigation.navigate('FoodPhotoFacts', { 
                          photoData: base64String,
                          context: 'upload'
                        });
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />

                {/* Drag & Drop Zone */}
                <div 
                  className="web-upload-drop-zone"
                  onDragOver={(e: any) => {
                    e.preventDefault();
                    e.currentTarget.classList.add('dragging');
                  }}
                  onDragLeave={(e: any) => {
                    e.currentTarget.classList.remove('dragging');
                  }}
                  onDrop={(e: any) => {
                    e.preventDefault();
                    e.currentTarget.classList.remove('dragging');
                    const file = e.dataTransfer.files?.[0];
                    if (file && file.type.startsWith('image/')) {
                      console.log('File dropped:', file.name);
                      setShowUploadModal(false);
                      
                      // Convert dropped file to base64 and pass to FoodPhotoFacts
                      const reader = new FileReader();
                      reader.onloadend = async () => {
                        const base64String = reader.result as string;
                        
                        // Navigate to FoodPhotoFacts with photo data
                        navigation.navigate('FoodPhotoFacts', { 
                          photoData: base64String,
                          context: 'upload'
                        });
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  onClick={() => {
                    const input = document.getElementById('web-file-input');
                    if (input) input.click();
                  }}
                >
                  <svg viewBox="0 0 24 24" width="48" height="48" fill="#9aa0a6" style={{ marginBottom: 16 }}>
                    <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z"/>
                  </svg>
                  <p className="web-upload-drop-text">Drag an image here or click to upload.</p>
                </div>

                {/* OR Divider */}
                <div className="web-upload-divider">OR</div>

                {/* Text Input */}
                <input
                  type="text"
                  className="web-upload-text-input"
                  placeholder="Enter barcode, product name, or paste image URL"
                  value={uploadTextInput}
                  onChange={(e: any) => setUploadTextInput(e.target.value)}
                />

                {/* Analyze Button */}
                <button 
                  className="web-upload-analyze-btn"
                  onClick={() => {
                    if (uploadTextInput.trim()) {
                      setShowUploadModal(false);
                      setQuery(uploadTextInput.trim());
                      setUploadTextInput('');
                      // Trigger search
                      navigation.navigate('FullChat', {
                        context: {
                          query: uploadTextInput.trim(),
                          type: 'search',
                          timestamp: new Date(),
                        },
                        initialMessage: uploadTextInput.trim(),
                      });
                    }
                  }}
                >
                  Analyze with WiHY
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Login modal overlay for web */}
        <MultiAuthLogin
          visible={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          onSignIn={() => setShowLoginModal(false)}
        />
      </div>
    );
  }

  // NATIVE RENDER - React Native with SweepBorder component
  return (
    <>
      <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
        <KeyboardAvoidingView
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 80}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.container}>
              {/* top bar */}
              <View style={styles.topBar}>
                {/* Empty top bar */}
              </View>
              {/* center content */}
              <View style={styles.centerArea}>
                {/* logo - responsive sizing for tablets */}
                <Image
                  source={require('../../assets/Logo_wihy.png')}
                  resizeMode="contain"
                  style={[styles.logo, { 
                    width: contentWidth, 
                    height: isTabletDevice ? 180 : 140,
                    marginBottom: isTabletDevice ? 36 : 26,
                  }] as any}
                />

                {/* search bar with animated border - WIHY brand colors */}
                <View style={{ marginBottom: isTabletDevice ? 32 : 22, width: contentWidth }}>
                  <SweepBorder
                    borderWidth={2}
                    radius={pillRadius}
                    durationMs={2500}
                    colors={colors.borderSweep}
                  >
                    <View style={[styles.searchInner, { height: searchHeight - 4 }]}>
                      <TextInput
                        value={query}
                        onChangeText={setQuery}
                        placeholder="Analyze my meals"
                        placeholderTextColor="#9ca3af"
                        style={[styles.input, { fontSize: isTabletDevice ? 18 : 16 }]}
                        returnKeyType="search"
                        onSubmitEditing={handleAnalyze}
                        autoComplete="off"
                        autoCorrect={false}
                        spellCheck={false}
                        autoCapitalize="none"
                        keyboardType="default"
                        textContentType="none"
                      />
                    </View>
                  </SweepBorder>
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </SafeAreaView>
      
      {/* Login modal overlay for web */}
      {isWeb && (
        <MultiAuthLogin
          visible={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          onSignIn={() => setShowLoginModal(false)}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  container: {
    flex: 1,
  },

  topBar: {
    height: 60,
    paddingHorizontal: 20,
    paddingTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },



  centerArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 40,
  },

  logo: {
    marginBottom: 26,
  },

  gradientBorder: {
    flex: 1,
  },

  searchInner: {
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 18,
    paddingRight: 18,
    borderRadius: 28,
    // Shadow for the search container
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(64,60,67,0.35)',
        shadowOpacity: 0.35,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 3 },
      },
      android: {
        elevation: 5,
      },
    }),
  },

  input: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    paddingVertical: 0,
    textAlign: 'center',
  },

  iconCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 10,
    paddingRight: 4,
  },

  iconButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },

  iconPressed: {
    backgroundColor: '#f3f4f6',
  },

  // Web-specific styles (used alongside CSS classes)
  webInput: {
    fontSize: 18,
    color: '#111827',
    textAlign: 'left',
    ...Platform.select({
      web: { outlineStyle: 'none' as any },
    }),
  },
});
