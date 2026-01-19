# Resize Android app icons to be 20% smaller (scale to 80%)
# This adds padding around the icon to make it appear 20% smaller

$basePath = "c:\repo\wihy_ui_clean\mobile\android\app\src\main\res"
$scale = 0.8  # 80% size (20% smaller)

# Check if ImageMagick is available
$magickPath = "magick"
if (-not (Get-Command $magickPath -ErrorAction SilentlyContinue)) {
    Write-Host "❌ ImageMagick is not installed. Please install it first:"
    Write-Host "   winget install ImageMagick.ImageMagick"
    Write-Host "   or download from: https://imagemagick.org/script/download.php"
    exit 1
}

Write-Host "🔍 Resizing app icons to 80% (20% smaller)..."

# Process all mipmap directories
$mipmapDirs = @(
    "mipmap-ldpi",
    "mipmap-mdpi", 
    "mipmap-hdpi",
    "mipmap-xhdpi",
    "mipmap-xxhdpi",
    "mipmap-xxxhdpi"
)

foreach ($dir in $mipmapDirs) {
    $fullPath = Join-Path $basePath $dir
    
    if (Test-Path $fullPath) {
        Write-Host "`n📁 Processing $dir..."
        
        # Process ic_launcher.png and ic_launcher_round.png
        $icons = @("ic_launcher.png", "ic_launcher_round.png", "ic_launcher_foreground.png")
        
        foreach ($icon in $icons) {
            $iconPath = Join-Path $fullPath $icon
            
            if (Test-Path $iconPath) {
                Write-Host "  ✏️  Resizing $icon..."
                
                # Create backup
                $backupPath = $iconPath + ".backup"
                if (-not (Test-Path $backupPath)) {
                    Copy-Item $iconPath $backupPath
                }
                
                # Resize: scale to 80% and center on transparent canvas
                & $magickPath $iconPath -resize "$($scale*100)%" -gravity center -background none -extent "$(& $magickPath identify -format '%w' $iconPath)x$(& $magickPath identify -format '%h' $iconPath)" $iconPath
                
                Write-Host "  ✅ Done: $icon"
            }
        }
    }
}

Write-Host "`n✅ All icons resized! Icons are now 20% smaller with proper padding."
Write-Host "📦 Rebuild the APK to see changes."
Write-Host "`n💾 Original icons backed up with .backup extension"
