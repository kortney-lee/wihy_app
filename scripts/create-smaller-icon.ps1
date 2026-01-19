# Create a smaller version of the WIHY icon with more padding
# This creates a 1024x1024 icon with the logo scaled to 60% (more white space)

Write-Host "Creating smaller WIHY app icon..." -ForegroundColor Cyan

$sourcePath = "c:\repo\wihy_ui_clean\client\public\assets\wihyfaviconandriod.png"
$outputPath = "c:\repo\wihy_ui_clean\mobile\resources\icon.png"

# Check if ImageMagick is installed
$magickPath = Get-Command magick -ErrorAction SilentlyContinue

if ($magickPath) {
    Write-Host "Using ImageMagick to create icon..." -ForegroundColor Yellow
    
    # Create 1024x1024 icon with logo at 60% size (more padding)
    magick $sourcePath -resize 614x614 -gravity center -background white -extent 1024x1024 $outputPath
    
    Write-Host "Icon created successfully!" -ForegroundColor Green
} else {
    Write-Host "ImageMagick not found. Creating icon with built-in tools..." -ForegroundColor Yellow
    
    # Load .NET assemblies
    Add-Type -AssemblyName System.Drawing
    
    # Load source image
    $sourceImage = [System.Drawing.Image]::FromFile($sourcePath)
    
    # Create new 1024x1024 bitmap with white background
    $newImage = New-Object System.Drawing.Bitmap(1024, 1024)
    $graphics = [System.Drawing.Graphics]::FromImage($newImage)
    
    # Fill with white background
    $graphics.Clear([System.Drawing.Color]::White)
    
    # Set high quality rendering
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    
    # Calculate centered position for 60% size (614x614)
    $logoSize = 614
    $x = (1024 - $logoSize) / 2
    $y = (1024 - $logoSize) / 2
    
    # Draw the resized image centered
    $destRect = New-Object System.Drawing.Rectangle($x, $y, $logoSize, $logoSize)
    $graphics.DrawImage($sourceImage, $destRect, 0, 0, $sourceImage.Width, $sourceImage.Height, [System.Drawing.GraphicsUnit]::Pixel)
    
    # Save the new image
    $newImage.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    
    # Clean up
    $graphics.Dispose()
    $newImage.Dispose()
    $sourceImage.Dispose()
    
    Write-Host "Icon created successfully with .NET!" -ForegroundColor Green
}

Write-Host ""
Write-Host "Output: $outputPath" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Generate Android icons: cd mobile; npx capacitor-assets generate --android"
Write-Host "2. Sync and build: npx cap sync android"
Write-Host "3. Build APK: gradlew assembleDebug"
Write-Host ""
