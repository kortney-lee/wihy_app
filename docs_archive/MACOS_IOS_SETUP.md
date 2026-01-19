# macOS Setup Guide for WiHY iOS Development

**Last Updated:** January 8, 2026  
**App:** WiHY Health  
**Bundle ID:** `com.wihy.app`

This guide covers everything needed to build, test, and deploy the WiHY app on iOS using a Mac.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Project Setup](#project-setup)
3. [Apple Developer Account](#apple-developer-account-setup)
4. [HealthKit Configuration](#healthkit-configuration)
5. [Building the App](#building-the-app)
6. [Running on Simulator](#running-on-simulator)
7. [Running on Physical Device](#running-on-physical-device)
8. [TestFlight Distribution](#testflight-distribution)
9. [App Store Submission](#app-store-submission)
10. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### 1. System Requirements
- **macOS 13 (Ventura)** or later (recommended: macOS 14 Sonoma+)
- At least **25GB of free disk space** (Xcode + simulators)
- Apple Silicon (M1/M2/M3) or Intel Mac

### 2. Xcode Installation
```bash
# Install Xcode from the Mac App Store (required for iOS development)
# Or download from: https://developer.apple.com/xcode/

# After installation, install command line tools:
xcode-select --install

# Accept Xcode license
sudo xcodebuild -license accept

# Verify installation
xcodebuild -version
# Expected: Xcode 15.0+ and Build version 15A240d+
```

### 3. Node.js (v18+)
```bash
# Install via Homebrew
brew install node

# Or use nvm for version management
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18

# Verify
node --version  # Should be v18.x or v20.x
```

### 4. Watchman (recommended for React Native)
```bash
brew install watchman
```

### 5. CocoaPods
```bash
sudo gem install cocoapods

# Or with Homebrew (recommended for Apple Silicon)
brew install cocoapods

# Verify
pod --version  # Should be 1.14.0+
```

### 6. Ruby (if system Ruby has issues)
```bash
brew install ruby
echo 'export PATH="/opt/homebrew/opt/ruby/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

### 7. Git Setup

Git comes pre-installed on macOS, but you should configure it properly:

```bash
# Verify Git is installed
git --version
# Expected: git version 2.39.0+ (or similar)

# If not installed, install via Xcode Command Line Tools
xcode-select --install

# Or install via Homebrew for the latest version
brew install git
```

#### Configure Git Identity
```bash
# Set your name (used in commits)
git config --global user.name "Your Name"

# Set your email (use your GitHub email)
git config --global user.email "your.email@example.com"

# Verify configuration
git config --list
```

#### Configure Git Defaults (Recommended)
```bash
# Set default branch name to 'main'
git config --global init.defaultBranch main

# Set default editor (VS Code)
git config --global core.editor "code --wait"

# Enable colored output
git config --global color.ui auto

# Set pull behavior to rebase (cleaner history)
git config --global pull.rebase true

# Cache credentials (macOS Keychain)
git config --global credential.helper osxkeychain
```

#### SSH Key Setup (Recommended for GitHub)
```bash
# Generate SSH key (press Enter to accept defaults)
ssh-keygen -t ed25519 -C "your.email@example.com"

# Start SSH agent
eval "$(ssh-agent -s)"

# Add SSH key to agent
ssh-add ~/.ssh/id_ed25519

# Copy public key to clipboard
pbcopy < ~/.ssh/id_ed25519.pub

# Add to GitHub: Settings → SSH and GPG keys → New SSH key
# Paste the key and save

# Test connection
ssh -T git@github.com
# Expected: "Hi username! You've successfully authenticated..."
```

#### Git Aliases (Optional, but useful)
```bash
# Common shortcuts
git config --global alias.st status
git config --global alias.co checkout
git config --global alias.br branch
git config --global alias.ci commit
git config --global alias.lg "log --oneline --graph --decorate"
```

#### Clone Repository via SSH
```bash
# After SSH setup, clone with SSH URL
git clone git@github.com:username/wihy_native_app.git
cd wihy_native_app
```

---

## Project Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd wihy_native
```

### 2. Install Node Dependencies
```bash
npm install
```

### 3. Generate Native iOS Code
```bash
# Run Expo prebuild to generate iOS native code
npx expo prebuild --platform ios

# Or regenerate with clean slate
npx expo prebuild --platform ios --clean
```

### 4. Install iOS Dependencies (CocoaPods)
```bash
cd ios
pod install
cd ..
```

---

## Apple Developer Account Setup

### 1. Create/Login to Apple Developer Account
- Go to [developer.apple.com](https://developer.apple.com)
- Sign in with your Apple ID
- Enroll in the Apple Developer Program ($99/year for App Store distribution)

### 2. Configure Xcode Signing
1. Open `ios/WiHY.xcworkspace` in Xcode
2. Select the project in the navigator
3. Go to "Signing & Capabilities" tab
4. Check "Automatically manage signing"
5. Select your Team from the dropdown
6. Xcode will create provisioning profiles automatically

### 3. Bundle Identifier
The app uses: `com.wihy.app`
- Ensure this identifier is registered in your Apple Developer account
- Go to Certificates, Identifiers & Profiles → Identifiers → Add

---

## HealthKit Configuration

WiHY uses Apple HealthKit for health data integration. This requires additional setup:

### 1. Enable HealthKit Capability
In Xcode:
1. Select project → Signing & Capabilities
2. Click "+ Capability"
3. Add "HealthKit"
4. Enable "Background Delivery" if needed

### 2. Required Entitlements
The following are configured in `app.json` and should be in your entitlements file:
```xml
<key>com.apple.developer.healthkit</key>
<true/>
<key>com.apple.developer.healthkit.background-delivery</key>
<true/>
```

### 3. Privacy Descriptions (Info.plist)
These are already configured in `app.json`:
- `NSHealthShareUsageDescription` - For reading health data
- `NSHealthUpdateUsageDescription` - For writing health data

---

## Building the App

### Development Build (Simulator)
```bash
# Start Metro bundler in one terminal
npm start

# In another terminal, run iOS
npm run ios

# Or specify a simulator
npx expo run:ios --device "iPhone 15 Pro"
```

### Development Build (Physical Device)
```bash
# Connect your iPhone via USB
# Trust the computer on your device

npx expo run:ios --device
```

### Using EAS Build (Recommended for Distribution)
```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Build for development (device testing)
eas build --platform ios --profile development

# Build for preview (TestFlight internal)
eas build --platform ios --profile preview

# Build for production (App Store)
eas build --platform ios --profile production
```

### Local EAS Build (on Mac)
```bash
# Build locally for development
eas build --platform ios --profile development --local

# This creates an .ipa or .app file in the current directory
```

---

## Running on Simulator

### List Available Simulators
```bash
xcrun simctl list devices available
```

### Run on Specific Simulator
```bash
# Run on iPhone 15 Pro
npx expo run:ios --device "iPhone 15 Pro"

# Run on iPad
npx expo run:ios --device "iPad Pro (12.9-inch)"
```

### Start Simulator Manually
```bash
open -a Simulator
```

---

## Running on Physical Device

### Requirements
1. Apple Developer account (free for development, paid for distribution)
2. Device registered in your Apple Developer account
3. Valid provisioning profile

### Steps
1. Connect iPhone/iPad via USB
2. Trust the computer on your device (Settings → General → Device Management)
3. In Xcode, select your device from the device dropdown
4. Build and run

### Wireless Debugging
1. Connect device via USB first
2. In Xcode: Window → Devices and Simulators
3. Check "Connect via network" for your device
4. Disconnect USB, device should stay connected

---

## Troubleshooting

### Common Issues

#### 1. Pod Install Fails
```bash
# Clear CocoaPods cache
cd ios
pod cache clean --all
rm -rf Pods Podfile.lock
pod install --repo-update
cd ..
```

#### 2. Build Errors After Updating
```bash
# Clean and rebuild
cd ios
xcodebuild clean
cd ..
npx expo prebuild --platform ios --clean
cd ios
pod install
cd ..
```

#### 3. Code Signing Issues
- Ensure you're logged into Xcode with your Apple ID
- Check that automatic signing is enabled
- Verify bundle identifier matches your App ID

#### 4. HealthKit Not Working on Simulator
HealthKit has limited functionality on simulator. Test on a real device for full health data integration.

#### 5. Metro Bundler Port in Use
```bash
# Kill process on port 8081
lsof -ti:8081 | xargs kill -9

# Or use a different port
npx expo start --port 8082
```

#### 6. "No bundle URL present"
```bash
# Reset Metro cache
npm start -- --reset-cache
```

---

## App Store Submission Checklist

### Pre-Submission Requirements
- [ ] App tested on multiple device sizes (iPhone SE, iPhone 15, iPad)
- [ ] App icons generated for all required sizes (1024x1024 master)
- [ ] Launch screen/splash screen configured
- [ ] All required privacy descriptions in Info.plist
- [ ] No crashes or critical bugs
- [ ] Performance optimized (launch time < 5s)

### App Store Connect Preparation
- [ ] Privacy policy URL hosted and accessible
- [ ] Support URL ready
- [ ] App category selected
- [ ] Age rating questionnaire completed
- [ ] Export compliance answered
- [ ] HealthKit usage reviewed (requires Apple approval)

### Required Screenshots

| Device | Size | Required |
|--------|------|----------|
| iPhone 6.7" | 1290 x 2796 px | ✅ Yes |
| iPhone 6.5" | 1284 x 2778 px | ✅ Yes |
| iPhone 5.5" | 1242 x 2208 px | Optional |
| iPad Pro 12.9" | 2048 x 2732 px | If tablet supported |

### Build for App Store
```bash
# Using EAS (Recommended)
eas build --platform ios --profile production

# Upload to App Store
eas submit --platform ios

# Or Archive in Xcode
# 1. Select "Any iOS Device" as build target
# 2. Product → Archive
# 3. Window → Organizer → Select archive
# 4. Distribute App → App Store Connect → Upload
```

### Submit via App Store Connect
1. Go to [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
2. Click "My Apps" → Select WiHY (or create new app)
3. Fill in **App Information**:
   - Name: WiHY
   - Subtitle: AI-Powered Health Assistant
   - Category: Health & Fitness
   - Content Rights: Original content
4. Add **Screenshots** for each device size
5. Write **Description** (max 4000 characters)
6. Add **Keywords** (max 100 characters, comma-separated)
7. Select **Build** from uploaded builds
8. Complete **App Review Information**
9. Click **Submit for Review**

### App Review Timeline
- Standard review: 24-48 hours
- Expedited review: Request via App Store Connect if urgent

---

## TestFlight Distribution

### Internal Testing (Up to 100 testers)
```bash
# Build for internal testing
eas build --platform ios --profile preview

# Or in Xcode: Archive → Distribute → TestFlight Internal Only
```

1. Archive uploaded automatically appears in TestFlight
2. No review required for internal testers
3. Add testers via App Store Connect → TestFlight → Internal Testing

### External Testing (Up to 10,000 testers)
1. Build requires Beta App Review (24-48 hours)
2. Create public link or add testers by email
3. Go to App Store Connect → TestFlight → External Testing
4. Add build → Submit for Review

### TestFlight Best Practices
- Include "What to Test" notes with each build
- Use Groups to organize different tester types
- Monitor crash reports in App Store Connect
- Collect feedback via TestFlight's built-in system

---

## Environment Variables

Create a `.env.local` file with required variables:
```env
WIHY_NATIVE_2025_CLIENT_ID=your_client_id_here
# Add other environment variables as needed
```

---

## Useful Commands Reference

```bash
# Start development server
npm start

# Run iOS (simulator)
npm run ios

# Run iOS (specific device)
npx expo run:ios --device "iPhone 15 Pro"

# Clean build
cd ios && xcodebuild clean && cd ..

# Reinstall pods
cd ios && rm -rf Pods Podfile.lock && pod install && cd ..

# Regenerate native code
npx expo prebuild --platform ios --clean

# EAS build
eas build --platform ios --profile development

# Check EAS build status
eas build:list

# Open in Xcode
open ios/WiHY.xcworkspace
```

---

## Additional Resources

- [Expo iOS Development](https://docs.expo.dev/workflow/ios-simulator/)
- [React Native iOS Setup](https://reactnative.dev/docs/environment-setup)
- [Apple Developer Documentation](https://developer.apple.com/documentation/)
- [HealthKit Documentation](https://developer.apple.com/documentation/healthkit)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
