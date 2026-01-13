# Expo Commands Quick Reference

## Development

```bash
# Start development server
npx expo start --clear

# Start with specific platform
npx expo start --android
npx expo start --ios

# Start with tunnel for external devices
npx expo start --tunnel
```

## Building

```bash
# Configure EAS Build (first time setup)
eas build:configure

# iOS Builds
eas build --platform ios --profile development
eas build --platform ios --profile preview
eas build --platform ios --profile production

# Android Builds
eas build --platform android --profile development
eas build --platform android --profile preview
eas build --platform android --profile production

# Build both platforms
eas build --platform all --profile production
```

## Submitting to App Stores

```bash
# Submit iOS to TestFlight/App Store
eas submit --platform ios --latest

# Submit Android to Play Store
eas submit --platform android --latest

# Submit specific build
eas submit --platform ios --id <build-id>
```

## Prebuild (Generate Native Projects)

```bash
# Generate native iOS and Android folders
npx expo prebuild

# Clean prebuild (removes and regenerates)
npx expo prebuild --clean

# Platform specific
npx expo prebuild --platform ios
npx expo prebuild --platform android
```

## Updates (OTA)

```bash
# Configure EAS Update
eas update:configure

# Publish update to production
eas update --branch production --message "Description of changes"

# Publish update to preview
eas update --branch preview --message "Description of changes"
```

## Useful Commands

```bash
# Check Expo doctor for issues
npx expo-doctor

# Install dependencies with Expo compatibility
npx expo install <package-name>

# Check build status
eas build:list

# View build logs
eas build:view <build-id>

# Login to Expo
eas login

# Check current account
eas whoami
```

## Environment Variables

```bash
# Build with environment file
eas build --platform ios --profile production --local

# Set secrets for EAS
eas secret:create --name API_KEY --value "your-api-key"
eas secret:list
```
ets build the release for apple - cd /Users/kortney/Desktop/wihy_native_app && eas build --platform ios --profile production

npx expo prebuild --clean

eas build --platform ios --profile production