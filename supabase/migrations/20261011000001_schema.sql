-- Jenny's Little Corner: core schema. Every table is protected by Row Level Security: a user can only see their own rows.

-- Offline-first sync document (the client merges local + this copy). Normalized tables below are derived from it by trigger.
create table if not exists public.app_state (
  user_id uuid primary key references auth.users on delete cascade,
  data jsonb not null default '{}'::jsonb,
  tz text not null default 'America/Chicago',
  updated_at timestamptz not null default now()
);

create table if not exists public.profiles (
  user_id uuid primary key references auth.users on delete cascade,
  display_name text, focus text[] default '{}', likes text, avoid text, allergies text,
  cook_minutes int, household_size int, water_target_oz int, protein_target_g int, move_target_min int,
  safeguards jsonb default '{}'::jsonb, theme text, tz text, updated_at timestamptz default now()
);
create table if not exists public.daily_logs (
  user_id uuid not null references auth.users on delete cascade, date date not null,
  water_oz int default 0, protein_g int default 0, mood text, energy_am int, energy_pm int, stress int,
  sleep_hours numeric(3,1), sleep_quality int, note text, primary key (user_id, date)
);
create table if not exists public.goals (
  user_id uuid not null references auth.users on delete cascade, id text not null,
  title text not null, category text, target text, status text default 'active', created_at timestamptz, primary key (user_id, id)
);
create table if not exists public.supplements (
  user_id uuid not null references auth.users on delete cascade, id text not null,
  name text not null, dose text, times text[] default '{}', with_food boolean default false, notes text, stock int, per_dose int, primary key (user_id, id)
);
create table if not exists public.medications (
  user_id uuid not null references auth.users on delete cascade, id text not null,
  name text not null, dose text, times text[] default '{}', with_food boolean default false, notes text, stock int, per_dose int,
  prescriber text, as_needed boolean default false, active boolean default true, created_at timestamptz, primary key (user_id, id)
);
-- Doses taken/skipped for both meds and supplements.
create table if not exists public.doses (
  user_id uuid not null references auth.users on delete cascade,
  kind text not null check (kind in ('med','supp')), item_id text not null, date date not null, time text not null,
  status text not null default 'taken' check (status in ('taken','skipped')), at timestamptz default now(), source text default 'app',
  primary key (user_id, kind, item_id, date, time)
);
create table if not exists public.meals (
  user_id uuid not null references auth.users on delete cascade, date date not null, slot text not null, recipe_id text not null,
  primary key (user_id, date, slot)
);
create table if not exists public.movement (
  id bigint generated always as identity primary key, user_id uuid not null references auth.users on delete cascade,
  date date not null, minutes int not null, mode text, routine_id text, feel int
);
create table if not exists public.journal (
  user_id uuid not null references auth.users on delete cascade, id text not null, date date not null,
  text text, gratitude text[] default '{}', mood text, primary key (user_id, id)
);
create table if not exists public.checkins (
  user_id uuid not null references auth.users on delete cascade, id text not null, week_of date not null,
  went_well text[], hard text[], note text, tweak text, at timestamptz, primary key (user_id, id)
);
create table if not exists public.reminders (
  user_id uuid not null references auth.users on delete cascade, id text not null,
  label text, time text, enabled boolean default false, days int[], primary key (user_id, id)
);
create table if not exists public.push_subscriptions (
  id bigint generated always as identity primary key, user_id uuid not null references auth.users on delete cascade,
  endpoint text not null unique, keys jsonb not null, tz text, user_agent text, created_at timestamptz default now()
);
-- Server-only bookkeeping (no client policies → not readable by clients).
create table if not exists public.push_log (user_id uuid not null, key text not null, date date not null, sent_at timestamptz default now(), primary key (user_id, key, date));
create table if not exists public.snoozes (id bigint generated always as identity primary key, user_id uuid not null references auth.users on delete cascade, payload jsonb not null, due_at timestamptz not null);

do $$ declare t text; begin
  foreach t in array array['app_state','profiles','daily_logs','goals','supplements','medications','doses','meals','movement','journal','checkins','reminders','push_subscriptions'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists own_rows on public.%I', t);
    execute format('create policy own_rows on public.%I for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id)', t);
  end loop;
end $$;
alter table public.push_log enable row level security;
alter table public.snoozes enable row level security;

-- Explode the sync document into normalized tables (runs as owner so it can write all tables).
create or replace function public.explode_app_state() returns trigger language plpgsql security definer set search_path = public as $$
declare u uuid := new.user_id; d jsonb := new.data;
begin
  insert into profiles (user_id, display_name, focus, likes, avoid, allergies, cook_minutes, household_size, water_target_oz, protein_target_g, move_target_min, safeguards, theme, tz, updated_at)
  values (u, d#>>'{profile,name}', coalesce(array(select jsonb_array_elements_text(d#>'{profile,focus}')), '{}'), d#>>'{profile,likes}', d#>>'{profile,avoid}', d#>>'{profile,allergies}',
    (d#>>'{profile,cookMinutes}')::int, (d#>>'{profile,householdSize}')::int, (d#>>'{profile,waterTargetOz}')::int, (d#>>'{profile,proteinTargetG}')::int, (d#>>'{profile,moveTargetMin}')::int,
    coalesce(d#>'{profile,safeguards}', '{}'), d#>>'{profile,theme}', new.tz, now())
  on conflict (user_id) do update set display_name = excluded.display_name, focus = excluded.focus, likes = excluded.likes, avoid = excluded.avoid, allergies = excluded.allergies,
    cook_minutes = excluded.cook_minutes, household_size = excluded.household_size, water_target_oz = excluded.water_target_oz, protein_target_g = excluded.protein_target_g,
    move_target_min = excluded.move_target_min, safeguards = excluded.safeguards, theme = excluded.theme, tz = excluded.tz, updated_at = now();

  delete from daily_logs where user_id = u;
  insert into daily_logs select u, (v->>'date')::date, coalesce((v->>'waterOz')::int,0), coalesce((v->>'proteinG')::int,0), v->>'mood', (v->>'energyAm')::int, (v->>'energyPm')::int, (v->>'stress')::int, (v->>'sleepHours')::numeric, (v->>'sleepQuality')::int, v->>'note'
    from jsonb_each(coalesce(d->'logs','{}')) as e(k, v) where v ? 'date';
  delete from goals where user_id = u;
  insert into goals select u, x->>'id', x->>'title', x->>'category', x->>'target', coalesce(x->>'status','active'), (x->>'createdAt')::timestamptz from jsonb_array_elements(coalesce(d->'goals','[]')) x on conflict do nothing;
  delete from supplements where user_id = u;
  insert into supplements select u, x->>'id', x->>'name', x->>'dose', coalesce(array(select jsonb_array_elements_text(x->'times')), '{}'), coalesce((x->>'withFood')::boolean,false), x->>'notes', (x->>'stock')::int, (x->>'perDose')::int from jsonb_array_elements(coalesce(d->'supplements','[]')) x on conflict do nothing;
  delete from medications where user_id = u;
  insert into medications select u, x->>'id', x->>'name', x->>'dose', coalesce(array(select jsonb_array_elements_text(x->'times')), '{}'), coalesce((x->>'withFood')::boolean,false), x->>'notes', (x->>'stock')::int, (x->>'perDose')::int, x->>'prescriber', coalesce((x->>'asNeeded')::boolean,false), coalesce((x->>'active')::boolean,true), (x->>'createdAt')::timestamptz from jsonb_array_elements(coalesce(d->'meds','[]')) x on conflict do nothing;
  delete from doses where user_id = u;
  insert into doses select u, 'med', x->>'medId', (x->>'date')::date, x->>'time', coalesce(x->>'status','taken'), coalesce((x->>'at')::timestamptz, now()), coalesce(x->>'source','app') from jsonb_array_elements(coalesce(d->'doseLogs','[]')) x on conflict do nothing;
  insert into doses select u, 'supp', x->>'suppId', (x->>'date')::date, x->>'time', 'taken', now(), 'app' from jsonb_array_elements(coalesce(d->'suppLogs','[]')) x on conflict do nothing;
  delete from meals where user_id = u;
  insert into meals select u, k::date, s.key, s.value #>> '{}' from jsonb_each(coalesce(d->'mealPlan','{}')) e(k, v), jsonb_each(v) s where jsonb_typeof(s.value) = 'string' on conflict do nothing;
  delete from movement where user_id = u;
  insert into movement (user_id, date, minutes, mode, routine_id, feel) select u, (x->>'date')::date, (x->>'minutes')::int, x->>'mode', x->>'routineId', (x->>'feel')::int from jsonb_array_elements(coalesce(d->'workouts','[]')) x;
  delete from journal where user_id = u;
  insert into journal select u, x->>'id', (x->>'date')::date, x->>'text', coalesce(array(select jsonb_array_elements_text(x->'gratitude')), '{}'), x->>'mood' from jsonb_array_elements(coalesce(d->'journal','[]')) x on conflict do nothing;
  delete from checkins where user_id = u;
  insert into checkins select u, x->>'id', (x->>'weekOf')::date, array(select jsonb_array_elements_text(x->'wentWell')), array(select jsonb_array_elements_text(x->'hard')), x->>'note', x->>'tweak', (x->>'at')::timestamptz from jsonb_array_elements(coalesce(d->'checkins','[]')) x on conflict do nothing;
  delete from reminders where user_id = u;
  insert into reminders select u, x->>'id', x->>'label', x->>'time', coalesce((x->>'enabled')::boolean,false), case when x ? 'days' then array(select jsonb_array_elements_text(x->'days')::int) end from jsonb_array_elements(coalesce(d->'reminders','[]')) x on conflict do nothing;
  return new;
end $$;
drop trigger if exists app_state_explode on public.app_state;
create trigger app_state_explode after insert or update on public.app_state for each row execute function public.explode_app_state();

-- Called by the push-action Edge Function (service role) when "Taken" is tapped on a notification.
create or replace function public.log_dose_from_push(p_user uuid, p_kind text, p_item text, p_date date, p_time text) returns void language plpgsql security definer set search_path = public as $$
declare entry jsonb;
begin
  if p_kind = 'med' then
    entry := jsonb_build_object('id', substr(md5(random()::text), 1, 8), 'date', p_date, 'medId', p_item, 'time', p_time, 'status', 'taken', 'at', now(), 'source', 'push');
    update app_state set data = jsonb_set(data, '{doseLogs}', coalesce(data->'doseLogs', '[]') || entry) || jsonb_build_object('updatedAt', now()), updated_at = now() where user_id = p_user
      and not exists (select 1 from jsonb_array_elements(coalesce(data->'doseLogs','[]')) x where x->>'medId' = p_item and x->>'date' = p_date::text and x->>'time' = p_time);
  else
    entry := jsonb_build_object('date', p_date, 'suppId', p_item, 'time', p_time);
    update app_state set data = jsonb_set(data, '{suppLogs}', coalesce(data->'suppLogs', '[]') || entry) || jsonb_build_object('updatedAt', now()), updated_at = now() where user_id = p_user
      and not exists (select 1 from jsonb_array_elements(coalesce(data->'suppLogs','[]')) x where x->>'suppId' = p_item and x->>'date' = p_date::text and x->>'time' = p_time);
  end if;
end $$;
revoke all on function public.log_dose_from_push from public, anon, authenticated;
