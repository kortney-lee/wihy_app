# iOS Safari Debugging on Windows

## Prerequisites
- Windows 10/11
- Node.js installed
- Chrome or Edge browser
- iPhone with USB cable

## Setup Steps

### 1. Enable Web Inspector on iPhone
1. Connect iPhone to PC via USB
2. On iPhone: **Settings → Safari → Advanced → Web Inspector → ON**
3. Tap **Trust** when "Trust this computer?" popup appears

### 2. Install Scoop Package Manager (if not already installed)
Open PowerShell as Administrator:

```powershell
# Set execution policy
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser

# Install Scoop
Invoke-Expression (New-Object System.Net.WebClient).DownloadString('https://get.scoop.sh')

# Add extras bucket
scoop bucket add extras
```

### 3. Install ios-webkit-debug-proxy
```powershell
scoop install ios-webkit-debug-proxy
```

Verify installation:
```powershell
ios_webkit_debug_proxy --help
```

### 4. Install RemoteDebug iOS WebKit Adapter
```powershell
npm install -g remotedebug-ios-webkit-adapter
```

### 5. Start the Debug Adapter
With iPhone plugged in:
```powershell
remotedebug_ios_webkit_adapter --port=9000
```

**Keep this terminal running!** You should see "Connected to ios_webkit_debug_proxy" when Safari is open on the phone.

### 6. Configure Chrome/Edge DevTools
1. Open Chrome or Edge
2. Navigate to: `chrome://inspect/#devices`
3. Click **Configure…** next to "Discover network targets"
4. Add: `localhost:9000`
5. Click **Done**

### 7. Debug wihy.ai
1. On iPhone: Open Safari → navigate to `https://wihy.ai`
2. Reproduce the issue (scan barcode → navigate to NutritionFacts)
3. On PC: In `chrome://inspect/#devices`, look for **Remote Target**
4. Click **Inspect** on the Safari tab entry
5. Full DevTools will open for the iPhone Safari tab!

## What to Check in DevTools
- **Console**: Look for any JavaScript errors (red messages)
- **Network**: Check if any requests are failing (status codes, missing resources)
- **Sources**: Set breakpoints in React code to debug navigation
- **Elements**: Check if content is rendered but positioned off-screen

## Common Issues

### "No devices found"
- Ensure iPhone is unlocked
- Check USB cable connection
- Verify "Trust this computer" was accepted
- Restart `remotedebug_ios_webkit_adapter`

### "Cannot connect to proxy"
- Make sure `ios_webkit_debug_proxy` is installed correctly
- Try restarting the adapter
- Check if port 9000 is already in use

### Safari tab not appearing
- Open Safari on iPhone first
- Navigate to any webpage (https://wihy.ai)
- Wait a few seconds for the adapter to detect it

## Alternative: Mac Setup (if available)
If you have access to a Mac:
1. Enable Web Inspector on iPhone (same as above)
2. Connect iPhone to Mac via USB
3. On Mac: Open Safari → **Develop** menu → Select your iPhone → Select wihy.ai tab
4. Safari Web Inspector opens directly (no extra tools needed)

## Debugging the NutritionFacts White Screen Issue
Once DevTools is connected:
1. Navigate through the app to trigger the white screen
2. In Console, look for:
   - React errors about missing state
   - Navigation warnings
   - Any `undefined` or `null` errors
3. In Network tab, check:
   - API calls to `/api/scan` or nutrition endpoints
   - Failed CSS/JS loads
   - CORS errors
4. In Elements tab:
   - Search for `NutritionFactsPage` component
   - Check if it rendered but is hidden (z-index, opacity, transform issues)

## Useful Commands

### Start debugging session:
```powershell
# Terminal 1: Start adapter
remotedebug_ios_webkit_adapter --port=9000

# Terminal 2: Your dev server (if needed)
npm start
```

### Stop debugging:
- Press `Ctrl+C` in the adapter terminal
- Close Chrome DevTools

## Resources
- [ios-webkit-debug-proxy GitHub](https://github.com/google/ios-webkit-debug-proxy)
- [RemoteDebug iOS Adapter](https://github.com/RemoteDebug/remotedebug-ios-webkit-adapter)
