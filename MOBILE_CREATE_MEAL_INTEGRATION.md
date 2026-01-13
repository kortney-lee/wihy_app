# 📱 Mobile Meal Planning & Creation Enhancement Guide

## 🎯 Problem Identified

**Current Issues:**
- ❌ Too much manual input required for creating meals
- ❌ No intelligent meal suggestions based on dietary goals
- ❌ Can't generate full meal plans (breakfast, lunch, dinner, snacks) automatically
- ❌ No calendar view to schedule meals for the week
- ❌ Missing integration with grocery shopping/Instacart
- ❌ Doesn't leverage existing nutrition and meal planning APIs

**What Users Want:**
- ✅ "Create a **high-protein meal plan** for this week" → Get 7-day meal plan
- ✅ "I need **vegetarian dinners** under 500 calories" → Get matching recipes
- ✅ "Plan my meals for **muscle building**" → Get optimized meal schedule
- ✅ Auto-calculate nutrition totals (calories, protein, carbs, fat)
- ✅ One-click shopping list generation from meal plan
- ✅ Calendar view with meal scheduling and reminders

---

## 🏗️ Recommended New UI Flow

### **Screen 0: Meal Planning Preferences (First Step)**

```
┌─────────────────────────────────────────┐
│  🍽️ Let's Personalize Your Meals       │
├─────────────────────────────────────────┤
│                                         │
│  Tell us what matters most to you       │
│                                         │
│  [I'm Planning Meals For] ───────────   │
│  ┌─────────────────────────────────┐   │
│  │  👨‍👩‍👧‍👦 FAMILY MEALS              │   │
│  │                                 │   │
│  │  Easy recipes everyone loves    │   │
│  │  Kid-friendly options           │   │
│  │  Batch cooking & leftovers      │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  ⏱️ QUICK & EASY                │   │
│  │                                 │   │
│  │  Under 30 minutes               │   │
│  │  Simple ingredients             │   │
│  │  Minimal cleanup                │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  💰 BUDGET-FRIENDLY             │   │
│  │                                 │   │
│  │  Affordable ingredients         │   │
│  │  Store brand options            │   │
│  │  Meal prep to save money        │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  💪 HEALTH & FITNESS            │   │
│  │                                 │   │
│  │  High protein, balanced macros  │   │
│  │  Weight management focus        │   │
│  │  Calorie tracking               │   │
│  └─────────────────────────────────┘   │
│                                         │
│  [Dietary Needs] ────────────────────   │
│   ☐ Vegetarian    ☐ Vegan             │
│   ☐ Gluten-Free   ☐ Dairy-Free        │
│   ☐ Nut Allergy   ☐ Kid-Friendly      │
│   ☐ Low Carb      ☐ Diabetic-Friendly │
│                                         │
│  [Preferred Brands/Stores] (Optional)  │
│   "e.g., Costco, Trader Joe's,         │
│    Organic brands, Store brands"       │
│   ┌──────────────────────────────────┐ │
│   │ [Add preferred brands...]        │ │
│   └──────────────────────────────────┘ │
│                                         │
│  [Cooking Skill Level] ──────────────   │
│   ⦿ Beginner (Simple recipes)          │
│   ○ Intermediate (Some experience)     │
│   ○ Advanced (Complex cooking)         │
│                                         │
│  💡 Skip this - you can set preferences│
│     later or just start creating meals │
│                                         │
│  [Save & Continue] [Skip for Now] ──   │
│                                         │
└─────────────────────────────────────────┘
```

### **Screen 1: Meal Planning Dashboard**

```
┌─────────────────────────────────────────┐
│  🍽️ Meal Planning                       │
│  Goal: Build Muscle | 2200 cal/day     │
├─────────────────────────────────────────┤
│                                         │
│  [Quick Actions] ────────────────────   │
│   🤖 AI Meal Plan    📅 View Calendar  │
│   ➕ Create Meal     📋 My Meal Plans   │
│                                         │
│  [Create Meal Plan] ─────────────────   │
│                                         │
│  What type of plan do you need?        │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  📆 WEEKLY MEAL PLAN            │   │
│  │                                 │   │
│  │  Get 7 days of meals            │   │
│  │  (breakfast, lunch, dinner,     │   │
│  │   snacks)                       │   │
│  │                                 │   │
│  │  Perfect for meal prep!         │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  🥗 SINGLE MEAL                 │   │
│  │                                 │   │
│  │  Create one custom meal         │   │
│  │  from scratch or template       │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  🔁 RECURRING FAVORITES         │   │
│  │                                 │   │
│  │  Schedule your favorite meals   │   │
│  │  to repeat weekly               │   │
│  └─────────────────────────────────┘   │
│                                         │
│  [Recent Meal Plans] ────────────────   │
│   • Muscle Building - Week 1            │
│     Started Jan 1 • 7 days              │
│   • High Protein Lunches                │
│     5 meals • 450 cal avg               │
│                                         │
└─────────────────────────────────────────┘
```

### **Screen 2: AI Meal Plan Generator**

```
┌─────────────────────────────────────────┐
│  🤖 AI Meal Plan Generator              │
├─────────────────────────────────────────┤
│                                         │
│  [Describe Your Plan] ───────────────   │
│   "Easy family dinners for 4 using     │
│    Costco ingredients, kid-friendly,   │
│    under 30 minutes"                   │
│   ┌──────────────────────────────────┐ │
│   │ [Type your request here...]      │ │
│   └──────────────────────────────────┘ │
│                                         │
│  [Quick Templates] ───────────────────  │
│   💡 "5 easy weeknight dinners"        │
│   💡 "Budget meals with store brands"  │
│   💡 "Kid-friendly lunches for school" │
│   💡 "Quick breakfast meal prep"       │
│                                         │
│  [Or Customize Details] ──────────────  │
│                                         │
│  Duration:                             │
│   ⦿ 7 days  ○ 14 days  ○ 30 days      │
│                                         │
│  Meals per day:                        │
│   ☑ Breakfast  ☑ Lunch  ☑ Dinner      │
│   ☐ Morning Snack  ☐ Evening Snack    │
│                                         │
│  Meal variety:                         │
│   ○ Balanced mix                       │
│   ⦿ Family-friendly (repeat favorites) │
│   ○ Maximum variety (different daily)  │
│                                         │
│  Preferred stores/brands:              │
│   ☑ Costco  ☑ Trader Joe's            │
│   ☐ Whole Foods  ☐ Generic brands     │
│   ☐ Aldi  ☐ Target                    │
│                                         │
│  Time per meal:                        │
│   ⦿ Quick (15-20 min)                  │
│   ○ Moderate (20-40 min)               │
│   ○ Don't care about time              │
│                                         │
│  Cooking complexity:                   │
│   ⦿ Easy (beginner-friendly)           │
│   ○ Moderate (some experience)         │
│   ○ Advanced (complex techniques)      │
│                                         │
│  Special focus:                        │
│   ☑ Kid-friendly (no spicy, familiar) │
│   ☐ High protein                       │
│   ☐ Low cost per serving               │
│   ☐ Meal prep friendly                 │
│                                         │
│  [Generate Meal Plan] ─────────────     │
│                                         │
└─────────────────────────────────────────┘
```

### **Screen 3: Generated Meal Plan Preview**

```
┌─────────────────────────────────────────┐
│  ✨ Your Family Meal Plan               │
├─────────────────────────────────────────┤
│  📊 Plan Summary                        │
│   • 7 days • 21 meals                  │
│   • Family of 4 portions               │
│   • Avg: $8-12 per meal                │
│   • Avg cook time: 25 min              │
│   • Costco & Trader Joe's ingredients  │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  DAY 1 - Monday                 │   │
│  │  📅 Jan 3, 2026                 │   │
│  │                                 │   │
│  │  🍳 BREAKFAST                   │   │
│  │  Costco Protein Pancakes        │   │
│  │  Kodiak Cakes mix + berries     │   │
│  │  ⏱️ 10 min • 4 servings         │   │
│  │  💰 $6 total                    │   │
│  │                                 │   │
│  │  🥗 LUNCH                        │   │
│  │  Turkey & Cheese Sandwiches     │   │
│  │  Costco deli turkey, wheat bread│   │
│  │  ⏱️ 5 min • 4 servings          │   │
│  │  💰 $8 total                    │   │
│  │                                 │   │
│  │  🍽️ DINNER                      │   │
│  │  Rotisserie Chicken Tacos       │   │
│  │  Costco rotisserie chicken     │   │
│  │  TJ's taco shells, toppings     │   │
│  │  ⏱️ 15 min • 4 servings         │   │
│  │  💰 $12 total (using leftover   │   │
│  │      chicken for Day 2)         │   │
│  │                                 │   │
│  │  Daily Total: ~$26 for family   │   │
│  │  🌟 Kid-approved • Quick prep   │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  DAY 2 - Tuesday                │   │
│  │  📅 Jan 4, 2026                 │   │
│  │                                 │   │
│  │  🍳 BREAKFAST                   │   │
│  │  Yogurt Parfait Bar             │   │
│  │  Costco Greek yogurt + granola  │   │
│  │  ⏱️ 5 min                       │   │
│  │                                 │   │
│  │  🥗 LUNCH                        │   │
│  │  Chicken Caesar Wraps           │   │
│  │  (Leftover rotisserie chicken)  │   │
│  │  TJ's Caesar kit                │   │
│  │  ⏱️ 10 min                      │   │
│  │  💰 $4 (using leftovers!)       │   │
│  │                                 │   │
│  │  🍽️ DINNER                      │   │
│  │  Spaghetti & Meatballs          │   │
│  │  Costco frozen meatballs        │   │
│  │  Rao's marinara sauce           │   │
│  │  ⏱️ 20 min                      │   │
│  └─────────────────────────────────┘   │
│                                         │
│  [View All 7 Days] [Customize] [Save]  │
│                                         │
│  💡 Total week cost: ~$180 for family  │
│     of 4 (breakfast, lunch, dinner)    │
│                                         │
└─────────────────────────────────────────┘
```

### **Screen 4: Calendar View (Meal Schedule)**

```
┌─────────────────────────────────────────┐
│  📅 January 2026                        │
│                        [Week] [Month]   │
├─────────────────────────────────────────┤
│  Sun   Mon   Tue   Wed   Thu   Fri  Sat│
│                                         │
│        1🍳🥗  2🍳🥗  3🍳🥗  4🍳🥗  5🍳🥗 │
│        🍽️🍎  🍽️🍎  🍽️🍎  🍽️🍎  🍽️🍎 │
│        2250  2250  2250  2250  2250    │
│                                         │
│  6🍳🥗  7🍳🥗  8🍳🥗  9🍳🥗  10     11    │
│  🍽️🍎  🍽️🍎  🍽️    🍽️                 │
│  2250  2250  1800  1650                │
│                                         │
│  Legend:                               │
│  🍳 Breakfast  🥗 Lunch  🍽️ Dinner     │
│  🍎 Snacks                             │
│                                         │
│  [Today: Jan 3] ────────────────────   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  🍳 BREAKFAST - 8:00 AM         │   │
│  │  Protein Oatmeal Bowl           │   │
│  │  520 cal • Ready in 10 min      │   │
│  │  [View Recipe] [Mark as Eaten]  │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  🥗 LUNCH - 12:30 PM            │   │
│  │  Grilled Chicken Rice Bowl      │   │
│  │  680 cal • Ready in 15 min      │   │
│  │  [View Recipe] [Mark as Eaten]  │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  🍽️ DINNER - 7:00 PM            │   │
│  │  Salmon with Sweet Potato       │   │
│  │  750 cal • Ready in 25 min      │   │
│  │  [View Recipe] [Start Cooking]  │   │
│  └─────────────────────────────────┘   │
│                                         │
│  [📋 Generate Shopping List for Week]  │
│                                         │
└─────────────────────────────────────────┘
```

### **Screen 5: Create Single Meal (Enhanced)**

```
┌─────────────────────────────────────────┐
│  ➕ Create New Meal                     │
├─────────────────────────────────────────┤
│                                         │
│  [Quick Start Options] ──────────────   │
│   🤖 AI Generate  📋 Use Template      │
│   📸 Scan Recipe  🔍 Search Database   │
│                                         │
│  Meal Name: ───────────────────────     │
│  ┌──────────────────────────────────┐  │
│  │ [e.g., Grilled Chicken Bowl]    │  │
│  └──────────────────────────────────┘  │
│                                         │
│  Meal Type: ───────────────────────     │
│  ⦿ Breakfast  ○ Lunch  ○ Dinner        │
│  ○ Snack      ○ Dessert                │
│                                         │
│  [Ingredients] ───────────────────────  │
│   ┌────────────────────────────────┐   │
│   │ 🍗 Chicken breast              │   │
│   │    8 oz • 320 cal • P:60g      │   │
│   │    [Edit] [Remove]             │   │
│   └────────────────────────────────┘   │
│                                         │
│   ┌────────────────────────────────┐   │
│   │ 🍚 Brown rice                  │   │
│   │    1 cup • 215 cal • C:45g     │   │
│   │    [Edit] [Remove]             │   │
│   └────────────────────────────────┘   │
│                                         │
│   ┌────────────────────────────────┐   │
│   │ 🥦 Broccoli                    │   │
│   │    1 cup • 55 cal • C:11g      │   │
│   │    [Edit] [Remove]             │   │
│   └────────────────────────────────┘   │
│                                         │
│  [➕ Add Ingredient] ──────────────     │
│                                         │
│  [Nutrition Summary] ──────────────     │
│  ┌────────────────────────────────┐   │
│  │  Total: 590 calories           │   │
│  │  Protein: 65g (44%)            │   │
│  │  Carbs: 58g (39%)              │   │
│  │  Fat: 11g (17%)                │   │
│  │  Fiber: 8g                     │   │
│  │                                │   │
│  │  ✅ Meets protein goal (40g+)  │   │
│  │  ⚠️ Low in healthy fats        │   │
│  └────────────────────────────────┘   │
│                                         │
│  [Tags] ───────────────────────────     │
│  ☑ High Protein  ☐ Low Carb            │
│  ☑ Meal Prep    ☐ Quick (<15 min)     │
│  ☐ Vegetarian   ☐ Gluten-Free         │
│                                         │
│  [Cooking Instructions] ───────────     │
│  ⏱️ Prep: 10 min | Cook: 15 min        │
│  ┌──────────────────────────────────┐  │
│  │ 1. Grill chicken for 6-7 min... │  │
│  │ 2. Cook rice according to...    │  │
│  │ 3. Steam broccoli for 5 min...  │  │
│  └──────────────────────────────────┘  │
│                                         │
│  [Save Meal] [Add to Calendar] ────     │
│                                         │
└─────────────────────────────────────────┘
```

### **Screen 6: Shopping List Generator**

```
┌─────────────────────────────────────────┐
│  🛒 Weekly Shopping List                │
│  For: Jan 3-9 (7 days)                  │
├─────────────────────────────────────────┤
│                                         │
│  [Proteins] ─────────────────────────   │
│   ☐ Chicken breast - 3 lbs             │
│   ☐ Salmon fillets - 1.5 lbs           │
│   ☐ Eggs - 18 count                    │
│   ☐ Greek yogurt - 2 containers        │
│   ☐ Tofu - 1 block                     │
│                                         │
│  [Carbs/Grains] ─────────────────────   │
│   ☐ Brown rice - 2 lbs                 │
│   ☐ Oats - 1 container                 │
│   ☐ Sweet potatoes - 5 medium          │
│   ☐ Whole wheat bread - 1 loaf         │
│                                         │
│  [Vegetables] ───────────────────────   │
│   ☐ Broccoli - 3 crowns                │
│   ☐ Spinach - 2 bags                   │
│   ☐ Bell peppers - 4 assorted          │
│   ☐ Onions - 2 large                   │
│   ☐ Garlic - 1 bulb                    │
│                                         │
│  [Fruits] ───────────────────────────   │
│   ☐ Berries - 2 containers             │
│   ☐ Bananas - 1 bunch                  │
│   ☐ Apples - 6 count                   │
│                                         │
│  [Pantry] ───────────────────────────   │
│   ☐ Olive oil                          │
│   ☐ Soy sauce                          │
│   ☐ Protein powder                     │
│                                         │
│  Total Items: 26                       │
│  Est. Cost: $85-$110                   │
│                                         │
│  [Send to Instacart] [Email List]      │
│  [Share] [Print]                       │
│                                         │
└─────────────────────────────────────────┘
```

---

## 🔧 Backend API Integration

### **Available Meal Planning Endpoints (Already Built!)**

```javascript
// 1. CREATE MEAL PROGRAM FROM AI DESCRIPTION
POST https://services.wihy.ai/api/meal-programs
Headers: {
  "Authorization": "Bearer {token}"
}
Body: {
  "userId": "user_12345", // Optional - for nutritionists creating plans for clients. If omitted, uses authenticated user from token
  "name": "Family Meal Plan - Week 1",
  "description": "Easy family dinners for 4 using Costco ingredients, kid-friendly, under 30 minutes",
  "duration_days": 7,
  "meals_per_day": 3, // breakfast, lunch, dinner
  "dietary_preferences": ["kid-friendly", "quick-prep"],
  "preferred_stores": ["Costco", "Trader Joe's"],
  "budget_per_meal": 12,
  "family_size": 4,
  "cooking_skill": "beginner"
}

Response: {
  "success": true,
  "program_id": "prog_meal_abc123",
  "name": "Family Meal Plan - Week 1",
  "description": "7-day family meal plan optimized for Costco shopping",
  "duration_days": 7,
  "total_meals": 21,
  "avg_cost_per_meal": 10.50,
  "total_weekly_cost": 220.50,
  "created_at": "2026-01-03T10:00:00Z",
  "days": [
    // DAY 1
    {
      "day_number": 1,
      "day_name": "Monday - Easy Start",
      "date": "2026-01-03",
      "total_daily_cost": 26.00,
      "meals": [
        {
          "meal_id": "meal_001",
          "meal_type": "breakfast",
          "meal_name": "Costco Protein Pancakes",
          "recipe_id": "recipe_pancakes_01",
          "servings": 4,
          "prep_time": 5,
          "cook_time": 10,
          "total_time": 15,
          "cost_per_serving": 1.50,
          "total_cost": 6.00,
          "nutrition": {
            "calories": 320,
            "protein": 18,
            "carbs": 42,
            "fat": 8,
            "fiber": 4
          },
          "ingredients": [
            {
              "name": "Kodiak Cakes Pancake Mix",
              "amount": 2,
              "unit": "cups",
              "brand": "Kodiak Cakes (Costco)",
              "aisle": "Baking"
            },
            {
              "name": "Eggs",
              "amount": 2,
              "unit": "large",
              "brand": "Kirkland Signature",
              "aisle": "Dairy"
            },
            {
              "name": "Milk",
              "amount": 1.5,
              "unit": "cups",
              "brand": "Kirkland Signature",
              "aisle": "Dairy"
            },
            {
              "name": "Blueberries",
              "amount": 1,
              "unit": "cup",
              "brand": "Frozen organic (Costco)",
              "aisle": "Frozen"
            }
          ],
          "instructions": [
            "Mix pancake mix, eggs, and milk until smooth",
            "Heat griddle to medium heat",
            "Pour 1/4 cup batter per pancake",
            "Cook 2-3 minutes per side until golden",
            "Serve with blueberries"
          ],
          "tags": ["kid-friendly", "quick", "high-protein"],
          "kid_approved": true
        },
        {
          "meal_id": "meal_002",
          "meal_type": "lunch",
          "meal_name": "Turkey & Cheese Sandwiches",
          "servings": 4,
          "prep_time": 5,
          "cook_time": 0,
          "total_time": 5,
          "cost_per_serving": 2.00,
          "total_cost": 8.00,
          "nutrition": {
            "calories": 380,
            "protein": 24,
            "carbs": 38,
            "fat": 14,
            "fiber": 3
          },
          "ingredients": [
            {
              "name": "Sliced turkey breast",
              "amount": 1,
              "unit": "lb",
              "brand": "Kirkland Signature Deli",
              "aisle": "Deli"
            },
            {
              "name": "Cheddar cheese slices",
              "amount": 8,
              "unit": "slices",
              "brand": "Tillamook (Costco)",
              "aisle": "Dairy"
            },
            {
              "name": "Whole wheat bread",
              "amount": 8,
              "unit": "slices",
              "brand": "Dave's Killer Bread",
              "aisle": "Bakery"
            },
            {
              "name": "Lettuce",
              "amount": 4,
              "unit": "leaves",
              "brand": "Organic hearts (Costco)",
              "aisle": "Produce"
            }
          ],
          "instructions": [
            "Layer turkey, cheese, and lettuce on bread",
            "Cut diagonally",
            "Serve with baby carrots and ranch"
          ],
          "tags": ["no-cook", "kid-friendly", "quick"],
          "kid_approved": true
        },
        {
          "meal_id": "meal_003",
          "meal_type": "dinner",
          "meal_name": "Rotisserie Chicken Tacos",
          "servings": 4,
          "prep_time": 10,
          "cook_time": 5,
          "total_time": 15,
          "cost_per_serving": 3.00,
          "total_cost": 12.00,
          "nutrition": {
            "calories": 420,
            "protein": 32,
            "carbs": 35,
            "fat": 16,
            "fiber": 5
          },
          "ingredients": [
            {
              "name": "Rotisserie chicken",
              "amount": 1,
              "unit": "whole",
              "brand": "Costco Rotisserie",
              "aisle": "Prepared Foods",
              "notes": "Save leftovers for Day 2 lunch!"
            },
            {
              "name": "Taco shells",
              "amount": 12,
              "unit": "shells",
              "brand": "Trader Joe's",
              "aisle": "International"
            },
            {
              "name": "Shredded cheese",
              "amount": 1,
              "unit": "cup",
              "brand": "Kirkland Signature Mexican Blend",
              "aisle": "Dairy"
            },
            {
              "name": "Salsa",
              "amount": 1,
              "unit": "cup",
              "brand": "Kirkland Signature",
              "aisle": "Condiments"
            }
          ],
          "instructions": [
            "Shred rotisserie chicken (save 2 cups for tomorrow's lunch)",
            "Warm taco shells per package directions",
            "Fill shells with chicken, cheese, salsa",
            "Add toppings: lettuce, sour cream, guacamole"
          ],
          "tags": ["kid-friendly", "quick", "uses-leftovers"],
          "kid_approved": true,
          "leftover_plan": {
            "saves_for": "Day 2 lunch",
            "amount": "2 cups shredded chicken",
            "storage": "Refrigerate in airtight container"
          }
        }
      ]
    },
    
    // DAY 2
    {
      "day_number": 2,
      "day_name": "Tuesday - Leftover Magic",
      "date": "2026-01-04",
      "total_daily_cost": 22.00,
      "meals": [
        {
          "meal_id": "meal_004",
          "meal_type": "breakfast",
          "meal_name": "Yogurt Parfait Bar",
          "servings": 4,
          "prep_time": 5,
          "cook_time": 0,
          "total_time": 5,
          "cost_per_serving": 1.25,
          "total_cost": 5.00,
          "nutrition": {
            "calories": 280,
            "protein": 15,
            "carbs": 38,
            "fat": 6,
            "fiber": 3
          },
          "ingredients": [
            {
              "name": "Greek yogurt",
              "amount": 4,
              "unit": "cups",
              "brand": "Kirkland Signature Nonfat",
              "aisle": "Dairy"
            },
            {
              "name": "Granola",
              "amount": 1,
              "unit": "cup",
              "brand": "Nature Valley (Costco)",
              "aisle": "Cereal"
            },
            {
              "name": "Mixed berries",
              "amount": 2,
              "unit": "cups",
              "brand": "Frozen organic blend (Costco)",
              "aisle": "Frozen"
            },
            {
              "name": "Honey",
              "amount": 4,
              "unit": "tbsp",
              "brand": "Kirkland Signature",
              "aisle": "Condiments"
            }
          ],
          "tags": ["no-cook", "healthy", "kid-friendly"]
        },
        {
          "meal_id": "meal_005",
          "meal_type": "lunch",
          "meal_name": "Chicken Caesar Wraps",
          "servings": 4,
          "prep_time": 10,
          "cook_time": 0,
          "total_time": 10,
          "cost_per_serving": 1.00,
          "total_cost": 4.00,
          "uses_leftovers": true,
          "leftover_from": "Day 1 dinner",
          "nutrition": {
            "calories": 340,
            "protein": 28,
            "carbs": 32,
            "fat": 12,
            "fiber": 2
          },
          "ingredients": [
            {
              "name": "Leftover rotisserie chicken",
              "amount": 2,
              "unit": "cups",
              "notes": "From Day 1 dinner"
            },
            {
              "name": "Caesar salad kit",
              "amount": 1,
              "unit": "package",
              "brand": "Trader Joe's",
              "aisle": "Produce"
            },
            {
              "name": "Tortilla wraps",
              "amount": 4,
              "unit": "large",
              "brand": "Mission",
              "aisle": "Bakery"
            }
          ],
          "instructions": [
            "Mix leftover chicken with Caesar salad kit",
            "Divide among tortillas",
            "Roll up and slice in half"
          ],
          "tags": ["uses-leftovers", "quick", "kid-friendly"],
          "cost_savings": "Using leftovers saves $8!"
        },
        {
          "meal_id": "meal_006",
          "meal_type": "dinner",
          "meal_name": "Spaghetti & Meatballs",
          "servings": 4,
          "prep_time": 5,
          "cook_time": 20,
          "total_time": 25,
          "cost_per_serving": 3.25,
          "total_cost": 13.00,
          "nutrition": {
            "calories": 520,
            "protein": 28,
            "carbs": 62,
            "fat": 18,
            "fiber": 4
          },
          "ingredients": [
            {
              "name": "Frozen Italian meatballs",
              "amount": 24,
              "unit": "meatballs",
              "brand": "Kirkland Signature",
              "aisle": "Frozen"
            },
            {
              "name": "Spaghetti pasta",
              "amount": 1,
              "unit": "lb",
              "brand": "Barilla",
              "aisle": "Pasta"
            },
            {
              "name": "Marinara sauce",
              "amount": 1,
              "unit": "jar (32 oz)",
              "brand": "Rao's (Costco)",
              "aisle": "Pasta"
            }
          ],
          "tags": ["kid-favorite", "comfort-food", "easy"]
        }
      ]
    }
    // ... Days 3-7 continue with similar structure
  ],
  "weekly_shopping_list": {
    "total_items": 42,
    "estimated_cost": 220.50,
    "store_breakdown": {
      "Costco": {
        "items": 28,
        "cost": 165.00
      },
      "Trader Joe's": {
        "items": 14,
        "cost": 55.50
      }
    },
    "shopping_list_id": "list_generated_abc123"
  }
}

// 2. GET ALL MEAL PROGRAMS FOR USER
GET https://services.wihy.ai/api/meal-programs?userId=user_12345
Headers: {
  "Authorization": "Bearer {token}"
}

Response: {
  "success": true,
  "programs": [
    {
      "program_id": "prog_meal_001",
      "name": "Family Meal Plan - Week 1",
      "duration_days": 7,
      "total_meals": 21,
      "created_at": "2026-01-03",
      "is_active": true
    },
    {
      "program_id": "prog_meal_002",
      "name": "Quick Lunches - 5 Days",
      "duration_days": 5,
      "total_meals": 5,
      "created_at": "2025-12-28",
      "is_active": false
    }
  ]
}

// 3. GET SPECIFIC MEAL PROGRAM
GET https://services.wihy.ai/api/meal-programs/prog_meal_abc123
Headers: {
  "Authorization": "Bearer {token}"
}

Response: {
  "success": true,
  "program": {
    "program_id": "prog_meal_abc123",
    "name": "Family Meal Plan - Week 1",
    "description": "Easy family dinners",
    "duration_days": 7,
    "total_meals": 21,
    "days": [ /* full days array as shown above */ ]
  }
}

// 4. VIEW ALL MEALS IN PROGRAM (with filtering)
GET https://services.wihy.ai/api/meal-programs/prog_meal_abc123/meals?meal_type=dinner&kid_friendly=true
Headers: {
  "Authorization": "Bearer {token}"
}

Query Parameters:
- meal_type: breakfast, lunch, dinner, snack
- kid_friendly: true/false
- max_cook_time: 30 (minutes)
- min_protein: 20 (grams)
- max_cost: 5.00 (dollars per serving)
- dietary_tag: vegetarian, gluten-free, dairy-free

Response: {
  "success": true,
  "program_id": "prog_meal_abc123",
  "filters_applied": {
    "meal_type": "dinner",
    "kid_friendly": true
  },
  "total_meals": 7,
  "meals": [
    {
      "meal_id": "meal_003",
      "day_number": 1,
      "meal_type": "dinner",
      "meal_name": "Rotisserie Chicken Tacos",
      "prep_time": 10,
      "cook_time": 5,
      "total_time": 15,
      "cost_per_serving": 3.00,
      "servings": 4,
      "kid_approved": true,
      "nutrition": {
        "calories": 420,
        "protein": 32,
        "carbs": 35,
        "fat": 16
      },
      "tags": ["kid-friendly", "quick", "uses-leftovers"]
    }
    // ... more dinners
  ]
}

// 5. DELETE MEAL PROGRAM
DELETE https://services.wihy.ai/api/meal-programs/prog_meal_abc123
Headers: {
  "Authorization": "Bearer {token}"
}

Response: {
  "success": true,
  "message": "Meal program deleted successfully"
}

// 6. GET CALENDAR VIEW (as shown in calendar section)
GET https://services.wihy.ai/api/meal-programs/prog_meal_abc123/calendar?month=2026-01
// Returns meals grouped by date for calendar display

// 7. GENERATE SHOPPING LIST FROM MEAL PROGRAM
POST https://services.wihy.ai/api/meal-programs/prog_meal_abc123/shopping-list
Headers: {
  "Authorization": "Bearer {token}"
}
Body: {
  "start_date": "2026-01-03",
  "end_date": "2026-01-09",
  "consolidate": true,
  "group_by_category": true,
  "preferred_stores": ["Costco", "Trader Joe's"]
}

Response: {
  "success": true,
  "shopping_list_id": "list_xyz789",
  "total_items": 42,
  "estimated_cost": {
    "min": 165,
    "max": 210
  },
  "items_by_category": {
    "Proteins": [ /* items */ ],
    "Produce": [ /* items */ ],
    "Grains & Carbs": [ /* items */ ]
  },
  "instacart_ready": true
}

// 8. SAVE USER DIETARY PREFERENCES
PUT https://services.wihy.ai/api/users/meal-preferences
Headers: {
  "Authorization": "Bearer {token}"
}
Body: {
  "userId": "user_12345",
  "preferences": {
    "planning_goal": "family-meals", // or "quick-easy", "budget-friendly", "health-fitness"
    "dietary_restrictions": ["kid-friendly"],
    "preferred_stores": ["Costco", "Trader Joe's"],
    "cooking_skill": "beginner",
    "family_size": 4,
    "budget_per_meal": 12
  }
}

Response: {
  "success": true,
  "message": "Preferences saved successfully"
}
```

---

## 🛒 Complete Instacart Integration

### **Step-by-Step Instacart Flow**

```javascript
// STEP 1: Generate Shopping List from Meal Program
async function createWeeklyShoppingList(programId) {
  const response = await fetch(
    `https://services.wihy.ai/api/meal-programs/${programId}/shopping-list`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        start_date: '2026-01-03',
        end_date: '2026-01-09',
        consolidate: true,
        group_by_category: true,
        preferred_stores: ['Costco', 'Trader Joe\'s']
      })
    }
  );

  const data = await response.json();
  // data.shopping_list_id = "list_xyz789"
  // data.instacart_ready = true
  
  return data.shopping_list_id;
}

// STEP 2: Send Shopping List to Instacart
async function sendToInstacart(shoppingListId) {
  const response = await fetch(
    `https://services.wihy.ai/api/shopping-lists/${shoppingListId}/instacart`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: 'user_12345',
        store_preference: 'Costco',  // or 'Trader Joe\'s', 'Whole Foods', etc.
        delivery_preference: 'fastest', // or 'cheapest', 'schedule'
        scheduled_time: null, // or "2026-01-04T10:00:00Z" for scheduled delivery
        leave_at_door: true,
        special_instructions: 'Ring doorbell for delivery'
      })
    }
  );

  const instacartData = await response.json();
  
  // Response structure:
  // {
  //   "success": true,
  //   "instacart_cart_id": "cart_instacart_123",
  //   "cart_url": "https://www.instacart.com/cart/wihy_list_xyz789",
  //   "mobile_deep_link": "instacart://cart/wihy_list_xyz789",
  //   "store": {
  //     "name": "Costco Wholesale",
  //     "address": "123 Wholesale Ave, Seattle, WA",
  //     "available_slots": [
  //       {
  //         "time": "2026-01-04T10:00:00Z",
  //         "delivery_fee": 3.99,
  //         "service_fee": 5.99
  //       },
  //       {
  //         "time": "2026-01-04T14:00:00Z",
  //         "delivery_fee": 0,
  //         "service_fee": 5.99
  //       }
  //     ]
  //   },
  //   "estimated_total": {
  //     "subtotal": 185.50,
  //     "delivery_fee": 3.99,
  //     "service_fee": 5.99,
  //     "tax": 18.55,
  //     "total": 214.03
  //   },
  //   "items_matched": 40,
  //   "items_total": 42,
  //   "unmatched_items": [
  //     {
  //       "name": "Rao's Marinara Sauce",
  //       "reason": "Out of stock",
  //       "alternative": "Victoria Marinara Sauce"
  //     },
  //     {
  //       "name": "Dave's Killer Bread",
  //       "reason": "Not available at this store",
  //       "alternative": "Kirkland Signature Whole Wheat Bread"
  //     }
  //   ],
  //   "expiration_time": "2026-01-03T12:00:00Z" // Cart expires in 2 hours
  // }

  return instacartData;
}

// STEP 3: Open Instacart App or Web
async function openInstacartCart(instacartData) {
  const { cart_url, mobile_deep_link } = instacartData;
  
  // Try to open in Instacart app first (better UX)
  const canOpenApp = await Linking.canOpenURL(mobile_deep_link);
  
  if (canOpenApp) {
    // Open in Instacart mobile app
    await Linking.openURL(mobile_deep_link);
  } else {
    // Fall back to web browser
    await Linking.openURL(cart_url);
    
    // Optionally show prompt to install app
    Alert.alert(
      'Install Instacart App?',
      'For a better experience, install the Instacart app',
      [
        { text: 'Later', style: 'cancel' },
        {
          text: 'Install',
          onPress: () => {
            const appStoreUrl = Platform.select({
              ios: 'https://apps.apple.com/app/instacart/id545599256',
              android: 'https://play.google.com/store/apps/details?id=com.instacart.client'
            });
            Linking.openURL(appStoreUrl);
          }
        }
      ]
    );
  }
}

// COMPLETE WORKFLOW
async function completeInstacartFlow(programId) {
  try {
    // Step 1: Create shopping list from meal program
    const listId = await createWeeklyShoppingList(programId);
    
    // Step 2: Send to Instacart
    const instacartData = await sendToInstacart(listId);
    
    // Step 3: Show user the details
    Alert.alert(
      '🛒 Instacart Cart Ready!',
      `${instacartData.items_matched} of ${instacartData.items_total} items added\n\n` +
      `Estimated Total: $${instacartData.estimated_total.total}\n` +
      `Store: ${instacartData.store.name}\n\n` +
      `${instacartData.unmatched_items.length > 0 ? 
        `Note: ${instacartData.unmatched_items.length} items need alternatives` : 
        'All items available!'}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Open Instacart',
          onPress: () => openInstacartCart(instacartData)
        }
      ]
    );
    
    // Step 4: Track the order (optional)
    trackInstacartOrder(instacartData.instacart_cart_id);
    
  } catch (error) {
    Alert.alert(
      'Instacart Error',
      'Failed to create Instacart cart. Please try again.',
      [{ text: 'OK' }]
    );
    console.error('Instacart flow error:', error);
  }
}

// TRACK INSTACART ORDER STATUS
async function trackInstacartOrder(cartId) {
  const response = await fetch(
    `https://services.wihy.ai/api/instacart/orders/${cartId}/status`,
    {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    }
  );

  const status = await response.json();
  
  // Response:
  // {
  //   "success": true,
  //   "cart_id": "cart_instacart_123",
  //   "status": "pending", // or "shopper_assigned", "shopping", "delivering", "delivered", "cancelled"
  //   "shopper": {
  //     "name": "John D.",
  //     "rating": 4.9,
  //     "photo_url": "https://..."
  //   },
  //   "estimated_delivery": "2026-01-04T10:30:00Z",
  //   "order_updates": [
  //     {
  //       "time": "2026-01-04T09:00:00Z",
  //       "message": "Shopper started shopping",
  //       "status": "shopping"
  //     },
  //     {
  //       "time": "2026-01-04T09:15:00Z",
  //       "message": "Rao's sauce out of stock - replaced with Victoria",
  //       "status": "item_replaced",
  //       "requires_approval": true
  //     }
  //   ]
  // }
  
  return status;
}

// HANDLE ITEM REPLACEMENTS
async function approveReplacement(cartId, itemId, approve) {
  const response = await fetch(
    `https://services.wihy.ai/api/instacart/orders/${cartId}/replacements`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        item_id: itemId,
        approve: approve, // true = approve replacement, false = refund item
        notes: approve ? null : 'Please refund instead'
      })
    }
  );

  return response.json();
}
```

### **React Native Instacart Integration Component**

```javascript
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Linking } from 'react-native';

function InstacartIntegrationScreen({ route }) {
  const { programId, shoppingListId } = route.params;
  const [instacartData, setInstacartData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [orderStatus, setOrderStatus] = useState(null);

  async function sendToInstacart() {
    setLoading(true);
    
    try {
      const response = await fetch(
        `https://services.wihy.ai/api/shopping-lists/${shoppingListId}/instacart`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            store_preference: 'Costco',
            delivery_preference: 'fastest'
          })
        }
      );

      const data = await response.json();
      
      if (data.success) {
        setInstacartData(data);
        
        // Show summary alert
        Alert.alert(
          '🛒 Cart Ready!',
          `${data.items_matched}/${data.items_total} items added\n\n` +
          `Estimated Total: $${data.estimated_total.total.toFixed(2)}\n` +
          `Store: ${data.store.name}`,
          [
            { text: 'Review Cart', style: 'cancel' },
            {
              text: 'Open Instacart',
              onPress: () => openInstacartApp(data)
            }
          ]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to create Instacart cart');
    } finally {
      setLoading(false);
    }
  }

  async function openInstacartApp(data) {
    const canOpen = await Linking.canOpenURL(data.mobile_deep_link);
    
    if (canOpen) {
      await Linking.openURL(data.mobile_deep_link);
      // Start polling order status
      pollOrderStatus(data.instacart_cart_id);
    } else {
      await Linking.openURL(data.cart_url);
    }
  }

  async function pollOrderStatus(cartId) {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(
          `https://services.wihy.ai/api/instacart/orders/${cartId}/status`,
          {
            headers: { 'Authorization': `Bearer ${authToken}` }
          }
        );
        
        const status = await response.json();
        setOrderStatus(status);
        
        // Stop polling if order is delivered or cancelled
        if (status.status === 'delivered' || status.status === 'cancelled') {
          clearInterval(interval);
          
          if (status.status === 'delivered') {
            Alert.alert(
              '🎉 Order Delivered!',
              'Your groceries have been delivered. Happy cooking!'
            );
          }
        }
        
        // Handle replacement requests
        if (status.order_updates) {
          const needsApproval = status.order_updates.find(
            update => update.requires_approval && !update.approved
          );
          
          if (needsApproval) {
            Alert.alert(
              'Item Replacement Needed',
              needsApproval.message,
              [
                {
                  text: 'Refund Item',
                  onPress: () => handleReplacement(cartId, needsApproval.item_id, false)
                },
                {
                  text: 'Approve',
                  onPress: () => handleReplacement(cartId, needsApproval.item_id, true)
                }
              ]
            );
          }
        }
      } catch (error) {
        console.error('Status poll error:', error);
      }
    }, 30000); // Poll every 30 seconds
    
    return () => clearInterval(interval);
  }

  async function handleReplacement(cartId, itemId, approve) {
    await fetch(
      `https://services.wihy.ai/api/instacart/orders/${cartId}/replacements`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          item_id: itemId,
          approve: approve
        })
      }
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Instacart Delivery</Text>

      {!instacartData ? (
        <TouchableOpacity
          style={styles.createCartButton}
          onPress={sendToInstacart}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Creating Cart...' : '🛒 Send to Instacart'}
          </Text>
        </TouchableOpacity>
      ) : (
        <View>
          {/* CART SUMMARY */}
          <View style={styles.cartSummary}>
            <Text style={styles.storeName}>{instacartData.store.name}</Text>
            <Text style={styles.storeAddress}>{instacartData.store.address}</Text>
            
            <View style={styles.costBreakdown}>
              <View style={styles.costRow}>
                <Text>Subtotal:</Text>
                <Text>${instacartData.estimated_total.subtotal.toFixed(2)}</Text>
              </View>
              <View style={styles.costRow}>
                <Text>Delivery Fee:</Text>
                <Text>${instacartData.estimated_total.delivery_fee.toFixed(2)}</Text>
              </View>
              <View style={styles.costRow}>
                <Text>Service Fee:</Text>
                <Text>${instacartData.estimated_total.service_fee.toFixed(2)}</Text>
              </View>
              <View style={styles.costRow}>
                <Text>Tax:</Text>
                <Text>${instacartData.estimated_total.tax.toFixed(2)}</Text>
              </View>
              <View style={[styles.costRow, styles.totalRow]}>
                <Text style={styles.totalText}>Total:</Text>
                <Text style={styles.totalText}>
                  ${instacartData.estimated_total.total.toFixed(2)}
                </Text>
              </View>
            </View>

            <Text style={styles.itemsMatched}>
              {instacartData.items_matched} of {instacartData.items_total} items available
            </Text>

            {instacartData.unmatched_items.length > 0 && (
              <View style={styles.unmatchedSection}>
                <Text style={styles.unmatchedTitle}>Alternatives Suggested:</Text>
                {instacartData.unmatched_items.map((item, idx) => (
                  <Text key={idx} style={styles.unmatchedItem}>
                    • {item.name} → {item.alternative}
                  </Text>
                ))}
              </View>
            )}
          </View>

          {/* DELIVERY SLOTS */}
          <View style={styles.deliverySlots}>
            <Text style={styles.slotsTitle}>Available Delivery Times:</Text>
            {instacartData.store.available_slots.slice(0, 3).map((slot, idx) => (
              <View key={idx} style={styles.slotCard}>
                <Text style={styles.slotTime}>
                  {new Date(slot.time).toLocaleString()}
                </Text>
                <Text style={styles.slotFee}>
                  Delivery: ${slot.delivery_fee === 0 ? 'FREE' : slot.delivery_fee.toFixed(2)}
                </Text>
              </View>
            ))}
          </View>

          {/* ORDER STATUS */}
          {orderStatus && (
            <View style={styles.statusSection}>
              <Text style={styles.statusTitle}>Order Status:</Text>
              <Text style={styles.statusText}>{getStatusDisplay(orderStatus.status)}</Text>
              
              {orderStatus.shopper && (
                <View style={styles.shopperInfo}>
                  <Text>Shopper: {orderStatus.shopper.name}</Text>
                  <Text>Rating: {orderStatus.shopper.rating} ⭐</Text>
                </View>
              )}

              {orderStatus.estimated_delivery && (
                <Text style={styles.eta}>
                  ETA: {new Date(orderStatus.estimated_delivery).toLocaleTimeString()}
                </Text>
              )}
            </View>
          )}

          {/* OPEN CART BUTTON */}
          <TouchableOpacity
            style={styles.openCartButton}
            onPress={() => openInstacartApp(instacartData)}
          >
            <Text style={styles.buttonText}>Open in Instacart</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

function getStatusDisplay(status) {
  const displays = {
    'pending': '⏳ Order Pending',
    'shopper_assigned': '👤 Shopper Assigned',
    'shopping': '🛒 Shopping in Progress',
    'delivering': '🚗 Out for Delivery',
    'delivered': '✅ Delivered',
    'cancelled': '❌ Cancelled'
  };
  return displays[status] || status;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20
  },
  createCartButton: {
    backgroundColor: '#00A862',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center'
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold'
  },
  cartSummary: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16
  },
  storeName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4
  },
  storeAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16
  },
  costBreakdown: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 12
  },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 8,
    marginTop: 8
  },
  totalText: {
    fontSize: 18,
    fontWeight: 'bold'
  },
  itemsMatched: {
    marginTop: 12,
    fontSize: 14,
    color: '#00A862',
    fontWeight: 'bold'
  },
  unmatchedSection: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#FFF3CD',
    borderRadius: 8
  },
  unmatchedTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#856404'
  },
  unmatchedItem: {
    fontSize: 13,
    color: '#856404',
    marginBottom: 4
  },
  deliverySlots: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16
  },
  slotsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12
  },
  slotCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 8
  },
  slotTime: {
    fontSize: 14,
    fontWeight: '500'
  },
  slotFee: {
    fontSize: 14,
    color: '#00A862'
  },
  statusSection: {
    backgroundColor: '#E3F2FD',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8
  },
  statusText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 12
  },
  shopperInfo: {
    marginTop: 8,
    padding: 12,
    backgroundColor: 'white',
    borderRadius: 8
  },
  eta: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FF6F00'
  },
  openCartButton: {
    backgroundColor: '#00A862',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center'
  }
});

export default InstacartIntegrationScreen;
```

---

## � Real-World Example: Muscle Building Meal Plan for Family of 5

### **User Request:** 
"I need meals for a family of 5, we're trying to gain muscle with light weight training, and need a plan to build muscle"

### **API Request:**

```javascript
POST https://services.wihy.ai/api/meal-programs
Headers: {
  "Authorization": "Bearer {token}",
  "Content-Type": "application/json"
}

Body: {
  "userId": "user_12345",
  "name": "Muscle Building Family Meal Plan",
  "description": "High-protein family meals for 5 people focusing on muscle gain with light weight training. Family-friendly, easy to prepare, budget-conscious.",
  "duration_days": 7,
  "meals_per_day": 3,
  "dietary_preferences": ["high-protein", "muscle-building", "family-friendly"],
  "family_size": 5,
  "fitness_goal": "muscle-gain",
  "activity_level": "light-weight-training",
  "preferred_stores": ["Costco", "Sam's Club"],
  "budget_per_meal": 15,
  "cooking_skill": "beginner",
  "macro_targets": {
    "protein_per_person": 140, // grams per day
    "calories_per_person": 2400, // slight surplus for muscle gain
    "protein_percentage": 30,
    "carb_percentage": 45,
    "fat_percentage": 25
  }
}
```

---

> **📁 COMPLETE MOCK DATA FILES FOR CLIENT TESTING:**
> 
> All JSON responses below are also available as separate mock files for easy import:
> - **Full 7-Day Meal Program**: [mock-data-muscle-building-meal-plan.json](./mock-data-muscle-building-meal-plan.json) - Complete response from `POST /api/meal-programs`
> - **Calendar View (Monthly)**: [mock-data-calendar-view.json](./mock-data-calendar-view.json) - Complete response from `GET /api/meal-programs/:id/calendar`
> - **Shopping List**: [mock-data-shopping-list.json](./mock-data-shopping-list.json) - Complete response from `POST /api/meal-programs/:id/shopping-list`
> - **Instacart Cart Creation**: [mock-data-instacart-response.json](./mock-data-instacart-response.json) - Complete response from `POST /api/shopping-lists/:id/instacart`
> - **Instacart Order Status**: [mock-data-instacart-order-status.json](./mock-data-instacart-order-status.json) - Complete response from `GET /api/instacart/orders/:orderId/status`

```json
{
  "success": true,
  "program_id": "prog_muscle_family_001",
  "name": "Muscle Building Family Meal Plan",
  "description": "7-day high-protein plan optimized for muscle gain",
  "duration_days": 7,
  "total_meals": 21,
  "family_size": 5,
  "weekly_cost": {
    "total": 315.00,
    "per_person": 63.00,
    "per_meal": 15.00
  },
  "weekly_macros_per_person": {
    "avg_daily_calories": 2380,
    "avg_daily_protein": 142,
    "avg_daily_carbs": 268,
    "avg_daily_fat": 66
  },
  "days": [
    {
      "day_number": 1,
      "day_name": "Monday - High Protein Start",
      "date": "2026-01-03",
      "total_daily_cost": 45.00,
      "daily_macros_per_person": {
        "calories": 2400,
        "protein": 145,
        "carbs": 270,
        "fat": 67
      },
      "meals": [
        {
          "meal_id": "muscle_meal_001",
          "meal_type": "breakfast",
          "meal_name": "Protein-Packed Scramble with Toast",
          "servings": 5,
          "prep_time": 10,
          "cook_time": 15,
          "total_time": 25,
          "cost_per_serving": 2.20,
          "total_cost": 11.00,
          "nutrition_per_serving": {
            "calories": 480,
            "protein": 38,
            "carbs": 48,
            "fat": 16,
            "fiber": 6
          },
          "muscle_building_benefits": [
            "38g protein for morning muscle recovery",
            "Complex carbs for sustained energy during workouts",
            "Eggs contain leucine - key amino acid for muscle growth"
          ],
          "ingredients": [
            {
              "name": "Eggs",
              "amount": 15,
              "unit": "large",
              "brand": "Kirkland Signature (Costco)",
              "aisle": "Dairy",
              "cost": 4.99
            },
            {
              "name": "Egg whites (liquid)",
              "amount": 1,
              "unit": "cup",
              "brand": "Kirkland Signature",
              "aisle": "Dairy",
              "cost": 1.50,
              "notes": "Extra protein boost"
            },
            {
              "name": "Whole wheat bread",
              "amount": 10,
              "unit": "slices",
              "brand": "Dave's Killer Bread (Costco)",
              "aisle": "Bakery",
              "cost": 2.50
            },
            {
              "name": "Cheddar cheese",
              "amount": 1,
              "unit": "cup shredded",
              "brand": "Kirkland Signature",
              "aisle": "Dairy",
              "cost": 1.50
            },
            {
              "name": "Spinach",
              "amount": 2,
              "unit": "cups",
              "brand": "Organic (Costco)",
              "aisle": "Produce",
              "cost": 0.50
            }
          ],
          "instructions": [
            "Whisk 15 whole eggs + 1 cup egg whites in large bowl",
            "Heat large skillet over medium heat with cooking spray",
            "Add spinach, cook until wilted (2 minutes)",
            "Pour in egg mixture, scramble gently until just set",
            "Add shredded cheese, fold in",
            "Toast bread slices",
            "Serve scramble with 2 slices toast per person"
          ],
          "post_workout": false,
          "tags": ["high-protein", "muscle-building", "family-friendly", "budget-friendly"]
        },
        {
          "meal_id": "muscle_meal_002",
          "meal_type": "lunch",
          "meal_name": "Grilled Chicken & Rice Power Bowl",
          "servings": 5,
          "prep_time": 15,
          "cook_time": 25,
          "total_time": 40,
          "cost_per_serving": 3.40,
          "total_cost": 17.00,
          "nutrition_per_serving": {
            "calories": 620,
            "protein": 52,
            "carbs": 68,
            "fat": 14,
            "fiber": 8
          },
          "muscle_building_benefits": [
            "52g lean protein from chicken breast",
            "Brown rice provides sustained energy for afternoon workouts",
            "Broccoli rich in vitamins C & K for recovery",
            "Perfect post-training meal"
          ],
          "ingredients": [
            {
              "name": "Chicken breast",
              "amount": 3.5,
              "unit": "lbs",
              "brand": "Kirkland Signature (Costco)",
              "aisle": "Meat",
              "cost": 10.50,
              "notes": "~11 oz per person for muscle building"
            },
            {
              "name": "Brown rice",
              "amount": 2.5,
              "unit": "cups dry",
              "brand": "Kirkland Signature",
              "aisle": "Grains",
              "cost": 2.00
            },
            {
              "name": "Broccoli florets",
              "amount": 5,
              "unit": "cups",
              "brand": "Fresh (Costco)",
              "aisle": "Produce",
              "cost": 3.50
            },
            {
              "name": "Teriyaki sauce",
              "amount": 0.5,
              "unit": "cup",
              "brand": "Kikkoman",
              "aisle": "International",
              "cost": 1.00
            }
          ],
          "instructions": [
            "Cook brown rice: 2.5 cups dry rice + 5 cups water, simmer 40 min",
            "Season chicken breasts with salt, pepper, garlic powder",
            "Grill or pan-cook chicken 6-7 minutes per side (165°F internal)",
            "Steam broccoli for 6 minutes until tender-crisp",
            "Slice chicken into strips",
            "Assemble bowls: 1 cup rice, 7 oz sliced chicken, 1 cup broccoli",
            "Drizzle with teriyaki sauce"
          ],
          "meal_prep_friendly": true,
          "post_workout": true,
          "timing_note": "Ideal within 2 hours after weight training",
          "tags": ["high-protein", "muscle-building", "meal-prep", "post-workout"]
        },
        {
          "meal_id": "muscle_meal_003",
          "meal_type": "dinner",
          "meal_name": "Beef & Sweet Potato Power Plate",
          "servings": 5,
          "prep_time": 15,
          "cook_time": 30,
          "total_time": 45,
          "cost_per_serving": 3.40,
          "total_cost": 17.00,
          "nutrition_per_serving": {
            "calories": 700,
            "protein": 55,
            "carbs": 58,
            "fat": 24,
            "fiber": 8
          },
          "muscle_building_benefits": [
            "55g protein + creatine from beef for muscle growth",
            "Sweet potatoes high in complex carbs for glycogen replenishment",
            "Beef provides iron and B-vitamins for energy production",
            "Perfect evening meal for overnight muscle recovery"
          ],
          "ingredients": [
            {
              "name": "Lean ground beef (90/10)",
              "amount": 3,
              "unit": "lbs",
              "brand": "Kirkland Signature (Costco)",
              "aisle": "Meat",
              "cost": 12.00,
              "notes": "~10 oz per person"
            },
            {
              "name": "Sweet potatoes",
              "amount": 5,
              "unit": "large",
              "brand": "Organic (Costco)",
              "aisle": "Produce",
              "cost": 3.50
            },
            {
              "name": "Green beans",
              "amount": 2,
              "unit": "lbs",
              "brand": "Fresh or frozen",
              "aisle": "Produce/Frozen",
              "cost": 1.50
            }
          ],
          "instructions": [
            "Preheat oven to 400°F",
            "Pierce sweet potatoes with fork, bake 45 minutes until tender",
            "Brown ground beef in large skillet over medium-high heat",
            "Season beef with salt, pepper, onion powder, paprika",
            "Steam or sauté green beans for 8-10 minutes",
            "Split sweet potatoes, add butter if desired",
            "Serve: 1 sweet potato, 10 oz cooked beef, generous portion green beans"
          ],
          "post_workout": false,
          "bedtime_protein": true,
          "timing_note": "Eat 2-3 hours before bed for optimal overnight recovery",
          "tags": ["high-protein", "muscle-building", "complex-carbs", "family-dinner"]
        },
        {
          "meal_id": "muscle_snack_001",
          "meal_type": "snack",
          "meal_name": "Greek Yogurt Protein Parfait",
          "servings": 5,
          "prep_time": 5,
          "cook_time": 0,
          "total_time": 5,
          "cost_per_serving": 1.60,
          "total_cost": 8.00,
          "nutrition_per_serving": {
            "calories": 300,
            "protein": 25,
            "carbs": 36,
            "fat": 6,
            "fiber": 4
          },
          "muscle_building_benefits": [
            "25g protein from Greek yogurt (casein for slow release)",
            "Perfect pre-bedtime snack for overnight muscle repair",
            "Berries provide antioxidants for recovery"
          ],
          "ingredients": [
            {
              "name": "Greek yogurt (nonfat)",
              "amount": 5,
              "unit": "cups (7 oz each)",
              "brand": "Fage Total 0% (Costco)",
              "aisle": "Dairy",
              "cost": 6.00
            },
            {
              "name": "Granola",
              "amount": 1.25,
              "unit": "cups",
              "brand": "Nature Valley (Costco)",
              "aisle": "Cereal",
              "cost": 1.50
            },
            {
              "name": "Mixed berries",
              "amount": 2.5,
              "unit": "cups",
              "brand": "Frozen blend (Costco)",
              "aisle": "Frozen",
              "cost": 0.50
            }
          ],
          "instructions": [
            "Layer 1 cup Greek yogurt in each bowl",
            "Add 1/4 cup granola",
            "Top with 1/2 cup mixed berries",
            "Optional: drizzle with honey"
          ],
          "timing_note": "Great as evening snack 1 hour before bed",
          "tags": ["high-protein", "quick", "no-cook", "bedtime-snack"]
        }
      ],
      "daily_tips": [
        "Eat breakfast within 1 hour of waking to kickstart protein synthesis",
        "Have lunch post-workout if training in morning/afternoon",
        "Evening snack provides casein protein for overnight muscle recovery",
        "Drink at least 80 oz water throughout the day (16 oz per person)"
      ]
    },
    
    {
      "day_number": 2,
      "day_name": "Tuesday - Recovery Day",
      "date": "2026-01-04",
      "total_daily_cost": 42.00,
      "daily_macros_per_person": {
        "calories": 2350,
        "protein": 140,
        "carbs": 265,
        "fat": 65
      },
      "meals": [
        {
          "meal_id": "muscle_meal_004",
          "meal_type": "breakfast",
          "meal_name": "Protein Oatmeal Power Bowl",
          "servings": 5,
          "nutrition_per_serving": {
            "calories": 450,
            "protein": 32,
            "carbs": 62,
            "fat": 10,
            "fiber": 8
          },
          "muscle_building_benefits": [
            "Oats provide sustained energy + beta-glucan for recovery",
            "Protein powder adds 20g extra protein",
            "Perfect pre-workout meal (eat 1-2 hours before training)"
          ],
          "ingredients": [
            {
              "name": "Old-fashioned oats",
              "amount": 5,
              "unit": "cups dry",
              "brand": "Quaker (Costco)",
              "cost": 2.50
            },
            {
              "name": "Protein powder (vanilla)",
              "amount": 5,
              "unit": "scoops",
              "brand": "Optimum Nutrition Gold Standard (Costco)",
              "aisle": "Sports Nutrition",
              "cost": 5.00,
              "notes": "~24g protein per scoop"
            },
            {
              "name": "Bananas",
              "amount": 5,
              "unit": "medium",
              "cost": 1.50
            },
            {
              "name": "Almond butter",
              "amount": 5,
              "unit": "tbsp",
              "brand": "Kirkland Signature",
              "cost": 2.00
            }
          ],
          "instructions": [
            "Cook oats: 5 cups oats + 10 cups water, simmer 10 minutes",
            "Stir in 5 scoops protein powder until smooth",
            "Divide into 5 bowls",
            "Top each with sliced banana and 1 tbsp almond butter",
            "Optional: add cinnamon, honey"
          ],
          "pre_workout": true,
          "timing_note": "Eat 1-2 hours before weight training",
          "tags": ["high-protein", "pre-workout", "complex-carbs"]
        },
        {
          "meal_id": "muscle_meal_005",
          "meal_type": "lunch",
          "meal_name": "Salmon & Quinoa Power Bowl",
          "servings": 5,
          "nutrition_per_serving": {
            "calories": 580,
            "protein": 48,
            "carbs": 52,
            "fat": 18,
            "fiber": 7
          },
          "muscle_building_benefits": [
            "Salmon rich in omega-3s for reducing inflammation",
            "Quinoa is complete protein (all 9 amino acids)",
            "Great for recovery days between training sessions"
          ],
          "cost_total": 18.00
        },
        {
          "meal_id": "muscle_meal_006",
          "meal_type": "dinner",
          "meal_name": "Turkey Chili with Beans",
          "servings": 5,
          "nutrition_per_serving": {
            "calories": 640,
            "protein": 58,
            "carbs": 64,
            "fat": 16,
            "fiber": 14
          },
          "muscle_building_benefits": [
            "Lean turkey provides 50g+ protein per serving",
            "Beans add extra protein + fiber for satiety",
            "One-pot meal, great for batch cooking"
          ],
          "cost_total": 15.00
        }
      ]
    }
    
    // Days 3-7 continue with similar high-protein, muscle-building meals...
  ],
  
  "weekly_shopping_list": {
    "shopping_list_id": "list_muscle_family_001",
    "total_items": 48,
    "estimated_cost": 315.00,
    "store_breakdown": {
      "Costco": {
        "items": 38,
        "cost": 265.00
      },
      "Regular Grocery": {
        "items": 10,
        "cost": 50.00
      }
    },
    "items_by_category": {
      "Proteins (HIGH PRIORITY for Muscle Building)": [
        {
          "name": "Chicken breast",
          "quantity": 10,
          "unit": "lbs",
          "brand": "Kirkland Signature",
          "cost": 30.00,
          "aisle": "Meat",
          "muscle_building_note": "Primary lean protein source"
        },
        {
          "name": "Eggs",
          "quantity": 60,
          "unit": "large",
          "brand": "Kirkland Signature",
          "cost": 12.00,
          "aisle": "Dairy",
          "muscle_building_note": "Complete protein, rich in leucine"
        },
        {
          "name": "Greek yogurt (nonfat)",
          "quantity": 4,
          "unit": "tubs (32 oz)",
          "brand": "Fage Total 0%",
          "cost": 24.00,
          "aisle": "Dairy",
          "muscle_building_note": "Casein protein for overnight recovery"
        },
        {
          "name": "Ground beef (90/10)",
          "quantity": 6,
          "unit": "lbs",
          "brand": "Kirkland Signature",
          "cost": 24.00,
          "aisle": "Meat",
          "muscle_building_note": "Creatine + iron + complete protein"
        },
        {
          "name": "Salmon fillets",
          "quantity": 3,
          "unit": "lbs",
          "brand": "Wild-caught",
          "cost": 36.00,
          "aisle": "Seafood",
          "muscle_building_note": "Omega-3s reduce inflammation"
        },
        {
          "name": "Protein powder (vanilla)",
          "quantity": 1,
          "unit": "container (5 lbs)",
          "brand": "Optimum Nutrition Gold Standard",
          "cost": 50.00,
          "aisle": "Sports Nutrition",
          "muscle_building_note": "Quick protein for pre/post workout"
        }
      ],
      "Complex Carbs (Energy for Training)": [
        {
          "name": "Brown rice",
          "quantity": 1,
          "unit": "bag (10 lbs)",
          "brand": "Kirkland Signature",
          "cost": 12.00,
          "muscle_building_note": "Sustained energy, glycogen replenishment"
        },
        {
          "name": "Sweet potatoes",
          "quantity": 15,
          "unit": "large",
          "cost": 10.50,
          "muscle_building_note": "High-quality carbs for muscle glycogen"
        },
        {
          "name": "Oats",
          "quantity": 1,
          "unit": "container (10 lbs)",
          "brand": "Quaker",
          "cost": 15.00,
          "muscle_building_note": "Pre-workout fuel"
        },
        {
          "name": "Whole wheat bread",
          "quantity": 2,
          "unit": "loaves",
          "brand": "Dave's Killer Bread",
          "cost": 10.00
        },
        {
          "name": "Quinoa",
          "quantity": 1,
          "unit": "bag (4 lbs)",
          "brand": "Kirkland Signature",
          "cost": 12.00,
          "muscle_building_note": "Complete protein + complex carb"
        }
      ],
      "Vegetables (Recovery & Vitamins)": [
        {
          "name": "Broccoli",
          "quantity": 5,
          "unit": "lbs",
          "cost": 7.50,
          "muscle_building_note": "Vitamin C for recovery"
        },
        {
          "name": "Spinach",
          "quantity": 2,
          "unit": "containers (16 oz)",
          "cost": 5.00,
          "muscle_building_note": "Iron, nitrates for performance"
        },
        {
          "name": "Green beans",
          "quantity": 4,
          "unit": "lbs",
          "cost": 6.00
        }
      ],
      "Healthy Fats": [
        {
          "name": "Almond butter",
          "quantity": 1,
          "unit": "jar (26 oz)",
          "brand": "Kirkland Signature",
          "cost": 8.00,
          "muscle_building_note": "Healthy fats, vitamin E"
        },
        {
          "name": "Olive oil",
          "quantity": 1,
          "unit": "bottle (2L)",
          "brand": "Kirkland Signature Extra Virgin",
          "cost": 15.00
        }
      ]
    }
  },
  
  "muscle_building_program_tips": [
    "💪 **Protein Timing**: Spread protein evenly across 3 meals (40-50g each) for optimal muscle protein synthesis",
    "🏋️ **Post-Workout**: Consume lunch within 2 hours after weight training for best recovery",
    "😴 **Bedtime Protein**: Greek yogurt snack provides slow-digesting casein for overnight muscle repair",
    "💧 **Hydration**: Drink 80+ oz water daily (16 oz per family member). Dehydration impairs muscle recovery",
    "🍽️ **Calorie Surplus**: Plan provides slight surplus (~200-300 cal/day) needed for muscle growth",
    "📊 **Progressive Overload**: Increase weights gradually in gym + ensure adequate protein intake",
    "😊 **Consistency**: Muscle building requires 8-12 weeks. Stick to plan for best results",
    "🥛 **Leucine-Rich Foods**: Eggs, chicken, beef, Greek yogurt trigger muscle protein synthesis",
    "⏰ **Meal Prep Sunday**: Cook chicken, rice, sweet potatoes in bulk to save time during week"
  ],
  
  "light_weight_training_guide": {
    "recommended_schedule": "3-4 days per week (Monday, Wednesday, Friday, +optional Saturday)",
    "workout_duration": "45-60 minutes per session",
    "meal_timing_for_workouts": {
      "pre_workout": "Eat Protein Oatmeal 1-2 hours before gym (Day 2 breakfast)",
      "post_workout": "Eat Chicken & Rice Bowl within 2 hours after (Day 1 lunch)",
      "rest_days": "Still maintain high protein intake for recovery"
    },
    "beginner_tips": [
      "Focus on form over heavy weight",
      "Start with 3 sets of 8-12 reps per exercise",
      "Rest 60-90 seconds between sets",
      "Include compound exercises: squats, bench press, rows, deadlifts",
      "Sleep 7-9 hours nightly - muscle grows during rest!"
    ]
  },
  
  "family_modifications": {
    "for_kids_under_12": "Reduce portion sizes by 30%, focus on whole foods",
    "for_teens_in_sports": "May need additional snacks or larger portions",
    "non_training_family_members": "Adjust portions down slightly if not weight training"
  },
  
  "cost_savings_tips": [
    "Buy in bulk at Costco - saves $50-80/week vs regular grocery",
    "Rotisserie chicken ($4.99) = 2-3 meals worth of protein",
    "Freeze extra chicken breasts to prevent waste",
    "Cook rice and sweet potatoes in bulk on Sundays",
    "Protein powder = $1.25/serving vs $3+ protein bar"
  ]
}
```

### **How This Plan Builds Muscle:**

1. **High Protein (140g/person/day)**
   - Distributed evenly across 3 meals + snack
   - Triggers muscle protein synthesis throughout day
   - Includes leucine-rich foods (eggs, chicken, beef, Greek yogurt)

2. **Calorie Surplus (~2400 cal/person)**
   - Slight surplus needed for muscle growth
   - Not excessive - prevents fat gain
   - Adjustable based on individual needs

3. **Complex Carbs for Energy**
   - Sweet potatoes, brown rice, oats, quinoa
   - Fuel workouts + replenish muscle glycogen
   - Eaten around workout times for best results

4. **Recovery Nutrients**
   - Omega-3s from salmon reduce inflammation
   - Antioxidants from berries, broccoli, spinach
   - B-vitamins from beef for energy production

5. **Strategic Meal Timing**
   - Pre-workout: Oatmeal 1-2 hours before
   - Post-workout: Chicken & rice within 2 hours after
   - Bedtime: Greek yogurt for overnight recovery

### **Usage in Your Mobile App:**

```javascript
// User fills out the form in your app:
const userRequest = {
  familySize: 5,
  fitnessGoal: "muscle-gain",
  activityLevel: "light-weight-training",
  budgetPerMeal: 15,
  preferredStores: ["Costco"]
};

// Send to backend
const response = await fetch('https://services.wihy.ai/api/meal-programs', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: "Muscle Building Family Meal Plan",
    description: `High-protein meals for ${userRequest.familySize} people with ${userRequest.activityLevel}`,
    family_size: userRequest.familySize,
    fitness_goal: userRequest.fitnessGoal,
    activity_level: userRequest.activityLevel,
    budget_per_meal: userRequest.budgetPerMeal,
    preferred_stores: userRequest.preferredStores
  })
});

const mealPlan = await response.json();

// Display the plan in your app
// User gets:
// ✅ 7 days of high-protein meals
// ✅ Complete shopping list organized by category
// ✅ Muscle building tips and workout guidance
// ✅ Meal timing recommendations
// ✅ Cost breakdown ($315/week for family of 5)
// ✅ One-click send to Instacart
```

---

## �🔧 Three Ways to Auto-Fill the Create Meal Screen

### 1️⃣ **Use Template** Button Implementation

**When user clicks "Use Template" button:**

```javascript
// Step 1: Fetch all templates
const response = await fetch('https://services.wihy.ai/api/meals/templates');
const data = await response.json();

// data.templates = [
//   {
//     template_id: "template_1",
//     name: "Basic Protein Bowl",
//     nutrition: { calories: 500, protein: 40, carbs: 45, fat: 18, fiber: 8 },
//     ingredients: [
//       { name: "Grilled chicken breast", amount: 6, unit: "oz" },
//       { name: "Brown rice", amount: 1, unit: "cup" },
//       { name: "Mixed vegetables", amount: 1, unit: "cup" }
//     ],
//     tags: ["High Protein", "Meal Prep"],
//     category: "lunch",
//     preparation_time: 10,
//     cooking_time: 20
//   },
//   ... 7 more templates
// ]

// Step 2: Show template picker modal
showTemplatePickerModal(data.templates);

// Step 3: When user selects a template, populate the form
function populateFormFromTemplate(template) {
  // Auto-fill meal name
  setMealName(template.name);
  
  // Auto-fill nutrition facts
  setCalories(template.nutrition.calories);
  setProtein(template.nutrition.protein);
  setCarbs(template.nutrition.carbs);
  setFat(template.nutrition.fat);
  
  // Auto-fill ingredients (the key part!)
  clearIngredients();
  template.ingredients.forEach(ingredient => {
    addIngredient(ingredient.name, ingredient.amount, ingredient.unit);
  });
  
  // Auto-select tags
  template.tags.forEach(tag => {
    selectTag(tag);
  });
  
  // Auto-fill notes
  setNotes(`Prep time: ${template.preparation_time} min\nCook time: ${template.cooking_time} min`);
}
```

**Filter Templates by Category:**

```javascript
// Show only breakfast templates
const breakfastTemplates = await fetch(
  'https://services.wihy.ai/api/meals/templates?category=breakfast'
);

// Show only high-protein meals
const proteinTemplates = await fetch(
  'https://services.wihy.ai/api/meals/templates?tags=High Protein'
);
```

---

### 2️⃣ **Scan Recipe** Button Implementation

**When user clicks "Scan Recipe" button:**

```javascript
import { launchCamera } from 'react-native-image-picker';

async function scanRecipeFromCamera() {
  // Step 1: Launch camera
  const result = await launchCamera({
    mediaType: 'photo',
    quality: 0.8
  });
  
  if (!result.assets || !result.assets[0]) return;
  
  // Step 2: Upload to backend for analysis
  const formData = new FormData();
  formData.append('image', {
    uri: result.assets[0].uri,
    type: 'image/jpeg',
    name: 'recipe.jpg'
  });
  
  const response = await fetch('https://services.wihy.ai/api/scan/recipe', {
    method: 'POST',
    body: formData
  });
  
  const data = await response.json();
  
  // data.analysis = {
  //   meal_name: "Chocolate Chip Cookies",
  //   ingredients: [
  //     { name: "all-purpose flour", amount: 2, unit: "cups" },
  //     { name: "butter", amount: 1, unit: "cup" },
  //     { name: "chocolate chips", amount: 1, unit: "cup" }
  //   ],
  //   nutrition_facts: {
  //     per_serving: { calories: 180, protein: 2, carbs: 22, fat: 9 }
  //   },
  //   instructions: [
  //     { step: 1, text: "Preheat oven to 375°F" },
  //     { step: 2, text: "Cream butter and sugars" }
  //   ],
  //   suggested_tags: ["Dessert", "Baking"]
  // }
  
  // Step 3: Auto-populate form with scanned data
  populateFormFromScannedRecipe(data.analysis);
}

function populateFormFromScannedRecipe(analysis) {
  // Auto-fill meal name
  setMealName(analysis.meal_name);
  
  // Auto-fill nutrition (per serving)
  setCalories(analysis.nutrition_facts.per_serving.calories);
  setProtein(analysis.nutrition_facts.per_serving.protein);
  setCarbs(analysis.nutrition_facts.per_serving.carbs);
  setFat(analysis.nutrition_facts.per_serving.fat);
  
  // Auto-fill ingredients (OCR extracted!)
  clearIngredients();
  analysis.ingredients.forEach(ingredient => {
    addIngredient(ingredient.name, ingredient.amount, ingredient.unit);
  });
  
  // Auto-select suggested tags
  analysis.suggested_tags.forEach(tag => {
    selectTag(tag);
  });
  
  // Auto-fill instructions
  const instructionsText = analysis.instructions
    .map(step => `${step.step}. ${step.text}`)
    .join('\n');
  setNotes(instructionsText);
}
```

---

### 3️⃣ **Load User's Saved Meals** (Edit/Reuse)

**Add a "My Meals" button to load previously saved meals:**

```javascript
// Fetch user's meals
const response = await fetch(
  'https://services.wihy.ai/api/meals/user/user_12345'
);
const data = await response.json();

// data.meals = [
//   {
//     meal_id: "meal_abc123",
//     name: "My Grilled Salmon",
//     nutrition: { calories: 520, protein: 42, carbs: 28, fat: 24 },
//     ingredients: [
//       { name: "Salmon fillet", amount: 6, unit: "oz" },
//       { name: "Broccoli", amount: 1, unit: "cup" }
//     ],
//     tags: ["High Protein", "Dinner"],
//     notes: "My go-to dinner meal",
//     is_favorite: true,
//     times_logged: 12
//   }
// ]

// Show meal picker and let user select
showMealPickerModal(data.meals);

// When user selects a meal, populate form (same as template)
function populateFormFromSavedMeal(meal) {
  setMealName(meal.name);
  setCalories(meal.nutrition.calories);
  setProtein(meal.nutrition.protein);
  setCarbs(meal.nutrition.carbs);
  setFat(meal.nutrition.fat);
  
  clearIngredients();
  meal.ingredients.forEach(ingredient => {
    addIngredient(ingredient.name, ingredient.amount, ingredient.unit);
  });
  
  meal.tags.forEach(tag => selectTag(tag));
  setNotes(meal.notes);
}
```

**Search User's Meals:**

```javascript
// Search for meals with "chicken"
const searchResults = await fetch(
  'https://services.wihy.ai/api/meals/user/user_12345?search=chicken'
);

// Get only favorite meals
const favorites = await fetch(
  'https://services.wihy.ai/api/meals/user/user_12345?sort=times_logged&order=desc'
);
```

---

## 🛒 Generate Shopping List from Meal

**After user fills out the meal (or loads from template/scan):**

```javascript
async function generateShoppingList() {
  // Step 1: Get all ingredients from the form
  const ingredients = getAllIngredientsFromForm();
  // ingredients = [
  //   { name: "Grilled chicken breast", amount: 6, unit: "oz" },
  //   { name: "Brown rice", amount: 1, unit: "cup" },
  //   { name: "Mixed vegetables", amount: 1, unit: "cup" }
  // ]
  
  // Step 2: Send to shopping list endpoint
  const response = await fetch('https://services.wihy.ai/api/shopping-lists', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: 'user_12345',
      name: 'Grocery List - Basic Protein Bowl',
      items: ingredients.map(ing => ({
        name: ing.name,
        quantity: ing.amount,
        unit: ing.unit,
        checked: false
      }))
    })
  });
  
  const shoppingList = await response.json();
  // shoppingList.list_id = "list_xyz789"
  
  // Step 3: Navigate to shopping list screen
  navigation.navigate('ShoppingList', { listId: shoppingList.list_id });
}
```

**Send Shopping List to Instacart:**

```javascript
async function sendToInstacart(shoppingListId) {
  const response = await fetch(
    `https://services.wihy.ai/api/shopping-lists/${shoppingListId}/instacart`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'user_12345',
        preferences: {
          storeType: 'organic',
          budget: 'moderate'
        }
      })
    }
  );
  
  const instacartData = await response.json();
  // instacartData.cart_url - Opens in Instacart app
  
  Linking.openURL(instacartData.cart_url);
}
```

---

## 📅 Calendar Integration for Meal Planning

### **Get Meal Program Calendar View**

**Display meals by date for weekly/monthly meal planning:**

```javascript
// GET CALENDAR VIEW FOR MEAL PROGRAM
GET https://services.wihy.ai/api/meal-programs/prog_meal_123/calendar?month=2026-01
Headers: {
  "Authorization": "Bearer {token}"
}

Response: {
  "success": true,
  "program_id": "prog_meal_123",
  "program_name": "Keto Meal Plan - Week 1",
  "start_date": "2026-01-01",
  "end_date": "2026-01-31",
  "calendar_days": [
    {
      "date": "2026-01-03",
      "day_number": 1,
      "day_name": "Day 1 - High Protein",
      "meals": [
        {
          "meal_id": "meal_001",
          "meal_type": "breakfast",
          "meal_name": "Greek Yogurt Parfait",
          "calories": 320,
          "protein": 22,
          "carbs": 35,
          "fat": 8,
          "servings": 1,
          "recipe_id": "recipe_yogurt_01"
        },
        {
          "meal_id": "meal_002",
          "meal_type": "lunch",
          "meal_name": "Grilled Chicken Salad",
          "calories": 450,
          "protein": 38,
          "carbs": 25,
          "fat": 18,
          "servings": 1,
          "recipe_id": "recipe_salad_12"
        },
        {
          "meal_id": "meal_003",
          "meal_type": "dinner",
          "meal_name": "Salmon with Asparagus",
          "calories": 520,
          "protein": 42,
          "carbs": 28,
          "fat": 24,
          "servings": 1,
          "recipe_id": "recipe_salmon_05"
        },
        {
          "meal_id": "meal_004",
          "meal_type": "snack",
          "meal_name": "Protein Smoothie",
          "calories": 180,
          "protein": 25,
          "carbs": 15,
          "fat": 4,
          "servings": 1,
          "recipe_id": "recipe_smoothie_03"
        }
      ],
      "total_calories": 1470,
      "total_protein": 127,
      "total_carbs": 103,
      "total_fat": 54,
      "has_breakfast": true,
      "has_lunch": true,
      "has_dinner": true,
      "has_snacks": true
    },
    {
      "date": "2026-01-04",
      "day_number": 2,
      "day_name": "Day 2 - Balanced",
      "meals": [
        {
          "meal_id": "meal_005",
          "meal_type": "breakfast",
          "meal_name": "Egg White Scramble",
          "calories": 280,
          "protein": 28,
          "carbs": 22,
          "fat": 8,
          "servings": 1,
          "recipe_id": "recipe_eggs_02"
        },
        {
          "meal_id": "meal_006",
          "meal_type": "lunch",
          "meal_name": "Turkey Avocado Wrap",
          "calories": 420,
          "protein": 32,
          "carbs": 38,
          "fat": 16,
          "servings": 1,
          "recipe_id": "recipe_wrap_08"
        },
        {
          "meal_id": "meal_007",
          "meal_type": "dinner",
          "meal_name": "Beef Stir Fry",
          "calories": 480,
          "protein": 36,
          "carbs": 42,
          "fat": 18,
          "servings": 1,
          "recipe_id": "recipe_stirfry_04"
        }
      ],
      "total_calories": 1180,
      "total_protein": 96,
      "total_carbs": 102,
      "total_fat": 42,
      "has_breakfast": true,
      "has_lunch": true,
      "has_dinner": true,
      "has_snacks": false
    }
  ],
  "summary": {
    "total_days": 31,
    "avg_calories_per_day": 1425,
    "avg_protein_per_day": 118,
    "total_calories": 44175,
    "days_with_breakfast": 31,
    "days_with_lunch": 31,
    "days_with_dinner": 31,
    "days_with_snacks": 18
  }
}

// Alternative: Get custom date range
GET https://services.wihy.ai/api/meal-programs/prog_meal_123/calendar?start_date=2026-01-01&end_date=2026-01-07

// Use cases for meal calendar endpoint:
// - Display weekly meal plans with all meals per day
// - Show macros/calories for each day
// - Plan grocery shopping by week
// - Schedule meal prep reminders
// - Visualize diet adherence over time
```

---

## � React Native Calendar Component for Meals

### **Meal Planning Calendar Screen**

```javascript
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Calendar } from 'react-native-calendars';

function MealPlanningCalendarScreen({ programId }) {
  const [calendarData, setCalendarData] = useState(null);
  const [markedDates, setMarkedDates] = useState({});
  const [selectedDate, setSelectedDate] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    loadCalendarData();
  }, [programId, currentMonth]);

  async function loadCalendarData() {
    const year = currentMonth.getFullYear();
    const month = (currentMonth.getMonth() + 1).toString().padStart(2, '0');
    const monthStr = `${year}-${month}`;

    const response = await fetch(
      `https://services.wihy.ai/api/meal-programs/${programId}/calendar?month=${monthStr}`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }
    );

    const data = await response.json();

    if (data.success) {
      setCalendarData(data);
      
      // Convert to react-native-calendars format
      const marked = {};
      data.calendar_days.forEach(day => {
        // Color code by calories
        const calorieLevel = day.total_calories > 1800 ? 'high' : 
                            day.total_calories > 1400 ? 'medium' : 'low';
        
        const dotColor = calorieLevel === 'high' ? '#FF5722' :
                        calorieLevel === 'medium' ? '#4CAF50' : '#2196F3';

        marked[day.date] = {
          marked: true,
          dotColor: dotColor,
          customStyles: {
            container: {
              backgroundColor: 'white',
              borderRadius: 8,
              borderWidth: day.has_breakfast && day.has_lunch && day.has_dinner ? 2 : 0,
              borderColor: '#4CAF50'
            },
            text: {
              color: 'black',
              fontWeight: 'bold'
            }
          }
        };

        // Highlight today
        const today = new Date().toISOString().split('T')[0];
        if (day.date === today) {
          marked[day.date].selected = true;
          marked[day.date].selectedColor = '#FF9800';
        }
      });

      setMarkedDates(marked);
    }
  }

  function onDayPress(day) {
    setSelectedDate(day.dateString);
  }

  function onMonthChange(month) {
    setCurrentMonth(new Date(month.year, month.month - 1, 1));
  }

  // Get meals for selected date
  const selectedDayData = calendarData?.calendar_days.find(
    day => day.date === selectedDate
  );

  // Helper to get meal icon
  const getMealIcon = (mealType) => {
    const icons = {
      breakfast: '🍳',
      lunch: '🥗',
      dinner: '🍽️',
      snack: '🍎'
    };
    return icons[mealType] || '🍴';
  };

  return (
    <View style={styles.container}>
      {/* HEADER WITH NUTRITION STATS */}
      <View style={styles.header}>
        <Text style={styles.programName}>{calendarData?.program_name}</Text>
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>{calendarData?.summary.avg_calories_per_day}</Text>
            <Text style={styles.statLabel}>Avg Calories</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>{calendarData?.summary.avg_protein_per_day}g</Text>
            <Text style={styles.statLabel}>Avg Protein</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>{calendarData?.summary.total_days}</Text>
            <Text style={styles.statLabel}>Days Planned</Text>
          </View>
        </View>
      </View>

      {/* CALENDAR */}
      <Calendar
        current={currentMonth.toISOString().split('T')[0]}
        markedDates={markedDates}
        markingType='custom'
        onDayPress={onDayPress}
        onMonthChange={onMonthChange}
        theme={{
          todayTextColor: '#FF9800',
          selectedDayBackgroundColor: '#4A90E2',
          dotColor: '#4CAF50',
          selectedDotColor: '#fff'
        }}
      />

      {/* LEGEND */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#2196F3' }]} />
          <Text style={styles.legendText}>Low Cal (&lt;1400)</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#4CAF50' }]} />
          <Text style={styles.legendText}>Medium Cal (1400-1800)</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#FF5722' }]} />
          <Text style={styles.legendText}>High Cal (&gt;1800)</Text>
        </View>
      </View>

      {/* SELECTED DAY MEALS */}
      {selectedDayData && (
        <ScrollView style={styles.dayDetails}>
          <Text style={styles.selectedDateTitle}>
            {selectedDayData.day_name} - {new Date(selectedDate).toLocaleDateString('en-US', { 
              weekday: 'long', 
              month: 'long', 
              day: 'numeric' 
            })}
          </Text>

          {/* DAILY MACROS */}
          <View style={styles.macrosCard}>
            <View style={styles.macroItem}>
              <Text style={styles.macroValue}>{selectedDayData.total_calories}</Text>
              <Text style={styles.macroLabel}>Calories</Text>
            </View>
            <View style={styles.macroItem}>
              <Text style={styles.macroValue}>{selectedDayData.total_protein}g</Text>
              <Text style={styles.macroLabel}>Protein</Text>
            </View>
            <View style={styles.macroItem}>
              <Text style={styles.macroValue}>{selectedDayData.total_carbs}g</Text>
              <Text style={styles.macroLabel}>Carbs</Text>
            </View>
            <View style={styles.macroItem}>
              <Text style={styles.macroValue}>{selectedDayData.total_fat}g</Text>
              <Text style={styles.macroLabel}>Fat</Text>
            </View>
          </View>

          {/* MEALS LIST */}
          <Text style={styles.mealsHeader}>Today's Meals</Text>
          {selectedDayData.meals.map(meal => (
            <View key={meal.meal_id} style={styles.mealCard}>
              <View style={styles.mealHeader}>
                <Text style={styles.mealIcon}>{getMealIcon(meal.meal_type)}</Text>
                <View style={styles.mealInfo}>
                  <Text style={styles.mealType}>{meal.meal_type.toUpperCase()}</Text>
                  <Text style={styles.mealName}>{meal.meal_name}</Text>
                </View>
                <Text style={styles.mealCalories}>{meal.calories} cal</Text>
              </View>

              <View style={styles.mealMacros}>
                <Text style={styles.mealMacro}>P: {meal.protein}g</Text>
                <Text style={styles.mealMacro}>C: {meal.carbs}g</Text>
                <Text style={styles.mealMacro}>F: {meal.fat}g</Text>
              </View>

              <TouchableOpacity
                style={styles.viewRecipeButton}
                onPress={() => navigation.navigate('RecipeDetail', {
                  recipeId: meal.recipe_id
                })}
              >
                <Text style={styles.viewRecipeButtonText}>View Recipe</Text>
              </TouchableOpacity>
            </View>
          ))}

          {/* MEAL PREP BUTTON */}
          <TouchableOpacity
            style={styles.mealPrepButton}
            onPress={() => {
              // Generate shopping list for this day
              const ingredients = selectedDayData.meals.flatMap(m => m.ingredients || []);
              generateShoppingList(ingredients);
            }}
          >
            <Text style={styles.mealPrepButtonText}>🛒 Generate Shopping List</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* WEEKLY VIEW TOGGLE */}
      <TouchableOpacity
        style={styles.weeklyViewButton}
        onPress={() => navigation.navigate('WeeklyMealPlan', { programId })}
      >
        <Text style={styles.weeklyViewButtonText}>📅 View Weekly Plan</Text>
      </TouchableOpacity>
    </View>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  header: {
    padding: 16,
    backgroundColor: '#4CAF50',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20
  },
  programName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 12
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around'
  },
  stat: {
    alignItems: 'center'
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white'
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 12,
    backgroundColor: '#f5f5f5'
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6
  },
  legendText: {
    fontSize: 10,
    color: '#666'
  },
  dayDetails: {
    flex: 1,
    padding: 16
  },
  selectedDateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16
  },
  macrosCard: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16
  },
  macroItem: {
    alignItems: 'center'
  },
  macroValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50'
  },
  macroLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4
  },
  mealsHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12
  },
  mealCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  mealHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  mealIcon: {
    fontSize: 32,
    marginRight: 12
  },
  mealInfo: {
    flex: 1
  },
  mealType: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FF9800',
    letterSpacing: 1
  },
  mealName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 2
  },
  mealCalories: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50'
  },
  mealMacros: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 8,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0'
  },
  mealMacro: {
    fontSize: 12,
    color: '#666'
  },
  viewRecipeButton: {
    backgroundColor: '#2196F3',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8
  },
  viewRecipeButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14
  },
  mealPrepButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16
  },
  mealPrepButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16
  },
  weeklyViewButton: {
    backgroundColor: '#FF9800',
    padding: 16,
    margin: 16,
    borderRadius: 12,
    alignItems: 'center'
  },
  weeklyViewButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16
  }
});

export default MealPlanningCalendarScreen;
```

**Calendar Features:**
- 📅 Monthly view with color-coded calorie levels
- 🍎 Visual meal type indicators (breakfast, lunch, dinner, snacks)
- 📊 Daily macro breakdowns (calories, protein, carbs, fat)
- 🔔 Perfect for meal prep planning
- 🛒 One-click shopping list generation per day
- 📱 Tap any day to see full meal details

---

## �📋 Complete UI Flow Example

### React Native Implementation

```javascript
import React, { useState } from 'react';
import { View, Text, Button, FlatList } from 'react-native';

function CreateMealScreen({ navigation, route }) {
  const [mealName, setMealName] = useState('');
  const [calories, setCalories] = useState(0);
  const [protein, setProtein] = useState(0);
  const [carbs, setCarbs] = useState(0);
  const [fat, setFat] = useState(0);
  const [ingredients, setIngredients] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [notes, setNotes] = useState('');
  
  // === TEMPLATE PICKER ===
  async function showTemplatePicker() {
    const response = await fetch('https://services.wihy.ai/api/meals/templates');
    const data = await response.json();
    
    // Show modal with templates
    navigation.navigate('TemplatePicker', {
      templates: data.templates,
      onSelect: (template) => {
        // Auto-fill form
        setMealName(template.name);
        setCalories(template.nutrition.calories);
        setProtein(template.nutrition.protein);
        setCarbs(template.nutrition.carbs);
        setFat(template.nutrition.fat);
        setIngredients(template.ingredients);
        setSelectedTags(template.tags);
        setNotes(`Prep: ${template.preparation_time} min\nCook: ${template.cooking_time} min`);
      }
    });
  }
  
  // === RECIPE SCANNER ===
  async function scanRecipe() {
    const imageResult = await launchCamera({ mediaType: 'photo' });
    if (!imageResult.assets) return;
    
    const formData = new FormData();
    formData.append('image', {
      uri: imageResult.assets[0].uri,
      type: 'image/jpeg',
      name: 'recipe.jpg'
    });
    
    const response = await fetch('https://services.wihy.ai/api/scan/recipe', {
      method: 'POST',
      body: formData
    });
    
    const data = await response.json();
    
    // Auto-fill from scanned recipe
    setMealName(data.analysis.meal_name);
    setCalories(data.analysis.nutrition_facts.per_serving.calories);
    setProtein(data.analysis.nutrition_facts.per_serving.protein);
    setCarbs(data.analysis.nutrition_facts.per_serving.carbs);
    setFat(data.analysis.nutrition_facts.per_serving.fat);
    setIngredients(data.analysis.ingredients);
    setSelectedTags(data.analysis.suggested_tags);
    
    const instructions = data.analysis.instructions
      .map(s => `${s.step}. ${s.text}`)
      .join('\n');
    setNotes(instructions);
  }
  
  // === SAVE MEAL ===
  async function saveMeal() {
    const response = await fetch('https://services.wihy.ai/api/meals/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: 'user_12345',
        name: mealName,
        nutrition: { calories, protein, carbs, fat },
        ingredients: ingredients,
        tags: selectedTags,
        notes: notes
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      Alert.alert('Success', 'Meal saved!');
      
      // Ask if they want to create shopping list
      Alert.alert(
        'Create Shopping List?',
        'Generate a shopping list for this meal?',
        [
          { text: 'No', style: 'cancel' },
          { 
            text: 'Yes', 
            onPress: () => createShoppingListFromMeal(result.meal_id)
          }
        ]
      );
    }
  }
  
  // === GENERATE SHOPPING LIST ===
  async function createShoppingListFromMeal(mealId) {
    const response = await fetch('https://services.wihy.ai/api/shopping-lists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'user_12345',
        name: `Shopping List - ${mealName}`,
        items: ingredients.map(ing => ({
          name: ing.name,
          quantity: ing.amount,
          unit: ing.unit,
          checked: false
        }))
      })
    });
    
    const shoppingList = await response.json();
    
    // Navigate to shopping list screen
    navigation.navigate('ShoppingList', { 
      listId: shoppingList.list_id 
    });
  }
  
  return (
    <View>
      {/* Quick Start Buttons */}
      <View style={styles.quickStart}>
        <Button 
          title="Use Template" 
          onPress={showTemplatePicker}
          icon="🍽️"
        />
        
        <Button 
          title="Scan Recipe" 
          onPress={scanRecipe}
          icon="📷"
        />
      </View>
      
      {/* Manual Input Form */}
      <TextInput 
        placeholder="Meal Name"
        value={mealName}
        onChangeText={setMealName}
      />
      
      {/* Nutrition inputs... */}
      
      {/* Ingredients List */}
      <FlatList
        data={ingredients}
        renderItem={({ item }) => (
          <Text>{item.amount} {item.unit} {item.name}</Text>
        )}
      />
      
      {/* Save Button */}
      <Button title="Save Meal" onPress={saveMeal} />
      
      {/* Generate Shopping List Button */}
      {ingredients.length > 0 && (
        <Button 
          title="🛒 Generate Shopping List" 
          onPress={() => createShoppingListFromMeal(null)}
        />
      )}
    </View>
  );
}
```

---

## 🎯 Summary: What Your Mobile App Should Do

### Current Problem:
❌ User must manually type everything
❌ No ingredient auto-fill
❌ Can't generate shopping lists
❌ Time-consuming meal creation

### Solution (Use These APIs):

1. **"Use Template" Button**
   - `GET /api/meals/templates` → 8 ready-to-use meals
   - Auto-fills: name, nutrition, ingredients, tags
   - **Zero manual input required!**

2. **"Scan Recipe" Button**
   - `POST /api/scan/recipe` → OCR extracts everything
   - Auto-fills: name, nutrition, ingredients, instructions
   - **Just take a photo!**

3. **"My Meals" Button** (add this!)
   - `GET /api/meals/user/:userId` → User's saved meals
   - Load and reuse previous meals
   - Edit and create variations

4. **"Generate Shopping List" Button** (add this!)
   - `POST /api/shopping-lists` → Creates list from ingredients
   - Auto-sends to Instacart
   - **One-click grocery shopping!**

---

## 📊 Available Templates (Ready to Use)

| Template | Calories | Protein | Ingredients | Category |
|----------|----------|---------|-------------|----------|
| Basic Protein Bowl | 500 | 40g | 4 items | Lunch |
| Quick Breakfast Smoothie | 350 | 25g | 5 items | Breakfast |
| Grilled Salmon Dinner | 550 | 42g | 3 items | Dinner |
| Greek Yogurt Parfait | 320 | 22g | 4 items | Breakfast |
| Turkey Avocado Wrap | 420 | 32g | 5 items | Lunch |
| Veggie Stir Fry | 380 | 18g | 6 items | Dinner |
| Egg White Scramble | 280 | 28g | 4 items | Breakfast |
| Tuna Salad | 340 | 35g | 5 items | Lunch |

Each template includes:
- ✅ Full ingredient list with amounts
- ✅ Complete nutrition facts
- ✅ Tags (High Protein, Quick, etc.)
- ✅ Preparation and cooking times
- ✅ Serving size

---

## 🚀 Next Steps for Mobile Team

1. **Add "Template Picker" Modal**
   - Fetch templates on screen load
   - Show as grid/list
   - One-tap to auto-fill entire form

2. **Implement Recipe Scanner**
   - Camera integration (already planned)
   - Upload to `/api/scan/recipe`
   - Parse response and fill form

3. **Add "Shopping List" Generation**
   - Button appears when ingredients exist
   - Creates list from current meal
   - Option to send to Instacart

4. **Add "My Meals" Library**
   - Show user's saved meals
   - Filter by tags/favorites
   - Load meal into form for editing/reuse

---

## 💡 User Experience Improvement

**Before (Current):**
1. User opens "Create Meal"
2. Manually types meal name ⏱️
3. Manually enters calories ⏱️
4. Manually enters protein/carbs/fat ⏱️
5. Manually adds each ingredient ⏱️⏱️⏱️
6. Manually selects tags ⏱️
7. Manually types notes ⏱️
**Total Time: ~5-10 minutes per meal**

**After (With Integration):**
1. User opens "Create Meal"
2. Taps "Use Template" or "Scan Recipe"
3. **Everything auto-fills in 2 seconds** ✨
4. User reviews and saves
5. Taps "Generate Shopping List"
6. **Instacart cart ready!** 🛒
**Total Time: ~30 seconds per meal**

---

## � Complete Shopping List Implementation

### **Shopping List Generation from Weekly Meal Plan**

```javascript
// Generate shopping list for entire week from meal program
async function generateWeeklyShoppingList(programId) {
  const response = await fetch(
    `https://services.wihy.ai/api/meal-programs/${programId}/shopping-list`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        start_date: '2026-01-03',
        end_date: '2026-01-09',
        consolidate: true,  // Combine duplicate ingredients
        group_by_category: true  // Group by Produce, Dairy, Meat, etc.
      })
    }
  );

  const data = await response.json();
  
  // Response structure:
  // {
  //   "success": true,
  //   "shopping_list_id": "list_xyz789",
  //   "week_start": "2026-01-03",
  //   "week_end": "2026-01-09",
  //   "total_items": 42,
  //   "estimated_cost": {
  //     "min": 165,
  //     "max": 210,
  //     "currency": "USD"
  //   },
  //   "stores": {
  //     "preferred": "Costco",
  //     "alternatives": ["Trader Joe's", "Whole Foods"]
  //   },
  //   "items_by_category": {
  //     "Proteins": [
  //       {
  //         "item_id": "item_001",
  //         "name": "Chicken breast",
  //         "quantity": 3,
  //         "unit": "lbs",
  //         "estimated_price": 18.99,
  //         "brand_preference": "Kirkland Signature (Costco)",
  //         "checked": false,
  //         "used_in_meals": ["Day 1 Lunch", "Day 3 Dinner", "Day 5 Lunch"],
  //         "aisle": "Meat & Seafood"
  //       },
  //       {
  //         "item_id": "item_002",
  //         "name": "Salmon fillets",
  //         "quantity": 1.5,
  //         "unit": "lbs",
  //         "estimated_price": 22.99,
  //         "brand_preference": "Wild-caught",
  //         "checked": false,
  //         "used_in_meals": ["Day 1 Dinner", "Day 4 Dinner"],
  //         "aisle": "Meat & Seafood"
  //       },
  //       {
  //         "item_id": "item_003",
  //         "name": "Greek yogurt",
  //         "quantity": 3,
  //         "unit": "containers (32 oz)",
  //         "estimated_price": 12.99,
  //         "brand_preference": "Fage Total 0%",
  //         "checked": false,
  //         "used_in_meals": ["Day 2-7 Breakfast"],
  //         "aisle": "Dairy"
  //       }
  //     ],
  //     "Produce": [
  //       {
  //         "item_id": "item_004",
  //         "name": "Broccoli crowns",
  //         "quantity": 4,
  //         "unit": "crowns",
  //         "estimated_price": 8.99,
  //         "checked": false,
  //         "used_in_meals": ["Day 1-6 Dinners"],
  //         "aisle": "Produce"
  //       },
  //       {
  //         "item_id": "item_005",
  //         "name": "Spinach",
  //         "quantity": 2,
  //         "unit": "bags (16 oz)",
  //         "estimated_price": 5.99,
  //         "checked": false,
  //         "used_in_meals": ["Day 2-5 Lunches"],
  //         "aisle": "Produce"
  //       },
  //       {
  //         "item_id": "item_006",
  //         "name": "Mixed berries",
  //         "quantity": 2,
  //         "unit": "containers (18 oz)",
  //         "estimated_price": 8.99,
  //         "brand_preference": "Organic frozen blend (Costco)",
  //         "checked": false,
  //         "used_in_meals": ["Day 1-7 Breakfast"],
  //         "aisle": "Frozen"
  //       }
  //     ],
  //     "Grains & Carbs": [
  //       {
  //         "item_id": "item_007",
  //         "name": "Brown rice",
  //         "quantity": 1,
  //         "unit": "bag (5 lbs)",
  //         "estimated_price": 7.99,
  //         "checked": false,
  //         "used_in_meals": ["Day 1-7 Various"],
  //         "aisle": "Grains & Pasta"
  //       },
  //       {
  //         "item_id": "item_008",
  //         "name": "Oats",
  //         "quantity": 1,
  //         "unit": "container (42 oz)",
  //         "estimated_price": 6.99,
  //         "brand_preference": "Quaker Old Fashioned",
  //         "checked": false,
  //         "used_in_meals": ["Day 1-7 Breakfast"],
  //         "aisle": "Cereal & Breakfast"
  //       },
  //       {
  //         "item_id": "item_009",
  //         "name": "Sweet potatoes",
  //         "quantity": 6,
  //         "unit": "medium",
  //         "estimated_price": 7.99,
  //         "checked": false,
  //         "used_in_meals": ["Day 1-6 Dinners"],
  //         "aisle": "Produce"
  //       }
  //     ],
  //     "Pantry & Condiments": [
  //       {
  //         "item_id": "item_010",
  //         "name": "Olive oil",
  //         "quantity": 1,
  //         "unit": "bottle (33.8 oz)",
  //         "estimated_price": 12.99,
  //         "brand_preference": "Kirkland Signature Extra Virgin",
  //         "checked": false,
  //         "used_in_meals": ["All meals - cooking"],
  //         "aisle": "Oils & Vinegars"
  //       },
  //       {
  //         "item_id": "item_011",
  //         "name": "Soy sauce",
  //         "quantity": 1,
  //         "unit": "bottle (64 oz)",
  //         "estimated_price": 5.99,
  //         "checked": false,
  //         "used_in_meals": ["Stir fry meals"],
  //         "aisle": "International"
  //       }
  //     ]
  //   },
  //   "meal_prep_tips": [
  //     "Cook all brown rice on Sunday for the week",
  //     "Pre-portion Greek yogurt into containers",
  //     "Grill 2 lbs chicken breast for quick lunches",
  //     "Wash and chop vegetables Sunday evening"
  //   ],
  //   "instacart_ready": true,
  //   "instacart_cart_url": "https://instacart.com/cart/wihy_list_xyz789"
  // }

  return data;
}
```

### **React Native Shopping List Screen**

```javascript
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { CheckBox } from 'react-native-elements';

function ShoppingListScreen({ route, navigation }) {
  const { listId, programId } = route.params;
  const [shoppingList, setShoppingList] = useState(null);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [checkedItems, setCheckedItems] = useState({});

  useEffect(() => {
    loadShoppingList();
  }, [listId]);

  async function loadShoppingList() {
    const response = await fetch(
      `https://services.wihy.ai/api/shopping-lists/${listId}`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }
    );

    const data = await response.json();
    if (data.success) {
      setShoppingList(data);
      
      // Pre-expand all categories
      const expanded = {};
      Object.keys(data.items_by_category).forEach(category => {
        expanded[category] = true;
      });
      setExpandedCategories(expanded);
    }
  }

  function toggleItemCheck(itemId) {
    setCheckedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  }

  function toggleCategoryExpand(category) {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  }

  async function sendToInstacart() {
    try {
      const response = await fetch(
        `https://services.wihy.ai/api/shopping-lists/${listId}/instacart`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            store_preference: shoppingList.stores.preferred
          })
        }
      );

      const data = await response.json();
      
      if (data.success && data.cart_url) {
        Alert.alert(
          'Open Instacart?',
          `Your shopping list is ready at ${shoppingList.stores.preferred}`,
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Open Instacart', 
              onPress: () => Linking.openURL(data.cart_url)
            }
          ]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to send to Instacart');
    }
  }

  function shareList() {
    const text = generateShareableText();
    Share.share({
      message: text,
      title: `Shopping List - ${shoppingList.week_start} to ${shoppingList.week_end}`
    });
  }

  function generateShareableText() {
    let text = `🛒 Shopping List (${shoppingList.week_start} to ${shoppingList.week_end})\n\n`;
    
    Object.entries(shoppingList.items_by_category).forEach(([category, items]) => {
      text += `${category}:\n`;
      items.forEach(item => {
        const checked = checkedItems[item.item_id] ? '✓' : '☐';
        text += `  ${checked} ${item.quantity} ${item.unit} ${item.name}\n`;
      });
      text += '\n';
    });
    
    text += `Total Items: ${shoppingList.total_items}\n`;
    text += `Estimated Cost: $${shoppingList.estimated_cost.min}-$${shoppingList.estimated_cost.max}\n`;
    
    return text;
  }

  const checkedCount = Object.values(checkedItems).filter(v => v).length;
  const totalCount = shoppingList?.total_items || 0;
  const progress = totalCount > 0 ? (checkedCount / totalCount) * 100 : 0;

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Weekly Shopping List</Text>
        <Text style={styles.headerSubtitle}>
          {shoppingList?.week_start} to {shoppingList?.week_end}
        </Text>
        
        {/* PROGRESS BAR */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {checkedCount} / {totalCount} items ({Math.round(progress)}%)
          </Text>
        </View>

        {/* COST ESTIMATE */}
        <View style={styles.costContainer}>
          <Text style={styles.costLabel}>Estimated Total:</Text>
          <Text style={styles.costValue}>
            ${shoppingList?.estimated_cost.min} - ${shoppingList?.estimated_cost.max}
          </Text>
        </View>
      </View>

      {/* SHOPPING ITEMS BY CATEGORY */}
      <FlatList
        data={Object.entries(shoppingList?.items_by_category || {})}
        keyExtractor={([category]) => category}
        renderItem={({ item: [category, items] }) => (
          <View style={styles.categorySection}>
            {/* CATEGORY HEADER */}
            <TouchableOpacity
              style={styles.categoryHeader}
              onPress={() => toggleCategoryExpand(category)}
            >
              <Text style={styles.categoryIcon}>
                {getCategoryIcon(category)}
              </Text>
              <Text style={styles.categoryTitle}>{category}</Text>
              <Text style={styles.categoryCount}>
                {items.filter(i => checkedItems[i.item_id]).length} / {items.length}
              </Text>
              <Text style={styles.expandIcon}>
                {expandedCategories[category] ? '▼' : '▶'}
              </Text>
            </TouchableOpacity>

            {/* ITEMS IN CATEGORY */}
            {expandedCategories[category] && items.map(item => (
              <View key={item.item_id} style={styles.itemRow}>
                <CheckBox
                  checked={checkedItems[item.item_id] || false}
                  onPress={() => toggleItemCheck(item.item_id)}
                  containerStyle={styles.checkbox}
                />
                
                <View style={styles.itemDetails}>
                  <Text style={[
                    styles.itemName,
                    checkedItems[item.item_id] && styles.itemNameChecked
                  ]}>
                    {item.quantity} {item.unit} - {item.name}
                  </Text>
                  
                  {item.brand_preference && (
                    <Text style={styles.itemBrand}>
                      Brand: {item.brand_preference}
                    </Text>
                  )}
                  
                  {item.used_in_meals && (
                    <Text style={styles.itemUsage}>
                      Used in: {item.used_in_meals.slice(0, 2).join(', ')}
                      {item.used_in_meals.length > 2 && ` +${item.used_in_meals.length - 2} more`}
                    </Text>
                  )}
                  
                  {item.estimated_price && (
                    <Text style={styles.itemPrice}>
                      ~${item.estimated_price.toFixed(2)}
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}
      />

      {/* MEAL PREP TIPS */}
      {shoppingList?.meal_prep_tips && (
        <View style={styles.tipsSection}>
          <Text style={styles.tipsTitle}>💡 Meal Prep Tips</Text>
          {shoppingList.meal_prep_tips.map((tip, index) => (
            <Text key={index} style={styles.tipText}>
              • {tip}
            </Text>
          ))}
        </View>
      )}

      {/* ACTION BUTTONS */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.instacartButton}
          onPress={sendToInstacart}
        >
          <Text style={styles.buttonText}>🛒 Send to Instacart</Text>
        </TouchableOpacity>

        <View style={styles.secondaryActions}>
          <TouchableOpacity
            style={styles.shareButton}
            onPress={shareList}
          >
            <Text style={styles.buttonText}>📤 Share</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.emailButton}
            onPress={() => emailList()}
          >
            <Text style={styles.buttonText}>📧 Email</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

function getCategoryIcon(category) {
  const icons = {
    'Proteins': '🍗',
    'Produce': '🥬',
    'Grains & Carbs': '🌾',
    'Dairy': '🥛',
    'Pantry & Condiments': '🧂',
    'Frozen': '🧊',
    'Snacks': '🍿'
  };
  return icons[category] || '📦';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  header: {
    backgroundColor: '#4CAF50',
    padding: 20,
    paddingTop: 40,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 16
  },
  progressContainer: {
    marginTop: 12
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    backgroundColor: 'white'
  },
  progressText: {
    color: 'white',
    fontSize: 12,
    marginTop: 6,
    textAlign: 'center'
  },
  costContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.3)'
  },
  costLabel: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14
  },
  costValue: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold'
  },
  categorySection: {
    marginTop: 12,
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    marginHorizontal: 12
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0'
  },
  categoryIcon: {
    fontSize: 24,
    marginRight: 12
  },
  categoryTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333'
  },
  categoryCount: {
    fontSize: 12,
    color: '#666',
    marginRight: 8
  },
  expandIcon: {
    fontSize: 12,
    color: '#999'
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    paddingLeft: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  checkbox: {
    padding: 0,
    margin: 0,
    marginRight: 8
  },
  itemDetails: {
    flex: 1
  },
  itemName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4
  },
  itemNameChecked: {
    textDecorationLine: 'line-through',
    color: '#999'
  },
  itemBrand: {
    fontSize: 12,
    color: '#2196F3',
    marginBottom: 2
  },
  itemUsage: {
    fontSize: 11,
    color: '#666',
    marginBottom: 2
  },
  itemPrice: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: 'bold',
    marginTop: 4
  },
  tipsSection: {
    margin: 12,
    padding: 16,
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800'
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E65100',
    marginBottom: 8
  },
  tipText: {
    fontSize: 13,
    color: '#5D4037',
    marginBottom: 4
  },
  actions: {
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0'
  },
  instacartButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12
  },
  secondaryActions: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  shareButton: {
    flex: 1,
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginRight: 8
  },
  emailButton: {
    flex: 1,
    backgroundColor: '#FF9800',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center'
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 15
  }
});

export default ShoppingListScreen;
```

---

## 📊 Weekly Meal Prep Workflow

### **Sunday Meal Prep Screen**

```javascript
function WeeklyMealPrepScreen({ programId }) {
  const [mealPlan, setMealPlan] = useState(null);
  const [prepTasks, setPrepTasks] = useState([]);

  useEffect(() => {
    loadMealPrepPlan();
  }, [programId]);

  async function loadMealPrepPlan() {
    // Get weekly meal plan
    const planResponse = await fetch(
      `https://services.wihy.ai/api/meal-programs/${programId}/calendar?start_date=2026-01-03&end_date=2026-01-09`
    );
    const plan = await planResponse.json();
    
    // Get meal prep suggestions
    const prepResponse = await fetch(
      `https://services.wihy.ai/api/meal-programs/${programId}/meal-prep-plan`,
      {
        headers: { 'Authorization': `Bearer ${authToken}` }
      }
    );
    const prepData = await prepResponse.json();

    setMealPlan(plan);
    setPrepTasks(prepData.prep_tasks);
  }

  // Example response from meal-prep-plan endpoint:
  // {
  //   "success": true,
  //   "prep_day": "Sunday",
  //   "total_prep_time": "2-3 hours",
  //   "prep_tasks": [
  //     {
  //       "task_id": "task_001",
  //       "task": "Cook brown rice",
  //       "quantity": "6 cups cooked",
  //       "duration": "45 min",
  //       "priority": "high",
  //       "used_for": ["Monday lunch", "Tuesday dinner", "Wednesday lunch", "Thursday dinner", "Friday lunch"],
  //       "storage": "Refrigerate in airtight containers for up to 5 days",
  //       "instructions": [
  //         "Rinse 2 cups dry brown rice",
  //         "Add 4 cups water and bring to boil",
  //         "Reduce heat, cover, simmer 40-45 minutes",
  //         "Let cool, divide into 5 portions"
  //       ],
  //       "completed": false
  //     },
  //     {
  //       "task_id": "task_002",
  //       "task": "Grill chicken breasts",
  //       "quantity": "2 lbs (8 servings)",
  //       "duration": "30 min",
  //       "priority": "high",
  //       "used_for": ["Monday lunch", "Wednesday lunch", "Friday lunch"],
  //       "storage": "Refrigerate up to 4 days or freeze",
  //       "instructions": [
  //         "Season with salt, pepper, garlic powder",
  //         "Grill 6-7 minutes per side until 165°F",
  //         "Let rest 5 minutes, slice or store whole"
  //       ],
  //       "completed": false
  //     },
  //     {
  //       "task_id": "task_003",
  //       "task": "Wash and chop vegetables",
  //       "quantity": "All week's veggies",
  //       "duration": "30 min",
  //       "priority": "medium",
  //       "used_for": ["All week"],
  //       "storage": "Store in produce bags in crisper drawer",
  //       "instructions": [
  //         "Wash broccoli, bell peppers, carrots",
  //         "Chop into bite-sized pieces",
  //         "Store each type separately",
  //         "Add paper towel to absorb moisture"
  //       ],
  //       "completed": false
  //     },
  //     {
  //       "task_id": "task_004",
  //       "task": "Portion breakfast items",
  //       "quantity": "7 servings",
  //       "duration": "15 min",
  //       "priority": "low",
  //       "used_for": ["Monday-Sunday breakfast"],
  //       "storage": "Refrigerate individual containers",
  //       "instructions": [
  //         "Divide Greek yogurt into 7 containers",
  //         "Add 1/4 cup berries to each",
  //         "Top with granola before eating"
  //       ],
  //       "completed": false
  //     }
  //   ],
  //   "shopping_list_ready": true,
  //   "containers_needed": [
  //     "5 large containers for rice",
  //     "3 containers for chicken",
  //     "7 small containers for breakfast",
  //     "Multiple produce bags"
  //   ],
  //   "tips": [
  //     "Start with longest cooking items (rice, chicken)",
  //     "Prep vegetables while proteins cook",
  //     "Label all containers with dates",
  //     "Cool cooked items before refrigerating"
  //   ]
  // }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🍳 Sunday Meal Prep</Text>
        <Text style={styles.subtitle}>Prep Time: 2-3 hours</Text>
      </View>

      <FlatList
        data={prepTasks}
        keyExtractor={task => task.task_id}
        renderItem={({ item: task }) => (
          <View style={styles.taskCard}>
            <View style={styles.taskHeader}>
              <CheckBox
                checked={task.completed}
                onPress={() => toggleTaskComplete(task.task_id)}
              />
              <View style={styles.taskInfo}>
                <Text style={styles.taskTitle}>{task.task}</Text>
                <Text style={styles.taskMeta}>
                  {task.quantity} • {task.duration}
                </Text>
              </View>
              <View style={[
                styles.priorityBadge,
                { backgroundColor: getPriorityColor(task.priority) }
              ]}>
                <Text style={styles.priorityText}>{task.priority}</Text>
              </View>
            </View>

            <View style={styles.taskDetails}>
              <Text style={styles.usedFor}>
                Used for: {task.used_for.slice(0, 3).join(', ')}
                {task.used_for.length > 3 && ` +${task.used_for.length - 3} more`}
              </Text>

              <Text style={styles.instructionsTitle}>Instructions:</Text>
              {task.instructions.map((instruction, idx) => (
                <Text key={idx} style={styles.instruction}>
                  {idx + 1}. {instruction}
                </Text>
              ))}

              <Text style={styles.storage}>
                💾 Storage: {task.storage}
              </Text>
            </View>
          </View>
        )}
      />

      <View style={styles.footer}>
        <Text style={styles.tipsTitle}>💡 Pro Tips</Text>
        {prepData.tips.map((tip, idx) => (
          <Text key={idx} style={styles.tip}>• {tip}</Text>
        ))}
      </View>
    </View>
  );
}
```

---

## 🍽️ Recipe Detail Screen Implementation

### **Complete Recipe View with Cooking Mode**

```javascript
function RecipeDetailScreen({ route }) {
  const { recipeId } = route.params;
  const [recipe, setRecipe] = useState(null);
  const [servings, setServings] = useState(1);
  const [cookingMode, setCookingMode] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    loadRecipe();
  }, [recipeId]);

  async function loadRecipe() {
    const response = await fetch(
      `https://services.wihy.ai/api/recipes/${recipeId}`,
      {
        headers: { 'Authorization': `Bearer ${authToken}` }
      }
    );
    const data = await response.json();
    
    // Response:
    // {
    //   "success": true,
    //   "recipe": {
    //     "recipe_id": "recipe_001",
    //     "name": "Grilled Chicken Rice Bowl",
    //     "description": "High-protein meal prep friendly bowl",
    //     "servings": 1,
    //     "prep_time": 10,
    //     "cook_time": 15,
    //     "total_time": 25,
    //     "difficulty": "easy",
    //     "cuisine": "Asian-inspired",
    //     "meal_type": "lunch",
    //     "tags": ["High Protein", "Meal Prep", "Gluten-Free"],
    //     "nutrition": {
    //       "per_serving": {
    //         "calories": 520,
    //         "protein": 45,
    //         "carbs": 52,
    //         "fat": 12,
    //         "fiber": 6,
    //         "sodium": 680
    //       }
    //     },
    //     "ingredients": [
    //       {
    //         "name": "Chicken breast",
    //         "amount": 6,
    //         "unit": "oz",
    //         "notes": "boneless, skinless",
    //         "category": "Protein"
    //       },
    //       {
    //         "name": "Brown rice",
    //         "amount": 1,
    //         "unit": "cup",
    //         "notes": "cooked",
    //         "category": "Grains"
    //       },
    //       {
    //         "name": "Broccoli",
    //         "amount": 1,
    //         "unit": "cup",
    //         "notes": "chopped",
    //         "category": "Vegetables"
    //       },
    //       {
    //         "name": "Soy sauce",
    //         "amount": 2,
    //         "unit": "tbsp",
    //         "notes": "low sodium",
    //         "category": "Condiments"
    //       }
    //     ],
    //     "instructions": [
    //       {
    //         "step": 1,
    //         "title": "Prepare chicken",
    //         "text": "Season chicken breast with salt, pepper, and garlic powder. Let sit for 5 minutes.",
    //         "duration": "5 min",
    //         "timer": true
    //       },
    //       {
    //         "step": 2,
    //         "title": "Cook chicken",
    //         "text": "Heat grill pan over medium-high heat. Cook chicken 6-7 minutes per side until internal temperature reaches 165°F.",
    //         "duration": "14 min",
    //         "timer": true,
    //         "temperature": "165°F"
    //       },
    //       {
    //         "step": 3,
    //         "title": "Steam broccoli",
    //         "text": "While chicken cooks, steam broccoli for 5 minutes until tender-crisp.",
    //         "duration": "5 min",
    //         "timer": true
    //       },
    //       {
    //         "step": 4,
    //         "title": "Assemble bowl",
    //         "text": "In a bowl, add cooked brown rice, sliced chicken, steamed broccoli. Drizzle with soy sauce.",
    //         "duration": "2 min"
    //       }
    //     ],
    //     "tips": [
    //       "Use pre-cooked rice from meal prep to save time",
    //       "Chicken can be grilled ahead and refrigerated up to 4 days",
    //       "Add sesame seeds for extra flavor and crunch"
    //     ],
    //     "variations": [
    //       {
    //         "name": "Spicy version",
    //         "changes": "Add sriracha sauce and red pepper flakes"
    //       },
    //       {
    //         "name": "Vegetarian",
    //         "changes": "Replace chicken with tofu or tempeh"
    //       }
    //     ],
    //     "storage": "Refrigerate in airtight container up to 4 days",
    //     "reheating": "Microwave 2-3 minutes or until heated through",
    //     "cost_per_serving": 4.50,
    //     "image_url": "https://cdn.wihy.ai/recipes/chicken_rice_bowl.jpg",
    //     "video_url": "https://cdn.wihy.ai/recipes/chicken_rice_bowl_tutorial.mp4"
    //   }
    // }
    
    setRecipe(data.recipe);
    setServings(data.recipe.servings);
  }

  function adjustServings(newServings) {
    setServings(newServings);
    // Ingredients will be recalculated based on ratio
  }

  function getAdjustedAmount(originalAmount) {
    return (originalAmount / recipe.servings) * servings;
  }

  async function addToGroceryList() {
    const response = await fetch(
      'https://services.wihy.ai/api/shopping-lists',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: `Shopping List - ${recipe.name}`,
          items: recipe.ingredients.map(ing => ({
            name: ing.name,
            quantity: getAdjustedAmount(ing.amount),
            unit: ing.unit,
            category: ing.category
          }))
        })
      }
    );

    Alert.alert('Added', 'Ingredients added to shopping list!');
  }

  return (
    <ScrollView style={styles.container}>
      {/* RECIPE HEADER */}
      <Image source={{ uri: recipe.image_url }} style={styles.heroImage} />
      
      <View style={styles.header}>
        <Text style={styles.recipeName}>{recipe.name}</Text>
        <Text style={styles.description}>{recipe.description}</Text>
        
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Text style={styles.metaIcon}>⏱️</Text>
            <Text style={styles.metaText}>{recipe.total_time} min</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaIcon}>🍽️</Text>
            <Text style={styles.metaText}>{recipe.difficulty}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaIcon}>💰</Text>
            <Text style={styles.metaText}>${recipe.cost_per_serving}/serving</Text>
          </View>
        </View>

        {/* NUTRITION FACTS */}
        <View style={styles.nutritionCard}>
          <Text style={styles.nutritionTitle}>Nutrition Per Serving</Text>
          <View style={styles.nutritionGrid}>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionValue}>{recipe.nutrition.per_serving.calories}</Text>
              <Text style={styles.nutritionLabel}>Calories</Text>
            </View>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionValue}>{recipe.nutrition.per_serving.protein}g</Text>
              <Text style={styles.nutritionLabel}>Protein</Text>
            </View>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionValue}>{recipe.nutrition.per_serving.carbs}g</Text>
              <Text style={styles.nutritionLabel}>Carbs</Text>
            </View>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionValue}>{recipe.nutrition.per_serving.fat}g</Text>
              <Text style={styles.nutritionLabel}>Fat</Text>
            </View>
          </View>
        </View>
      </View>

      {/* SERVINGS ADJUSTER */}
      <View style={styles.servingsAdjuster}>
        <Text style={styles.servingsLabel}>Servings:</Text>
        <TouchableOpacity
          onPress={() => adjustServings(Math.max(1, servings - 1))}
          style={styles.servingsButton}
        >
          <Text style={styles.servingsButtonText}>-</Text>
        </TouchableOpacity>
        <Text style={styles.servingsValue}>{servings}</Text>
        <TouchableOpacity
          onPress={() => adjustServings(servings + 1)}
          style={styles.servingsButton}
        >
          <Text style={styles.servingsButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* INGREDIENTS */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Ingredients</Text>
          <TouchableOpacity onPress={addToGroceryList}>
            <Text style={styles.addToListButton}>+ Add to List</Text>
          </TouchableOpacity>
        </View>
        
        {recipe.ingredients.map((ingredient, idx) => (
          <View key={idx} style={styles.ingredientRow}>
            <Text style={styles.ingredientAmount}>
              {getAdjustedAmount(ingredient.amount)} {ingredient.unit}
            </Text>
            <Text style={styles.ingredientName}>{ingredient.name}</Text>
            {ingredient.notes && (
              <Text style={styles.ingredientNotes}>({ingredient.notes})</Text>
            )}
          </View>
        ))}
      </View>

      {/* INSTRUCTIONS */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Instructions</Text>
        
        {!cookingMode ? (
          // NORMAL VIEW
          recipe.instructions.map((instruction, idx) => (
            <View key={idx} style={styles.instructionCard}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>{instruction.step}</Text>
              </View>
              <View style={styles.instructionContent}>
                <Text style={styles.instructionTitle}>{instruction.title}</Text>
                <Text style={styles.instructionText}>{instruction.text}</Text>
                {instruction.duration && (
                  <Text style={styles.instructionDuration}>
                    ⏱️ {instruction.duration}
                  </Text>
                )}
              </View>
            </View>
          ))
        ) : (
          // COOKING MODE (one step at a time, large text)
          <View style={styles.cookingModeCard}>
            <Text style={styles.cookingStepTitle}>
              Step {currentStep + 1} of {recipe.instructions.length}
            </Text>
            <Text style={styles.cookingInstruction}>
              {recipe.instructions[currentStep].text}
            </Text>
            
            {recipe.instructions[currentStep].timer && (
              <TouchableOpacity style={styles.timerButton}>
                <Text style={styles.timerButtonText}>
                  Start {recipe.instructions[currentStep].duration} Timer
                </Text>
              </TouchableOpacity>
            )}

            <View style={styles.cookingNav}>
              <TouchableOpacity
                disabled={currentStep === 0}
                onPress={() => setCurrentStep(currentStep - 1)}
                style={styles.navButton}
              >
                <Text style={styles.navButtonText}>← Previous</Text>
              </TouchableOpacity>

              {currentStep < recipe.instructions.length - 1 ? (
                <TouchableOpacity
                  onPress={() => setCurrentStep(currentStep + 1)}
                  style={styles.navButton}
                >
                  <Text style={styles.navButtonText}>Next →</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  onPress={() => {
                    Alert.alert('Complete!', 'Recipe finished!');
                    setCookingMode(false);
                  }}
                  style={[styles.navButton, styles.completeButton]}
                >
                  <Text style={styles.navButtonText}>Complete ✓</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        <TouchableOpacity
          style={styles.cookingModeToggle}
          onPress={() => setCookingMode(!cookingMode)}
        >
          <Text style={styles.cookingModeToggleText}>
            {cookingMode ? '📋 Normal View' : '👨‍🍳 Cooking Mode'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* TIPS & VARIATIONS */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💡 Tips</Text>
        {recipe.tips.map((tip, idx) => (
          <Text key={idx} style={styles.tip}>• {tip}</Text>
        ))}
      </View>

      {recipe.variations && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔄 Variations</Text>
          {recipe.variations.map((variation, idx) => (
            <View key={idx} style={styles.variation}>
              <Text style={styles.variationName}>{variation.name}</Text>
              <Text style={styles.variationChanges}>{variation.changes}</Text>
            </View>
          ))}
        </View>
      )}

      {/* STORAGE INFO */}
      <View style={styles.storageCard}>
        <Text style={styles.storageTitle}>💾 Storage & Reheating</Text>
        <Text style={styles.storageText}>Storage: {recipe.storage}</Text>
        <Text style={styles.storageText}>Reheating: {recipe.reheating}</Text>
      </View>
    </ScrollView>
  );
}
```

---

## 📞 Support & Resources

**All endpoints are live at:** `https://services.wihy.ai/api`

**Documentation:**
- Full API Reference: [API_ENDPOINTS_COMPLETE_GUIDE.md](./API_ENDPOINTS_COMPLETE_GUIDE.md)
- Nutrition API: [BUSINESS_LOGIC_API_DOCS.md](./BUSINESS_LOGIC_API_DOCS.md)
- Shopping Lists: [INSTACART_INTEGRATION_GUIDE.md](./INSTACART_INTEGRATION_GUIDE.md)

**Test in your mobile app today!**
