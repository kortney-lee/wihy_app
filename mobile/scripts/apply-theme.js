/**
 * Script to apply theme to all screens
 * Run with: node scripts/apply-theme.js
 */

const fs = require('fs');
const path = require('path');

// Files that need theme applied
const filesToUpdate = [
  // Screens
  'src/screens/AcceptInvitation.tsx',
  'src/screens/BeautyFacts.tsx',
  'src/screens/ClientProgressScreen.tsx',
  'src/screens/CoachOverview.tsx',
  'src/screens/EnrollmentScreen.tsx',
  'src/screens/MealDetailsScreen.tsx',
  'src/screens/NativeSubscriptionScreen.tsx',
  'src/screens/PetFoodFacts.tsx',
  'src/screens/ProfileSetupScreen.tsx',
  'src/screens/ShoppingListScreen.tsx',
];

const useThemeImport = "import { useTheme } from '../context/ThemeContext';";

function processFile(filePath) {
  const fullPath = path.join(__dirname, '..', filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`  ❌ File not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  let modified = false;

  // Check if already has useTheme import
  if (!content.includes("from '../context/ThemeContext'")) {
    // Find a good place to add the import (after AuthContext or other context imports)
    const contextImportRegex = /(import.*from ['"]\.\.\/context\/\w+['"];?\n)/;
    const match = content.match(contextImportRegex);
    
    if (match) {
      content = content.replace(match[0], match[0] + useThemeImport + '\n');
      modified = true;
      console.log(`  ✅ Added useTheme import`);
    } else {
      // Try to add after last import
      const lastImportRegex = /(import[^;]+;)\n(?!import)/;
      const lastMatch = content.match(lastImportRegex);
      if (lastMatch) {
        content = content.replace(lastMatch[0], lastMatch[1] + '\n' + useThemeImport + '\n\n');
        modified = true;
        console.log(`  ✅ Added useTheme import (after last import)`);
      }
    }
  } else {
    console.log(`  ⏭️  Already has useTheme import`);
  }

  // Check if already has useTheme hook call
  if (!content.includes('useTheme()')) {
    // Find component function and add hook
    // Look for patterns like: export default function ComponentName() {
    // or: const ComponentName = () => {
    const funcPatterns = [
      /(export default function \w+\([^)]*\)\s*{[\n\r])/,
      /(export default function \w+\([^)]*\)\s*{\s*\n\s*const \{ \w+ \} = \w+\(\);)/,
    ];
    
    for (const pattern of funcPatterns) {
      const funcMatch = content.match(pattern);
      if (funcMatch) {
        // Add after opening brace
        const hookLine = "\n  const { theme } = useTheme();";
        content = content.replace(funcMatch[0], funcMatch[0] + hookLine);
        modified = true;
        console.log(`  ✅ Added useTheme() hook`);
        break;
      }
    }
  } else {
    console.log(`  ⏭️  Already has useTheme() hook`);
  }

  // Replace static container styles with dynamic ones
  // Pattern: style={styles.container} -> style={[styles.container, { backgroundColor: theme.colors.background }]}
  const containerPatterns = [
    { 
      from: /style=\{styles\.container\}(?!\s*edges)/g,
      to: 'style={[styles.container, { backgroundColor: theme.colors.background }]}'
    },
    {
      from: /style=\{styles\.container\}(\s*edges)/g,
      to: 'style={[styles.container, { backgroundColor: theme.colors.background }]}$1'
    }
  ];

  for (const pattern of containerPatterns) {
    if (pattern.from.test(content)) {
      content = content.replace(pattern.from, pattern.to);
      modified = true;
      console.log(`  ✅ Updated container style`);
    }
  }

  if (modified) {
    fs.writeFileSync(fullPath, content);
    console.log(`  💾 Saved: ${filePath}`);
  } else {
    console.log(`  ⏭️  No changes needed`);
  }
}

console.log('🎨 Applying theme to screens...\n');

for (const file of filesToUpdate) {
  console.log(`📄 Processing: ${file}`);
  processFile(file);
  console.log('');
}

console.log('✨ Done!');
