# 🎛️ Remrin Cockpit - User Settings Menu Implementation Guide

**Prepared for:** Remrin Cockpit (Professional Chat Interface)  
**Prepared by:** Rem 💙  
**Date:** February 16, 2026  
**Purpose:** Clone Claude.ai's user settings menu and integrate with Remrin's existing user database

---

## 🎯 Overview

We're building a user settings dropdown menu that:
1. Matches Claude.ai's design exactly (with Remrin branding)
2. Integrates with existing Remrin user database
3. Allows seamless switching between "Remrin Proper" and "Remrin Cockpit"
4. Handles authentication, billing, and user preferences

---

## 📊 Database Schema Requirements

### **Existing Tables to Connect**

You already have these tables in Remrin. We'll reuse them:

```sql
-- Users table (from Supabase Auth)
-- This already exists via auth.users

-- User profiles (extend with Cockpit preferences)
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  full_name text,
  avatar_url text,
  
  -- Remrin Proper settings
  display_name text,
  pronouns text,
  bio text,
  
  -- Cockpit-specific settings
  preferred_interface text DEFAULT 'proper', -- 'proper' or 'cockpit'
  cockpit_language text DEFAULT 'en',
  cockpit_theme text DEFAULT 'light', -- 'light' or 'dark'
  
  -- Preferences
  enable_analytics boolean DEFAULT true,
  enable_memory boolean DEFAULT true,
  enable_voice boolean DEFAULT false,
  
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

-- Subscriptions (billing integration)
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Subscription details
  tier text NOT NULL, -- 'free', 'soul_weaver', 'architect', 'titan'
  status text NOT NULL, -- 'active', 'canceled', 'past_due', 'trialing'
  
  -- Stripe integration
  stripe_customer_id text,
  stripe_subscription_id text,
  stripe_price_id text,
  
  -- Billing
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean DEFAULT false,
  
  -- Limits
  monthly_message_limit int,
  messages_used_this_month int DEFAULT 0,
  
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- Usage tracking
CREATE TABLE IF NOT EXISTS usage_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  interface text NOT NULL, -- 'proper' or 'cockpit'
  action_type text NOT NULL, -- 'message_sent', 'voice_used', 'image_generated'
  tokens_used int DEFAULT 0,
  created_at timestamptz DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_user_id ON usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_created_at ON usage_logs(created_at);
```

---

## 🎨 UI Components to Build

### **Component Hierarchy**

```
<UserMenu>
  ├── <UserMenuTrigger>
  │   ├── User Avatar
  │   ├── User Name
  │   └── Plan Badge
  │
  └── <UserMenuDropdown>
      ├── <UserMenuHeader>
      │   ├── Email
      │   └── Plan Status
      │
      ├── <UserMenuItems>
      │   ├── Settings (with modal)
      │   ├── Language Selector
      │   ├── Get Help
      │   ├── Upgrade Plan
      │   ├── Switch Interface (NEW!)
      │   ├── Learn More
      │   └── Log Out
      │
      └── <UserMenuFooter>
          └── Version Info (optional)
```

---

## 🎨 Design Specifications (Match Claude.ai)

### **User Menu Trigger Button**

```css
.user-menu-trigger {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2);
  background: transparent;
  border: none;
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: background 0.2s;
}

.user-menu-trigger:hover {
  background: var(--bg-hover);
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-full);
  background: var(--accent-gradient);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: var(--font-semibold);
  font-size: var(--text-sm);
  overflow: hidden;
}

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-name {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--text-primary);
}

.plan-badge {
  padding: var(--space-1) var(--space-2);
  background: var(--accent-pink-light);
  color: var(--brand-pink);
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  border-radius: var(--radius-sm);
  text-transform: capitalize;
}
```

---

### **User Menu Dropdown**

```css
.user-menu-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 280px;
  background: var(--bg-primary);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-xl);
  z-index: 100;
  opacity: 0;
  transform: translateY(-10px);
  pointer-events: none;
  transition: all 0.2s ease;
}

.user-menu-dropdown.open {
  opacity: 1;
  transform: translateY(0);
  pointer-events: all;
}

/* Header section */
.user-menu-header {
  padding: var(--space-4);
  border-bottom: 1px solid var(--border-light);
}

.user-menu-email {
  font-size: var(--text-sm);
  color: var(--text-primary);
  font-weight: var(--font-medium);
  margin-bottom: var(--space-1);
}

.user-menu-plan {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
}

/* Menu items */
.user-menu-items {
  padding: var(--space-2);
}

.user-menu-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3);
  background: transparent;
  border: none;
  border-radius: var(--radius-md);
  width: 100%;
  text-align: left;
  font-size: var(--text-sm);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
}

.user-menu-item:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.user-menu-item-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.user-menu-item-text {
  flex: 1;
}

.user-menu-item-shortcut {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  font-family: var(--font-mono);
}

.user-menu-item-arrow {
  width: 16px;
  height: 16px;
  opacity: 0.5;
}

/* Divider */
.user-menu-divider {
  height: 1px;
  background: var(--border-light);
  margin: var(--space-2) 0;
}

/* Special items */
.user-menu-item.logout {
  color: var(--error);
}

.user-menu-item.upgrade {
  background: var(--accent-gradient);
  color: white;
}

.user-menu-item.upgrade:hover {
  opacity: 0.9;
}

.user-menu-item.switch-interface {
  background: var(--accent-blue-light);
  color: var(--brand-blue);
  font-weight: var(--font-medium);
}
```

---

## 💻 Implementation Code

### **1. React Component Structure**

```typescript
// components/UserMenu.tsx

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { 
  Settings, 
  Globe, 
  HelpCircle, 
  Sparkles, 
  BookOpen, 
  LogOut,
  ChevronRight,
  Zap
} from 'lucide-react';

interface UserMenuProps {
  onSwitchInterface?: () => void;
}

export function UserMenu({ onSwitchInterface }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
  const { user, signOut } = useAuth();
  const { subscription, loading } = useSubscription();

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getUserInitials = (email: string) => {
    return email.charAt(0).toUpperCase();
  };

  const getPlanDisplay = (tier: string) => {
    const plans = {
      free: 'Free plan',
      soul_weaver: 'Soul Weaver',
      architect: 'Architect',
      titan: 'Titan'
    };
    return plans[tier as keyof typeof plans] || 'Free plan';
  };

  const handleSettingsClick = () => {
    setIsOpen(false);
    setShowSettings(true);
  };

  const handleSwitchInterface = () => {
    setIsOpen(false);
    if (onSwitchInterface) {
      onSwitchInterface();
    }
  };

  const handleLogout = async () => {
    await signOut();
    window.location.href = '/';
  };

  if (!user) return null;

  return (
    <>
      <div className="user-menu" ref={menuRef}>
        {/* Trigger Button */}
        <button
          className="user-menu-trigger"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-haspopup="true"
        >
          <div className="user-avatar">
            {user.user_metadata?.avatar_url ? (
              <img src={user.user_metadata.avatar_url} alt={user.email} />
            ) : (
              getUserInitials(user.email || 'U')
            )}
          </div>
          
          <div className="user-info">
            <div className="user-name">
              {user.user_metadata?.full_name || 'User'}
            </div>
            {subscription && (
              <div className="plan-badge">
                {getPlanDisplay(subscription.tier)}
              </div>
            )}
          </div>
        </button>

        {/* Dropdown Menu */}
        <div className={`user-menu-dropdown ${isOpen ? 'open' : ''}`}>
          {/* Header */}
          <div className="user-menu-header">
            <div className="user-menu-email">{user.email}</div>
            <div className="user-menu-plan">
              {subscription ? getPlanDisplay(subscription.tier) : 'Free plan'}
            </div>
          </div>

          {/* Menu Items */}
          <div className="user-menu-items">
            {/* Settings */}
            <button 
              className="user-menu-item"
              onClick={handleSettingsClick}
            >
              <Settings className="user-menu-item-icon" />
              <span className="user-menu-item-text">Settings</span>
              <span className="user-menu-item-shortcut">⌘+Ctrl+,</span>
            </button>

            {/* Language */}
            <button className="user-menu-item">
              <Globe className="user-menu-item-icon" />
              <span className="user-menu-item-text">Language</span>
              <ChevronRight className="user-menu-item-arrow" />
            </button>

            {/* Get Help */}
            <button 
              className="user-menu-item"
              onClick={() => window.open('https://help.remrin.ai', '_blank')}
            >
              <HelpCircle className="user-menu-item-icon" />
              <span className="user-menu-item-text">Get help</span>
            </button>

            <div className="user-menu-divider" />

            {/* Upgrade Plan */}
            {subscription?.tier === 'free' && (
              <button 
                className="user-menu-item upgrade"
                onClick={() => window.location.href = '/upgrade'}
              >
                <Sparkles className="user-menu-item-icon" />
                <span className="user-menu-item-text">Upgrade plan</span>
              </button>
            )}

            {/* Switch Interface (NEW!) */}
            <button 
              className="user-menu-item switch-interface"
              onClick={handleSwitchInterface}
            >
              <Zap className="user-menu-item-icon" />
              <span className="user-menu-item-text">
                {window.location.hostname.includes('cockpit') 
                  ? 'Switch to Remrin Proper' 
                  : 'Switch to Cockpit'}
              </span>
            </button>

            {/* Learn More */}
            <button 
              className="user-menu-item"
              onClick={() => window.open('https://remrin.ai/about', '_blank')}
            >
              <BookOpen className="user-menu-item-icon" />
              <span className="user-menu-item-text">Learn more</span>
              <ChevronRight className="user-menu-item-arrow" />
            </button>

            <div className="user-menu-divider" />

            {/* Log Out */}
            <button 
              className="user-menu-item logout"
              onClick={handleLogout}
            >
              <LogOut className="user-menu-item-icon" />
              <span className="user-menu-item-text">Log out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal 
          onClose={() => setShowSettings(false)} 
          user={user}
          subscription={subscription}
        />
      )}
    </>
  );
}
```

---

### **2. Settings Modal Component**

```typescript
// components/SettingsModal.tsx

import React, { useState } from 'react';
import { X, User, Bell, Lock, CreditCard, Database } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface SettingsModalProps {
  onClose: () => void;
  user: any;
  subscription: any;
}

export function SettingsModal({ onClose, user, subscription }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState({
    enable_analytics: true,
    enable_memory: true,
    enable_voice: false,
    theme: 'light',
    language: 'en'
  });

  const tabs = [
    { id: 'general', label: 'General', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy & Data', icon: Lock },
    { id: 'billing', label: 'Billing', icon: CreditCard },
    { id: 'memory', label: 'Memory', icon: Database }
  ];

  const handleSave = async () => {
    // Update user settings in database
    const { error } = await supabase
      .from('user_profiles')
      .update(settings)
      .eq('id', user.id);

    if (!error) {
      alert('Settings saved!');
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <h2>Settings</h2>
          <button className="modal-close" onClick={onClose}>
            <X />
          </button>
        </div>

        {/* Content */}
        <div className="modal-content">
          {/* Sidebar Tabs */}
          <div className="settings-sidebar">
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`settings-tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <tab.icon size={18} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="settings-content">
            {activeTab === 'general' && (
              <GeneralSettings settings={settings} setSettings={setSettings} />
            )}
            {activeTab === 'notifications' && (
              <NotificationSettings settings={settings} setSettings={setSettings} />
            )}
            {activeTab === 'privacy' && (
              <PrivacySettings settings={settings} setSettings={setSettings} />
            )}
            {activeTab === 'billing' && (
              <BillingSettings subscription={subscription} />
            )}
            {activeTab === 'memory' && (
              <MemorySettings user={user} />
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSave}>Save changes</button>
        </div>
      </div>
    </div>
  );
}
```

---

### **3. Custom Hooks for Data Management**

```typescript
// hooks/useAuth.ts

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return { user, loading, signOut };
}
```

```typescript
// hooks/useSubscription.ts

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';

interface Subscription {
  tier: string;
  status: string;
  current_period_end: string;
  monthly_message_limit: number;
  messages_used_this_month: number;
}

export function useSubscription() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    async function fetchSubscription() {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!error && data) {
        setSubscription(data);
      }
      setLoading(false);
    }

    fetchSubscription();
  }, [user]);

  return { subscription, loading };
}
```

---

### **4. Interface Switching Logic**

```typescript
// utils/interfaceSwitcher.ts

export function switchToProper() {
  // Save current state
  localStorage.setItem('return_from_cockpit', 'true');
  
  // Redirect to Remrin Proper
  window.location.href = 'https://remrin.ai/chat';
}

export function switchToCockpit() {
  // Save current state
  localStorage.setItem('return_from_proper', 'true');
  
  // Redirect to Remrin Cockpit
  window.location.href = 'https://cockpit.remrin.ai';
}

export function getPreferredInterface(userId: string): Promise<string> {
  return supabase
    .from('user_profiles')
    .select('preferred_interface')
    .eq('id', userId)
    .single()
    .then(({ data }) => data?.preferred_interface || 'proper');
}

export async function setPreferredInterface(
  userId: string, 
  interface: 'proper' | 'cockpit'
) {
  await supabase
    .from('user_profiles')
    .update({ preferred_interface: interface })
    .eq('id', userId);
}
```

---

## 🔌 API Endpoints Needed

### **1. Update User Settings**

```typescript
// app/api/user/settings/route.ts

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function PATCH(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const settings = await request.json();

  const { error } = await supabase
    .from('user_profiles')
    .update(settings)
    .eq('id', user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
```

---

### **2. Get Subscription Details**

```typescript
// app/api/subscription/route.ts

export async function GET(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: subscription, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(subscription);
}
```

---

### **3. Track Usage**

```typescript
// app/api/usage/track/route.ts

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { interface, action_type, tokens_used } = await request.json();

  // Log usage
  await supabase.from('usage_logs').insert({
    user_id: user.id,
    interface,
    action_type,
    tokens_used
  });

  // Increment monthly counter
  await supabase.rpc('increment_message_count', { uid: user.id });

  return NextResponse.json({ success: true });
}
```

---

## 📋 Implementation Checklist for AI Agents

### **Phase 1: Database Setup (30 minutes)**

```
TASK: Set up database tables for user settings and subscriptions

REQUIREMENTS:
1. Create user_profiles table if it doesn't exist
2. Add columns: preferred_interface, cockpit_language, cockpit_theme
3. Create subscriptions table with Stripe integration fields
4. Create usage_logs table for tracking
5. Add all necessary indexes

SQL TO RUN:
[Copy the SQL from "Database Schema Requirements" section above]

VERIFICATION:
- Run: SELECT * FROM user_profiles LIMIT 1;
- Run: SELECT * FROM subscriptions LIMIT 1;
- Verify all columns exist
```

---

### **Phase 2: UserMenu Component (60 minutes)**

```
TASK: Build the UserMenu dropdown component matching Claude.ai design

REQUIREMENTS:
1. Create UserMenu.tsx component with trigger button
2. Implement dropdown menu with all items:
   - Settings (opens modal)
   - Language (with submenu)
   - Get help (external link)
   - Upgrade plan (if free tier)
   - Switch interface (NEW - toggles between Proper/Cockpit)
   - Learn more (external link)
   - Log out (signs out user)

3. Style EXACTLY like Claude.ai:
   - Dark background overlay
   - White dropdown with shadow
   - Hover states on all items
   - Icons on left, text in middle, arrows/shortcuts on right
   - Gradient background for upgrade button
   - Blue background for switch interface

4. Add keyboard shortcuts:
   - Cmd+Ctrl+, for Settings
   - Escape to close menu

5. Integrate with existing auth system:
   - Import useAuth hook
   - Display user email and avatar
   - Show current subscription tier
   - Handle logout

FILES TO CREATE:
- components/UserMenu.tsx
- components/UserMenu.css (or use Tailwind)

DESIGN REFERENCE:
[Copy all CSS from "Design Specifications" section above]
```

---

### **Phase 3: Settings Modal (90 minutes)**

```
TASK: Build comprehensive settings modal with tabs

REQUIREMENTS:
1. Create SettingsModal.tsx with 5 tabs:
   Tab 1 - General:
     - Full name
     - Display name
     - Email (read-only)
     - Avatar upload
     - Theme (light/dark)
     - Language selector
   
   Tab 2 - Notifications:
     - Email notifications toggle
     - Push notifications toggle
     - Memory reminders toggle
     - Weekly summary toggle
   
   Tab 3 - Privacy & Data:
     - Enable analytics toggle
     - Enable memory toggle
     - Data export button
     - Delete account button (with confirmation)
   
   Tab 4 - Billing:
     - Current plan display
     - Usage stats (messages this month)
     - Upgrade/downgrade buttons
     - Payment method (Stripe integration)
     - Billing history
   
   Tab 5 - Memory:
     - Total memories stored
     - Memory search functionality
     - View all memories
     - Clear specific memories
     - Export memories

2. Modal design:
   - Full-screen overlay with blur
   - Centered modal (800px wide, 600px tall)
   - Left sidebar with tabs
   - Right content area
   - Footer with Cancel/Save buttons

3. Data persistence:
   - Load current settings on mount
   - Save changes to user_profiles table
   - Show loading states
   - Show success/error messages

FILES TO CREATE:
- components/SettingsModal.tsx
- components/settings/GeneralSettings.tsx
- components/settings/NotificationSettings.tsx
- components/settings/PrivacySettings.tsx
- components/settings/BillingSettings.tsx
- components/settings/MemorySettings.tsx

API CALLS NEEDED:
- GET /api/user/settings - fetch current settings
- PATCH /api/user/settings - update settings
- GET /api/subscription - fetch billing info
- GET /api/memory/stats - fetch memory statistics
```

---

### **Phase 4: Custom Hooks (30 minutes)**

```
TASK: Create React hooks for data management

REQUIREMENTS:
1. useAuth hook:
   - Get current user from Supabase
   - Listen for auth state changes
   - Provide signOut function
   - Return loading state

2. useSubscription hook:
   - Fetch user's subscription from database
   - Auto-refresh when user changes
   - Return subscription tier, status, limits
   - Return loading state

3. useSettings hook:
   - Fetch user settings from database
   - Provide update function
   - Cache settings in memory
   - Return loading state

FILES TO CREATE:
- hooks/useAuth.ts
- hooks/useSubscription.ts
- hooks/useSettings.ts

CODE REFERENCE:
[Copy hook implementations from "Custom Hooks" section above]
```

---

### **Phase 5: Interface Switching (45 minutes)**

```
TASK: Implement seamless switching between Proper and Cockpit

REQUIREMENTS:
1. Create interfaceSwitcher.ts utility:
   - switchToProper() function
   - switchToCockpit() function
   - getPreferredInterface() function
   - setPreferredInterface() function

2. Add "Switch Interface" button to UserMenu:
   - Show "Switch to Cockpit" when on remrin.ai
   - Show "Switch to Proper" when on cockpit.remrin.ai
   - On click:
     a. Save current interface preference to database
     b. Save current scroll position/state
     c. Redirect to other interface
     d. Restore state on arrival

3. Add interface detection:
   - Detect if user is on cockpit.remrin.ai or remrin.ai
   - Auto-redirect based on user's preferred_interface setting
   - Allow manual override via URL parameter (?interface=cockpit)

4. Preserve authentication:
   - Both interfaces share same Supabase project
   - User stays logged in across switch
   - Session cookies work on both domains

IMPLEMENTATION:
- Add to next.config.js:
  domains: ['remrin.ai', 'cockpit.remrin.ai']
  
- Add middleware to detect and redirect:
  if (user.preferred_interface !== currentInterface) {
    redirect to preferred interface
  }

FILES TO CREATE:
- utils/interfaceSwitcher.ts
- middleware.ts (for auto-redirect)
```

---

### **Phase 6: Billing Integration (60 minutes)**

```
TASK: Connect Stripe billing to settings

REQUIREMENTS:
1. Display current subscription:
   - Tier name (Free, Soul Weaver, Architect, Titan)
   - Status (Active, Canceled, Past Due)
   - Current period end date
   - Monthly message limit
   - Messages used this month

2. Usage display:
   - Progress bar showing messages used / limit
   - Warning if close to limit (90%+)
   - Prompt to upgrade if at limit

3. Upgrade/downgrade buttons:
   - Show "Upgrade" button if on Free
   - Show "Manage subscription" for paid users
   - Redirect to Stripe billing portal

4. Payment method:
   - Show last 4 digits of card
   - Show expiration date
   - "Update payment method" button → Stripe

5. Billing history:
   - List last 12 invoices
   - Amount, date, status
   - Download invoice button

API CALLS NEEDED:
- GET /api/stripe/subscription - current subscription
- POST /api/stripe/create-checkout - upgrade flow
- GET /api/stripe/billing-portal - manage subscription
- GET /api/stripe/invoices - billing history

FILES TO CREATE:
- components/settings/BillingSettings.tsx
- app/api/stripe/subscription/route.ts
- app/api/stripe/billing-portal/route.ts
```

---

### **Phase 7: Testing & Polish (30 minutes)**

```
TASK: Test all functionality and polish UX

CHECKLIST:
□ UserMenu opens/closes correctly
□ All menu items have correct icons
□ Hover states work on all buttons
□ Settings modal opens from menu
□ All 5 tabs in settings work
□ Settings save to database correctly
□ Interface switching works (Proper ↔ Cockpit)
□ User stays logged in after switch
□ Subscription tier displays correctly
□ Usage stats are accurate
□ Upgrade button works
□ Logout works
□ Mobile responsive (menu, modal)
□ Keyboard shortcuts work (Cmd+Ctrl+,, Escape)
□ Loading states show appropriately
□ Error messages display for failures
□ Success messages confirm saves

POLISH:
- Add smooth transitions (0.2s ease)
- Add loading spinners where needed
- Add confirmation dialogs for destructive actions
- Add tooltips for unclear items
- Test on Chrome, Safari, Firefox
- Test on mobile (iOS, Android)
```

---

## 🎨 Complete CSS Stylesheet

```css
/* UserMenu.css */

/* Menu trigger */
.user-menu {
  position: relative;
}

.user-menu-trigger {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  background: transparent;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: background 0.2s;
}

.user-menu-trigger:hover {
  background: var(--bg-hover);
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #de5ba7 0%, #236ce1 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 14px;
  overflow: hidden;
}

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
}

.user-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

.plan-badge {
  padding: 2px 8px;
  background: rgba(222, 91, 167, 0.1);
  color: #de5ba7;
  font-size: 11px;
  font-weight: 600;
  border-radius: 6px;
  text-transform: capitalize;
}

/* Dropdown */
.user-menu-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 280px;
  background: white;
  border: 1px solid #e5e5e5;
  border-radius: 16px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  z-index: 100;
  opacity: 0;
  transform: translateY(-10px);
  pointer-events: none;
  transition: all 0.2s ease;
}

.user-menu-dropdown.open {
  opacity: 1;
  transform: translateY(0);
  pointer-events: all;
}

/* Header */
.user-menu-header {
  padding: 16px;
  border-bottom: 1px solid #e5e5e5;
}

.user-menu-email {
  font-size: 14px;
  color: #1f1f1f;
  font-weight: 500;
  margin-bottom: 4px;
}

.user-menu-plan {
  font-size: 12px;
  color: #9b9b9b;
}

/* Menu items */
.user-menu-items {
  padding: 8px;
}

.user-menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: transparent;
  border: none;
  border-radius: 8px;
  width: 100%;
  text-align: left;
  font-size: 14px;
  color: #6b6b6b;
  cursor: pointer;
  transition: all 0.2s;
}

.user-menu-item:hover {
  background: #f0f0f0;
  color: #1f1f1f;
}

.user-menu-item-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.user-menu-item-text {
  flex: 1;
}

.user-menu-item-shortcut {
  font-size: 11px;
  color: #9b9b9b;
  font-family: ui-monospace, monospace;
}

.user-menu-item-arrow {
  width: 16px;
  height: 16px;
  opacity: 0.5;
}

/* Divider */
.user-menu-divider {
  height: 1px;
  background: #e5e5e5;
  margin: 8px 0;
}

/* Special items */
.user-menu-item.logout {
  color: #dc2626;
}

.user-menu-item.logout:hover {
  background: rgba(220, 38, 38, 0.1);
}

.user-menu-item.upgrade {
  background: linear-gradient(135deg, #de5ba7 0%, #236ce1 100%);
  color: white;
  font-weight: 500;
}

.user-menu-item.upgrade:hover {
  opacity: 0.9;
}

.user-menu-item.switch-interface {
  background: rgba(35, 108, 225, 0.1);
  color: #236ce1;
  font-weight: 500;
}

.user-menu-item.switch-interface:hover {
  background: rgba(35, 108, 225, 0.2);
}

/* Settings Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-container {
  width: 90%;
  max-width: 900px;
  height: 90%;
  max-height: 700px;
  background: white;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px;
  border-bottom: 1px solid #e5e5e5;
}

.modal-header h2 {
  font-size: 24px;
  font-weight: 600;
  color: #1f1f1f;
}

.modal-close {
  width: 32px;
  height: 32px;
  background: transparent;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.modal-close:hover {
  background: #f0f0f0;
}

.modal-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.settings-sidebar {
  width: 200px;
  background: #f9fafb;
  border-right: 1px solid #e5e5e5;
  padding: 16px;
  overflow-y: auto;
}

.settings-tab {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: transparent;
  border: none;
  border-radius: 8px;
  width: 100%;
  text-align: left;
  font-size: 14px;
  color: #6b6b6b;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 4px;
}

.settings-tab:hover {
  background: white;
  color: #1f1f1f;
}

.settings-tab.active {
  background: white;
  color: #de5ba7;
  font-weight: 500;
}

.settings-content {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  padding: 24px;
  border-top: 1px solid #e5e5e5;
}

.btn-secondary {
  padding: 12px 24px;
  background: #f5f5f5;
  border: 1px solid #e5e5e5;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background: #e5e5e5;
}

.btn-primary {
  padding: 12px 24px;
  background: linear-gradient(135deg, #de5ba7 0%, #236ce1 100%);
  border: none;
  border-radius: 12px;
  color: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.2s;
}

.btn-primary:hover {
  opacity: 0.9;
}
```

---

## 🚀 Deployment Checklist

```
PRE-DEPLOYMENT:
□ All database tables created
□ Database indexes added
□ Environment variables set (STRIPE_SECRET_KEY, etc.)
□ Supabase RLS policies configured
□ CORS settings allow both domains

TESTING:
□ Test on remrin.ai
□ Test on cockpit.remrin.ai
□ Test interface switching
□ Test settings save
□ Test billing flow
□ Test on mobile
□ Test logout

POST-DEPLOYMENT:
□ Monitor error logs
□ Check database queries performance
□ Verify Stripe webhooks working
□ Test with real users
□ Collect feedback
```

---

## 💙 Final Notes for AI Agents

**Critical Success Factors:**

1. **Visual Match**: The menu must look EXACTLY like Claude.ai's
2. **Data Integration**: Must connect to existing Remrin database
3. **Interface Switching**: Seamless toggle between Proper/Cockpit
4. **Billing Integration**: Must work with Stripe subscriptions
5. **Mobile Responsive**: Must work perfectly on mobile

**Most Important Components:**

1. UserMenu dropdown (this is what user sees first)
2. Settings modal (most complex, needs all 5 tabs)
3. Interface switching (unique to Remrin)
4. Billing display (connects to revenue)

**Common Pitfalls to Avoid:**

❌ Not matching Claude's design pixel-perfect  
❌ Breaking existing auth system  
❌ Not handling loading states  
❌ Forgetting mobile responsiveness  
❌ Not preserving user session across switch  

**Success Criteria:**

✅ Looks identical to Claude.ai's menu  
✅ All settings save correctly  
✅ Interface switching works seamlessly  
✅ Billing info displays accurately  
✅ Works on mobile  

Now go build it! 💙✨

---

**Prepared with precision by Rem 💙**  
*"The details make the design."*
