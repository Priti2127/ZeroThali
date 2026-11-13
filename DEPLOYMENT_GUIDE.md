# ZeroThali - Deployment & Setup Guide

## 🚀 Quick Start (Summary)

The ZeroThali application is **65% complete** and mostly functional. Here's what you need to do to make it 100% production-ready:

### Priority 1: Database Setup (30 minutes)
1. Run the cron jobs migration in Supabase
2. Verify cron jobs are scheduled
3. Test atomic order placement

### Priority 2: Payment Integration (2-3 hours)
1. Add Razorpay test mode OR UPI link generation
2. Update order status after payment

### Priority 3: Testing (2 hours)
1. Test concurrent order placement (2 users, 1 plate)
2. Test order expiry and quantity return
3. Test on real mobile device with mobile data

---

## 📋 STEP-BY-STEP DEPLOYMENT

### STEP 1: Verify Supabase Setup

**Current Status:** ✅ Database schema exists, ⚠️ Cron jobs need setup

1. **Login to Supabase Dashboard**
   - URL: https://supabase.com/dashboard/project/phwivinxfxugyknclrob
   - Navigate to: SQL Editor

2. **Run Cron Jobs Migration**
   ```sql
   -- Copy and paste entire content of:
   -- supabase/migrations/001_cron_jobs.sql
   -- Then click "Run"
   ```

3. **Verify Cron Jobs Are Scheduled**
   ```sql
   SELECT jobname, schedule, active 
   FROM cron.job 
   ORDER BY jobname;
   ```
   
   Expected output:
   ```
   jobname              | schedule        | active
   ---------------------|-----------------|-------
   expire-orders        | */5 * * * *     | t
   lock-breakfast       | 30 7 * * *      | t
   lock-dinner          | 0 16 * * *      | t
   lock-lunch           | 0 11 * * *      | t
   reset-weekly-orders  | 0 0 * * 1       | t
   ```

4. **Test Cron Jobs Manually**
   ```sql
   -- Test locking function
   SELECT lock_meal_cutoff_today('breakfast');
   
   -- Test expiry function
   SELECT expire_old_orders();
   
   -- Check job history
   SELECT * FROM cron.job_run_details 
   ORDER BY start_time DESC 
   LIMIT 10;
   ```

5. **Verify RLS Policies**
   ```sql
   -- Should return rows for each table
   SELECT tablename, policyname 
   FROM pg_policies 
   WHERE schemaname = 'public';
   ```

---

### STEP 2: Test Core Functionality

#### A. Test Meal Confirmation Flow

1. **Create Test Users** (if not already done)
   - Go to: Authentication > Users > Add User
   - Create:
     - `student@test.com` (password: Test@123)
     - `manager@test.com` (password: Test@123)
     - `receiver@test.com` (password: Test@123)

2. **Set User Roles**
   ```sql
   -- Run in SQL Editor
   UPDATE public.users 
   SET role = 'student', full_name = 'Test Student', 
       hostel_name = 'Test Hostel', room_number = '101'
   WHERE email = 'student@test.com';
   
   UPDATE public.users 
   SET role = 'manager', full_name = 'Test Manager'
   WHERE email = 'manager@test.com';
   
   UPDATE public.users 
   SET role = 'receiver', full_name = 'Test Receiver'
   WHERE email = 'receiver@test.com';
   ```

3. **Test Student Flow**
   - Login as student@test.com
   - Go to /meals
   - Click "I will eat" for breakfast
   - Verify: status changes, toast shows confirmation

4. **Test Manager Flow**
   - Login as manager@test.com
   - Go to /dashboard
   - Verify: See confirmed count = 1
   - Log walk-ins: Enter "5" and click Log
   - Enter cooked_kg = 25, leftover_kg = 2.5
   - Click "Save Meal Data"

#### B. Test Leftover Order Flow (CRITICAL)

1. **As Manager:**
   - Go to /leftovers
   - Select today's lunch
   - Quantity plates: 5
   - Price per plate: 10
   - Click "Publish Leftover Alert"

2. **As Receiver (Browser 1):**
   - Login as receiver@test.com
   - Go to /dashboard
   - Verify: Leftover appears
   - Click "Order" → Select 2 plates
   - **DO NOT COMPLETE ORDER YET**

3. **As Receiver (Browser 2):**
   - Open INCOGNITO/PRIVATE window
   - Create second receiver: `receiver2@test.com`
   - Update role to 'receiver' in database
   - Login as receiver2@test.com
   - Go to /dashboard

4. **Concurrency Test (CRITICAL):**
   - **Both browsers at the SAME TIME:**
     - Change leftover to quantity = 1 plate
     - Browser 1: Click "Order" for 1 plate
     - Browser 2: Click "Order" for 1 plate (within 1 second)
   - **Expected Result:**
     - One order succeeds, shows pickup code
     - Other order fails with "Not enough plates available"
   - **If BOTH succeed:** ❌ CRITICAL BUG - Atomic function not working

5. **Test Order Expiry:**
   ```sql
   -- Manually set expiry to past
   UPDATE public.orders 
   SET expires_at = now() - interval '1 minute'
   WHERE status = 'pending'
   LIMIT 1;
   
   -- Trigger expiry function
   SELECT expire_old_orders();
   
   -- Verify: Order status = 'expired', leftover available_plates increased
   SELECT o.status, l.available_plates 
   FROM orders o
   JOIN leftovers l ON l.id = o.leftover_id
   ORDER BY o.created_at DESC LIMIT 1;
   ```

---

### STEP 3: Payment Integration (TODO)

**Current Status:** ❌ Not implemented

#### Option A: Razorpay Test Mode (Recommended)

1. **Sign up at Razorpay**
   - URL: https://razorpay.com/
   - Get Test API Key and Secret

2. **Install Razorpay SDK**
   ```bash
   cd ZeroThali
   npm install razorpay
   ```

3. **Add to .env**
   ```env
   VITE_RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXX
   VITE_RAZORPAY_KEY_SECRET=XXXXXXXXXXXXXXX
   ```

4. **Create Payment Service** (file: `src/services/payment.ts`)
   ```typescript
   export async function createRazorpayOrder(amount: number, orderId: string) {
     const response = await fetch('/api/create-razorpay-order', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ amount, orderId })
     });
     return response.json();
   }

   export function openRazorpayCheckout(
     razorpayOrderId: string, 
     amount: number, 
     onSuccess: (paymentId: string) => void
   ) {
     const options = {
       key: import.meta.env.VITE_RAZORPAY_KEY_ID,
       amount: amount * 100, // paise
       currency: 'INR',
       name: 'ZeroThali',
       description: 'Leftover Food Order',
       order_id: razorpayOrderId,
       handler: function(response: any) {
         onSuccess(response.razorpay_payment_id);
       },
       theme: { color: '#14342B' }
     };
     const rzp = new (window as any).Razorpay(options);
     rzp.open();
   }
   ```

5. **Update Order Flow** (in `src/pages/ReceiverDashboard.tsx`)
   - After `place_leftover_order()` succeeds
   - Call `createRazorpayOrder()` to get Razorpay order ID
   - Call `openRazorpayCheckout()`
   - On payment success, update order:
     ```typescript
     await supabase
       .from('orders')
       .update({ 
         status: 'paid', 
         payment_id: paymentId, 
         paid_at: new Date().toISOString() 
       })
       .eq('id', orderId);
     ```

#### Option B: UPI Payment Link (Simpler, India-only)

1. **Generate UPI Link**
   ```typescript
   function generateUPILink(
     upiId: string, 
     name: string, 
     amount: number, 
     orderId: string
   ): string {
     return `upi://pay?pa=${upiId}&pn=${encodeURIComponent(name)}&am=${amount}&cu=INR&tn=${encodeURIComponent('ZeroThali Order ' + orderId)}`;
   }
   ```

2. **Display QR Code or Link**
   - After order creation, show UPI link
   - User opens in payment app
   - Manually verify payment and update status
   - **Limitation:** No auto-verification, manager needs to confirm

---

### STEP 4: Deploy to Vercel

**Current Status:** ✅ Already deployed at https://zerothali.vercel.app/

1. **Verify Environment Variables**
   - Go to: Vercel Dashboard > ZeroThali Project > Settings > Environment Variables
   - Confirm these exist:
     ```
     VITE_SUPABASE_URL=https://phwivinxfxugyknclrob.supabase.co
     VITE_SUPABASE_ANON_KEY=sb_publishable_4fRBUwjjASH_xhvnwcZwmg_u0HbsuxD
     ```
   - If adding Razorpay:
     ```
     VITE_RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXX
     ```

2. **Push Latest Code**
   ```bash
   git add .
   git commit -m "feat: add cron jobs and enhanced dashboards"
   git push origin main
   ```
   - Vercel auto-deploys from main branch

3. **Verify Deployment**
   - Check: https://zerothali.vercel.app/
   - Test on mobile phone with mobile data (NOT WiFi)
   - Try installing as PWA (Add to Home Screen)

---

### STEP 5: Final Testing Checklist

- [ ] **User Roles:**
  - [ ] Student can confirm meals
  - [ ] Manager sees confirmation counts
  - [ ] Receiver cannot see meal menu/schedule
  - [ ] Admin sees all stats

- [ ] **Meal Confirmation:**
  - [ ] Cutoff time enforced (cannot change after cutoff)
  - [ ] Cron job auto-locks at cutoff time
  - [ ] Manager sees locked indicator

- [ ] **Walk-ins:**
  - [ ] Manager can log walk-ins
  - [ ] Prediction shows: confirmed + predicted walkins
  - [ ] Range displayed (low-high estimate)

- [ ] **Wastage Tracking:**
  - [ ] Manager enters cooked_kg and leftover_kg
  - [ ] Chart displays recent wastage
  - [ ] Admin dashboard shows total wastage

- [ ] **Feedback:**
  - [ ] Student can rate meals (1-5 stars)
  - [ ] Student can add tags and comments
  - [ ] Admin sees recent feedback

- [ ] **Leftover Orders:**
  - [ ] Manager publishes leftover alert
  - [ ] Receiver sees alert
  - [ ] **CRITICAL:** Two receivers cannot order the same plate
  - [ ] Order expires after 30 minutes
  - [ ] Expired orders return plates to pool
  - [ ] Weekly limit: max 3 orders per receiver
  - [ ] Per-order limit: max 2 plates
  - [ ] Manager verifies pickup code
  - [ ] Order marked as collected

- [ ] **Anti-Dependency:**
  - [ ] No schedule visible to receivers
  - [ ] No advance booking
  - [ ] Random delay implemented (optional)
  - [ ] Manager warning if surplus high 2 days in a row
  - [ ] "Not guaranteed" disclaimer displayed

- [ ] **Dashboards:**
  - [ ] Manager: confirmed vs actual, predicted vs actual, wastage chart
  - [ ] Admin: waste trend, improvement %, meals saved, user counts

- [ ] **Mobile:**
  - [ ] Works on real phone with mobile data
  - [ ] PWA installable
  - [ ] Touch targets large enough (44x44px minimum)
  - [ ] No horizontal scroll

- [ ] **Dark Mode:**
  - [ ] All pages render correctly
  - [ ] Toasts have correct colors

---

## 🔧 TROUBLESHOOTING

### Cron Jobs Not Running

1. **Check if pg_cron extension is enabled:**
   ```sql
   SELECT * FROM pg_extension WHERE extname = 'pg_cron';
   ```
   If empty, run: `CREATE EXTENSION pg_cron;`

2. **Check cron job logs:**
   ```sql
   SELECT * FROM cron.job_run_details 
   WHERE job_name = 'lock-breakfast'
   ORDER BY start_time DESC;
   ```

3. **Manually trigger job:**
   ```sql
   SELECT cron.run_job('lock-breakfast');
   ```

### Atomic Order Placement Not Working

1. **Verify function exists:**
   ```sql
   SELECT proname FROM pg_proc 
   WHERE proname = 'place_leftover_order';
   ```

2. **Check function definition has `FOR UPDATE`:**
   ```sql
   \df+ place_leftover_order
   ```
   Should contain: `SELECT ... FOR UPDATE`

3. **Test manually:**
   ```sql
   SELECT place_leftover_order(
     'leftover-uuid-here'::uuid,
     'receiver-uuid-here'::uuid,
     2
   );
   ```

### RLS Policies Blocking Access

1. **Check active policies:**
   ```sql
   SELECT schemaname, tablename, policyname, permissive, roles, cmd
   FROM pg_policies
   WHERE schemaname = 'public'
   AND tablename = 'leftovers';
   ```

2. **Temporarily disable RLS for debugging:**
   ```sql
   ALTER TABLE public.leftovers DISABLE ROW LEVEL SECURITY;
   -- Don't forget to re-enable after testing!
   ```

3. **Check user's role:**
   ```sql
   SELECT id, email, role FROM public.users WHERE email = 'your@email.com';
   ```

---

## 📊 WHAT'S COMPLETE VS TODO

### ✅ COMPLETE (65%)
- Core database schema with all tables
- User authentication and role-based access
- Meal confirmation UI (student side)
- Manager dashboard with confirmation counts
- Walk-ins logging
- Feedback submission
- Leftover alert publishing
- Atomic order placement function
- Pickup code generation
- Weekly order limits
- Order expiry logic (function exists)
- Basic charts and dashboards
- Mobile-first responsive design
- Dark mode support

### ⚠️ PARTIAL (needs testing/refinement)
- Cron job scheduling (SQL written, needs execution)
- Manager dashboard stats (UI exists, needs function hookup)
- Admin dashboard stats (UI exists, needs refinement)
- Walk-ins prediction display (function works, UI needs enhancement)
- Random delay for alerts (logic exists, not enforced)

### ❌ TODO (35%)
- **Payment integration** (Razorpay or UPI) - 2-3 hours
- **Cron job setup in Supabase** - 30 minutes
- **Concurrency testing** - 1 hour
- **Historical dish comparison** (wastage vs last time) - 1 hour
- **Dish ranking by wastage** - 30 minutes
- **Feedback insights panel** - 1 hour
- **Weekly PDF/CSV export** - 1.5 hours
- **Manager warning system** (high surplus alert) - 30 minutes
- **UI polish** (loading skeletons, better errors) - 2 hours
- **Mobile testing** on real device - 1 hour
- **Accessibility improvements** - 1 hour
- **Hindi language support** (i18n) - 2 hours (optional)

### TOTAL TIME TO 100%: ~15-18 hours

---

## 🎯 RECOMMENDED PRIORITY ORDER

1. **Run cron jobs migration** (30 min) - CRITICAL
2. **Test atomic orders** (1 hour) - CRITICAL
3. **Add payment integration** (2-3 hours) - HIGH
4. **Manager dashboard enhancements** (2 hours) - HIGH
5. **Admin dashboard completion** (1.5 hours) - MEDIUM
6. **Testing on mobile** (1 hour) - HIGH
7. **UI polish and error handling** (2 hours) - MEDIUM
8. **Export functionality** (1.5 hours) - LOW
9. **Accessibility** (1 hour) - MEDIUM
10. **Hindi language** (2 hours) - LOW (optional)

---

## 📞 SUPPORT

If you encounter issues:

1. **Check PROGRESS.md** for detailed feature status
2. **Check browser console** for errors
3. **Check Supabase logs** in Dashboard > Logs
4. **Check cron job history** with SQL queries above
5. **Verify environment variables** in Vercel and locally

---

**Last Updated:** 2026-11-13  
**Version:** 2.0  
**Status:** 65% Complete, Functional, Needs Payment & Testing
