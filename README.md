# WiHy Client - Mobile App

## Overview
WiHy Client is a React Native mobile application for iOS and Android that provides comprehensive health management features including:
- **Nutrition Analysis**: Food scanning and nutritional information
- **Health Dashboard**: Personal health metrics visualization and tracking
- **AI-Powered Chat**: Health insights and recommendations
- **Meal Planning**: AI-generated meal plans and shopping lists
- **Fitness Tracking**: Workout programs and progress monitoring

This repository contains the mobile client application only. The web application has been moved to [Web_app_old](https://github.com/kortney-lee/Web_app_old).

## Quick Start

### Prerequisites
- **Node.js** (version 16 or higher)
- **npm** or **yarn**
- **Expo CLI**: `npm install -g expo-cli`
- **iOS Development**: Xcode (macOS only)
- **Android Development**: Android Studio with SDK

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/kortney-lee/wihy_client.git
   cd wihy_client
   ```

2. **Install dependencies:**
   ```bash
   cd mobile
   npm install
   ```

3. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your API endpoints
   ```

### Running the App

#### Development with Expo
```bash
cd mobile
npm start
```

#### iOS (macOS only)
```bash
cd mobile
npm run ios
```

#### Android
```bash
cd mobile
npm run android
```

## Project Structure

```
mobile/
├── android/          # Android native code
├── ios/              # iOS native code
├── src/              # Application source code
│   ├── components/   # Reusable components
│   ├── screens/      # Screen components
│   ├── services/     # API services
│   ├── navigation/   # Navigation configuration
│   └── utils/        # Utility functions
├── app.json          # Expo configuration
└── package.json      # Dependencies
```

## Build & Deployment

### Android APK Build
```bash
cd mobile
./build-release-apk.ps1
```

### iOS Build
See [IOS_DEBUG_SETUP.md](IOS_DEBUG_SETUP.md) for detailed iOS build instructions.

### GitHub Actions
- **build-mobile-ios.yml**: Automated iOS builds
- **build-mobile-android.yml**: Automated Android builds

## Documentation

- [Mobile App Specification](MOBILE_APP_SPECIFICATION.md)
- [Mobile App Pages Overview](MOBILE_APP_PAGES_OVERVIEW.md)
- [Mobile Deployment Strategy](MOBILE_DEPLOYMENT_STRATEGY.md)
- [Native App Guide](NATIVE_APP_GUIDE.md)
- [Android Build Commands](ANDROID_BUILD_COMMANDS.md)
- [iOS Debug Setup](IOS_DEBUG_SETUP.md)

## API Configuration

The mobile app connects to the WiHy API:
- **Production API**: https://ml.wihy.ai
- **Auth API**: Configured in .env

See [MOBILE-API-TESTING.md](MOBILE-API-TESTING.md) for API testing guidelines.

## Related Repositories

- **Web Application**: [Web_app_old](https://github.com/kortney-lee/Web_app_old)
- **Previous Repository**: [wihy_app](https://github.com/kortney-lee/wihy_app) (archived)

## License

Copyright © 2024 WiHy. All rights reserved.
