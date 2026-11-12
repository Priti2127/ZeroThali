-- ============================================================
-- ZeroThali Complete Schema
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- -------------------------------------------------------
-- 1. Tables
-- -------------------------------------------------------

-- Drop old tables if they exist (for a clean slate)
drop table if exists public.food_logs cascade;
drop table if exists public.messes cascade;
drop view if exists public.admin_kpi;
drop view if exists public.biogas_queue;

-- Mess halls
create table public.messes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamp with time zone default now()
);

-- Food logs
create table public.food_logs (
  id uuid primary key default gen_random_uuid(),
  mess_id uuid references public.messes(id) on delete set null,
  staff_id uuid,
  food_item text not null,
  quantity_kg numeric not null,
  cooked_at timestamp with time zone,
  condition text check (condition in ('edible','unfit')) not null,
  photo_url text,
  status text check (status in ('available','claimed','collected','biogas')) not null default 'available',
  claim_code text,
  claimed_by uuid,
  claimed_at timestamp with time zone,
  collected_at timestamp with time zone,
  collection_photo text,
  created_at timestamp with time zone default now()
);

-- -------------------------------------------------------
-- 2. Row Level Security
-- -------------------------------------------------------

alter table public.messes enable row level security;
alter table public.food_logs enable row level security;

-- Allow anyone (anon + authenticated) to read messes
create policy "Anyone can read messes"
  on public.messes for select
  using (true);

-- Allow anyone to read food_logs
create policy "Anyone can read food_logs"
  on public.food_logs for select
  using (true);

-- Allow authenticated users to insert food logs
create policy "Auth users can insert food_logs"
  on public.food_logs for insert
  to authenticated
  with check (true);

-- Allow authenticated users to update food logs
create policy "Auth users can update food_logs"
  on public.food_logs for update
  to authenticated
  using (true);

-- -------------------------------------------------------
-- 3. Views
-- -------------------------------------------------------

-- Admin KPI view
create or replace view public.admin_kpi as
select
  count(*) filter (where condition = 'edible') as total_edible,
  coalesce(sum(quantity_kg) filter (where condition = 'edible'), 0) as kg_edible,
  count(*) filter (where condition = 'unfit') as total_unfit,
  coalesce(sum(quantity_kg) filter (where condition = 'unfit'), 0) as kg_unfit,
  round(coalesce(sum(quantity_kg) filter (where condition = 'unfit'), 0) * 0.12, 2) as biogas_m3,
  round(coalesce(sum(quantity_kg) filter (where condition = 'unfit'), 0) * 0.12 * 0.43, 2) as lpg_kg_saved
from public.food_logs;

-- Biogas queue view (unfit items not yet loaded)
create or replace view public.biogas_queue as
select
  fl.id,
  fl.mess_id,
  m.name as mess_name,
  fl.food_item,
  fl.quantity_kg,
  fl.created_at
from public.food_logs fl
left join public.messes m on m.id = fl.mess_id
where fl.condition = 'unfit'
  and fl.status != 'biogas';

-- -------------------------------------------------------
-- 4. Seed data
-- -------------------------------------------------------

insert into public.messes (name) values
  ('Main Mess'),
  ('North Mess'),
  ('South Mess')
on conflict do nothing;

insert into public.food_logs (mess_id, food_item, quantity_kg, cooked_at, condition, status)
values
  (
    (select id from public.messes where name = 'Main Mess' limit 1),
    'Veg Curry',
    5,
    now() - interval '1 hour',
    'edible',
    'available'
  ),
  (
    (select id from public.messes where name = 'North Mess' limit 1),
    'Dal',
    3,
    now() - interval '2 hours',
    'edible',
    'available'
  ),
  (
    (select id from public.messes where name = 'South Mess' limit 1),
    'Stale Rice',
    8,
    now() - interval '6 hours',
    'unfit',
    'available'
  );
