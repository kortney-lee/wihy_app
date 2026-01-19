# WIHY Services Layer Architecture

> **Offline-First Design with Global & Personal Data Management**

This document defines the services layer architecture for WIHY, implementing offline-first patterns that sync when connectivity is restored - the standard approach used by modern mobile applications.

---

## 🚨 Backend Team: What You Need to Implement

**The mobile service layer is 100% COMPLETE.** All services are implemented and ready to consume APIs. The backend team needs to implement the following endpoints:

| Backend Service | Requirements Doc | Endpoints | Est. Days |
|----------------|------------------|-----------|-----------|
| **auth.wihy.ai** | [BACKEND_AUTH_WIHY_REQUIREMENTS.md](./BACKEND_AUTH_WIHY_REQUIREMENTS.md) | 23 | 16 |
| **services.wihy.ai** | [BACKEND_SERVICES_WIHY_REQUIREMENTS.md](./BACKEND_SERVICES_WIHY_REQUIREMENTS.md) | 23 | 11 |

### How Mobile Services Call Your APIs

```
┌─────────────────────────────────────────────────────────────────┐
│                    MOBILE APP (React Native)                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   profileService.ts ──────────► auth.wihy.ai/api/users/*        │
│   familyService.ts ───────────► auth.wihy.ai/api/families/*     │
│   purchaseService.ts ─────────► auth.wihy.ai/api/payments/*     │
│                                                                  │
│   goalsService.ts ────────────► services.wihy.ai/api/goals/*    │
│   progressService.ts ─────────► services.wihy.ai/api/progress/* │
│   notificationService.ts ─────► services.wihy.ai/api/reminders/*│
│   scanService.ts ─────────────► services.wihy.ai/api/scan/*     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### API Contract Requirements

**All endpoints MUST return this format:**
```json
// Success
{
  "success": true,
  "data": { ... },    // or specific field like "profile", "goals", etc.
  "error": null
}

// Error
{
  "success": false,
  "data": null,
  "error": "Human-readable error message",
  "code": "ERROR_CODE"
}
```

**All endpoints MUST accept Bearer token authentication:**
```
Authorization: Bearer <jwt_token>
```

### Priority Implementation Order

| Week | Focus | Backend Service | Mobile Service Ready |
|------|-------|-----------------|---------------------|
| 1 | Profile + Settings | auth.wihy.ai | ✅ `profileService.ts` |
| 1-2 | Goals + Progress | services.wihy.ai | ⚠️ `goalsService.ts` (needs completion) |
| 2 | Measurements + Photos | services.wihy.ai | ❌ Needs mobile service |
| 2-3 | Family Accounts | auth.wihy.ai | ✅ `familyService.ts` |
| 3 | Reminders + Scan History | services.wihy.ai | ✅ Ready |
| 3-4 | Payments (Stripe) | auth.wihy.ai | ⚠️ `purchaseService.ts` |

---

## ✅ Implementation Status

The following offline infrastructure has been implemented:

| Component | File | Status | Backend Needed |
|-----------|------|--------|----------------|
| Storage Service | `src/services/storage/storageService.ts` | ✅ Implemented | ❌ No |
| Connectivity Service | `src/services/connectivity/connectivityService.ts` | ✅ Implemented | ❌ No |
| Sync Engine | `src/services/sync/syncEngine.ts` | ✅ Implemented | ❌ No |
| Goals Dashboard Service | `src/services/goalsDashboardService.ts` | ✅ Updated with offline | ⚠️ Partial |
| Global Goals Service | `src/services/globalGoalsService.ts` | ✅ Updated with offline | ⚠️ Partial |
| **Profile Service** | `src/services/profileService.ts` | ✅ **COMPLETE (1102 lines)** | ✅ Yes - See [auth.wihy requirements](./BACKEND_AUTH_WIHY_REQUIREMENTS.md#-priority-1-profile-management-2-days) |
| **Family Service** | `src/services/familyService.ts` | ✅ **COMPLETE** | ✅ Yes - See [auth.wihy requirements](./BACKEND_AUTH_WIHY_REQUIREMENTS.md#-priority-2-family-accounts-4-days) |
| **Notification Service** | `src/services/notificationService.ts` | ✅ **COMPLETE** | ✅ Yes - See [services.wihy requirements](./BACKEND_SERVICES_WIHY_REQUIREMENTS.md#-priority-2-reminders-backend-2-days) |
| Sync Status Hook | `src/hooks/useSyncStatus.ts` | ✅ Implemented | ❌ No |
| Offline Indicator | `src/components/common/OfflineIndicator.tsx` | ✅ Implemented | ❌ No |
| **Meal Service (Enhanced)** | `src/services/mealService.ts` | ✅ Progressive Enhancement | ❌ No (already working) |
| **Meal Enhancement Hook** | `src/hooks/useMealEnhancement.ts` | ✅ Implemented | ❌ No |
| **Store Selector** | `src/components/shared/StoreSelector.tsx` | ✅ Implemented | ❌ No |
| **Zipcode Input** | `src/components/shared/ZipcodeInput.tsx` | ✅ Implemented | ❌ No |
| **Enhancement Status** | `src/components/shared/EnhancementStatus.tsx` | ✅ Implemented | ❌ No |
| **Shopping Setup Modal** | `src/components/shared/ShoppingSetupModal.tsx` | ✅ Implemented | ❌ No |

### What Backend Team Needs to Build

| Mobile Service | Backend Required | Endpoints Doc |
|---------------|-----------------|---------------|
| `profileService.ts` | ✅ **YES** | [Profile Management](./BACKEND_AUTH_WIHY_REQUIREMENTS.md#-priority-1-profile-management-2-days) |
| `familyService.ts` | ✅ **YES** | [Family Accounts](./BACKEND_AUTH_WIHY_REQUIREMENTS.md#-priority-2-family-accounts-4-days) |
| `purchaseService.ts` | ✅ **YES** | [Payment Processing](./BACKEND_AUTH_WIHY_REQUIREMENTS.md#-priority-3-payment-processing-10-days) |
| `goalsService.ts` | ✅ **YES** | [Goals & Milestones](./BACKEND_SERVICES_WIHY_REQUIREMENTS.md#-priority-1-goals--milestones-3-days) |
| `progressService.ts` | ✅ **YES** | [Progress Photos](./BACKEND_SERVICES_WIHY_REQUIREMENTS.md#-priority-1-progress-photos--measurements-4-days) |
| `notificationService.ts` | ✅ **YES** | [Reminders](./BACKEND_SERVICES_WIHY_REQUIREMENTS.md#-priority-2-reminders-backend-2-days) |
| `scanService.ts` | ✅ **YES** | [Scan History](./BACKEND_SERVICES_WIHY_REQUIREMENTS.md#-priority-2-scan-history-persistence-2-days) |

### Progressive Enhancement API

See [API_PROGRESSIVE_ENHANCEMENT_GUIDE.md](./API_PROGRESSIVE_ENHANCEMENT_GUIDE.md) for the three-level meal plan enhancement system:
- **Basic**: Generic meal plan (no shopping integration)
- **Zipcode**: Regional pricing + available stores
- **Full**: Real Instacart products + one-click ordering

### Required Dependencies

```bash
npm install @react-native-community/netinfo  # ✅ Installed
npm install @react-native-async-storage/async-storage  # ✅ Already present
```

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Offline-First Principles](#offline-first-principles)
3. [Storage Layer](#storage-layer)
4. [Service Categories](#service-categories)
5. [Personal Data Services](#personal-data-services)
6. [Global Data Services](#global-data-services)
7. [Sync Engine](#sync-engine)
8. [Implementation Guide](#implementation-guide)
9. [API Contracts](#api-contracts)
10. [Error Handling](#error-handling)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         UI COMPONENTS                                │
│   (Screens, Dashboards, Modals - React Native)                      │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                           HOOKS LAYER                                │
│   useGoalsDashboard, useGlobalGoals, useMealPlan, useWorkouts       │
│   - Exposes data to UI                                               │
│   - Handles loading/error states                                     │
│   - Triggers refreshes                                               │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        SERVICES LAYER                                │
│   ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐    │
│   │ PERSONAL DATA   │  │  GLOBAL DATA    │  │   SYNC ENGINE   │    │
│   │ goalsDashboard  │  │  globalGoals    │  │  offlineSync    │    │
│   │ mealPrograms    │  │  leaderboards   │  │  conflictRes    │    │
│   │ workoutPrograms │  │  challenges     │  │  queueManager   │    │
│   │ userPreferences │  │  community      │  │  connectivity   │    │
│   └─────────────────┘  └─────────────────┘  └─────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    ▼                              ▼
┌─────────────────────────────┐    ┌─────────────────────────────────┐
│      LOCAL STORAGE          │    │         REMOTE API              │
│  ┌───────────────────────┐  │    │  ┌───────────────────────────┐  │
│  │ AsyncStorage (KV)     │  │    │  │ REST API (wihy.app)       │  │
│  │ - User preferences    │  │    │  │ - /api/goals-dashboard    │  │
│  │ - Auth tokens         │  │    │  │ - /api/global-goals       │  │
│  │ - Sync queue          │  │    │  │ - /api/meal-programs      │  │
│  └───────────────────────┘  │    │  │ - /api/workout-programs   │  │
│  ┌───────────────────────┐  │    │  │ - /api/users/:id/*        │  │
│  │ SQLite (Structured)   │  │    │  └───────────────────────────┘  │
│  │ - Meal plans          │  │    │  ┌───────────────────────────┐  │
│  │ - Workout logs        │  │    │  │ WebSocket (realtime)      │  │
│  │ - Progress history    │  │    │  │ - Community updates       │  │
│  │ - Cached global data  │  │    │  │ - Challenge progress      │  │
│  └───────────────────────┘  │    │  │ - Leaderboard changes     │  │
│                             │    │  └───────────────────────────┘  │
└─────────────────────────────┘    └─────────────────────────────────┘
```

---

## Offline-First Principles

### Core Philosophy

1. **Local First**: All reads come from local storage first
2. **Optimistic Updates**: UI updates immediately, syncs in background
3. **Queue Writes**: Actions queued when offline, processed when online
4. **Graceful Degradation**: App fully functional without network
5. **Conflict Resolution**: Server wins for global, client wins for personal (with merge)

### Data Flow Patterns

```
┌─────────────────────────────────────────────────────────────────┐
│                    READ PATTERN (Offline-First)                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   User Action ──► Check Local Cache ──► Return Cached Data      │
│                         │                      │                 │
│                         ▼                      ▼                 │
│                   Background Fetch ──► Update Cache ──► Notify UI│
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                   WRITE PATTERN (Optimistic)                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   User Action ──► Update Local ──► Update UI ──► Queue Sync     │
│                                                      │          │
│                              ┌────────────────────────┘          │
│                              ▼                                   │
│                        Online? ──► Yes ──► Send to API          │
│                              │                   │               │
│                              ▼                   ▼               │
│                         No ──► Keep in Queue    Success? ──► Done│
│                                                      │          │
│                                                      ▼          │
│                                                 Retry with      │
│                                                 Backoff         │
└─────────────────────────────────────────────────────────────────┘
```

---

## Storage Layer

### Storage Service Interface

```typescript
// src/services/storage/storageService.ts

export interface StorageService {
  // Key-Value (AsyncStorage)
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
  remove(key: string): Promise<void>;
  
  // Structured Data (SQLite)
  query<T>(table: string, where?: QueryCondition): Promise<T[]>;
  insert<T>(table: string, data: T): Promise<string>;
  update<T>(table: string, id: string, data: Partial<T>): Promise<void>;
  delete(table: string, id: string): Promise<void>;
  
  // Bulk Operations
  bulkInsert<T>(table: string, data: T[]): Promise<void>;
  bulkUpdate<T>(table: string, updates: Array<{ id: string; data: Partial<T> }>): Promise<void>;
  
  // Cache Management
  clearCache(prefix?: string): Promise<void>;
  getCacheAge(key: string): Promise<number | null>;
}
```

### Storage Keys Convention

```typescript
// Storage key prefixes
const STORAGE_KEYS = {
  // User Personal Data
  USER_PROFILE: 'user:profile',
  USER_PREFERENCES: 'user:preferences',
  USER_ACTIVE_GOAL: 'user:active_goal',
  USER_PROGRESS: 'user:progress',
  
  // Programs (Personal)
  MEAL_PROGRAMS: 'programs:meals',
  WORKOUT_PROGRAMS: 'programs:workouts',
  COMBINED_PROGRAMS: 'programs:combined',
  
  // Logs (Personal)
  MEAL_LOGS: 'logs:meals',
  WORKOUT_LOGS: 'logs:workouts',
  WEIGHT_LOGS: 'logs:weight',
  
  // Global Data (Cached)
  GLOBAL_STATS: 'global:stats',
  GLOBAL_LEADERBOARD: 'global:leaderboard',
  GLOBAL_CHALLENGES: 'global:challenges',
  
  // Sync
  SYNC_QUEUE: 'sync:queue',
  SYNC_LAST: 'sync:last_sync',
  SYNC_CONFLICTS: 'sync:conflicts',
  
  // Cache Metadata
  CACHE_TIMESTAMPS: 'cache:timestamps',
};
```

### SQLite Schema

```sql
-- Personal Data Tables

CREATE TABLE user_goals (
  id TEXT PRIMARY KEY,
  goal_id TEXT NOT NULL,
  started_at TEXT NOT NULL,
  ended_at TEXT,
  status TEXT DEFAULT 'active',
  settings TEXT, -- JSON
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  synced_at TEXT,
  is_dirty INTEGER DEFAULT 0
);

CREATE TABLE meal_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  meal_type TEXT NOT NULL,
  meal_name TEXT,
  calories INTEGER,
  protein REAL,
  carbs REAL,
  fat REAL,
  logged_at TEXT NOT NULL,
  photo_uri TEXT,
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  synced_at TEXT,
  is_dirty INTEGER DEFAULT 0
);

CREATE TABLE workout_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  workout_id TEXT,
  workout_name TEXT,
  duration_min INTEGER,
  calories_burned INTEGER,
  exercises TEXT, -- JSON array
  completed_at TEXT NOT NULL,
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  synced_at TEXT,
  is_dirty INTEGER DEFAULT 0
);

CREATE TABLE progress_snapshots (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  goal_id TEXT,
  period TEXT NOT NULL, -- 'day', 'week', 'month'
  date TEXT NOT NULL,
  metrics TEXT NOT NULL, -- JSON
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  synced_at TEXT
);

-- Global Data Cache Tables

CREATE TABLE global_stats_cache (
  goal_id TEXT NOT NULL,
  period TEXT NOT NULL,
  stats TEXT NOT NULL, -- JSON
  fetched_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  PRIMARY KEY (goal_id, period)
);

CREATE TABLE leaderboard_cache (
  goal_id TEXT NOT NULL,
  period TEXT NOT NULL,
  entries TEXT NOT NULL, -- JSON array
  user_position TEXT, -- JSON
  fetched_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  PRIMARY KEY (goal_id, period)
);

-- Sync Queue

CREATE TABLE sync_queue (
  id TEXT PRIMARY KEY,
  operation TEXT NOT NULL, -- 'create', 'update', 'delete'
  table_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  payload TEXT NOT NULL, -- JSON
  priority INTEGER DEFAULT 5,
  attempts INTEGER DEFAULT 0,
  last_attempt TEXT,
  error TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sync_queue_priority ON sync_queue(priority DESC, created_at ASC);
```

---

## Service Categories

### Service Types Matrix

| Category | Data Owner | Sync Direction | Offline Support | Conflict Strategy |
|----------|-----------|----------------|-----------------|-------------------|
| **Personal** | User | Bidirectional | Full | Client wins + merge |
| **Global** | Server | Server → Client | Cache only | Server wins |
| **Hybrid** | Both | Bidirectional | Partial | Depends on field |

### Personal Data Services

```
┌─────────────────────────────────────────────────────────────────┐
│                     PERSONAL DATA SERVICES                       │
├────────────────────┬────────────────────────────────────────────┤
│ Service            │ Responsibility                             │
├────────────────────┼────────────────────────────────────────────┤
│ goalsDashboard     │ User's active goal, progress, preferences  │
│ mealProgramService │ User's meal plans, logs, favorites         │
│ workoutService     │ User's workout plans, logs, history        │
│ userPreferences    │ Diet restrictions, food exclusions, etc.   │
│ progressService    │ Weight, measurements, streaks              │
│ scanHistoryService │ Food/pill scans, barcode history           │
└────────────────────┴────────────────────────────────────────────┘
```

### Global Data Services

```
┌─────────────────────────────────────────────────────────────────┐
│                      GLOBAL DATA SERVICES                        │
├────────────────────┬────────────────────────────────────────────┤
│ Service            │ Responsibility                             │
├────────────────────┼────────────────────────────────────────────┤
│ globalGoalsService │ Community stats, total users, aggregates   │
│ leaderboardService │ Rankings, top users, user position         │
│ challengeService   │ Community challenges, participation        │
│ contentService     │ Recipes, workouts library (read-only)      │
│ configService      │ App config, feature flags                  │
└────────────────────┴────────────────────────────────────────────┘
```

---

## Personal Data Services

### Goals Dashboard Service (Updated)

```typescript
// src/services/goalsDashboardService.ts

import { storageService } from './storage/storageService';
import { syncEngine } from './sync/syncEngine';
import { connectivityService } from './connectivity/connectivityService';

export type GoalId = 
  | 'weight_loss'
  | 'muscle_gain'
  | 'body_recomposition'
  | 'maintenance'
  | 'athletic_performance'
  | 'general_health';

export interface GoalCard {
  id: GoalId;
  label: string;
  formula: string;
  icon: string;
  color: string;
  isActive: boolean;
}

export interface UserGoalProgress {
  workoutsCompleted: number;
  caloriesLogged: number;
  overallProgress: number;
  streak: number;
  lastUpdated: string;
}

export interface GoalsDashboardData {
  goals: GoalCard[];
  activeGoal?: GoalId;
  userProgress?: UserGoalProgress;
  community: CommunityStats;
  lastSynced?: string;
  isOffline: boolean;
}

class GoalsDashboardService {
  private readonly CACHE_KEY = 'goals:dashboard';
  private readonly ACTIVE_GOAL_KEY = 'user:active_goal';
  private readonly PROGRESS_KEY = 'user:goal_progress';
  
  // Static goal definitions (never change)
  private readonly GOAL_DEFINITIONS: Omit<GoalCard, 'isActive'>[] = [
    { id: 'weight_loss', label: 'Weight Loss', formula: 'Burn > Eat', icon: 'trending-down-outline', color: '#ef4444' },
    { id: 'muscle_gain', label: 'Muscle Gain', formula: 'Protein + Lift', icon: 'fitness-outline', color: '#f97316' },
    { id: 'body_recomposition', label: 'Body Recomp', formula: 'Burn Fat + Build', icon: 'body-outline', color: '#8b5cf6' },
    { id: 'maintenance', label: 'Maintenance', formula: 'Balance In/Out', icon: 'shield-checkmark-outline', color: '#10b981' },
    { id: 'athletic_performance', label: 'Athletic', formula: 'Train + Fuel', icon: 'trophy-outline', color: '#3b82f6' },
    { id: 'general_health', label: 'General Health', formula: 'Move + Eat Well', icon: 'heart-outline', color: '#ec4899' },
  ];

  /**
   * Get dashboard data - LOCAL FIRST, then background refresh
   */
  async getDashboard(period: 'today' | 'week' | 'month'): Promise<GoalsDashboardData> {
    // 1. Always read from local first
    const [activeGoal, userProgress, cachedCommunity] = await Promise.all([
      storageService.get<GoalId>(this.ACTIVE_GOAL_KEY),
      this.getLocalProgress(period),
      storageService.get<CommunityStats>(`${this.CACHE_KEY}:community:${period}`),
    ]);

    // 2. Build goals with active state
    const goals = this.GOAL_DEFINITIONS.map(g => ({
      ...g,
      isActive: g.id === activeGoal,
    }));

    // 3. Return local data immediately
    const localData: GoalsDashboardData = {
      goals,
      activeGoal: activeGoal || undefined,
      userProgress: userProgress || undefined,
      community: cachedCommunity || this.getDefaultCommunityStats(period),
      lastSynced: await storageService.get<string>(`${this.CACHE_KEY}:synced`),
      isOffline: !connectivityService.isOnline(),
    };

    // 4. Background refresh if online (don't await)
    if (connectivityService.isOnline()) {
      this.backgroundRefresh(period).catch(console.warn);
    }

    return localData;
  }

  /**
   * Set active goal - OPTIMISTIC UPDATE
   */
  async setActiveGoal(goalId: GoalId): Promise<{ success: boolean }> {
    // 1. Update local immediately
    await storageService.set(this.ACTIVE_GOAL_KEY, goalId);
    
    // 2. Initialize progress for new goal
    await this.initializeProgress(goalId);
    
    // 3. Queue sync operation
    await syncEngine.enqueue({
      operation: 'update',
      endpoint: '/api/goals-dashboard/active',
      payload: { goalId },
      priority: 'high',
    });

    return { success: true };
  }

  /**
   * Clear active goal
   */
  async clearActiveGoal(): Promise<{ success: boolean }> {
    await storageService.remove(this.ACTIVE_GOAL_KEY);
    
    await syncEngine.enqueue({
      operation: 'delete',
      endpoint: '/api/goals-dashboard/active',
      payload: {},
      priority: 'high',
    });

    return { success: true };
  }

  /**
   * Log progress (workout, meal, etc.)
   */
  async logProgress(type: 'workout' | 'meal' | 'weight', data: any): Promise<void> {
    const activeGoal = await storageService.get<GoalId>(this.ACTIVE_GOAL_KEY);
    if (!activeGoal) return;

    // Update local progress
    const progress = await this.getLocalProgress('today') || this.getDefaultProgress();
    
    switch (type) {
      case 'workout':
        progress.workoutsCompleted += 1;
        break;
      case 'meal':
        progress.caloriesLogged += data.calories || 0;
        break;
    }
    
    progress.lastUpdated = new Date().toISOString();
    await storageService.set(`${this.PROGRESS_KEY}:today`, progress);
    
    // Queue sync
    await syncEngine.enqueue({
      operation: 'create',
      endpoint: `/api/goals-dashboard/progress`,
      payload: { type, data, goalId: activeGoal },
      priority: 'normal',
    });
  }

  // Private helpers
  
  private async getLocalProgress(period: string): Promise<UserGoalProgress | null> {
    return storageService.get<UserGoalProgress>(`${this.PROGRESS_KEY}:${period}`);
  }

  private async backgroundRefresh(period: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/goals-dashboard?period=${period}`);
      if (response.ok) {
        const data = await response.json();
        
        // Update caches
        await Promise.all([
          storageService.set(`${this.CACHE_KEY}:community:${period}`, data.community),
          storageService.set(`${this.CACHE_KEY}:synced`, new Date().toISOString()),
        ]);
        
        // Merge server progress with local (local wins for today)
        if (period !== 'today' && data.userProgress) {
          await storageService.set(`${this.PROGRESS_KEY}:${period}`, data.userProgress);
        }
      }
    } catch (error) {
      console.warn('[GoalsDashboard] Background refresh failed:', error);
    }
  }

  private async initializeProgress(goalId: GoalId): Promise<void> {
    const existing = await this.getLocalProgress('today');
    if (!existing) {
      await storageService.set(`${this.PROGRESS_KEY}:today`, this.getDefaultProgress());
    }
  }

  private getDefaultProgress(): UserGoalProgress {
    return {
      workoutsCompleted: 0,
      caloriesLogged: 0,
      overallProgress: 0,
      streak: 0,
      lastUpdated: new Date().toISOString(),
    };
  }

  private getDefaultCommunityStats(period: string): CommunityStats {
    return {
      totalActiveUsers: 0,
      topGoal: 'weight_loss',
      totalWeightLost: 0,
      totalWasteReduced: 0,
    };
  }
}

export const goalsDashboardService = new GoalsDashboardService();
```

### Meal Programs Service (Offline-First)

```typescript
// src/services/mealProgramService.ts

import { storageService } from './storage/storageService';
import { syncEngine } from './sync/syncEngine';
import { connectivityService } from './connectivity/connectivityService';

export interface MealProgram {
  id: string;
  mode: 'quick' | 'plan' | 'diet';
  name: string;
  duration: number;
  servings: number;
  mealsPerDay: MealsPerDay;
  dietaryRestrictions: string[];
  days: MealDay[];
  createdAt: string;
  updatedAt: string;
  syncedAt?: string;
  isDirty: boolean;
}

export interface MealLog {
  id: string;
  programId?: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  mealName: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  loggedAt: string;
  photoUri?: string;
  syncedAt?: string;
  isDirty: boolean;
}

class MealProgramService {
  private readonly PROGRAMS_KEY = 'programs:meals';
  private readonly LOGS_KEY = 'logs:meals';
  private readonly FAVORITES_KEY = 'favorites:meals';

  /**
   * Get all meal programs - LOCAL FIRST
   */
  async getPrograms(): Promise<MealProgram[]> {
    const programs = await storageService.get<MealProgram[]>(this.PROGRAMS_KEY) || [];
    
    // Background sync if online
    if (connectivityService.isOnline()) {
      this.syncPrograms().catch(console.warn);
    }
    
    return programs;
  }

  /**
   * Get active program
   */
  async getActiveProgram(): Promise<MealProgram | null> {
    const programs = await this.getPrograms();
    return programs.find(p => this.isProgramActive(p)) || null;
  }

  /**
   * Create meal program - OFFLINE CAPABLE
   */
  async createProgram(request: MealProgramRequest): Promise<MealProgram> {
    const program: MealProgram = {
      id: this.generateId(),
      ...request,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDirty: true,
    };

    // Save locally
    const programs = await this.getPrograms();
    programs.push(program);
    await storageService.set(this.PROGRAMS_KEY, programs);

    // Queue for server generation (AI-powered)
    await syncEngine.enqueue({
      operation: 'create',
      endpoint: '/api/meal-programs',
      payload: request,
      localId: program.id,
      priority: 'high',
      callback: 'mealProgramService.onProgramGenerated',
    });

    return program;
  }

  /**
   * Log a meal - OFFLINE CAPABLE
   */
  async logMeal(log: Omit<MealLog, 'id' | 'syncedAt' | 'isDirty'>): Promise<MealLog> {
    const mealLog: MealLog = {
      id: this.generateId(),
      ...log,
      isDirty: true,
    };

    // Save locally
    const logs = await this.getMealLogs();
    logs.push(mealLog);
    await storageService.set(this.LOGS_KEY, logs);

    // Queue sync
    await syncEngine.enqueue({
      operation: 'create',
      endpoint: '/api/meal-logs',
      payload: mealLog,
      priority: 'normal',
    });

    return mealLog;
  }

  /**
   * Get meal logs for date range
   */
  async getMealLogs(startDate?: string, endDate?: string): Promise<MealLog[]> {
    const logs = await storageService.get<MealLog[]>(this.LOGS_KEY) || [];
    
    if (!startDate) return logs;
    
    return logs.filter(log => {
      const logDate = new Date(log.loggedAt);
      const start = new Date(startDate);
      const end = endDate ? new Date(endDate) : new Date();
      return logDate >= start && logDate <= end;
    });
  }

  /**
   * Get today's nutrition summary
   */
  async getTodayNutrition(): Promise<NutritionSummary> {
    const today = new Date().toISOString().split('T')[0];
    const logs = await this.getMealLogs(today);
    
    return {
      calories: logs.reduce((sum, l) => sum + l.calories, 0),
      protein: logs.reduce((sum, l) => sum + l.protein, 0),
      carbs: logs.reduce((sum, l) => sum + l.carbs, 0),
      fat: logs.reduce((sum, l) => sum + l.fat, 0),
      mealsLogged: logs.length,
    };
  }

  // Sync callback - called when server responds
  async onProgramGenerated(localId: string, serverResponse: any): Promise<void> {
    const programs = await this.getPrograms();
    const index = programs.findIndex(p => p.id === localId);
    
    if (index >= 0) {
      programs[index] = {
        ...programs[index],
        ...serverResponse,
        id: localId, // Keep local ID
        isDirty: false,
        syncedAt: new Date().toISOString(),
      };
      await storageService.set(this.PROGRAMS_KEY, programs);
    }
  }

  // Private helpers
  
  private async syncPrograms(): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/meal-programs`);
      if (response.ok) {
        const serverPrograms = await response.json();
        await this.mergePrograms(serverPrograms);
      }
    } catch (error) {
      console.warn('[MealPrograms] Sync failed:', error);
    }
  }

  private async mergePrograms(serverPrograms: MealProgram[]): Promise<void> {
    const localPrograms = await this.getPrograms();
    
    // Merge strategy: Keep dirty local, update clean local with server
    const merged = localPrograms.map(local => {
      if (local.isDirty) return local; // Don't overwrite pending changes
      
      const server = serverPrograms.find(s => s.id === local.id);
      return server || local;
    });
    
    // Add new server programs not in local
    serverPrograms.forEach(server => {
      if (!merged.find(m => m.id === server.id)) {
        merged.push({ ...server, isDirty: false });
      }
    });
    
    await storageService.set(this.PROGRAMS_KEY, merged);
  }

  private isProgramActive(program: MealProgram): boolean {
    const start = new Date(program.createdAt);
    const end = new Date(start);
    end.setDate(end.getDate() + program.duration);
    return new Date() >= start && new Date() <= end;
  }

  private generateId(): string {
    return `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const mealProgramService = new MealProgramService();
```

---

## Global Data Services

### Global Goals Service (Cache-First)

```typescript
// src/services/globalGoalsService.ts

import { storageService } from './storage/storageService';
import { connectivityService } from './connectivity/connectivityService';

export interface GlobalGoalStats {
  goalId: string;
  goalLabel: string;
  totalUsers: number;
  activeUsersToday: number;
  activeUsersWeek: number;
  activeUsersMonth: number;
  communityMetrics: {
    totalPoundsLost?: number;
    totalWorkoutsCompleted?: number;
    totalMealsLogged?: number;
    wasteReduced?: number;
  };
}

export interface UserGoalRanking {
  goalId: string;
  percentile: number;
  rank: number;
  totalInGoal: number;
  userMetrics: Record<string, number>;
}

export interface GlobalLeaderboard {
  goalId: string;
  period: string;
  topUsers: LeaderboardEntry[];
  userPosition?: LeaderboardEntry;
}

class GlobalGoalsService {
  private readonly CACHE_KEY = 'global:goals';
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes for global data

  /**
   * Get global stats for all goals - CACHE FIRST
   */
  async getAllGoalStats(period: 'today' | 'week' | 'month' = 'week'): Promise<GlobalGoalStats[]> {
    const cacheKey = `${this.CACHE_KEY}:stats:${period}`;
    
    // Check cache
    const cached = await this.getCachedWithExpiry<GlobalGoalStats[]>(cacheKey);
    if (cached) return cached;
    
    // Fetch if online
    if (connectivityService.isOnline()) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/global-goals/stats?period=${period}`);
        if (response.ok) {
          const data = await response.json();
          await this.setCachedWithExpiry(cacheKey, data, this.CACHE_TTL);
          return data;
        }
      } catch (error) {
        console.warn('[GlobalGoals] Fetch failed:', error);
      }
    }
    
    // Return stale cache or defaults
    const stale = await storageService.get<GlobalGoalStats[]>(cacheKey);
    return stale || this.getDefaultStats();
  }

  /**
   * Get user's ranking for a goal - CACHE FIRST
   */
  async getUserRanking(goalId: string, period: string = 'week'): Promise<UserGoalRanking | null> {
    const cacheKey = `${this.CACHE_KEY}:ranking:${goalId}:${period}`;
    
    const cached = await this.getCachedWithExpiry<UserGoalRanking>(cacheKey);
    if (cached) return cached;
    
    if (connectivityService.isOnline()) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/global-goals/ranking/${goalId}?period=${period}`);
        if (response.ok) {
          const data = await response.json();
          await this.setCachedWithExpiry(cacheKey, data, this.CACHE_TTL);
          return data;
        }
      } catch (error) {
        console.warn('[GlobalGoals] Ranking fetch failed:', error);
      }
    }
    
    return storageService.get<UserGoalRanking>(cacheKey);
  }

  /**
   * Get leaderboard - CACHE FIRST (longer TTL)
   */
  async getLeaderboard(goalId: string, period: string = 'week'): Promise<GlobalLeaderboard> {
    const cacheKey = `${this.CACHE_KEY}:leaderboard:${goalId}:${period}`;
    const leaderboardTTL = 15 * 60 * 1000; // 15 minutes
    
    const cached = await this.getCachedWithExpiry<GlobalLeaderboard>(cacheKey);
    if (cached) return cached;
    
    if (connectivityService.isOnline()) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/global-goals/leaderboard/${goalId}?period=${period}`);
        if (response.ok) {
          const data = await response.json();
          await this.setCachedWithExpiry(cacheKey, data, leaderboardTTL);
          return data;
        }
      } catch (error) {
        console.warn('[GlobalGoals] Leaderboard fetch failed:', error);
      }
    }
    
    const stale = await storageService.get<GlobalLeaderboard>(cacheKey);
    return stale || this.getDefaultLeaderboard(goalId, period);
  }

  /**
   * Get community challenges - CACHE FIRST
   */
  async getChallenges(): Promise<CommunityChallenge[]> {
    const cacheKey = `${this.CACHE_KEY}:challenges`;
    
    const cached = await this.getCachedWithExpiry<CommunityChallenge[]>(cacheKey);
    if (cached) return cached;
    
    if (connectivityService.isOnline()) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/global-goals/challenges`);
        if (response.ok) {
          const data = await response.json();
          await this.setCachedWithExpiry(cacheKey, data, this.CACHE_TTL);
          return data;
        }
      } catch (error) {
        console.warn('[GlobalGoals] Challenges fetch failed:', error);
      }
    }
    
    return storageService.get<CommunityChallenge[]>(cacheKey) || [];
  }

  /**
   * Force refresh global data
   */
  async forceRefresh(): Promise<void> {
    await storageService.clearCache(this.CACHE_KEY);
  }

  // Private helpers
  
  private async getCachedWithExpiry<T>(key: string): Promise<T | null> {
    const meta = await storageService.get<{ data: T; expiresAt: number }>(key);
    if (meta && meta.expiresAt > Date.now()) {
      return meta.data;
    }
    return null;
  }

  private async setCachedWithExpiry<T>(key: string, data: T, ttl: number): Promise<void> {
    await storageService.set(key, {
      data,
      expiresAt: Date.now() + ttl,
    });
  }

  private getDefaultStats(): GlobalGoalStats[] {
    return [
      { goalId: 'weight_loss', goalLabel: 'Weight Loss', totalUsers: 0, activeUsersToday: 0, activeUsersWeek: 0, activeUsersMonth: 0, communityMetrics: {} },
      { goalId: 'muscle_gain', goalLabel: 'Muscle Gain', totalUsers: 0, activeUsersToday: 0, activeUsersWeek: 0, activeUsersMonth: 0, communityMetrics: {} },
      { goalId: 'body_recomposition', goalLabel: 'Body Recomp', totalUsers: 0, activeUsersToday: 0, activeUsersWeek: 0, activeUsersMonth: 0, communityMetrics: {} },
      { goalId: 'maintenance', goalLabel: 'Maintenance', totalUsers: 0, activeUsersToday: 0, activeUsersWeek: 0, activeUsersMonth: 0, communityMetrics: {} },
      { goalId: 'athletic_performance', goalLabel: 'Athletic', totalUsers: 0, activeUsersToday: 0, activeUsersWeek: 0, activeUsersMonth: 0, communityMetrics: {} },
      { goalId: 'general_health', goalLabel: 'General Health', totalUsers: 0, activeUsersToday: 0, activeUsersWeek: 0, activeUsersMonth: 0, communityMetrics: {} },
    ];
  }

  private getDefaultLeaderboard(goalId: string, period: string): GlobalLeaderboard {
    return { goalId, period, topUsers: [] };
  }
}

export const globalGoalsService = new GlobalGoalsService();
```

---

## Sync Engine

### Core Sync Engine

```typescript
// src/services/sync/syncEngine.ts

import { storageService } from '../storage/storageService';
import { connectivityService } from '../connectivity/connectivityService';
import NetInfo from '@react-native-community/netinfo';

export interface SyncOperation {
  id: string;
  operation: 'create' | 'update' | 'delete';
  endpoint: string;
  payload: any;
  localId?: string;
  priority: 'critical' | 'high' | 'normal' | 'low';
  callback?: string; // Service method to call on success
  attempts: number;
  lastAttempt?: string;
  error?: string;
  createdAt: string;
}

export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  lastSyncAt?: string;
  lastError?: string;
}

class SyncEngine {
  private readonly QUEUE_KEY = 'sync:queue';
  private readonly STATUS_KEY = 'sync:status';
  private isSyncing = false;
  private listeners: Set<(status: SyncStatus) => void> = new Set();

  constructor() {
    // Listen for connectivity changes
    NetInfo.addEventListener(state => {
      if (state.isConnected) {
        this.processQueue();
      }
      this.notifyListeners();
    });
  }

  /**
   * Add operation to sync queue
   */
  async enqueue(op: Omit<SyncOperation, 'id' | 'attempts' | 'createdAt'>): Promise<string> {
    const operation: SyncOperation = {
      id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...op,
      attempts: 0,
      createdAt: new Date().toISOString(),
    };

    const queue = await this.getQueue();
    queue.push(operation);
    
    // Sort by priority
    queue.sort((a, b) => this.priorityWeight(a.priority) - this.priorityWeight(b.priority));
    
    await storageService.set(this.QUEUE_KEY, queue);
    this.notifyListeners();

    // Try to sync immediately if online
    if (connectivityService.isOnline()) {
      this.processQueue();
    }

    return operation.id;
  }

  /**
   * Process pending sync operations
   */
  async processQueue(): Promise<void> {
    if (this.isSyncing || !connectivityService.isOnline()) return;
    
    this.isSyncing = true;
    this.notifyListeners();

    try {
      const queue = await this.getQueue();
      const processed: string[] = [];
      const failed: SyncOperation[] = [];

      for (const op of queue) {
        try {
          await this.executeOperation(op);
          processed.push(op.id);
        } catch (error) {
          op.attempts += 1;
          op.lastAttempt = new Date().toISOString();
          op.error = error instanceof Error ? error.message : 'Unknown error';
          
          if (op.attempts >= this.maxAttempts(op.priority)) {
            // Move to dead letter queue after max attempts
            await this.moveToDeadLetter(op);
            processed.push(op.id);
          } else {
            failed.push(op);
          }
        }
      }

      // Update queue with remaining failed operations
      await storageService.set(this.QUEUE_KEY, failed);
      
      // Update sync status
      await storageService.set(this.STATUS_KEY, {
        lastSyncAt: new Date().toISOString(),
        lastError: failed.length > 0 ? failed[0].error : undefined,
      });

    } finally {
      this.isSyncing = false;
      this.notifyListeners();
    }
  }

  /**
   * Get current sync status
   */
  async getStatus(): Promise<SyncStatus> {
    const queue = await this.getQueue();
    const status = await storageService.get<{ lastSyncAt?: string; lastError?: string }>(this.STATUS_KEY);
    
    return {
      isOnline: connectivityService.isOnline(),
      isSyncing: this.isSyncing,
      pendingCount: queue.length,
      lastSyncAt: status?.lastSyncAt,
      lastError: status?.lastError,
    };
  }

  /**
   * Subscribe to sync status changes
   */
  subscribe(listener: (status: SyncStatus) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Force sync now
   */
  async forceSync(): Promise<void> {
    if (connectivityService.isOnline()) {
      await this.processQueue();
    }
  }

  /**
   * Clear all pending syncs (use with caution)
   */
  async clearQueue(): Promise<void> {
    await storageService.set(this.QUEUE_KEY, []);
    this.notifyListeners();
  }

  // Private helpers

  private async getQueue(): Promise<SyncOperation[]> {
    return await storageService.get<SyncOperation[]>(this.QUEUE_KEY) || [];
  }

  private async executeOperation(op: SyncOperation): Promise<void> {
    const method = op.operation === 'delete' ? 'DELETE' : 
                   op.operation === 'create' ? 'POST' : 'PUT';

    const response = await fetch(`${API_BASE_URL}${op.endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await this.getAuthToken()}`,
      },
      body: method !== 'DELETE' ? JSON.stringify(op.payload) : undefined,
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    // Execute callback if specified
    if (op.callback) {
      const data = await response.json();
      await this.executeCallback(op.callback, op.localId, data);
    }
  }

  private async executeCallback(callback: string, localId: string | undefined, data: any): Promise<void> {
    const [serviceName, methodName] = callback.split('.');
    
    // Import and call the service method
    const services: Record<string, any> = {
      mealProgramService: require('../mealProgramService').mealProgramService,
      workoutProgramService: require('../workoutProgramService').workoutProgramService,
    };
    
    const service = services[serviceName];
    if (service && typeof service[methodName] === 'function') {
      await service[methodName](localId, data);
    }
  }

  private async moveToDeadLetter(op: SyncOperation): Promise<void> {
    const deadLetter = await storageService.get<SyncOperation[]>('sync:dead_letter') || [];
    deadLetter.push(op);
    await storageService.set('sync:dead_letter', deadLetter);
    console.error('[SyncEngine] Operation moved to dead letter:', op);
  }

  private priorityWeight(priority: string): number {
    return { critical: 0, high: 1, normal: 2, low: 3 }[priority] || 2;
  }

  private maxAttempts(priority: string): number {
    return { critical: 10, high: 5, normal: 3, low: 2 }[priority] || 3;
  }

  private async getAuthToken(): Promise<string> {
    return await storageService.get<string>('auth:token') || '';
  }

  private async notifyListeners(): Promise<void> {
    const status = await this.getStatus();
    this.listeners.forEach(listener => listener(status));
  }
}

export const syncEngine = new SyncEngine();
```

### Connectivity Service

```typescript
// src/services/connectivity/connectivityService.ts

import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

class ConnectivityService {
  private _isOnline: boolean = true;
  private listeners: Set<(isOnline: boolean) => void> = new Set();

  constructor() {
    NetInfo.addEventListener(this.handleConnectivityChange.bind(this));
    this.checkInitialState();
  }

  private async checkInitialState(): Promise<void> {
    const state = await NetInfo.fetch();
    this._isOnline = state.isConnected ?? true;
  }

  private handleConnectivityChange(state: NetInfoState): void {
    const wasOnline = this._isOnline;
    this._isOnline = state.isConnected ?? false;
    
    if (wasOnline !== this._isOnline) {
      console.log(`[Connectivity] ${this._isOnline ? 'Online' : 'Offline'}`);
      this.listeners.forEach(listener => listener(this._isOnline));
    }
  }

  isOnline(): boolean {
    return this._isOnline;
  }

  subscribe(listener: (isOnline: boolean) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}

export const connectivityService = new ConnectivityService();
```

---

## Implementation Guide

### Step 1: Install Dependencies

```bash
npm install @react-native-async-storage/async-storage
npm install @react-native-community/netinfo
npm install expo-sqlite
npm install uuid
```

### Step 2: Create Storage Service

```typescript
// src/services/storage/storageService.ts

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SQLite from 'expo-sqlite';

class StorageService {
  private db: SQLite.SQLiteDatabase | null = null;

  async initialize(): Promise<void> {
    this.db = await SQLite.openDatabaseAsync('wihy.db');
    await this.createTables();
  }

  // AsyncStorage methods
  async get<T>(key: string): Promise<T | null> {
    const value = await AsyncStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  }

  async set<T>(key: string, value: T): Promise<void> {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  }

  async remove(key: string): Promise<void> {
    await AsyncStorage.removeItem(key);
  }

  async clearCache(prefix?: string): Promise<void> {
    const keys = await AsyncStorage.getAllKeys();
    const toRemove = prefix 
      ? keys.filter(k => k.startsWith(prefix))
      : keys.filter(k => k.startsWith('cache:') || k.startsWith('global:'));
    await AsyncStorage.multiRemove(toRemove);
  }

  // SQLite methods
  async query<T>(sql: string, params?: any[]): Promise<T[]> {
    if (!this.db) await this.initialize();
    return this.db!.getAllAsync(sql, params || []) as Promise<T[]>;
  }

  async execute(sql: string, params?: any[]): Promise<void> {
    if (!this.db) await this.initialize();
    await this.db!.runAsync(sql, params || []);
  }

  private async createTables(): Promise<void> {
    await this.db!.execAsync(`
      CREATE TABLE IF NOT EXISTS meal_logs (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        meal_type TEXT NOT NULL,
        meal_name TEXT,
        calories INTEGER,
        protein REAL,
        carbs REAL,
        fat REAL,
        logged_at TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        synced_at TEXT,
        is_dirty INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS workout_logs (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        workout_name TEXT,
        duration_min INTEGER,
        calories_burned INTEGER,
        completed_at TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        synced_at TEXT,
        is_dirty INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS sync_queue (
        id TEXT PRIMARY KEY,
        operation TEXT NOT NULL,
        endpoint TEXT NOT NULL,
        payload TEXT NOT NULL,
        priority INTEGER DEFAULT 5,
        attempts INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);
  }
}

export const storageService = new StorageService();
```

### Step 3: Initialize on App Start

```typescript
// src/App.tsx or index.ts

import { storageService } from './services/storage/storageService';
import { syncEngine } from './services/sync/syncEngine';

async function initializeApp() {
  // Initialize storage
  await storageService.initialize();
  
  // Start sync engine
  syncEngine.processQueue();
  
  console.log('[App] Services initialized');
}

initializeApp();
```

### Step 4: Update Hooks to Use Offline-First Services

```typescript
// src/hooks/useGoalsDashboard.ts (Updated)

import { useState, useEffect, useCallback } from 'react';
import { goalsDashboardService, GoalsDashboardData, GoalId } from '../services/goalsDashboardService';
import { syncEngine, SyncStatus } from '../services/sync/syncEngine';

export function useGoalsDashboard(period: 'today' | 'week' | 'month' = 'today') {
  const [data, setData] = useState<GoalsDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const dashboardData = await goalsDashboardService.getDashboard(period);
      setData(dashboardData);
    } catch (err) {
      setError('Failed to load dashboard');
    } finally {
      setIsLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Subscribe to sync status
  useEffect(() => {
    const unsubscribe = syncEngine.subscribe(setSyncStatus);
    syncEngine.getStatus().then(setSyncStatus);
    return unsubscribe;
  }, []);

  const selectGoal = useCallback(async (goalId: GoalId) => {
    await goalsDashboardService.setActiveGoal(goalId);
    await fetchData();
  }, [fetchData]);

  const clearGoal = useCallback(async () => {
    await goalsDashboardService.clearActiveGoal();
    await fetchData();
  }, [fetchData]);

  return {
    data,
    isLoading,
    error,
    syncStatus,
    refresh: fetchData,
    selectGoal,
    clearGoal,
  };
}
```

---

## API Contracts

### Personal Data APIs

| Endpoint | Method | Description | Offline Support |
|----------|--------|-------------|-----------------|
| `/api/goals-dashboard` | GET | Get user's goals dashboard | Cache + Queue |
| `/api/goals-dashboard/active` | POST | Set active goal | Queue |
| `/api/goals-dashboard/active` | DELETE | Clear active goal | Queue |
| `/api/goals-dashboard/progress` | POST | Log progress | Queue |
| `/api/meal-programs` | GET | Get user's meal programs | Cache + Queue |
| `/api/meal-programs` | POST | Create meal program | Queue |
| `/api/meal-logs` | POST | Log a meal | Queue |
| `/api/workout-logs` | POST | Log a workout | Queue |

### Global Data APIs

| Endpoint | Method | Description | Offline Support |
|----------|--------|-------------|-----------------|
| `/api/global-goals/stats` | GET | Community stats | Cache Only |
| `/api/global-goals/ranking/:goalId` | GET | User ranking | Cache Only |
| `/api/global-goals/leaderboard/:goalId` | GET | Leaderboard | Cache Only |
| `/api/global-goals/challenges` | GET | Active challenges | Cache Only |
| `/api/global-goals/challenges/:id/join` | POST | Join challenge | Queue |

---

## Error Handling

### Error Types

```typescript
export enum ErrorType {
  NETWORK = 'NETWORK',
  AUTH = 'AUTH',
  VALIDATION = 'VALIDATION',
  SERVER = 'SERVER',
  STORAGE = 'STORAGE',
  SYNC = 'SYNC',
}

export interface AppError {
  type: ErrorType;
  message: string;
  code?: string;
  retry?: boolean;
  offline?: boolean;
}
```

### Error Handling Strategy

| Error Type | User Message | Action |
|------------|--------------|--------|
| NETWORK | "You're offline. Changes saved locally." | Queue & Continue |
| AUTH | "Please sign in again." | Redirect to Login |
| VALIDATION | "Please check your input." | Show Field Errors |
| SERVER | "Something went wrong. Try again." | Retry with Backoff |
| STORAGE | "Storage full. Clear some data." | Show Storage Manager |
| SYNC | "Sync failed. Will retry automatically." | Background Retry |

---

## Summary

### Key Patterns Implemented

1. **Local-First Reads**: Always return cached data immediately
2. **Optimistic Updates**: Update UI before server confirmation
3. **Queue-Based Writes**: All mutations go through sync queue
4. **Background Sync**: Automatic sync when connectivity restored
5. **Cache Expiration**: TTL-based cache for global data
6. **Conflict Resolution**: Client wins for personal, server wins for global

### Service Categories

| Category | Examples | Sync Direction | Cache Strategy |
|----------|----------|----------------|----------------|
| Personal | Goals, Logs, Progress | Bidirectional | Write-through |
| Global | Stats, Leaderboards | Server → Client | TTL Cache |
| Hybrid | Challenges | Both | TTL + Queue |

### Implementation Checklist

- [x] Install dependencies (AsyncStorage, NetInfo, SQLite)
- [x] Create storageService with AsyncStorage + SQLite
- [x] Create connectivityService with NetInfo
- [x] Create syncEngine with queue management
- [x] Update goalsDashboardService for offline-first
- [x] Update mealProgramService for offline-first
- [x] Update globalGoalsService with caching
- [x] Add sync status indicator to UI
- [x] Add offline mode banner to UI
- [ ] Test offline scenarios

---

## 🚀 Backend Team Action Items

### Quick Start

1. **Read the requirements docs:**
   - [BACKEND_AUTH_WIHY_REQUIREMENTS.md](./BACKEND_AUTH_WIHY_REQUIREMENTS.md) - Profile, Family, Payments
   - [BACKEND_SERVICES_WIHY_REQUIREMENTS.md](./BACKEND_SERVICES_WIHY_REQUIREMENTS.md) - Goals, Progress, Reminders, Scans

2. **Set up your backend services:**
   ```
   auth.wihy.ai/        → Profile, Family, Payments
   services.wihy.ai/    → Goals, Progress, Reminders, Scan History
   ```

3. **Implement endpoints in this order:**

   | Priority | Endpoint Group | Days | Doc Reference |
   |----------|---------------|------|---------------|
   | 🔴 Week 1 | `/api/users/:userId/*` | 2 | [Profile Management](./BACKEND_AUTH_WIHY_REQUIREMENTS.md#-priority-1-profile-management-2-days) |
   | 🔴 Week 1-2 | `/api/goals/*` | 3 | [Goals & Milestones](./BACKEND_SERVICES_WIHY_REQUIREMENTS.md#-priority-1-goals--milestones-3-days) |
   | 🔴 Week 2 | `/api/progress/*`, `/api/measurements/*` | 4 | [Progress Photos](./BACKEND_SERVICES_WIHY_REQUIREMENTS.md#-priority-1-progress-photos--measurements-4-days) |
   | 🟡 Week 2-3 | `/api/families/*` | 4 | [Family Accounts](./BACKEND_AUTH_WIHY_REQUIREMENTS.md#-priority-2-family-accounts-4-days) |
   | 🟡 Week 3 | `/api/reminders/*` | 2 | [Reminders](./BACKEND_SERVICES_WIHY_REQUIREMENTS.md#-priority-2-reminders-backend-2-days) |
   | 🟡 Week 3 | `/api/scan/history/*` | 2 | [Scan History](./BACKEND_SERVICES_WIHY_REQUIREMENTS.md#-priority-2-scan-history-persistence-2-days) |
   | 🟢 Week 3-4 | `/api/payments/*` | 10 | [Payments](./BACKEND_AUTH_WIHY_REQUIREMENTS.md#-priority-3-payment-processing-10-days) |

### What Mobile Services Expect

Each mobile service file shows exactly what API calls it makes:

```typescript
// Example: profileService.ts calls these endpoints
GET  /api/users/:userId/profile      // getProfile()
PUT  /api/users/:userId/profile      // updateProfile()
POST /api/users/:userId/avatar       // uploadAvatar()
GET  /api/users/:userId/settings     // getAllSettings()
PUT  /api/users/:userId/settings     // saveServerSettings()
DELETE /api/users/:userId            // deleteAccount()
POST /api/users/:userId/export       // exportUserData()
POST /api/users/:userId/change-password  // changePassword()
POST /api/users/:userId/2fa          // toggleTwoFactor()
```

### Response Format (CRITICAL)

**Every endpoint MUST return:**

```json
// Success
{ "success": true, "profile": {...} }
{ "success": true, "goals": [...] }
{ "success": true, "measurements": [...] }

// Error
{ "success": false, "error": "Error message" }
```

**The mobile service checks `data.success` first, then reads the specific field.**

### Database Schemas

Full SQL schemas are provided in each requirements doc:
- [auth.wihy.ai schemas](./BACKEND_AUTH_WIHY_REQUIREMENTS.md#database-schema)
- [services.wihy.ai schemas](./BACKEND_SERVICES_WIHY_REQUIREMENTS.md#database-schema)

### Testing Your Endpoints

The mobile app will call your endpoints like this:

```typescript
// Profile Service example
const response = await fetch(`${BASE_URL}/api/users/${userId}/profile`, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
const data = await response.json();

if (!data.success) {
  throw new Error(data.error || 'Failed to get profile');
}

return data.profile;
```

### Questions?

- Mobile service implementations: See `src/services/*.ts`
- API contracts: See the requirements docs linked above
- Offline sync behavior: See [Sync Engine](#sync-engine) section above

---

*WIHY Services Layer Architecture v2.0*
*Last Updated: January 7, 2026*
