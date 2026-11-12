-- ============================================================
-- ZeroThali Complete Production Schema
-- College Hostel Mess Management System
-- ============================================================

-- Enable necessary extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pg_cron";

-- -------------------------------------------------------
-- 1. ENUMS & TYPES
-- -------------------------------------------------------

create type user_role as enum ('student', 'manager', 'receiver', 'admin');
create type meal_type as enum ('breakfast', 'lunch', 'dinner');
create type confirmation_status as enum ('confirmed', 'skipped', 'unconfirmed');
create type leftover_status as enum ('available', 'sold_out', 'expired');
create type order_status as enum ('pending', 'paid', 'collected', 'expired', 'cancelled');
create type feedback_tag as enum ('too_salty', 'too_much_quantity', 'cold', 'undercooked', 'bland', 'perfect');

-- -------------------------------------------------------
-- 2. DROP EXISTING TABLES (Clean slate)
-- -------------------------------------------------------

drop table if exists public.audit_log cascade;
drop table if exists public.alerts cascade;
drop table if exists public.orders cascade;
drop table if exists public.leftovers cascade;
drop table if exists public.feedback cascade;
drop table if exists public.dishes cascade;
drop table if exists public.walkins cascade;
drop table if exists public.confirmations cascade;
drop table if exists public.meals cascade;
drop table if exists public.users cascade;
drop table if exists public.food_logs cascade;
drop table if exists public.messes cascade;
drop view if exists public.admin_kpi cascade;
drop view if exists public.biogas_queue cascade;

-- -------------------------------------------------------
-- 3. CORE TABLES
-- -------------------------------------------------------

-- Users table (extends Supabase auth.users)
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  phone text unique,
  full_name text not null,
  role user_role not null default 'student',
  hostel_name text,
  room_number text,
  is_registered boolean default true,
  weekly_order_count integer default 0,
  last_order_at timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Dishes master table
create table public.dishes (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  category text, -- Main Course, Side Dish, Dessert, etc.
  avg_wastage_kg numeric default 0,
  avg_rating numeric default 0,
  times_served integer default 0,
  created_at timestamp with time zone default now()
);

-- Meals table
create table public.meals (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  type meal_type not null,
  cutoff_time time not null,
  is_cutoff_locked boolean default false,
  menu jsonb, -- Array of dish names and quantities
  cooked_kg numeric,
  leftover_kg numeric,
  actual_registered_count integer default 0,
  actual_unregistered_count integer default 0,
  predicted_walkins integer,
  notes text, -- Special events, holidays, exams
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(date, type)
);

-- Confirmations (student meal choices)
create table public.confirmations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  meal_id uuid not null references public.meals(id) on delete cascade,
  status confirmation_status not null default 'unconfirmed',
  updated_at timestamp with time zone default now(),
  unique(user_id, meal_id)
);

-- Walk-ins (unregistered students log)
create table public.walkins (
  id uuid primary key default gen_random_uuid(),
  meal_id uuid not null references public.meals(id) on delete cascade,
  count integer not null default 0,
  logged_by uuid references public.users(id),
  logged_at timestamp with time zone default now()
);

-- Feedback on meals
create table public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  meal_id uuid not null references public.meals(id) on delete cascade,
  rating integer check (rating between 1 and 5) not null,
  tags feedback_tag[],
  comment text,
  created_at timestamp with time zone default now(),
  unique(user_id, meal_id)
);

-- Leftovers available for sale
create table public.leftovers (
  id uuid primary key default gen_random_uuid(),
  meal_id uuid not null references public.meals(id) on delete cascade,
  quantity_plates integer not null,
  available_plates integer not null,
  price_per_plate numeric not null,
  status leftover_status not null default 'available',
  alert_sent_at timestamp with time zone,
  created_at timestamp with time zone default now(),
  expires_at timestamp with time zone
);

-- Orders from receivers
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  leftover_id uuid not null references public.leftovers(id) on delete cascade,
  receiver_id uuid not null references public.users(id) on delete cascade,
  quantity integer not null,
  total_price numeric not null,
  pickup_code text not null unique,
  status order_status not null default 'pending',
  payment_id text,
  paid_at timestamp with time zone,
  collected_at timestamp with time zone,
  expires_at timestamp with time zone not null,
  created_at timestamp with time zone default now()
);

-- Alerts sent to receivers
create table public.alerts (
  id uuid primary key default gen_random_uuid(),
  leftover_id uuid references public.leftovers(id) on delete set null,
  receiver_ids uuid[],
  message text not null,
  sent_at timestamp with time zone default now()
);

-- Audit log
create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  action text not null,
  table_name text,
  record_id uuid,
  old_data jsonb,
  new_data jsonb,
  ip_address text,
  created_at timestamp with time zone default now()
);

-- -------------------------------------------------------
-- 4. INDEXES for Performance
-- -------------------------------------------------------

create index idx_users_role on public.users(role);
create index idx_users_email on public.users(email);
create index idx_meals_date_type on public.meals(date, type);
create index idx_confirmations_meal on public.confirmations(meal_id);
create index idx_confirmations_user on public.confirmations(user_id);
create index idx_feedback_meal on public.feedback(meal_id);
create index idx_leftovers_status on public.leftovers(status);
create index idx_orders_receiver on public.orders(receiver_id);
create index idx_orders_status on public.orders(status);
create index idx_orders_leftover on public.orders(leftover_id);

-- -------------------------------------------------------
-- 5. ROW LEVEL SECURITY POLICIES
-- -------------------------------------------------------

alter table public.users enable row level security;
alter table public.dishes enable row level security;
alter table public.meals enable row level security;
alter table public.confirmations enable row level security;
alter table public.walkins enable row level security;
alter table public.feedback enable row level security;
alter table public.leftovers enable row level security;
alter table public.orders enable row level security;
alter table public.alerts enable row level security;
alter table public.audit_log enable row level security;

-- Users policies
create policy "Users can read own profile" on public.users for select using (auth.uid() = id);
create policy "Users can update own profile" on public.users for update using (auth.uid() = id);
create policy "Managers and admins can read all users" on public.users for select 
  using (exists (select 1 from public.users where id = auth.uid() and role in ('manager', 'admin')));

-- Dishes policies (everyone can read)
create policy "Anyone can read dishes" on public.dishes for select using (true);
create policy "Managers can manage dishes" on public.dishes for all 
  using (exists (select 1 from public.users where id = auth.uid() and role in ('manager', 'admin')));

-- Meals policies
create policy "Anyone can read meals" on public.meals for select using (true);
create policy "Managers can manage meals" on public.meals for all 
  using (exists (select 1 from public.users where id = auth.uid() and role in ('manager', 'admin')));

-- Confirmations policies
create policy "Students can read own confirmations" on public.confirmations for select using (auth.uid() = user_id);
create policy "Students can insert own confirmations" on public.confirmations for insert with check (auth.uid() = user_id);
create policy "Students can update own confirmations" on public.confirmations for update using (auth.uid() = user_id);
create policy "Managers can read all confirmations" on public.confirmations for select 
  using (exists (select 1 from public.users where id = auth.uid() and role in ('manager', 'admin')));

-- Feedback policies
create policy "Students can insert own feedback" on public.feedback for insert with check (auth.uid() = user_id);
create policy "Anyone can read feedback" on public.feedback for select using (true);

-- Leftovers policies
create policy "Receivers and managers can read leftovers" on public.leftovers for select 
  using (exists (select 1 from public.users where id = auth.uid() and role in ('receiver', 'manager', 'admin')));
create policy "Managers can manage leftovers" on public.leftovers for all 
  using (exists (select 1 from public.users where id = auth.uid() and role in ('manager', 'admin')));

-- Orders policies
create policy "Receivers can read own orders" on public.orders for select using (auth.uid() = receiver_id);
create policy "Receivers can create orders" on public.orders for insert with check (auth.uid() = receiver_id);
create policy "Managers can read all orders" on public.orders for select 
  using (exists (select 1 from public.users where id = auth.uid() and role in ('manager', 'admin')));
create policy "Managers can update orders" on public.orders for update 
  using (exists (select 1 from public.users where id = auth.uid() and role in ('manager', 'admin')));

-- Audit log (admins only)
create policy "Admins can read audit log" on public.audit_log for select 
  using (exists (select 1 from public.users where id = auth.uid() and role = 'admin'));

-- -------------------------------------------------------
-- 6. FUNCTIONS
-- -------------------------------------------------------

-- Function to get predicted walk-ins for a meal
create or replace function get_predicted_walkins(
  p_meal_type meal_type,
  p_date date
)
returns integer as $$
declare
  v_weekday integer;
  v_avg numeric;
begin
  v_weekday := extract(dow from p_date);
  
  -- Weighted moving average of last 6 same-weekday same-meal records
  select coalesce(round(avg(w.count)), 0)
  into v_avg
  from (
    select wk.count
    from walkins wk
    join meals m on m.id = wk.meal_id
    where m.type = p_meal_type
      and extract(dow from m.date) = v_weekday
      and m.date < p_date
    order by m.date desc
    limit 6
  ) w;
  
  return v_avg::integer;
end;
$$ language plpgsql;

-- Function to lock meal confirmations at cutoff
create or replace function lock_meal_cutoff(p_meal_id uuid)
returns void as $$
begin
  update public.meals
  set is_cutoff_locked = true
  where id = p_meal_id;
end;
$$ language plpgsql;

-- Function to expire old orders
create or replace function expire_old_orders()
returns void as $$
begin
  -- Mark expired orders
  update public.orders
  set status = 'expired'
  where status = 'pending'
    and expires_at < now();
  
  -- Return quantity to leftovers
  update public.leftovers l
  set available_plates = available_plates + (
    select coalesce(sum(o.quantity), 0)
    from public.orders o
    where o.leftover_id = l.id
      and o.status = 'expired'
      and o.updated_at > now() - interval '1 minute'
  )
  where id in (
    select distinct leftover_id
    from public.orders
    where status = 'expired'
      and updated_at > now() - interval '1 minute'
  );
end;
$$ language plpgsql;

-- Function for atomic order placement
create or replace function place_leftover_order(
  p_leftover_id uuid,
  p_receiver_id uuid,
  p_quantity integer
)
returns jsonb as $$
declare
  v_available integer;
  v_price numeric;
  v_order_id uuid;
  v_pickup_code text;
  v_expires_at timestamp with time zone;
  v_weekly_count integer;
  v_last_order timestamp with time zone;
begin
  -- Check weekly limit (max 3 orders per week)
  select weekly_order_count, last_order_at
  into v_weekly_count, v_last_order
  from public.users
  where id = p_receiver_id;
  
  if v_weekly_count >= 3 then
    return jsonb_build_object('success', false, 'error', 'Weekly order limit reached (max 3)');
  end if;
  
  -- Check cooldown (at least 1 hour between orders)
  if v_last_order is not null and v_last_order > now() - interval '1 hour' then
    return jsonb_build_object('success', false, 'error', 'Please wait before placing another order');
  end if;
  
  -- Lock the row for update
  select available_plates, price_per_plate
  into v_available, v_price
  from public.leftovers
  where id = p_leftover_id
  for update;
  
  -- Check max 2 plates per order
  if p_quantity > 2 then
    return jsonb_build_object('success', false, 'error', 'Maximum 2 plates per order');
  end if;
  
  -- Check availability
  if v_available < p_quantity then
    return jsonb_build_object('success', false, 'error', 'Not enough plates available');
  end if;
  
  -- Update available quantity
  update public.leftovers
  set available_plates = available_plates - p_quantity,
      status = case when available_plates - p_quantity = 0 then 'sold_out'::leftover_status else status end
  where id = p_leftover_id;
  
  -- Generate pickup code
  v_pickup_code := upper(substring(md5(random()::text) from 1 for 6));
  v_expires_at := now() + interval '30 minutes';
  
  -- Create order
  insert into public.orders (
    leftover_id, receiver_id, quantity, total_price, 
    pickup_code, status, expires_at
  )
  values (
    p_leftover_id, p_receiver_id, p_quantity, v_price * p_quantity,
    v_pickup_code, 'pending', v_expires_at
  )
  returning id into v_order_id;
  
  -- Update user stats
  update public.users
  set weekly_order_count = weekly_order_count + 1,
      last_order_at = now()
  where id = p_receiver_id;
  
  return jsonb_build_object(
    'success', true,
    'order_id', v_order_id,
    'pickup_code', v_pickup_code,
    'expires_at', v_expires_at,
    'total_price', v_price * p_quantity
  );
end;
$$ language plpgsql;

-- Function to verify and collect order
create or replace function collect_order(
  p_pickup_code text,
  p_manager_id uuid
)
returns jsonb as $$
declare
  v_order_id uuid;
  v_status order_status;
begin
  -- Find order
  select id, status
  into v_order_id, v_status
  from public.orders
  where pickup_code = p_pickup_code;
  
  if v_order_id is null then
    return jsonb_build_object('success', false, 'error', 'Invalid pickup code');
  end if;
  
  if v_status != 'paid' then
    return jsonb_build_object('success', false, 'error', 'Order not paid');
  end if;
  
  -- Mark as collected
  update public.orders
  set status = 'collected', collected_at = now()
  where id = v_order_id;
  
  return jsonb_build_object('success', true, 'message', 'Order collected successfully');
end;
$$ language plpgsql;

-- Function to reset weekly order counts (runs every Monday)
create or replace function reset_weekly_order_counts()
returns void as $$
begin
  update public.users
  set weekly_order_count = 0
  where role = 'receiver';
end;
$$ language plpgsql;

-- -------------------------------------------------------
-- 7. TRIGGERS
-- -------------------------------------------------------

-- Update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_users_updated_at before update on public.users
  for each row execute function update_updated_at_column();

create trigger update_meals_updated_at before update on public.meals
  for each row execute function update_updated_at_column();

create trigger update_confirmations_updated_at before update on public.confirmations
  for each row execute function update_updated_at_column();

-- -------------------------------------------------------
-- 8. SEED DATA
-- -------------------------------------------------------

-- Note: This seed data is for demonstration only
-- In production, admin users should be created through proper signup flow

-- Sample dishes
insert into public.dishes (name, category, times_served) values
  ('Paneer Butter Masala', 'Main Course', 12),
  ('Dal Tadka', 'Main Course', 45),
  ('Jeera Rice', 'Rice', 60),
  ('Chapati', 'Bread', 80),
  ('Mixed Veg', 'Main Course', 35),
  ('Chole', 'Main Course', 28),
  ('Rajma', 'Main Course', 30),
  ('Aloo Paratha', 'Bread', 15),
  ('Sambar', 'Main Course', 20),
  ('Idli', 'Breakfast', 25),
  ('Dosa', 'Breakfast', 22),
  ('Poha', 'Breakfast', 18),
  ('Upma', 'Breakfast', 16),
  ('Gulab Jamun', 'Dessert', 10),
  ('Kheer', 'Dessert', 8)
on conflict (name) do nothing;

-- Sample meals for the next 7 days
do $$
declare
  v_date date;
  v_meal_id uuid;
begin
  for i in 0..6 loop
    v_date := current_date + i;
    
    -- Breakfast
    insert into public.meals (date, type, cutoff_time, menu, predicted_walkins)
    values (
      v_date,
      'breakfast',
      '07:00',
      jsonb_build_array(
        jsonb_build_object('dish', 'Poha', 'quantity_kg', 15),
        jsonb_build_object('dish', 'Bread Toast', 'quantity_kg', 8)
      ),
      12
    );
    
    -- Lunch
    insert into public.meals (date, type, cutoff_time, menu, predicted_walkins)
    values (
      v_date,
      'lunch',
      '11:00',
      jsonb_build_array(
        jsonb_build_object('dish', 'Dal Tadka', 'quantity_kg', 25),
        jsonb_build_object('dish', 'Jeera Rice', 'quantity_kg', 30),
        jsonb_build_object('dish', 'Mixed Veg', 'quantity_kg', 20),
        jsonb_build_object('dish', 'Chapati', 'quantity_kg', 15)
      ),
      18
    );
    
    -- Dinner
    insert into public.meals (date, type, cutoff_time, menu, predicted_walkins)
    values (
      v_date,
      'dinner',
      '16:00',
      jsonb_build_array(
        jsonb_build_object('dish', 'Rajma', 'quantity_kg', 28),
        jsonb_build_object('dish', 'Jeera Rice', 'quantity_kg', 32),
        jsonb_build_object('dish', 'Chapati', 'quantity_kg', 18)
      ),
      15
    );
  end loop;
end;
$$;

-- Instructions for creating test users:
-- 1. Go to Supabase Dashboard > Authentication > Users
-- 2. Create users with email/password or use Magic Link
-- 3. After creation, update their role in the users table:
--
-- Example SQL to set roles (run after users sign up):
-- update public.users set role = 'manager', full_name = 'Mess Manager' where email = 'manager@college.edu';
-- update public.users set role = 'receiver', full_name = 'NGO Representative' where email = 'ngo@example.com';
-- update public.users set role = 'admin', full_name = 'System Admin' where email = 'admin@college.edu';
-- update public.users set role = 'student', full_name = 'Student Name', hostel_name = 'Hostel A', room_number = '101' where email = 'student@college.edu';

