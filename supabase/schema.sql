-- Jenny's Little Corner: Supabase schema (Row Level Security: each user sees only their rows)
create table app_state (user_id uuid primary key references auth.users on delete cascade, data jsonb not null, updated_at timestamptz default now());
create table profiles (id uuid primary key references auth.users on delete cascade, display_name text, prefs jsonb default '{}', safeguards jsonb default '{}', water_target_oz int, protein_target_g int, tz text default 'America/Chicago');
create table goals (id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users on delete cascade, title text not null, category text, target text, status text default 'active', created_at timestamptz default now());
create table daily_logs (user_id uuid not null references auth.users on delete cascade, date date not null, water_oz int default 0, protein_g int default 0, energy_am int, energy_pm int, stress int, note text, primary key (user_id, date));
create table pantry_items (id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users on delete cascade, name text not null, expires_on date);
create table grocery_items (id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users on delete cascade, name text not null, checked boolean default false);
create table workout_logs (id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users on delete cascade, done_at timestamptz default now(), minutes int, mode text);
create table supplements (id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users on delete cascade, name text not null, dose text, times text[] default '{}', with_food boolean default false, notes text);
create table supplement_logs (id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users on delete cascade, supplement_id uuid references supplements on delete cascade, date date not null, time text);
create table reminders (id text, user_id uuid not null references auth.users on delete cascade, label text, time text, enabled boolean default false, primary key (user_id, id));
create table push_subscriptions (id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users on delete cascade, endpoint text unique, keys jsonb);

do $$ declare t text; begin
  foreach t in array array['app_state','goals','daily_logs','pantry_items','grocery_items','workout_logs','supplements','supplement_logs','reminders','push_subscriptions'] loop
    execute format('alter table %I enable row level security', t);
    execute format('create policy own_rows on %I for all using (auth.uid() = user_id) with check (auth.uid() = user_id)', t);
  end loop;
end $$;
alter table profiles enable row level security;
create policy own_profile on profiles for all using (auth.uid() = id) with check (auth.uid() = id);
