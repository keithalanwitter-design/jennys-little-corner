-- v4 flow engine: daily flow events (what was done, when) for insights and the push sender, mirrored from app_state.
create table if not exists public.flow_events (
  user_id uuid not null references auth.users on delete cascade, id text not null,
  date date not null, at timestamptz not null, type text not null, label text, value numeric, ref text,
  primary key (user_id, id)
);
create index if not exists flow_events_user_date on public.flow_events (user_id, date);
alter table public.flow_events enable row level security;
drop policy if exists own_rows on public.flow_events;
create policy own_rows on public.flow_events for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Per-day completion / snooze state (Next Step "done", "let it go", "later") for server-side reminder decisions.
create table if not exists public.day_state (
  user_id uuid not null references auth.users on delete cascade, date date not null,
  done text[] default '{}', dismissed text[] default '{}', snoozed jsonb default '{}'::jsonb,
  primary key (user_id, date)
);
alter table public.day_state enable row level security;
drop policy if exists own_rows on public.day_state;
create policy own_rows on public.day_state for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.explode_flow_state() returns trigger language plpgsql security definer set search_path = public as $$
declare u uuid := new.user_id; d jsonb := new.data;
begin
  insert into flow_events (user_id, id, date, at, type, label, value, ref)
    select u, x->>'id', (x->>'date')::date, (x->>'at')::timestamptz, x->>'type', x->>'label', (x->>'value')::numeric, x->>'ref'
    from jsonb_array_elements(coalesce(d->'events', '[]')) x where x ? 'id'
  on conflict (user_id, id) do nothing;
  delete from day_state where user_id = u;
  insert into day_state (user_id, date, done, dismissed, snoozed)
    select u, k::date,
      coalesce(array(select jsonb_array_elements_text(d->'nextDone'->k)), '{}'),
      coalesce(array(select jsonb_array_elements_text(d->'nextSkips'->k)), '{}'),
      coalesce(d->'nextSnooze'->k, '{}'::jsonb)
    from (select jsonb_object_keys(coalesce(d->'nextDone','{}')) k union select jsonb_object_keys(coalesce(d->'nextSkips','{}')) union select jsonb_object_keys(coalesce(d->'nextSnooze','{}'))) keys;
  return new;
end $$;
drop trigger if exists app_state_flow on public.app_state;
create trigger app_state_flow after insert or update on public.app_state for each row execute function public.explode_flow_state();
