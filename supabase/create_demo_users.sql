-- ============================================================================
-- ZeroThali Demo Users Setup Script
-- ============================================================================
-- 
-- This script sets up the demo users in the public.users table.
-- 
-- PREREQUISITE: You must have already created the corresponding auth.users
-- in Supabase Auth dashboard with the email addresses below.
-- 
-- Go to: https://supabase.com/dashboard/project/phwivinxfxugyknclrob/auth/users
-- Add 4 users:
--   1. student@college.edu (password123, auto confirm checked)
--   2. manager@college.edu (password123, auto confirm checked)
--   3. ngo@example.com (password123, auto confirm checked)
--   4. admin@college.edu (password123, auto confirm checked)
-- 
-- THEN run this script to set their roles and profiles.
-- ============================================================================

-- ============================================================================
-- Step 1: Create demo student user profile
-- ============================================================================
INSERT INTO public.users (
  id,
  email,
  full_name,
  role,
  is_registered,
  created_at,
  updated_at
)
SELECT 
  id,
  email,
  'Demo Student',
  'student',
  true,
  now(),
  now()
FROM auth.users
WHERE email = 'student@college.edu'
AND NOT EXISTS (
  SELECT 1 FROM public.users WHERE email = 'student@college.edu'
);

-- ============================================================================
-- Step 2: Create demo manager user profile
-- ============================================================================
INSERT INTO public.users (
  id,
  email,
  full_name,
  role,
  is_registered,
  created_at,
  updated_at
)
SELECT 
  id,
  email,
  'Demo Manager',
  'manager',
  true,
  now(),
  now()
FROM auth.users
WHERE email = 'manager@college.edu'
AND NOT EXISTS (
  SELECT 1 FROM public.users WHERE email = 'manager@college.edu'
);

-- ============================================================================
-- Step 3: Create demo receiver (NGO) user profile
-- ============================================================================
INSERT INTO public.users (
  id,
  email,
  full_name,
  role,
  is_registered,
  created_at,
  updated_at
)
SELECT 
  id,
  email,
  'Demo Receiver',
  'receiver',
  true,
  now(),
  now()
FROM auth.users
WHERE email = 'ngo@example.com'
AND NOT EXISTS (
  SELECT 1 FROM public.users WHERE email = 'ngo@example.com'
);

-- ============================================================================
-- Step 4: Create demo admin user profile
-- ============================================================================
INSERT INTO public.users (
  id,
  email,
  full_name,
  role,
  is_registered,
  created_at,
  updated_at
)
SELECT 
  id,
  email,
  'Demo Admin',
  'admin',
  true,
  now(),
  now()
FROM auth.users
WHERE email = 'admin@college.edu'
AND NOT EXISTS (
  SELECT 1 FROM public.users WHERE email = 'admin@college.edu'
);

-- ============================================================================
-- Verification: Check if demo users were created successfully
-- ============================================================================
SELECT 
  email,
  full_name,
  role,
  is_registered,
  created_at
FROM public.users
WHERE email IN (
  'student@college.edu',
  'manager@college.edu',
  'ngo@example.com',
  'admin@college.edu'
)
ORDER BY created_at DESC;

-- ============================================================================
-- Expected Output:
-- ============================================================================
-- | email                 | full_name      | role     | is_registered | created_at                    |
-- |-----------------------|----------------|----------|---------------|-----------------------------|
-- | admin@college.edu     | Demo Admin     | admin    | true          | 2026-11-13 XX:XX:XX.XXX+00  |
-- | ngo@example.com       | Demo Receiver  | receiver | true          | 2026-11-13 XX:XX:XX.XXX+00  |
-- | manager@college.edu   | Demo Manager   | manager  | true          | 2026-11-13 XX:XX:XX.XXX+00  |
-- | student@college.edu   | Demo Student   | student  | true          | 2026-11-13 XX:XX:XX.XXX+00  |
-- 
-- If you see this, all demo users are ready! 🎉
-- ============================================================================
