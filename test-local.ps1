# WIHY UI - Local Docker Testing Script
# Test your container locally before deploying to Azure

Write-Host "🐳 WIHY UI - Local Container Testing" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Green

$ImageName = "wihy-ui:local"
$Port = "8080"

try {
    # Step 1: Build the container
    Write-Host "🔨 Step 1: Building Docker container..." -ForegroundColor Cyan
    docker build -t $ImageName .
    
    if ($LASTEXITCODE -ne 0) {
        throw "Docker build failed"
    }
    
    Write-Host "   ✅ Container built successfully!" -ForegroundColor Green
    
    # Step 2: Run the container
    Write-Host "🚀 Step 2: Starting container on port $Port..." -ForegroundColor Cyan
    
    # Stop any existing container
    docker stop wihy-ui-test 2>$null
    docker rm wihy-ui-test 2>$null
    
    # Run new container
    docker run -d --name wihy-ui-test -p "${Port}:80" $ImageName
    
    if ($LASTEXITCODE -ne 0) {
        throw "Docker run failed"
    }
    
    # Wait a moment for container to start
    Start-Sleep -Seconds 3
    
    # Step 3: Test the application
    Write-Host "🔍 Step 3: Testing application..." -ForegroundColor Cyan
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:$Port/health" -UseBasicParsing -TimeoutSec 10
        if ($response.StatusCode -eq 200) {
            Write-Host "   ✅ Health check passed!" -ForegroundColor Green
        } else {
            Write-Host "   ⚠️ Health check returned status: $($response.StatusCode)" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "   ⚠️ Health check failed, but container might still be starting..." -ForegroundColor Yellow
    }
    
    # Step 4: Show results
    Write-Host ""
    Write-Host "✅ SUCCESS! Your container is running locally:" -ForegroundColor Green
    Write-Host "   🌐 App URL: http://localhost:$Port" -ForegroundColor White
    Write-Host "   🔍 Health Check: http://localhost:$Port/health" -ForegroundColor White
    Write-Host ""
    Write-Host "🔧 Container Commands:" -ForegroundColor Yellow
    Write-Host "   View logs: docker logs wihy-ui-test"
    Write-Host "   Stop container: docker stop wihy-ui-test"
    Write-Host "   Remove container: docker rm wihy-ui-test"
    Write-Host "   View running containers: docker ps"
    Write-Host ""
    Write-Host "🚀 Ready to deploy to Azure?" -ForegroundColor Magenta
    Write-Host "   Run: .\deploy-azure.ps1" -ForegroundColor White
    Write-Host ""
    
    # Open the app in browser
    Write-Host "🌐 Opening app in browser..." -ForegroundColor Cyan
    Start-Sleep -Seconds 2
    Start-Process "http://localhost:$Port"
    
} catch {
    Write-Host "❌ Error during local testing: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "🔧 Troubleshooting:" -ForegroundColor Yellow
    Write-Host "   1. Make sure Docker Desktop is running"
    Write-Host "   2. Check if port $Port is already in use"
    Write-Host "   3. Try: docker ps -a (to see all containers)"
    Write-Host "   4. Try: docker logs wihy-ui-test (to see container logs)"
    exit 1
}