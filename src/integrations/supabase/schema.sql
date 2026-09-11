-- ==============================================================================
-- MEDORA PLATFORM - POSTGRESQL & SUPABASE PRODUCTION SCHEMA & SEED DATA
-- Multi-tenant Healthcare Intelligence & Medicine Platform
-- ==============================================================================

-- Enable UUID and cryptographic extensions
create extension if not exists "uuid-ossp";

-- 1. App Roles Enum
do $$
begin
  if not exists (select 1 from pg_type where typname = 'app_role') then
    create type app_role as enum ('patient', 'pharmacy', 'doctor', 'admin');
  end if;
end $$;

-- 2. User Roles Table & RBAC Helper Function
create table if not exists public.user_roles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null default 'patient',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (user_id, role)
);

alter table public.user_roles enable row level security;

-- RBAC helper function has_role(role, user_id)
create or replace function public.has_role(_role app_role, _user_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  );
$$;

-- User roles RLS
create policy "Users can view own roles or admins view all"
  on public.user_roles for select
  using (auth.uid() = user_id or public.has_role('admin', auth.uid()));

create policy "Admins can manage user roles"
  on public.user_roles for all
  using (public.has_role('admin', auth.uid()));

-- 3. User Profiles Table
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text,
  email text,
  city text,
  phone text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.profiles enable row level security;

-- Profiles RLS
create policy "Users can view own profile or admins view all"
  on public.profiles for select
  using (auth.uid() = id or public.has_role('admin', auth.uid()) or public.has_role('doctor', auth.uid()));

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id or public.has_role('admin', auth.uid()));

-- Trigger to automatically create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, city)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    'Mumbai'
  )
  on conflict (id) do update set email = excluded.email;

  insert into public.user_roles (user_id, role)
  values (new.id, 'patient')
  on conflict (user_id, role) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 4. Orders Table
create table if not exists public.orders (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  pharmacy_id text not null,
  pharmacy_name text not null,
  placed_at timestamp with time zone default timezone('utc'::text, now()) not null,
  items jsonb not null default '[]'::jsonb,
  total numeric(10, 2) not null default 0.00,
  fulfilment text not null default 'pickup',
  prescription_id text,
  status text not null default 'accepted',
  timeline jsonb not null default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.orders enable row level security;

create policy "Patients view own orders"
  on public.orders for select
  using (
    auth.uid() = user_id
    or public.has_role('admin', auth.uid())
    or public.has_role('pharmacy', auth.uid())
    or public.has_role('doctor', auth.uid())
  );

create policy "Patients insert own orders"
  on public.orders for insert
  with check (auth.uid() = user_id or public.has_role('admin', auth.uid()));

create policy "Staff update orders"
  on public.orders for update
  using (
    auth.uid() = user_id
    or public.has_role('admin', auth.uid())
    or public.has_role('pharmacy', auth.uid())
  );

-- 5. Reminders Table
create table if not exists public.reminders (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  medicine_name text not null,
  strength text not null,
  times text[] not null default '{}',
  start_date date not null default current_date,
  end_date date,
  instruction text,
  source_prescription_id text,
  active boolean not null default true,
  log jsonb not null default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.reminders enable row level security;

create policy "Patients manage own reminders"
  on public.reminders for all
  using (auth.uid() = user_id or public.has_role('admin', auth.uid()));

-- 6. Prescriptions Table
create table if not exists public.prescriptions (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  file_name text not null,
  uploaded_at timestamp with time zone default timezone('utc'::text, now()) not null,
  prescriber_name text,
  status text not null default 'extracted',
  patient_name text,
  items jsonb not null default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.prescriptions enable row level security;

create policy "Prescription access policy"
  on public.prescriptions for select
  using (
    auth.uid() = user_id
    or public.has_role('pharmacy', auth.uid())
    or public.has_role('doctor', auth.uid())
    or public.has_role('admin', auth.uid())
  );

create policy "Patients insert prescriptions"
  on public.prescriptions for insert
  with check (auth.uid() = user_id or public.has_role('admin', auth.uid()));

create policy "Clinical staff update prescriptions"
  on public.prescriptions for update
  using (
    auth.uid() = user_id
    or public.has_role('pharmacy', auth.uid())
    or public.has_role('doctor', auth.uid())
    or public.has_role('admin', auth.uid())
  );

-- 7. Lab Reports Table
create table if not exists public.lab_reports (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  file_name text not null,
  uploaded_at timestamp with time zone default timezone('utc'::text, now()) not null,
  panel text not null,
  values jsonb not null default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.lab_reports enable row level security;

create policy "Lab reports access policy"
  on public.lab_reports for select
  using (
    auth.uid() = user_id
    or public.has_role('doctor', auth.uid())
    or public.has_role('admin', auth.uid())
  );

create policy "Patients insert own lab reports"
  on public.lab_reports for insert
  with check (auth.uid() = user_id or public.has_role('admin', auth.uid()));

-- 8. Pharmaceutical Catalog & Medicines Table
create table if not exists public.medicines (
  id text primary key,
  brand_name text not null,
  generic_name text not null,
  composition_key text not null,
  form text not null,
  pack_size text not null,
  manufacturer text not null,
  prescription_only boolean not null default false,
  active_ingredients jsonb not null default '[]'::jsonb,
  common_side_effects text[] not null default '{}',
  warnings text[] not null default '{}',
  uses_summary text not null default '',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.medicines enable row level security;

create policy "Medicines public read"
  on public.medicines for select
  using (true);

create policy "Medicines admin manage"
  on public.medicines for all
  using (public.has_role('admin', auth.uid()));

-- 9. Pharmacies Table
create table if not exists public.pharmacies (
  id text primary key,
  name text not null,
  address text not null,
  city text not null,
  phone text not null,
  latitude numeric(10, 6) not null,
  longitude numeric(10, 6) not null,
  rating numeric(3, 1) not null default 4.5,
  opens_at text not null default '08:00',
  closes_at text not null default '22:00',
  offers_delivery boolean not null default true,
  offers_pickup boolean not null default true,
  license_status text not null default 'verified',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.pharmacies enable row level security;

create policy "Pharmacies public read"
  on public.pharmacies for select
  using (true);

create policy "Pharmacies admin manage"
  on public.pharmacies for all
  using (public.has_role('admin', auth.uid()));

-- 10. Price Listings Table
create table if not exists public.price_listings (
  id text primary key,
  medicine_id text references public.medicines(id) on delete cascade not null,
  pharmacy_id text references public.pharmacies(id) on delete cascade not null,
  price numeric(10, 2) not null,
  currency text not null default 'INR',
  pack_size text not null,
  availability text not null default 'in_stock',
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.price_listings enable row level security;

create policy "Price listings public read"
  on public.price_listings for select
  using (true);

-- 11. Audit Events Table
create table if not exists public.audit_events (
  id text primary key,
  at timestamp with time zone default timezone('utc'::text, now()) not null,
  actor text not null,
  role text,
  category text,
  action text not null,
  target text not null,
  ip text not null default '127.0.0.1',
  status text default 'success',
  details text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.audit_events enable row level security;

create policy "Admins read audit logs"
  on public.audit_events for select
  using (public.has_role('admin', auth.uid()));

create policy "All insert audit logs"
  on public.audit_events for insert
  with check (true);

-- ==============================================================================
-- SEED DATA: POPULATE MEDICINES, PHARMACIES & PRICE LISTINGS
-- ==============================================================================

insert into public.medicines (id, brand_name, generic_name, composition_key, form, pack_size, manufacturer, prescription_only, active_ingredients, common_side_effects, warnings, uses_summary)
values
  ('med-dolo-650-tab', 'Dolo 650', 'Paracetamol', 'paracetamol|650 mg|Tablet', 'Tablet', '15 tablets', 'Micro Labs Ltd', false, '[{"name": "Paracetamol", "strength": "650 mg"}]'::jsonb, ARRAY['Nausea', 'Mild stomach upset'], ARRAY['Do not exceed 4000 mg in 24 hours', 'Avoid alcohol while taking paracetamol'], 'Fever reduction and mild-to-moderate pain relief.'),
  ('med-calpol-650-tab', 'Calpol 650', 'Paracetamol', 'paracetamol|650 mg|Tablet', 'Tablet', '15 tablets', 'GSK Consumer Healthcare', false, '[{"name": "Paracetamol", "strength": "650 mg"}]'::jsonb, ARRAY['Mild nausea', 'Allergic skin rash (rare)'], ARRAY['Liver toxicity risk at high doses', 'Check for other paracetamol-containing products'], 'Antipyretic and analgesic for pain and fever.'),
  ('med-crocin-650-tab', 'Crocin 650 Advance', 'Paracetamol', 'paracetamol|650 mg|Tablet', 'Tablet', '15 tablets', 'GlaxoSmithKline', false, '[{"name": "Paracetamol", "strength": "650 mg"}]'::jsonb, ARRAY['Nausea', 'Drowsiness (rare)'], ARRAY['Max daily dose 4g', 'Consult physician in liver impairment'], 'Fast-release fever and body ache management.'),
  ('med-augmentin-625-tab', 'Augmentin 625 Duo', 'Amoxicillin + Clavulanic Acid', 'amoxicillin+clavulanate|625 mg|Tablet', 'Tablet', '10 tablets', 'GSK Pharmaceuticals', true, '[{"name": "Amoxicillin", "strength": "500 mg"}, {"name": "Clavulanic Acid", "strength": "125 mg"}]'::jsonb, ARRAY['Diarrhea', 'Nausea', 'Vomiting', 'Skin rash'], ARRAY['Complete full antibiotic course', 'Contraindicated in penicillin allergy'], 'Broad-spectrum antibiotic for bacterial infections of respiratory tract, ENT, and skin.'),
  ('med-moxikind-cv-625-tab', 'Moxikind-CV 625', 'Amoxicillin + Clavulanic Acid', 'amoxicillin+clavulanate|625 mg|Tablet', 'Tablet', '10 tablets', 'Mankind Pharma', true, '[{"name": "Amoxicillin", "strength": "500 mg"}, {"name": "Clavulanic Acid", "strength": "125 mg"}]'::jsonb, ARRAY['Loose stools', 'Stomach discomfort'], ARRAY['Do not stop early even if feeling better', 'Take with meals to reduce GI irritation'], 'Equivalent amoxicillin-clavulanate formulation for bacterial infections.'),
  ('med-azithral-500-tab', 'Azithral 500', 'Azithromycin', 'azithromycin|500 mg|Tablet', 'Tablet', '5 tablets', 'Alembic Pharmaceuticals', true, '[{"name": "Azithromycin", "strength": "500 mg"}]'::jsonb, ARRAY['Diarrhea', 'Abdominal pain', 'Headache'], ARRAY['Take 1 hour before or 2 hours after meals', 'May cause QT interval prolongation'], 'Macrolide antibiotic for throat infections, pneumonia, and sinusitis.'),
  ('med-glycomet-gp1-tab', 'Glycomet GP 1', 'Metformin + Glimepiride', 'metformin+glimepiride|500mg+1mg|Tablet', 'Tablet', '15 tablets', 'USV Ltd', true, '[{"name": "Metformin", "strength": "500 mg"}, {"name": "Glimepiride", "strength": "1 mg"}]'::jsonb, ARRAY['Hypoglycemia', 'Flatulence', 'Metallic taste'], ARRAY['Regular blood sugar monitoring required', 'Take with morning breakfast'], 'Dual-action oral anti-diabetic medication for Type 2 Diabetes.')
on conflict (id) do nothing;

insert into public.pharmacies (id, name, address, city, phone, latitude, longitude, rating, opens_at, closes_at, offers_delivery, offers_pickup, license_status)
values
  ('ph-apollo-bandra', 'Apollo Pharmacy — Bandra West', 'Shop 4, Hill Road, Bandra West', 'Mumbai', '+91 22 2640 1234', 19.059600, 72.829500, 4.8, '07:00', '23:30', true, true, 'verified'),
  ('ph-medplus-andheri', 'MedPlus — Andheri East', 'Plot 12, JB Nagar, Andheri East', 'Mumbai', '+91 22 2830 5678', 19.113600, 72.869700, 4.6, '08:00', '22:00', true, true, 'verified'),
  ('ph-wellness-juhu', 'Wellness Forever 24x7 — Juhu', '10 JVPD Scheme, Juhu Tara Road', 'Mumbai', '+91 22 2618 9012', 19.102500, 72.827000, 4.9, '00:00', '23:59', true, true, 'verified'),
  ('ph-netmeds-dadar', 'Netmeds Pharmacy — Dadar TT', 'Shop 2, Swami Gyan Jivandas Marg, Dadar', 'Mumbai', '+91 22 2414 3456', 19.017800, 72.847800, 4.5, '08:30', '22:30', true, true, 'verified')
on conflict (id) do nothing;

insert into public.price_listings (id, medicine_id, pharmacy_id, price, currency, pack_size, availability)
values
  ('pl-1', 'med-dolo-650-tab', 'ph-apollo-bandra', 30.50, 'INR', '15 tablets', 'in_stock'),
  ('pl-2', 'med-dolo-650-tab', 'ph-medplus-andheri', 28.00, 'INR', '15 tablets', 'in_stock'),
  ('pl-3', 'med-calpol-650-tab', 'ph-apollo-bandra', 31.00, 'INR', '15 tablets', 'in_stock'),
  ('pl-4', 'med-calpol-650-tab', 'ph-wellness-juhu', 29.50, 'INR', '15 tablets', 'in_stock'),
  ('pl-5', 'med-crocin-650-tab', 'ph-netmeds-dadar', 32.00, 'INR', '15 tablets', 'in_stock'),
  ('pl-6', 'med-augmentin-625-tab', 'ph-apollo-bandra', 201.50, 'INR', '10 tablets', 'in_stock'),
  ('pl-7', 'med-moxikind-cv-625-tab', 'ph-medplus-andheri', 120.00, 'INR', '10 tablets', 'in_stock'),
  ('pl-8', 'med-azithral-500-tab', 'ph-wellness-juhu', 118.00, 'INR', '5 tablets', 'in_stock'),
  ('pl-9', 'med-glycomet-gp1-tab', 'ph-apollo-bandra', 88.00, 'INR', '15 tablets', 'in_stock')
on conflict (id) do nothing;
