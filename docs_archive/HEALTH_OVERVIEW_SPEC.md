# Health Overview Screen Specification

## Screen Purpose
Comprehensive wellness dashboard showing complete health picture from **all data sources** (nutrition, fitness workouts, manual health logging). No fitness tracker dependency.

## Screen Tabs (5 Tabs)
```
[Summary] [Insights] [Wellness] [Trends] [Predictive]
```

---

## Tab 1: SUMMARY
**Purpose**: Quick health snapshot with key wellness metrics

### Cards Layout:

#### **Wellness Score Card** (Top Priority)
- **Overall Wellness Score**: 0-100 (calculated metric)
- **Components**:
  - Nutrition Quality (40%): macro balance, meal variety, hydration
  - Activity Consistency (35%): workout frequency, duration
  - Habit Adherence (25%): consistency in logging, goal tracking
- **Visual**: Large circular progress with percentage
- **Trend**: Arrow (↑ improving, ↓ declining, → stable)
- **Color**: Green (good), Yellow (warning), Red (alert)

#### **Nutrition Summary**
- **Calories**: X consumed / Y goal (progress bar)
- **Macros**: Protein% | Carbs% | Fats% (mini pie chart)
- **Status**: "On track" / "Over" / "Under"

#### **Activity Summary**
- **Workouts This Week**: X / target
- **Total Duration**: X hours
- **Consistency**: X% (days with workouts)

#### **Hydration Summary**
- **Water Intake**: X cups / 8 cups
- **Percentage**: X%

#### **Dopamine/Desire Loop Metric** ⭐ NEW
- **Consume Score**: Measures eating patterns
  - Regular meal frequency: Yes/No
  - Portion control: Good/Fair/Poor
  - Hunger management: X score
- **Desire Management**: Shows if cravings are managed
  - Logged cravings vs resisted: X%
  - Mood before eating: Happy/Bored/Stressed/etc
  - Reward alternatives used: X times
- **Behavioral Pattern**: Shows desire → consume → satisfaction loop
  - Positive cycle indicator (good habits)
  - Negative cycle indicator (impulse eating)
  - Neutral cycles (untracked)

---

## Tab 2: INSIGHTS
**Purpose**: Deep dive analysis of what's working/what's not

### Sections:

#### **Nutrition Insights**
- **Macro Balance**: "You're 15g short on protein daily"
- **Meal Timing**: "Most meals logged at 8PM, consider earlier dinners"
- **Eating Patterns**: "3 meals/day average, consistent"
- **Common Foods**: Top 5 most logged foods
- **Meal Types**: Breakfast/Lunch/Dinner breakdown

#### **Workout Insights**
- **Workout Types**: Strength (40%), Cardio (30%), Flexibility (30%)
- **Best Time to Exercise**: "Most consistent at 6AM workouts"
- **Average Duration**: "48 min per session"
- **Recovery**: "Rest days: X per week (target: 1-2)"

#### **Behavioral Insights** ⭐ DOPAMINE DRIVEN
- **Desire Triggers**: What drives eating
  - Time-based: "Hungry at 3PM"
  - Emotion-based: "Eat when stressed (3x/week)"
  - Social: "Eat with friends"
- **Consume Patterns**: How eating happens
  - Portion sizes: "Consistent: 300-400g"
  - Pace: "Fast eater (3-5 min meals)"
  - Mindfulness: "X% mindful eating"
- **Dopamine/Reward**: How satisfied after
  - Satisfaction score: 1-10
  - Post-meal mood: Happy/Neutral/Guilty
  - Cravings satisfied: Y/N

#### **Recommendations**
- Based on insights, show actionable tips
- "Try drinking water before meals to manage hunger"
- "Your 6AM workouts have 85% completion rate - keep that time!"

---

## Tab 3: WELLNESS
**Purpose**: Holistic health overview across all dimensions

### Cards:

#### **Nutrition Wellness**
- Calories vs goal (progress bar)
- Macro ratios (protein/carbs/fat pie)
- Micronutrients: Fiber, Water, Vitamins
- Color coded: Green (optimal), Yellow (caution), Red (needs work)

#### **Activity Wellness**
- Weekly workouts (target progress)
- Workout variety (types done)
- Duration consistency
- Rest days

#### **Behavioral Wellness** ⭐ DOPAMINE FOCUS
- **Desire Awareness**: "Tracking desires well" ✓
- **Consume Control**: "Good portion control" ✓
- **Satisfaction**: "Mostly satisfied after eating" ✓
- **Habit Strength**: Score 1-10

#### **Sleep & Recovery** (manual log)
- Average sleep hours
- Sleep quality (manual rating)
- Recovery status

#### **Hydration**
- Daily intake vs goal
- Hydration level indicator

#### **Stress & Mood** (if logged)
- Mood distribution (Happy/Stressed/Tired/Neutral)
- Correlation with eating
- Stress management activities

---

## Tab 4: TRENDS
**Purpose**: Historical data visualization

### Time Periods:
- **Weekly** (default)
- **Monthly**
- **3 Months**
- **All Time**

### Charts:

#### **Calories Over Time**
- Line chart: daily calories consumed vs goal
- Highlight: goal achievement rate

#### **Macro Trends**
- Stacked area chart: Protein/Carbs/Fat over time
- Show: balance trends

#### **Workout Frequency**
- Bar chart: workouts per week
- Color coded by type (Strength/Cardio/Flex)

#### **Weight Trend** (if manually logged)
- Line chart with trend line
- Show: weekly average

#### **Dopamine Patterns** ⭐
- **Desire Frequency**: How often cravings logged
- **Consume Control**: Success rate resisting cravings
- **Satisfaction Trend**: Post-meal satisfaction scores over time
- **Behavioral Cycles**: Positive/Negative/Neutral patterns

#### **Wellness Score Trend**
- Line chart: overall wellness score over time
- Show: contributing factors

---

## Tab 5: PREDICTIVE
**Purpose**: AI-driven forecasting and recommendations

### Predictions:

#### **Next Week Forecast**
- Based on current pace: "On track for X calories"
- Projection: "Will reach goal Y% completion"
- Confidence: X%

#### **Behavior Prediction** ⭐ DOPAMINE AI
- **Desire Pattern**: "Likely to crave X at 3PM on Monday"
- **Success Rate**: "88% success resisting similar cravings"
- **Recommendation**: "Water + 10min walk before 3PM snack time"
- **Reward Alternative**: "Try herbal tea instead (similar satisfaction)"

#### **Goal Achievement**
- Current trajectory: On track / Behind / Ahead
- Weeks to goal: X
- Recommended actions

#### **Habit Strength Forecast**
- Days in current streak: X
- Probability of continuation: X%
- When likely to break: [date/condition]

#### **Optimal Timing Insights**
- Best time to work out this week
- Best meal timing based on schedule
- Recovery recommendations

---

## Data Flow Architecture

### Data Sources:
1. **Nutrition Service**: meals, calories, macros, water
2. **Fitness Service**: workouts, duration, type, completion
3. **Health Logging Service** (NEW): sleep, mood, cravings, stress, weight
4. **Dopamine/Behavior Service** (NEW): desire tracking, consume logging, satisfaction

### Backend Calculations Needed:
1. **Wellness Score** calculation
2. **Macro Balance** analysis
3. **Workout Consistency** metrics
4. **Dopamine Loop** analysis (desire → consume → satisfaction)
5. **Pattern Recognition** (behavior clustering)
6. **Trend Analysis** (historical comparison)
7. **Predictive Models** (ML forecasting)

---

## Visual Design Elements

### Colors:
- **Primary**: Blue (#3b82f6) - Health/Stats
- **Success**: Green (#10b981) - Good metrics
- **Warning**: Yellow (#f59e0b) - Caution
- **Alert**: Red (#ef4444) - Needs attention
- **Dopamine**: Purple (#8b5cf6) - Behavioral/Reward

### Icons:
- Health Score: 💚
- Nutrition: 🍎
- Workouts: 💪
- Hydration: 💧
- Dopamine/Behavior: 🧠
- Trends: 📈

---

## Loading States & Error Handling

- Show skeleton loaders while fetching
- Graceful fallback to mock data if APIs fail
- Empty state: "Start tracking to see your wellness insights"
- Error state: "Unable to load data, try again"

---

## Notes

- **No Fitness Tracker Dependency**: All metrics from app's native tracking
- **Dopamine Loop**: Core behavior change feature - tracks desire → consume → satisfaction
- **Personalization**: Insights adapt to individual patterns
- **Actionable**: All insights should lead to specific recommendations
