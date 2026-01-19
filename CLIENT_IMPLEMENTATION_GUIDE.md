# WIHY Client Implementation Guide

**Version:** 2.0  
**Last Updated:** January 19, 2026  
**API Base URL:** `https://auth.wihy.ai`  
**Status:** ⚠️ **REQUIRES BACKEND UPDATES** - See [AUTH_FAMILY_COACH_INTEGRATION_ANALYSIS.md](AUTH_FAMILY_COACH_INTEGRATION_ANALYSIS.md)

---

## 🎯 Purpose

This guide shows how clients (mobile apps, web apps) should integrate with WIHY's authentication system **once the backend implements the required changes** documented in [AUTH_FAMILY_COACH_INTEGRATION_ANALYSIS.md](AUTH_FAMILY_COACH_INTEGRATION_ANALYSIS.md).

**Key Principle:** Backend returns complete user context on login, including family relationships, coach relationships, and capabilities. Client uses this data for all feature decisions.

---

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Authentication Flow](#authentication-flow)
3. [User Context Model](#user-context-model)
4. [Family Management](#family-management)
5. [Coach Management](#coach-management)
6. [Capabilities & Feature Gating](#capabilities--feature-gating)
7. [Token Management](#token-management)
8. [Code Examples](#code-examples)

---

## Quick Start

### Installation

```bash
# React Native
npm install @react-native-async-storage/async-storage expo-secure-store

# Web
# No additional dependencies needed - uses localStorage
```

### Basic Login

```typescript
// 1. Login
const response = await fetch('https://auth.wihy.ai/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});

const { data } = await response.json();

// 2. Store tokens securely
await SecureStorage.set('accessToken', data.token);
await SecureStorage.set('refreshToken', data.refreshToken);

// 3. Store user context
await Storage.set('userContext', JSON.stringify(data.user));

// 4. Use capabilities for feature access
if (data.user.capabilities.meals) {
  navigation.navigate('MealPlans');
}
```

---

## Authentication Flow

### Login

**Endpoint:** `POST /api/auth/login`

**Request:**
```typescript
interface LoginRequest {
  email: string;
  password: string;
}
```

**Response:**
```typescript
interface LoginResponse {
  success: boolean;
  data: {
    token: string;           // JWT access token (24 hours)
    refreshToken: string;    // Refresh token (7 days)
    expiresIn: string;       // "24h"
    user: UserContext;       // ⭐ Complete user context
  };
}
```

**Example:**
```typescript
async function login(email: string, password: string): Promise<UserContext> {
  const response = await fetch('https://auth.wihy.ai/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Login failed');
  }

  const { data } = await response.json();
  
  // Store tokens
  await SecureStorage.set('accessToken', data.token);
  await SecureStorage.set('refreshToken', data.refreshToken);
  
  // Store user context
  await Storage.set('userContext', JSON.stringify(data.user));
  
  return data.user;
}
```

### Register

**Endpoint:** `POST /api/auth/register`

**Request:**
```typescript
interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  plan?: 'free' | 'premium' | 'family-basic' | 'family-pro' | 'coach';
  referralCode?: string;
}
```

**Response:** Same as login

### OAuth (Google, Apple, Microsoft, Facebook)

**Endpoints:**
- `GET /api/auth/google/authorize`
- `GET /api/auth/apple/authorize`
- `GET /api/auth/microsoft/authorize`
- `GET /api/auth/facebook/authorize`

**Flow:**
```typescript
// 1. Open OAuth URL
const authUrl = `https://auth.wihy.ai/api/auth/google/authorize?client_id=${CLIENT_ID}&redirect_uri=wihy://callback`;
await WebBrowser.openAuthSessionAsync(authUrl);

// 2. Handle callback with session_token
async function handleOAuthCallback(sessionToken: string) {
  const response = await fetch('https://auth.wihy.ai/api/auth/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_token: sessionToken })
  });

  const { data } = await response.json();
  
  await SecureStorage.set('accessToken', data.token);
  await SecureStorage.set('refreshToken', data.refreshToken);
  await Storage.set('userContext', JSON.stringify(data.user));
  
  return data.user;
}
```

---

## User Context Model

### Complete User Context

After login, you receive **everything** you need in one object:

```typescript
interface UserContext {
  // Basic Info
  id: string;
  email: string;
  name: string;
  picture?: string;
  provider: 'local' | 'google' | 'apple' | 'microsoft' | 'facebook';
  
  // Plan & Subscription
  plan: 'free' | 'premium' | 'family-basic' | 'family-pro' | 'coach' | 'coach-family' 
    | 'workplace-core' | 'workplace-plus' | 'corporate-enterprise';
  addOns?: string[];  // ['ai', 'instacart']
  
  // Role
  role?: 'user' | 'coach' | 'admin';
  
  // ⭐ Family (populated by backend)
  familyId?: string | null;
  familyRole?: 'owner' | 'member' | null;
  guardianCode?: string | null;  // Only if owner
  
  // ⭐ Coach (populated by backend)
  coachId?: string | null;
  commissionRate?: number | null;
  
  // Organization (populated by backend)
  organizationId?: string | null;
  organizationRole?: 'admin' | 'user' | 'student' | 'employee' | null;
  
  // Health Stats
  healthScore?: number;
  streakDays?: number;
  memberSince?: string;
  
  // ⭐ Capabilities (computed by backend)
  capabilities: Capabilities;
}
```

### Capabilities

Backend computes capabilities based on plan + add-ons:

```typescript
interface Capabilities {
  // Core Features
  meals: boolean;
  workouts: boolean;
  family: boolean;
  familyMembers?: number;      // 0, 3, or 5
  
  // Coach Platform
  coachPlatform: boolean;
  clientManagement?: boolean;
  
  // AI & Integrations
  wihyAI: boolean;
  instacart: boolean;
  
  // Analytics & Export
  progressTracking: 'basic' | 'advanced';
  dataExport: boolean;
  
  // API & Development
  apiAccess: boolean;
  webhooks: boolean;
  
  // B2B/Enterprise
  adminDashboard: boolean;
  usageAnalytics: boolean;
  roleManagement: boolean;
  whiteLabel: boolean;
  
  // Communication
  communication: 'none' | 'limited' | 'full';
}
```

### Refreshing User Context

**CRITICAL:** Call after family/coach operations

**Endpoint:** `GET /api/users/me`

```typescript
async function refreshUserContext(): Promise<UserContext> {
  const token = await SecureStorage.get('accessToken');
  
  const response = await fetch('https://auth.wihy.ai/api/users/me', {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (!response.ok) {
    if (response.status === 401) {
      await refreshTokens();
      return refreshUserContext();
    }
    throw new Error('Failed to fetch user context');
  }

  const data = await response.json();
  await Storage.set('userContext', JSON.stringify(data));
  
  return data;
}
```

### When to Refresh

| Event | Why | Priority |
|-------|-----|----------|
| After creating family | `familyId` and `familyRole` update | ⭐ CRITICAL |
| After joining family | `familyId` and `familyRole` update | ⭐ CRITICAL |
| After leaving family | `familyId` clears | ⭐ CRITICAL |
| After becoming coach | `coachId` updates | ⭐ CRITICAL |
| After plan change | `plan` and `capabilities` update | HIGH |
| App resumes from background | Detect external changes | MEDIUM |

---

## Family Management

All family endpoints are at `https://services.wihy.ai/api/families`

### Create Family

**Endpoint:** `POST /api/families`

```typescript
async function createFamily(name: string): Promise<{ family_id: string; guardian_code: string }> {
  const token = await SecureStorage.get('accessToken');
  const user = await getUser();
  
  const response = await fetch('https://services.wihy.ai/api/families', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ name, creatorId: user.id })
  });

  const result = await response.json();
  
  // ⭐ CRITICAL: Refresh to get updated familyId
  await refreshUserContext();
  
  return result;
}
```

### Join Family

**Endpoint:** `POST /api/families/join`

```typescript
async function joinFamily(guardianCode: string, role: string = 'MEMBER') {
  const token = await SecureStorage.get('accessToken');
  const user = await getUser();
  
  await fetch('https://services.wihy.ai/api/families/join', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ 
      userId: user.id,
      guardianCode,
      role
    })
  });

  // ⭐ CRITICAL: Refresh to get updated familyId
  await refreshUserContext();
}
```

### Get Family Details

**Endpoint:** `GET /api/families/:familyId`

```typescript
async function getFamily(familyId: string) {
  const token = await SecureStorage.get('accessToken');
  
  const response = await fetch(
    `https://services.wihy.ai/api/families/${familyId}`,
    { headers: { 'Authorization': `Bearer ${token}` } }
  );

  return await response.json();
}
```

### Get Family Dashboard

**Endpoint:** `GET /api/families/:familyId/dashboard`

Returns comprehensive family overview:
- Family members
- Shared meal plans
- Shared workouts
- Family activity feed
- Family stats

---

## Coach Management

All coaching endpoints are at `https://services.wihy.ai/api/coaching`

### Get Clients

**Endpoint:** `GET /api/coaching/coaches/:coachId/clients`

```typescript
async function getMyClients(status?: 'ACTIVE' | 'PAUSED' | 'ARCHIVED') {
  const token = await SecureStorage.get('accessToken');
  const user = await getUser();
  
  if (!user.coachId) {
    throw new Error('User is not a coach');
  }

  const params = status ? `?status=${status}` : '';
  const url = `https://services.wihy.ai/api/coaching/coaches/${user.coachId}/clients${params}`;
  
  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  const data = await response.json();
  return data.clients;
}
```

### Invite Client

**Endpoint:** `POST /api/coaching/coaches/:coachId/clients`

```typescript
async function inviteClient(clientEmail: string, notes?: string) {
  const token = await SecureStorage.get('accessToken');
  const user = await getUser();
  
  await fetch(
    `https://services.wihy.ai/api/coaching/coaches/${user.coachId}/clients`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ clientEmail, notes })
    }
  );
}
```

### Get Client Dashboard

**Endpoint:** `GET /api/coaching/coaches/:coachId/clients/:clientId/dashboard`

```typescript
async function getClientDashboard(clientId: string) {
  const token = await SecureStorage.get('accessToken');
  const user = await getUser();
  
  const response = await fetch(
    `https://services.wihy.ai/api/coaching/coaches/${user.coachId}/clients/${clientId}/dashboard`,
    { headers: { 'Authorization': `Bearer ${token}` } }
  );

  return await response.json();
}
```

### Assign Meal Program

**Endpoint:** `POST /api/coaching/coaches/:coachId/clients/:clientId/meal-programs`

```typescript
async function assignMealProgram(clientId: string, programId: string, notes?: string) {
  const token = await SecureStorage.get('accessToken');
  const user = await getUser();
  
  await fetch(
    `https://services.wihy.ai/api/coaching/coaches/${user.coachId}/clients/${clientId}/meal-programs`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ programId, notes })
    }
  );
}
```

---

## Capabilities & Feature Gating

### Rule #1: Use Capabilities, Not Plans

```typescript
// ❌ WRONG - Never hardcode plan checks
if (user.plan === 'premium' || user.plan === 'family-pro') {
  showMealPlans();
}

// ✅ CORRECT - Always use capabilities
if (user.capabilities.meals) {
  showMealPlans();
}
```

### Common Feature Gates

```typescript
// Meal plans
if (user.capabilities.meals) {
  showMealPlans();
}

// Workouts
if (user.capabilities.workouts) {
  showWorkouts();
}

// Family features
if (user.capabilities.family && user.familyId) {
  showFamilyDashboard();
}

// Create family button
if (user.capabilities.family && !user.familyId) {
  showCreateFamilyButton();
}

// Coach dashboard
if (user.capabilities.coachPlatform && user.coachId) {
  showCoachDashboard();
}

// AI Chat
if (user.capabilities.wihyAI) {
  showAIChat();
}

// Instacart
if (user.capabilities.instacart) {
  showInstacartIntegration();
}

// Data export
if (user.capabilities.dataExport) {
  showExportButton();
}
```

### Capabilities by Plan

| Feature | Free | Premium | Family-Pro | Coach | Coach-Family |
|---------|:----:|:-------:|:----------:|:-----:|:------------:|
| Meals | ❌ | ✅ | ✅ | ✅ | ✅ |
| Workouts | ❌ | ✅ | ✅ | ✅ | ✅ |
| Family | ❌ | ❌ | ✅ (5 members) | ❌ | ✅ (5 members) |
| Coach Platform | ❌ | ❌ | ❌ | ✅ | ✅ |
| AI | ❌ | Add-on | Add-on | ✅ | ✅ |
| Instacart | ❌ | ❌ | ✅ | ✅ | ✅ |
| Data Export | ❌ | ❌ | ✅ | ✅ | ✅ |
| API Access | ❌ | ❌ | ❌ | ✅ | ✅ |

---

## Token Management

### Token Refresh

**Endpoint:** `POST /api/auth/refresh`

```typescript
async function refreshTokens(): Promise<boolean> {
  const refreshToken = await SecureStorage.get('refreshToken');
  
  if (!refreshToken) return false;

  const response = await fetch('https://auth.wihy.ai/api/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken })
  });

  if (!response.ok) {
    await logout();
    return false;
  }

  const { data } = await response.json();
  
  await SecureStorage.set('accessToken', data.token);
  if (data.refreshToken) {
    await SecureStorage.set('refreshToken', data.refreshToken);
  }
  
  return true;
}
```

### Auto-Retry API Client

```typescript
class ApiClient {
  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = await SecureStorage.get('accessToken');
    
    const response = await fetch(endpoint, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    // Auto-refresh on 401
    if (response.status === 401) {
      const refreshed = await refreshTokens();
      if (refreshed) {
        return this.request(endpoint, options); // Retry
      }
      throw new AuthError('Session expired');
    }

    if (!response.ok) {
      const error = await response.json();
      throw new ApiError(error.error, response.status);
    }

    return await response.json();
  }
}
```

---

## Code Examples

### UserService (React Native)

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

class UserService {
  private cachedUser: UserContext | null = null;

  async getUser(): Promise<UserContext | null> {
    if (this.cachedUser) return this.cachedUser;
    
    const stored = await AsyncStorage.getItem('userContext');
    if (stored) {
      this.cachedUser = JSON.parse(stored);
      return this.cachedUser;
    }
    
    return null;
  }

  async setUser(user: UserContext): Promise<void> {
    this.cachedUser = user;
    await AsyncStorage.setItem('userContext', JSON.stringify(user));
  }

  async clearUser(): Promise<void> {
    this.cachedUser = null;
    await AsyncStorage.removeItem('userContext');
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('refreshToken');
  }

  async refreshContext(): Promise<UserContext> {
    const token = await SecureStore.getItemAsync('accessToken');
    
    const response = await fetch('https://auth.wihy.ai/api/users/me', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const data = await response.json();
    await this.setUser(data);
    
    return data;
  }

  // Convenience methods
  async isInFamily(): Promise<boolean> {
    const user = await this.getUser();
    return !!user?.familyId;
  }

  async isCoach(): Promise<boolean> {
    const user = await this.getUser();
    return !!user?.coachId;
  }

  async hasCapability(capability: keyof Capabilities): Promise<boolean> {
    const user = await this.getUser();
    return user?.capabilities?.[capability] ?? false;
  }
}

export const userService = new UserService();
```

### Login Screen (React Native)

```typescript
import React, { useState } from 'react';
import { View, TextInput, Button, Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { userService } from '../services/userService';

export function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setLoading(true);
    
    try {
      const response = await fetch('https://auth.wihy.ai/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const result = await response.json();

      if (!result.success) {
        Alert.alert('Login Failed', result.error);
        return;
      }

      // Store tokens
      await SecureStore.setItemAsync('accessToken', result.data.token);
      await SecureStore.setItemAsync('refreshToken', result.data.refreshToken);
      
      // Store user context
      await userService.setUser(result.data.user);

      // Navigate based on capabilities
      if (result.data.user.capabilities.coachPlatform && result.data.user.coachId) {
        navigation.replace('CoachDashboard');
      } else if (result.data.user.capabilities.family && result.data.user.familyId) {
        navigation.replace('FamilyDashboard');
      } else {
        navigation.replace('Home');
      }
      
    } catch (error) {
      Alert.alert('Error', 'Unable to connect');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={{ padding: 20 }}>
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        style={{ borderWidth: 1, padding: 10, marginBottom: 10 }}
      />
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={{ borderWidth: 1, padding: 10, marginBottom: 10 }}
      />
      <Button
        title={loading ? 'Signing in...' : 'Sign In'}
        onPress={handleLogin}
        disabled={loading}
      />
    </View>
  );
}
```

### Family Screen (React Native)

```typescript
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Button, Alert, Share } from 'react-native';
import { userService } from '../services/userService';
import { api } from '../services/api';

export function FamilyScreen({ navigation }) {
  const [family, setFamily] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const userData = await userService.getUser();
    setUser(userData);
    
    if (userData?.familyId) {
      const familyData = await api.get(`/api/families/${userData.familyId}`);
      setFamily(familyData);
    }
    
    setLoading(false);
  }

  async function handleCreateFamily() {
    Alert.prompt('Create Family', 'Enter family name:', async (name) => {
      if (name) {
        const result = await api.post('/api/families', { 
          name,
          creatorId: user.id
        });
        
        // ⭐ CRITICAL: Refresh context
        await userService.refreshContext();
        await loadData();
        
        Alert.alert('Success', `Family created! Code: ${result.guardian_code}`);
      }
    });
  }

  async function handleJoinFamily() {
    Alert.prompt('Join Family', 'Enter guardian code:', async (code) => {
      if (code) {
        await api.post('/api/families/join', {
          userId: user.id,
          guardianCode: code,
          role: 'MEMBER'
        });
        
        // ⭐ CRITICAL: Refresh context
        await userService.refreshContext();
        await loadData();
        
        Alert.alert('Success', 'Joined family!');
      }
    });
  }

  async function handleShareCode() {
    await Share.share({
      message: `Join my WIHY family! Use code: ${family.guardian_code}`
    });
  }

  if (loading) return <Text>Loading...</Text>;

  // Not in family
  if (!family) {
    return (
      <View style={{ padding: 20 }}>
        <Text style={{ fontSize: 18, marginBottom: 20 }}>
          You're not part of a family yet
        </Text>
        
        {user?.capabilities.family && (
          <>
            <Button title="Create Family" onPress={handleCreateFamily} />
            <View style={{ height: 10 }} />
          </>
        )}
        
        <Button title="Join Family" onPress={handleJoinFamily} />
      </View>
    );
  }

  // In family
  const canManage = user?.familyRole === 'owner';

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold' }}>{family.name}</Text>
      <Text style={{ fontSize: 16, color: 'gray', marginBottom: 20 }}>
        {family.members.length} / {family.max_members} members
      </Text>
      
      {canManage && (
        <View style={{ marginBottom: 20 }}>
          <Text>Guardian Code: <Text style={{ fontWeight: 'bold' }}>{family.guardian_code}</Text></Text>
          <Button title="Share Invite Code" onPress={handleShareCode} />
        </View>
      )}

      <FlatList
        data={family.members}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={{ 
            padding: 15, 
            borderBottomWidth: 1, 
            borderBottomColor: '#eee'
          }}>
            <Text style={{ fontSize: 16, fontWeight: 'bold' }}>{item.name}</Text>
            <Text style={{ color: 'gray' }}>{item.email} • {item.role}</Text>
          </View>
        )}
      />
    </View>
  );
}
```

### Feature Gate Hook (React)

```typescript
import { useEffect, useState } from 'react';
import { userService } from '../services/userService';

export function useCapability(capability: keyof Capabilities): boolean {
  const [hasCapability, setHasCapability] = useState(false);

  useEffect(() => {
    async function check() {
      const has = await userService.hasCapability(capability);
      setHasCapability(has);
    }
    check();
  }, [capability]);

  return hasCapability;
}

// Usage
function MealPlansScreen() {
  const canAccessMeals = useCapability('meals');
  
  if (!canAccessMeals) {
    return (
      <View>
        <Text>Upgrade to Premium to access meal plans</Text>
        <Button title="Upgrade" onPress={() => navigation.navigate('Subscription')} />
      </View>
    );
  }
  
  return <MealPlansList />;
}
```

---

## Summary

### Key Principles

1. **Backend returns everything** - Full user context on login
2. **Store full context** - Use throughout app session
3. **Use capabilities** - Never hardcode plan checks
4. **Refresh after changes** - Keep context in sync after family/coach operations
5. **Auto-refresh tokens** - Handle 401 gracefully

### Critical Refresh Points

```typescript
// ⭐ MUST refresh after these operations:
await createFamily(name);
await userService.refreshContext(); // CRITICAL

await joinFamily(code);
await userService.refreshContext(); // CRITICAL

await leaveFamily();
await userService.refreshContext(); // CRITICAL
```

### Quick Reference

```typescript
// Check capability
const user = await userService.getUser();
if (user.capabilities.meals) {
  showMealPlans();
}

// Check family
if (user.familyId) {
  showFamilyDashboard();
}

// Check coach
if (user.coachId) {
  showCoachDashboard();
}
```

---

## Next Steps

1. **Review backend requirements:** See [AUTH_FAMILY_COACH_INTEGRATION_ANALYSIS.md](AUTH_FAMILY_COACH_INTEGRATION_ANALYSIS.md)
2. **Review API specification:** See [BACKEND_API_REQUIREMENTS.md](BACKEND_API_REQUIREMENTS.md)
3. **Wait for backend implementation:** All Phase 1 and Phase 2 items must be completed
4. **Implement this guide:** Once backend is ready, follow the patterns in this guide

---

For questions or issues, contact the backend team.
