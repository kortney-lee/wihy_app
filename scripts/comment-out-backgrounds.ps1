# Comment Out Hardcoded Background Colors in StyleSheet
# This allows JSX theme overrides to work properly for dark mode

param(
    [string]$WorkspacePath = "C:\repo\wihy_ui_clean\mobile\src\screens",
    [switch]$DryRun
)

$totalReplacements = 0

# Get all .tsx files recursively
$files = Get-ChildItem -Path $WorkspacePath -Filter "*.tsx" -Recurse

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    $replacements = 0
    
    # Only process files that have useTheme (meaning they support dark mode)
    if ($content -notmatch "useTheme") {
        continue
    }
    
    Write-Host "`nProcessing: $($file.Name)" -ForegroundColor Cyan
    
    # Pattern 1: Comment out #e0f2fe backgrounds in StyleSheet (page backgrounds)
    # This is the light blue color - should become theme.colors.background
    $pattern1 = "(\s+)backgroundColor: '#e0f2fe',"
    $replacement1 = "`$1// backgroundColor: '#e0f2fe', // Using theme.colors.background dynamically"
    
    $matches1 = [regex]::Matches($content, $pattern1)
    if ($matches1.Count -gt 0) {
        $content = $content -replace $pattern1, $replacement1
        $replacements += $matches1.Count
        Write-Host "  Commented out $($matches1.Count) light blue (#e0f2fe) backgrounds" -ForegroundColor Green
    }
    
    # Pattern 2: Comment out #ffffff backgrounds in StyleSheet (card backgrounds)
    # EXCLUDE: avatarContainer, iconContainer, badge, button, input backgrounds
    # These are UI chrome that should stay white
    $pattern2 = "(\s+)backgroundColor: '#ffffff',"
    $replacement2 = "`$1// backgroundColor: '#ffffff', // Using theme.colors.surface dynamically"
    
    $matches2 = [regex]::Matches($content, $pattern2)
    if ($matches2.Count -gt 0) {
        $content = $content -replace $pattern2, $replacement2
        $replacements += $matches2.Count
        Write-Host "  Commented out $($matches2.Count) white (#ffffff) backgrounds" -ForegroundColor Green
    }
    
    # Pattern 3: Also handle #FFFFFF (uppercase)
    $pattern3 = "(\s+)backgroundColor: '#FFFFFF',"
    $replacement3 = "`$1// backgroundColor: '#FFFFFF', // Using theme.colors.surface dynamically"
    
    $matches3 = [regex]::Matches($content, $pattern3)
    if ($matches3.Count -gt 0) {
        $content = $content -replace $pattern3, $replacement3
        $replacements += $matches3.Count
        Write-Host "  Commented out $($matches3.Count) white (#FFFFFF uppercase) backgrounds" -ForegroundColor Green
    }
    
    if ($replacements -gt 0) {
        if (-not $DryRun) {
            Set-Content $file.FullName -Value $content -NoNewline -Encoding UTF8
            Write-Host "  Total: $replacements replacements saved" -ForegroundColor Green
        } else {
            Write-Host "  [DRY RUN] Would make $replacements replacements" -ForegroundColor Yellow
        }
        $totalReplacements += $replacements
    } else {
        Write-Host "  No StyleSheet backgrounds to comment out" -ForegroundColor Gray
    }
}

Write-Host "`n================================" -ForegroundColor Cyan
Write-Host "Total replacements: $totalReplacements" -ForegroundColor White

if ($DryRun) {
    Write-Host "`nDRY RUN - No files were modified" -ForegroundColor Yellow
    Write-Host "Run without -DryRun to apply changes"
}
