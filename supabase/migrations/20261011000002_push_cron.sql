-- Schedules the push-send Edge Function every minute.
-- BEFORE running this, add two Vault secrets (SQL editor):
--   select vault.create_secret('https://<PROJECT_REF>.supabase.co', 'project_url');
--   select vault.create_secret('<SAME value as the CRON_SECRET function secret>', 'cron_secret');
create extension if not exists pg_cron;
create extension if not exists pg_net;
select cron.unschedule('jlc-push-send') where exists (select 1 from cron.job where jobname = 'jlc-push-send');
select cron.schedule('jlc-push-send', '* * * * *', $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/push-send',
    headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')),
    body := '{}'::jsonb, timeout_milliseconds := 20000);
$$);
-- Housekeeping: drop old push bookkeeping nightly.
select cron.unschedule('jlc-push-cleanup') where exists (select 1 from cron.job where jobname = 'jlc-push-cleanup');
select cron.schedule('jlc-push-cleanup', '17 3 * * *', $$ delete from public.push_log where date < current_date - 3; delete from public.snoozes where due_at < now() - interval '1 day'; $$);
