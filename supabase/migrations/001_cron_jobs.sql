-- ============================================================
-- ZeroThali Cron Jobs and Additional Functions
-- Run this in Supabase SQL Editor after schema-complete.sql
-- ============================================================

-- Enable pg_cron extension (if not already enabled)
create extension if not exists pg_cron;

-- -------------------------------------------------------
-- 1. Function to lock today's meal at cutoff
-- -------------------------------------------------------

create or replace function lock_meal_cutoff_today(p_meal_type meal_type)
returns void as $$
declare
  v_meal_id uuid;
  v_cutoff time;
  v_current_time time;
begin
  v_current_time := current_time;
  
  -- Get today's meal of this type
  select id, cutoff_time
  into v_meal_id, v_cutoff
  from public.meals
  where date = current_date
    and type = p_meal_type
    and is_cutoff_locked = false;
  
  -- If meal exists and we're past cutoff, lock it
  if v_meal_id is not null and v_current_time >= v_cutoff then
    update public.meals
    set is_cutoff_locked = true
    where id = v_meal_id;
    
    raise notice 'Locked % meal for % at %', p_meal_type, current_date, v_current_time;
  end if;
end;
$$ language plpgsql;

-- -------------------------------------------------------
-- 2. Enhanced expire_old_orders with better logging
-- -------------------------------------------------------

create or replace function expire_old_orders()
returns void as $$
declare
  v_expired_count integer;
begin
  -- Mark expired orders and return plates to leftovers in one transaction
  with expired_orders as (
    update public.orders
    set status = 'expired'
    where status = 'pending'
      and expires_at < now()
    returning id, leftover_id, quantity
  ),
  returned_plates as (
    update public.leftovers l
    set 
      available_plates = available_plates + coalesce(
        (select sum(e.quantity) from expired_orders e where e.leftover_id = l.id), 
        0
      ),
      status = case 
        when status = 'sold_out' and 
             available_plates + coalesce(
               (select sum(e.quantity) from expired_orders e where e.leftover_id = l.id), 
               0
             ) > 0 
        then 'available'::leftover_status
        else status
      end
    where id in (select distinct leftover_id from expired_orders)
    returning id
  )
  select count(*) into v_expired_count from expired_orders;
  
  if v_expired_count > 0 then
    raise notice 'Expired % orders and returned plates to pool', v_expired_count;
  end if;
end;
$$ language plpgsql;

-- -------------------------------------------------------
-- 3. Schedule Cron Jobs
-- -------------------------------------------------------

-- Clean up existing cron jobs (if re-running)
select cron.unschedule('lock-breakfast');
select cron.unschedule('lock-lunch');
select cron.unschedule('lock-dinner');
select cron.unschedule('expire-orders');
select cron.unschedule('reset-weekly-orders');

-- Lock breakfast at 7:30 AM every day
select cron.schedule(
  'lock-breakfast',
  '30 7 * * *',
  $$select lock_meal_cutoff_today('breakfast')$$
);

-- Lock lunch at 11:00 AM every day
select cron.schedule(
  'lock-lunch',
  '0 11 * * *',
  $$select lock_meal_cutoff_today('lunch')$$
);

-- Lock dinner at 4:00 PM every day
select cron.schedule(
  'lock-dinner',
  '0 16 * * *',
  $$select lock_meal_cutoff_today('dinner')$$
);

-- Expire old orders every 5 minutes
select cron.schedule(
  'expire-orders',
  '*/5 * * * *',
  $$select expire_old_orders()$$
);

-- Reset weekly order counts every Monday at midnight
select cron.schedule(
  'reset-weekly-orders',
  '0 0 * * 1',
  $$select reset_weekly_order_counts()$$
);

-- -------------------------------------------------------
-- 4. Verify cron jobs are scheduled
-- -------------------------------------------------------

select * from cron.job order by jobname;

-- -------------------------------------------------------
-- 5. Additional helper functions
-- -------------------------------------------------------

-- Function to get manager dashboard stats
create or replace function get_manager_stats(p_date date default current_date)
returns jsonb as $$
declare
  v_stats jsonb;
begin
  with today_meals as (
    select id, type from public.meals where date = p_date
  ),
  confirmation_counts as (
    select 
      count(*) filter (where c.status = 'confirmed') as confirmed,
      count(*) filter (where c.status = 'skipped') as skipped,
      count(*) filter (where c.status = 'unconfirmed') as unconfirmed
    from public.confirmations c
    where c.meal_id in (select id from today_meals)
  ),
  predicted_total as (
    select coalesce(sum(predicted_walkins), 0) as walkins
    from public.meals
    where date = p_date
  ),
  recent_wastage as (
    select coalesce(sum(leftover_kg), 0) as total_kg
    from public.meals
    where date >= p_date - 7 and leftover_kg is not null
  ),
  recent_feedback as (
    select coalesce(avg(f.rating), 0) as avg_rating
    from public.feedback f
    join public.meals m on m.id = f.meal_id
    where m.date >= p_date - 7
  ),
  leftover_revenue as (
    select coalesce(sum(o.total_price), 0) as revenue
    from public.orders o
    join public.leftovers l on l.id = o.leftover_id
    join public.meals m on m.id = l.meal_id
    where m.date >= p_date - 30 and o.status = 'collected'
  )
  select jsonb_build_object(
    'confirmed', (select confirmed from confirmation_counts),
    'skipped', (select skipped from confirmation_counts),
    'unconfirmed', (select unconfirmed from confirmation_counts),
    'predicted_walkins', (select walkins from predicted_total),
    'total_expected', (select confirmed from confirmation_counts) + (select walkins from predicted_total),
    'recent_wastage_kg', (select total_kg from recent_wastage),
    'recent_feedback_avg', round((select avg_rating from recent_feedback)::numeric, 2),
    'leftover_revenue', (select revenue from leftover_revenue)
  ) into v_stats;
  
  return v_stats;
end;
$$ language plpgsql;

-- Function to get admin dashboard stats
create or replace function get_admin_stats()
returns jsonb as $$
declare
  v_stats jsonb;
begin
  with user_counts as (
    select 
      count(*) as total,
      count(*) filter (where role = 'student') as students,
      count(*) filter (where role = 'receiver') as receivers,
      count(*) filter (where role = 'manager') as managers
    from public.users
  ),
  meal_stats as (
    select 
      count(distinct date) as meals_served,
      coalesce(sum(leftover_kg), 0) as total_wastage,
      coalesce(avg(leftover_kg), 0) as avg_wastage
    from public.meals
    where leftover_kg is not null
  ),
  this_month_wastage as (
    select coalesce(avg(leftover_kg), 0) as avg_kg
    from public.meals
    where date >= date_trunc('month', current_date)
      and leftover_kg is not null
  ),
  last_month_wastage as (
    select coalesce(avg(leftover_kg), 0) as avg_kg
    from public.meals
    where date >= date_trunc('month', current_date - interval '1 month')
      and date < date_trunc('month', current_date)
      and leftover_kg is not null
  ),
  wastage_trend as (
    select case 
      when (select avg_kg from last_month_wastage) = 0 then 0
      else round(
        (((select avg_kg from this_month_wastage) - (select avg_kg from last_month_wastage)) 
         / (select avg_kg from last_month_wastage) * 100)::numeric, 
        1
      )
    end as trend_percent
  ),
  meals_saved as (
    select count(*) as saved_count
    from public.orders
    where status = 'collected'
  ),
  avg_rating as (
    select coalesce(avg(rating), 0) as rating
    from public.feedback
  )
  select jsonb_build_object(
    'total_users', (select total from user_counts),
    'total_students', (select students from user_counts),
    'total_receivers', (select receivers from user_counts),
    'total_managers', (select managers from user_counts),
    'total_meals_served', (select meals_served from meal_stats),
    'total_wastage_kg', round((select total_wastage from meal_stats)::numeric, 2),
    'avg_wastage_kg', round((select avg_wastage from meal_stats)::numeric, 2),
    'wastage_trend_percent', (select trend_percent from wastage_trend),
    'meals_saved', (select saved_count from meals_saved),
    'avg_rating', round((select rating from avg_rating)::numeric, 2)
  ) into v_stats;
  
  return v_stats;
end;
$$ language plpgsql;

-- -------------------------------------------------------
-- 6. Grant necessary permissions
-- -------------------------------------------------------

-- Allow authenticated users to call dashboard functions
grant execute on function get_manager_stats to authenticated;
grant execute on function get_admin_stats to authenticated;

-- -------------------------------------------------------
-- INSTRUCTIONS FOR SETUP
-- -------------------------------------------------------

-- 1. Run this entire script in Supabase SQL Editor
-- 2. Verify cron jobs: SELECT * FROM cron.job;
-- 3. To manually trigger a job: SELECT cron.run_job('job-name');
-- 4. To check job history: SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;
-- 5. The jobs will run automatically at scheduled times

-- Test the functions manually:
-- SELECT lock_meal_cutoff_today('breakfast');
-- SELECT expire_old_orders();
-- SELECT get_manager_stats(current_date);
-- SELECT get_admin_stats();

