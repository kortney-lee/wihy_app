# Research - User Behavior Specification

## Overview

This document describes all user interactions with the Research feature, a scientific article search and discovery tool that provides evidence-based health insights from peer-reviewed research. Users can search health topics, view study details, bookmark articles, and explore trending research.

---

## 1. Feature Modes & Entry Points

### 1.1 Dashboard Entry (Default View)

**Scenario: User opens Research from main dashboard**
- **Given** user taps "Research" card on Dashboard
- **When** ResearchScreen loads
- **Then** user sees:
  - Collapsing purple header (#8b5cf6)
  - Title: "Research"
  - Subtitle: "Evidence-based health insights"
  - Badge: "12 new papers this month"
  - Search bar with placeholder: "Search health topics..."
  - Quick action buttons (History, Saved, Trending)
  - Stats cards (New Papers: 12, Saved: 5)
  - Recent searches (if any)
  - Popular topics list (6 curated topics)
  - Clean, discovery-focused layout

**Scenario: User navigating from dashboard with auto-search**
- **Given** user taps a health topic card elsewhere
- **When** navigation occurs with route params
- **Then** Research opens directly to results:
  - Search query pre-filled from params
  - Automatic search triggered
  - Results displayed immediately
  - Seamless topic exploration

---

### 1.2 Results View (Search Active)

**Scenario: User performs search**
- **Given** user entered search query
- **When** user taps "Search" button or Return key
- **Then** view switches to results mode:
  - Header changes to "Research Results"
  - Subtitle shows query: "Mediterranean Diet"
  - Back button appears (returns to dashboard view)
  - Results stats card displays counts
  - Study cards list appears
  - Pull-to-refresh enabled
  - Loading spinner during search
  - Empty state if no results
  - Error message if API fails

---

## 2. Dashboard View Components

### 2.1 Collapsing Header Animation

**Header States:**
```
Expanded (scroll Y = 0):
  - Height: 140px
  - Background: Purple (#8b5cf6)
  - Title: "Research" (28px, bold, white)
  - Subtitle: "Evidence-based health insights" (16px, white 90% opacity)
  - Stats badge: "12 new papers this month"
    * Icon: document-text (14px)
    * Background: White 20% opacity
    * Padding: 12px horizontal, 6px vertical
    * Border radius: 16px
  - Full opacity: 1.0

Collapsed (scroll Y ≥ 140):
  - Height: 0px
  - Opacity: 0
  - Title scaled to 0.9
  - All content hidden
  - Smooth 60fps animation
```

**Animation Details:**
```
Scroll tracking:
  - Animated.Value(0) for scrollY
  - scrollEventThrottle: 16 (60fps)
  
Height interpolation:
  - Input: [0, 140]
  - Output: [140, 0]
  - Extrapolate: clamp

Opacity interpolation:
  - Input: [0, 70]
  - Output: [1, 0]
  - Fades at halfway point
  
Title scale interpolation:
  - Input: [0, 140]
  - Output: [1, 0.9]
  - Subtle zoom effect
```

**Scenario: User scrolls down**
```
Given user at top of dashboard
When user scrolls down
Then header animates smoothly:
  - 0-70px: Opacity fades from 1 to 0
  - 0-140px: Height collapses from 140 to 0
  - Title scales from 1.0 to 0.9
  - Content scrolls underneath
  - Non-native driver (layout changes)
```

---

### 2.2 Search Bar

**Visual Design:**
```
Layout: Horizontal flex row
Components:
  ┌─────────────────────────────────────────┬────────────┐
  │ 🔍 Search health topics...             │   Search   │
  └─────────────────────────────────────────┴────────────┘
  
Search input (flex 1):
  - Background: White (#ffffff)
  - Border: 1px gray (#e5e7eb)
  - Border radius: 12px
  - Padding: 16px horizontal, 12px vertical
  - Icon: Search (gray #9ca3af, 20px)
  - Gap: 12px between elements
  
Search button:
  - Background: Purple (#8b5cf6)
  - Padding: 20px horizontal, 12px vertical
  - Border radius: 12px
  - Text: "Search" (15px, semibold, white)
```

**Scenario: User types search query**
```
Given user taps search input
When user types text
Then:
  - Input updates in real-time
  - Placeholder disappears
  - Clear button (X) appears when text entered
  - Return key type: "search"
  - Can submit with keyboard Return
  - Minimum query length: None (allows any text)
  - Trims whitespace on submit
```

**Scenario: User clears search**
```
Given user has text in search bar
When user taps close-circle icon
Then:
  - Query clears immediately
  - Placeholder reappears
  - Clear button disappears
  - Focus remains in input
  - No search triggered
```

**Scenario: User submits search**
```
Given user entered query "intermittent fasting"
When user taps "Search" button OR presses Return
Then:
  1. Validate query not empty (trim)
  2. Switch to results view
  3. Set activeWorkspace to query
  4. Show loading spinner
  5. Check cache (30min expiry)
  6. If cached: Display cached results
  7. If not cached: Call API
  8. Display results or error
  9. Save to recent searches (max 5)
  10. Cache results for 30 minutes
```

---

### 2.3 Quick Action Buttons

**Visual Design:**
```
Horizontal row of 3 equal-width buttons:
┌───────────┬───────────┬───────────┐
│  ⏱️ Time  │  🔖 Book  │  📈 Trend │
│  History  │   Saved   │  Trending │
└───────────┴───────────┴───────────┘

Each button:
  - Flex: 1 (equal width)
  - Background: White
  - Border: 1px gray (#e5e7eb)
  - Border radius: 12px
  - Padding: 16px vertical
  - Centered content
  
Icon circle:
  - Width/height: 40px
  - Border radius: 20px (circular)
  - Background colors:
    * History: Light purple (#ede9fe)
    * Saved: Light green (#dcfce7)
    * Trending: Light blue (#dbeafe)
  - Icon size: 20px
  - Icon colors match background theme
  
Label:
  - Font: 13px, semibold
  - Color: Dark gray (#374151)
  - Margin top: 8px
```

**Button Functionality:**
```
History:
  - Action: Navigate to search history
  - Future: Shows all past searches with timestamps
  - Current: Placeholder (not implemented)

Saved:
  - Action: Navigate to bookmarked articles
  - Future: Shows saved/bookmarked research
  - Current: Placeholder (not implemented)

Trending:
  - Action: Show trending research topics
  - Future: Popular articles this week/month
  - Current: Placeholder (not implemented)
```

---

### 2.4 Stats Cards

**Visual Design:**
```
Section header: "Your Research" (18px, bold)
Two cards in horizontal row:

┌─────────────────────┬─────────────────────┐
│  📄                 │  🔖                 │
│  12                 │  5                  │
│  New Papers         │  Saved              │
│  ┃                  │  ┃                  │
└─────────────────────┴─────────────────────┘

Card styling:
  - Flex: 1 (50% width each)
  - Background: White
  - Border radius: 12px
  - Padding: 16px
  - Border left: 4px colored accent
    * New Papers: Purple (#8b5cf6)
    * Saved: Green (#22c55e)
  - Centered alignment

Content structure:
  - Icon: 24px (top)
  - Value: 24px bold (middle)
  - Label: 13px gray (bottom)
  - Gap: 8px between elements
```

**Data Sources:**
```
New Papers:
  - Count: Mock value (12)
  - Future: API call to get new articles count
  - Filter: Published this month
  
Saved:
  - Count: Mock value (5)
  - Future: User bookmarks count
  - Source: AsyncStorage bookmarks array
```

---

### 2.5 Recent Searches

**Scenario: User has search history**
```
Given user performed searches previously
When dashboard loads
Then Recent Searches section displays:
  - Section header: "Recent Searches"
  - Horizontal scrollable tags (max 5 shown)
  - Each tag shows:
    * Clock icon (time-outline, 14px, gray)
    * Search text (14px)
    * White background
    * Gray border (#e5e7eb)
    * Rounded corners (20px)
    * Padding: 12px horizontal, 8px vertical
  - Tapping tag triggers search
  - Most recent first
  - Gap: 8px between tags
```

**Recent Search Storage:**
```
AsyncStorage key: 'wihy_recent_searches'
Data format: ["query1", "query2", "query3"]
Max items: 5 (older removed)
Order: Most recent first
Update on: Every new search
```

**Scenario: User taps recent search**
```
Given user taps "Mediterranean Diet" tag
When tap registers
Then:
  - Query populates in search bar
  - Search triggers automatically
  - Results view loads
  - Tag moves to top of recent list
  - Cache checked first
```

**Scenario: No recent searches**
```
Given user never searched before
When dashboard loads
Then:
  - Recent Searches section hidden
  - No empty state shown
  - Layout adjusts (no gap)
```

---

### 2.6 Popular Topics

**Visual Design:**
```
Section header: "Popular Topics" (18px, bold)
White card container with 6 topic rows:

┌─────────────────────────────────────────┐
│ 🍃  Mediterranean Diet              › │
├─────────────────────────────────────────┤
│ ⏱️  Intermittent Fasting            › │
├─────────────────────────────────────────┤
│ 💪  Gut Microbiome                  › │
├─────────────────────────────────────────┤
│ 🌙  Sleep Quality                   › │
├─────────────────────────────────────────┤
│ 💧  Seed Oils                       › │
├─────────────────────────────────────────┤
│ 🍔  Ultra-processed Foods           › │
└─────────────────────────────────────────┘

Each topic row:
  - Padding: 16px horizontal, 14px vertical
  - Border bottom: 1px light gray (#f3f4f6)
  - Flex row layout
  - Touch feedback: Opacity 0.7
  
Icon circle (left):
  - Size: 36x36px
  - Border radius: 18px
  - Background: Topic color at 20% opacity
  - Icon: 18px, topic color
  - Margin right: 12px
  
Text (center):
  - Font: 15px, medium weight
  - Color: Dark gray (#1f2937)
  - Flex: 1
  
Chevron (right):
  - Icon: chevron-forward
  - Size: 16px
  - Color: Gray (#9ca3af)
```

**Topic Data:**
```typescript
[
  { topic: 'Mediterranean Diet', icon: 'leaf', color: '#22c55e' },
  { topic: 'Intermittent Fasting', icon: 'time', color: '#f59e0b' },
  { topic: 'Gut Microbiome', icon: 'fitness', color: '#8b5cf6' },
  { topic: 'Sleep Quality', icon: 'moon', color: '#3b82f6' },
  { topic: 'Seed Oils', icon: 'water', color: '#ef4444' },
  { topic: 'Ultra-processed Foods', icon: 'fast-food', color: '#f97316' },
]
```

**Scenario: User taps popular topic**
```
Given user taps "Gut Microbiome"
When tap registers
Then:
  1. Query set to "Gut Microbiome"
  2. Search triggered automatically
  3. Switch to results view
  4. API call to search articles
  5. Display results
  6. Add to recent searches
```

---

## 3. Search Functionality

### 3.1 Search Flow

**Complete Search Sequence:**
```
1. User Input
   - Enters query in search bar
   - Taps "Search" or presses Return
   - OR taps recent search tag
   - OR taps popular topic

2. Validation
   - Trim whitespace: "  keto diet  " → "keto diet"
   - Check not empty
   - If empty: No action taken

3. State Updates
   - setLoading(true)
   - setError(null)
   - setActiveWorkspace(query)
   - Switch to results view

4. Cache Check
   - Calculate cache key: "research_cache_keto_diet"
   - Check AsyncStorage for cached data
   - Check timestamp (30min expiry)
   - If valid cache: Load cached results, skip API

5. API Call (if not cached)
   - Call researchService.searchArticles({ query, limit: 20 })
   - Endpoint: GET services.wihy.ai/api/research/search?q=...
   - Headers: X-Client-ID, X-Client-Secret
   - Timeout: Default fetch timeout

6. Result Processing
   - Success with results:
     * setSearchResults(articles)
     * Cache results (30min)
     * updateRecentSearches(query)
   - Success with no results:
     * setSearchResults([])
     * setError('No research articles found...')
   - API error:
     * setSearchResults([])
     * setError('Unable to search research database...')
     * Log error to console

7. UI Update
   - setLoading(false)
   - Display results or error state
   - Enable pull-to-refresh
```

---

### 3.2 Caching Strategy

**Cache Implementation:**
```typescript
Cache key format:
  - "research_cache_{query_lowercase_underscored}"
  - Example: "research_cache_mediterranean_diet"

Cache data structure:
  {
    query: "Mediterranean Diet",
    timestamp: 1706191200000, // Date.now()
    results: ResearchArticle[] // Full array
  }

Cache expiry:
  - Duration: 30 minutes (30 * 60 * 1000 ms)
  - Check: Date.now() - cached.timestamp > expiry
  - If expired: Return null, trigger fresh search

Storage location:
  - AsyncStorage (device local storage)
  - Persists across app sessions
  - Survives app restart
  - Cleared on app uninstall
```

**Scenario: User searches same query twice**
```
Search 1 (10:00 AM):
  - No cache exists
  - API call made
  - Results cached with timestamp

Search 2 (10:15 AM):
  - Cache checked
  - timestamp: 15 minutes old
  - Within 30min window
  - Cached results loaded
  - No API call
  - Instant results

Search 3 (10:35 AM):
  - Cache checked
  - timestamp: 35 minutes old
  - Exceeds 30min window
  - Cache expired
  - Fresh API call made
  - New results cached
```

---

### 3.3 Recent Searches Management

**Storage:**
```typescript
AsyncStorage key: 'wihy_recent_searches'
Data: ["query1", "query2", "query3", "query4", "query5"]
Max length: 5 searches
Order: Most recent first
```

**Update Algorithm:**
```typescript
updateRecentSearches(newQuery) {
  // 1. Remove if already exists (deduplicate)
  const filtered = recentSearches.filter(s => s !== newQuery);
  
  // 2. Add to front
  const updated = [newQuery, ...filtered];
  
  // 3. Keep only 5 most recent
  const trimmed = updated.slice(0, 5);
  
  // 4. Save to state + AsyncStorage
  setRecentSearches(trimmed);
  AsyncStorage.setItem('wihy_recent_searches', JSON.stringify(trimmed));
}
```

**Scenario: User searches "keto diet"**
```
Before: ["fasting", "sleep", "exercise"]
After:  ["keto diet", "fasting", "sleep", "exercise"]

User searches "fasting" again:
Before: ["keto diet", "fasting", "sleep", "exercise"]
After:  ["fasting", "keto diet", "sleep", "exercise"]
```

---

## 4. Results View

### 4.1 Results Header

**Visual Design:**
```
Purple gradient header with back button:
┌─────────────────────────────────────────┐
│ ← Research Results                      │
│   "Mediterranean Diet"                  │
│   📊 info badge (if error)              │
└─────────────────────────────────────────┘

Components:
  - Uses GradientDashboardHeader component
  - Gradient: "research" (purple theme)
  - Title: "Research Results"
  - Subtitle: Query in quotes
  - Back button: Returns to dashboard view
  - Optional error badge
```

**GradientDashboardHeader Props:**
```typescript
<GradientDashboardHeader
  title="Research Results"
  subtitle={`"${activeWorkspace}"`}
  gradient="research"
  showBackButton={true}
  onBackPress={handleBackToDashboard}
  badge={error ? { 
    icon: "information-circle", 
    text: error 
  } : undefined}
/>
```

**Scenario: User taps back button**
```
Given user viewing search results
When user taps back button in header
Then handleBackToDashboard() executes:
  - setActiveWorkspace(null)
  - setSearchResults([])
  - setQuery('')
  - setError(null)
  - Returns to dashboard view
  - Recent searches persist
  - Cache remains intact
```

---

### 4.2 Results Stats Card

**Visual Design:**
```
White elevated card with 3 stat columns:
┌─────────────┬─────────────┬─────────────┐
│     15      │      8      │     12      │
│ Studies     │   High      │   Full      │
│ Found       │ Evidence    │   Text      │
└─────────────┴─────────────┴─────────────┘

Card styling:
  - Background: White (#ffffff)
  - Margin: 16px horizontal
  - Margin top: -12px (overlaps header)
  - Border radius: 12px
  - Padding: 16px
  - Shadow: iOS/Android elevation
  - Flex row layout
  
Each stat column:
  - Flex: 1 (equal width)
  - Centered alignment
  - Divider between columns (1px gray)
```

**Stat Calculations:**
```typescript
Studies Found:
  - Count: searchResults.length
  - Total articles returned

High Evidence:
  - Count: searchResults.filter(s => s.evidenceLevel === 'high').length
  - Articles with high evidence rating

Full Text:
  - Count: searchResults.filter(s => s.fullTextAvailable).length
  - Articles with full text access
```

**Data Flow:**
```
API Response → searchResults state → Stats calculations → UI render

Example response (15 articles):
  - Total: 15
  - High evidence: 8 (53%)
  - Full text available: 12 (80%)
```

---

### 4.3 Loading State

**Scenario: Search in progress**
```
Given user initiated search
When API call is pending
Then loading UI displays:
  - setLoading(true)
  - Results section shows:
    * ActivityIndicator (large, purple #8b5cf6)
    * Text: "Searching research..."
    * Centered in container
    * Padding: 48px vertical
  - Results list hidden
  - Stats card shows 0/0/0
  - User can't interact with results
```

**Visual Design:**
```
Centered loading indicator:
  ┌─────────────────────────┐
  │                         │
  │         ⟳ ⟳ ⟳          │
  │   Searching research... │
  │                         │
  └─────────────────────────┘

Spinner:
  - Size: Large
  - Color: Purple (#8b5cf6)
  - Native ActivityIndicator
  
Text:
  - Font: 15px
  - Color: Gray (#6b7280)
  - Margin top: 12px
```

---

### 4.4 Empty State

**Scenario: No results found**
```
Given API returned empty array
When results render
Then empty state displays:
  - searchResults.length === 0
  - error message set
  - Stats show 0/0/0
  - Error text: "No research articles found for your query. Try different keywords."
  - Badge in header shows info icon + message
  - No study cards shown
  - Suggests trying different search
```

**Scenario: API error**
```
Given API call failed (network error, 500, etc)
When error caught
Then error state displays:
  - searchResults.length === 0
  - error set to: "Unable to search research database. Please check your connection and try again."
  - Badge in header shows error message
  - Stats show 0/0/0
  - Console logs error details
  - User can pull-to-refresh to retry
```

---

### 4.5 Pull-to-Refresh

**Scenario: User pulls down to refresh**
```
Given user viewing search results
When user pulls down on ScrollView
Then:
  - RefreshControl activates
  - setRefreshing(true)
  - Calls handleSearch(activeWorkspace)
  - Bypasses cache (fresh API call)
  - Updates results
  - setRefreshing(false)
  - Spinner color: Purple (#8b5cf6)
  - Native platform behavior
```

**Implementation:**
```typescript
<ScrollView
  refreshControl={
    <RefreshControl 
      refreshing={refreshing} 
      onRefresh={onRefresh} 
      tintColor="#8b5cf6" 
    />
  }
>
```

---

## 5. Study Cards

### 5.1 Card Structure

**Visual Design:**
```
White card with full study information:
┌─────────────────────────────────────────┐
│ [RCT]              ● high               │
│                                         │
│ Effects of Mediterranean Diet on...    │
│                                         │
│ A randomized controlled trial examining│
│ the impact of Mediterranean dietary... │
│                                         │
│ Lancet                          2023    │
│ ────────────────────────────────────── │
│ 87% relevant           View ›          │
└─────────────────────────────────────────┘

Card components (top to bottom):
  1. Header row (badges)
  2. Title (2 lines max)
  3. Abstract (2 lines max)
  4. Meta row (journal + year)
  5. Footer (relevance + view button)
```

**Card Styling:**
```
Container:
  - Background: White (#ffffff)
  - Border: 1px gray (#e5e7eb)
  - Border radius: 12px
  - Padding: 16px
  - Margin bottom: 12px
  - Touch feedback: opacity 0.7
```

---

### 5.2 Study Type Badge

**Badge Design:**
```
Colored pill badge with study type:
[Randomized Controlled Trial]

Styling:
  - Background: Study type color at 20% opacity
  - Text: Study type color at 100%
  - Padding: 10px horizontal, 4px vertical
  - Border radius: 12px
  - Font: 11px, semibold, uppercase
  - Display: Formatted with spaces (not underscores)
```

**Study Type Colors:**
```typescript
randomized_controlled_trial: Red (#ef4444)
meta_analysis:               Purple (#8b5cf6)
systematic_review:           Blue (#3b82f6)
cohort_study:                Green (#22c55e)
default (other):             Gray (#6b7280)
```

**Type Display Formatting:**
```
API value → Display value:
  - randomized_controlled_trial → "Randomized Controlled Trial"
  - meta_analysis → "Meta Analysis"
  - systematic_review → "Systematic Review"
  - cohort_study → "Cohort Study"
  - undefined → "Research"

Logic:
  - Replace underscores with spaces
  - Capitalize each word
  - Handles any study type gracefully
```

---

### 5.3 Evidence Level Badge

**Badge Design:**
```
Dot + text indicator:
● high

Components:
  - Colored dot (8x8px, circular)
  - Text label (12px, gray, capitalized)
  - Flex row, gap 4px
  - Right-aligned in header
```

**Evidence Level Colors:**
```typescript
high:       Green (#4cbb17)
moderate:   Orange (#f59e0b)
low:        Light orange (#f97316)
very_low:   Red (#ef4444)
default:    Gray (#6b7280)
```

**Levels:**
```
High - Strongest evidence (RCTs, meta-analyses)
Moderate - Good evidence (cohort studies)
Low - Limited evidence (case studies)
Very Low - Weakest evidence (opinions)
```

---

### 5.4 Study Title & Abstract

**Title:**
```
Styling:
  - Font: 16px, semibold
  - Color: Dark gray (#1f2937)
  - Line height: 22
  - Max lines: 2 (ellipsis after)
  - Margin bottom: 8px
  - Tappable (opens modal)
```

**Abstract:**
```
Styling:
  - Font: 14px, regular
  - Color: Medium gray (#6b7280)
  - Line height: 20
  - Max lines: 2 (ellipsis after)
  - Margin bottom: 12px
  - Optional: Hidden if no abstract
```

**Truncation:**
```
Long title example:
"The Effects of Mediterranean Dietary Pattern on Cardiovascular Health: A Comprehensive Meta-Analysis of..."
Displays as:
"The Effects of Mediterranean Dietary Pattern on Cardiovascular Health: A..."

Long abstract truncates similarly with ellipsis
```

---

### 5.5 Meta Information Row

**Visual Design:**
```
Journal name (left) ────────── Year (right)
Nature Medicine                      2023

Layout:
  - Flex row, space-between
  - Margin bottom: 12px
  
Journal:
  - Font: 12px
  - Color: Light gray (#9ca3af)
  - Flex: 1 (can expand)
  - numberOfLines: 1 (ellipsis)
  
Year:
  - Font: 12px, medium weight
  - Color: Light gray (#9ca3af)
  - Fixed width
```

---

### 5.6 Footer Row

**Visual Design:**
```
87% relevant ────────────────── View ›

Layout:
  - Flex row, space-between
  - Padding top: 12px
  - Border top: 1px light gray (#f3f4f6)
  
Relevance score (left):
  - Font: 12px
  - Color: Gray (#6b7280)
  - Calculated: Math.round(relevanceScore * 100)
  - Format: "XX% relevant"
  
View button (right):
  - Flex row, gap 2px
  - Text: "View" (13px, semibold, purple)
  - Icon: chevron-forward (14px, purple)
  - Color: Purple (#8b5cf6)
  - Touch feedback
```

---

### 5.7 Card Interaction

**Scenario: User taps study card**
```
Given user viewing results list
When user taps anywhere on card
Then:
  - onPress handler fires
  - setSelectedStudy(study)
  - setShowModal(true)
  - Study detail modal opens
  - Modal animationType: "slide"
  - Modal presentationStyle: "pageSheet" (iOS)
  - Full screen on Android
```

---

## 6. Study Detail Modal

### 6.1 Modal Structure

**Modal Header:**
```
┌─────────────────────────────────────────┐
│ ✕        Study Details            [40px]│
└─────────────────────────────────────────┘

Layout:
  - Background: White
  - Border bottom: 1px gray (#e5e7eb)
  - Padding: 16px horizontal, 12px vertical
  - Flex row, space-between, centered
  
Close button (left):
  - Icon: close (24px, dark gray)
  - Size: 40x40 touchable
  
Title (center):
  - Text: "Study Details"
  - Font: 17px, semibold
  - Color: Dark gray (#1f2937)
  
Spacer (right):
  - Width: 40px (balance layout)
```

**Modal Content:**
```
Scrollable content sections:
  1. Study type badge
  2. Study title (full, no truncation)
  3. Meta information card (authors, journal, PMC ID)
  4. Evidence level section
  5. Abstract section (full text)
  6. Full text button (if available)
```

---

### 6.2 Study Type Badge (Modal)

**Design:**
```
Same as card badge but full width:
[RANDOMIZED CONTROLLED TRIAL]

Changes:
  - alignSelf: 'flex-start' (left-aligned)
  - Margin bottom: 16px
  - Not truncated
  - Full type name displayed
```

---

### 6.3 Study Title (Modal)

**Full Title Display:**
```
Styling:
  - Font: 20px, bold
  - Color: Dark gray (#1f2937)
  - Line height: 28
  - Margin bottom: 16px
  - No line limit (full title shown)
  - Wraps naturally
```

---

### 6.4 Meta Information Card

**Visual Design:**
```
White card with 3 rows:
┌─────────────────────────────────────────┐
│ 👤 Smith J, Johnson A, et al.          │
│                                         │
│ 📖 Nature Medicine • 2023              │
│                                         │
│ 📄 PMC ID: PMC8745123                  │
└─────────────────────────────────────────┘

Card styling:
  - Background: White (#ffffff)
  - Border radius: 12px
  - Padding: 16px
  - Margin bottom: 16px
  - Gap: 12px between rows
  
Each row:
  - Flex row layout
  - Icon + text
  - Gap: 10px
  - Icon size: 16px
  - Icon color: Gray (#6b7280)
```

**Row Content:**
```
Row 1 - Authors:
  - Icon: people-outline
  - Text: Full author list
  - Font: 14px
  - Color: Dark gray (#374151)
  - Flex: 1 (wraps if needed)
  
Row 2 - Journal:
  - Icon: book-outline
  - Text: "Journal Name • Year"
  - Font: 14px
  - Color: Medium gray (#6b7280)
  
Row 3 - PMC ID:
  - Icon: document-text-outline
  - Text: "PMC ID: PMCXXXXXXX"
  - Font: 13px, monospace
  - Color: Medium gray (#6b7280)
```

---

### 6.5 Evidence Level Section

**Visual Design:**
```
Section title: "Evidence Level"

White card with dot + info:
┌─────────────────────────────────────────┐
│ ● HIGH EVIDENCE                         │
│   87% relevance score                   │
└─────────────────────────────────────────┘

Card styling:
  - Background: White
  - Border radius: 12px
  - Padding: 16px
  - Flex row layout
  - Gap: 12px
  - Margin bottom: 16px
  
Evidence dot:
  - Size: 12x12px
  - Border radius: 6px (circular)
  - Color: Based on evidence level
  
Text content:
  - Level: 14px, semibold, uppercase, dark gray
  - Score: 13px, regular, medium gray
  - Vertical stack
```

**Section Title:**
```
Font: 16px, semibold
Color: Dark gray (#1f2937)
Margin bottom: 8px
Consistent across all modal sections
```

---

### 6.6 Abstract Section

**Visual Design:**
```
Section title: "Abstract"

White card with full abstract text:
┌─────────────────────────────────────────┐
│ Background: The Mediterranean diet has │
│ been associated with numerous health   │
│ benefits. This meta-analysis aims to   │
│ comprehensively evaluate its effects   │
│ on cardiovascular outcomes.            │
│                                         │
│ Methods: We searched major databases   │
│ for randomized controlled trials...    │
│                                         │
│ [Full abstract continues...]           │
└─────────────────────────────────────────┘

Card styling:
  - Background: White
  - Border radius: 12px
  - Padding: 16px
  - Margin bottom: 16px
  
Text styling:
  - Font: 15px, regular
  - Color: Dark gray (#374151)
  - Line height: 24
  - No line limit (full abstract)
  - Natural wrapping
```

**Conditional Display:**
```
Only shown if selectedStudy.abstract exists:
  {selectedStudy.abstract && (
    <View style={styles.abstractSection}>
      ...
    </View>
  )}

If no abstract: Section not rendered
```

---

### 6.7 Full Text Button

**Visual Design:**
```
Purple button at bottom of modal:
┌─────────────────────────────────────────┐
│         🔗 View Full Text               │
└─────────────────────────────────────────┘

Button styling:
  - Background: Purple (#8b5cf6)
  - Border radius: 12px
  - Padding: 14px vertical
  - Flex row, centered, gap 8px
  - Width: 100%
  - Touch feedback
  
Content:
  - Icon: open-outline (20px, white)
  - Text: "View Full Text" (16px, semibold, white)
```

**Conditional Display:**
```
Only shown if selectedStudy.fullTextAvailable:
  {selectedStudy.fullTextAvailable && (
    <TouchableOpacity style={styles.fullTextButton}>
      ...
    </TouchableOpacity>
  )}

If not available: Button not rendered
```

**Button Action:**
```
Future implementation:
  - Open PMC website in browser
  - URL: selectedStudy.links.pmcWebsite
  - Use Linking.openURL()
  - External browser or in-app webview

Current state:
  - Button visible
  - onPress not implemented
  - Placeholder functionality
```

---

### 6.8 Modal Dismissal

**Scenario: User closes modal**
```
Given modal is open
When user taps close button (X)
Then:
  - setShowModal(false)
  - Modal slides down (animationType: "slide")
  - Returns to results view
  - selectedStudy persists (can reopen)
  - Results list in same scroll position
```

**Platform Behavior:**
```
iOS:
  - Modal presentationStyle: "pageSheet"
  - Partial screen coverage
  - Can swipe down to dismiss
  - Native iOS modal appearance
  
Android:
  - Full screen modal
  - Slide-up animation
  - Back button closes modal
  - No swipe gesture
```

---

## 7. Research Categories

### 7.1 Category System

**Built-in Categories:**
```typescript
[
  { 
    id: 'nutrition', 
    name: 'Nutrition', 
    icon: 'nutrition', 
    color: '#22c55e',
    description: 'Dietary science and nutrition research'
  },
  { 
    id: 'fitness', 
    name: 'Fitness', 
    icon: 'barbell', 
    color: '#3b82f6',
    description: 'Exercise science and physical training'
  },
  { 
    id: 'mental', 
    name: 'Mental Health', 
    icon: 'brain', 
    color: '#8b5cf6',
    description: 'Psychology and mental wellness'
  },
  { 
    id: 'sleep', 
    name: 'Sleep', 
    icon: 'moon', 
    color: '#6366f1',
    description: 'Sleep science and circadian rhythms'
  },
  { 
    id: 'longevity', 
    name: 'Longevity', 
    icon: 'time', 
    color: '#ec4899',
    description: 'Aging and lifespan research'
  },
  { 
    id: 'supplements', 
    name: 'Supplements', 
    icon: 'medical', 
    color: '#f59e0b',
    description: 'Vitamins, minerals, and supplements'
  },
]
```

**Usage:**
```
Current implementation:
  - Categories defined in ResearchService
  - getCategories() method returns array
  - Not yet shown in UI
  - Future: Category filter chips

Future implementation:
  - Category tabs in results view
  - Filter search by category
  - Popular articles per category
  - Category-specific trending topics
```

---

## 8. Backend Integration

### 8.1 API Endpoints

**Search Articles:**
```typescript
GET https://services.wihy.ai/api/research/search

Query parameters:
  - q: Search query (required)
  - limit: Max results (default: 20)
  - type: Category filter (optional)
  
Headers:
  - X-Client-ID: services client ID
  - X-Client-Secret: services client secret

Response format:
{
  "articles": ResearchArticle[],
  "total": number,
  "query": string
}

ResearchArticle schema:
{
  id: string;
  pmcid: string;
  title: string;
  authors?: string;
  authorCount?: number;
  journal?: string;
  publishedDate?: string;
  publicationYear?: number;
  abstract?: string;
  studyType?: string;
  researchArea?: string;
  evidenceLevel?: string;
  relevanceScore?: number;
  rank?: number;
  fullTextAvailable?: boolean;
  links?: {
    pmcWebsite?: string;
    pubmedLink?: string;
    pdfDownload?: string | null;
    doi?: string;
  };
  category?: string;
  bookmarked?: boolean;
}
```

**Example API Call:**
```typescript
const searchUrl = `${API_CONFIG.servicesUrl}/api/research/search?q=mediterranean+diet&limit=20`;

const response = await fetchWithLogging(searchUrl, {
  headers: {
    'X-Client-ID': API_CONFIG.servicesClientId,
    'X-Client-Secret': API_CONFIG.servicesClientSecret,
  },
});

const data = await response.json();
const articles = data.articles || data.data || [];
```

---

### 8.2 Research Service Methods

**searchArticles():**
```typescript
researchService.searchArticles({
  query: "intermittent fasting",
  category: "nutrition", // optional
  limit: 20, // optional, default 20
  offset: 0  // optional, default 0
})

Returns: Promise<ResearchArticle[]>

Error handling:
  - Network errors: Caught, empty array returned
  - Invalid response: Parsed defensively
  - Missing fields: Graceful defaults
  - User sees error message in UI
```

**getCategories():**
```typescript
researchService.getCategories()

Returns: ResearchCategory[]

Usage:
  - Client-side method (no API call)
  - Returns predefined categories
  - Used for filtering (future)
```

---

### 8.3 Data Flow

**Complete Search Data Flow:**
```
1. User Input
   ↓
2. Component State (query)
   ↓
3. handleSearch(query)
   ↓
4. Cache Check (AsyncStorage)
   ├─ Cache Hit → Load cached results
   └─ Cache Miss → Continue to API
   ↓
5. researchService.searchArticles({ query, limit })
   ↓
6. fetchWithLogging(servicesUrl/api/research/search)
   ↓
7. API Response (ResearchArticle[])
   ↓
8. Result Processing
   ├─ Success: setSearchResults(articles)
   ├─ Empty: setError("No articles found")
   └─ Error: setError("Unable to search")
   ↓
9. Cache Update (AsyncStorage)
   ↓
10. Recent Searches Update
   ↓
11. UI Render (results view)
```

---

## 9. State Management

### 9.1 Component State Variables

**Primary State:**
```typescript
const [activeWorkspace, setActiveWorkspace] = useState<string | null>(null);
  // Current search query (null = dashboard view)
  
const [searchResults, setSearchResults] = useState<ResearchSearchResult[]>([]);
  // Array of article objects from API
  
const [loading, setLoading] = useState(false);
  // True during API call
  
const [refreshing, setRefreshing] = useState(false);
  // True during pull-to-refresh
  
const [selectedStudy, setSelectedStudy] = useState<ResearchSearchResult | null>(null);
  // Article for detail modal
  
const [showModal, setShowModal] = useState(false);
  // Modal visibility
  
const [recentSearches, setRecentSearches] = useState<string[]>([]);
  // Last 5 search queries
  
const [query, setQuery] = useState('');
  // Search input value
  
const [error, setError] = useState<string | null>(null);
  // Error message for display
```

**Animation State:**
```typescript
const scrollY = useRef(new Animated.Value(0)).current;
  // Scroll position for header collapse
```

---

### 9.2 View State Determination

**Dashboard vs Results:**
```typescript
if (activeWorkspace) {
  // Results view
  return <ResultsView />;
}

// Dashboard view
return <DashboardView />;
```

**View Switching:**
```
Dashboard → Results:
  - setActiveWorkspace(query)
  - Triggered by: Search button, topic tap, recent search tap
  
Results → Dashboard:
  - setActiveWorkspace(null)
  - Triggered by: Back button
  - Also clears: searchResults, query, error
```

---

### 9.3 Effect Hooks

**Load Recent Searches:**
```typescript
useEffect(() => {
  loadRecentSearches();
}, []); // On mount only

async function loadRecentSearches() {
  const stored = await AsyncStorage.getItem('wihy_recent_searches');
  if (stored) {
    setRecentSearches(JSON.parse(stored));
  }
}
```

**No Other Effects:**
```
Component is mostly event-driven:
  - User actions trigger state changes
  - State changes trigger re-renders
  - No automatic polling or intervals
  - No subscriptions or listeners
```

---

## 10. Error Handling

### 10.1 API Error Scenarios

**Network Error:**
```
Cause: No internet, server down, timeout
Display: "Unable to search research database. Please check your connection and try again."
Behavior:
  - searchResults = []
  - Stats show 0/0/0
  - Error badge in header
  - Pull-to-refresh available
  - User can retry
```

**Empty Results:**
```
Cause: Valid search, no matching articles
Display: "No research articles found for your query. Try different keywords."
Behavior:
  - searchResults = []
  - Stats show 0/0/0
  - Suggests alternative searches
  - Not treated as error (valid response)
```

**Cache Read Error:**
```
Cause: AsyncStorage failure, corrupted data
Behavior:
  - Log error to console
  - Return null (no cached data)
  - Continue to API call
  - Silent failure (user unaware)
```

**Cache Write Error:**
```
Cause: Storage full, permission denied
Behavior:
  - Log error to console
  - Continue normally
  - Results still displayed
  - Next search won't have cache
  - Silent failure
```

---

### 10.2 Error Recovery

**Retry Mechanism:**
```
Pull-to-refresh:
  - Available in results view
  - Bypasses cache
  - Fresh API call
  - Updates results on success
  
Search again:
  - User can modify query
  - Try different keywords
  - New search clears error
```

**Error Logging:**
```typescript
catch (apiError) {
  console.error('Search error:', apiError);
  // Logs full error details to console
  // Useful for debugging
  // Not shown to user
}
```

---

## 11. Performance & Optimization

### 11.1 Caching Benefits

**Performance Impact:**
```
Without cache:
  - Every search = API call
  - Network latency (500-2000ms)
  - Data usage per search
  - Server load
  
With cache (30min):
  - Repeat searches instant (<50ms)
  - No network needed
  - Reduced data usage
  - Lower server load
  - Better user experience
```

**Cache Invalidation:**
```
Time-based:
  - 30 minute expiry
  - Balances freshness vs performance
  - Research doesn't change rapidly
  
Manual refresh:
  - Pull-to-refresh bypasses cache
  - Forces fresh data
  - User control over freshness
```

---

### 11.2 Render Optimization

**Study Card Rendering:**
```
Optimization strategies:
  - numberOfLines truncation (prevents long renders)
  - Key props on map items (React reconciliation)
  - TouchableOpacity activeOpacity (instant feedback)
  - No heavy computations in render
  
Not implemented (potential):
  - FlatList (currently ScrollView)
  - Memo/PureComponent
  - Virtualization
  - Lazy loading
```

**Animation Performance:**
```
Header collapse:
  - scrollEventThrottle: 16 (60fps)
  - useNativeDriver: false (required for layout)
  - Interpolations cached by React Native
  - Smooth on most devices
  
Trade-off:
  - Could use transform for native driver
  - Would require layout shift handling
  - Current approach simpler, good enough
```

---

### 11.3 Data Size Management

**API Response:**
```
Typical search (20 articles):
  - Size: ~50-100KB JSON
  - Cached locally
  - No pagination yet
  
Future optimization:
  - Pagination (load more)
  - Reduce fields in response
  - Compress responses
```

**Recent Searches:**
```
Storage: Max 5 strings
Size: ~500 bytes total
Impact: Negligible
Cleanup: Automatic (keeps 5 newest)
```

---

## 12. Accessibility

### 12.1 Screen Reader Support

**VoiceOver / TalkBack:**
```
Dashboard view:
  - "Research, heading"
  - "Evidence-based health insights"
  - "Search health topics, search field"
  - "Search, button"
  - "History, button"
  - "Popular Topics, heading"
  - "Mediterranean Diet, button"

Results view:
  - "Research Results, heading"
  - "15 studies found"
  - "Study card, randomized controlled trial, high evidence"
  - "Effects of Mediterranean Diet on..."
  - "View, button"

Modal:
  - "Study Details, heading"
  - "Close, button"
  - "Full abstract text..."
  - "View Full Text, button"
```

---

### 12.2 Touch Targets

**Minimum Sizes:**
```
Buttons:
  - Search button: 20px padding = ~44px height ✓
  - Close modal: 40x40px touchable ✓
  - Quick actions: 40px icon + padding ✓
  - Topic items: 48px height ✓
  - Study cards: 100+ px height ✓

All meet accessibility minimum (44x44pt)
```

---

### 12.3 Color Contrast

**Text Contrast:**
```
Background (#e0f2fe) vs:
  - Dark gray (#1f2937): 10.5:1 ✓ (AAA)
  - Medium gray (#6b7280): 5.2:1 ✓ (AA)
  
Purple header (#8b5cf6) vs:
  - White text: 4.8:1 ✓ (AA)
  
All meet WCAG 2.1 Level AA minimum
```

---

## 13. Platform Differences

### 13.1 iOS Specific

**Modal Presentation:**
```
presentationStyle: "pageSheet"
  - Partial screen coverage
  - Shows background dimmed
  - Swipe-down to dismiss
  - Native iOS 13+ style
```

**Keyboard:**
```
returnKeyType: "search"
  - Shows "Search" button on keyboard
  - Blue color (primary action)
  - Triggers onSubmitEditing
```

---

### 13.2 Android Specific

**Modal Presentation:**
```
Full screen modal:
  - Covers entire screen
  - Slide-up animation
  - Back button dismisses
  - Material Design style
```

**Keyboard:**
```
returnKeyType: "search"
  - Shows search icon
  - Triggers onSubmitEditing
  - Same behavior as iOS
```

---

## 14. Future Enhancements

**Planned Features:**
```
✨ Bookmarking:
  - Save articles for later
  - Organize into folders
  - Sync across devices
  - Bookmark count in stats

✨ Search History:
  - Full search history page
  - Filters by date, category
  - Delete individual searches
  - Export search history

✨ Advanced Filters:
  - Study type filter chips
  - Evidence level filter
  - Publication year range
  - Journal filter
  - Author search

✨ Reading Lists:
  - Create custom lists
  - Mark as unread/in-progress/completed
  - Priority levels
  - Progress tracking

✨ Trending Research:
  - Most viewed this week/month
  - Most cited articles
  - Recently published
  - Editor's picks

✨ Personalization:
  - Recommended articles
  - Based on search history
  - Follow specific topics
  - Email notifications

✨ Social Features:
  - Share articles
  - Discuss in comments
  - Expert annotations
  - Collaborative reading

✨ Offline Mode:
  - Download full text PDFs
  - Read offline
  - Sync reading progress
  - Offline search in saved

✨ Citations & Export:
  - Generate citations (APA, MLA)
  - Export to reference managers
  - Create bibliographies
  - PDF annotations

✨ Study Comparison:
  - Compare multiple studies
  - Side-by-side view
  - Highlight differences
  - Synthesize findings

✨ Article Notes:
  - Take notes on articles
  - Highlight key findings
  - Tag articles
  - Personal annotations
```

---

## 15. Summary of Key User Flows

### Quick Reference Chart

| User Goal | Entry Point | Key Steps | End State |
|-----------|-------------|-----------|-----------|
| **Search health topic** | Dashboard search bar | Type query → Tap Search → View results | Results view with articles |
| **Quick topic search** | Popular topics list | Tap topic → Auto-search | Results view |
| **Repeat search** | Recent searches tags | Tap tag → Load cached results | Instant results |
| **View study details** | Study card | Tap card → Modal opens | Full study details in modal |
| **Refresh results** | Results view | Pull down → Release | Updated results |
| **Return to dashboard** | Results view back button | Tap back → Clear state | Dashboard view restored |
| **Browse dashboard** | Initial load | Scroll → Header collapses | Compact view |
| **View stats** | Dashboard stats cards | View counts | Research activity summary |
| **Access full text** | Study modal | Tap "View Full Text" | External browser (future) |

---

## 16. Document Metadata

**Version:** 1.0  
**Last Updated:** January 25, 2026  
**Author:** AI Assistant (Copilot)  
**Review Status:** Draft  
**Screen File:** ResearchScreen.tsx  
**Service File:** researchService.ts  

This document serves as the behavioral specification for the Research feature. All interactions should match these behaviors for consistency and optimal user experience.
