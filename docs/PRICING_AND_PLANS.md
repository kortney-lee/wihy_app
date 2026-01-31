# WIHY Pricing & Plans Reference

## Pricing Approach: Client + Feature Based

WIHY uses a **client and feature-based pricing model** where users pay based on:
1. **Number of clients/members** they manage
2. **Features/add-ons** they enable

This allows flexible pricing that scales with usage.

---

## Consumer Plans

### Free - $0/month
**Tagline:** Get started with essential features

**Features:**
- ✅ Barcode scanning
- ✅ Photo food analysis
- ✅ Medication tracking
- ✅ Basic health dashboard
- ✅ Limited AI chat

**Capabilities:**
- Progress Tracking: Basic
- Meals: ❌
- Workouts: ❌
- Family: ❌
- WIHY AI: ❌
- Instacart: ❌
- Data Export: ❌

---

### Premium - $12.99/month (or $99.99/year)
**Tagline:** For individuals focused on their health journey

**Base Features:**
- ✅ Everything in Free
- ✅ Full nutrition and fitness tools
- ✅ Personal dashboard
- ✅ Meal planning and tracking
- ✅ Workout plans
- ✅ Progress tracking (advanced)
- ✅ Research insights

**Available Add-Ons:**
| Add-On | Price | Description |
|--------|-------|-------------|
| WIHY Coach AI | $4.99/mo | AI-powered health coaching |
| Instacart Integration | $7.99/mo | Grocery delivery + shopping lists |

---

### Family Plans - Client-Based Pricing

Family pricing scales based on the number of family members:

| Members | Plan | Monthly | Yearly |
|---------|------|---------|--------|
| Up to 4 | Family Basic | $24.99 | $249.99 |
| Up to 5 | Family Pro | $49.99 | $499.99 |

**Family Basic Features:**
- ✅ All Premium features
- ✅ Shared parent/guardian dashboard
- ✅ Individual accounts for everyone
- ⭐ Add-on: WIHY Coach AI (+$4.99/mo)

**Family Pro Features (includes everything):**
- ✅ All Family Basic features
- ✅ WIHY Coach AI **INCLUDED**
- ✅ Instacart Pro **INCLUDED**
- ✅ Data export

---

## Professional Plans

### Coach Platform - Client-Based Pricing

Coach pricing is based on:
1. **Setup Fee:** $99.99 one-time
2. **Base Platform:** $29.99/month
3. **Commission:** 1% on client subscriptions

**All Features Included:**
- ✅ Unlimited clients
- ✅ Meal plan and workout creation
- ✅ Progress tracking & reporting
- ✅ Client management dashboard
- ✅ WIHY Coach AI
- ✅ Instacart Pro
- ✅ API access + Webhooks
- 📞 Training from WIHY team

---

## Feature Add-Ons (Available for all paid plans)

| Feature | Price | Description |
|---------|-------|-------------|
| WIHY Coach AI | $4.99/mo | AI-powered health coaching and recommendations |
| Instacart Pro | $7.99/mo | Grocery delivery integration, auto shopping lists |
| Data Export | $2.99/mo | Export health data in various formats |
| API Access | $9.99/mo | Developer API access for integrations |

*Note: Some plans include add-ons at no extra cost (Family Pro, Coach)*

---

## B2B / Enterprise Plans - Custom Client-Based Pricing

Enterprise pricing is based on:
1. **Number of users/seats**
2. **Features enabled**
3. **Integration requirements**

| Plan | Target | Pricing Model |
|------|--------|---------------|
| Workplace Core | Small-Medium Business | Per-seat pricing |
| Workplace Plus | Medium Business + Families | Per-seat + household |
| Corporate Enterprise | Large Corporations | Volume licensing |
| K-12 School | Schools & Districts | Per-student pricing |
| University | Higher Education | Campus licensing |
| Hospital | Healthcare Facilities | Per-bed/staff pricing |
| Hospitality | Senior/Assisted Living | Per-resident pricing |

**All Enterprise Plans Include:**
- ✅ WIHY Coach AI
- ✅ Admin Dashboard
- ✅ Usage Analytics
- ✅ Role Management
- ✅ API Access + Webhooks
- ✅ White-label Options
- ✅ Dedicated Support

*Contact sales for custom pricing based on your organization size and needs.*

---

## Dashboard Tiles & Access by Plan

| Feature | Free | Premium | Family | Coach |
|---------|------|---------|--------|-------|
| Overview Dashboard | ✅ | ✅ | ✅ | ✅ |
| Notifications | ✅ | ✅ | ✅ | ✅ |
| Nutrition (Scan History) | ✅ | ✅ | ✅ | ✅ |
| Profile Setup | ✅ | ✅ | ✅ | ✅ |
| Find Coach | ✅ | ✅ | ✅ | ✅ |
| Quick Start Guide | ✅ | ✅ | ✅ | ✅ |
| Progress Dashboard | 🔒 | ✅ | ✅ | ✅ |
| Research Insights | 🔒 | ✅ | ✅ | ✅ |
| Fitness Dashboard | 🔒 | ✅ | ✅ | ✅ |
| Training Programs | 🔒 | ✅ | ✅ | ✅ |
| AI Meal Plans | 🔒 | ✅ | ✅ | ✅ |
| Meal Calendar | 🔒 | ✅ | ✅ | ✅ |
| Plan Meal | 🔒 | ✅ | ✅ | ✅ |
| Family Dashboard | 🔒 | 🔒 | ✅ | ❌ |
| Family Hub | 🔒 | 🔒 | ✅ | ❌ |
| Coach Hub | 🔒 | 🔒 | 🔒 | ✅ |
| Client Management | ❌ | ❌ | ❌ | ✅ |
| Coach Overview | ❌ | ❌ | ❌ | ✅ |

**Legend:**
- ✅ = Included
- 🔒 = Locked (shows tile, redirects to Subscription on click)
- ❌ = Not available

---

## Paywall Display (shown on locked tiles)

| Tile | Display Text |
|------|--------------|
| Family Hub | $49.99/mo |
| Coach Hub | $99.99 one-time |
| Premium features | Redirects to Subscription screen |

---

## Implementation Notes

1. **All tiles visible to all users** - Users see the full feature set even on free plan
2. **Lock badge** - Locked tiles show a small lock icon in top-right corner
3. **Paywall on click** - Clicking a locked tile redirects to `/subscription`
4. **Client-based scaling** - Pricing increases with number of clients/members
5. **Feature add-ons** - Users can enable/disable features as needed
6. **Role-based access**:
   - `admin` role: Full access to everything + dev tools
   - `employee` role: Full access (dev tools only if `is_developer` flag)
   - `coach` role: Access to Coach Hub
   - `user` role: Access based on plan + enabled features

---

*Last updated: January 31, 2026*
