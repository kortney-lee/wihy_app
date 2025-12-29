# Create Meals Dashboard

A comprehensive meal planning and shopping system for the WiHY app that allows users to build meal plans and automatically generate shopping lists with Instacart integration.

## Overview

The Create Meals page provides a complete meal planning solution with a two-column layout:
- **Left Column**: Meal Program Builder for creating meals and prep batches
- **Right Column**: Auto-generated shopping lists and Instacart ordering

## Key Features

### ️ Meal Planning
- **Meal Cards**: Editable meals with servings, tags (Breakfast/Lunch/Dinner/Snack), and ingredient lists
- **Prep Batches**: Reusable ingredient prep that feeds into multiple meals
- **Smart Input**: Parse "chicken breast 2 lb" into structured ingredient data
- **Goal-based Planning**: High protein, Low sodium, Vegan, Leviticus 11, etc.

### [PAGE] Shopping List Generation
- **Auto-deduplication**: Combines repeated ingredients across meals
- **Quantity Summing**: Adds quantities when units match
- **Category Grouping**: Organizes by Produce, Protein, Dairy, Frozen, Pantry, Other
- **Validation**: Flags items that need review (mismatched units, empty items)

### [CART] Instacart Integration
- **One-click Ordering**: Generate Instacart links with pre-filled shopping list
- **Store Selection**: Choose preferred store (Costco, Kroger, Safeway, etc.)
- **Link Management**: Copy, regenerate, and track order status

### ‍ Coach/Client Support
- **Coach Mode**: Create meal plans and publish to clients
- **Client View**: Receive meal plans with shopping lists in MyProgress
- **Permission Handling**: Different views and actions based on user role

## File Structure

```
src/
├── pages/
│   ├── CreateMealsPage.tsx          # Main page component
│   └── CreateMealsPage.css          # Page-level styles
├── components/
│   ├── MealProgramBuilder.tsx       # Left column: meal/prep batch editor
│   ├── MealProgramBuilder.css       
│   ├── ShoppingOutputs.tsx          # Right column: lists and instacart
│   ├── ShoppingOutputs.css          
│   ├── ShoppingListPreview.tsx      # Categorized shopping list display
│   ├── ShoppingListPreview.css      
│   ├── InstacartOrderBlock.tsx      # Instacart ordering interface
│   └── InstacartOrderBlock.css      
└── types/
    └── meals.ts                     # TypeScript interfaces
```

## Component Architecture

### CreateMealsPage (Main Container)
- Manages overall meal plan state
- Handles goal selection and plan metadata
- Coordinates between builder and outputs
- Implements WiHY standard page layout pattern

### MealProgramBuilder (Left Column)
- **Meal Management**: Add, edit, duplicate, delete meals
- **Ingredient Editing**: Smart parsing, units, optional flags, notes
- **Prep Batch System**: Create reusable prep that meals can reference
- **Tag System**: Categorize meals by type and timing

### ShoppingOutputs (Right Column)
- **Live Updates**: Automatically recalculates as meals change
- **Export Options**: CSV download, print view, copy to clipboard
- **Validation Display**: Shows items needing review or correction

### ShoppingListPreview
- **Category Grouping**: Logical shopping order (Produce → Protein → etc.)
- **Smart Display**: Quantity formatting, source tracking
- **Responsive Design**: Adapts to mobile and desktop views

### InstacartOrderBlock
- **Link Generation**: Creates Instacart URLs with shopping list data
- **Store Integration**: Supports multiple retailer options
- **Order Tracking**: Manages order state (pending → generated → ordered)

## Usage Patterns

### Standard User Flow
1. **Create Meals** → Add meal cards with ingredients
2. **Add Prep Batches** → Create reusable prep work (optional)
3. **Review Shopping List** → Auto-generated, categorized list
4. **Order via Instacart** → One-click ordering with preferred store

### Coach Flow
1. **Build Client Plan** → Create meal plan for specific client
2. **Set Goals** → Apply dietary restrictions and preferences  
3. **Generate Shopping** → Create shopping list for client
4. **Publish to Client** → Send plan to client's MyProgress page

## Design System Integration

### Colors (Following WiHY Brand Guide)
- **Page Background**: `#f0f7ff` (Light Blue)
- **Card Backgrounds**: `#ffffff` (White)
- **Primary Actions**: `#fa5f06` (WiHY Orange)
- **Success States**: `#4cbb17` (Kelly Green) 
- **Instacart Actions**: `#10b981` (Emerald Green)

### Layout Pattern
- **Fixed Page Container**: Light blue background
- **White Navigation/Headers**: Standard WiHY pattern
- **Two-column Grid**: Responsive collapse to single column on mobile
- **Card-based Content**: White cards with rounded corners and subtle borders

### Responsive Behavior
- **Desktop**: Full two-column layout with rich interactions
- **Tablet**: Maintains columns but adjusts spacing and sizing
- **Mobile**: Stacks to single column, simplifies ingredient input

## Implementation Notes

### State Management
- Uses React hooks for local state management
- Meal plan stored in component state with useEffect for shopping list generation
- Local storage used for Instacart order persistence (replace with API)

### Smart Features
- **Ingredient Parsing**: Regex-based parsing of natural language input
- **Category Detection**: Automatic categorization of ingredients by name
- **Unit Validation**: Flags when units don't match for deduplication
- **Live Updates**: Shopping list regenerates whenever meals/prep changes

### Extensibility
- **Template System**: Ready for "Add from template" quick actions
- **Recipe Integration**: Can integrate with existing recipe/nutrition database
- **Advanced Planning**: Supports custom date ranges and multi-week planning

## Future Enhancements

### V1 Shipped Features
- [OK] Meal cards with ingredient lists
- [OK] Combined shopping list generation  
- [OK] Instacart link generation
- [OK] Basic prep batch system

### V2 Planned Features
-  Calendar-based meal planning
- ️ Ingredient template library
- [ABACUS] Nutrition calculation per meal
- [CYCLE] Recipe import from external sources
- [MOBILE] Native mobile optimizations
-  AI-powered meal suggestions

### V3 Future Features  
-  Multiple grocery delivery services
- [MONEY] Price comparison and budgeting
- [CHART] Nutrition goal tracking
-  Household meal planning
- [CYCLE] Automated recurring meal plans