# React Native Authentication & UI Architecture Guide

## Overview

This document explains how the web-based authentication and user interface components work together and provides implementation guidance for React Native adaptation.

## Component Architecture

### Core Components

1. **MultiAuthLogin** - Primary authentication interface
2. **UserPreference** - Account management and settings
3. **Spinner** - Loading states and progress indicators
4. **AuthService** - Backend authentication logic (not shown but referenced)

## Current Web Implementation

### Component Relationships

```
Header/App Root
├── MultiAuthLogin (when user not authenticated)
│   ├── Provider Selection Modal
│   ├── Email Authentication Form
│   └── OAuth Redirects
├── UserPreference (when user authenticated)
│   ├── Account Settings Drawer
│   ├── Profile Management
│   └── Sign Out Actions
└── Spinner (overlay for loading states)
    ├── Portal-based Modal
    ├── Progress Tracking
    └── AI Processing Feedback
```

### Authentication Flow

1. **Unauthenticated State**: Shows blue user icon (MultiAuthLogin)
2. **Authentication Process**: 
   - User clicks → Provider selection modal opens
   - Email option → Email form with sign in/up
   - OAuth providers → External provider flow
   - Loading states managed by Spinner
3. **Authenticated State**: Shows green avatar (UserPreference)
4. **Account Management**: Click green avatar → Settings drawer opens

## React Native Adaptations

### 1. MultiAuthLogin Component

#### Web → React Native Changes

**Current Web Features:**
```tsx
// Web-specific elements to replace
- createPortal() → Modal component
- CSS classes → StyleSheet objects
- document.body manipulation → Modal visibility state
- window.location → Linking API
- HTML form elements → React Native form components
```

**React Native Implementation:**

```tsx
import { Modal, View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';

export default function MultiAuthLogin({
  position = 'top-right',
  onUserChange,
  onSignIn,
  onSignOut,
  customProviders,
  title = 'Log in or sign up to WIHY',
}) {
  const [user, setUser] = useState(null);
  const [showProviders, setShowProviders] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);

  return (
    <View style={styles.container}>
      {/* Main Auth Button */}
      <TouchableOpacity 
        style={[
          styles.authButton,
          user ? styles.authenticatedButton : styles.unauthenticatedButton
        ]}
        onPress={() => setShowProviders(!showProviders)}
      >
        {/* User icon or avatar */}
      </TouchableOpacity>

      {/* Provider Selection Modal */}
      <Modal
        visible={showProviders && !user}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowProviders(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.providerContainer}>
            {/* Provider buttons */}
          </View>
        </View>
      </Modal>

      {/* Email Form Modal */}
      <Modal
        visible={showEmailForm}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEmailForm(false)}
      >
        {/* Email form content */}
      </Modal>
    </View>
  );
}
```

#### Key Adaptations:

1. **Portal Replacement**: Use `Modal` component instead of `ReactDOM.createPortal`
2. **Navigation**: Replace `window.location.href` with `Linking.openURL()`
3. **Form Handling**: Use React Native form components (`TextInput`, `TouchableOpacity`)
4. **Styling**: Convert CSS classes to StyleSheet objects
5. **Responsive Design**: Use Dimensions API for mobile-first responsive behavior

### 2. UserPreference Component

#### Web → React Native Changes

**Current Web Features:**
```tsx
// Web drawer implementation
- Fixed positioning → Modal or navigation drawer
- CSS transforms → Animated API
- Backdrop blur → Custom overlay
- Scrollable content → ScrollView/FlatList
```

**React Native Implementation:**

```tsx
import { Modal, ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { BlurView } from '@react-native-blur/blur'; // Optional for backdrop

export default function UserPreference() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState(null);

  return (
    <>
      {/* Green Avatar Trigger */}
      <TouchableOpacity 
        style={styles.avatarButton}
        onPress={() => setOpen(true)}
      >
        {user?.picture ? (
          <Image source={{ uri: user.picture }} style={styles.avatar} />
        ) : (
          // Default avatar icon
        )}
      </TouchableOpacity>

      {/* Settings Modal/Drawer */}
      <Modal
        visible={open}
        animationType="slide"
        presentationStyle="pageSheet" // iOS drawer-like behavior
        onRequestClose={() => setOpen(false)}
      >
        <View style={styles.drawerContainer}>
          <ScrollView style={styles.scrollContainer}>
            {/* Settings sections */}
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}
```

#### Key Adaptations:

1. **Drawer Behavior**: Use Modal with `presentationStyle="pageSheet"` on iOS
2. **Navigation**: Consider using React Navigation's Drawer Navigator
3. **Accordion Sections**: Use Animated API for smooth expand/collapse
4. **Form Components**: Adapt web form elements to React Native equivalents
5. **Platform Differences**: Handle iOS vs Android UI patterns

### 3. Spinner Component

#### Web → React Native Changes

**Current Web Features:**
```tsx
// Portal-based overlay
- document.getElementById() → Modal component
- CSS animations → Animated API or Reanimated
- GIF support → Video or Lottie animations
- Backdrop blur → BlurView or custom overlay
```

**React Native Implementation:**

```tsx
import { Modal, View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { BlurView } from '@react-native-blur/blur';
import LottieView from 'lottie-react-native'; // For animations

export default function Spinner({
  overlay = false,
  title = 'Analyzing with AI...',
  subtitle = 'This may take a few moments...',
  progress,
  type = 'circle',
}) {
  // Non-overlay inline spinner
  if (!overlay) {
    return (
      <View style={styles.inlineContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
    );
  }

  // Overlay modal
  return (
    <Modal
      visible={overlay}
      transparent={true}
      animationType="fade"
      onRequestClose={() => {}} // Prevent dismissal if needed
    >
      <BlurView style={styles.blurOverlay} blurType="dark" blurAmount={10}>
        <View style={styles.content}>
          {type === 'circle' ? (
            <ActivityIndicator size="large" color="white" />
          ) : (
            <LottieView
              source={require('./animations/spinner.json')}
              autoPlay
              loop
              style={styles.animation}
            />
          )}
          
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          
          {/* Progress bar */}
          {typeof progress === 'number' && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View 
                  style={[styles.progressFill, { width: `${progress}%` }]} 
                />
              </View>
              <Text style={styles.progressText}>{progress}%</Text>
            </View>
          )}
        </View>
      </BlurView>
    </Modal>
  );
}
```

#### Key Adaptations:

1. **Portal Alternative**: Use Modal for overlay behavior
2. **Animations**: Replace CSS animations with Animated API or Lottie
3. **GIF Replacement**: Use Lottie animations or MP4 videos
4. **Progress Bars**: Custom implementation with Animated API
5. **Keyboard Handling**: Use BackHandler for Android back button

## Integration Patterns

### 1. State Management

```tsx
// Centralized auth state
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  return (
    <AuthContext.Provider value={{ user, loading, setUser, setLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Usage in components
const { user, loading } = useContext(AuthContext);
```

### 2. Navigation Integration

```tsx
// App.tsx with React Navigation
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

const Stack = createStackNavigator();

export default function App() {
  const { user } = useContext(AuthContext);

  return (
    <NavigationContainer>
      {user ? (
        <Stack.Navigator>
          <Stack.Screen 
            name="Main" 
            component={MainScreen}
            options={{
              headerRight: () => <UserPreference />,
            }}
          />
        </Stack.Navigator>
      ) : (
        <Stack.Navigator>
          <Stack.Screen 
            name="Auth" 
            component={AuthScreen}
            options={{
              headerRight: () => <MultiAuthLogin />,
            }}
          />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}
```

### 3. Platform-Specific Considerations

#### iOS Implementation:
```tsx
// Use native iOS components where appropriate
import { ActionSheetIOS } from 'react-native';

const showProviders = () => {
  ActionSheetIOS.showActionSheetWithOptions({
    options: ['Google', 'Apple', 'Microsoft', 'Email', 'Cancel'],
    cancelButtonIndex: 4,
  }, (buttonIndex) => {
    // Handle provider selection
  });
};
```

#### Android Implementation:
```tsx
// Use Material Design patterns
import { Modal, View } from 'react-native';

// Bottom sheet style modals
const showProviders = () => {
  // Slide up from bottom modal
};
```

## Styling Strategy

### 1. StyleSheet Organization

```tsx
// styles/auth.js
export const authStyles = StyleSheet.create({
  authButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unauthenticatedButton: {
    backgroundColor: '#E3F2FD',
  },
  authenticatedButton: {
    backgroundColor: '#E8F5E8',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  providerContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    margin: 20,
    maxWidth: '90%',
  },
});
```

### 2. Responsive Design

```tsx
import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

const responsiveStyles = StyleSheet.create({
  modal: {
    width: width > 600 ? 400 : width * 0.9,
    maxHeight: height * 0.8,
  },
});
```

## Implementation Checklist

### Phase 1: Core Components
- [ ] Convert MultiAuthLogin to React Native Modal
- [ ] Implement UserPreference drawer/modal
- [ ] Adapt Spinner with ActivityIndicator
- [ ] Create StyleSheet objects from CSS

### Phase 2: Authentication Flow
- [ ] Integrate OAuth providers (Google, Apple, Microsoft)
- [ ] Implement email authentication forms
- [ ] Add loading states and error handling
- [ ] Test authentication persistence

### Phase 3: Platform Features
- [ ] Add biometric authentication (Face ID/Touch ID)
- [ ] Implement platform-specific UI patterns
- [ ] Add proper navigation integration
- [ ] Test on both iOS and Android

### Phase 4: Polish
- [ ] Add smooth animations and transitions
- [ ] Implement accessibility features
- [ ] Add proper error boundaries
- [ ] Performance optimization

## Dependencies

### Required Packages
```bash
npm install @react-navigation/native
npm install @react-navigation/stack
npm install react-native-screens
npm install react-native-safe-area-context

# Optional enhancements
npm install @react-native-blur/blur
npm install lottie-react-native
npm install react-native-keychain
npm install @react-native-async-storage/async-storage
```

### Platform Setup
```bash
# iOS
cd ios && pod install

# Android - no additional setup needed
```

## Security Considerations

1. **Token Storage**: Use Keychain (iOS) or Keystore (Android) for sensitive data
2. **Deep Linking**: Validate OAuth callback URLs
3. **Biometric Auth**: Implement proper fallbacks
4. **Network Security**: Use certificate pinning for API calls
5. **Local Storage**: Encrypt sensitive user data

## Testing Strategy

1. **Unit Tests**: Test component logic and state management
2. **Integration Tests**: Test auth flow end-to-end
3. **Platform Tests**: Test on both iOS and Android devices
4. **Accessibility Tests**: Ensure screen reader compatibility
5. **Performance Tests**: Monitor memory usage and render times

This architecture provides a solid foundation for implementing the web-based authentication system in React Native while maintaining the same user experience and functionality.