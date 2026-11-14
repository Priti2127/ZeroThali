# 🍽️ Dashboard Blank? - Need Meals Data

## The Real Problem

Dashboard is loading forever because:

**There are NO MEALS in the database!**

The StudentDashboard queries the `meals` table to show meal cards. If no meals exist for today, it shows:
- Loading spinner (while querying)
- Eventually: "No meals scheduled for today" message

## Solution: Add Meals Data

### Quick Fix: Run This SQL

Go to: https://supabase.com/dashboard/project/phwivinxfxugyknclrob/sql

Paste and run:

```sql
-- Insert today's meals
INSERT INTO public.meals (date, type, cutoff_time, menu, is_cutoff_locked)
VALUES 
  (CURRENT_DATE, 'breakfast', '08:00', '[{"dish":"Idli"},{"dish":"Sambar"},{"dish":"Chutney"}]', false),
  (CURRENT_DATE, 'lunch', '12:00', '[{"dish":"Rice"},{"dish":"Dal"},{"dish":"Vegetables"}]', false),
  (CURRENT_DATE, 'dinner', '19:00', '[{"dish":"Roti"},{"dish":"Sabzi"},{"dish":"Raita"}]', false);
```

**Expected:** "Query executed successfully (3 rows)"

### Test

Go to: https://zerothali.vercel.app/login

Login as: `student@college.edu` / `password123`

**Expected:** Dashboard shows 3 meal cards (Breakfast, Lunch, Dinner)

---

## Why Dashboard Was Blank

**Timeline:**
1. You login ✅
2. Dashboard page loads ✅
3. useAuth hook sets user ✅
4. StudentDashboard tries to fetch meals
5. **Query: SELECT * FROM meals WHERE date = TODAY** ← Returns EMPTY
6. Loading spinner waits forever (or shows empty state after timeout)

**Result:** Blank page with loading spinner

---

## Now It Should Work

After adding meals data:

1. Login with student account
2. See 3 meal cards
3. Each card shows:
   - Time + emoji
   - Menu items
   - Confirm/Skip buttons
   - Timer until cutoff

---

## Next Issue After This

Once meals data exists and dashboard shows:

**If "Invalid credentials" error still appears:**
- Go back to `QUICK_FIX_NOW.md`
- Delete and recreate demo users
- Use EXACT password: `password123`

**If dashboard still blank after all this:**
- Open F12 → Console
- Look for red errors
- Share error message

---

## Optional: Add Meals for Multiple Days

If you want meals for the next 7 days:

```sql
-- Insert meals for next 7 days
WITH date_series AS (
  SELECT CURRENT_DATE + i as meal_date
  FROM generate_series(0, 6) as i
)
INSERT INTO public.meals (date, type, cutoff_time, menu, is_cutoff_locked)
SELECT 
  meal_date,
  meal_type,
  cutoff_time,
  menu,
  false
FROM date_series,
  (VALUES
    ('breakfast', '08:00'::time, '[{"dish":"Idli"},{"dish":"Sambar"},{"dish":"Chutney"}]'::jsonb),
    ('lunch', '12:00'::time, '[{"dish":"Rice"},{"dish":"Dal"},{"dish":"Vegetables"}]'::jsonb),
    ('dinner', '19:00'::time, '[{"dish":"Roti"},{"dish":"Sabzi"},{"dish":"Raita"}]'::jsonb)
  ) AS meals_data(meal_type, cutoff_time, menu);
```

---

## Checklist to Fix Dashboard

- [ ] Created demo users in Supabase Auth (student@college.edu, etc.)
- [ ] Set password to: `password123`
- [ ] Checked "Auto Confirm User"
- [ ] Run SQL to set roles in public.users
- [ ] **← NOW: Add meals data to the database (run SQL above)**
- [ ] Login to https://zerothali.vercel.app
- [ ] Try demo button "Login as Student"
- [ ] Dashboard shows meal cards
- [ ] Can click Confirm/Skip buttons

**Once all checked: Dashboard working! ✅**
