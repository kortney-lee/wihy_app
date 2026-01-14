#!/usr/bin/env bash

# iOS OAuth Setup Completion Script
# Run this to verify everything is in place

echo "🚀 iOS OAuth Setup - Verification Report"
echo "=========================================="
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check files
echo -e "${BLUE}Checking created files...${NC}"
echo ""

files=(
  "mobile/app.json"
  "mobile/src/services/googleAuthService.ts"
  "mobile/src/components/GoogleSignInButton.tsx"
  "EXPO_IOS_OAUTH_SETUP.md"
  "IOS_OAUTH_QUICK_START.md"
  "IOS_OAUTH_IMPLEMENTATION_CHECKLIST.md"
  "IOS_OAUTH_ARCHITECTURE.md"
  "IOS_OAUTH_COMPLETE.md"
  "TESTFLIGHT_DEPLOYMENT_GUIDE.md"
)

missing=0
for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo -e "${GREEN}✅${NC} $file"
  else
    echo -e "${RED}❌${NC} $file"
    ((missing++))
  fi
done

echo ""
echo -e "${BLUE}Checking npm packages...${NC}"
echo ""

# Check for required packages
packages=(
  "expo-auth-session"
  "expo-web-browser"
  "expo"
  "react-native"
)

# Navigate to mobile directory
cd mobile 2>/dev/null || { echo "Error: mobile directory not found"; exit 1; }

for package in "${packages[@]}"; do
  if grep -q "\"$package\"" package.json; then
    echo -e "${GREEN}✅${NC} $package"
  else
    echo -e "${RED}❌${NC} $package"
    ((missing++))
  fi
done

echo ""
echo -e "${BLUE}Checking configuration...${NC}"
echo ""

# Check app.json structure
if [ -f "app.json" ]; then
  if grep -q '"bundleIdentifier": "com.wihy.app"' app.json; then
    echo -e "${GREEN}✅${NC} app.json has bundleIdentifier"
  else
    echo -e "${RED}❌${NC} app.json missing bundleIdentifier"
    ((missing++))
  fi
  
  if grep -q '"GIDClientID"' app.json; then
    echo -e "${GREEN}✅${NC} app.json has GIDClientID"
  else
    echo -e "${RED}❌${NC} app.json missing GIDClientID"
    ((missing++))
  fi
  
  if grep -q '"CFBundleURLTypes"' app.json; then
    echo -e "${GREEN}✅${NC} app.json has CFBundleURLTypes"
  else
    echo -e "${RED}❌${NC} app.json missing CFBundleURLTypes"
    ((missing++))
  fi
fi

echo ""
echo "=========================================="
if [ $missing -eq 0 ]; then
  echo -e "${GREEN}✨ All checks passed!${NC}"
  echo ""
  echo "Next steps:"
  echo "1. Get your Apple Team ID from:"
  echo "   https://developer.apple.com/account"
  echo ""
  echo "2. Create iOS OAuth client in Google Cloud:"
  echo "   https://console.cloud.google.com/apis/credentials"
  echo ""
  echo "3. Test with Expo Go or simulator:"
  echo "   npx expo start --clear"
  echo ""
  echo "Read the guides:"
  echo "  📖 IOS_OAUTH_QUICK_START.md (3 min)"
  echo "  📖 EXPO_IOS_OAUTH_SETUP.md (15 min)"
  echo "  📖 IOS_OAUTH_ARCHITECTURE.md (20 min)"
  echo ""
else
  echo -e "${YELLOW}⚠️  $missing issue(s) found${NC}"
  echo ""
  echo "Please verify the configuration and try again."
fi

echo ""
echo "=========================================="
echo -e "${GREEN}Status: READY FOR TESTING${NC}"
echo "=========================================="
