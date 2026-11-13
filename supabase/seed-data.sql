-- ============================================================
-- ZeroThali Complete Seed Data
-- Run this AFTER creating users in Supabase Auth dashboard
-- College Hostel Mess Management System
-- ============================================================

-- -------------------------------------------------------
-- STEP 1: Run schema-complete.sql first
-- -------------------------------------------------------

-- -------------------------------------------------------
-- STEP 2: Seed demo data (run after schema setup)
-- -------------------------------------------------------

-- Sample dishes (already in schema-complete.sql)
-- Additional dishes
INSERT INTO public.dishes (name, category, avg_wastage_kg, avg_rating, times_served) VALUES
  ('Paneer Butter Masala', 'Main Course', 2.3, 4.2, 12),
  ('Dal Tadka', 'Main Course', 1.1, 4.5, 45),
  ('Jeera Rice', 'Rice', 0.8, 4.3, 60),
  ('Chapati', 'Bread', 0.3, 4.1, 80),
  ('Mixed Veg', 'Main Course', 1.5, 3.8, 35),
  ('Chole', 'Main Course', 1.8, 4.0, 28),
  ('Rajma', 'Main Course', 2.1, 4.4, 30),
  ('Aloo Paratha', 'Bread', 0.6, 4.6, 15),
  ('Sambar', 'Main Course', 0.9, 3.9, 20),
  ('Idli', 'Breakfast', 0.4, 4.2, 25),
  ('Dosa', 'Breakfast', 0.5, 4.5, 22),
  ('Poha', 'Breakfast', 0.3, 4.0, 18),
  ('Upma', 'Breakfast', 0.4, 3.7, 16),
  ('Gulab Jamun', 'Dessert', 0.2, 4.8, 10),
  ('Kheer', 'Dessert', 0.3, 4.6, 8),
  ('Aloo Sabzi', 'Main Course', 1.2, 3.9, 25),
  ('Pav Bhaji', 'Main Course', 0.7, 4.3, 14),
  ('Bread Toast', 'Breakfast', 0.5, 3.5, 30)
ON CONFLICT (name) DO UPDATE SET
  avg_wastage_kg = EXCLUDED.avg_wastage_kg,
  avg_rating = EXCLUDED.avg_rating,
  times_served = EXCLUDED.times_served;

-- -------------------------------------------------------
-- STEP 3: Meals for today and next 7 days
-- -------------------------------------------------------
DO $$
DECLARE
  v_date date;
  v_menu jsonb;
BEGIN
  FOR i IN 0..7 LOOP
    v_date := current_date + i;

    -- Breakfast
    INSERT INTO public.meals (date, type, cutoff_time, is_cutoff_locked, menu, cooked_kg, leftover_kg, predicted_walkins)
    VALUES (
      v_date,
      'breakfast',
      '07:30',
      (i = 0 AND current_time > '07:30'::time),
      CASE (EXTRACT(DOW FROM v_date)::int % 3)
        WHEN 0 THEN '[{"dish":"Poha","quantity_kg":15},{"dish":"Bread Toast","quantity_kg":8}]'::jsonb
        WHEN 1 THEN '[{"dish":"Idli","quantity_kg":12},{"dish":"Sambar","quantity_kg":10}]'::jsonb
        ELSE '[{"dish":"Upma","quantity_kg":14},{"dish":"Dosa","quantity_kg":11}]'::jsonb
      END,
      CASE WHEN i < 2 THEN 25.0 ELSE NULL END,
      CASE WHEN i < 2 THEN (1.5 + random() * 2)::numeric(5,2) ELSE NULL END,
      12 + (random() * 8)::int
    )
    ON CONFLICT (date, type) DO NOTHING;

    -- Lunch
    INSERT INTO public.meals (date, type, cutoff_time, is_cutoff_locked, menu, cooked_kg, leftover_kg, predicted_walkins)
    VALUES (
      v_date,
      'lunch',
      '11:00',
      (i = 0 AND current_time > '11:00'::time),
      CASE (EXTRACT(DOW FROM v_date)::int % 3)
        WHEN 0 THEN '[{"dish":"Dal Tadka","quantity_kg":25},{"dish":"Jeera Rice","quantity_kg":30},{"dish":"Mixed Veg","quantity_kg":20},{"dish":"Chapati","quantity_kg":15}]'::jsonb
        WHEN 1 THEN '[{"dish":"Rajma","quantity_kg":28},{"dish":"Jeera Rice","quantity_kg":32},{"dish":"Chapati","quantity_kg":18},{"dish":"Aloo Sabzi","quantity_kg":15}]'::jsonb
        ELSE '[{"dish":"Chole","quantity_kg":25},{"dish":"Jeera Rice","quantity_kg":28},{"dish":"Chapati","quantity_kg":16},{"dish":"Gulab Jamun","quantity_kg":5}]'::jsonb
      END,
      CASE WHEN i < 2 THEN 95.0 ELSE NULL END,
      CASE WHEN i < 2 THEN (3.0 + random() * 5)::numeric(5,2) ELSE NULL END,
      18 + (random() * 10)::int
    )
    ON CONFLICT (date, type) DO NOTHING;

    -- Dinner
    INSERT INTO public.meals (date, type, cutoff_time, is_cutoff_locked, menu, cooked_kg, leftover_kg, predicted_walkins)
    VALUES (
      v_date,
      'dinner',
      '16:00',
      (i = 0 AND current_time > '16:00'::time),
      CASE (EXTRACT(DOW FROM v_date)::int % 3)
        WHEN 0 THEN '[{"dish":"Paneer Butter Masala","quantity_kg":22},{"dish":"Jeera Rice","quantity_kg":30},{"dish":"Chapati","quantity_kg":18},{"dish":"Kheer","quantity_kg":8}]'::jsonb
        WHEN 1 THEN '[{"dish":"Dal Tadka","quantity_kg":25},{"dish":"Jeera Rice","quantity_kg":28},{"dish":"Aloo Paratha","quantity_kg":20}]'::jsonb
        ELSE '[{"dish":"Rajma","quantity_kg":28},{"dish":"Jeera Rice","quantity_kg":32},{"dish":"Chapati","quantity_kg":18},{"dish":"Gulab Jamun","quantity_kg":6}]'::jsonb
      END,
      CASE WHEN i < 2 THEN 100.0 ELSE NULL END,
      CASE WHEN i < 2 THEN (2.5 + random() * 4)::numeric(5,2) ELSE NULL END,
      15 + (random() * 8)::int
    )
    ON CONFLICT (date, type) DO NOTHING;
  END LOOP;
END;
$$;

-- -------------------------------------------------------
-- STEP 4: Historical walkins for prediction
-- -------------------------------------------------------
DO $$
DECLARE
  v_meal_id uuid;
  v_date date;
BEGIN
  FOR i IN 1..30 LOOP
    v_date := current_date - i;
    FOR v_type IN SELECT unnest(ARRAY['breakfast','lunch','dinner']) LOOP
      SELECT id INTO v_meal_id FROM public.meals WHERE date = v_date AND type = v_type::meal_type;
      IF NOT FOUND THEN
        INSERT INTO public.meals (date, type, cutoff_time, is_cutoff_locked, cooked_kg, leftover_kg, predicted_walkins)
        VALUES (v_date, v_type::meal_type, 
          CASE v_type WHEN 'breakfast' THEN '07:30' WHEN 'lunch' THEN '11:00' ELSE '16:00' END,
          true,
          CASE v_type WHEN 'breakfast' THEN 25.0 WHEN 'lunch' THEN 95.0 ELSE 100.0 END,
          (1.0 + random() * 5)::numeric(5,2),
          (10 + random() * 15)::int
        ) RETURNING id INTO v_meal_id;
      END IF;
      
      IF v_meal_id IS NOT NULL THEN
        INSERT INTO public.walkins (meal_id, count, logged_at)
        VALUES (v_meal_id, (8 + random() * 20)::int, (v_date + 
          CASE v_type WHEN 'breakfast' THEN interval '8 hours'
                      WHEN 'lunch' THEN interval '13 hours'
                      ELSE interval '20 hours' END))
        ON CONFLICT DO NOTHING;
      END IF;
    END LOOP;
  END LOOP;
END;
$$;

-- -------------------------------------------------------
-- STEP 5: Create demo users (DO THIS VIA SUPABASE AUTH DASHBOARD)
-- After creating in Auth, run these updates:
-- -------------------------------------------------------

/*
-- After signing up these emails via the app or Supabase Auth:
-- student@zerothali.edu / ZeroThali@123
-- manager@zerothali.edu / ZeroThali@123
-- ngo@zerothali.org / ZeroThali@123
-- admin@zerothali.edu / ZeroThali@123

UPDATE public.users SET 
  full_name = 'Rahul Sharma',
  role = 'student',
  hostel_name = 'Block A',
  room_number = '204',
  is_registered = true
WHERE email = 'student@zerothali.edu';

UPDATE public.users SET 
  full_name = 'Suresh Kumar (Mess Manager)',
  role = 'manager',
  hostel_name = 'Central Kitchen'
WHERE email = 'manager@zerothali.edu';

UPDATE public.users SET 
  full_name = 'Ananya NGO Trust',
  role = 'receiver'
WHERE email = 'ngo@zerothali.org';

UPDATE public.users SET 
  full_name = 'Admin',
  role = 'admin'
WHERE email = 'admin@zerothali.edu';
*/

-- -------------------------------------------------------
-- STEP 6: Sample leftover alert (after creating users)
-- -------------------------------------------------------
/*
INSERT INTO public.leftovers (meal_id, quantity_plates, available_plates, price_per_plate, status, expires_at)
SELECT 
  m.id,
  12,
  12,
  10.00,
  'available',
  now() + interval '1 hour'
FROM public.meals m
WHERE m.date = current_date AND m.type = 'lunch'
LIMIT 1;
*/

-- -------------------------------------------------------
-- VERIFY: Check data was inserted
-- -------------------------------------------------------
SELECT 'meals' as table_name, count(*) as count FROM public.meals
UNION ALL SELECT 'dishes', count(*) FROM public.dishes
UNION ALL SELECT 'walkins', count(*) FROM public.walkins;
