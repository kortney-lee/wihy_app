# My Progress Screen Specification

## Screen Purpose
Daily action hub showing what user needs to do TODAY, plus weekly/monthly goal tracking and progress metrics. Drives daily habit completion with dopamine/motivation model.

## Screen Periods (3 Time Horizons)
```
[Today] [Week] [Month]
```

---

## Period 1: TODAY
**Purpose**: Daily checklist - what needs to happen right now for health goals

### Section 1: DAILY GOALS (Top Priority)
**Visual**: Large progress cards with visual indicators

#### **Calorie Goal**
- Target: X calories
- Current: Y consumed / X goal
- Progress bar: Large, prominent
- Status: "On track" / "Over" / "Under"
- Remaining: Z calories left to hit target
- Time remaining: Hours left in day
- Meals logged: [Breakfast ✓] [Lunch ✓] [Dinner ☐] [Snacks: X]
- Action: "Log meal" button

#### **Protein Goal**
- Target: X grams
- Current: Y / X
- Progress bar
- Status: "On track" / "Needs X more grams"
- Servings completed: [sources logged]
- Action: "Add protein source" button

#### **Water Goal**
- Target: 8 cups / 2L
- Current: X cups logged
- Progress bar: Show cups visually
- Status: "Keep going!" / "Complete!"
- Next reminder: In X minutes
- Action: "Log water" button

#### **Workout Goal**
- Target: X min / type
- Current: Y min completed / type
- Status: "Not started" / "In progress" / "Complete"
- Workout: [type] [duration]
- Action: "Start workout" or "Log workout" button

### Section 2: ACTION ITEMS (What to do now)
**Visual**: Checklist cards - each is actionable

#### **Morning Routine**
- [ ] Drink water (8oz)
- [ ] Log breakfast
- [ ] Take supplements (if applicable)
- Status: X/3 complete

#### **Midday Actions**
- [ ] Log lunch
- [ ] Drink 2 cups water
- [ ] 10min walk or stretch
- Status: X/3 complete

#### **Evening Actions**
- [ ] Log dinner
- [ ] Complete workout (if scheduled)
- [ ] Prepare meals for tomorrow
- [ ] Log sleep hours
- Status: X/4 complete

### Section 3: DOPAMINE/MOTIVATION CARDS ⭐ NEW
**Purpose**: Drive behavior through desire → consume → satisfaction loop

#### **What Do You Want?** (DESIRE)
- **Hunger Level**: Slider 1-10 with emoji (😋😋😋...)
- **Cravings**: "Feeling like: pizza, sweets, healthy?"
- **Mood**: "Current mood: Happy 😊 / Stressed 😟 / Bored 😑 / Tired 😴"
- **Motivation**: "Why eat now? Hunger / Habit / Emotion / Social"
- **Action**: "Help me choose what to eat" button

#### **Smart Consume Options** (CONSUME CHOICES)
- Show meal options based on current cravings/mood
- Suggest balanced alternatives to cravings
- Show prep time & available ingredients
- Indicate: "Aligns with goals: ✓✓✓" (3 green checks = good choice)

#### **How Did That Feel?** (SATISFACTION - post-meal)
- **Satisfaction Score**: 1-10 scale
- **Mood After**: "Feel better? Energized? Guilt-free?"
- **Craving Status**: "Satisfied? More needed? Overdid it?"
- **Learn**: "That choice was [good/neutral/not ideal] for you"
- **Pattern Recognition**: "You often crave this at [time]. Try [alternative] next time"

### Section 4: COACH RECOMMENDATIONS
- **Daily Tip**: Based on history and current progress
  - "You crushed your workout routine - keep it up!"
  - "Try drinking water before meals - it helped 80% of users"
  - "Your best time to work out is 6AM - block that time"
- **Quick Actions**: "Complete these 3 things by 5PM"

### Section 5: ENCOURAGEMENT & STREAKS
- **Current Streak**: "5 days in a row! 🔥"
- **Next Milestone**: "3 more days for weekly badge"
- **Dopamine Boost**: "You logged X meals today - great job!"
- **Reminder**: When next action due

---

## Period 2: WEEK
**Purpose**: Weekly progress toward goals and habit consistency

### Section 1: WEEKLY GOALS PROGRESS
**Visual**: Weekly summary cards

#### **Calories**
- Weekly average: X cal/day
- Weekly total: X calories
- Goal: Y calories/day × 7 days
- % Complete: X%
- Trend: "↑ Higher than last week" / "↓ Lower" / "→ Same"

#### **Macros**
- Protein: Avg X g/day (goal: Y)
- Carbs: Avg X g/day (goal: Y)
- Fats: Avg X g/day (goal: Y)
- Weekly macro pie: Visual breakdown
- Status: Balanced / High carbs / High fat / etc

#### **Workouts**
- Workouts completed: X / target
- Types: Strength (X) | Cardio (X) | Flexibility (X)
- Total duration: X hours
- Days active: X / 7 days
- Consistency: "X% weeks completed"

#### **Water**
- Daily average: X cups
- Days hit goal: X / 7
- Total weekly: X cups

### Section 2: MEAL CONSISTENCY
**Visual**: Day-by-day log

```
Mon   Tue   Wed   Thu   Fri   Sat   Sun
✓✓✓  ✓✓✓  ✓✓   ✓✓✓  ✓✓✓  ✓    ✓✓
```
- Each meal logged shown as check
- Missing meals: ☐
- Over eaten: ✓✓✓ (extra indicator)
- Consistency score: "Logged X% of meals"

### Section 3: DOPAMINE PATTERNS (Weekly) ⭐
**Purpose**: Understand and optimize desire → consume → satisfaction cycle

#### **Desire Patterns**
- **Common Cravings**: Top 5 cravings this week
  - "Pizza (3x)" "Sweets (5x)" "Salty (4x)" "Healthy (6x)" "Spicy (1x)"
- **Craving Triggers**: When do they happen?
  - Time-based: "3PM cravings most common"
  - Mood-based: "5x after stressed"
  - Social: "2x with friends"
- **Resistance Success**: "You resisted X cravings, gave in X times"
- **Success Rate**: X%

#### **Consume Behavior**
- **Eating Times**: Heatmap showing when meals logged
- **Portion Control**: Average portion sizes logged
- **Food Balance**: "X% healthy, Y% treats, Z% neutral"
- **Meal Quality**: Based on macro balance and ingredients

#### **Satisfaction Outcomes**
- **Post-meal Mood**: Distribution of happy/neutral/guilty
- **Craving Satisfaction**: "X% of cravings satisfied by meal"
- **Energy After Eating**: Energized / Stable / Crashed
- **Behavioral Wins**: "Chose salad instead of pizza 2x"

#### **Learning Insights**
- **What Works**: "Drinking water before eating = 90% success rate"
- **What Doesn't**: "Late night snacking leads to next-day low energy"
- **Patterns**: "You eat more when stressed - try walks instead"

### Section 4: WORKOUT BREAKDOWN
**Visual**: Calendar + summary

```
Mo Tu We Th Fr Sa Su
  30 45 30 60    40   (duration minutes)
  S  C  S  C  X   S   (S=Strength, C=Cardio)
```
- Days worked out: X/7
- Best workout: [Type] [Duration] [How felt]
- Missed days: X
- Recovery days: Proper rest Y/N

### Section 5: WEEKLY RECOMMENDATIONS
- **Momentum**: "You're on a roll - keep consistency"
- **Need Work**: "Water intake down 15% - increase by Y cups"
- **Highlight**: "Best week for protein balance!"
- **Action**: "Try new recipe with [nutrient you're low on]"

---

## Period 3: MONTH
**Purpose**: Long-term progress toward goals and habit formation

### Section 1: MONTHLY GOAL PROGRESS
**Visual**: Large progress rings

#### **Calorie Goal**
- Monthly average: X cal/day
- Goal: Y cal/day
- % Achievement: X%
- Trend vs last month: ↑↓→

#### **Weight/Body Metrics** (if tracked)
- Starting: X lbs
- Current: Y lbs
- Change: ±Z lbs
- Trend: ↑↓→
- Rate: "X lbs/week (healthy rate)"

#### **Workout Consistency**
- Days active: X / 30
- Workouts completed: Y / target
- Total duration: Z hours
- Consistency percentage: X%

#### **Habit Strength**
- Longest streak: X days
- Current streak: Y days
- Missed days: X
- Overall adherence: Y%

### Section 2: MONTHLY PATTERNS & TRENDS
**Visual**: Charts and graphs

#### **Calorie Trends**
- Line chart: daily averages with trend line
- Peaks: "Weekends average Y more calories"
- Valleys: "Mondays lowest - busiest day"
- Volatility: "±X range"

#### **Macro Evolution**
- Protein trend: "Improved by +X g/week"
- Carbs trend: "Stable at Y g"
- Fats trend: "Reduced by -X g/week"
- Balance: "Better macro distribution this month"

#### **Workout Frequency**
- Bar chart: workouts per week
- Trend: "Increasing consistency"
- Type distribution: Pie chart (Strength/Cardio/Flex)

#### **Weight Trend** (if logged)
- Line chart with 7-day moving average
- Trend line showing direction
- Rate of change: "X lbs/week"

### Section 3: DOPAMINE/BEHAVIOR EVOLUTION (Monthly) ⭐
**Purpose**: See how consuming & desire patterns have improved

#### **Desire Management Growth**
- **Then vs Now**:
  - "30 days ago: 10 cravings/week → Now: 6 cravings/week"
  - "Learning what triggers you (down 40%)"
  - "Recognizing emotions better"
- **Awareness Score**: "90% - you know your triggers well"

#### **Consume Control Improvement**
- **Positive Changes**:
  - "Portion sizes more consistent (+15%)"
  - "Eating more mindfully (+30%)"
  - "Better food choices (+25%)"
- **Challenge Areas**:
  - "Late night snacking still happens (3x/week)"
  - "Weekend meals less balanced"

#### **Satisfaction & Rewards**
- **Happiness After Eating**: "75% satisfied vs 60% month ago"
- **Guilt Level**: "Reduced by 20%"
- **Craving Success**: "You satisfied Y% of cravings healthily"
- **Dopamine Wins**: "Built healthy reward associations with [activities]"

#### **Behavioral Cycles**
- **Positive Cycles**: "↑ Eating well → Better energy → More workouts"
- **Negative Cycles**: "Stress → Snacking → Less energy (improved!)"
- **Neutral Cycles**: "Random eating patterns"

### Section 4: ACHIEVEMENTS & MILESTONES
**Visual**: Badge system

- ✨ **7-Day Streak**: "Logged all meals for 7 days"
- 💪 **Workout Warrior**: "Completed 12 workouts this month"
- 💧 **Hydration Hero**: "Hit water goal 20+ days"
- 🎯 **Calorie Master**: "Within 10% of goal X days"
- 🧠 **Craving Manager**: "Resisted cravings 8x"
- 🍎 **Balanced Eater**: "Optimal macro ratio Y days"
- 🔥 **Hot Streak**: "Current X-day active streak"

### Section 5: MONTHLY SUMMARY & NEXT MONTH GOALS
**Visual**: Summary report

#### **What Went Well**
- Top 3 accomplishments
- Best week/day
- Most consistent habit

#### **Challenges Faced**
- Biggest struggle
- When motivation dropped
- Unexpected obstacles

#### **Data Insights**
- Average daily calories: X
- Average workout: Y min
- Calories burned estimate: Z
- Weight change: ±W lbs
- Consistency score: X%

#### **Next Month Goals**
- Continue: "Keep the [X habit] streak going"
- Improve: "Work on [Y area that needs attention]"
- Try: "New goal for [Z category]"
- Focus: "This month's dopamine goal: [specific behavior change]"

---

## Smart Features & Automation

### Contextual Cards
- Show different cards based on time of day
  - Morning: Breakfast & water reminder
  - Noon: Lunch & workout motivation
  - Evening: Dinner, water, reflection

### AI Coaching
- Analyzes patterns and suggests optimizations
- Learns user preferences and timing
- Predicts likely cravings and offers alternatives

### Notification Triggers
- Meal reminders based on history
- Water intake reminders (spaced throughout day)
- Workout motivation push at optimal time
- "How did that meal feel?" prompt (5 min after logging)

### Dopamine/Desire Gamification
- **Desire Tracking**: Log what you want, measure satisfaction
- **Win Ratio**: Track craving success rates
- **Reward Associations**: Build positive loops (exercise → energy)
- **Behavioral Insights**: Show how choices affect energy, mood, performance

---

## Data Flow Architecture

### Data Sources:
1. **Nutrition Service**: Today/Week/Month meals, calories, macros
2. **Fitness Service**: Today/Week/Month workouts, duration, type
3. **Health Logging Service** (NEW): Sleep, mood, weight, cravings
4. **Dopamine/Behavior Service** (NEW): Desire tracking, consume feedback, satisfaction scores

### Backend Calculations:
1. **Daily Goals Progress**: Current vs targets
2. **Weekly Aggregations**: Averages, consistency, patterns
3. **Monthly Trends**: Historical comparison, rate of change
4. **Pattern Recognition**: Dopamine loop analysis (desire → consume → satisfaction)
5. **Predictive Suggestions**: What will work for this user
6. **Achievement Tracking**: Streak counting, badge earning

---

## Visual Design Elements

### Colors:
- **Primary**: Blue (#3b82f6) - Goals & tracking
- **Success**: Green (#10b981) - Completed, on-track
- **Attention**: Yellow (#f59e0b) - Needs action
- **Urgent**: Red (#ef4444) - Off track
- **Dopamine/Behavior**: Purple (#8b5cf6) - Motivation & rewards

### Icons:
- Calories: 🔥
- Protein: 💪
- Carbs: 🌾
- Fats: 🥑
- Water: 💧
- Workouts: 🏃
- Mood: 😊😟😑
- Dopamine: 🧠

---

## Loading & Error States

- Skeleton loaders while fetching
- Empty state: "Start logging to see your progress"
- Error fallback: "Try again" with retry button
- No data: Show mock data with "This is example data"

---

## Notes

- **Action-Focused**: Every section should drive a behavior
- **Dopamine Loop**: Core mechanic - understand desire, log consumption, track satisfaction
- **Time-Based**: Different cards for morning/noon/evening
- **Personalization**: Adapt recommendations based on individual patterns
- **Celebration**: Highlight wins and progress to maintain motivation
- **No Tracker Dependency**: All data from app's native logging
