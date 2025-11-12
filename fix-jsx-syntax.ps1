# PowerShell script to fix broken AnalyzeWithWihyButton JSX syntax
Write-Host "Fixing AnalyzeWithWihyButton JSX syntax issues..." -ForegroundColor Green

# Get all .tsx files that have broken AnalyzeWithWihyButton syntax
$chartFiles = Get-ChildItem -Path "client\src\components\charts" -Recurse -Filter "*.tsx"

foreach ($file in $chartFiles) {
    $content = Get-Content $file.FullName -Raw
    $updated = $false
    
    # Fix pattern where onAnalyze prop was incorrectly inserted
    if ($content -match "onAnalyze={onAnalyze}>") {
        Write-Host "Processing $($file.Name) - fixing broken JSX..." -ForegroundColor Cyan
        
        # Fix cases where the tag is broken like "/ onAnalyze={onAnalyze}>"
        $content = $content -replace "/\s*onAnalyze={onAnalyze}>", "onAnalyze={onAnalyze} />"
        
        # Fix cases where onAnalyze appears after the closing />
        $content = $content -replace "/>\s*onAnalyze={onAnalyze}>", "onAnalyze={onAnalyze} />"
        
        # Fix cases where onAnalyze appears without proper closure
        $content = $content -replace "onAnalyze={onAnalyze}>\s*([^<])", "onAnalyze={onAnalyze} />`n`$1"
        
        $updated = $true
    }
    
    if ($updated) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "  - Fixed JSX syntax" -ForegroundColor Green
    }
}

Write-Host "JSX syntax fixes completed!" -ForegroundColor Green