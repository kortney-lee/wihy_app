# Research System Architecture - React Native Integration Guide

## Overview
The WIHY Research System is a comprehensive scientific research search and analysis platform built with React (web) that can be adapted for React Native. This document explains the architecture, API integration, and state management patterns.

## [MOBILE] System Components

### 1. ResearchDashboard (Main Container)
**Purpose:** Primary research interface that manages navigation between dashboard view and active research sessions

**Key Features:**
- Search input handling via Header component
- Navigation history (back/forward buttons)
- Recent searches caching
- Dashboard vs Research Panel view switching
- Filter management

**State Management:**
```typescript
const [activeWorkspace, setActiveWorkspace] = useState<string | null>(null);
const [searchFromHeader, setSearchFromHeader] = useState<string | null>(null);
const [recentSearches, setRecentSearches] = useState([]); // Cached in localStorage
const [navigationHistory, setNavigationHistory] = useState<string[]>([]);
```

### 2. ResearchPanel (Search Results)
**Purpose:** Handles research API calls, displays results grid, manages loading states

**Key Features:**
- Scientific research search via API
- Results caching (30-minute TTL)
- Grid layout for study cards
- Modal expansion for detailed study view
- Loading spinner with branded animation

**State Management:**
```typescript
const [loading, setLoading] = useState(false);
const [searchResults, setSearchResults] = useState<ResearchSearchResult[]>([]);
const [selectedStudy, setSelectedStudy] = useState<ResearchSearchResult | null>(null);
const [showModal, setShowModal] = useState(false);
```

## [PLUG] API Integration

### Research Search Endpoint
```typescript
const RESEARCH_API_BASE = 'https://services.wihy.ai';

// Search API Call
const runSearch = async (keyword: string) => {
  const qs = buildQS({ keyword, limit: 20 });
  const res = await fetch(`${RESEARCH_API_BASE}/api/research/search?${qs}`);
  const data: ResearchSearchResponse = await res.json();
};
```

### Research Result Data Structure
```typescript
type ResearchSearchResult = {
  id: string;
  pmcid: string;              // PubMed Central ID
  title: string;
  authors?: string;
  authorCount?: number;
  journal?: string;
  publishedDate?: string;
  publicationYear?: number;
  abstract?: string;
  studyType?: string;         // 'randomized_controlled_trial', 'meta_analysis', etc.
  researchArea?: string;
  evidenceLevel?: string;     // 'high', 'moderate', 'low', 'very_low'
  relevanceScore?: number;    // 0-1 relevance to search query
  rank?: number;
  fullTextAvailable?: boolean;
  links?: {
    pmcWebsite?: string;
    pubmedLink?: string;
    pdfDownload?: string | null;
    doi?: string;
  };
};
```

### API Response Format
```typescript
type ResearchSearchResponse = {
  success: boolean;
  keyword: string;
  articles: ResearchSearchResult[];
};
```

## [DISK] Caching Strategy

### 1. Search Results Cache
```typescript
// 30-minute cache per search query
const cacheKey = `research_cache_${keyword.toLowerCase().replace(/\s+/g, '_')}`;
const cacheData = { 
  query: keyword, 
  timestamp: Date.now(), 
  results: articles 
};
localStorage.setItem(cacheKey, JSON.stringify(cacheData));
```

### 2. Recent Searches
```typescript
// Persistent recent searches (max 5)
const updatedRecentSearches = [
  trimmedQuery,
  ...recentSearches.filter(search => search !== trimmedQuery)
].slice(0, 5);
localStorage.setItem('wihy_recent_searches', JSON.stringify(updatedRecentSearches));
```

## [ART] UI/UX Patterns

### 1. Search Flow
1. User enters search query in header
2. Query cached and added to recent searches
3. Navigation history updated
4. ResearchPanel triggered with loading state
5. API call made (or cached results used)
6. Results displayed in responsive grid

### 2. Loading States
```typescript
// Custom loading spinner with branded animation
{(loading || isHeaderLoading) && (
  <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-[2000]">
    <img src="/assets/whatishealthyspinner.gif" alt="Loading..." />
    <h2>Searching Research...</h2>
    <p>Finding the latest scientific evidence for your query</p>
  </div>
)}
```

### 3. Study Card Layout
- **Header:** Study type badge (RCT, Meta-analysis, etc.)
- **Body:** Title (3-line clamp), Abstract (3-line clamp)
- **Meta:** Authors, Journal, Publication year
- **Footer:** Relevance score, "Read Study" action

### 4. Responsive Grid
```typescript
// Adaptive grid based on screen size
<div className="grid gap-3 sm:gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
```

## [ART] Layout Patterns & Design System

### 1. Color Palette
```typescript
// Primary Colors
const colors = {
  // Main brand colors
  primary: {
    50: '#f0f7ff',   // Background light blue
    100: '#e0f0ff',  
    500: '#3b82f6',  // Primary blue
    600: '#2563eb',  // Hover blue
    700: '#1d4ed8',  // Active blue
    900: '#1e3a8a'   // Dark blue text
  },
  
  // Secondary colors for study types
  purple: {
    50: '#faf5ff',
    100: '#f3e8ff',
    500: '#8b5cf6',
    600: '#7c3aed',
    800: '#5b21b6'
  },
  
  // Status colors
  green: {
    50: '#f0fdf4',
    500: '#22c55e',
    600: '#16a34a'
  },
  
  red: {
    50: '#fef2f2',
    500: '#ef4444',
    600: '#dc2626'
  },
  
  // Neutral colors
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827'
  }
};
```

### 2. Typography Scale
```typescript
const typography = {
  // Font families
  fontFamily: {
    sans: ['Inter', 'system-ui', 'sans-serif'],
    mono: ['JetBrains Mono', 'monospace']
  },
  
  // Font sizes and line heights
  text: {
    xs: { fontSize: 12, lineHeight: 16 },
    sm: { fontSize: 14, lineHeight: 20 },
    base: { fontSize: 16, lineHeight: 24 },
    lg: { fontSize: 18, lineHeight: 28 },
    xl: { fontSize: 20, lineHeight: 28 },
    '2xl': { fontSize: 24, lineHeight: 32 },
    '3xl': { fontSize: 30, lineHeight: 36 }
  },
  
  // Font weights
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700
  }
};
```

### 3. Spacing System
```typescript
const spacing = {
  0: 0,
  1: 4,   // 4px
  2: 8,   // 8px
  3: 12,  // 12px
  4: 16,  // 16px
  5: 20,  // 20px
  6: 24,  // 24px
  8: 32,  // 32px
  10: 40, // 40px
  12: 48, // 48px
  16: 64, // 64px
  20: 80, // 80px
  24: 96  // 96px
};
```

### 4. Layout Grid System
```typescript
// Container widths
const containers = {
  sm: 640,   // Small screens
  md: 768,   // Medium screens  
  lg: 1024,  // Large screens
  xl: 1280,  // Extra large screens
  '2xl': 1536 // 2X large screens
};

// Grid breakpoints
const breakpoints = {
  mobile: '< 640px',
  tablet: '640px - 1024px', 
  desktop: '> 1024px'
};

// Grid columns
const gridCols = {
  mobile: 1,
  tablet: 2, 
  desktop: 3,
  wide: 4
};
```

### 5. Component Layout Patterns

#### A. Dashboard Layout
```typescript
// Full-height container with fixed header
const DashboardLayout = {
  container: {
    height: '100vh',
    backgroundColor: colors.primary[50],
    display: 'flex',
    flexDirection: 'column'
  },
  header: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    height: 176, // Mobile: 176px, SM: 192px, LG: 208px
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200]
  },
  content: {
    flex: 1,
    paddingTop: 176, // Match header height
    overflowY: 'auto'
  }
};
```

#### B. Study Card Layout
```typescript
const StudyCardLayout = {
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray[200],
    padding: spacing[4],
    marginBottom: spacing[4],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3 // Android shadow
  },
  
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    backgroundColor: colors.purple[100],
    borderRadius: 16,
    marginBottom: spacing[4]
  },
  
  title: {
    fontSize: typography.text.base.fontSize,
    lineHeight: typography.text.base.lineHeight,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray[900],
    marginBottom: spacing[3]
  },
  
  abstract: {
    fontSize: typography.text.sm.fontSize,
    lineHeight: typography.text.sm.lineHeight,
    color: colors.gray[600],
    marginBottom: spacing[4]
  },
  
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing[4],
    borderTopWidth: 1,
    borderTopColor: colors.gray[100]
  }
};
```

#### C. Grid Layout Patterns
```typescript
// FlatList grid configuration
const GridLayout = {
  container: {
    padding: spacing[6],
    backgroundColor: colors.primary[50]
  },
  
  // Dynamic columns based on screen width
  getNumColumns: (windowWidth) => {
    if (windowWidth < 640) return 1;        // Mobile: 1 column
    if (windowWidth < 1024) return 2;       // Tablet: 2 columns
    if (windowWidth < 1280) return 3;       // Desktop: 3 columns
    return 4;                               // Wide: 4 columns
  },
  
  // Item spacing
  itemSeparator: {
    width: spacing[4],
    height: spacing[4]
  },
  
  // Column wrapper style for FlatList
  row: {
    justifyContent: 'space-around',
    paddingHorizontal: spacing[2]
  }
};
```

### 6. Interactive States
```typescript
const InteractionStates = {
  // Touch states for buttons/cards
  default: {
    opacity: 1,
    transform: [{ scale: 1 }]
  },
  
  pressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }]
  },
  
  // Focus states for accessibility
  focused: {
    borderWidth: 2,
    borderColor: colors.primary[500],
    shadowColor: colors.primary[500],
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 4
  },
  
  // Loading states
  loading: {
    opacity: 0.6,
    pointerEvents: 'none'
  }
};
```

### 7. Animation Patterns
```typescript
// React Native Animated patterns
const AnimationPatterns = {
  // Fade in animation for cards
  fadeIn: {
    duration: 300,
    easing: 'ease-out'
  },
  
  // Scale animation for touch feedback
  scalePress: {
    duration: 150,
    easing: 'ease-in-out'
  },
  
  // Slide animation for modals
  slideUp: {
    duration: 400,
    easing: 'ease-out'
  },
  
  // Loading spinner rotation
  rotate: {
    duration: 1000,
    repeat: -1,
    easing: 'linear'
  }
};
```

### 8. Visual Hierarchy
```typescript
const VisualHierarchy = {
  // Z-index layers
  zIndex: {
    base: 1,
    dropdown: 1000,
    sticky: 1010,
    modal: 1020,
    overlay: 1030,
    loading: 2000
  },
  
  // Content hierarchy
  hierarchy: {
    h1: { // Page title
      fontSize: typography.text['2xl'].fontSize,
      fontWeight: typography.fontWeight.bold,
      color: colors.gray[900],
      marginBottom: spacing[6]
    },
    h2: { // Section title
      fontSize: typography.text.xl.fontSize,
      fontWeight: typography.fontWeight.semibold,
      color: colors.gray[800],
      marginBottom: spacing[4]
    },
    h3: { // Card title
      fontSize: typography.text.lg.fontSize,
      fontWeight: typography.fontWeight.semibold,
      color: colors.gray[900],
      marginBottom: spacing[3]
    },
    body: { // Regular text
      fontSize: typography.text.base.fontSize,
      color: colors.gray[700],
      lineHeight: typography.text.base.lineHeight
    },
    caption: { // Small text
      fontSize: typography.text.sm.fontSize,
      color: colors.gray[500],
      lineHeight: typography.text.sm.lineHeight
    }
  }
};
```

### 9. Component Size Standards
```typescript
const ComponentSizes = {
  // Touch targets (minimum 44px for accessibility)
  touchTarget: {
    minHeight: 44,
    minWidth: 44
  },
  
  // Button sizes
  button: {
    small: { height: 36, paddingHorizontal: spacing[4] },
    medium: { height: 44, paddingHorizontal: spacing[6] },
    large: { height: 52, paddingHorizontal: spacing[8] }
  },
  
  // Input sizes
  input: {
    height: 44,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3]
  },
  
  // Card sizes
  card: {
    minHeight: 200,
    maxHeight: 400,
    borderRadius: 12,
    padding: spacing[4]
  },
  
  // Icon sizes
  icon: {
    xs: 12,
    sm: 16,
    md: 20,
    lg: 24,
    xl: 32
  }
};
```

## [MOBILE] React Native Adaptation Strategy

### 1. Component Mapping
| Web Component | React Native Equivalent | Notes |
|--------------|------------------------|--------|
| `ResearchDashboard` | `ResearchScreen` | Use Stack Navigator for workspace switching |
| `ResearchPanel` | `ResearchResultsScreen` | FlatList for results grid |
| Study Cards | `StudyCard` component | TouchableOpacity with custom styling |
| Modal overlay | Modal or Sheet component | Consider react-native-modal |

### 2. Navigation Structure
```typescript
// React Navigation Stack
const ResearchStack = createStackNavigator();

function ResearchStackScreen() {
  return (
    <ResearchStack.Navigator>
      <ResearchStack.Screen name="Dashboard" component={ResearchDashboard} />
      <ResearchStack.Screen name="Results" component={ResearchResults} />
      <ResearchStack.Screen name="StudyDetail" component={StudyDetail} />
    </ResearchStack.Navigator>
  );
}
```

### 3. State Management Options

#### Option A: Context + useReducer
```typescript
// ResearchContext.tsx
const ResearchContext = createContext();

const researchReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_RESULTS':
      return { ...state, results: action.payload, loading: false };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    // ... other actions
  }
};
```

#### Option B: Redux Toolkit
```typescript
// researchSlice.ts
const researchSlice = createSlice({
  name: 'research',
  initialState: {
    results: [],
    loading: false,
    error: null,
    recentSearches: []
  },
  reducers: {
    searchStart: (state) => { state.loading = true; },
    searchSuccess: (state, action) => {
      state.results = action.payload;
      state.loading = false;
    }
  }
});
```

### 4. Storage Adaptation
```typescript
// Replace localStorage with AsyncStorage
import AsyncStorage from '@react-native-async-storage/async-storage';

const cacheSearchResults = async (keyword: string, results: ResearchSearchResult[]) => {
  const cacheKey = `research_cache_${keyword.toLowerCase().replace(/\s+/g, '_')}`;
  const cacheData = { 
    query: keyword, 
    timestamp: Date.now(), 
    results 
  };
  await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheData));
};

const getCachedResults = async (keyword: string) => {
  const cacheKey = `research_cache_${keyword.toLowerCase().replace(/\s+/g, '_')}`;
  const cachedData = await AsyncStorage.getItem(cacheKey);
  if (cachedData) {
    const parsed = JSON.parse(cachedData);
    const isExpired = Date.now() - parsed.timestamp > 30 * 60 * 1000;
    return isExpired ? null : parsed.results;
  }
  return null;
};
```

### 5. UI Components (React Native)

#### Study Card Component
```typescript
// StudyCard.tsx
import { TouchableOpacity, Text, View } from 'react-native';

const StudyCard = ({ study, onPress }) => (
  <TouchableOpacity 
    style={styles.card}
    onPress={() => onPress(study)}
    activeOpacity={0.7}
  >
    <View style={styles.badge}>
      <Text style={styles.badgeText}>{study.studyType?.replace(/_/g, ' ')}</Text>
    </View>
    
    <Text style={styles.title} numberOfLines={3}>
      {study.title}
    </Text>
    
    {study.abstract && (
      <Text style={styles.abstract} numberOfLines={3}>
        {study.abstract}
      </Text>
    )}
    
    <View style={styles.meta}>
      <Text style={styles.journal}>{study.journal}</Text>
      <Text style={styles.year}>{study.publicationYear}</Text>
    </View>
    
    <View style={styles.footer}>
      <Text style={styles.relevance}>
        Relevance: {Math.round(study.relevanceScore * 100)}%
      </Text>
      <Text style={styles.readMore}>Read Study →</Text>
    </View>
  </TouchableOpacity>
);

// Complete StyleSheet
const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray[200],
    padding: spacing[4],
    margin: spacing[2],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    minHeight: 200
  },
  
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    backgroundColor: colors.purple[100],
    borderRadius: 16,
    marginBottom: spacing[4]
  },
  
  badgeText: {
    fontSize: typography.text.xs.fontSize,
    fontWeight: typography.fontWeight.semibold,
    color: colors.purple[800],
    textTransform: 'uppercase'
  },
  
  title: {
    fontSize: typography.text.base.fontSize,
    lineHeight: typography.text.base.lineHeight,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray[900],
    marginBottom: spacing[3]
  },
  
  abstract: {
    fontSize: typography.text.sm.fontSize,
    lineHeight: typography.text.sm.lineHeight,
    color: colors.gray[600],
    marginBottom: spacing[4],
    flex: 1
  },
  
  meta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing[2]
  },
  
  journal: {
    fontSize: typography.text.xs.fontSize,
    color: colors.gray[500],
    flex: 1
  },
  
  year: {
    fontSize: typography.text.xs.fontSize,
    color: colors.gray[500],
    fontWeight: typography.fontWeight.medium
  },
  
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing[4],
    borderTopWidth: 1,
    borderTopColor: colors.gray[100]
  },
  
  relevance: {
    fontSize: typography.text.xs.fontSize,
    color: colors.gray[500]
  },
  
  readMore: {
    fontSize: typography.text.xs.fontSize,
    color: colors.primary[600],
    fontWeight: typography.fontWeight.medium
  }
});
```

#### Research Grid (FlatList)
```typescript
// ResearchGrid.tsx
import { FlatList, Dimensions } from 'react-native';

const ResearchGrid = ({ results, onStudyPress }) => {
  const windowWidth = Dimensions.get('window').width;
  const numColumns = GridLayout.getNumColumns(windowWidth);
  
  const renderStudy = ({ item, index }) => (
    <StudyCard 
      study={item} 
      onPress={onStudyPress}
      style={{
        width: (windowWidth - spacing[6] * 2 - spacing[4] * (numColumns - 1)) / numColumns
      }}
    />
  );

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <Icon name="search" size={ComponentSizes.icon.xl} color={colors.gray[400]} />
      <Text style={styles.emptyTitle}>No results found</Text>
      <Text style={styles.emptySubtitle}>Try different keywords or check your spelling</Text>
    </View>
  );

  return (
    <FlatList
      data={results}
      renderItem={renderStudy}
      keyExtractor={(item) => item.id}
      numColumns={numColumns}
      key={numColumns} // Force re-render when columns change
      columnWrapperStyle={numColumns > 1 ? styles.row : null}
      contentContainerStyle={[styles.container, results.length === 0 && styles.emptyContainer]}
      showsVerticalScrollIndicator={false}
      ListEmptyComponent={renderEmpty}
      ItemSeparatorComponent={() => <View style={GridLayout.itemSeparator} />}
      onEndReachedThreshold={0.1}
      initialNumToRender={10}
      maxToRenderPerBatch={10}
      windowSize={5}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing[6],
    backgroundColor: colors.primary[50]
  },
  
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  
  row: {
    justifyContent: 'space-around',
    paddingHorizontal: spacing[2]
  },
  
  emptyState: {
    alignItems: 'center',
    padding: spacing[8]
  },
  
  emptyTitle: {
    fontSize: typography.text.lg.fontSize,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray[900],
    marginTop: spacing[4],
    marginBottom: spacing[2]
  },
  
  emptySubtitle: {
    fontSize: typography.text.base.fontSize,
    color: colors.gray[600],
    textAlign: 'center'
  }
});
```

#### Loading Overlay Component
```typescript
// LoadingOverlay.tsx
import { Modal, View, Text, ActivityIndicator, Animated } from 'react-native';
import { useEffect, useRef } from 'react';

const LoadingOverlay = ({ visible, title = "Searching Research...", subtitle = "Finding the latest scientific evidence" }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: AnimationPatterns.fadeIn.duration,
          useNativeDriver: true
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true
        })
      ]).start();
    }
  }, [visible]);
  
  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
    >
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <Animated.View style={[styles.content, { transform: [{ scale: scaleAnim }] }]}>
          <ActivityIndicator 
            size="large" 
            color={colors.primary[500]} 
            style={styles.spinner}
          />
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  
  content: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: spacing[8],
    alignItems: 'center',
    margin: spacing[6],
    minWidth: 280
  },
  
  spinner: {
    marginBottom: spacing[4]
  },
  
  title: {
    fontSize: typography.text.xl.fontSize,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray[900],
    textAlign: 'center',
    marginBottom: spacing[2]
  },
  
  subtitle: {
    fontSize: typography.text.sm.fontSize,
    color: colors.gray[600],
    textAlign: 'center'
  }
});
```

#### Search Header Component
```typescript
// SearchHeader.tsx
import { View, TextInput, TouchableOpacity, SafeAreaView } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

const SearchHeader = ({ searchQuery, onSearchSubmit, onBack, canGoBack }) => {
  const [localQuery, setLocalQuery] = useState(searchQuery);
  
  const handleSubmit = () => {
    if (localQuery.trim()) {
      onSearchSubmit(localQuery.trim());
    }
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        {canGoBack && (
          <TouchableOpacity 
            style={styles.backButton}
            onPress={onBack}
            hitSlop={ComponentSizes.touchTarget}
          >
            <Icon name="arrow-left" size={ComponentSizes.icon.md} color={colors.gray[600]} />
          </TouchableOpacity>
        )}
        
        <View style={[styles.searchContainer, canGoBack && styles.searchWithBack]}>
          <Icon name="search" size={ComponentSizes.icon.sm} color={colors.gray[400]} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            value={localQuery}
            onChangeText={setLocalQuery}
            onSubmitEditing={handleSubmit}
            placeholder="Search research papers..."
            placeholderTextColor={colors.gray[400]}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {localQuery.length > 0 && (
            <TouchableOpacity 
              onPress={() => setLocalQuery('')}
              hitSlop={ComponentSizes.touchTarget}
            >
              <Icon name="x" size={ComponentSizes.icon.sm} color={colors.gray[400]} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200]
  },
  
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    minHeight: ComponentSizes.touchTarget.minHeight
  },
  
  backButton: {
    marginRight: spacing[3],
    padding: spacing[2]
  },
  
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[50],
    borderRadius: 12,
    paddingHorizontal: spacing[4],
    height: ComponentSizes.input.height
  },
  
  searchWithBack: {
    marginLeft: 0
  },
  
  searchIcon: {
    marginRight: spacing[3]
  },
  
  searchInput: {
    flex: 1,
    fontSize: typography.text.base.fontSize,
    color: colors.gray[900],
    paddingVertical: 0 // Remove default padding
  }
});
```

### 6. API Service Layer
```typescript
// ResearchAPI.ts
class ResearchAPI {
  private baseURL = 'https://services.wihy.ai';

  async searchResearch(keyword: string, limit = 20): Promise<ResearchSearchResult[]> {
    try {
      const params = new URLSearchParams({ keyword, limit: limit.toString() });
      const response = await fetch(`${this.baseURL}/api/research/search?${params}`);
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      
      const data: ResearchSearchResponse = await response.json();
      return data.articles || [];
    } catch (error) {
      console.error('Research API Error:', error);
      throw error;
    }
  }

  async getStudyContent(pmcId: string): Promise<any> {
    const response = await fetch(`${this.baseURL}/api/research/pmc/${pmcId}/content`);
    return response.json();
  }
}

export const researchAPI = new ResearchAPI();
```

### 7. Error Handling Patterns
```typescript
// Error boundaries and user-friendly messages
const useResearchSearch = () => {
  const [state, dispatch] = useReducer(researchReducer, initialState);

  const search = async (keyword: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      // Check cache first
      const cached = await getCachedResults(keyword);
      if (cached) {
        dispatch({ type: 'SET_RESULTS', payload: cached });
        return;
      }

      // Make API call
      const results = await researchAPI.searchResearch(keyword);
      
      if (results.length === 0) {
        dispatch({ type: 'SET_ERROR', payload: 'No results found for this search' });
      } else {
        dispatch({ type: 'SET_RESULTS', payload: results });
        await cacheSearchResults(keyword, results);
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to search research. Please try again.' });
    }
  };

  return { ...state, search };
};
```

## [TOOL] Implementation Checklist

### Phase 1: Core Components
- [ ] Set up React Navigation structure
- [ ] Create ResearchScreen with search input
- [ ] Implement ResearchAPI service
- [ ] Build StudyCard component
- [ ] Add FlatList grid layout

### Phase 2: State Management
- [ ] Set up Context/Redux for research state
- [ ] Implement AsyncStorage caching
- [ ] Add recent searches persistence
- [ ] Create navigation history tracking

### Phase 3: Advanced Features
- [ ] Add study detail modal/screen
- [ ] Implement offline caching
- [ ] Add search filters
- [ ] Create loading animations
- [ ] Add error boundaries

### Phase 4: Performance & UX
- [ ] Optimize FlatList performance
- [ ] Add pull-to-refresh
- [ ] Implement search debouncing
- [ ] Add pagination for large result sets
- [ ] Create accessibility features

## [ROCKET] Getting Started

1. **Install Dependencies:**
```bash
npm install @react-navigation/native @react-navigation/stack
npm install @react-native-async-storage/async-storage
npm install react-native-modal (optional)
```

2. **Copy API Types:**
Copy the TypeScript interfaces from ResearchPanel.tsx to your React Native project

3. **Adapt Components:**
Start with the ResearchAPI service and basic StudyCard component, then build up the navigation structure

4. **Test Integration:**
Use the same API endpoint (`https://services.wihy.ai/api/research/search`) to ensure compatibility

## [PAGE] Key Differences: Web vs React Native

| Feature | Web Implementation | React Native Adaptation |
|---------|-------------------|------------------------|
| Storage | localStorage | AsyncStorage |
| Navigation | URL-based routing | Stack/Tab Navigator |
| Grid Layout | CSS Grid | FlatList with numColumns |
| Modals | HTML dialog/overlay | Modal component |
| Touch | onClick | TouchableOpacity/Pressable |
| Styling | Tailwind CSS | StyleSheet |
| Loading | Branded GIF spinner | ActivityIndicator or Lottie |
| Caching | Browser cache + localStorage | AsyncStorage + Network cache |

This architecture provides a solid foundation for building the research functionality in React Native while maintaining the same user experience and API integration patterns used in the web version.