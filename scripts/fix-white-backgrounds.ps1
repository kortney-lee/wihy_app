# Script to comment out all white backgrounds in StyleSheet.create() sections
# This prepares styles to use theme.colors.surface dynamically

$files = Get-ChildItem -Path "c:\repo\wihy_ui_clean\mobile\src" -Filter "*.tsx" -Recurse

$patterns = @(
    @{ Old = "    backgroundColor: '#ffffff',"; New = "    // backgroundColor: '#ffffff', // Now using theme.colors.surface dynamically" },
    @{ Old = "    backgroundColor: '#fff',"; New = "    // backgroundColor: '#fff', // Now using theme.colors.surface dynamically" },
    @{ Old = "    backgroundColor: '#FFFFFF',"; New = "    // backgroundColor: '#FFFFFF', // Now using theme.colors.surface dynamically" }
)

$totalFiles = 0
$totalReplacements = 0

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    $fileReplacements = 0
    
    foreach ($pattern in $patterns) {
        $matches = [regex]::Matches($content, [regex]::Escape($pattern.Old))
        if ($matches.Count -gt 0) {
            $content = $content.Replace($pattern.Old, $pattern.New)
            $fileReplacements += $matches.Count
        }
    }
    
    if ($fileReplacements -gt 0) {
        Set-Content $file.FullName -Value $content -NoNewline
        Write-Host "Updated $($file.Name): $fileReplacements replacements" -ForegroundColor Green
        $totalFiles++
        $totalReplacements += $fileReplacements
    }
}

Write-Host "`nTotal: Updated $totalFiles files with $totalReplacements replacements" -ForegroundColor Cyan
Write-Host "`nNOTE: This script only commented out the static backgroundColor values."
Write-Host "You still need to add { backgroundColor: theme.colors.surface } to the JSX where these styles are used."
