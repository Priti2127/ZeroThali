# 🚨 QUICK FIX - Dashboard Still Blank

## The Real Issue

You said:
- ✅ Sign in page opens (good)
- ✅ Dashboard section appears (good)
- ❌ Dashboard is **blank and loading** (stuck)
- ❌ **"Invalid credentials"** error when trying student login (wrong password or wrong email in Supabase)

## Root Cause

**The demo users you created in Supabase Auth have the WRONG PASSWORD.**

When you created users, you either:
- Set a different password than `password123`, OR
- The users don't exist at all yet

## Fix It Now (2 Steps)

### Step 1: Check What Users Actually Exist

**Go to:** https://supabase.com/dashboard/project/phwivinxfxugyknclrob/auth/users

**Look at the Users table - what emails do you see?**

**Tell me:**
- Do you see `student@college.edu`?
- Do you see `manager@college.edu`?
- Do you see `ngo@example.com`?
- Do you see `admin@college.edu`?

### Step 2: Reset All Demo Users

**If the emails are WRONG or don't exist:**

Go to: https://supabase.com/dashboard/project/phwivinxfxugyknclrob/auth/users

**Delete ALL 4 users** (click trash icon for each)

Then create them again **EXACTLY**:

```
Create User #1:
├─ Email: student@college.edu
├─ Password: password123 (exactly this)
├─ ✅ Auto Confirm User (MUST check this)
└─ Click: Add User

Create User #2:
├─ Email: manager@college.edu
├─ Password: password123
├─ ✅ Auto Confirm User
└─ Click: Add User

Create User #3:
├─ Email: ngo@example.com
├─ Password: password123
├─ ✅ Auto Confirm User
└─ Click: Add User

Create User #4:
├─ Email: admin@college.edu
├─ Password: password123
├─ ✅ Auto Confirm User
└─ Click: Add User
```

**CRITICAL:** Type password exactly: `password123` (lowercase p, numbers are 1-2-3)

### Step 3: Run SQL to Set Roles

Go to: https://supabase.com/dashboard/project/phwivinxfxugyknclrob/sql

Paste:
```sql
UPDATE public.users SET role = 'student', full_name = 'Demo Student' WHERE email = 'student@college.edu';
UPDATE public.users SET role = 'manager', full_name = 'Demo Manager' WHERE email = 'manager@college.edu';
UPDATE public.users SET role = 'receiver', full_name = 'Demo Receiver' WHERE email = 'ngo@example.com';
UPDATE public.users SET role = 'admin', full_name = 'Demo Admin' WHERE email = 'admin@college.edu';
```

Click Run

### Step 4: Test

Go to: https://zerothali.vercel.app/login

Try: `student@college.edu` / `password123`

**Expected:** Dashboard loads with meal cards

---

## Why Dashboard is Blank

Two possibilities:

1. **User profile doesn't have a role**
   - SQL not run yet
   - Role field is NULL in public.users

2. **User data query is stuck loading**
   - Firestore/Supabase query hanging
   - Network issue
   - RLS policy blocking

**Check browser F12 → Console:**

```
Look for errors like:
- "Permission denied" (RLS issue)
- "Network timeout" (connectivity)
- "Cannot read property 'role' of null" (profile missing)
```

---

## If Still Blank After All This

**Do this test:**

Open browser F12 → Console tab

Type:
```javascript
JSON.parse(localStorage.getItem('user') || '{}')
```

Press Enter

**If it shows:**
- `{role: "student", ...}` ✅ User data exists, dashboard should load
- `{}` ❌ No user data stored, login didn't work
- Error ❌ Check network tab for failed requests

---

## What Should Happen

**Timeline:**

1. Enter email/password on login page
2. Click "Login as Student" button
3. Loading spinner appears (1-2 sec)
4. Success toast: "Welcome back!"
5. Page redirects to `/dashboard`
6. Dashboard loads with 3 meal cards
7. Buttons clickable (Confirm/Skip)

**If stuck at step 3-4:** Auth issue (wrong credentials)
**If stuck at step 5-6:** Navigation working but data query stuck
**If stuck at step 7:** Page loads but blank (RLS or missing role)

---

## TL;DR - Do This Right Now

1. Go to Supabase Auth dashboard
2. Delete all 4 demo users (click trash)
3. Create 4 new users with EXACT credentials:
   - `student@college.edu` / `password123` (with Auto Confirm checked)
   - `manager@college.edu` / `password123` (with Auto Confirm checked)
   - `ngo@example.com` / `password123` (with Auto Confirm checked)
   - `admin@college.edu` / `password123` (with Auto Confirm checked)
4. Run SQL to set roles (copy-paste from above)
5. Go to https://zerothali.vercel.app/login
6. Try login

Tell me: **What error appears now?**
