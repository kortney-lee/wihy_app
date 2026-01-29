# Comment Out Hardcoded Text Colors in StyleSheet Files
# This script comments out static color values so JSX can override with theme colors

param(
    [string[]]$Files = @(
        "mobile\src\screens\fitness\FitnessDashboardStyles.ts"
    ),
    [switch]$DryRun
)

$totalReplacements = 0

foreach ($file in $Files) {
    $filePath = Join-Path "C:\repo\wihy_ui_clean" $file
    
    if (-not (Test-Path $filePath)) {
        Write-Host "File not found: $filePath" -ForegroundColor Yellow
        continue
    }
    
    Write-Host "`nProcessing: $file" -ForegroundColor Cyan
    
    $content = Get-Content $filePath -Raw
    $originalContent = $content
    $replacements = 0
    
    # Comment out hardcoded text colors (but not #ffffff which might be needed for headers)
    # Pattern: color: '#1f2937',  -> // color: '#1f2937', // Using theme.colors.text dynamically
    $darkTextColors = @('#1f2937', '#111827', '#374151', '#6b7280', '#9ca3af', '#6B7280')
    
    foreach ($color in $darkTextColors) {
        $pattern = "(\s+)color: '$color',"
        $replacement = "`$1// color: '$color', // Using theme colors dynamically"
        
        $newContent = $content -replace $pattern, $replacement
        $count = ([regex]::Matches($content, $pattern)).Count
        
        if ($count -gt 0) {
            $content = $newContent
            $replacements += $count
            Write-Host "  Commented out $count instances of color: '$color'" -ForegroundColor Green
        }
    }
    
    if ($replacements -gt 0) {
        if (-not $DryRun) {
            Set-Content $filePath -Value $content -NoNewline
            Write-Host "  Total: $replacements replacements" -ForegroundColor Green
        } else {
            Write-Host "  [DRY RUN] Would make $replacements replacements" -ForegroundColor Yellow
        }
        $totalReplacements += $replacements
    } else {
        Write-Host "  No changes needed" -ForegroundColor Gray
    }
}

Write-Host "`n================================" -ForegroundColor Cyan
Write-Host "Total replacements: $totalReplacements" -ForegroundColor White

if ($DryRun) {
    Write-Host "`nDRY RUN - No files were modified" -ForegroundColor Yellow
}
