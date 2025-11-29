# View Real-Time Logs from Android Device
# Shows app logs, errors, and performance metrics

Write-Host "📊 WiHY - Device Logs" -ForegroundColor Cyan
Write-Host ""
Write-Host "Filtering for: WIHY, Capacitor, Camera, and Errors" -ForegroundColor Yellow
Write-Host "Press Ctrl+C to stop" -ForegroundColor Gray
Write-Host ""

# Clear old logs first
adb logcat -c

# Stream filtered logs
adb logcat | Select-String -Pattern "WIHY|Capacitor|Camera|ERROR|AndroidRuntime" -CaseSensitive:$false
