-- ============================================================
-- Create Test Users Directly (Bypasses Email Rate Limit)
-- Run this in Supabase SQL Editor
-- ============================================================

-- NOTE: Users created this way won't have passwords set via normal signup
-- You'll need to use the "Invite User" or "Reset Password" feature
-- OR create them via the Supabase Dashboard > Authentication > Users

-- -------------------------------------------------------
-- Option A: Create via Dashboard (RECOMMENDED)
-- -------------------------------------------------------
-- 1. Go to: Authentication > Users > Add User
-- 2. Enter email and password
-- 3. Click "Create User"
-- 4. Then run the UPDATE statements below to set roles

-- -------------------------------------------------------
-- Option B: Create with SQL (Advanced)
-- -------------------------------------------------------

-- First, you need to create users in auth.users table
-- This requires the service role key, which you shouldn't expose

-- Instead, create users via Dashboard, then run these UPDATEs:

-- Set roles for existing users (after they sign up via app)
UPDATE public.users 
SET 
  role = 'student',
  full_name = 'Test Student',
  hostel_name = 'Block A',
  room_number = '101'
WHERE email = 'student1@test.com';

UPDATE public.users 
SET 
  role = 'student',
  full_name = 'Test Student 2',
  hostel_name = 'Block B',
  room_number = '202'
WHERE email = 'student2@test.com';

UPDATE public.users 
SET 
  role = 'manager',
  full_name = 'Test Manager'
WHERE email = 'manager@test.com';

UPDATE public.users 
SET 
  role = 'receiver',
  full_name = 'Test Receiver 1',
  weekly_order_count = 0
WHERE email = 'receiver1@test.com';

UPDATE public.users 
SET 
  role = 'receiver',
  full_name = 'Test Receiver 2',
  weekly_order_count = 0
WHERE email = 'receiver2@test.com';

UPDATE public.users 
SET 
  role = 'admin',
  full_name = 'Admin User'
WHERE email = 'admin@test.com';

-- -------------------------------------------------------
-- Verify users and roles
-- -------------------------------------------------------
SELECT 
  email,
  full_name,
  role,
  hostel_name,
  room_number,
  created_at
FROM public.users
ORDER BY role, email;

-- -------------------------------------------------------
-- WORKAROUND: Reset rate limit counter
-- -------------------------------------------------------
-- If you're still getting rate limited, wait 1 hour OR
-- contact Supabase support to reset your rate limit

-- -------------------------------------------------------
-- RECOMMENDED APPROACH FOR TESTING
-- -------------------------------------------------------

-- 1. Go to Supabase Dashboard > Authentication > Users
-- 2. Click "Add User" (top right)
-- 3. Create users with these emails:
--    - student1@test.com (password: Test@123)
--    - student2@test.com (password: Test@123)
--    - manager@test.com (password: Test@123)
--    - receiver1@test.com (password: Test@123)
--    - receiver2@test.com (password: Test@123)
-- 4. Then run the UPDATE statements above to set roles
-- 5. Test login at: https://zerothali.vercel.app/login

