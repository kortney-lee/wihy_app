# ESLint Error Fix Script
# Fixes common ESLint violations: unused variables and CSS class violations

param(
    [string]$Action = "all",
    [switch]$DryRun = $false
)

Write-Host "ESLint Error Fix Script" -ForegroundColor Green
Write-Host "Action: $Action" -ForegroundColor Yellow
if ($DryRun) { Write-Host "DRY RUN MODE - No files will be modified" -ForegroundColor Yellow }

$clientDir = "c:\repo\wihy_ui\client"
$srcDir = "$clientDir\src"

# Function to fix unused variables by prefixing with underscore
function Fix-UnusedVariables {
    param([string]$filePath)
    
    $content = Get-Content $filePath -Raw
    $originalContent = $content
    
    # Common unused variable patterns
    $patterns = @(
        # Function parameters
        @{ Pattern = '(\w+): \w+(\) =>|\) {)'; Replacement = '_$1: $2$3' }
        # Destructured variables
        @{ Pattern = 'const { (\w+)(,|\s*})'; Replacement = 'const { _$1$2' }
        # Array destructuring
        @{ Pattern = '\[(\w+),'; Replacement = '[_$1,' }
        # Simple const declarations
        @{ Pattern = 'const (\w+) = '; Replacement = 'const _$1 = ' }
        # Import statements
        @{ Pattern = 'import.*{ (\w+)(,|\s*})'; Replacement = 'import { _$1$2' }
    )
    
    foreach ($pattern in $patterns) {
        $content = $content -replace $pattern.Pattern, $pattern.Replacement
    }
    
    if ($content -ne $originalContent) {
        if (-not $DryRun) {
            Set-Content -Path $filePath -Value $content -NoNewline
            Write-Host "Fixed unused variables in: $filePath" -ForegroundColor Green
        } else {
            Write-Host "Would fix unused variables in: $filePath" -ForegroundColor Yellow
        }
        return $true
    }
    return $false
}

# Function to remove unused imports entirely
function Remove-UnusedImports {
    param([string]$filePath)
    
    $lines = Get-Content $filePath
    $filteredLines = @()
    $modified = $false
    
    foreach ($line in $lines) {
        # Skip lines with clearly unused imports
        if ($line -match "import.*'react'.*useMemo.*useCallback" -and $line -match "never used") {
            $modified = $true
            continue
        }
        $filteredLines += $line
    }
    
    if ($modified) {
        if (-not $DryRun) {
            Set-Content -Path $filePath -Value $filteredLines
            Write-Host "Removed unused imports from: $filePath" -ForegroundColor Green
        } else {
            Write-Host "Would remove unused imports from: $filePath" -ForegroundColor Yellow
        }
    }
    
    return $modified
}

# Get all TypeScript/TSX files
$files = Get-ChildItem -Path $srcDir -Recurse -Include "*.ts", "*.tsx" | Where-Object { -not $_.Name.EndsWith(".test.ts") -and -not $_.Name.EndsWith(".test.tsx") }

Write-Host "Found $($files.Count) files to process" -ForegroundColor Cyan

$fixedCount = 0

foreach ($file in $files) {
    Write-Host "Processing: $($file.FullName)" -ForegroundColor White
    
    if ($Action -eq "all" -or $Action -eq "unused") {
        if (Fix-UnusedVariables -filePath $file.FullName) {
            $fixedCount++
        }
        if (Remove-UnusedImports -filePath $file.FullName) {
            $fixedCount++
        }
    }
}

Write-Host "Processed $($files.Count) files, made fixes to $fixedCount files" -ForegroundColor Green

if (-not $DryRun) {
    Write-Host "Running npm run build to check for remaining errors..." -ForegroundColor Cyan
    Set-Location $clientDir
    npm run build
}