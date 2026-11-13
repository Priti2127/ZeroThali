-- ============================================================
-- Create Test Users and Set Roles
-- Copy and paste this ENTIRE script into Supabase SQL Editor
-- ============================================================

-- Step 1: Create users in auth.users via Dashboard first, then update roles here

UPDATE public.users 
SET role = 'student', full_name = 'Test Student', hostel_name = 'Block A', room_number = '101' 
WHERE email = 'teststudent2024@college.edu';

UPDATE public.users 
SET role = 'manager', full_name = 'Test Manager' 
WHERE email = 'testmanager2024@college.edu';

UPDATE public.users 
SET role = 'receiver', full_name = 'Test Receiver 1', weekly_order_count = 0 
WHERE email = 'testreceiver1@college.edu';

UPDATE public.users 
SET role = 'receiver', full_name = 'Test Receiver 2', weekly_order_count = 0 
WHERE email = 'testreceiver2@college.edu';

-- Verify the updates
SELECT email, full_name, role, hostel_name 
FROM public.users 
WHERE email LIKE '%college.edu%' OR email LIKE '%testreceiver%'
ORDER BY role;
