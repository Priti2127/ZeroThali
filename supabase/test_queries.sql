-- ============================================================
-- ZeroThali Test & Debug Queries
-- Quick reference for testing functionality
-- ============================================================

-- -------------------------------------------------------
-- 1. VERIFY SETUP
-- -------------------------------------------------------

-- Check if all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Check if cron jobs are scheduled
SELECT jobname, schedule, active, command
FROM cron.job 
ORDER BY jobname;

-- Check last cron job runs
SELECT job_name, status, return_message, start_time, end_time
FROM cron.job_run_details 
ORDER BY start_time DESC 
LIMIT 10;

-- -------------------------------------------------------
-- 2. CREATE TEST USERS
-- -------------------------------------------------------

-- After users sign up via the app, set their roles:
UPDATE public.users SET 
  full_name = 'Test Student',
  role = 'student',
  hostel_name = 'Block A',
  room_number = '204',
  is_registered = true
WHERE email = 'student@test.com';

UPDATE public.users SET 
  full_name = 'Test Manager',
  role = 'manager'
WHERE email = 'manager@test.com';

UPDATE public.users SET 
  full_name = 'Test Receiver 1',
  role = 'receiver',
  weekly_order_count = 0
WHERE email = 'receiver@test.com';

UPDATE public.users SET 
  full_name = 'Test Receiver 2',
  role = 'receiver',
  weekly_order_count = 0
WHERE email = 'receiver2@test.com';

UPDATE public.users SET 
  full_name = 'Admin User',
  role = 'admin'
WHERE email = 'admin@test.com';

-- -------------------------------------------------------
-- 3. CHECK USER ROLES
-- -------------------------------------------------------

SELECT id, email, full_name, role, hostel_name, room_number, weekly_order_count
FROM public.users
ORDER BY role, email;

-- -------------------------------------------------------
-- 4. TEST MEAL CONFIRMATION
-- -------------------------------------------------------

-- View today's meals
SELECT id, date, type, cutoff_time, is_cutoff_locked, predicted_walkins
FROM public.meals
WHERE date = current_date
ORDER BY type;

-- View confirmations for today's meals
SELECT 
  u.full_name,
  m.type as meal_type,
  c.status,
  c.updated_at
FROM public.confirmations c
JOIN public.users u ON u.id = c.user_id
JOIN public.meals m ON m.id = c.meal_id
WHERE m.date = current_date
ORDER BY m.type, u.full_name;

-- Count confirmations by status
SELECT 
  m.type,
  COUNT(*) FILTER (WHERE c.status = 'confirmed') as confirmed,
  COUNT(*) FILTER (WHERE c.status = 'skipped') as skipped,
  COUNT(*) FILTER (WHERE c.status = 'unconfirmed') as unconfirmed
FROM public.meals m
LEFT JOIN public.confirmations c ON c.meal_id = m.id
WHERE m.date = current_date
GROUP BY m.id, m.type
ORDER BY m.type;

-- -------------------------------------------------------
-- 5. TEST MEAL LOCKING
-- -------------------------------------------------------

-- Manually lock a meal (for testing)
SELECT lock_meal_cutoff_today('breakfast');
SELECT lock_meal_cutoff_today('lunch');
SELECT lock_meal_cutoff_today('dinner');

-- Check which meals are locked
SELECT type, cutoff_time, is_cutoff_locked
FROM public.meals
WHERE date = current_date;

-- -------------------------------------------------------
-- 6. TEST WALK-INS AND PREDICTION
-- -------------------------------------------------------

-- View walk-ins for today
SELECT 
  m.type,
  w.count as walkin_count,
  m.predicted_walkins,
  w.logged_at
FROM public.walkins w
JOIN public.meals m ON m.id = w.meal_id
WHERE m.date = current_date
ORDER BY m.type;

-- Test prediction function
SELECT get_predicted_walkins('breakfast', current_date);
SELECT get_predicted_walkins('lunch', current_date);
SELECT get_predicted_walkins('dinner', current_date);

-- Historical walk-ins (for debugging prediction)
SELECT 
  m.date,
  EXTRACT(DOW FROM m.date) as weekday,
  m.type,
  w.count
FROM public.walkins w
JOIN public.meals m ON m.id = w.meal_id
WHERE m.type = 'lunch'
  AND EXTRACT(DOW FROM m.date) = EXTRACT(DOW FROM current_date)
ORDER BY m.date DESC
LIMIT 6;

-- -------------------------------------------------------
-- 7. TEST LEFTOVERS AND ORDERS
-- -------------------------------------------------------

-- View active leftovers
SELECT 
  l.id,
  m.date,
  m.type,
  l.quantity_plates,
  l.available_plates,
  l.price_per_plate,
  l.status,
  l.expires_at
FROM public.leftovers l
JOIN public.meals m ON m.id = l.meal_id
WHERE l.status IN ('available', 'sold_out')
ORDER BY l.created_at DESC;

-- View recent orders
SELECT 
  o.id,
  o.pickup_code,
  u.full_name as receiver,
  o.quantity,
  o.total_price,
  o.status,
  o.expires_at,
  o.created_at
FROM public.orders o
JOIN public.users u ON u.id = o.receiver_id
ORDER BY o.created_at DESC
LIMIT 10;

-- Check order and leftover sync
SELECT 
  l.id as leftover_id,
  l.quantity_plates as total,
  l.available_plates as available,
  COUNT(o.id) FILTER (WHERE o.status = 'pending') as pending_orders,
  SUM(o.quantity) FILTER (WHERE o.status = 'pending') as pending_qty
FROM public.leftovers l
LEFT JOIN public.orders o ON o.leftover_id = l.id
GROUP BY l.id
HAVING l.available_plates > 0
ORDER BY l.created_at DESC;

-- -------------------------------------------------------
-- 8. TEST ATOMIC ORDER PLACEMENT
-- -------------------------------------------------------

-- Get IDs for testing (replace UUIDs below)
SELECT l.id as leftover_id, u.id as receiver_id
FROM public.leftovers l, public.users u
WHERE l.status = 'available'
  AND l.available_plates > 0
  AND u.role = 'receiver'
LIMIT 1;

-- Test order placement (replace UUIDs)
SELECT place_leftover_order(
  'leftover-uuid-here'::uuid,
  'receiver-uuid-here'::uuid,
  2
);

-- -------------------------------------------------------
-- 9. TEST ORDER EXPIRY
-- -------------------------------------------------------

-- Manually set order to expired (for testing)
UPDATE public.orders
SET expires_at = now() - interval '1 minute'
WHERE status = 'pending'
  AND id = 'order-uuid-here';

-- Run expiry function
SELECT expire_old_orders();

-- Verify expired orders and returned plates
SELECT 
  o.id,
  o.status,
  o.quantity,
  l.available_plates,
  o.expires_at
FROM public.orders o
JOIN public.leftovers l ON l.id = o.leftover_id
WHERE o.status = 'expired'
ORDER BY o.updated_at DESC
LIMIT 5;

-- -------------------------------------------------------
-- 10. TEST WEEKLY ORDER LIMITS
-- -------------------------------------------------------

-- Check receiver order counts
SELECT 
  u.full_name,
  u.weekly_order_count,
  u.last_order_at,
  COUNT(o.id) as actual_orders_this_week
FROM public.users u
LEFT JOIN public.orders o ON o.receiver_id = u.id 
  AND o.created_at >= date_trunc('week', current_date)
WHERE u.role = 'receiver'
GROUP BY u.id
ORDER BY u.weekly_order_count DESC;

-- Manually reset weekly counts (for testing)
SELECT reset_weekly_order_counts();

-- -------------------------------------------------------
-- 11. TEST FEEDBACK
-- -------------------------------------------------------

-- View recent feedback with ratings
SELECT 
  f.rating,
  f.tags,
  f.comment,
  u.full_name as student,
  m.type as meal,
  m.date,
  f.created_at
FROM public.feedback f
JOIN public.users u ON u.id = f.user_id
JOIN public.meals m ON m.id = f.meal_id
ORDER BY f.created_at DESC
LIMIT 10;

-- Average rating by meal type
SELECT 
  m.type,
  ROUND(AVG(f.rating)::numeric, 2) as avg_rating,
  COUNT(*) as feedback_count
FROM public.feedback f
JOIN public.meals m ON m.id = f.meal_id
WHERE m.date >= current_date - 7
GROUP BY m.type;

-- Most common feedback tags
SELECT 
  tag,
  COUNT(*) as count
FROM public.feedback f,
LATERAL unnest(f.tags) as tag
GROUP BY tag
ORDER BY count DESC;

-- -------------------------------------------------------
-- 12. DASHBOARD STATS FUNCTIONS
-- -------------------------------------------------------

-- Test manager stats function
SELECT get_manager_stats(current_date);

-- Test admin stats function
SELECT get_admin_stats();

-- -------------------------------------------------------
-- 13. WASTAGE ANALYSIS
-- -------------------------------------------------------

-- Recent wastage by meal
SELECT 
  date,
  type,
  cooked_kg,
  leftover_kg,
  ROUND((leftover_kg / cooked_kg * 100)::numeric, 1) as wastage_percent
FROM public.meals
WHERE leftover_kg IS NOT NULL
  AND cooked_kg > 0
ORDER BY date DESC, type
LIMIT 14;

-- Average wastage by meal type
SELECT 
  type,
  COUNT(*) as meal_count,
  ROUND(AVG(leftover_kg)::numeric, 2) as avg_leftover_kg,
  ROUND(AVG(leftover_kg / NULLIF(cooked_kg, 0) * 100)::numeric, 1) as avg_wastage_percent
FROM public.meals
WHERE leftover_kg IS NOT NULL
  AND cooked_kg > 0
GROUP BY type;

-- -------------------------------------------------------
-- 14. DISH RANKINGS
-- -------------------------------------------------------

-- Dishes by average wastage (needs historical data)
SELECT 
  d.name,
  d.category,
  d.avg_wastage_kg,
  d.avg_rating,
  d.times_served
FROM public.dishes d
WHERE d.times_served > 0
ORDER BY d.avg_wastage_kg DESC
LIMIT 10;

-- -------------------------------------------------------
-- 15. CLEANUP (DANGER - Use with caution)
-- -------------------------------------------------------

-- Delete all test orders (CAREFUL!)
-- DELETE FROM public.orders WHERE receiver_id IN (
--   SELECT id FROM public.users WHERE email LIKE '%test.com'
-- );

-- Reset weekly counts for test users
-- UPDATE public.users 
-- SET weekly_order_count = 0, last_order_at = NULL
-- WHERE email LIKE '%test.com';

-- Delete test leftovers
-- DELETE FROM public.leftovers WHERE created_at > current_date;

-- -------------------------------------------------------
-- 16. PERFORMANCE CHECKS
-- -------------------------------------------------------

-- Check table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check index usage
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan as index_scans
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- Check slow queries (if pg_stat_statements enabled)
-- SELECT query, calls, mean_exec_time, total_exec_time
-- FROM pg_stat_statements
-- ORDER BY mean_exec_time DESC
-- LIMIT 10;

-- -------------------------------------------------------
-- NOTES
-- -------------------------------------------------------

-- All queries above are safe to run in read mode
-- Queries marked with -- are commented out for safety
-- Replace 'uuid-here' with actual UUIDs from your database
-- Use SELECT before UPDATE/DELETE to verify what will change

