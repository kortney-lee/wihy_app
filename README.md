# Wihy Native

A React Native application built with TypeScript for Android and iOS platforms.

## Getting Started

### Prerequisites

- Node.js (>= 18)
- npm or yarn
- For Android development:
  - Android Studio
  - Android SDK
  - Java Development Kit (JDK)
- For iOS development (macOS only):
  - Xcode
  - iOS Simulator
  - CocoaPods

### Installation

1. Install dependencies:
```bash
npm install
```

2. For iOS (macOS only):
```bash
cd ios && pod install && cd ..
```

### Running the App

#### Android
```bash
npm run android
```

#### iOS (macOS only)
```bash
npm run ios
```

#### Start Metro bundler separately
```bash
npm start
```

### Building for Production

#### Android
```bash
npm run build:android
```

#### iOS
```bash
npm run build:ios
```

### Project Structure

```
src/
├── App.tsx              # Main app component with navigation
├── screens/
│   ├── HomeScreen.tsx   # Home screen component
│   └── AboutScreen.tsx  # About screen component
android/                 # Android-specific code and configuration
ios/                     # iOS-specific code and configuration
```

### Features

- ✅ React Navigation for screen navigation
- ✅ TypeScript for type safety
- ✅ Safe Area handling for modern devices
- ✅ Cross-platform compatibility (Android & iOS)
- ✅ Modern React Native architecture

### Development

This project follows React Native best practices and includes:

- TypeScript configuration
- ESLint for code linting
- Metro bundler configuration
- Platform-specific optimizations

### Troubleshooting

If you encounter issues:

1. Clean the project:
```bash
npx react-native clean
```

2. Reset Metro bundler cache:
```bash
npm start -- --reset-cache
```

3. For Android, clean and rebuild:
```bash
cd android && ./gradlew clean && cd ..
```

4. For iOS, clean and reinstall pods:
```bash
cd ios && rm -rf Pods && pod install && cd ..
```

## License

This project is licensed under the MIT License.
