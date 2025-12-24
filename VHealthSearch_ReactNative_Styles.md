# VHealthSearch React Native Style Guide

This document contains all button colors and styles from the VHealthSearch component, converted from Tailwind CSS to React Native StyleSheet format.

## Component Overview

VHealthSearch is the main search landing page component for a health and nutrition analysis app. It provides a Google-style search interface where users can input health-related queries and get AI-powered analysis.

### Page Structure & Purpose

The component consists of several key sections arranged vertically:

1. **Main Search Interface** (Center of screen)
   - Google-style search input with animated border
   - Voice input, camera, and clear functionality
   - Two primary action buttons for different search types

2. **Bottom Navigation** (Mobile only)
   - Tab-based navigation with 4 main functions
   - Consistent with mobile app patterns (56dp height)

3. **Modal Overlays** (When triggered)
   - Image upload modal for barcode/food scanning
   - Loading overlay during search processing

### User Interactions & Flow

**Primary Use Cases:**
- **Text Search**: Users type health/nutrition questions and get AI analysis
- **Image Upload**: Users scan barcodes or upload food photos for analysis  
- **Voice Input**: Users speak their questions using speech recognition
- **Navigation**: Users access other app sections via bottom tabs

**Visual States:**
- **Default State**: Clean, minimal Google-style landing page
- **Focus State**: Search input gains animated gradient border
- **Loading State**: Overlay with progress messages
- **Results State**: Navigation to results page with analysis

### Component Hierarchy

```
VHealthSearch (Main Container)
├── Search Input Container (Animated Border)
│   ├── TextArea Input (Auto-resizing)
│   └── Action Icons (Clear, Camera, Voice)
├── Primary Action Buttons
│   ├── "Analyze Nutrition" (Primary CTA)
│   └── "Verify With Evidence" (Secondary)
├── Bottom Navigation (Mobile Only)
│   ├── Search Tab
│   ├── Scan Tab  
│   ├── Research Tab
│   └── Login Tab
└── Modal Overlays
    ├── Image Upload Modal
    └── Loading Overlay
```

### Design Philosophy

**Google-Inspired Interface:**
- Clean, minimal design with generous whitespace
- Familiar search patterns for immediate usability
- Material Design principles for Android compatibility
- Focus on accessibility and touch-friendly interactions

**Health-Focused Branding:**
- Blue primary color (#4285f4) for trust and reliability
- Green accents (#16a34a) for health/nature associations  
- Orange highlights (#fa5f06) for energy and action
- Consistent with health app design patterns

## Color Palette

```javascript
const colors = {
  // Primary Colors
  primary: '#4285f4',
  primaryHover: '#3367d6',
  
  // Secondary Colors
  secondary: '#f8f9fa',
  secondaryText: '#3c4043',
  secondaryBorder: '#f0f0f0',
  secondaryHover: '#f1f3f4',
  
  // Gray Scale
  gray100: '#f3f4f6',
  gray200: '#e5e7eb',
  gray400: '#9ca3af',
  gray500: '#6b7280',
  gray600: '#4b5563',
  gray700: '#374151',
  gray800: '#1f2937',
  
  // Accent Colors
  blue600: '#2563eb',
  red500: '#ef4444',
  green600: '#16a34a',
  purple600: '#9333ea',
  
  // Status Colors
  white: '#ffffff',
  transparent: 'transparent',
  black: '#000000',
  
  // Dark Mode Colors
  darkGray800: '#1f2937',
  darkGray700: '#374151',
  darkGray200: '#e5e7eb',
};
```

## Primary Action Button Colors

### Analyze Nutrition Button Colors
**Purpose**: Main call-to-action button for health analysis
**Color Theme**: Google Blue for trust and reliability

```javascript
const analyzeNutritionColors = {
  // Default state
  background: '#4285f4',      // Google Blue
  text: '#ffffff',            // White text
  
  // Hover/Press state  
  backgroundHover: '#3367d6', // Darker Google Blue
  textHover: '#ffffff',       // White text (unchanged)
  
  // Disabled state
  backgroundDisabled: '#9ca3af', // Gray 400
  textDisabled: '#ffffff',       // White text (unchanged)
  
  // Shadow colors
  shadowDefault: 'rgba(0,0,0,0.1)',
  shadowHover: 'rgba(0,0,0,0.15)',
};
```

### Verify With Evidence Button Colors  
**Purpose**: Secondary action for research and verification
**Color Theme**: Light gray with dark text for secondary importance

```javascript
const verifyEvidenceColors = {
  // Default state
  background: '#f8f9fa',      // Light gray
  text: '#3c4043',            // Dark gray text
  border: '#f0f0f0',          // Very light gray border
  
  // Hover/Press state
  backgroundHover: '#f1f3f4', // Slightly darker gray
  textHover: '#3c4043',       // Dark gray text (unchanged)
  borderHover: '#dadce0',     // Medium gray border
  
  // Disabled state  
  backgroundDisabled: '#f8f9fa', // Same as default
  textDisabled: '#9ca3af',       // Lighter gray text
  borderDisabled: '#f0f0f0',     // Same border as default
  
  // Shadow colors
  shadowDefault: 'rgba(0,0,0,0.1)',
  shadowHover: 'rgba(0,0,0,0.15)',
};
```

### Quick Reference - Exact Color Values

| Button | State | Background | Text | Border |
|--------|-------|------------|------|---------|
| **Analyze Nutrition** | Default | `#4285f4` | `#ffffff` | None |
| **Analyze Nutrition** | Hover | `#3367d6` | `#ffffff` | None |
| **Analyze Nutrition** | Disabled | `#9ca3af` | `#ffffff` | None |
| **Verify Evidence** | Default | `#f8f9fa` | `#3c4043` | `#f0f0f0` |
| **Verify Evidence** | Hover | `#f1f3f4` | `#3c4043` | `#dadce0` |
| **Verify Evidence** | Disabled | `#f8f9fa` | `#9ca3af` | `#f0f0f0` |

## Button Styles & Component Details

### Search Input Container
**Purpose**: The main search interface that mimics Google's search box design. Features auto-resizing height, animated gradient border on focus, and integrated action icons.

**Behavior**: 
- Starts at minimum height (44px) and expands as user types
- Shows animated border sweep when focused
- Contains floating action icons on the right side

```javascript
const searchInputContainer = {
  position: 'relative',
  width: '100%',
  maxWidth: 584,
  marginVertical: 24,
  marginHorizontal: 'auto',
  paddingHorizontal: 0,
  borderWidth: 1,
  borderColor: '#dfe1e5',
  borderRadius: 24,
  backgroundColor: colors.white,
  shadowColor: 'rgba(64,60,67,0.16)',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 1,
  shadowRadius: 5,
  elevation: 5, // Android shadow
};
```

### Search Input Field  
**Purpose**: Auto-expanding text area for health queries. Supports multi-line input with smart height adjustment.

**Behavior**:
- Font size locked at 16px to prevent iOS zoom
- Right padding accommodates floating action icons
- Placeholder text rotates through health-focused prompts

```javascript
const searchInput = {
  width: '100%',
  minHeight: 44,
  maxHeight: '40%', // 40vh equivalent - prevents excessive expansion
  paddingVertical: 10,
  paddingLeft: 16,
  paddingRight: 128, // Space for 3 action icons + padding
  fontSize: 16,
  color: colors.gray800,
  backgroundColor: colors.transparent,
  borderWidth: 0,
  borderRadius: 24,
  fontFamily: 'System', // React Native system font
  lineHeight: 24,
  textAlignVertical: 'top', // Android alignment
};

// Placeholder style
const placeholderTextColor = colors.gray400;
```

### Icon Buttons (Search Actions)

These small circular buttons float inside the search input on the right side, providing quick access to different input methods.

#### Clear Button
**Purpose**: Removes current search text and resets input height to minimum
**Visual**: Gray background with X icon, turns blue on interaction

```javascript
const clearButton = {
  width: 32,
  height: 32,
  borderWidth: 0,
  backgroundColor: colors.gray100,
  borderRadius: 16,
  alignItems: 'center',
  justifyContent: 'center',
};

const clearButtonHover = {
  ...clearButton,
  backgroundColor: colors.gray200,
};

const clearButtonIcon = {
  color: colors.gray500,
  width: 24,
  height: 24,
};

const clearButtonIconHover = {
  ...clearButtonIcon,
  color: colors.blue600,
};
```

#### Camera Button
**Purpose**: Opens image upload modal for barcode scanning or food photo analysis  
**Visual**: Camera icon, transparent background, disabled state when loading

```javascript
const cameraButton = {
  width: 32,
  height: 32,
  borderWidth: 0,
  backgroundColor: colors.transparent,
  borderRadius: 16,
  alignItems: 'center',
  justifyContent: 'center',
};

const cameraButtonHover = {
  ...cameraButton,
  backgroundColor: colors.gray100,
};

const cameraButtonIcon = {
  color: colors.gray500,
  width: 24,
  height: 24,
};

const cameraButtonIconHover = {
  ...cameraButtonIcon,
  color: colors.blue600,
};

const cameraButtonDisabled = {
  ...cameraButton,
  opacity: 0.5,
};
```

#### Voice Button (Microphone)
**Purpose**: Activates speech recognition for hands-free input
**Visual**: Microphone icon, changes to red background when actively listening

```javascript
const voiceButton = {
  width: 32,
  height: 32,
  borderWidth: 0,
  borderRadius: 16,
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: colors.transparent,
};

const voiceButtonDefault = {
  ...voiceButton,
  backgroundColor: colors.transparent,
};

const voiceButtonDefaultHover = {
  ...voiceButton,
  backgroundColor: colors.gray100,
};

const voiceButtonListening = {
  ...voiceButton,
  backgroundColor: colors.red500, // Red when actively listening
};

const voiceButtonIcon = {
  color: colors.gray500,
  width: 24,
  height: 24,
};

const voiceButtonIconHover = {
  ...voiceButtonIcon,
  color: colors.blue600,
};

const voiceButtonIconListening = {
  ...voiceButtonIcon,
  color: colors.white, // White icon on red background when listening
};

const voiceButtonDisabled = {
  ...voiceButton,
  opacity: 0.5,
};
```

### Primary Action Buttons

Large, prominent buttons below the search input that define the main user actions. Designed to be easily tappable on mobile devices.

#### Analyze Nutrition Button (Primary)
**Purpose**: Main call-to-action that processes user's health query with AI analysis
**Visual**: Google Blue background, white text, elevated shadow, hover animations
**Behavior**: Disabled when no query text, shows loading message during processing

```javascript
const analyzeButton = {
  height: 48,
  backgroundColor: colors.primary,
  borderWidth: 0,
  borderRadius: 24,
  alignItems: 'center',
  justifyContent: 'center',
  paddingHorizontal: 24,
  margin: 8,
  shadowColor: 'rgba(0,0,0,0.1)',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 1,
  shadowRadius: 4,
  elevation: 3,
};

const analyzeButtonText = {
  color: colors.white,
  fontSize: 16,
  fontWeight: '500',
  textAlign: 'center',
};

const analyzeButtonHover = {
  ...analyzeButton,
  backgroundColor: colors.primaryHover,
  transform: [{ translateY: -1 }], // Subtle lift on interaction
  shadowOffset: { width: 0, height: 4 },
  shadowRadius: 8,
  shadowColor: 'rgba(0,0,0,0.15)',
};

const analyzeButtonDisabled = {
  ...analyzeButton,
  opacity: 0.6,
  backgroundColor: colors.gray400,
};
```

#### Verify With Evidence Button (Secondary)  
**Purpose**: Navigates to research dashboard for evidence-based health information
**Visual**: Light gray background, darker text, outlined style, secondary importance
**Behavior**: Always enabled, provides alternative path for research-focused users

```javascript
const verifyButton = {
  height: 48,
  backgroundColor: colors.secondary,
  borderWidth: 1,
  borderColor: colors.secondaryBorder,
  borderRadius: 24,
  alignItems: 'center',
  justifyContent: 'center',
  paddingHorizontal: 24,
  margin: 8,
  shadowColor: 'rgba(0,0,0,0.1)',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 1,
  shadowRadius: 4,
  elevation: 2,
};

const verifyButtonText = {
  color: colors.secondaryText,
  fontSize: 16,
  fontWeight: '500',
  textAlign: 'center',
};

const verifyButtonHover = {
  ...verifyButton,
  backgroundColor: colors.secondaryHover,
  borderColor: '#dadce0',
  transform: [{ translateY: -1 }],
  shadowOffset: { width: 0, height: 4 },
  shadowRadius: 8,
  shadowColor: 'rgba(0,0,0,0.15)',
};

const verifyButtonDisabled = {
  ...verifyButton,
  opacity: 0.6,
};
```

### Bottom Navigation (Mobile)

Native mobile navigation following Material Design guidelines (56dp height). Only visible on mobile devices.

#### Navigation Container
**Purpose**: Provides consistent tab navigation across the health app
**Visual**: White background with subtle shadow, spanning full device width
**Behavior**: Fixed to bottom, supports light/dark mode themes

```javascript
const bottomNavigation = {
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  height: 56, // Android standard bottom nav height
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
  backgroundColor: colors.darkGray800,
  borderTopColor: colors.darkGray700,
};
```

#### Navigation Button
**Purpose**: Individual tab buttons for Search, Scan, Research, and Login functions
**Visual**: Icon + label layout, color-coded hover states for each function
**Behavior**: Each tab has distinct color theme (blue for search, green for scan, purple for research)

```javascript
const navButton = {
  flex: 1,
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'flex-start',
  backgroundColor: colors.transparent,
  borderWidth: 0,
  paddingVertical: 4,
  gap: 4, // Space between icon and text
};

const navButtonLight = {
  ...navButton,
};

const navButtonDark = {
  ...navButton,
};

const navButtonIcon = {
  width: 24,
  height: 24,
};

const navButtonIconLight = {
  ...navButtonIcon,
  color: colors.gray600,
};

const navButtonIconLightHover = {
  ...navButtonIcon,
  color: colors.blue600, // Changes based on tab function
};

const navButtonIconDark = {
  ...navButtonIcon,
  color: colors.darkGray200,
};

const navButtonIconDarkHover = {
  ...navButtonIcon,
  color: colors.white,
};

const navButtonText = {
  fontSize: 11,
  fontWeight: '500',
};

const navButtonTextLight = {
  ...navButtonText,
  color: colors.gray600,
};

const navButtonTextLightHover = {
  ...navButtonText,
  color: colors.blue600, // Matches icon color
};

const navButtonTextDark = {
  ...navButtonText,
  color: colors.darkGray200,
};

const navButtonTextDarkHover = {
  ...navButtonText,
  color: colors.white,
};
```

### Special Button Variants

Function-specific color themes that reinforce the purpose of each navigation tab.

#### Search Button (Blue Theme)
**Purpose**: Search and analysis functions
**Visual**: Blue accent colors for health/trust associations

```javascript
const searchButtonHover = {
  backgroundColor: colors.blue600,
};

const searchButtonIcon = {
  color: colors.gray600,
};

const searchButtonIconHover = {
  color: colors.blue600,
};
```

#### Scan Button (Green Theme)  
**Purpose**: Camera and barcode scanning functions
**Visual**: Green accent colors for healthy/natural associations

```javascript
const scanButtonHover = {
  backgroundColor: colors.green600,
};

const scanButtonIcon = {
  color: colors.gray600,
};

const scanButtonIconHover = {
  color: colors.green600,
};
```

#### Research Button (Purple Theme)
**Purpose**: Evidence-based research and verification
**Visual**: Purple accent colors for knowledge/wisdom associations

```javascript
const researchButtonHover = {
  backgroundColor: colors.purple600,
};

const researchButtonIcon = {
  color: colors.gray600,
};

const researchButtonIconHover = {
  color: colors.purple600,
};
```

## Responsive Breakpoints

```javascript
const breakpoints = {
  mobile: 480,
  tablet: 768,
  desktop: 1024,
};

// Usage example:
const responsiveStyle = (screenWidth) => {
  if (screenWidth <= breakpoints.mobile) {
    return {
      // Mobile styles
      paddingHorizontal: 16,
      fontSize: 14,
    };
  } else if (screenWidth <= breakpoints.tablet) {
    return {
      // Tablet styles
      paddingHorizontal: 20,
      fontSize: 16,
    };
  } else {
    return {
      // Desktop styles
      paddingHorizontal: 24,
      fontSize: 16,
    };
  }
};
```

## Animation Values

```javascript
const animations = {
  // Transition durations
  fast: 200,
  medium: 300,
  slow: 500,
  
  // Transform values
  hoverTranslateY: -1,
  pressTranslateY: 1,
  
  // Shadow values
  shadowDefault: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  shadowHover: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  shadowPressed: {
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
};
```

## Swiping Border Animation

The original web version has a sweeping gradient border animation. In React Native, this requires a combination of `react-native-linear-gradient` and `Animated` API.

### Sweep Animation Colors

The animated gradient border uses a 5-color sweep that represents the health and technology theme:

```javascript
const sweepAnimationColors = {
  // Linear gradient sweep colors (left to right)
  orange: '#fa5f06',    // Energy/vitality - starting point
  white: '#ffffff',     // Clean/pure - transition
  silver: '#C0C0C0',    // Technology/precision - middle
  green: '#4cbb17',     // Health/nature - growth
  blue: '#1a73e8',      // Trust/reliability - ending point
};

// Complete gradient array for LinearGradient component
const sweepGradientColors = ['#fa5f06', '#ffffff', '#C0C0C0', '#4cbb17', '#1a73e8'];
```

### Alternative Rotating Border Colors  

For the simpler rotating border implementation, uses Google brand colors:

```javascript
const rotatingBorderColors = {
  top: '#4285f4',       // Google Blue
  right: '#ea4335',     // Google Red  
  bottom: '#fbbc05',    // Google Yellow
  left: '#34a853',      // Google Green
  transparent: 'transparent', // Base border color
};
```

### Color Sequence Explanation

| Position | Color | Hex Code | Meaning |
|----------|-------|----------|---------|
| **Start** | Orange | `#fa5f06` | Energy, action, vitality |
| **25%** | White | `#ffffff` | Clean, pure, clarity |
| **50%** | Silver | `#C0C0C0` | Technology, precision |
| **75%** | Green | `#4cbb17` | Health, nature, growth |
| **End** | Blue | `#1a73e8` | Trust, reliability, calm |

The sweep moves from energetic orange (action) through clean white and technological silver to healthy green, ending in trustworthy blue - representing the user journey from taking action to receiving trusted health insights.

### Installation
First install the required dependency:
```bash
npm install react-native-linear-gradient
# For iOS, run: cd ios && pod install
```

### Implementation

```javascript
import React, { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const AnimatedBorderInput = ({ children, isAnimating }) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isAnimating) {
      const animation = Animated.loop(
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 2200, // 2.2s like the CSS version
          useNativeDriver: false,
        })
      );
      animation.start();
      return () => animation.stop();
    } else {
      animatedValue.setValue(0);
    }
  }, [isAnimating, animatedValue]);

  // Animate the gradient position
  const gradientPosition = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={animatedBorderContainer}>
      {/* Animated border gradient */}
      <Animated.View
        style={[
          animatedBorderGradient,
          {
            transform: [
              {
                translateX: animatedValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-200, 200], // Sweep across the container
                }),
              },
            ],
          },
        ]}
      >
        <LinearGradient
          colors={sweepGradientColors} // Using the defined color array
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={gradientBorder}
        />
      </Animated.View>
      
      {/* Content container */}
      <View style={contentContainer}>
        {children}
      </View>
    </View>
  );
};

// Styles for the animated border
const animatedBorderContainer = {
  position: 'relative',
  borderRadius: 24,
  padding: 2, // Border thickness
  overflow: 'hidden',
};

const animatedBorderGradient = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  borderRadius: 24,
};

const gradientBorder = {
  flex: 1,
  borderRadius: 24,
};

const contentContainer = {
  backgroundColor: '#ffffff',
  borderRadius: 22, // Slightly smaller than container to show border
  overflow: 'hidden',
};

// Updated search input container with animation support
const searchInputContainerAnimated = {
  ...searchInputContainer,
  borderWidth: 0, // Remove static border when animated
  padding: 0, // Let the animated container handle padding
};
```

### Alternative: Simpler Rotating Border

For a simpler implementation without external dependencies:

```javascript
import React, { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';

const RotatingBorderInput = ({ children, isAnimating }) => {
  const rotateValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isAnimating) {
      const animation = Animated.loop(
        Animated.timing(rotateValue, {
          toValue: 1,
          duration: 2200,
          useNativeDriver: true,
        })
      );
      animation.start();
      return () => animation.stop();
    }
  }, [isAnimating, rotateValue]);

  const rotate = rotateValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={rotatingBorderContainer}>
      <Animated.View
        style={[
          rotatingBorderStyle,
          {
            transform: [{ rotate }],
          },
        ]}
      />
      <View style={rotatingContentContainer}>
        {children}
      </View>
    </View>
  );
};

const rotatingBorderContainer = {
  position: 'relative',
  borderRadius: 24,
};

const rotatingBorderStyle = {
  position: 'absolute',
  top: -2,
  left: -2,
  right: -2,
  bottom: -2,
  borderRadius: 26,
  borderWidth: 2,
  borderColor: 'transparent',
  borderTopColor: '#4285f4',
  borderRightColor: '#ea4335',
  borderBottomColor: '#fbbc05',
  borderLeftColor: '#34a853',
};

const rotatingContentContainer = {
  backgroundColor: '#ffffff',
  borderRadius: 24,
  borderWidth: 1,
  borderColor: '#dfe1e5',
};
```

### Usage in Component

```javascript
const SearchInputWithAnimation = () => {
  const [isAnimating, setIsAnimating] = useState(false);

  return (
    <AnimatedBorderInput isAnimating={isAnimating}>
      <TextInput
        style={searchInput}
        placeholder="Search for health information..."
        placeholderTextColor={placeholderTextColor}
        onFocus={() => setIsAnimating(true)}
        onBlur={() => setIsAnimating(false)}
      />
    </AnimatedBorderInput>
  );
};
```

### Performance Notes

- Use `useNativeDriver: true` when possible for better performance
- Consider using `react-native-reanimated` for more complex animations
- The gradient approach requires `react-native-linear-gradient`
- The rotating border approach uses only native React Native components

## Usage Example

```javascript
import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  primaryButton: analyzeButton,
  primaryButtonText: analyzeButtonText,
  secondaryButton: verifyButton,
  secondaryButtonText: verifyButtonText,
  iconButton: cameraButton,
  bottomNav: bottomNavigationLight,
  navButton: navButtonLight,
  navIcon: navButtonIconLight,
  navText: navButtonTextLight,
});
```