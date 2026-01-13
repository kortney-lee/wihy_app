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
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import MultiAuthLogin from '../components/auth/MultiAuthLogin';

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
  
  // Check if user is on free plan
  const isFreeUser = !user || user.plan === 'free';
  
  // Handle health button click - show subscription for free users
  const handleHealthPress = () => {
    if (isFreeUser) {
      navigation.navigate('Subscription');
    } else {
      navigation.navigate('Health');
    }
  };
  
  // Tablet detection
  const isTabletDevice = width >= TABLET_BREAKPOINT;

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
    return (
      <div className="web-search-landing">
        {/* Top Navigation Bar */}
        <nav className="web-top-nav">
          <div className="web-nav-left">
            <button onClick={() => navigation.navigate('Home')} className="web-nav-item nav-home active" type="button">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
              </svg>
              <span>Home</span>
            </button>
            <button onClick={handleHealthPress} className="web-nav-item nav-health" type="button">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
              <span>Health</span>
            </button>
            <button onClick={() => navigation.navigate('Scan')} className="web-nav-item nav-scan mobile-only" type="button">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/>
              </svg>
              <span>Scan</span>
            </button>
            <button onClick={() => navigation.navigate('Chat')} className="web-nav-item nav-chat" type="button">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
              </svg>
              <span>Chat</span>
            </button>
          </div>
          <div className="web-nav-right">
            <button onClick={() => {
              if (user) {
                navigation.navigate('Profile');
              } else {
                setShowLoginModal(true);
              }
            }} className="web-nav-item profile" type="button">
              <svg viewBox="0 0 24 24" width="24" height="24">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
            </button>
          </div>
        </nav>

        <div className="web-search-container">
          {/* Logo */}
          <div className="web-logo-container">
            <Image
              source={require('../../assets/Logo_wihy.png')}
              resizeMode="contain"
              // @ts-ignore - className for web
              className="web-logo-image"
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
              
              {/* Camera Button - Opens Upload Modal on Web */}
              <button
                onClick={() => setShowUploadModal(true)}
                className="web-icon-button"
                type="button"
              >
                <svg viewBox="0 0 24 24" width="20" height="20" fill="#5f6368">
                  <path d="M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/>
                </svg>
              </button>
              
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
                      // TODO: Handle file upload
                      Alert.alert('File Selected', `Selected: ${file.name}`);
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
                      Alert.alert('File Dropped', `Selected: ${file.name}`);
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
