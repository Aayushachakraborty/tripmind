create extension if not exists pgcrypto;

create table public.users_profile (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text unique,
  preferred_language text not null default 'en',
  onboarding_complete boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users_profile(id) on delete cascade,
  dietary text[] not null default '{}',
  pace text not null default 'moderate',
  budget_per_day_inr int not null default 3500,
  interests text[] not null default '{}',
  group_type text not null default 'couple',
  home_city text,
  accessibility_needs text[] not null default '{}',
  updated_at timestamptz not null default now(),
  constraint user_preferences_dietary_allowed check (dietary <@ array['veg','jain','halal','egg','nonveg']::text[]),
  constraint user_preferences_pace_allowed check (pace in ('slow','moderate','fast')),
  constraint user_preferences_budget_range check (budget_per_day_inr between 500 and 100000)
);

create table public.trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users_profile(id) on delete cascade,
  destination text not null,
  date_from date not null,
  date_to date not null,
  preferences_snapshot jsonb not null,
  preferences_hash text not null,
  itinerary_data jsonb not null,
  source text not null default 'manual',
  reel_url text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  constraint trips_date_order check (date_to > date_from),
  constraint trips_source_allowed check (source in ('manual','reel_import')),
  constraint trips_status_allowed check (status in ('active','archived','deleted'))
);

create table public.itinerary_versions (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  version int not null,
  changed_segments jsonb,
  trigger_signal jsonb,
  created_at timestamptz not null default now(),
  unique (trip_id, version)
);

create table public.reel_imports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users_profile(id) on delete cascade,
  reel_url text not null,
  platform text not null,
  extracted_data jsonb,
  status text not null,
  created_at timestamptz not null default now(),
  constraint reel_imports_platform_allowed check (platform in ('instagram','youtube')),
  constraint reel_imports_status_allowed check (status in ('pending','success','failed'))
);

create table public.rate_limits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users_profile(id) on delete cascade,
  endpoint text not null,
  request_count int not null default 1,
  window_start timestamptz not null default now(),
  unique (user_id, endpoint)
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  endpoint text,
  method text,
  ip text,
  user_agent text,
  status_code int,
  duration_ms int,
  created_at timestamptz not null default now()
);

create table public.waitlist (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  phone text,
  source text,
  created_at timestamptz not null default now()
);

create table public.creator_widgets (
  id uuid primary key default gen_random_uuid(),
  creator_user_id uuid not null references public.users_profile(id) on delete cascade,
  widget_key text unique not null default gen_random_uuid()::text,
  reel_url text,
  itinerary_count int not null default 0,
  earnings_inr int not null default 0,
  created_at timestamptz not null default now()
);

create table public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null,
  user_id uuid references public.users_profile(id) on delete set null,
  properties jsonb not null default '{}',
  session_id text,
  created_at timestamptz not null default now()
);

create index trips_user_created_idx on public.trips (user_id, created_at desc);
create index trips_preferences_hash_idx on public.trips (preferences_hash);
create index trips_destination_idx on public.trips (destination);
create index trips_itinerary_data_gin_idx on public.trips using gin (itinerary_data);
create index trips_preferences_snapshot_gin_idx on public.trips using gin (preferences_snapshot);
create index rate_limits_user_endpoint_window_idx on public.rate_limits (user_id, endpoint, window_start);
create index audit_logs_user_created_idx on public.audit_logs (user_id, created_at desc);
create index waitlist_email_idx on public.waitlist (email);
create index analytics_events_user_created_idx on public.analytics_events (user_id, created_at desc);
create index analytics_events_name_created_idx on public.analytics_events (event_name, created_at desc);

alter table public.users_profile enable row level security;
alter table public.user_preferences enable row level security;
alter table public.trips enable row level security;
alter table public.itinerary_versions enable row level security;
alter table public.reel_imports enable row level security;
alter table public.rate_limits enable row level security;
alter table public.audit_logs enable row level security;
alter table public.waitlist enable row level security;
alter table public.creator_widgets enable row level security;
alter table public.analytics_events enable row level security;

create policy "Users read own profile" on public.users_profile for select using (auth.uid() = id);
create policy "Users insert own profile" on public.users_profile for insert with check (auth.uid() = id);
create policy "Users update own profile" on public.users_profile for update using (auth.uid() = id) with check (auth.uid() = id);

create policy "Users read own preferences" on public.user_preferences for select using (auth.uid() = user_id);
create policy "Users insert own preferences" on public.user_preferences for insert with check (auth.uid() = user_id);
create policy "Users update own preferences" on public.user_preferences for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users read own trips" on public.trips for select using (auth.uid() = user_id);
create policy "Users insert own trips" on public.trips for insert with check (auth.uid() = user_id);
create policy "Users update own trips" on public.trips for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users read own versions" on public.itinerary_versions
  for select using (exists (select 1 from public.trips where trips.id = itinerary_versions.trip_id and trips.user_id = auth.uid()));
create policy "Users insert own versions" on public.itinerary_versions
  for insert with check (exists (select 1 from public.trips where trips.id = itinerary_versions.trip_id and trips.user_id = auth.uid()));

create policy "Users read own reel imports" on public.reel_imports for select using (auth.uid() = user_id);
create policy "Users insert own reel imports" on public.reel_imports for insert with check (auth.uid() = user_id);
create policy "Users update own reel imports" on public.reel_imports for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users read own rate limits" on public.rate_limits for select using (auth.uid() = user_id);
create policy "Users insert own rate limits" on public.rate_limits for insert with check (auth.uid() = user_id);
create policy "Users update own rate limits" on public.rate_limits for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Authenticated insert audit logs" on public.audit_logs for insert to authenticated with check (true);
create policy "Authenticated insert analytics" on public.analytics_events for insert to authenticated with check (auth.uid() = user_id);

create policy "Anyone can join waitlist" on public.waitlist for insert with check (true);

create policy "Creators read own widgets" on public.creator_widgets for select using (auth.uid() = creator_user_id);
create policy "Creators insert own widgets" on public.creator_widgets for insert with check (auth.uid() = creator_user_id);
create policy "Creators update own widgets" on public.creator_widgets for update using (auth.uid() = creator_user_id) with check (auth.uid() = creator_user_id);
create policy "Public read widgets by key" on public.creator_widgets for select using (widget_key is not null);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger users_profile_updated_at
before update on public.users_profile
for each row execute function public.touch_updated_at();

create trigger user_preferences_updated_at
before update on public.user_preferences
for each row execute function public.touch_updated_at();

create or replace function public.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users_profile (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger auth_user_created_profile
after insert on auth.users
for each row execute function public.create_profile_for_new_user();
