# SearchResults React Native Style Guide

This document contains all button colors and styles from the SearchResults component, converted from Tailwind CSS to React Native StyleSheet format.

## Mobile-First Design Pattern & Navigation Flow

### App Architecture Overview

The health app follows a **mobile-first, conversation-driven** design pattern that prioritizes quick health insights over complex interfaces. The flow is designed for thumb-friendly navigation and immediate AI assistance.

#### Primary Navigation Flow

```
VHealthSearch (Landing) → SearchResults → FullChat → Dashboard
     ↓                        ↓             ↓          ↑
  [Search Input]         [AI Analysis]  [Conversation] [Overview]
  [Voice/Camera]         [Quick Chat]   [Deep Dive]   [Charts]
```

### Mobile Design Patterns (Not Desktop-to-Mobile)

**❌ Wrong Approach**: Making mobile look like desktop
- Complex multi-column layouts on mobile
- Small buttons and dense information
- Desktop-style menus and navigation

**✅ Correct Approach**: Mobile-native design patterns
- **Thumb-First Navigation**: 56dp bottom nav for easy reach
- **Conversation-Driven**: Chat overlay as primary interaction
- **Context-Aware States**: Dynamic highlighting based on current page
- **Progressive Disclosure**: Simple → Detailed → Deep Analysis

### Page Hierarchy & Transitions

#### 1. VHealthSearch (Entry Point)
**Purpose**: Quick health query entry
**Mobile Pattern**: Google-style search with minimal UI
**Exit Actions**:
- Text search → Navigate to SearchResults with results
- Image upload → Process → FullChat with analysis
- Voice input → Process → SearchResults with transcription

#### 2. SearchResults (Results Landing)  
**Purpose**: Display initial AI analysis + provide conversation access
**Mobile Pattern**: Dashboard + Chat overlay
**Key Behaviors**:
- **Auto-opens FullChat** when coming from VHealthSearch (conversation flow)
- **Auto-opens FullChat** when user asks any question from SearchResults page
- **Shows floating chat button** when chat is closed (desktop/tablet)
- **Bottom nav highlighting** shows current context
**Exit Actions**:
- Any question/search input → Immediately loads FullChat overlay
- Chat interaction → FullChat overlay
- Navigation tabs → Other app sections
- Header search → Universal search via FullChat

#### 3. FullChat (Conversation Interface)
**Purpose**: Deep conversational AI interaction
**Mobile Pattern**: Full-screen overlay with dismissal
**Key Behaviors**:
- **Full screen on mobile** (not sidebar - this is mobile-first)
- **Covers SearchResults** completely when active
- **Swipe/button dismissal** returns to SearchResults
- **Image integration** for barcode/food analysis
**Exit Actions**:
- Close chat → Return to SearchResults
- View Charts → Minimize chat, show dashboard

#### 4. Dashboard/Overview (Data View)
**Purpose**: Health metrics and chart visualization  
**Mobile Pattern**: Card-based scrolling layout
**Access**: Via navigation or after chat interaction

### Responsive Breakpoint Strategy

```javascript
const designPatterns = {
  // Mobile-first breakpoints (not desktop-down)
  mobile: {
    maxWidth: 767,
    pattern: 'conversation-first',
    navigation: 'bottom-tabs',
    chat: 'full-screen-overlay',
    layout: 'single-column',
  },
  
  tablet: {
    minWidth: 768,
    maxWidth: 1199, 
    pattern: 'hybrid-layout',
    navigation: 'bottom-tabs + floating',
    chat: 'overlay-with-margin',
    layout: 'two-column-when-possible',
  },
  
  desktop: {
    minWidth: 1200,
    pattern: 'sidebar-optional',
    navigation: 'header-primary',
    chat: 'floating-button',
    layout: 'multi-column',
  },
};
```

### State Management Patterns

#### Navigation State Flow
```javascript
const navigationStates = {
  // User journey states
  searching: {
    page: 'VHealthSearch',
    bottomNav: 'search-highlighted',
    chatVisible: false,
    headerSearch: false,
  },
  
  viewingResults: {
    page: 'SearchResults', 
    bottomNav: 'search-highlighted',
    chatVisible: false, // Initially closed
    headerSearch: true,
  },
  
  askingQuestion: {
    page: 'SearchResults',
    bottomNav: 'chat-highlighted', // Immediately switches to chat context
    chatVisible: true, // Auto-opens when question is asked
    headerSearch: false, // Hidden by chat overlay
    trigger: 'user-question', // Triggered by any question input
  },
  
  chatting: {
    page: 'SearchResults',
    bottomNav: 'chat-highlighted', // Context-aware
    chatVisible: true,
    headerSearch: false, // Hidden by overlay
  },
  
  analyzing: {
    page: 'SearchResults',
    bottomNav: 'chat-highlighted',
    chatVisible: true,
    showCharts: true, // Behind chat
  },
};
```

#### Context-Aware Button States
```javascript
const getContextualNavState = (currentPage, chatOpen, hasResults) => {
  return {
    searchTab: {
      highlighted: currentPage === 'VHealthSearch' || !chatOpen,
      enabled: true,
    },
    scanTab: {
      highlighted: false,
      enabled: true,
    },
    chatTab: {
      highlighted: chatOpen && hasResults,
      enabled: hasResults,
    },
    loginTab: {
      highlighted: false, 
      enabled: true,
    },
  };
};
```

### Mobile-First Component Patterns

#### Layout Priority (Mobile → Desktop)
```javascript
const layoutPriorities = {
  mobile: {
    primary: 'conversation',
    secondary: 'quick-actions',
    tertiary: 'detailed-data',
    hidden: 'complex-charts',
  },
  
  tablet: {
    primary: 'conversation + overview',
    secondary: 'detailed-data', 
    tertiary: 'quick-actions',
    visible: 'simple-charts',
  },
  
  desktop: {
    primary: 'dashboard',
    secondary: 'conversation',
    tertiary: 'detailed-analysis',
    visible: 'complex-charts',
  },
};
```

#### Touch-First Interaction Patterns
```javascript
const touchPatterns = {
  // Thumb-friendly zones (based on device size)
  primaryAction: {
    zone: 'bottom-third',
    size: 'minimum-48dp',
    spacing: 'minimum-8dp',
  },
  
  secondaryAction: {
    zone: 'middle-third', 
    size: 'minimum-32dp',
    spacing: 'minimum-4dp',
  },
  
  // Question-triggered chat opening
  questionTriggeredChat: {
    trigger: 'any-text-input', // Header search, voice input, etc.
    behavior: 'immediate-fullscreen-chat',
    animation: 'slide-up-from-bottom',
    duration: 300, // milliseconds
  },
  
  // Gestures
  swipeToClose: {
    direction: 'down',
    target: 'chat-overlay',
    threshold: 100, // pixels
  },
  
  pullToRefresh: {
    direction: 'down',
    target: 'main-content',
    enabled: true,
  },
};
```

### Dashboard Defaults & Integration

#### Default Dashboard Configuration
```javascript
const dashboardDefaults = {
  // Mobile defaults (conversation-focused)
  mobile: {
    showChatFirst: true,
    chartsMinimized: true,
    cardCount: 4, // Essential cards only
    updateFrequency: 'on-interaction',
  },
  
  // Tablet defaults (balanced)
  tablet: {
    showChatFirst: false,
    chartsVisible: true,
    cardCount: 8, // More cards visible
    updateFrequency: 'real-time',
  },
  
  // Desktop defaults (data-focused) 
  desktop: {
    showChatFirst: false,
    chartsExpanded: true,
    cardCount: 12, // Full dashboard
    updateFrequency: 'real-time',
  },
};
```

#### Results → Dashboard Integration
```javascript
const dashboardIntegration = {
  // How SearchResults feeds dashboard
  dataFlow: {
    searchQuery: 'passes to dashboard context',
    aiResponse: 'generates health metrics',
    chatHistory: 'influences recommendations',
    userPreferences: 'customizes card selection',
  },
  
  // Dashboard entry points
  entryPaths: {
    fromSearch: 'auto-navigate after results display',
    fromChat: 'navigate after conversation completion', 
    fromNav: 'direct access via bottom nav',
    fromNotification: 'deep link to specific metrics',
  },
};
```

## Component Overview

SearchResults is the results display page that appears after users submit a search query from VHealthSearch. It provides a comprehensive interface for viewing AI-generated health analysis, interacting with chat, and accessing additional features.

### Page Structure & Purpose

The component consists of several key sections arranged in a layered interface:

1. **Fixed Header** (Top of screen)
   - Search input with universal search capability
   - Progress menu and login controls
   - Consistent across all result pages

2. **Main Dashboard Content** (Center area)
   - Primary content area for results display
   - Adaptive layout based on screen size
   - Integrates with chart components

3. **Full Screen Chat Overlay** (When active)
   - Conversational AI interface
   - Covers main content when open
   - Supports image display and analysis

4. **Floating Chat Button** (When chat closed)
   - Quick access to open chat
   - Positioned for easy thumb reach

5. **Bottom Navigation** (Mobile only)
   - Same navigation as VHealthSearch
   - Context-aware highlighting

6. **Modal Overlays** (When triggered)
   - Image upload modal for additional scans
   - Loading spinner during processing

### User Interactions & Flow

**Primary Use Cases:**
- **View Results**: Display AI analysis from previous search
- **Chat Interaction**: Engage with conversational AI about results
- **Additional Searches**: Perform new searches via header
- **Image Analysis**: Upload new images for analysis
- **Navigation**: Access other app sections via tabs

**Visual States:**
- **Loading State**: Spinner overlay during AI processing
- **Results View**: Main dashboard with analysis content
- **Chat Active**: Full-screen conversational interface
- **Modal States**: Image upload and processing overlays

### Component Hierarchy

```
SearchResults (Main Container)
├── Fixed Header (Universal Search)
│   ├── Search Input
│   ├── Progress Menu
│   └── Login Controls
├── Main Dashboard Content
│   ├── Results Display Area
│   └── Chart Components Integration
├── Full Screen Chat (Overlay)
│   ├── Chat Messages
│   ├── Input Controls
│   └── Image Display
├── Floating Chat Button (When chat closed)
├── Bottom Navigation (Mobile Only)
│   ├── Search Tab (highlighted)
│   ├── Scan Tab
│   ├── Chat Tab
│   └── Login Tab
└── Modal Overlays
    ├── Image Upload Modal
    └── Loading Spinner
```

### Design Philosophy

**Results-Focused Interface:**
- Clean, dashboard-style layout for data consumption
- Chat-first interaction model for follow-up questions
- Mobile-optimized for on-the-go health decisions
- Seamless integration between results and conversation

**Adaptive Layout:**
- Responsive padding and spacing based on screen size
- Context-aware button states and visibility
- Optimized touch targets for mobile interaction

## Color Palette

```javascript
const colors = {
  // Primary Colors (inherited from VHealthSearch)
  primary: '#4285f4',
  primaryHover: '#3367d6',
  
  // Chat & Interaction Colors
  chatGreen: '#4cbb17',
  chatBackground: '#ffffff',
  chatOverlay: 'rgba(0, 0, 0, 0.5)',
  
  // Header Colors
  headerBackground: '#ffffff',
  headerBorder: '#e0e0e0',
  searchInputBg: '#f8f9fa',
  
  // Dashboard Colors
  dashboardBg: '#f9f9f9',
  contentBg: '#ffffff',
  cardBorder: '#e5e7eb',
  
  // Status Colors
  loadingOverlay: 'rgba(255, 255, 255, 0.95)',
  errorText: '#dc2626',
  successText: '#16a34a',
  
  // Gray Scale
  gray100: '#f3f4f6',
  gray200: '#e5e7eb',
  gray300: '#d1d5db',
  gray400: '#9ca3af',
  gray500: '#6b7280',
  gray600: '#4b5563',
  gray700: '#374151',
  gray800: '#1f2937',
  
  // Dark Mode Colors
  darkBackground: '#1f1f1f',
  darkBorder: '#2d2d2d',
  darkText: '#e0e0e0',
  
  // Accent Colors
  white: '#ffffff',
  transparent: 'transparent',
  black: '#000000',
};
```

## Layout Styles & Container Components

### Fixed Header Container
**Purpose**: Provides consistent navigation and search across all result pages
**Visual**: White background with subtle shadow, spans full screen width
**Behavior**: Fixed positioning, responsive padding for mobile devices

```javascript
const fixedHeader = {
  position: 'absolute', // Use absolute in React Native
  top: 0,
  left: 0,
  right: 0,
  zIndex: 1000,
  backgroundColor: colors.headerBackground,
  shadowColor: colors.black,
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  elevation: 5, // Android shadow
};

// Mobile padding for native apps
const mobileHeaderPadding = {
  paddingTop: 48, // Status bar height
};
```

### Main Dashboard Container
**Purpose**: Primary content area that adapts to screen size and displays results
**Visual**: Light gray background with responsive padding
**Behavior**: Adjusts padding based on device width and chat state

```javascript
const dashboardContainer = {
  flex: 1,
  backgroundColor: colors.dashboardBg,
  paddingHorizontal: 16,
};

// Responsive padding based on screen width
const getResponsivePadding = (screenWidth) => {
  if (screenWidth < 768) {
    return { paddingTop: 280 }; // Mobile
  } else if (screenWidth < 1200) {
    return { paddingTop: 260 }; // Tablet
  } else {
    return { paddingTop: 140 }; // Desktop
  }
};

const dashboardMainContent = {
  flex: 1,
  backgroundColor: colors.contentBg,
  borderRadius: 8,
  padding: 20,
  marginVertical: 16,
};
```

## Button Styles & Interactive Components

### Floating Chat Button
**Purpose**: Provides quick access to chat when overlay is closed
**Visual**: Circular button with chat emoji, positioned for thumb accessibility
**Behavior**: Shows only when chat is closed and not on native Android

```javascript
const floatingChatButton = {
  position: 'absolute',
  bottom: 80, // Above bottom navigation
  right: 20,
  width: 56,
  height: 56,
  borderRadius: 28,
  backgroundColor: colors.chatGreen,
  alignItems: 'center',
  justifyContent: 'center',
  shadowColor: colors.black,
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.3,
  shadowRadius: 8,
  elevation: 8, // Android shadow
  zIndex: 1100,
};

const floatingChatButtonText = {
  fontSize: 24,
  color: colors.white,
};

const floatingChatButtonHover = {
  ...floatingChatButton,
  backgroundColor: '#45a015', // Darker green
  transform: [{ scale: 1.05 }],
};
```

### Bottom Navigation (Results Page)
**Purpose**: Context-aware navigation with chat state highlighting
**Visual**: Same structure as VHealthSearch but with dynamic chat button state
**Behavior**: Chat button highlights when chat is active

```javascript
const bottomNavigation = {
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  height: 56,
  flexDirection: 'row',
  justifyContent: 'space-around',
  alignItems: 'center',
  borderTopWidth: 1,
  zIndex: 1200,
};

const bottomNavigationLight = {
  ...bottomNavigation,
  backgroundColor: colors.white,
  borderTopColor: colors.gray200,
  shadowColor: colors.black,
  shadowOffset: { width: 0, height: -2 },
  shadowOpacity: 0.1,
  shadowRadius: 8,
  elevation: 8,
};

const bottomNavigationDark = {
  ...bottomNavigation,
  backgroundColor: colors.darkBackground,
  borderTopColor: colors.darkBorder,
};
```

#### Navigation Buttons (Results Context)

**Search Button**: Navigate back to home/search
```javascript
const searchNavButton = {
  flex: 1,
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'flex-start',
  backgroundColor: colors.transparent,
  borderWidth: 0,
  paddingVertical: 4,
  gap: 4,
};

const searchNavButtonIcon = {
  width: 24,
  height: 24,
  color: colors.gray600,
};

const searchNavButtonText = {
  fontSize: 11,
  fontWeight: '500',
  color: colors.gray600,
};
```

**Scan Button**: Open image upload modal
```javascript
const scanNavButton = {
  ...searchNavButton,
};

const scanNavButtonIcon = {
  ...searchNavButtonIcon,
  color: colors.gray600,
};

const scanNavButtonIconHover = {
  ...searchNavButtonIcon,
  color: colors.chatGreen,
};
```

**Chat Button**: Toggle chat state (context-aware highlighting)
```javascript
const chatNavButton = {
  ...searchNavButton,
};

const chatNavButtonIcon = {
  width: 24,
  height: 24,
};

const chatNavButtonIconDefault = {
  ...chatNavButtonIcon,
  color: colors.gray600,
};

const chatNavButtonIconActive = {
  ...chatNavButtonIcon,
  color: colors.chatGreen, // Highlighted when chat is open
};

const chatNavButtonText = {
  fontSize: 11,
  fontWeight: '500',
};

const chatNavButtonTextDefault = {
  ...chatNavButtonText,
  color: colors.gray600,
};

const chatNavButtonTextActive = {
  ...chatNavButtonText,
  color: colors.chatGreen, // Matches icon when active
};
```

**Login Button**: Trigger authentication
```javascript
const loginNavButton = {
  ...searchNavButton,
};

const loginNavButtonIcon = {
  ...searchNavButtonIcon,
  color: colors.gray600,
};

const loginNavButtonText = {
  ...searchNavButtonText,
  color: colors.gray600,
};
```

## Full Screen Chat Overlay

### Chat Container
**Purpose**: Conversational AI interface that covers the main content
**Visual**: Full screen overlay with chat messages and input
**Behavior**: Slides up from bottom, dismissible by swipe or button

```javascript
const fullScreenChatContainer = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: colors.chatBackground,
  zIndex: 1500, // Above everything except modals
};

const chatOverlay = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: colors.chatOverlay,
  zIndex: 1400,
};

const chatContent = {
  flex: 1,
  backgroundColor: colors.chatBackground,
  borderTopLeftRadius: 16,
  borderTopRightRadius: 16,
  marginTop: 80, // Leave space for status bar
  paddingHorizontal: 16,
  paddingVertical: 20,
};
```

### Chat Messages Area
```javascript
const chatMessagesContainer = {
  flex: 1,
  paddingBottom: 16,
};

const chatMessage = {
  marginBottom: 12,
  padding: 12,
  borderRadius: 8,
  maxWidth: '85%',
};

const userMessage = {
  ...chatMessage,
  backgroundColor: colors.primary,
  alignSelf: 'flex-end',
};

const userMessageText = {
  color: colors.white,
  fontSize: 16,
  lineHeight: 22,
};

const assistantMessage = {
  ...chatMessage,
  backgroundColor: colors.gray100,
  alignSelf: 'flex-start',
};

const assistantMessageText = {
  color: colors.gray800,
  fontSize: 16,
  lineHeight: 22,
};
```

### Chat Input Controls
```javascript
const chatInputContainer = {
  flexDirection: 'row',
  alignItems: 'center',
  paddingHorizontal: 16,
  paddingVertical: 12,
  backgroundColor: colors.white,
  borderTopWidth: 1,
  borderTopColor: colors.gray200,
};

const chatInput = {
  flex: 1,
  borderWidth: 1,
  borderColor: colors.gray300,
  borderRadius: 20,
  paddingHorizontal: 16,
  paddingVertical: 10,
  fontSize: 16,
  backgroundColor: colors.gray100,
  maxHeight: 100,
};

const chatSendButton = {
  marginLeft: 8,
  width: 40,
  height: 40,
  borderRadius: 20,
  backgroundColor: colors.primary,
  alignItems: 'center',
  justifyContent: 'center',
};

const chatSendButtonDisabled = {
  ...chatSendButton,
  backgroundColor: colors.gray400,
};

const chatSendButtonIcon = {
  width: 20,
  height: 20,
  color: colors.white,
};
```

## Modal Components

### Loading Spinner Overlay
**Purpose**: Shows processing state during search or analysis
**Visual**: Semi-transparent overlay with centered spinner and messages
**Behavior**: Blocks interaction until processing completes

```javascript
const loadingOverlay = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: colors.loadingOverlay,
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 2000,
};

const loadingContainer = {
  backgroundColor: colors.white,
  borderRadius: 12,
  padding: 32,
  alignItems: 'center',
  shadowColor: colors.black,
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.2,
  shadowRadius: 12,
  elevation: 10,
};

const loadingSpinner = {
  width: 40,
  height: 40,
  marginBottom: 16,
};

const loadingTitle = {
  fontSize: 18,
  fontWeight: '600',
  color: colors.gray800,
  textAlign: 'center',
  marginBottom: 8,
};

const loadingSubtitle = {
  fontSize: 14,
  color: colors.gray600,
  textAlign: 'center',
};
```

### Image Upload Modal
**Purpose**: Handles image upload and barcode scanning functionality
**Visual**: Same as VHealthSearch but in results context
**Behavior**: Processes uploads and sends results to chat or new search

```javascript
const imageUploadModal = {
  flex: 1,
  backgroundColor: colors.chatOverlay,
  alignItems: 'center',
  justifyContent: 'center',
};

const imageUploadContent = {
  backgroundColor: colors.white,
  borderRadius: 12,
  padding: 24,
  width: '90%',
  maxWidth: 400,
  alignItems: 'center',
};

const imageUploadTitle = {
  fontSize: 20,
  fontWeight: '600',
  color: colors.gray800,
  marginBottom: 8,
  textAlign: 'center',
};

const imageUploadSubtitle = {
  fontSize: 14,
  color: colors.gray600,
  marginBottom: 24,
  textAlign: 'center',
};

const imageUploadButton = {
  backgroundColor: colors.primary,
  borderRadius: 8,
  paddingHorizontal: 24,
  paddingVertical: 12,
  marginBottom: 16,
};

const imageUploadButtonText = {
  color: colors.white,
  fontSize: 16,
  fontWeight: '500',
  textAlign: 'center',
};
```

## Responsive Design Values

### Breakpoints and Spacing
```javascript
const breakpoints = {
  mobile: 480,
  tablet: 768,
  desktop: 1200,
};

const getResponsiveSpacing = (screenWidth) => {
  if (screenWidth < 480) return 8;  // Very small mobile
  if (screenWidth < 768) return 12; // Mobile
  if (screenWidth < 1024) return 20; // Tablet
  return 32; // Desktop
};

const responsiveLayout = {
  mobileHeaderHeight: 280,
  tabletHeaderHeight: 260,
  desktopHeaderHeight: 140,
  bottomNavHeight: 56,
  floatingButtonOffset: 80, // Above bottom nav
};
```

### Device-Specific Adjustments
```javascript
const platformStyles = {
  // Native status bar padding
  nativeStatusBar: {
    paddingTop: 48,
  },
  
  // Web-only styles (not applicable in React Native)
  webScrollBehavior: {
    // React Native handles scrolling differently
  },
  
  // Chat overlay positioning
  chatOverlayMobile: {
    marginTop: 0, // Full screen on mobile
  },
  
  chatOverlayDesktop: {
    marginTop: 80, // Preserve header space
  },
};
```

## Animation Values

```javascript
const animations = {
  // Chat slide animations
  chatSlideIn: {
    duration: 300,
    easing: 'easeOutCubic',
  },
  
  chatSlideOut: {
    duration: 250,
    easing: 'easeInCubic',
  },
  
  // Button interactions
  buttonPress: {
    duration: 150,
    scale: 0.95,
  },
  
  buttonRelease: {
    duration: 100,
    scale: 1.0,
  },
  
  // Floating button hover
  floatingButtonHover: {
    duration: 200,
    scale: 1.05,
  },
  
  // Loading fade in/out
  loadingFadeIn: {
    duration: 200,
    opacity: 1,
  },
  
  loadingFadeOut: {
    duration: 150,
    opacity: 0,
  },
};
```

## State Management Patterns

### Dynamic Button States
```javascript
const getButtonStateStyle = (isActive, isDisabled, baseStyle, activeStyle, disabledStyle) => {
  if (isDisabled) return { ...baseStyle, ...disabledStyle };
  if (isActive) return { ...baseStyle, ...activeStyle };
  return baseStyle;
};

// Usage example for chat button
const getChatButtonStyle = (isChatOpen, isDarkMode) => {
  const baseStyle = isDarkMode ? chatNavButtonIconDark : chatNavButtonIconDefault;
  const activeStyle = chatNavButtonIconActive;
  
  return getButtonStateStyle(isChatOpen, false, baseStyle, activeStyle, null);
};
```

### Responsive Style Selection
```javascript
const getResponsiveStyle = (screenWidth, mobileStyle, tabletStyle, desktopStyle) => {
  if (screenWidth < breakpoints.mobile) return mobileStyle;
  if (screenWidth < breakpoints.tablet) return tabletStyle;
  return desktopStyle;
};

// Usage example for container padding
const getContainerPadding = (screenWidth) => {
  return getResponsiveStyle(
    screenWidth,
    { paddingHorizontal: 16 }, // Mobile
    { paddingHorizontal: 24 }, // Tablet
    { paddingHorizontal: 32 }  // Desktop
  );
};
```

## Usage Example

```javascript
import { StyleSheet, Dimensions } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

const styles = StyleSheet.create({
  // Layout
  fixedHeader: fixedHeader,
  dashboardContainer: {
    ...dashboardContainer,
    ...getResponsivePadding(screenWidth),
  },
  
  // Interactive elements
  floatingChatButton: floatingChatButton,
  bottomNavigation: bottomNavigationLight,
  
  // Chat components
  chatContainer: fullScreenChatContainer,
  chatMessage: userMessage,
  chatInput: chatInput,
  
  // Modals
  loadingOverlay: loadingOverlay,
  imageUploadModal: imageUploadModal,
  
  // Navigation
  searchNavButton: searchNavButton,
  scanNavButton: scanNavButton,
  chatNavButton: chatNavButton,
  loginNavButton: loginNavButton,
});

// Dynamic style functions
export const getDynamicStyles = (screenWidth, isDarkMode, isChatOpen) => ({
  container: getContainerPadding(screenWidth),
  chatButton: getChatButtonStyle(isChatOpen, isDarkMode),
  spacing: getResponsiveSpacing(screenWidth),
});
```

## Integration Notes

### Relationship to VHealthSearch
- Inherits color palette and navigation structure
- Extends with chat and results-specific functionality
- Maintains consistent design language across pages

### Chat Integration
- Full screen overlay approach for mobile optimization
- Floating button for desktop usability
- Context-aware state management for navigation

### Performance Considerations
- Use `useCallback` for expensive style calculations
- Implement `useMemo` for responsive breakpoint checks
- Optimize animation performance with `useNativeDriver`
- Consider `InteractionManager` for heavy operations

This SearchResults page represents the primary user interaction area after initial search, focusing on conversation and deeper analysis rather than initial query input.