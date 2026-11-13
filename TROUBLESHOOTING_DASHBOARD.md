# 🔧 ZeroThali Dashboard Troubleshooting Flowchart

## Problem: "Dashboard redirects back to login page"

```
START: Click "Login as Student" Button
  │
  ├─→ Loading spinner appears?
  │   ├─→ YES: Good, waiting for response
  │   └─→ NO: Browser console error? (See Section A)
  │
  ├─→ Success message toast appears?
  │   ├─→ YES: Login worked, check redirect
  │   └─→ NO: Error message? (See Section B)
  │
  ├─→ Redirects to /dashboard?
  │   ├─→ YES: Check if page loads
  │   └─→ NO: Page stuck on /login (See Section C)
  │
  └─→ Dashboard page appears?
      ├─→ YES: ✅ SUCCESS - Demo users working!
      └─→ NO: Blank page? (See Section D)
```

---

## 🔴 Section A: Loading Spinner Never Appeared

**Problem:** No spinner, no error, no response

**Cause:** Network issue or button handler broken

**Steps:**

1. **Open browser console (F12)**
   - Press: `F12`
   - Look for red/yellow messages

2. **Check if you're online**
   ```
   Open new tab: https://google.com
   Expected: Google homepage loads
   Actual: ?
   ```

3. **Reload page**
   ```
   https://zerothali.vercel.app/login
   Wait 2 seconds
   Click button again
   ```

4. **Check network tab**
   ```
   F12 → Network tab
   Click "Login as Student"
   Look for POST request to supabase
   Expected: 200 OK response
   Actual: 4xx/5xx error?
   ```

5. **Try different browser**
   ```
   Chrome → Edge/Firefox
   Should work in any modern browser
   ```

**Still broken?** → Jump to "Nuclear Option" at bottom

---

## 🟡 Section B: Error Message Shown

**Common Errors:**

### B1: "Invalid email format"

**Cause:** Supabase auth settings rejecting email

**Fix:**
```
Go to: Supabase Dashboard
→ Project Settings
→ Authentication
→ Email Templates

Check: Email Confirmations
Status: Should be DISABLED for free tier

If ENABLED:
  Click: DISABLE
  Reason: Free tier limits email confirmation
  
Alternative: Use Custom SMTP (paid feature)
```

### B2: "User not found"

**Cause:** Credentials wrong or user not created

**Fix:**
1. Verify user exists in Supabase Auth:
   ```
   Go to: https://supabase.com/dashboard/project/phwivinxfxugyknclrob/auth/users
   Look for: student@college.edu
   Expected: Listed in users table
   ```

2. Verify password is correct:
   ```
   Password: password123 (exactly this)
   Case-sensitive: p is lowercase
   No extra spaces
   ```

3. Verify "Auto Confirm" was checked:
   ```
   Go to: Auth → Users → student@college.edu
   Look for: "Confirmed At" field
   Expected: Timestamp (not empty)
   If empty: User never confirmed, delete and recreate
   ```

### B3: "Invalid login credentials"

**Cause:** Email/password don't match

**Fix:**
```
Double-check exact credentials:

Email: student@college.edu (not "student@college" or "student@college.edu ")
Password: password123 (not "password" or "Password123")

Go back and create user again if unsure:
1. Supabase → Auth → Users
2. Click trash to delete wrong user
3. Click "Add User" and recreate carefully
```

### B4: "Too many requests" or Rate limited

**Cause:** Supabase free tier email limit

**Fix:**
```
This happens with email confirmation enabled.

Solution: Disable email confirmation in Auth settings
1. Supabase → Authentication settings
2. Find "Email Confirmations"
3. Toggle to DISABLED
4. Wait 1 minute
5. Try login again
```

---

## 🔴 Section C: Page Stuck on Login (No Redirect)

**Problem:** Spinner goes away, success toast appears, but still on `/login` URL

**Cause:** Navigation not working after successful auth

**Steps:**

1. **Check browser console for errors**
   ```
   F12 → Console tab
   Look for red X errors
   Common: "Cannot read property 'role' of null"
   ```

2. **Check if session exists**
   ```
   F12 → Application tab → Cookies
   Look for: supabase-auth-token
   Expected: JWT token present
   If missing: Auth didn't actually succeed
   ```

3. **Check useAuth hook state**
   ```
   Add this to browser console:
   localStorage.getItem('supabase.auth.token')
   
   Expected: Long JWT string
   If null/undefined: Session not stored
   ```

4. **Try manually navigating**
   ```
   Type in URL bar: https://zerothali.vercel.app/dashboard
   Expected: Dashboard loads
   Actual: Redirects back to login? (See Section C.5)
   ```

5. **If redirects back to login**
   ```
   Cause: useAuth() not finding user in public.users
   
   Check public.users table:
   SELECT * FROM public.users WHERE email = 'student@college.edu';
   
   Expected: 1 row returned with role='student'
   If missing: Run create_demo_users.sql script
   ```

---

## 🟠 Section D: Dashboard Blank/Loading Forever

**Problem:** Page navigated to `/dashboard` but blank or infinite spinner

**Cause:** Page component not rendering or data loading stuck

**Steps:**

1. **Check browser console**
   ```
   F12 → Console
   Look for errors like:
   - "Cannot read property 'X' of undefined"
   - "Cannot read property 'role' of null"
   - "Network error"
   ```

2. **Verify user object has role field**
   ```
   F12 → Console → Type:
   
   JSON.parse(localStorage.getItem('user') || '{}')
   
   Expected: { role: 'student', ... }
   If missing: User object incomplete
   ```

3. **Check if data queries working**
   ```
   F12 → Network tab
   Look for requests to supabase API
   Expected: GET /rest/v1/meals (200 OK)
   If: 401/403 → Permission issue
   If: 5xx → Supabase down
   ```

4. **Try hard refresh**
   ```
   Press: Ctrl+Shift+R (clears cache)
   Wait 5 seconds
   Page should load
   ```

5. **Check RLS Policies**
   ```
   If still blank, RLS policies might be blocking:
   
   Go to: Supabase → SQL Editor
   Run:
   SELECT * FROM public.meals LIMIT 1;
   
   Expected: Rows returned (or 0 if no data)
   If error: RLS policy blocking
   ```

---

## 🟢 Section E: Successful Login - What Should Appear

### For Student Role

```
URL: https://zerothali.vercel.app/dashboard
Header: Shows "ZeroThali" + Dark Mode toggle + Profile menu
Content: 
  - Welcome message: "Good Morning/Afternoon, Demo Student"
  - 3 Meal Cards:
    ├─ 🌅 Breakfast (Cutoff: 08:00)
    │  └─ Menu items + Confirm/Skip buttons
    ├─ ☀️ Lunch (Cutoff: 12:00)
    │  └─ Menu items + Confirm/Skip buttons
    └─ 🌙 Dinner (Cutoff: 19:00)
       └─ Menu items + Confirm/Skip buttons
  - Bottom: "View my orders" link
```

### For Manager Role

```
URL: https://zerothali.vercel.app/dashboard
Content:
  - Stats: "Total Confirmations: X | Est. Leftovers: Y"
  - Live chart: Confirmations count per meal
  - Meal menus (editable)
  - "Create leftover order" button
```

### For Receiver Role

```
URL: https://zerothali.vercel.app/dashboard
Content:
  - "Available Leftovers" cards
  - Each card shows:
    ├─ Meal type + quantity
    ├─ Location
    ├─ Time available
    └─ "Place Order" button
  - "My Orders" link (orders placed)
```

### For Admin Role

```
URL: https://zerothali.vercel.app/dashboard
Content:
  - Full system overview
  - Multiple charts/metrics
  - User management section
  - System health status
```

---

## 🚀 Nuclear Option: Reset Everything

**If nothing works, do this full reset:**

### Step 1: Delete all demo users from Supabase Auth

```
Go to: https://supabase.com/dashboard/project/phwivinxfxugyknclrob/auth/users

For each of these, click the trash icon:
  - student@college.edu
  - manager@college.edu
  - ngo@example.com
  - admin@college.edu

Wait 30 seconds for deletion to sync
```

### Step 2: Delete from public.users table

```
Go to: Supabase → SQL Editor
Run:

DELETE FROM public.users 
WHERE email IN (
  'student@college.edu',
  'manager@college.edu',
  'ngo@example.com',
  'admin@college.edu'
);

Expected: Query executed successfully (deleted 4 rows)
```

### Step 3: Verify deleted

```
Go to: Supabase → Auth → Users
Expected: No demo users listed

Go to: SQL Editor
Run: SELECT COUNT(*) FROM public.users WHERE email LIKE '%@college.edu' OR email LIKE '%@example.com';
Expected: 0
```

### Step 4: Start fresh

```
Go to: DASHBOARD_FIX_GUIDE.md
Follow Step 1, 2, 3 again from scratch
```

---

## 🧪 Manual Testing Checklist

After successful login, verify each feature:

### Student Dashboard Test

- [ ] Page loads without errors
- [ ] Greeting shows correct name ("Demo Student")
- [ ] See 3 meal cards (Breakfast, Lunch, Dinner)
- [ ] Each card shows:
  - [ ] Meal time and emoji
  - [ ] Countdown timer
  - [ ] Menu items
  - [ ] Confirm/Skip buttons
- [ ] Can click "Confirm" (button responds)
- [ ] Can click "Skip" (button responds)
- [ ] Dark mode toggle works
- [ ] Profile menu shows your email
- [ ] "Sign out" button works

### Manager Dashboard Test

- [ ] Page loads without errors
- [ ] Greeting shows "Demo Manager"
- [ ] See stats (Total Confirmations, Est. Leftovers)
- [ ] See live chart or counter
- [ ] See editable meal menus
- [ ] "Create leftover" button visible
- [ ] Can navigate to Leftovers page

### Receiver Dashboard Test

- [ ] Page loads without errors
- [ ] Greeting shows "Demo Receiver"
- [ ] See "Available Leftovers" section
- [ ] If leftovers exist:
  - [ ] See leftover cards
  - [ ] "Place Order" button visible
  - [ ] Can click button

### Admin Dashboard Test

- [ ] Page loads without errors
- [ ] See system overview
- [ ] See metrics/statistics
- [ ] All data visible (no permissions errors)
- [ ] No console errors

---

## 📊 Debug Information to Collect

**If you need to report an issue, collect this info:**

```
1. Browser: (Chrome/Firefox/Edge/Safari?)
2. OS: Windows/Mac/Linux?
3. URL where error happens: (full URL)
4. Error message: (exact text from screen)
5. Console error: (F12 → Console → paste red message)
6. Network error: (F12 → Network → failed request details)

Copy-paste into issue report with these details:

✅ I created users in Supabase Auth: YES/NO
✅ I ran the SQL to set roles: YES/NO  
✅ I clicked demo button: which one?
✅ What happened: (error/blank/stuck/other)
✅ Browser console shows: (paste error if any)
```

---

## 🎯 Quick Reference: Expected Success Flow

```
1. Visit: https://zerothali.vercel.app/login
2. See: Login form + 4 colored demo buttons
3. Click: "Login as Student" (blue)
4. Wait: Loading spinner appears
5. See: Success toast "Welcome back!"
6. URL changes: /login → /dashboard
7. Page shows: Student Dashboard (3 meal cards)
8. Victory: 🎉 System working!
```

If any step fails → Follow corresponding troubleshooting section above.

---

## 📞 Real Errors You Might See

| Error | Cause | Fix |
|-------|-------|-----|
| "Invalid email format" | Supabase rejects format | Check email validation settings |
| "Email already exists" | User already created | Delete and recreate |
| "User not found" | Wrong credentials | Verify exact email/password |
| "Too many requests" | Rate limited | Wait 5 min or disable email confirmation |
| "Permission denied" | RLS policies blocking | Check role field in public.users |
| "Cannot read property 'role' of null" | User profile missing | Run create_demo_users.sql |
| Blank dashboard | Loading stuck | Check browser console for errors |
| Infinite spinner | useAuth hook not finishing | Check setLoading(false) in code |

---

## ✅ Success Indicators

**Dashboard working correctly when:**

```
✅ URL is /dashboard (not /login)
✅ No blank white page
✅ Content renders (meal cards OR stats OR leftovers)
✅ Your name appears in greeting
✅ No red errors in F12 console
✅ Can interact with buttons
✅ Profile menu shows your email
✅ Dark mode toggle works
✅ Logout button works
```

---

**Good luck! 🚀 Most common fix: Create demo users in Supabase Auth and set roles in SQL.**
