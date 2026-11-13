# ZeroThali - Complete Project Architecture & Flow

**Last Updated:** 2026-11-13  
**Status:** 65% Complete, Functional

---

## 📊 PROJECT OVERVIEW DIAGRAM

```
┌─────────────────────────────────────────────────────────────────────┐
│                          ZEROTHALI SYSTEM                            │
│              Food Waste Management for College Hostel Mess           │
└─────────────────────────────────────────────────────────────────────┘

                              ┌──────────┐
                              │  USERS   │
                              └────┬─────┘
                                   │
                    ┌──────────────┼──────────────┐
                    │              │              │
              ┌─────▼─────┐  ┌────▼────┐  ┌─────▼─────┐
              │  STUDENT  │  │ MANAGER │  │ RECEIVER  │
              │  (300+)   │  │  (5-10) │  │  (20-30)  │
              └─────┬─────┘  └────┬────┘  └─────┬─────┘
                    │             │             │
                    │             │             │
         ┌──────────▼─────────────▼─────────────▼──────────┐
         │          REACT FRONTEND (PWA)                    │
         │  Vite + TypeScript + Tailwind CSS               │
         │  Mobile-First, Dark Mode, Realtime Updates      │
         └──────────────────┬──────────────────────────────┘
                            │
                            │ Supabase Client
                            │ (Auth + Realtime)
                            │
         ┌──────────────────▼──────────────────────────────┐
         │          SUPABASE BACKEND                        │
         │                                                  │
         │  ┌────────────────────────────────────────┐     │
         │  │  PostgreSQL Database                   │     │
         │  │  - 10 Tables + RLS Policies            │     │
         │  │  - 8 Functions                         │     │
         │  │  - 5 Cron Jobs (Automated Tasks)       │     │
         │  └────────────────────────────────────────┘     │
         │                                                  │
         │  ┌────────────────────────────────────────┐     │
         │  │  Supabase Auth                         │     │
         │  │  - Email/Password                      │     │
         │  │  - Role-Based Access (RLS)             │     │
         │  └────────────────────────────────────────┘     │
         │                                                  │
         │  ┌────────────────────────────────────────┐     │
         │  │  Realtime Subscriptions                │     │
         │  │  - Live leftover alerts                │     │
         │  │  - Order status updates                │     │
         │  │  - Confirmation counts                 │     │
         │  └────────────────────────────────────────┘     │
         │                                                  │
         └──────────────────────────────────────────────────┘
                            │
                            │ Deployment
                            │
         ┌──────────────────▼──────────────────────────────┐
         │          VERCEL (Hosting)                        │
         │  - Auto-deploy from GitHub                       │
         │  - CDN + Edge Network                            │
         │  - Environment Variables                         │
         └──────────────────────────────────────────────────┘
                            │
                            │
                   ┌────────▼────────┐
                   │   END USERS     │
                   │  Mobile + Web   │
                   └─────────────────┘
```

---

## 🎭 USER ROLES & PERMISSIONS

```
┌─────────────────────────────────────────────────────────────┐
│                        USER ROLES                            │
└─────────────────────────────────────────────────────────────┘

┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   STUDENT    │     │   MANAGER    │     │   RECEIVER   │     │    ADMIN     │
├──────────────┤     ├──────────────┤     ├──────────────┤     ├──────────────┤
│              │     │              │     │              │     │              │
│ ✓ View meals │     │ ✓ All student│     │ ✓ View left- │     │ ✓ View all   │
│              │     │   data       │     │   overs only │     │   stats      │
│ ✓ Confirm or │     │              │     │              │     │              │
│   skip meals │     │ ✓ Create/edit│     │ ✓ Place      │     │ ✓ User       │
│              │     │   meals      │     │   orders     │     │   management │
│ ✓ Submit     │     │              │     │              │     │              │
│   feedback   │     │ ✓ Log walk-  │     │ ✓ Max 3/week │     │ ✓ Waste      │
│              │     │   ins        │     │              │     │   trends     │
│ ✓ Can view   │     │              │     │ ✓ Max 2      │     │              │
│   menu       │     │ ✓ Enter      │     │   plates/    │     │ ✓ System     │
│              │     │   wastage    │     │   order      │     │   health     │
│ ✗ Cannot see │     │              │     │              │     │              │
│   leftovers  │     │ ✓ Publish    │     │ ✓ View own   │     │ ✓ Export     │
│              │     │   leftovers  │     │   orders     │     │   reports    │
│              │     │              │     │              │     │              │
│              │     │ ✓ Verify     │     │ ✗ Cannot see │     │              │
│              │     │   pickups    │     │   meal       │     │              │
│              │     │              │     │   schedule   │     │              │
│              │     │ ✓ Dashboard  │     │              │     │              │
│              │     │   analytics  │     │              │     │              │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
```

---

## 🔄 CORE WORKFLOWS

### 1️⃣ MEAL CONFIRMATION FLOW (Students)

```
┌─────────────────────────────────────────────────────────────────┐
│              MEAL CONFIRMATION WORKFLOW                          │
└─────────────────────────────────────────────────────────────────┘

START
  │
  ▼
┌────────────────┐
│ Student Login  │
└────────┬───────┘
         │
         ▼
┌─────────────────────┐
│ View Today's Meals  │
│ - Breakfast 07:30   │
│ - Lunch 11:00       │
│ - Dinner 16:00      │
└────────┬────────────┘
         │
         ▼
┌──────────────────────┐      YES     ┌─────────────────┐
│ Before Cutoff Time?  ├─────────────►│ Show "Confirm"  │
└────────┬─────────────┘              │ & "Skip" buttons│
         │ NO                          └────────┬────────┘
         │                                      │
         ▼                                      ▼
┌──────────────────┐              ┌────────────────────────┐
│ Show "Locked"    │              │ Student Clicks Button  │
│ Message          │              └────────┬───────────────┘
└──────────────────┘                       │
                                           ▼
                              ┌─────────────────────────┐
                              │ Update Confirmations    │
                              │ Table in Database       │
                              └────────┬────────────────┘
                                       │
                                       ▼
                              ┌─────────────────────────┐
                              │ Realtime Update to      │
                              │ Manager Dashboard       │
                              └────────┬────────────────┘
                                       │
                                       ▼
                    ┌──────────────────────────────────┐
                    │ Cron Job Runs at Cutoff Time     │
                    │ (7:30 AM, 11:00 AM, 4:00 PM)     │
                    │ Calls: lock_meal_cutoff_today()  │
                    └──────────────┬───────────────────┘
                                   │
                                   ▼
                    ┌──────────────────────────────────┐
                    │ Set is_cutoff_locked = TRUE      │
                    │ Students can no longer change    │
                    └──────────────────────────────────┘
                                   │
                                   ▼
                                  END
```

---

### 2️⃣ LEFTOVER ORDER FLOW (Receivers + Anti-Dependency)

```
┌─────────────────────────────────────────────────────────────────┐
│           LEFTOVER ORDER WORKFLOW (WITH ATOMIC LOCK)            │
└─────────────────────────────────────────────────────────────────┘

                    MANAGER SIDE
                         │
                         ▼
        ┌────────────────────────────┐
        │ Meal Finished              │
        │ Manager enters leftover_kg │
        └────────────┬───────────────┘
                     │
                     ▼
        ┌────────────────────────────┐
        │ Manager decides to publish │
        │ surplus food alert         │
        └────────────┬───────────────┘
                     │
                     ▼
        ┌────────────────────────────┐
        │ Check: High surplus        │
        │ yesterday too?             │
        └────┬───────────────┬───────┘
             │ YES           │ NO
             ▼               ▼
    ┌─────────────┐   ┌──────────────┐
    │ Show warning│   │ Continue     │
    │ "Reduce qty"│   └──────┬───────┘
    └─────────────┘          │
                             ▼
            ┌────────────────────────────────┐
            │ Create Leftover Alert          │
            │ - meal_id                      │
            │ - quantity_plates              │
            │ - available_plates             │
            │ - price_per_plate              │
            │ - expires_at (now + 1 hour)    │
            └────────────┬───────────────────┘
                         │
                         │
                    RECEIVER SIDE
                         │
                         ▼
        ┌────────────────────────────────┐
        │ Receiver opens dashboard       │
        │ (No schedule visible)          │
        └────────────┬───────────────────┘
                     │
                     ▼
        ┌────────────────────────────────┐
        │ Sees leftover alert            │
        │ "5 plates available, ₹10 each" │
        │ "Only N plates left!" (live)   │
        └────────────┬───────────────────┘
                     │
                     ▼
        ┌────────────────────────────────┐
        │ Clicks "Order 2 plates"        │
        └────────────┬───────────────────┘
                     │
                     ▼
        ┌────────────────────────────────────────────┐
        │ Validation Checks:                         │
        │ 1. Weekly limit? (max 3 orders)            │
        │ 2. Order limit? (max 2 plates)             │
        │ 3. Cooldown? (1 hour since last order)     │
        └────────────┬───────────────────────────────┘
                     │ PASS
                     ▼
        ┌────────────────────────────────────────────┐
        │ Call: place_leftover_order()               │
        │ (Atomic function with row lock)            │
        │                                            │
        │  BEGIN TRANSACTION                         │
        │    SELECT ... FROM leftovers               │
        │    WHERE id = leftover_id                  │
        │    FOR UPDATE;  ← LOCKS ROW               │
        │                                            │
        │    IF available_plates >= quantity THEN    │
        │      UPDATE leftovers                      │
        │      SET available_plates -= quantity      │
        │                                            │
        │      INSERT INTO orders (...)              │
        │      COMMIT                                │
        │    ELSE                                    │
        │      ROLLBACK                              │
        │      RETURN error                          │
        │    END IF                                  │
        │  END TRANSACTION                           │
        └────────────┬───────────────────────────────┘
                     │
                     ▼
        ┌────────────────────────────────┐
        │ Generate Pickup Code           │
        │ (6-char random: XF8K2P)        │
        └────────────┬───────────────────┘
                     │
                     ▼
        ┌────────────────────────────────┐
        │ Show Payment Screen            │
        │ (TODO: Razorpay/UPI)           │
        └────────────┬───────────────────┘
                     │
                     ▼
        ┌────────────────────────────────┐
        │ Payment Complete               │
        │ Set order.status = 'paid'      │
        └────────────┬───────────────────┘
                     │
                     ▼
        ┌────────────────────────────────┐
        │ Display Pickup Code            │
        │ "Show this to manager"         │
        │ Expires in 30 minutes          │
        └────────────┬───────────────────┘
                     │
                     │
        ┌────────────▼───────────────────┐
        │ Cron Job runs every 5 minutes  │
        │ Calls: expire_old_orders()     │
        └────────────┬───────────────────┘
                     │
                     ▼
        ┌────────────────────────────────┐
        │ If expires_at < now:           │
        │ - Set status = 'expired'       │
        │ - Return plates to pool        │
        │ - Update available_plates      │
        └────────────────────────────────┘
                     │
                     ▼
                 PICKUP TIME
                     │
                     ▼
        ┌────────────────────────────────┐
        │ Receiver shows pickup code     │
        │ to Manager                     │
        └────────────┬───────────────────┘
                     │
                     ▼
        ┌────────────────────────────────┐
        │ Manager enters code            │
        │ Calls: collect_order(code)     │
        └────────────┬───────────────────┘
                     │
                     ▼
        ┌────────────────────────────────┐
        │ Verify code & payment          │
        │ Set order.status = 'collected' │
        └────────────┬───────────────────┘
                     │
                     ▼
                    END

NOTE: If 2 receivers try to order the last plate at the
same time, the FOR UPDATE lock ensures only ONE succeeds!
```

---

## 🗄️ DATABASE SCHEMA

### Tables & Relationships

```
┌──────────────────────────────────────────────────────────────┐
│                    DATABASE STRUCTURE                         │
└──────────────────────────────────────────────────────────────┘

┌─────────────┐
│   USERS     │
├─────────────┤
│ id (PK)     │◄──────────────┐
│ email       │               │
│ full_name   │               │
│ role        │               │
│ hostel_name │               │
│ room_number │               │
│ weekly_count│               │
└─────────────┘               │
       │                      │
       │ owns                 │
       │                      │
       ▼                      │
┌──────────────┐              │
│ CONFIRMATIONS│              │
├──────────────┤              │
│ id (PK)      │              │
│ user_id (FK) │──────────────┘
│ meal_id (FK) │──────┐
│ status       │      │
└──────────────┘      │
                      │
                      │
       ┌──────────────▼──────┐
       │      MEALS          │
       ├─────────────────────┤
       │ id (PK)             │
       │ date                │
       │ type (enum)         │◄──────────────┐
       │ cutoff_time         │               │
       │ is_cutoff_locked    │               │
       │ menu (JSONB)        │               │
       │ cooked_kg           │               │
       │ leftover_kg         │               │
       │ predicted_walkins   │               │
       └─────────────────────┘               │
                │                            │
                │                            │
                ▼                            │
       ┌──────────────┐                     │
       │   WALKINS    │                     │
       ├──────────────┤                     │
       │ id (PK)      │                     │
       │ meal_id (FK) │─────────────────────┘
       │ count        │
       │ logged_at    │
       └──────────────┘
                │
                │
                ▼
       ┌──────────────┐
       │  FEEDBACK    │
       ├──────────────┤
       │ id (PK)      │
       │ user_id (FK) │
       │ meal_id (FK) │
       │ rating (1-5) │
       │ tags []      │
       │ comment      │
       └──────────────┘
                │
                │
                ▼
       ┌──────────────┐
       │  LEFTOVERS   │
       ├──────────────┤
       │ id (PK)      │
       │ meal_id (FK) │──────────┐
       │ quantity     │          │
       │ available    │          │
       │ price        │          │
       │ status       │          │
       │ expires_at   │          │
       └──────────────┘          │
                │                │
                │ has            │
                │                │
                ▼                │
       ┌──────────────┐          │
       │   ORDERS     │          │
       ├──────────────┤          │
       │ id (PK)      │          │
       │ leftover_id  │──────────┘
       │ receiver_id  │
       │ quantity     │
       │ pickup_code  │
       │ status       │
       │ payment_id   │
       │ expires_at   │
       └──────────────┘

┌──────────────┐
│   DISHES     │  (Master table)
├──────────────┤
│ id (PK)      │
│ name         │
│ category     │
│ avg_wastage  │
│ avg_rating   │
│ times_served │
└──────────────┘

┌──────────────┐
│  AUDIT_LOG   │
├──────────────┤
│ id (PK)      │
│ user_id      │
│ action       │
│ table_name   │
│ old_data     │
│ new_data     │
└──────────────┘
```

---

## ⚙️ BACKEND FUNCTIONS

### PostgreSQL Functions (Supabase)

```
┌──────────────────────────────────────────────────────────┐
│              POSTGRESQL FUNCTIONS                         │
└──────────────────────────────────────────────────────────┘

1. lock_meal_cutoff_today(meal_type)
   ─────────────────────────────────
   Input: 'breakfast' | 'lunch' | 'dinner'
   Action: Set is_cutoff_locked = TRUE for today's meal
   Called by: Cron job at cutoff times

2. expire_old_orders()
   ───────────────────
   Input: None
   Action: Find orders where expires_at < now()
           Set status = 'expired'
           Return plates to leftovers.available_plates
   Called by: Cron job every 5 minutes

3. place_leftover_order(leftover_id, receiver_id, quantity)
   ──────────────────────────────────────────────────────
   Input: UUID, UUID, integer
   Action: ATOMIC transaction with row lock
           - Check weekly limit
           - Check order limit (max 2 plates)
           - Lock leftover row (FOR UPDATE)
           - Verify availability
           - Reduce available_plates
           - Create order with pickup code
           - Update receiver stats
   Returns: {success, order_id, pickup_code, expires_at}
   
   CRITICAL: This function prevents race conditions!

4. collect_order(pickup_code, manager_id)
   ────────────────────────────────────
   Input: string, UUID
   Action: Verify code exists
           Check status = 'paid'
           Set status = 'collected'
   Returns: {success, message}

5. reset_weekly_order_counts()
   ──────────────────────────
   Input: None
   Action: Set weekly_order_count = 0 for all receivers
   Called by: Cron job every Monday 00:00

6. get_predicted_walkins(meal_type, date)
   ──────────────────────────────────────
   Input: 'breakfast' | 'lunch' | 'dinner', date
   Action: Weighted moving average of last 6 same-weekday
           same-meal records
   Returns: integer (predicted count)

7. get_manager_stats(date)
   ──────────────────────
   Input: date (default: today)
   Returns: JSONB with:
     - confirmed, skipped, unconfirmed counts
     - predicted_walkins
     - total_expected
     - recent_wastage_kg
     - recent_feedback_avg
     - leftover_revenue

8. get_admin_stats()
   ────────────────
   Input: None
   Returns: JSONB with:
     - total_users by role
     - total_meals_served
     - total_wastage_kg
     - wastage_trend_percent
     - meals_saved
     - avg_rating
```

---

## ⏰ CRON JOBS (Automated Tasks)

```
┌──────────────────────────────────────────────────────────┐
│                    CRON SCHEDULE                          │
└──────────────────────────────────────────────────────────┘

Job Name            Schedule        Action
────────────────────────────────────────────────────────────
lock-breakfast      30 7 * * *      Lock breakfast confirmation
                    (7:30 AM daily)  at cutoff time

lock-lunch          0 11 * * *      Lock lunch confirmation
                    (11:00 AM daily) at cutoff time

lock-dinner         0 16 * * *      Lock dinner confirmation
                    (4:00 PM daily)  at cutoff time

expire-orders       */5 * * * *     Expire old orders and
                    (Every 5 min)    return plates to pool

reset-weekly-       0 0 * * 1       Reset receiver order
orders              (Mon 00:00)      counts to 0


CRON FORMAT: minute hour day month weekday
* * * * *
│ │ │ │ │
│ │ │ │ └─── Day of week (0-7, Sun=0 or 7)
│ │ │ └───── Month (1-12)
│ │ └─────── Day of month (1-31)
│ └───────── Hour (0-23)
└─────────── Minute (0-59)
```

---

## 🎨 FRONTEND ARCHITECTURE

### React Component Tree

```
┌──────────────────────────────────────────────────────────┐
│                  REACT COMPONENT TREE                     │
└──────────────────────────────────────────────────────────┘

App.tsx (Root)
│
├─ BrowserRouter
│  ├─ Navbar (if authenticated)
│  │
│  └─ Routes
│     │
│     ├─ / → Landing.tsx (Public)
│     │
│     ├─ /login → Login.tsx (Public)
│     │
│     ├─ /signup → Signup.tsx (Public)
│     │
│     ├─ /dashboard → DashboardRouter (Protected)
│     │              └─ Routes by role:
│     │                 ├─ student → StudentDashboard.tsx
│     │                 ├─ manager → ManagerDashboard.tsx
│     │                 ├─ receiver → ReceiverDashboard.tsx
│     │                 └─ admin → AdminDashboard.tsx
│     │
│     ├─ /meals → MealConfirmation.tsx (Student only)
│     │
│     ├─ /feedback → Feedback.tsx (Student only)
│     │
│     ├─ /leftovers → Leftovers.tsx (Manager only)
│     │
│     ├─ /alerts → ReceiverDashboard.tsx (Receiver only)
│     │
│     ├─ /orders → MyOrders.tsx (Receiver only)
│     │
│     └─ * → NotFound.tsx


SHARED COMPONENTS:
──────────────────
components/
├─ Navbar.tsx (Navigation bar with role-based links)
├─ ProtectedRoute.tsx (HOC for role checking)
├─ LoadingSpinner.tsx
├─ Button.tsx
├─ Card.tsx
└─ Tag.tsx


CUSTOM HOOKS:
─────────────
hooks/
├─ useAuth.ts (Manages user session & role)
├─ useMeals.ts (Fetch & subscribe to meals)
├─ useConfirmations.ts (Meal confirmations CRUD)
├─ useLeftovers.ts (Leftover alerts & orders)
└─ useRealtime.ts (Supabase realtime subscriptions)


SERVICES:
─────────
services/
└─ supabase.ts (Supabase client initialization)


TYPES:
──────
types/index.ts
├─ User, Meal, Confirmation, Leftover, Order
├─ Feedback, Dish, Walkin
└─ Enums (UserRole, MealType, OrderStatus, etc.)
```

---

## 🎨 TECH STACK DETAILS

### Frontend Technologies

```
┌──────────────────────────────────────────────────────────┐
│                  FRONTEND STACK                           │
└──────────────────────────────────────────────────────────┘

📦 CORE FRAMEWORK
─────────────────
React 18.3.1
├─ Why: Virtual DOM, component reusability, huge ecosystem
├─ Usage: All UI components, state management
└─ Features: Hooks, Context API, Suspense

TypeScript 5.6.2
├─ Why: Type safety, better IDE support, fewer runtime errors
├─ Usage: All .tsx and .ts files
└─ Features: Interfaces, Enums, Generic types

Vite 5.4.8
├─ Why: Lightning-fast HMR, optimized builds
├─ Usage: Dev server, production builds
└─ Features: Tree-shaking, code splitting


🎨 STYLING & UI
───────────────
Tailwind CSS 3.4.13
├─ Why: Utility-first, mobile-first, dark mode built-in
├─ Usage: All component styling
└─ Custom colors:
    - primary: #14342B (deep green)
    - saffron: #F2A413 (saffron yellow)
    - brick: #B5543A (terracotta red)
    - light: #EEF3EF (off-white)

Lucide React 0.441.0
├─ Why: Clean, consistent icons
├─ Usage: All icons (Users, TrendingDown, Package, etc.)
└─ Features: 1000+ icons, tree-shakeable

Sonner 1.7.4
├─ Why: Beautiful toast notifications
├─ Usage: Success/error messages
└─ Features: Dark mode support, animations


📊 DATA VISUALIZATION
─────────────────────
Recharts 2.12.7
├─ Why: React-native charts, responsive
├─ Usage: Wastage charts, trend analysis
└─ Components: LineChart, BarChart, ResponsiveContainer


🛣️ ROUTING
───────────
React Router DOM 6.26.2
├─ Why: Client-side routing, nested routes
├─ Usage: All page navigation
└─ Features: Protected routes, redirects, lazy loading


📅 DATE HANDLING
────────────────
date-fns 3.6.0
├─ Why: Lightweight, functional, immutable
├─ Usage: Date formatting, calculations
└─ Functions: format(), addDays(), isBefore()


🔐 BACKEND & DATABASE
─────────────────────
Supabase JS 2.45.4
├─ Why: Backend-as-a-service, realtime, auth, storage
├─ Usage: All database operations, auth, realtime
└─ Features: PostgreSQL, Row Level Security, Realtime subscriptions


📱 PWA SUPPORT
──────────────
Vite Plugin PWA 0.20.5
├─ Why: Offline support, installable app
├─ Usage: Service worker, manifest generation
└─ Features: Offline caching, home screen install
```

---

### Backend Technologies

```
┌──────────────────────────────────────────────────────────┐
│                  BACKEND STACK                            │
└──────────────────────────────────────────────────────────┘

🗄️ DATABASE
───────────
PostgreSQL 15+ (Supabase)
├─ Why: ACID compliance, JSONB, full-text search
├─ Usage: All data storage
└─ Features: 
    ├─ 10 tables with foreign keys
    ├─ Row Level Security (RLS)
    ├─ Triggers for auto-updates
    └─ Full-text search on dishes


🔐 AUTHENTICATION
─────────────────
Supabase Auth
├─ Why: Built-in JWT, social logins, MFA support
├─ Usage: User signup, login, session management
└─ Features:
    ├─ Email/password auth
    ├─ JWT tokens (auto-refresh)
    ├─ Role-based access
    └─ Password reset


⚡ REALTIME
───────────
Supabase Realtime
├─ Why: WebSocket-based, automatic subscriptions
├─ Usage: Live updates for leftovers, orders, confirmations
└─ Features:
    ├─ postgres_changes events
    ├─ Row-level subscriptions
    └─ Automatic reconnection


⏰ CRON JOBS
────────────
pg_cron (PostgreSQL extension)
├─ Why: Native SQL, server-side, reliable
├─ Usage: Auto-lock meals, expire orders, weekly resets
└─ Features:
    ├─ Standard cron syntax
    ├─ Job history tracking
    └─ Manual triggers


🔧 FUNCTIONS
────────────
PL/pgSQL (PostgreSQL)
├─ Why: Server-side logic, atomic transactions
├─ Usage: Complex business logic
└─ Features:
    ├─ Atomic order placement (FOR UPDATE)
    ├─ Statistical calculations
    ├─ Data aggregation
    └─ Row-level locking
```

---

## 🚀 DEPLOYMENT ARCHITECTURE

```
┌──────────────────────────────────────────────────────────┐
│              DEPLOYMENT FLOW                              │
└──────────────────────────────────────────────────────────┘

Developer
   │
   │ git push
   ▼
┌─────────────┐
│   GitHub    │
│  Repository │
└──────┬──────┘
       │
       │ Webhook
       ▼
┌─────────────┐
│   Vercel    │
│  (Auto)     │
├─────────────┤
│ 1. Clone    │
│ 2. Install  │──► npm ci
│ 3. Build    │──► npm run build (Vite)
│ 4. Deploy   │──► CDN distribution
└──────┬──────┘
       │
       │ HTTPS
       ▼
┌──────────────────┐
│  Vercel Edge     │
│  Network (CDN)   │
└──────┬───────────┘
       │
       │ Serve
       ▼
┌──────────────────┐
│   End Users      │
│ (Browser/Mobile) │
└──────┬───────────┘
       │
       │ API Calls
       ▼
┌──────────────────┐
│   Supabase       │
│  (Database +     │
│   Auth + RT)     │
└──────────────────┘


ENVIRONMENT VARIABLES (Vercel):
────────────────────────────────
Production:
├─ VITE_SUPABASE_URL
├─ VITE_SUPABASE_ANON_KEY
└─ (Future: VITE_RAZORPAY_KEY_ID)

Preview:
└─ Same as production (can be different)

Development:
└─ Loaded from .env file locally
```

---

## 🔒 SECURITY ARCHITECTURE

```
┌──────────────────────────────────────────────────────────┐
│              SECURITY LAYERS                              │
└──────────────────────────────────────────────────────────┘

1️⃣ ROW LEVEL SECURITY (RLS)
────────────────────────────
Every table has policies:

Example: LEFTOVERS table
┌────────────────────────────────────────┐
│ Policy: Receivers can read leftovers  │
├────────────────────────────────────────┤
│ USING (                                │
│   EXISTS (                             │
│     SELECT 1 FROM users                │
│     WHERE id = auth.uid()              │
│     AND role IN ('receiver',           │
│                  'manager', 'admin')   │
│   )                                    │
│ )                                      │
└────────────────────────────────────────┘

Result: Students CANNOT see leftovers table
        Receivers CAN see only available leftovers
        Managers CAN see all leftovers


2️⃣ AUTHENTICATION
──────────────────
JWT Tokens (Supabase Auth)
├─ Access token (short-lived, 1 hour)
├─ Refresh token (long-lived, 30 days)
└─ Stored in localStorage (auto-managed)

auth.uid() = Current user's ID
├─ Used in all RLS policies
├─ Automatically injected by Supabase
└─ Cannot be spoofed


3️⃣ API SECURITY
────────────────
Supabase Anon Key (Public)
├─ Safe to expose in frontend
├─ Row Level Security enforces permissions
└─ Rate-limited by Supabase

Service Role Key (Private)
├─ NEVER exposed to frontend
├─ Bypasses RLS (admin operations)
└─ Only used in Edge Functions (if any)


4️⃣ ATOMIC TRANSACTIONS
───────────────────────
place_leftover_order() function:

BEGIN TRANSACTION
  SELECT ... FOR UPDATE;  ← LOCKS ROW
  -- No other transaction can read/write
  -- this leftover until we COMMIT
  
  IF available > 0 THEN
    UPDATE ... 
    INSERT ...
    COMMIT  ← Release lock
  ELSE
    ROLLBACK
  END IF
END TRANSACTION

Result: Race conditions IMPOSSIBLE


5️⃣ INPUT VALIDATION
────────────────────
Frontend:
├─ TypeScript types
├─ Form validation
└─ Min/max constraints

Backend:
├─ CHECK constraints on columns
├─ Foreign key constraints
└─ Function parameter validation


6️⃣ ANTI-DEPENDENCY MEASURES
─────────────────────────────
├─ No meal schedule visible to receivers
├─ No advance booking
├─ Random alert delays (0-5 min)
├─ Weekly order limits (max 3/week)
├─ Per-order limits (max 2 plates)
└─ Manager warnings (high surplus detection)
```

---

## 📈 DATA FLOW EXAMPLES

### Example 1: Student Confirms Breakfast

```
1. Student clicks "I will eat" button
   └─► React: onClick handler fires

2. Frontend calls updateConfirmation(meal_id, 'confirmed')
   └─► Hook: useConfirmations.ts

3. Supabase client sends request
   └─► supabase.from('confirmations').upsert(...)

4. PostgreSQL checks RLS policy
   └─► "Is auth.uid() = user_id?" YES → Allow

5. Database inserts/updates record
   └─► confirmations table

6. Database triggers update
   └─► updated_at = now()

7. Supabase Realtime broadcasts change
   └─► All subscribed clients notified

8. Manager dashboard receives update
   └─► Confirmed count increments instantly

9. Frontend shows toast notification
   └─► "✅ Confirmed! See you at the mess."
```

---

### Example 2: Two Receivers Order Last Plate

```
RECEIVER A (Browser 1)          RECEIVER B (Browser 2)
       │                               │
       │ Click "Order" (t=0)           │
       ▼                               │
Call place_leftover_order()            │
       │                               │
BEGIN TRANSACTION                      │
       │                               │
SELECT ... FOR UPDATE  ◄───────────────┤ WAIT (Row locked)
       │ GOT LOCK                      │
       │                               │
available_plates = 1? YES              │
       │                               │
UPDATE available_plates = 0            │
       │                               │
INSERT order (SUCCESS)                 │
       │                               │
COMMIT (t=0.05s)                       │ WAIT ends
       │                               │
       │                               ▼
       │                    BEGIN TRANSACTION
       │                               │
       │                    SELECT ... FOR UPDATE
       │                               │
       │                    available_plates = 0? NO
       │                               │
       │                    ROLLBACK
       │                               │
       │                    RETURN error
       │                               │
       ▼                               ▼
Success! Shows pickup code    Error: "Not enough plates"
```

**Key Point:** `FOR UPDATE` lock ensures only ONE transaction succeeds!

---

## 🎯 WHAT'S NEXT? (Your Action Items)

Based on our setup, here's what remains:

### ✅ COMPLETED TODAY:
1. ✅ Created comprehensive documentation
2. ✅ Created cron jobs migration
3. ✅ Ran cron jobs in Supabase
4. ✅ Verified 5 cron jobs are active

### 🔥 CRITICAL NEXT STEPS:

#### 1. Test Atomic Order Placement (1 hour)
```sql
-- In Supabase SQL Editor, create test leftover:
INSERT INTO public.leftovers (meal_id, quantity_plates, available_plates, price_per_plate, status, expires_at)
SELECT m.id, 1, 1, 10.00, 'available', now() + interval '1 hour'
FROM public.meals m
WHERE m.date = current_date AND m.type = 'lunch'
LIMIT 1;
```

Then:
- Open 2 browsers
- Login as 2 different receivers
- Both click "Order" simultaneously
- Verify only ONE succeeds

#### 2. Add Payment Integration (2-3 hours)

**Option A: Razorpay**
```bash
npm install razorpay
```
Add to `.env`:
```
VITE_RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXX
```

**Option B: UPI Link (Simpler)**
```typescript
const upiLink = `upi://pay?pa=yourUPI@bank&pn=ZeroThali&am=${amount}&cu=INR&tn=Order%20${orderId}`;
```

#### 3. Test on Mobile (1 hour)
- Open https://zerothali.vercel.app/ on phone
- Use mobile data (not WiFi)
- Test full flow
- Install as PWA

#### 4. Deploy Final Version
```bash
git add .
git commit -m "feat: complete ZeroThali - all features working"
git push origin main
```

---

## 📚 DOCUMENTATION FILES

You now have these files:
1. **PROGRESS.md** - Detailed audit (DONE/PARTIAL/TODO)
2. **DEPLOYMENT_GUIDE.md** - Step-by-step setup
3. **CHECKLIST.md** - Printable action items
4. **README_FINAL.md** - Executive summary
5. **PROJECT_ARCHITECTURE.md** - This file (architecture & flows)
6. **test_queries.sql** - SQL testing queries

---

## 🎓 KEY LEARNINGS FROM THIS PROJECT

### What Makes This Project Special:

1. **Atomic Transactions**: `FOR UPDATE` prevents race conditions
2. **Row Level Security**: Database-level authorization
3. **Realtime Updates**: WebSocket-based live data
4. **Cron Jobs**: Automated server-side tasks
5. **Anti-Dependency Design**: Prevents system gaming
6. **Mobile-First PWA**: Installable, works offline
7. **Type Safety**: TypeScript + PostgreSQL types
8. **Clean Architecture**: Separation of concerns

---

## 💡 TIPS FOR UNDERSTANDING THE CODE

### Where to Start Reading:
1. `src/types/index.ts` - Understand data structures
2. `supabase/schema-complete.sql` - Database design
3. `src/hooks/useAuth.ts` - How auth works
4. `src/pages/MealConfirmation.tsx` - Student flow
5. `src/pages/Leftovers.tsx` - Manager flow
6. `src/pages/ReceiverDashboard.tsx` - Receiver flow

### Key Files to Master:
- **Authentication**: `src/hooks/useAuth.ts`
- **Realtime**: `src/hooks/useRealtime.ts`
- **Order Placement**: `supabase/schema-complete.sql` (place_leftover_order function)
- **Cron Jobs**: `supabase/migrations/001_cron_jobs.sql`

---

**End of Architecture Document**

Want me to explain any specific part in more detail?
