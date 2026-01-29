# Find files that have commented out white backgrounds but may not have dynamic theme.colors.surface in JSX

$mobileDir = "c:\repo\wihy_ui_clean\mobile\src"
$files = Get-ChildItem -Path $mobileDir -Filter "*.tsx" -Recurse

$needsUpdate = @()
$fullyUpdated = @()

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    
    # Check if file has commented out backgrounds
    $hasCommentedBg = $content -match "// backgroundColor: '#fff|// backgroundColor: '#FFF"
    
    if ($hasCommentedBg) {
        # Check if it has dynamic theme backgrounds in JSX
        $hasDynamicBg = $content -match "backgroundColor: theme\.colors\.surface"
        
        $fileInfo = @{
            Name = $file.Name
            Path = $file.FullName.Replace("c:\repo\wihy_ui_clean\mobile\src\", "")
            HasDynamicBackground = $hasDynamicBg
        }
        
        if ($hasDynamicBg) {
            $fullyUpdated += $fileInfo
        } else {
            $needsUpdate += $fileInfo
        }
    }
}

Write-Host "`n=== FILES THAT NEED JSX UPDATES ===" -ForegroundColor Yellow
Write-Host "These files have commented out white backgrounds but no dynamic theme.colors.surface in JSX`n" -ForegroundColor Gray

$needsUpdate | Sort-Object Path | ForEach-Object {
    $priority = if ($_.Path -match "screens") { "HIGH" } 
                elseif ($_.Path -match "components") { "MED" }
                else { "LOW" }
    Write-Host "[$priority] $($_.Path)" -ForegroundColor $(if ($priority -eq "HIGH") { "Red" } else { "Yellow" })
}

Write-Host "`n=== FILES FULLY UPDATED ===" -ForegroundColor Green
Write-Host "These files have both commented backgrounds and dynamic JSX updates`n" -ForegroundColor Gray

$fullyUpdated | Sort-Object Path | ForEach-Object {
    Write-Host "✅ $($_.Path)" -ForegroundColor Green
}

Write-Host "`n=== SUMMARY ===" -ForegroundColor Cyan
Write-Host "Needs JSX Updates: $($needsUpdate.Count)" -ForegroundColor Yellow
Write-Host "Fully Updated: $($fullyUpdated.Count)" -ForegroundColor Green
Write-Host "Total: $($needsUpdate.Count + $fullyUpdated.Count)" -ForegroundColor Cyan
