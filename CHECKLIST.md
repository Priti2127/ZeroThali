# ZeroThali - Implementation Checklist

**Print this and check off as you complete each item.**

---

## ☑️ PHASE 1: CRITICAL SETUP (4 hours → MVP)

### Database Setup (30 minutes)
- [ ] Open Supabase Dashboard: https://supabase.com/dashboard/project/phwivinxfxugyknclrob
- [ ] Navigate to: SQL Editor
- [ ] Open file: `supabase/migrations/001_cron_jobs.sql`
- [ ] Copy entire content
- [ ] Paste in SQL Editor
- [ ] Click "Run"
- [ ] Verify cron jobs scheduled:
  ```sql
  SELECT jobname, schedule, active FROM cron.job ORDER BY jobname;
  ```
- [ ] Should see 5 jobs: expire-orders, lock-breakfast, lock-lunch, lock-dinner, reset-weekly-orders
- [ ] All should have `active = true`

### Create Test Users (15 minutes)
- [ ] Go to Supabase Dashboard > Authentication > Users
- [ ] Create 4 users:
  - [ ] `student@test.com` / Test@123
  - [ ] `manager@test.com` / Test@123
  - [ ] `receiver@test.com` / Test@123
  - [ ] `receiver2@test.com` / Test@123
- [ ] Run SQL to set roles (copy from `supabase/test_queries.sql` section 2):
  ```sql
  UPDATE public.users SET role = 'student', full_name = 'Test Student', 
    hostel_name = 'Block A', room_number = '204' 
  WHERE email = 'student@test.com';
  
  UPDATE public.users SET role = 'manager', full_name = 'Test Manager' 
  WHERE email = 'manager@test.com';
  
  UPDATE public.users SET role = 'receiver', full_name = 'Test Receiver 1' 
  WHERE email = 'receiver@test.com';
  
  UPDATE public.users SET role = 'receiver', full_name = 'Test Receiver 2' 
  WHERE email = 'receiver2@test.com';
  ```
- [ ] Verify roles:
  ```sql
  SELECT email, full_name, role FROM public.users ORDER BY role;
  ```

### Test Atomic Orders (1 hour) - CRITICAL!
- [ ] As Manager:
  - [ ] Login: https://zerothali.vercel.app/login
  - [ ] Go to /leftovers
  - [ ] Publish leftover: 1 plate, ₹10
- [ ] Open Chrome Browser 1:
  - [ ] Login as receiver@test.com
  - [ ] Go to /dashboard
  - [ ] See the leftover alert
  - [ ] DO NOT click Order yet
- [ ] Open Chrome Browser 2 (Incognito):
  - [ ] Login as receiver2@test.com
  - [ ] Go to /dashboard
  - [ ] See the same leftover alert
- [ ] **BOTH browsers at the SAME TIME:**
  - [ ] Browser 1: Click "Order" → 1 plate
  - [ ] Browser 2: Click "Order" → 1 plate (within 1 second)
- [ ] **Expected Result:**
  - [ ] One succeeds: Shows pickup code
  - [ ] One fails: "Not enough plates available"
- [ ] **If BOTH succeed:** ❌ CRITICAL BUG - Report immediately

### Test Order Expiry (15 minutes)
- [ ] In Supabase SQL Editor:
  ```sql
  -- Get a pending order ID
  SELECT id, pickup_code, status, expires_at FROM public.orders 
  WHERE status = 'pending' ORDER BY created_at DESC LIMIT 1;
  
  -- Set expiry to past (use the ID from above)
  UPDATE public.orders 
  SET expires_at = now() - interval '1 minute'
  WHERE id = 'paste-order-id-here';
  
  -- Run expiry function
  SELECT expire_old_orders();
  
  -- Verify: order status = expired, plates returned
  SELECT o.status, l.available_plates 
  FROM orders o
  JOIN leftovers l ON l.id = o.leftover_id
  WHERE o.id = 'paste-order-id-here';
  ```
- [ ] Status should be 'expired'
- [ ] available_plates should have increased by order quantity

### Payment Integration (2-3 hours)

#### Option A: Razorpay (Recommended)
- [ ] Sign up: https://razorpay.com/
- [ ] Get Test API Key ID and Secret
- [ ] Add to .env:
  ```
  VITE_RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXX
  VITE_RAZORPAY_KEY_SECRET=XXXXXXXXXXXXXXX
  ```
- [ ] Install SDK: `npm install razorpay`
- [ ] Create `src/services/payment.ts` (see DEPLOYMENT_GUIDE.md)
- [ ] Update `src/pages/ReceiverDashboard.tsx`:
  - [ ] After `place_leftover_order()` succeeds
  - [ ] Call Razorpay checkout
  - [ ] On success, update order status to 'paid'
- [ ] Test: Place order, complete payment, verify status

#### Option B: UPI Link (Simpler)
- [ ] Create function to generate UPI link:
  ```typescript
  const upiLink = `upi://pay?pa=yourUPI@bank&pn=ZeroThali&am=${amount}&cu=INR&tn=Order%20${orderId}`;
  ```
- [ ] Display QR code or link
- [ ] Manual verification: Manager marks paid after checking

### Mobile Testing (1 hour)
- [ ] Test on real Android phone with mobile data:
  - [ ] Open: https://zerothali.vercel.app/
  - [ ] Sign up as new student
  - [ ] Confirm a meal
  - [ ] Submit feedback
  - [ ] Check leftover alerts (if receiver role)
  - [ ] Try installing as PWA: Menu → Add to Home Screen
  - [ ] Launch from home screen (should open in standalone mode)
- [ ] Test on iPhone (if available):
  - [ ] Same tests as Android
  - [ ] PWA install: Share → Add to Home Screen

---

## ☑️ PHASE 2: DASHBOARD ENHANCEMENTS (3.5 hours)

### Manager Dashboard (2 hours)
- [ ] Create hook to call `get_manager_stats()` function
- [ ] Display stats:
  - [ ] Today confirmed vs skipped vs unconfirmed
  - [ ] Predicted walk-ins
  - [ ] Total expected (confirmed + predicted)
  - [ ] Recent wastage (last 7 days)
  - [ ] Leftover revenue (last 30 days)
- [ ] Add predicted vs actual comparison chart:
  ```typescript
  // X-axis: dates, Y-axis: count
  // Two lines: predicted (blue), actual (green)
  ```
- [ ] Add waste per meal bar chart:
  ```typescript
  // X-axis: meal dates, Y-axis: wastage_kg
  // Color by meal type
  ```
- [ ] Test: Verify all numbers match database

### Admin Dashboard (1.5 hours)
- [ ] Create hook to call `get_admin_stats()` function
- [ ] Display stats:
  - [ ] Total users by role
  - [ ] Total meals served
  - [ ] Total wastage
  - [ ] Meals saved (orders collected)
  - [ ] Average rating
- [ ] Add waste trend chart (line chart, last 30 days)
- [ ] Calculate improvement %:
  ```typescript
  const improvement = ((lastMonth - thisMonth) / lastMonth) * 100;
  ```
- [ ] Show with arrow indicator (↑ or ↓)
- [ ] Test: Verify all stats are accurate

---

## ☑️ PHASE 3: WASTAGE ANALYSIS (3 hours)

### Historical Dish Comparison (1 hour)
- [ ] Query: Find last time same dish was served
  ```sql
  SELECT m1.date, m1.leftover_kg
  FROM meals m1
  WHERE m1.menu @> '[{"dish":"Rajma"}]'::jsonb
    AND m1.date < current_date
  ORDER BY m1.date DESC
  LIMIT 1;
  ```
- [ ] Compare with current wastage
- [ ] Show: "Last time: X kg, Today: Y kg (±Z%)"
- [ ] Display arrow: ↓ green if improved, ↑ red if worse
- [ ] Add to manager meal detail view

### Dish Ranking Table (30 minutes)
- [ ] Query dishes sorted by avg_wastage_kg:
  ```sql
  SELECT name, avg_wastage_kg, avg_rating, times_served
  FROM dishes
  ORDER BY avg_wastage_kg DESC
  LIMIT 10;
  ```
- [ ] Display as horizontal bar chart or table
- [ ] Add to manager dashboard

### Feedback Insights Panel (1 hour)
- [ ] Query most common tags:
  ```sql
  SELECT tag, COUNT(*) as count
  FROM feedback, unnest(tags) as tag
  GROUP BY tag
  ORDER BY count DESC;
  ```
- [ ] Query top/bottom rated dishes:
  ```sql
  SELECT d.name, AVG(f.rating) as avg_rating
  FROM dishes d
  JOIN meals m ON m.menu @> jsonb_build_array(jsonb_build_object('dish', d.name))
  JOIN feedback f ON f.meal_id = m.id
  GROUP BY d.name
  ORDER BY avg_rating DESC;
  ```
- [ ] Display:
  - [ ] "Most common issue: too_salty (12 times)"
  - [ ] "Top rated: Paneer Butter Masala (4.6 ⭐)"
  - [ ] "Needs improvement: Mixed Veg (3.2 ⭐, 8 'bland' tags)"
- [ ] Add to manager dashboard

---

## ☑️ PHASE 4: ANTI-DEPENDENCY ENFORCEMENT (1 hour)

### Random Alert Delay (30 minutes)
- [ ] In `src/pages/Leftovers.tsx`:
  - [ ] Generate random delay: 0-5 minutes
  - [ ] Store `alert_sent_at + delay` in database
  - [ ] Show alert only after delay passes
- [ ] Test: Create leftover, verify receivers see it with staggered timing

### Manager Warning System (30 minutes)
- [ ] Query yesterday's surplus:
  ```sql
  SELECT SUM(quantity_plates) as yesterday_surplus
  FROM leftovers l
  JOIN meals m ON m.id = l.meal_id
  WHERE m.date = current_date - 1;
  ```
- [ ] If > 20 and today's > 20:
  - [ ] Show warning: "⚠️ Surplus high 2 days in a row - reduce quantities"
- [ ] Display banner on manager dashboard before publishing new leftover

### Hide Predictions from Receivers (15 minutes)
- [ ] Add RLS policy:
  ```sql
  -- Receivers cannot see predicted_walkins
  CREATE POLICY "Receivers cannot see predictions"
  ON meals FOR SELECT
  TO authenticated
  USING (
    CASE 
      WHEN EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'receiver')
      THEN predicted_walkins IS NULL
      ELSE true
    END
  );
  ```
- [ ] Test: Login as receiver, verify prediction not visible

---

## ☑️ PHASE 5: EXPORT & POLISH (4.5 hours)

### Weekly Export (1.5 hours)
- [ ] Create function to generate CSV:
  ```typescript
  function exportWeeklyReport() {
    const data = await fetchWeekData();
    const csv = convertToCSV(data);
    downloadFile(csv, 'zerothali-weekly-report.csv');
  }
  ```
- [ ] Include:
  - [ ] Meals served
  - [ ] Confirmed vs actual
  - [ ] Wastage per meal
  - [ ] Feedback summary
- [ ] Add button on manager dashboard: "📥 Download Weekly Report"
- [ ] Test: Download, verify CSV opens in Excel

### UI Polish (2 hours)
- [ ] Replace loading spinners with skeleton screens
- [ ] Better error messages (specific, actionable)
- [ ] Add ARIA labels for screen readers
- [ ] Keyboard navigation support
- [ ] Food safety note: "⚠️ Consume within 2 hours of pickup"
- [ ] Test with keyboard only (no mouse)
- [ ] Test with screen reader (NVDA/VoiceOver)

### Accessibility (1 hour)
- [ ] All buttons have `aria-label`
- [ ] Form inputs have `<label>` tags
- [ ] Color contrast ratio ≥ 4.5:1 (check with browser DevTools)
- [ ] Focus indicators visible on all interactive elements
- [ ] Test with Tab key: logical order
- [ ] Test with Enter/Space: all buttons work
- [ ] Verify with Lighthouse (Chrome DevTools):
  - [ ] Accessibility score ≥ 90

---

## ☑️ PHASE 6: FINAL TESTING (3 hours)

### Comprehensive Flow Test (1 hour)
- [ ] **Day 1:**
  - [ ] Manager creates meals for tomorrow
  - [ ] Student confirms breakfast, lunch
  - [ ] Cutoff passes
  - [ ] Student tries to change → should fail
  - [ ] Manager logs walk-ins
  - [ ] Manager enters cooked/leftover quantities
  - [ ] Manager publishes leftover alert
  - [ ] Receiver orders and pays
  - [ ] Manager verifies pickup code
  - [ ] Order marked collected
- [ ] **Day 2:**
  - [ ] Repeat for different meals
- [ ] **Day 7:**
  - [ ] Receiver has 3 orders
  - [ ] Try 4th order → should fail (weekly limit)
- [ ] **Day 8 (Monday):**
  - [ ] Verify weekly count reset to 0

### Edge Cases (1 hour)
- [ ] Student tries to confirm after cutoff → fail
- [ ] Receiver tries to order 3 plates → fail (max 2)
- [ ] Receiver tries to order with only 1 plate left → fail or succeed
- [ ] Order expires → plates returned
- [ ] Two receivers order last plate → only one succeeds
- [ ] Manager tries to verify invalid pickup code → fail
- [ ] Non-receiver tries to access /alerts → redirect

### Performance Test (30 minutes)
- [ ] Open Chrome DevTools > Lighthouse
- [ ] Run audit:
  - [ ] Performance ≥ 80
  - [ ] Accessibility ≥ 90
  - [ ] Best Practices ≥ 90
  - [ ] SEO ≥ 80
- [ ] Check page load times:
  - [ ] Landing page < 2 seconds
  - [ ] Dashboard < 3 seconds
  - [ ] With slow 3G < 5 seconds
- [ ] Fix any issues

### Cross-Browser Test (30 minutes)
- [ ] Test on Chrome (Windows/Mac)
- [ ] Test on Firefox
- [ ] Test on Safari (Mac/iOS)
- [ ] Test on Edge
- [ ] Verify all features work identically

---

## ☑️ PHASE 7: DEPLOYMENT (1 hour)

### Final Checks Before Deploy
- [ ] All environment variables set in Vercel
- [ ] Database cron jobs active
- [ ] No console errors
- [ ] No TypeScript errors: `npm run build`
- [ ] Git status clean: `git status`

### Deploy to Production
- [ ] Commit changes:
  ```bash
  git add .
  git commit -m "feat: complete ZeroThali v2.0 - all features"
  git push origin main
  ```
- [ ] Vercel auto-deploys (check dashboard)
- [ ] Wait for deployment to complete
- [ ] Open: https://zerothali.vercel.app/
- [ ] Verify:
  - [ ] Landing page loads
  - [ ] Can sign up new user
  - [ ] Can login
  - [ ] Dashboard displays correctly
  - [ ] Dark mode works

### Post-Deployment Test
- [ ] Test on mobile data (NOT WiFi)
- [ ] Install as PWA on phone
- [ ] Complete full user flow
- [ ] Check Supabase logs for errors
- [ ] Check Vercel logs for errors

---

## ✅ COMPLETION CERTIFICATE

- [ ] All phases complete
- [ ] All tests passing
- [ ] Deployed and live
- [ ] Mobile verified
- [ ] No critical bugs

**Date Completed:** _____________

**Final Status:** Production Ready ✅

**Total Time Spent:** _____ hours

---

## 📊 OPTIONAL: BONUS FEATURES

### Hindi Language Support (2 hours)
- [ ] Install i18n: `npm install react-i18next i18next`
- [ ] Create translation files: `src/locales/en.json`, `src/locales/hi.json`
- [ ] Wrap all strings with `t('key')`
- [ ] Add language toggle in navbar
- [ ] Test: Switch language, verify all text changes

### Push Notifications (3 hours)
- [ ] Set up VAPID keys
- [ ] Create Supabase Edge Function for notifications
- [ ] Request notification permission
- [ ] Send test notification when leftover published
- [ ] Test on mobile device

### Analytics Dashboard (2 hours)
- [ ] Track key metrics:
  - [ ] Daily active users
  - [ ] Meals confirmed vs actual
  - [ ] Wastage reduction over time
  - [ ] Revenue from leftovers
- [ ] Add charts showing trends
- [ ] Export metrics to CSV

---

**Total Estimated Time:**
- Phase 1 (Critical): 4 hours
- Phase 2 (Dashboards): 3.5 hours
- Phase 3 (Wastage): 3 hours
- Phase 4 (Anti-dependency): 1 hour
- Phase 5 (Polish): 4.5 hours
- Phase 6 (Testing): 3 hours
- Phase 7 (Deploy): 1 hour
- **TOTAL:** 20 hours

**MVP (Phases 1 + 7):** 5 hours  
**Production (Phases 1-2 + 7):** 9 hours  
**Full Feature (All phases):** 20 hours

---

Good luck! 🚀
