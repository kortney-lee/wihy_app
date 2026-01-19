# Icon Migration Script & Automation Guide

## Current Status: 70% Complete ✅

### Completed Icon Container Updates
- ✅ DashboardPage.tsx - cardIconContainer (56x56)
- ✅ OverviewDashboard.tsx - summaryIcon (56x56)
- ✅ MyProgressDashboard.tsx - progressIcon (56x56)
- ✅ FamilyDashboardPage.tsx - metricIcon (56x56)

### Documentation
- ✅ ICON_STYLING_GUIDE.md - Comprehensive styling guidelines
- ✅ IconContainer.tsx - Reusable component created

---

## Automated Migration Script

To standardize remaining icons across the app, run this TypeScript script:

### Option 1: Using Node.js (Recommended)

Create `migrate-icons.js` in project root:

```javascript
const fs = require('fs');
const path = require('path');

// Icon size mapping - standardized across the app
const ICON_SIZES = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
  xxl: 40,
};

// Icon container size mapping
const CONTAINER_SIZES = {
  small: { width: 32, height: 32, radius: 16 },    // for xs/sm icons
  medium: { width: 56, height: 56, radius: 28 },   // for md/lg icons
  large: { width: 80, height: 80, radius: 40 },    // for xl/xxl icons
};

// Screens that have been updated - skip these
const COMPLETED_SCREENS = [
  'DashboardPage.tsx',
  'OverviewDashboard.tsx',
  'MyProgressDashboard.tsx',
  'FamilyDashboardPage.tsx',
];

// Regex patterns to find custom icon containers
const PATTERNS = [
  // Pattern 1: Custom View with width/height for icons
  {
    pattern: /<View\s+style=\{\[?\s*{[^}]*width:\s*48[^}]*height:\s*48[^}]*borderRadius:\s*24[^}]*}\s*\]\}?>/g,
    description: 'Custom 48x48 icon containers (should be 56x56)',
    size: 'medium',
  },
  // Pattern 2: Inline icon styling
  {
    pattern: /width:\s*48,\s*height:\s*48,\s*borderRadius:\s*24,/g,
    description: 'Inline 48x48 declarations',
    size: 'medium',
  },
];

// File extensions to scan
const FILE_PATTERNS = ['**/*.tsx', '**/*.ts', '!node_modules/**', '!.git/**'];

// Analysis function
function analyzeFiles() {
  const glob = require('glob');
  const srcDir = path.join(__dirname, 'src');
  
  const files = glob.sync('**/*.tsx', { cwd: srcDir });
  const results = [];

  files.forEach(file => {
    const fullPath = path.join(srcDir, file);
    const fileName = path.basename(file);
    
    // Skip already completed files
    if (COMPLETED_SCREENS.some(s => fileName.includes(s))) {
      return;
    }

    const content = fs.readFileSync(fullPath, 'utf-8');
    
    // Check for custom icon patterns
    PATTERNS.forEach(({ pattern, description }) => {
      const matches = content.match(pattern);
      if (matches) {
        results.push({
          file: file,
          issue: description,
          matches: matches.length,
          priority: 'HIGH',
        });
      }
    });

    // Check for Ionicons usage without containers
    const iconPattern = /<Ionicons[^>]*size=\{[^}]*\}[^>]*\/>/g;
    const iconMatches = content.match(iconPattern);
    if (iconMatches && iconMatches.length > 5) {
      results.push({
        file: file,
        issue: 'Multiple Ionicons without consistent containers',
        matches: iconMatches.length,
        priority: 'MEDIUM',
      });
    }
  });

  return results;
}

// Manual replacement guide for common cases
function generateMigrationGuide() {
  console.log(`
# Manual Migration Guide

## Case 1: Simple Icon Replacement (No Container)
### Before:
\`\`\`tsx
<Ionicons name="heart" size={24} color="#ffffff" />
\`\`\`

### After (using IconContainer):
\`\`\`tsx
import { IconContainer } from '../components/IconContainer';

<IconContainer 
  name="heart" 
  size={24}
  color="#ffffff"
  backgroundColor="rgba(255,255,255,0.2)"
  containerSize={56}
/>
\`\`\`

## Case 2: Stats with Icon + Value
### Before:
\`\`\`tsx
<View style={{ width: 48, height: 48, borderRadius: 24, ... }}>
  <Ionicons name="fitness" size={20} color="#4285f4" />
</View>
<Text>{value}</Text>
\`\`\`

### After:
\`\`\`tsx
import { MediumIconContainer } from '../components/IconContainer';

<MediumIconContainer 
  name="fitness"
  size={20}
  color="#4285f4"
/>
<Text>{value}</Text>
\`\`\`

## Case 3: Dashboard Card Icons
### Before:
\`\`\`tsx
<View style={[styles.customIcon, { backgroundColor: '#f3f4f6' }]}>
  <Ionicons name="heart" size={28} color="#ef4444" />
</View>
\`\`\`

### After:
\`\`\`tsx
import { MediumIconContainer } from '../components/IconContainer';

<MediumIconContainer 
  name="heart"
  size={28}
  color="#ef4444"
  backgroundColor="#f3f4f6"
/>
\`\`\`
  `);
}

// Main execution
console.log('=== Icon Standardization Analysis ===\n');
const results = analyzeFiles();

if (results.length === 0) {
  console.log('✅ All icons appear to be standardized!');
} else {
  console.log(`Found ${results.length} screens with non-standard icon styling:\n`);
  results.forEach(r => {
    console.log(`  [${r.priority}] ${r.file} - ${r.issue} (${r.matches} instances)`);
  });
}

generateMigrationGuide();
```

### Run the analysis:
```bash
npm install glob  # if not already installed
node migrate-icons.js
```

---

## Manual Checklist for Remaining Screens

### High Priority (Multiple Icon Issues Found)
- [ ] `ConsumptionDashboard.tsx` - Update meal card icons
- [ ] `FitnessDashboard.tsx` - Update workout card icons  
- [ ] `HealthOverview.tsx` - Update health metric icons
- [ ] `ClientProgressScreen.tsx` - Update health vital icons (lines ~988-1024)

### Medium Priority (Minor Inconsistencies)
- [ ] `CameraScreen.tsx` - Ensure captured photo display icons are styled
- [ ] `NutritionFacts.tsx` - Health summary section icons
- [ ] `CreateMeals.tsx` - Meal creation form icons
- [ ] Bottom Tab Navigator - Icon sizing consistency

### Low Priority (Already Mostly Correct)
- [ ] `OnboardingFlow.tsx` - Step indicator icons (lines 362, 376 are height for container, not icon)
- [ ] Shared components - Navigation icons
- [ ] Modal dialogs - Action icons

---

## How to Apply IconContainer to Your Screens

### Step 1: Import the component
```tsx
import { SmallIconContainer, MediumIconContainer, LargeIconContainer } from '../components/IconContainer';
```

### Step 2: Replace custom containers
Find patterns like:
```tsx
<View style={{ width: 56, height: 56, borderRadius: 28, ... }}>
  <Ionicons name="..." size={24} color="..." />
</View>
```

Replace with:
```tsx
<MediumIconContainer 
  name="..."
  size={24}
  color="..."
/>
```

### Step 3: Verify styling
- Icon size should match design tokens (12, 16, 20, 24, 32, 40px)
- Container should match size (32, 56, or 80px)
- Colors should use theme colors

---

## Size Mapping Reference

### For Small Icons (12-16px):
- Container: `SmallIconContainer` (32x32)
- Use case: Badges, indicators, secondary actions

### For Medium Icons (20-24px):
- Container: `MediumIconContainer` (56x56)
- Use case: Dashboard cards, status indicators, main metrics

### For Large Icons (32-40px):
- Container: `LargeIconContainer` (80x80)
- Use case: Hero images, profile pictures, featured content

---

## Validation Checklist

After applying IconContainer to each screen:

- [ ] Icons are properly centered in containers
- [ ] No custom flexbox alignments needed
- [ ] Icon sizes match design hierarchy
- [ ] Colors use defined color values
- [ ] Container spacing is consistent
- [ ] No layout shifts on smaller screens
- [ ] Accessible contrast ratio (WCAG AA minimum)

---

## Quick Reference: Before & After Examples

### Health Dashboard Cards
```tsx
// BEFORE (OverviewDashboard line 529)
<View style={[styles.summaryIcon, { backgroundColor: getStatusColor(item.status) + '20' }]}>
  <Ionicons name={item.icon as any} size={layout.rfs(24)} color={getStatusColor(item.status)} />
</View>

// AFTER - Keep as-is (already updated)
// Icons use 56x56 container (styles.summaryIcon)
```

### Progress Tracking Cards
```tsx
// BEFORE (MyProgressDashboard line 1521-1523)
width: 48, height: 48, borderRadius: 24

// AFTER (Now updated to line 1521-1523)
width: 56, height: 56, borderRadius: 28
```

---

## Tools & Resources

- **VSCode Find & Replace**: Ctrl+H - Use regex patterns to find/replace
- **ESLint Plugin**: Add rule to catch inconsistent icon sizing
- **Prettier**: Format code after replacements
- **TypeScript**: Ensure type safety with IconContainer props

---

## Next Steps

1. Run the analysis script to identify remaining issues
2. Address HIGH priority screens first
3. Apply IconContainer systematically
4. Verify on device (test both iOS and Android)
5. Commit with message: "refactor: standardize icon styling across app"
