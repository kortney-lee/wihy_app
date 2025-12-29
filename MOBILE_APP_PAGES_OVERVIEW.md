# Mobile Application - Complete Pages & Dashboards Overview

## Table of Contents
- [Core Pages (All Users)](#core-pages-all-users)
- [Role-Specific Dashboards](#role-specific-dashboards)
- [Additional Pages](#additional-pages)
- [Administrative/Tracking Pages](#administrativetracking-pages)
- [Navigation Structure](#navigation-structure)
- [User Workflows](#user-workflows)

---

## Core Pages (All Users)

### 1. VHealthSearch (Home/Landing)
**Route**: `/`  
**Purpose**: Primary entry point for all health queries  
**For**: All users  
**Features**:
- Text search with auto-suggestions
- Voice input (speech-to-text)
- Camera/barcode scanning
- Quick action buttons (symptoms, nutrition, medication, assessment)
- Animated search interface with 5-color gradient

### 2. SearchResults
**Route**: `/results?query=[searchQuery]`  
**Purpose**: Display AI-generated health analysis  
**For**: All users after search or scan  
**Features**:
- Query summary and AI confidence score
- Key findings and health recommendations
- Supporting data cards and charts
- Related health metrics
- Action buttons (ask follow-up, get details, save to profile)
- Auto-opens FullChat for immediate conversation

### 3. FullChat (AI Assistant)
**Route**: `/chat?context=[currentContext]` (modal overlay)  
**Purpose**: Primary conversational AI interface  
**For**: All users  
**Features**:
- Real-time health assistance and advice
- Multi-modal input (text, voice, image)
- Context-aware conversations
- Auto-opens after any scan with analysis
- Image analysis integration
- Quick reply suggestions
- Typing indicators and streaming responses

**Special Behavior**: Automatically opens after food/medication scans with analysis as conversation starter

### 4. Dashboard (Health Metrics)
**Route**: `/dashboard?filter=[healthCategory]`  
**Purpose**: Comprehensive health data visualization and tracking  
**For**: All users  
**Features**:
- Health score summary and date range selector
- **Primary Health Cards**:
  - Weight/BMI trends
  - Blood pressure history
  - Heart rate zones
  - Sleep quality metrics
- **Nutrition Cards**:
  - Calorie balance
  - Macro/micronutrient tracking
  - Water intake
- **Activity Cards**:
  - Steps and movement
  - Exercise sessions
  - Recovery metrics
- **Custom Cards**:
  - Recent AI analyses
  - Medication tracking
  - Symptom logs
- Floating "Ask AI about my health" button

### 5. Camera/Scan Interface
**Route**: `/scan?mode=[food|medication|document]`  
**Purpose**: Image capture and analysis for health-related items  
**For**: All users  
**Features**:
- Real-time camera feed with overlay guides
- **Scan Modes**:
  - Food/Nutrition scanning
  - Medication/Supplements scanning
  - Barcode recognition
  - Document capture (prescriptions, lab results)
- Auto-focus and touch-to-focus
- Batch processing support
- Immediate transition to FullChat with results

### 6. Profile/Settings
**Route**: `/profile`  
**Purpose**: User account and app management  
**For**: All users  
**Features**:
- Account management (login, logout, profile editing)
- Health profile (demographics, conditions, medications, allergies)
- App preferences (notifications, privacy, data sync)
- Connected services (health apps, wearables, healthcare providers)
- Data management (export, import, delete)
- Support and legal information

---

## Role-Specific Dashboards

### 7. Coach Dashboard
**Route**: `/coach`  
**Purpose**: Health coach client management system  
**For**: Health coaches, nutritionists, fitness trainers  

**Features**:
- **Client Management**:
  - Client list with search functionality
  - Client selection and profile viewing
  - Add new clients with contact information

- **Tabs per Client**:
  1. **Goals & Diets Tab**:
     - Goal setting and tracking
     - Diet preference selection (Keto, Paleo, Mediterranean, Vegan, etc.)
     - Diet goal configuration
     
  2. **Actions Tab**:
     - Action item creation and tracking
     - Priority setting
     - Status management (pending, in-progress, completed)
     - Weekly/daily action planning
     
  3. **Meals Tab**:
     - Multi-day meal program builder
     - Meal type organization (Breakfast, Lunch, Dinner, Snack)
     - Meal item creation with nutritional info
     - Serving size and notes
     - Tag management
     
  4. **Shopping Tab**:
     - Shopping list generation
     - Category organization (Produce, Protein, Dairy, Grains, etc.)
     - Item quantity and notes
     - Instacart integration option
     
  5. **Client View Tab**:
     - Preview of client's mobile view
     - Workout and meal plan display
     - Client perspective testing

- **Meal Program Components**:
  - Program title and description
  - Day-by-day meal planning
  - Meal item details (name, calories, macros, tags)
  - Nutrition calculator

### 8. Parent Dashboard
**Route**: `/parent`  
**Purpose**: Monitor family health and manage children's health data  
**For**: Parents managing children's health  

**CRITICAL GAPS IDENTIFIED**:
⚠️ **NO "Add Child" functionality** - Cannot create new child profiles (only displays hardcoded mock data)  
⚠️ **NO Edit capability** - Cannot modify child information, goals, or preferences  
⚠️ **NO Real data integration** - All data is static mock data (not connected to backend)  
⚠️ **NO Plan creation** - Cannot create meal plans or activity plans for children  
⚠️ **NO Shopping lists** - Missing shopping list generation for family meals  

**Missing Features Compared to Coach Dashboard**:
- No "Add Child" button (Coach has "Add Client" with modal)
- No child profile creation form
- No meal program builder for kids
- No workout/activity program builder
- No integration with Create Meals system
- No shopping list generation
- No action items or priorities system
- No plan templates

**Current Features (Limited to Display Only)**:
- View hardcoded child profiles (Jordan, Amira - mock data only)
- Child health metrics tracking (display only, not editable)
- Growth tracking (not implemented - mentioned in spec but missing)
- Medication reminders (not implemented)
- Appointment scheduling (not implemented)
- Immunization tracking (not implemented)
- School health records (not implemented)
- Emergency contacts (not implemented)
- Notes system (local state only, not persisted)

**What Actually Works Today**:
- Display 2 hardcoded kids with mock health data
- Switch between kids to view their info
- View 4 tabs: Overview, Food, Activity, Notes
- Add notes (local state only, lost on page refresh)
- View family summary stats (calculated from mock data)

**Required Updates to Match Coach Dashboard**:
1. **Add "Add Child" button** with modal
   - Child name, age, birth date
   - Primary health goal
   - Dietary restrictions/allergies
   - Activity level/sports interests
   - Growth metrics (height, weight)
   
2. **Implement Edit Child functionality**
   - Update profile information
   - Modify goals and preferences
   - Edit dietary tags and restrictions
   - Update growth measurements
   
3. **Create Meal Plans for Children**
   - Integration with Create Meals system
   - Age-appropriate portion sizes
   - Family meal coordination
   - Shopping list generation
   - Instacart integration
   
4. **Activity/Exercise Programs**
   - Age-appropriate workout plans
   - Sports and play activity tracking
   - Family fitness activities
   - Movement goal setting
   
5. **Backend Integration**
   - Replace mock data with Firebase/API
   - Save child profiles to database
   - Persist notes and observations
   - Store meal logs and activity data
   - Real-time updates
   
6. **Health Plan Builder**
   - Child-specific health goals
   - Dietary guidelines by age
   - Growth tracking charts
   - Action items and priorities
   - Progress monitoring

### 9. MyProgress Dashboard
**Route**: `/myprogress`  
**Purpose**: Personal health journey tracking  
**For**: Individual users tracking their health goals  

**Features**:
- Personal goals and achievements
- Progress visualization
- Workout programs and exercise tracking
- Meal plan adherence
- Streak tracking
- Progress charts and trends
- AI coaching insights
- Motivation and summary
- Check-in history
- Educational content

### 10. Intake/Consumption Dashboard
**Route**: `/intake`  
**Purpose**: Food and nutrition tracking  
**For**: Users tracking daily nutrition  

**Features**:
- Meal logging (breakfast, lunch, dinner, snacks)
- Calorie balance tracking
- Macro/micronutrient breakdown
- Water intake monitoring
- Receipt scanning for food items
- Nutrition analysis
- Daily/weekly/monthly summaries
- Food diary with timestamps

### 11. Research Dashboard
**Route**: `/research`  
**Purpose**: Evidence-based health research and studies  
**For**: Users seeking scientific health information  

**Features**:
- Research quality gauge
- Study type distribution charts
- Publication timeline visualization
- Evidence-based recommendations
- Research source tracking
- Medical disclaimer
- Scientific citation support

### 12. Fitness Dashboard
**Route**: `/fitness`  
**Purpose**: Exercise and activity tracking  
**For**: Users tracking workouts and physical activity  

**Features**:
- Workout session management
- Exercise program builder
- Recovery metrics tracking
- Steps and movement counting
- Heart rate zones
- Workout history
- Performance analytics
- Exercise library
- Custom workout creation

---

## Additional Pages

### 13. Coach Selection
**Route**: `/coach-selection`  
**Purpose**: Browse and select health coaches  
**For**: Users looking to hire a coach  

**Features**:
- Coach profile browsing
- Search and filter by specialty
- Coach ratings and reviews
- Specialties display (Weight Loss, Sports Nutrition, Meal Planning, etc.)
- Experience and certifications
- Pricing information
- Location and availability
- Bio and coaching philosophy
- Booking/connection workflow

### 14. Client Management
**Route**: `/client-management`  
**Purpose**: Advanced coach client management  
**For**: Health coaches  

**Features**:
- Client roster overview
- Client onboarding workflows
- Program assignment and tracking
- Progress monitoring
- Communication history
- Client notes and documentation
- Billing and payment tracking

### 15. Client Onboarding
**Route**: `/client-onboarding`  
**Purpose**: New client intake and setup  
**For**: Coaches onboarding new clients  

**Features**:
- Health questionnaire
- Goal setting wizard
- Initial health assessment
- Medical history collection
- Dietary preferences
- Fitness level evaluation
- Lifestyle assessment
- Program recommendations

### 16. Create Meals
**Route**: `/create-meals`  
**Purpose**: Meal planning and recipe management  
**For**: Coaches and users creating meal plans  

**Features**:
- Recipe builder
- Nutrition calculator
- Ingredient database
- Meal templates
- Portion size customization
- Dietary restriction filters
- Shopping list generation
- Meal prep instructions

### 17. Nutrition Facts
**Route**: `/nutritionfacts`  
**Purpose**: Detailed nutritional information display  
**For**: All users  

**Features**:
- Scanned food analysis results
- Nutrition label display
- Ingredient breakdown
- Allergen information
- Serving size calculator
- Macro/micro nutrient details
- Health recommendations
- Alternative suggestions

---

## Administrative/Tracking Pages

### 18. Tracking Dashboard
**Route**: `/tracking-dashboard`  
**Purpose**: Link performance and engagement tracking  
**For**: Partners/affiliates tracking referrals  

**Features**:
- Click tracking
- Conversion metrics
- Revenue attribution
- Link performance analytics
- Geographic distribution
- Time-based analysis

### 19. Manager Dashboard
**Route**: `/manager-dashboard`  
**Purpose**: Team and revenue management  
**For**: Managers overseeing coaches/teams  

**Features**:
- Team performance metrics
- Revenue tracking
- Coach productivity
- Client retention rates
- Team analytics
- Payout management

### 20. Engagement Dashboard
**Route**: `/engagement-dashboard`  
**Purpose**: User engagement metrics  
**For**: Platform administrators  

**Features**:
- User activity tracking
- Engagement rates
- Feature usage analytics
- Retention metrics
- User journey mapping
- Conversion funnel analysis

### 21. Monitoring Dashboard
**Route**: `/monitoring-dashboard`  
**Purpose**: System health and performance monitoring  
**For**: Technical administrators  

**Features**:
- System uptime tracking
- Performance metrics
- Error monitoring
- API health status
- Database performance
- Resource utilization

### 22. Partner Hub
**Route**: `/partner-hub`  
**Purpose**: Partner program management  
**For**: Business partners and affiliates  

**Features**:
- Partner portal access
- Marketing materials
- Commission tracking
- Performance reports
- Partner support resources

### 23. Payout Settings
**Route**: `/payout-settings`  
**Purpose**: Financial account and payout configuration  
**For**: Coaches, partners, affiliates  

**Features**:
- Payment method configuration
- Payout schedule settings
- Transaction history
- Tax information
- Banking details management

---

## Navigation Structure

### Bottom Tab Navigator (Always Present)

```
Tab 1: Search
├── Icon: Search/Magnifying Glass
├── Route: /
└── Default Active: Yes

Tab 2: Scan
├── Icon: Camera
├── Route: /scan
└── Action: Opens camera → Auto-opens FullChat with results

Tab 3: Chat
├── Icon: Chat Bubble
├── Route: /chat
└── Context-Aware: Highlights based on chat state

Tab 4: Dashboard
├── Icon: Chart/Graph
├── Route: /dashboard
└── Shows current health overview

Tab 5: Profile
├── Icon: User Avatar
├── Route: /profile
└── Account and settings access
```

### Modal Stack (Overlays)
- **FullChat**: Slides up from bottom, semi-transparent background
- **Camera Interface**: Full-screen capture interface
- **Image Processing**: Loading overlay during AI analysis
- **Settings/Preferences**: Slide-in panels
- **Error/Success Notifications**: Toast messages

---

## User Workflows

### Quick Health Query
```
Search Tab → Enter question → SearchResults → FullChat opens → Conversation continues
```

### Food Analysis via Scan
```
Scan Tab → Camera opens → Capture food image → AI Processing → 
FullChat auto-opens with analysis → User asks follow-up questions
```

### Barcode Scanning
```
Scan Tab → Camera opens → Scan barcode → Product identified → 
FullChat auto-opens with product info → Save to food diary
```

### Coach Managing Client
```
Coach Dashboard → Select client from list → Goals & Diets tab → 
Set goals and preferences → Meals tab → Build meal program → 
Shopping tab → Generate shopping list → Client View → Preview → Save
```

### Parent Tracking Child
```
Parent Dashboard → Select child → View health metrics → 
Add new data (weight, height, medication) → Set reminders → View trends
```

### Personal Fitness Journey
```
MyProgress Dashboard → View current goals → Update workout completion → 
Log meal adherence → View progress charts → Receive AI coaching insights
```

### Nutrition Tracking
```
Intake Dashboard → Log breakfast → Scan lunch receipt → 
Add dinner manually → Review daily totals → Check macro balance
```

### Research Health Topic
```
Search Tab → Enter health question → SearchResults → 
Verify with Evidence button → Research Dashboard → 
View studies and quality metrics → Read recommendations
```

---

## Key Design Principles

### Mobile-First Philosophy
- **Conversation-Driven**: AI chat is primary interaction method
- **Thumb-First Navigation**: All controls optimized for one-handed use
- **Progressive Disclosure**: Simple entry → Detailed analysis → Deep conversation
- **Context-Aware**: Interface adapts based on user location in journey

### Button Hierarchy
- **Primary (Blue)**: Most common/important actions (Analyze Nutrition, Ask Questions, Save)
- **Secondary (Gray/White)**: Supporting actions (Details, Evidence, Alternative options)
- **One Primary Per Screen**: Clear visual priority

### Scan-to-Chat Integration
All image scans (food, medication, barcode, document) automatically:
1. Process via AI
2. Open FullChat with analysis
3. Start conversation with results
4. Enable immediate follow-up questions

### Cross-Platform Support
- iOS: HealthKit, Siri Shortcuts, Apple Watch, Face ID
- Android: Google Fit, Google Assistant, Wear OS, Biometric Auth
- Responsive design for tablets and various screen sizes

---

## Implementation Status

### Live Pages (Web)
- ✅ VHealthSearch
- ✅ SearchResults  
- ✅ FullChat
- ✅ Dashboard (Health Metrics)
- ✅ Coach Dashboard
- ✅ Parent Dashboard
- ✅ MyProgress Dashboard
- ✅ Intake Dashboard
- ✅ Research Dashboard
- ✅ Fitness Dashboard
- ✅ All tracking/admin pages

### Mobile-Specific (React Native)
- 🚧 Camera/Scan Interface
- 🚧 Mobile-optimized navigation
- 🚧 Platform-specific integrations
- 🚧 Offline support
- 🚧 Push notifications

---

## Technical Details

### State Management
```javascript
Global App State:
├── user (profile, preferences, authentication)
├── health (metrics, goals, history)
├── chat (conversations, context, AI state)
├── search (queries, suggestions, results)
└── app (navigation, loading, errors, connectivity)
```

### Key Dependencies
- React Native with Expo
- React Navigation 6+
- Redux Toolkit or Zustand
- Expo Camera & Image Picker
- Victory Native (charts)
- React Native Health (iOS)
- Google Fit (Android)

---

## Summary

The mobile application serves **multiple user types**:

1. **Individual Users**: Health tracking, AI chat, nutrition analysis
2. **Parents**: Family health management, child tracking
3. **Health Coaches**: Client management, program creation, meal planning
4. **Partners/Affiliates**: Performance tracking, revenue monitoring
5. **Administrators**: System monitoring, engagement analytics

**Total Pages**: 23+ pages/dashboards  
**Core User Flow**: Scan → AI Analysis → Chat → Dashboard → Insights  
**Primary Interface**: Conversational AI (FullChat)  
**Key Innovation**: Automatic scan-to-chat workflow with instant AI analysis
