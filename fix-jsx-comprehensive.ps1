# Comprehensive JSX Syntax Fixer for Chart Components
# Fixes broken AnalyzeWithWihyButton structures

$files = @(
    "client\src\components\charts\cards\NutritionChart.tsx",
    "client\src\components\charts\cards\PublicationTimelineChart.tsx", 
    "client\src\components\charts\cards\ResultQualityPie.tsx",
    "client\src\components\charts\individual\BloodPressureChart.tsx",
    "client\src\components\charts\individual\CaloriesCard.tsx",
    "client\src\components\charts\individual\CurrentWeightCard.tsx",
    "client\src\components\charts\individual\HealthRiskChart.tsx",
    "client\src\components\charts\individual\HydrationChart.tsx",
    "client\src\components\charts\individual\NutritionTrackingCard.tsx",
    "client\src\components\charts\individual\NutritionTrackingChart.tsx",
    "client\src\components\charts\individual\VitaminContentChart.tsx"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "Fixing $file..."
        $content = Get-Content $file -Raw
        
        # Fix patterns where onAnalyze prop was inserted into template literals
        
        # Pattern 1: Fix broken cardContext with onAnalyze in middle of template
        $content = $content -replace 'cardContext=\{`([^`]*)\s+onAnalyze=\{onAnalyze\}\s*\/>\s*([^`]*)`\}', 'cardContext={`$1$2`} onAnalyze={onAnalyze}'
        
        # Pattern 2: Fix where onAnalyze appears before closing template
        $content = $content -replace 'onAnalyze=\{onAnalyze\}\s*\/>\s*([^`]*)`\}', '$1`} onAnalyze={onAnalyze}'
        
        # Pattern 3: Fix broken template with embedded JSX
        $content = $content -replace '(\$\{[^}]*)\s+onAnalyze=\{onAnalyze\}\s*\/>\s*([^}]*\})', '$1$2'
        
        # Pattern 4: Clean up any remaining broken structures
        $content = $content -replace 'onAnalyze=\{onAnalyze\}\s*\/>\s*([^`\}]*)', '$1'
        
        # Fix specific broken patterns for each file type
        
        # Fix NutritionChart pattern
        if ($file -like "*NutritionChart.tsx") {
            $content = $content -replace 'cardContext=\{`Nutrition analysis: \$\{calories\} calories total with macronutrient breakdown - Protein: \$\{total\s+onAnalyze=\{onAnalyze\}\s*\/>\s*0 \? Math\.round\(\(protein \/ total\) \* 100\) : 0\}%, Carbs: \$\{total > 0 \? Math\.round\(\(carbs \/ total\) \* 100\) : 0\}%, Fat: \$\{total > 0 \? Math\.round\(\(fat \/ total\) \* 100\) : 0\}%\. Additional nutrition data: \$\{JSON\.stringify\(nutritionFacts\)\}`\}', 'cardContext={`Nutrition analysis: ${calories} calories total with macronutrient breakdown - Protein: ${total > 0 ? Math.round((protein / total) * 100) : 0}%, Carbs: ${total > 0 ? Math.round((carbs / total) * 100) : 0}%, Fat: ${total > 0 ? Math.round((fat / total) * 100) : 0}%. Additional nutrition data: ${JSON.stringify(nutritionFacts)}`} onAnalyze={onAnalyze}'
        }
        
        # Fix PublicationTimelineChart pattern  
        if ($file -like "*PublicationTimelineChart.tsx") {
            $content = $content -replace 'cardContext=\{`Publication timeline analysis: \$\{title\} showing \$\{timeRange\} data\. Total publications: \$\{totalPublications\} studies\. Average per year: \$\{avgPerYear\}\. Recent average: \$\{recentAvg\}\. Trend: \$\{recentAvg\s+onAnalyze=\{onAnalyze\}\s*\/>\s*avgPerYear \? ''Increasing'' : ''Declining''\} research activity\. Data spans from \$\{publicationData\[0\]\?\.year\} to \$\{publicationData\[publicationData\.length - 1\]\?\.year\}`\}', 'cardContext={`Publication timeline analysis: ${title} showing ${timeRange} data. Total publications: ${totalPublications} studies. Average per year: ${avgPerYear}. Recent average: ${recentAvg}. Trend: ${recentAvg > avgPerYear ? `Increasing` : `Declining`} research activity. Data spans from ${publicationData[0]?.year} to ${publicationData[publicationData.length - 1]?.year}`} onAnalyze={onAnalyze}'
        }
        
        # Fix ResultQualityPie pattern
        if ($file -like "*ResultQualityPie.tsx") {
            $content = $content -replace 'cardContext=\{`Result quality analysis: \$\{percentage\}% good sources, \$\{remaining\}% poor sources\. Data source: \$\{dataSource\}\. Quality reasons: \$\{reasons\.filter\(r =\s+onAnalyze=\{onAnalyze\}\s*\/>\s*r !== ''Loading\.\.\.'' && r !== ''Waiting for results\.\.\.''\)\.join\('', ''\)\}\. Query: ""\$\{query\}""`\}', 'cardContext={`Result quality analysis: ${percentage}% good sources, ${remaining}% poor sources. Data source: ${dataSource}. Quality reasons: ${reasons.filter(r => r !== `Loading...` && r !== `Waiting for results...`).join(`, `)}.Query: "${query}"`} onAnalyze={onAnalyze}'
        }
        
        # Fix BloodPressureChart - broken JSX tag
        if ($file -like "*BloodPressureChart.tsx") {
            $content = $content -replace 'userQuery="Analyze my blood pressure patterns and provide insights about my cardiovascular health, risk factors, and lifestyle recommendations"\s*\/\s*onAnalyze=\{onAnalyze\}>', 'userQuery="Analyze my blood pressure patterns and provide insights about my cardiovascular health, risk factors, and lifestyle recommendations" onAnalyze={onAnalyze} />'
        }
        
        # Fix CaloriesCard pattern
        if ($file -like "*CaloriesCard.tsx") {
            $content = $content -replace 'cardContext=\{`Calories: Consumed \$\{consumedCalories\} \$\{unit\}, Burned \$\{burnedCalories\} \$\{unit\}, Net \$\{netCalories\} \$\{unit\} \$\{netCalories\s+onAnalyze=\{onAnalyze\}\s*\/>\s*0 \? ''deficit'' : ''surplus''\}`\}', 'cardContext={`Calories: Consumed ${consumedCalories} ${unit}, Burned ${burnedCalories} ${unit}, Net ${netCalories} ${unit} ${netCalories < 0 ? `deficit` : `surplus`}`} onAnalyze={onAnalyze}'
        }
        
        # Fix CurrentWeightCard pattern
        if ($file -like "*CurrentWeightCard.tsx") {
            $content = $content -replace 'cardContext=\{`Current Weight: \$\{currentWeight\} \$\{unit\}, Goal: \$\{goalWeight\} \$\{unit\}\. Difference: \$\{difference\s+onAnalyze=\{onAnalyze\}\s*\/>\s*0 \? ''\+'' : ''\'\'\}\$\{difference\.toFixed\(1\)\} \$\{unit\}\. Status: \$\{weightLabel\}\.\`\}', 'cardContext={`Current Weight: ${currentWeight} ${unit}, Goal: ${goalWeight} ${unit}. Difference: ${difference > 0 ? `+` : ``}${difference.toFixed(1)} ${unit}. Status: ${weightLabel}.`} onAnalyze={onAnalyze}'
        }
        
        # Fix complex cases for array methods with arrow functions
        $content = $content -replace '(\$\{[^}]*\.(reduce|map|filter)\([^=]*) =\s+onAnalyze=\{onAnalyze\}\s*\/>\s*([^}]+\})', '$1 => $3'
        
        # Fix remaining broken template literal cases
        $content = $content -replace '`([^`]*)\s+onAnalyze=\{onAnalyze\}\s*\/>\s*([^`]*)`', '`$1$2`'
        
        # Ensure proper JSX structure
        $content = $content -replace '(\s+)onAnalyze=\{onAnalyze\}(\s*\/>)', '$1onAnalyze={onAnalyze}$2'
        
        # Write the corrected content back
        Set-Content $file $content -NoNewline
        Write-Host "Fixed $file"
    } else {
        Write-Host "File not found: $file"
    }
}

Write-Host "JSX syntax fixes completed!"