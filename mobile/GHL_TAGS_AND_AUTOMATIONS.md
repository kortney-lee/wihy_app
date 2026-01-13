# GHL Tags & Automations Guide

**Implementation guide for GoHighLevel tags and automation workflows**

---

## Path Selection Tags

These tags identify which path the user chose during onboarding:

- `wihy_path_individual` - Individual user path
- `wihy_path_family` - Family account path
- `wihy_path_coach` - Professional coach path
- `wihy_path_coach_family` - Coach + Family bundle path

**Usage:** Applied during onboarding when user selects their path. Helps with analytics and personalized onboarding flows.

---

## Plan Access Tags

These tags identify the active subscription plan:

- `wihy_free_active` - Free plan active
- `wihy_premium_active` - Premium plan active
- `wihy_family_basic_active` - Family Basic plan active
- `wihy_family_premium_active` - Family Premium plan active
- `wihy_coach_platform_active` - Coach Platform active

**Usage:** Applied when subscription is activated. Used to control app feature access.

---

## Feature Tags (Critical for Clarity)

These tags control individual feature access:

- `wihy_ai_coach_active` - WIHY Coach (AI) feature enabled
- `wihy_instacart_active` - Instacart Pro feature enabled

**Usage:** Applied based on plan tier or add-on purchases. Controls UI visibility and feature availability.

---

## Billing Status Tags

- `wihy_payment_failed` - Payment failure detected
- `wihy_cancel_requested` - User requested cancellation
- `wihy_subscription_ended` - Subscription has ended

**Usage:** Applied during billing events to trigger notification workflows and access restrictions.

---

## Automation Logic (Plain English)

### Purchase Premium
```
Trigger: Premium plan purchased
Actions:
  - Apply tag: wihy_premium_active
  - Send: Welcome email (Premium)
  - Workflow: Premium onboarding sequence
```

### Purchase Family Basic
```
Trigger: Family Basic plan purchased
Actions:
  - Apply tag: wihy_family_basic_active
  - Send: Welcome email (Family)
  - Send: Guardian Code
  - Workflow: Family setup guide
```

### Purchase Family Premium
```
Trigger: Family Premium plan purchased
Actions:
  - Apply tag: wihy_family_premium_active
  - Apply tag: wihy_ai_coach_active
  - Apply tag: wihy_instacart_active
  - Send: Welcome email (Family Premium)
  - Send: Guardian Code
  - Send: AI setup guide
  - Workflow: Family Premium onboarding
```

### Purchase Coach Platform
```
Trigger: Coach Platform purchased
Actions:
  - Apply tag: wihy_coach_platform_active
  - Send: Welcome email (Coach)
  - Send: Coach onboarding checklist
  - Workflow: Coach platform setup
```

### Purchase Coach + Family
```
Trigger: Coach + Family bundle purchased
Actions:
  - Apply tag: wihy_coach_platform_active
  - Apply tag: wihy_family_premium_active
  - Apply tag: wihy_ai_coach_active
  - Apply tag: wihy_instacart_active
  - Send: Welcome email (Coach + Family)
  - Send: Guardian Code (for family)
  - Workflow: Coach + Family complete onboarding
```

### AI Add-On Purchased
```
Trigger: WIHY Coach (AI) add-on purchased
(for Individual Premium, Family Basic, or Coach users)
Actions:
  - Apply tag: wihy_ai_coach_active
  - Send: AI feature activation email
  - Send: AI quick start guide
```

### Instacart Add-On Purchased
```
Trigger: Instacart Pro add-on purchased
(for Family Basic users)
Actions:
  - Apply tag: wihy_instacart_active
  - Send: Instacart setup guide
  - Send: Instacart connection instructions
```

---

## Tag-to-Capability Mapping (Backend Logic)

**Backend API should return capabilities based on active tags:**

```typescript
function getCapabilitiesFromTags(tags: string[]): Capabilities {
  return {
    // Meals enabled for all paid plans
    meals: tags.includes('wihy_premium_active') || 
           tags.includes('wihy_family_basic_active') ||
           tags.includes('wihy_family_premium_active') ||
           tags.includes('wihy_coach_platform_active'),
    
    // Workouts enabled for all paid plans
    workouts: tags.includes('wihy_premium_active') || 
              tags.includes('wihy_family_basic_active') ||
              tags.includes('wihy_family_premium_active') ||
              tags.includes('wihy_coach_platform_active'),
    
    // Family features for family plans only
    family: tags.includes('wihy_family_basic_active') ||
            tags.includes('wihy_family_premium_active'),
    
    // Coach platform for coach plans only
    coachPlatform: tags.includes('wihy_coach_platform_active'),
    
    // AI enabled by tag (included or add-on)
    wihyAI: tags.includes('wihy_ai_coach_active'),
    
    // Instacart enabled by tag (included or add-on)
    instacart: tags.includes('wihy_instacart_active'),
  };
}
```

**Example API Response:**
```json
{
  "user": {
    "id": "user123",
    "email": "coach@example.com",
    "plan": "coach",
    "ghlTags": [
      "wihy_path_coach",
      "wihy_coach_platform_active",
      "wihy_ai_coach_active"
    ],
    "capabilities": {
      "meals": true,
      "workouts": true,
      "family": false,
      "coachPlatform": true,
      "wihyAI": true,
      "instacart": false
    }
  }
}
```

---

## Upgrade/Downgrade Flows

### Premium → Family Basic
```
Trigger: User upgrades from Premium to Family Basic
Actions:
  - Remove tag: wihy_premium_active
  - Apply tag: wihy_family_basic_active
  - Send: Guardian Code
  - Send: Family upgrade welcome email
  - Workflow: Family setup sequence
```

### Family Basic → Family Premium
```
Trigger: User upgrades from Family Basic to Family Premium
Actions:
  - Remove tag: wihy_family_basic_active
  - Apply tag: wihy_family_premium_active
  - Apply tag: wihy_ai_coach_active
  - Apply tag: wihy_instacart_active
  - Send: Premium upgrade confirmation
  - Send: AI setup guide
```

### Coach → Coach + Family
```
Trigger: Coach adds Family Premium bundle
Actions:
  - Apply tag: wihy_family_premium_active
  - Apply tag: wihy_ai_coach_active
  - Apply tag: wihy_instacart_active
  - Send: Family addition confirmation
  - Send: Guardian Code
  - Workflow: Family setup for coaches
```

---

## Cancellation & Failed Payment Flows

### Payment Failed
```
Trigger: Payment failure detected
Actions:
  - Apply tag: wihy_payment_failed
  - Send: Payment failed email
  - Send: Update payment method reminder (Day 3)
  - Send: Final reminder (Day 7)
  - If not resolved by Day 10:
    - Remove active plan tags
    - Apply tag: wihy_subscription_ended
    - Downgrade to Free
```

### User Cancels Subscription
```
Trigger: User requests cancellation
Actions:
  - Apply tag: wihy_cancel_requested
  - Send: Cancellation confirmation
  - Send: Retention offer (optional)
  - On billing cycle end:
    - Remove active plan tags
    - Remove feature tags
    - Apply tag: wihy_subscription_ended
    - Send: Subscription ended email
```

---

## Tag Cleanup Rules

**When subscription ends:**
- Remove ALL plan-specific tags (`wihy_*_active`)
- Remove ALL feature tags (`wihy_ai_coach_active`, `wihy_instacart_active`)
- Keep path tags for analytics (`wihy_path_*`)
- Apply `wihy_subscription_ended`

**When user reactivates:**
- Remove `wihy_subscription_ended`
- Apply appropriate plan tags based on new purchase
- Send reactivation welcome email

---

## Analytics & Reporting Tags

Recommended additional tags for analytics:

- `wihy_onboarding_complete` - User completed initial setup
- `wihy_first_meal_created` - User created first meal plan
- `wihy_first_workout_logged` - User logged first workout
- `wihy_ai_first_use` - User used AI for first time
- `wihy_family_member_added` - Family member joined
- `wihy_coach_first_client` - Coach added first client

**Usage:** Track user engagement and identify activation milestones.

---

## Implementation Checklist

### Phase 1: Tag Setup
- [ ] Create all tags in GHL
- [ ] Document tag naming conventions
- [ ] Set up tag categories/groups

### Phase 2: Purchase Workflows
- [ ] Premium purchase automation
- [ ] Family Basic purchase automation
- [ ] Family Premium purchase automation
- [ ] Coach Platform purchase automation
- [ ] Coach + Family purchase automation
- [ ] AI add-on automation
- [ ] Instacart add-on automation

### Phase 3: Upgrade/Downgrade
- [ ] Premium → Family upgrade flow
- [ ] Family Basic → Premium upgrade flow
- [ ] Coach → Coach + Family flow
- [ ] Downgrade handling

### Phase 4: Billing & Cancellations
- [ ] Payment failed workflow
- [ ] Cancellation request workflow
- [ ] Subscription ended cleanup
- [ ] Reactivation workflow

### Phase 5: API Integration
- [ ] Backend reads GHL tags
- [ ] Capabilities computed from tags
- [ ] Frontend receives capabilities
- [ ] UI adapts based on capabilities

### Phase 6: Testing
- [ ] Test each purchase flow
- [ ] Test tag application
- [ ] Test capability mapping
- [ ] Test upgrade paths
- [ ] Test cancellation flows
- [ ] Test payment failures

---

## Quick Reference: Plan → Tags

| Purchase | Tags Applied |
|----------|-------------|
| Free | (none - default state) |
| Premium | `wihy_premium_active` |
| Family Basic | `wihy_family_basic_active` |
| Family Premium | `wihy_family_premium_active`, `wihy_ai_coach_active`, `wihy_instacart_active` |
| Coach Platform | `wihy_coach_platform_active` |
| Coach + Family | `wihy_coach_platform_active`, `wihy_family_premium_active`, `wihy_ai_coach_active`, `wihy_instacart_active` |
| AI Add-On | `wihy_ai_coach_active` |
| Instacart Add-On | `wihy_instacart_active` |
