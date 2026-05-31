create extension if not exists pgcrypto;

create table public.trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  destination text not null,
  preferences_hash text not null,
  data jsonb not null,
  created_at timestamptz not null default now()
);

create table public.preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table public.itinerary_versions (
  trip_id uuid not null references public.trips(id) on delete cascade,
  version integer not null,
  data jsonb not null,
  primary key (trip_id, version)
);

create table public.rate_limits (
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null,
  request_count integer not null default 0,
  window_start timestamptz not null default now(),
  primary key (user_id, endpoint)
);

create index trips_data_gin_idx on public.trips using gin (data);
create index trips_user_hash_idx on public.trips (user_id, preferences_hash);

alter table public.trips enable row level security;
alter table public.preferences enable row level security;
alter table public.itinerary_versions enable row level security;
alter table public.rate_limits enable row level security;

create policy "Users read own trips" on public.trips for select using (auth.uid() = user_id);
create policy "Users insert own trips" on public.trips for insert with check (auth.uid() = user_id);
create policy "Users update own trips" on public.trips for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users read own preferences" on public.preferences for select using (auth.uid() = user_id);
create policy "Users upsert own preferences" on public.preferences for insert with check (auth.uid() = user_id);
create policy "Users update own preferences" on public.preferences for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users read own versions" on public.itinerary_versions
  for select using (exists (select 1 from public.trips where trips.id = itinerary_versions.trip_id and trips.user_id = auth.uid()));
create policy "Users insert own versions" on public.itinerary_versions
  for insert with check (exists (select 1 from public.trips where trips.id = itinerary_versions.trip_id and trips.user_id = auth.uid()));

create policy "Users read own rate limits" on public.rate_limits for select using (auth.uid() = user_id);
create policy "Users insert own rate limits" on public.rate_limits for insert with check (auth.uid() = user_id);
create policy "Users update own rate limits" on public.rate_limits for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.touch_preferences_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger preferences_updated_at
before update on public.preferences
for each row execute function public.touch_preferences_updated_at();
