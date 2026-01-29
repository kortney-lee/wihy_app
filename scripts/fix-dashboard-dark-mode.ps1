# Advanced Dark Mode Fixer for Dashboard Screens
# Adds theme colors to JSX elements that need dark mode support

param(
    [string]$WorkspacePath = "C:\repo\wihy_ui_clean\mobile\src\screens",
    [switch]$DryRun,
    [string[]]$FilesToProcess = @()
)

$stats = @{
    FilesProcessed = 0
    LinesModified = 0
    TextElementsFixed = 0
    ViewElementsFixed = 0
}

function Write-ColorLog {
    param($Message, $Color = "White")
    Write-Host $Message -ForegroundColor $Color
}

function Fix-TextElement {
    param([string]$Line)
    
    $modified = $false
    $newLine = $Line
    
    # Pattern 1: <Text style={styles.xyz}> -> <Text style={[styles.xyz, { color: theme.colors.text }]}>
    if ($Line -match '<Text\s+style=\{styles\.(\w+)\}' -and $Line -notmatch '\[styles\.\w+,\s*\{.*color:') {
        $styleName = $matches[1]
        
        # Determine if this should be text or textSecondary based on style name
        $colorType = if ($styleName -match '(label|hint|caption|meta|subtext|subtitle|description|secondary)') {
            'theme.colors.textSecondary'
        } else {
            'theme.colors.text'
        }
        
        $newLine = $Line -replace '(<Text\s+style=\{)styles\.(\w+)(\})', "`$1[styles.`$2, { color: $colorType }]`$3"
        $modified = $true
        $stats.TextElementsFixed++
    }
    
    # Pattern 2: <Text style={[styles.xyz, otherStyle]}> - add color if not present
    elseif ($Line -match '<Text\s+style=\{\[styles\.(\w+)' -and $Line -notmatch 'color:\s*theme\.colors') {
        $styleName = $matches[1]
        $colorType = if ($styleName -match '(label|hint|caption|meta|subtext|subtitle|description|secondary)') {
            'theme.colors.textSecondary'
        } else {
            'theme.colors.text'
        }
        
        # Insert color before the closing ]}
        $newLine = $Line -replace '(\[styles\.\w+[^\]]*)\]\}', "`$1, { color: $colorType }]}"
        $modified = $true
        $stats.TextElementsFixed++
    }
    
    return @{
        Line = $newLine
        Modified = $modified
    }
}

function Fix-ViewElement {
    param([string]$Line)
    
    $modified = $false
    $newLine = $Line
    
    # Pattern: <View style={styles.xyz}> where xyz contains "card", "container", "section"
    if ($Line -match '<View\s+style=\{styles\.(\w+)\}' -and $Line -notmatch '\[styles\.\w+,\s*\{.*backgroundColor:') {
        $styleName = $matches[1]
        
        # Only add background to card/container-like elements
        if ($styleName -match '(card|container|section|content|modal|panel|box)') {
            $newLine = $Line -replace '(<View\s+style=\{)styles\.(\w+)(\})', '$1[styles.$2, { backgroundColor: theme.colors.surface }]$3'
            $modified = $true
            $stats.ViewElementsFixed++
        }
    }
    
    return @{
        Line = $newLine
        Modified = $modified
    }
}

function Process-File {
    param([string]$FilePath)
    
    Write-ColorLog "`nProcessing: $(Split-Path $FilePath -Leaf)" "Cyan"
    
    if (-not (Test-Path $FilePath)) {
        Write-ColorLog "  File not found!" "Yellow"
        return
    }
    
    $lines = Get-Content $FilePath -Encoding UTF8
    $modifiedLines = 0
    $newContent = @()
    
    foreach ($line in $lines) {
        $textResult = Fix-TextElement -Line $line
        $viewResult = Fix-ViewElement -Line $textResult.Line
        
        if ($textResult.Modified -or $viewResult.Modified) {
            $modifiedLines++
            $stats.LinesModified++
        }
        
        $newContent += $viewResult.Line
    }
    
    if ($modifiedLines -gt 0) {
        if (-not $DryRun) {
            $newContent | Set-Content $FilePath -Encoding UTF8
            Write-ColorLog "  Modified $modifiedLines lines" "Green"
        } else {
            Write-ColorLog "  [DRY RUN] Would modify $modifiedLines lines" "Yellow"
        }
        $stats.FilesProcessed++
    } else {
        Write-ColorLog "  No changes needed" "Gray"
    }
}

# Main execution
Write-ColorLog "`n=======================================" "Magenta"
Write-ColorLog "  Dashboard Dark Mode Theme Fixer" "Magenta"
Write-ColorLog "=======================================`n" "Magenta"

# Default files to process if none specified
if ($FilesToProcess.Count -eq 0) {
    $FilesToProcess = @(
        "FitnessDashboard.tsx",
        "CoachDashboard.tsx",
        "MyProgressDashboard.tsx",
        "Dashboard.tsx",
        "ParentDashboard.tsx",
        "OverviewDashboard.tsx",
        "MealCalendar.tsx",
        "ShoppingListScreen.tsx"
    )
}

Write-ColorLog "Workspace: $WorkspacePath" "White"
Write-ColorLog "Mode: $(if ($DryRun) { 'DRY RUN (no changes will be made)' } else { 'LIVE (files will be modified)' })" "White"
Write-ColorLog ""

foreach ($file in $FilesToProcess) {
    $filePath = Join-Path $WorkspacePath $file
    Process-File -FilePath $filePath
}

# Summary
Write-ColorLog "`n=======================================" "Cyan"
Write-ColorLog "  Summary" "Cyan"
Write-ColorLog "=======================================" "Cyan"
Write-ColorLog "Files processed:       $($stats.FilesProcessed)" "White"
Write-ColorLog "Lines modified:        $($stats.LinesModified)" "Green"
Write-ColorLog "Text elements fixed:   $($stats.TextElementsFixed)" "Green"
Write-ColorLog "View elements fixed:   $($stats.ViewElementsFixed)" "Green"

if ($DryRun) {
    Write-ColorLog "`nDRY RUN MODE - No files were actually modified" "Yellow"
    Write-ColorLog "Run without -DryRun to apply changes`n" "Yellow"
}
