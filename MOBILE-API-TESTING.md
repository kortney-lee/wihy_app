# Mobile API Testing Guide

##  Problem: API calls not working on mobile browsers

### Root Cause
Mobile browsers cannot access `localhost:8000` because localhost refers to the mobile device itself, not your development machine.

## [OK] Solutions Implemented

### 1. **Production-First Configuration (Recommended)**
By default, all API calls go to production servers:
- Main API: `https://ml.wihy.ai`
- News Service: `https://services.wihy.ai`
- ML Service: `https://vhealth-wihy-ml-api.gentlebush-f35a13de.westus2.azurecontainerapps.io`

### 2. **Development Flag Override**
Use environment variables to enable local development when needed:
- `REACT_APP_USE_LOCAL_API=true` - Use local main API
- `REACT_APP_USE_LOCAL_NEWS=true` - Use local news service
- `REACT_APP_USE_LOCAL_ML=true` - Use local ML service

### 3. **Environment Variable Override**
You can explicitly set API URLs using environment variables.

## [MOBILE] **Mobile Testing Setup**

### Quick Start (Recommended)
By default, mobile devices will use production APIs. No setup needed!

### Development Setup (Advanced)

#### Step 1: Find Your Development Machine's IP Address

**Windows:**
```bash
ipconfig
```
Look for "IPv4 Address" under your active network adapter (usually something like `192.168.1.100`)

**Mac/Linux:**
```bash
ifconfig
```
Look for your network interface (usually `en0` or `eth0`)

#### Step 2: Set Environment Variables

Create `client/.env.local` file:
```env
# Enable local development
REACT_APP_USE_LOCAL_API=true
REACT_APP_USE_LOCAL_NEWS=true
REACT_APP_USE_LOCAL_ML=true

# Set your development machine's IP
REACT_APP_WIHY_API_URL=http://YOUR_IP_ADDRESS:8000
REACT_APP_NEWS_PORT=5001
REACT_APP_WIHY_ML_API_URL=http://YOUR_IP_ADDRESS:8001
```

**Example:**
```env
REACT_APP_USE_LOCAL_API=true
REACT_APP_USE_LOCAL_NEWS=true
REACT_APP_USE_LOCAL_ML=true
REACT_APP_WIHY_API_URL=http://192.168.1.100:8000
REACT_APP_NEWS_PORT=5001
REACT_APP_WIHY_ML_API_URL=http://192.168.1.100:8001
```

### Step 3: Start Development Services (Only if using local flags)

**Terminal 1 - Start API Server:**
```bash
# Make sure your API server is running on port 8000
# and accessible from your network (not just localhost)
```

**Terminal 2 - Start News Service:**
```bash
# Make sure your news service is running on the configured port
# Default: port 5001
```

**Terminal 3 - Start ML Service:**
```bash
# Make sure your ML service is running on the configured port
# Default: port 8001
```

**Terminal 4 - Start React App:**

**Terminal 2 - Start React App:**
```bash
cd client
npm start
```

### Step 4: Access from Mobile

Open your mobile browser and navigate to:
```
http://YOUR_IP_ADDRESS:3000
```

**Example:**
```
http://192.168.1.100:3000
```

## [SEARCH] **Debugging Mobile API Issues**

### Check Browser Console

Open browser dev tools on your mobile device and look for:
```
[SEARCH] API CONFIG DEBUG: {
  DETECTION_REASON: "MOBILE_OR_REMOTE",
  FINAL_URL: "http://192.168.1.100:8000",
  IS_MOBILE: true,
  HOSTNAME: "192.168.1.100"
}
```

### Common Issues & Solutions

1. **"Failed to fetch" Error**
   - [OK] Check if API server is running on port 8000
   - [OK] Verify IP address is correct
   - [OK] Ensure firewall allows connections on port 8000

2. **CORS Errors**
   - [OK] API server needs to allow requests from your IP
   - [OK] Check server CORS configuration

3. **Network Timeout**
   - [OK] Both devices must be on same WiFi network
   - [OK] Corporate networks may block cross-device communication

## [DESKTOP] **Desktop Development**

For desktop development, the app still uses `localhost:8000` automatically. No changes needed.

##  **Production Deployment**

For production, set the environment variable to your deployed API:
```env
REACT_APP_WIHY_API_URL=https://your-api-domain.com
```

## [PAGE] **Testing Checklist**

- [ ] API server running on port 8000
- [ ] Can access API from development machine: `http://localhost:8000`
- [ ] Found development machine IP address
- [ ] Set `REACT_APP_WIHY_API_URL` in `.env.local`
- [ ] React app accessible from mobile: `http://YOUR_IP:3000`
- [ ] Check browser console for API config debug info
- [ ] Test API call from mobile browser
- [ ] Both devices on same network
- [ ] Firewall allows port 8000 connections

## [TOOL] **Automatic Features**

The app now automatically:
- [OK] Detects mobile browsers
- [OK] Uses current hostname instead of localhost when appropriate
- [OK] Provides detailed debug logging
- [OK] Falls back gracefully for different environments
- [OK] Supports explicit environment variable override