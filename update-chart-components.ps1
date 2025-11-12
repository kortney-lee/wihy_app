# PowerShell script to update all chart components to accept onAnalyze prop
Write-Host "Updating chart components to accept onAnalyze prop..." -ForegroundColor Green

# Get all .tsx files that use AnalyzeWithWihyButton
$chartFiles = Get-ChildItem -Path "client\src\components\charts" -Recurse -Filter "*.tsx" | Where-Object {
    $content = Get-Content $_.FullName -Raw
    return $content -match "AnalyzeWithWihyButton" -and $_.Name -ne "AnalyzeWithWihyButton.tsx"
}

Write-Host "Found $($chartFiles.Count) chart files to update" -ForegroundColor Yellow

foreach ($file in $chartFiles) {
    Write-Host "Processing $($file.Name)..." -ForegroundColor Cyan
    
    $content = Get-Content $file.FullName -Raw
    $updated = $false
    
    # Skip files that already have onAnalyze prop in their interface
    if ($content -match "onAnalyze\?:\s*\(") {
        Write-Host "  - Already has onAnalyze prop, skipping" -ForegroundColor Gray
        continue
    }
    
    # Pattern 1: Interface with props extending other interfaces
    if ($content -match "interface\s+\w+Props\s+extends\s+[^{]+\s*{([^}]*)}") {
        $interfaceMatch = $matches[1]
        if ($interfaceMatch -notmatch "onAnalyze") {
            $newInterface = $interfaceMatch.TrimEnd() + "`n  onAnalyze?: (userQuery: string, cardContext: string) => void;"
            $content = $content -replace "(interface\s+\w+Props\s+extends\s+[^{]+\s*{)([^}]*)(})", "`$1$newInterface`n}"
            $updated = $true
            Write-Host "  - Updated interface (extends pattern)" -ForegroundColor Green
        }
    }
    # Pattern 2: Simple interface
    elseif ($content -match "interface\s+\w+Props\s*{([^}]*)}") {
        $interfaceMatch = $matches[1]
        if ($interfaceMatch -notmatch "onAnalyze") {
            $newInterface = $interfaceMatch.TrimEnd() + "`n  onAnalyze?: (userQuery: string, cardContext: string) => void;"
            $content = $content -replace "(interface\s+\w+Props\s*{)([^}]*)(})", "`$1$newInterface`n}"
            $updated = $true
            Write-Host "  - Updated interface (simple pattern)" -ForegroundColor Green
        }
    }
    
    # Update component function parameter destructuring
    if ($content -match "const\s+\w+:\s*React\.FC<\w+Props>\s*=\s*\(\s*{([^}]+)}\s*\)") {
        $paramsMatch = $matches[1]
        if ($paramsMatch -notmatch "onAnalyze") {
            $newParams = $paramsMatch.TrimEnd() + ", onAnalyze"
            $content = $content -replace "(const\s+\w+:\s*React\.FC<\w+Props>\s*=\s*\(\s*{)([^}]+)(}\s*\))", "`$1$newParams`$3"
            $updated = $true
            Write-Host "  - Updated component parameters" -ForegroundColor Green
        }
    }
    
    # Update AnalyzeWithWihyButton calls to include onAnalyze prop
    if ($content -match "<AnalyzeWithWihyButton" -and $content -notmatch "onAnalyze={onAnalyze}") {
        # Find all AnalyzeWithWihyButton instances and add onAnalyze prop
        $content = $content -replace "(<AnalyzeWithWihyButton[^>]*)(\s*/>|\s*>)", "`$1`n          onAnalyze={onAnalyze}`$2"
        $updated = $true
        Write-Host "  - Updated AnalyzeWithWihyButton calls" -ForegroundColor Green
    }
    
    if ($updated) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "  - File updated successfully" -ForegroundColor Green
    } else {
        Write-Host "  - No changes needed" -ForegroundColor Gray
    }
}

Write-Host "Chart component updates completed!" -ForegroundColor Green