# Mobile API Testing Guide

## 🚨 Problem: API calls not working on mobile browsers

### Root Cause
Mobile browsers cannot access `localhost:8000` because localhost refers to the mobile device itself, not your development machine.

## ✅ Solutions Implemented

### 1. **Dynamic API Configuration** 
The app now automatically detects mobile browsers and uses your development machine's IP address instead of localhost.

### 2. **Environment Variable Override**
You can explicitly set the API URL using an environment variable.

## 📱 **Mobile Testing Setup**

### Step 1: Find Your Development Machine's IP Address

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

### Step 2: Set Environment Variable

Create `client/.env.local` file:
```env
REACT_APP_WIHY_API_URL=http://YOUR_IP_ADDRESS:8000
```

**Example:**
```env
REACT_APP_WIHY_API_URL=http://192.168.1.100:8000
```

### Step 3: Start Both Services

**Terminal 1 - Start API Server:**
```bash
# Make sure your API server is running on port 8000
# and accessible from your network (not just localhost)
```

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

## 🔍 **Debugging Mobile API Issues**

### Check Browser Console

Open browser dev tools on your mobile device and look for:
```
🔍 API CONFIG DEBUG: {
  DETECTION_REASON: "MOBILE_OR_REMOTE",
  FINAL_URL: "http://192.168.1.100:8000",
  IS_MOBILE: true,
  HOSTNAME: "192.168.1.100"
}
```

### Common Issues & Solutions

1. **"Failed to fetch" Error**
   - ✅ Check if API server is running on port 8000
   - ✅ Verify IP address is correct
   - ✅ Ensure firewall allows connections on port 8000

2. **CORS Errors**
   - ✅ API server needs to allow requests from your IP
   - ✅ Check server CORS configuration

3. **Network Timeout**
   - ✅ Both devices must be on same WiFi network
   - ✅ Corporate networks may block cross-device communication

## 🖥️ **Desktop Development**

For desktop development, the app still uses `localhost:8000` automatically. No changes needed.

## 🌐 **Production Deployment**

For production, set the environment variable to your deployed API:
```env
REACT_APP_WIHY_API_URL=https://your-api-domain.com
```

## 📋 **Testing Checklist**

- [ ] API server running on port 8000
- [ ] Can access API from development machine: `http://localhost:8000`
- [ ] Found development machine IP address
- [ ] Set `REACT_APP_WIHY_API_URL` in `.env.local`
- [ ] React app accessible from mobile: `http://YOUR_IP:3000`
- [ ] Check browser console for API config debug info
- [ ] Test API call from mobile browser
- [ ] Both devices on same network
- [ ] Firewall allows port 8000 connections

## 🔧 **Automatic Features**

The app now automatically:
- ✅ Detects mobile browsers
- ✅ Uses current hostname instead of localhost when appropriate
- ✅ Provides detailed debug logging
- ✅ Falls back gracefully for different environments
- ✅ Supports explicit environment variable override