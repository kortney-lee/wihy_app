# Resize icon images to 80% using .NET System.Drawing
$iconFiles = @(
    "mobile\android\app\src\main\res\mipmap-ldpi\ic_launcher.png",
    "mobile\android\app\src\main\res\mipmap-ldpi\ic_launcher_round.png",
    "mobile\android\app\src\main\res\mipmap-ldpi\ic_launcher_foreground.png",
    "mobile\android\app\src\main\res\mipmap-mdpi\ic_launcher.png",
    "mobile\android\app\src\main\res\mipmap-mdpi\ic_launcher_round.png",
    "mobile\android\app\src\main\res\mipmap-mdpi\ic_launcher_foreground.png",
    "mobile\android\app\src\main\res\mipmap-hdpi\ic_launcher.png",
    "mobile\android\app\src\main\res\mipmap-hdpi\ic_launcher_round.png",
    "mobile\android\app\src\main\res\mipmap-hdpi\ic_launcher_foreground.png",
    "mobile\android\app\src\main\res\mipmap-xhdpi\ic_launcher.png",
    "mobile\android\app\src\main\res\mipmap-xhdpi\ic_launcher_round.png",
    "mobile\android\app\src\main\res\mipmap-xhdpi\ic_launcher_foreground.png",
    "mobile\android\app\src\main\res\mipmap-xxhdpi\ic_launcher.png",
    "mobile\android\app\src\main\res\mipmap-xxhdpi\ic_launcher_round.png",
    "mobile\android\app\src\main\res\mipmap-xxhdpi\ic_launcher_foreground.png",
    "mobile\android\app\src\main\res\mipmap-xxxhdpi\ic_launcher.png",
    "mobile\android\app\src\main\res\mipmap-xxxhdpi\ic_launcher_round.png",
    "mobile\android\app\src\main\res\mipmap-xxxhdpi\ic_launcher_foreground.png"
)

Add-Type -AssemblyName System.Drawing

$scaleFactor = 0.8

foreach ($file in $iconFiles) {
    $fullPath = Join-Path $PSScriptRoot $file
    
    if (Test-Path $fullPath) {
        Write-Host "Processing: $file"
        
        # Load the image
        $img = [System.Drawing.Image]::FromFile($fullPath)
        $originalWidth = $img.Width
        $originalHeight = $img.Height
        
        # Calculate new dimensions
        $newWidth = [int]($originalWidth * $scaleFactor)
        $newHeight = [int]($originalHeight * $scaleFactor)
        
        # Create new bitmap with transparent background
        $newImg = New-Object System.Drawing.Bitmap($originalWidth, $originalHeight)
        $graphics = [System.Drawing.Graphics]::FromImage($newImg)
        $graphics.Clear([System.Drawing.Color]::Transparent)
        $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        
        # Center the resized image
        $x = [int](($originalWidth - $newWidth) / 2)
        $y = [int](($originalHeight - $newHeight) / 2)
        
        # Draw resized image centered
        $graphics.DrawImage($img, $x, $y, $newWidth, $newHeight)
        
        # Dispose original image
        $img.Dispose()
        $graphics.Dispose()
        
        # Save the new image
        $newImg.Save($fullPath, [System.Drawing.Imaging.ImageFormat]::Png)
        $newImg.Dispose()
        
        Write-Host "  Resized from ${originalWidth}x${originalHeight} to ${newWidth}x${newHeight} (centered in ${originalWidth}x${originalHeight})" -ForegroundColor Green
    } else {
        Write-Host "  File not found: $fullPath" -ForegroundColor Yellow
    }
}

Write-Host "`nAll icons resized to 80% and centered!" -ForegroundColor Green
