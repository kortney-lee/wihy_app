# Apply Dark Mode Theme Colors to Dashboard Screens
# This script adds dynamic theme colors to text and card elements in dashboard screens

param(
    [string]$WorkspacePath = "C:\repo\wihy_ui_clean\mobile\src\screens",
    [switch]$DryRun = $false,
    [switch]$Verbose = $false
)

# Dashboard files to process (excluding already completed ones)
$dashboardFiles = @(
    "FitnessDashboard.tsx",
    "CoachDashboard.tsx",
    "MyProgressDashboard.tsx",
    "Dashboard.tsx",
    "ParentDashboard.tsx",
    "OverviewDashboard.tsx"
    # ConsumptionDashboard, ResearchScreen, Profile already done
)

$stats = @{
    FilesProcessed = 0
    TextColorsAdded = 0
    BackgroundsAdded = 0
    BordersAdded = 0
    Errors = 0
}

function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "HH:mm:ss"
    $color = switch ($Level) {
        "ERROR" { "Red" }
        "SUCCESS" { "Green" }
        "WARNING" { "Yellow" }
        default { "White" }
    }
    Write-Host "[$timestamp] $Message" -ForegroundColor $color
}

function Add-ThemeToTextElement {
    param(
        [string]$Content,
        [string]$StylePattern,
        [string]$ColorType = "text"  # "text" or "textSecondary"
    )
    
    $colorProp = if ($ColorType -eq "textSecondary") { "theme.colors.textSecondary" } else { "theme.colors.text" }
    
    # Pattern: <Text style={styles.someName}>
    # Replace with: <Text style={[styles.someName, { color: theme.colors.text }]}>
    
    $pattern = "(<Text\s+style={)styles\.$StylePattern(})"
    $replacement = "`$1[styles.$StylePattern, { color: $colorProp }]`$2"
    
    $newContent = $Content -replace $pattern, $replacement
    
    if ($newContent -ne $Content) {
        $stats.TextColorsAdded++
        if ($Verbose) {
            Write-Log "  Added $ColorType color to Text with style: $StylePattern" "SUCCESS"
        }
    }
    
    return $newContent
}

function Add-ThemeToViewElement {
    param(
        [string]$Content,
        [string]$StylePattern
    )
    
    # Pattern: <View style={styles.someName}>
    # Replace with: <View style={[styles.someName, { backgroundColor: theme.colors.surface }]}>
    
    $pattern = "(<View\s+style={)styles\.$StylePattern(})"
    $replacement = "`$1[styles.$StylePattern, { backgroundColor: theme.colors.surface }]`$2"
    
    $newContent = $Content -replace $pattern, $replacement
    
    if ($newContent -ne $Content) {
        $stats.BackgroundsAdded++
        if ($Verbose) {
            Write-Log "  Added surface background to View with style: $StylePattern" "SUCCESS"
        }
    }
    
    return $newContent
}

function Add-ThemeToBorder {
    param(
        [string]$Content,
        [string]$StylePattern
    )
    
    # Pattern: style={styles.someName}
    # Replace with: style={[styles.someName, { borderColor: theme.isDark ? '#374151' : '#e5e7eb' }]}
    
    $pattern = "(style={)styles\.$StylePattern(})"
    $replacement = "`$1[styles.$StylePattern, { borderColor: theme.isDark ? '#374151' : '#e5e7eb' }]`$2"
    
    $newContent = $Content -replace $pattern, $replacement
    
    if ($newContent -ne $Content) {
        $stats.BordersAdded++
        if ($Verbose) {
            Write-Log "  Added theme border color to style: $StylePattern" "SUCCESS"
        }
    }
    
    return $newContent
}

function Process-DashboardFile {
    param([string]$FilePath)
    
    Write-Log "Processing: $FilePath"
    
    try {
        $content = Get-Content $FilePath -Raw -Encoding UTF8
        $originalContent = $content
        
        # Common text style patterns to update (customize per file as needed)
        $textStyles = @(
            "title", "sectionTitle", "headerTitle", "cardTitle",
            "label", "description", "text", "value",
            "statValue", "statLabel", "statTitle",
            "heading", "subheading", "subtitle"
        )
        
        # Common secondary text styles
        $secondaryTextStyles = @(
            "subtext", "subtitle", "caption", "meta", "hint",
            "statLabel", "label", "description"
        )
        
        # Common card/container styles
        $cardStyles = @(
            "card", "container", "section", "sectionContent",
            "statCard", "infoCard", "contentCard",
            "modalContent", "modalMeta"
        )
        
        # Apply text colors
        foreach ($style in $textStyles) {
            # Only add if not already present
            if ($content -match "styles\.$style(?!,\s*\{\s*color:)" -and $content -notmatch "\[styles\.$style,\s*\{\s*color:\s*theme\.colors") {
                $content = Add-ThemeToTextElement -Content $content -StylePattern $style -ColorType "text"
            }
        }
        
        # Apply secondary text colors
        foreach ($style in $secondaryTextStyles) {
            if ($content -match "styles\.$style(?!,\s*\{\s*color:)" -and $content -notmatch "\[styles\.$style,\s*\{\s*color:\s*theme\.colors") {
                $content = Add-ThemeToTextElement -Content $content -StylePattern $style -ColorType "textSecondary"
            }
        }
        
        # Apply surface backgrounds to cards
        foreach ($style in $cardStyles) {
            if ($content -match "styles\.$style(?!,\s*\{\s*backgroundColor:)" -and $content -notmatch "\[styles\.$style,\s*\{\s*backgroundColor:\s*theme\.colors") {
                $content = Add-ThemeToViewElement -Content $content -StylePattern $style
            }
        }
        
        # Check if changes were made
        if ($content -ne $originalContent) {
            if (-not $DryRun) {
                Set-Content $FilePath -Value $content -Encoding UTF8 -NoNewline
                Write-Log "  ✓ Updated successfully" "SUCCESS"
            } else {
                Write-Log "  [DRY RUN] Would update this file" "WARNING"
            }
            $stats.FilesProcessed++
        } else {
            Write-Log "  No changes needed" "INFO"
        }
        
    } catch {
        Write-Log "  ✗ Error: $_" "ERROR"
        $stats.Errors++
    }
}

# Main execution
Write-Log "=== Dark Mode Dashboard Update Script ===" "INFO"
Write-Log "Workspace: $WorkspacePath"
Write-Log "Dry Run: $DryRun"
Write-Log ""

foreach ($file in $dashboardFiles) {
    $filePath = Join-Path $WorkspacePath $file
    if (Test-Path $filePath) {
        Process-DashboardFile -FilePath $filePath
    } else {
        Write-Log "File not found: $filePath" "WARNING"
    }
    Write-Log ""
}

# Print summary
Write-Log "=== Summary ===" "INFO"
Write-Log "Files processed: $($stats.FilesProcessed)"
Write-Log "Text colors added: $($stats.TextColorsAdded)" "SUCCESS"
Write-Log "Backgrounds added: $($stats.BackgroundsAdded)" "SUCCESS"
Write-Log "Borders added: $($stats.BordersAdded)" "SUCCESS"
Write-Log "Errors: $($stats.Errors)" $(if ($stats.Errors -gt 0) { "ERROR" } else { "INFO" })

if ($DryRun) {
    Write-Log "`nThis was a DRY RUN. No files were modified." "WARNING"
    Write-Log "Run without -DryRun to apply changes."
}
