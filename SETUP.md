# Setup: sync, AI coach & closed-app reminders

The app works fully **without** any of this (everything is saved on the device). These steps add:
magic-link sign-in and cross-device sync, the AI coach, and push reminders that arrive even when the app is closed (with **Taken** and **Snooze** buttons).

Time: about 30 minutes. You'll need a Supabase account (free tier is fine) and an API key from an OpenAI-compatible LLM provider.

---

## 0. What you'll collect

| Value | Where it comes from | Where it goes |
|---|---|---|
| `PROJECT_REF` | Supabase dashboard URL (`supabase.com/dashboard/project/<ref>`) | CLI commands below |
| Project URL `https://<ref>.supabase.co` | Supabase → Project Settings → API | GitHub secret `NEXT_PUBLIC_SUPABASE_URL`, Vault `project_url` |
| anon / publishable key | Supabase → Project Settings → API keys | GitHub secret `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| Database password | You choose it when creating the project | `supabase link` prompt |
| Supabase access token | supabase.com/dashboard/account/tokens | `supabase login` |
| LLM API key | e.g. platform.openai.com/api-keys (or any OpenAI-compatible provider) | Function secret `LLM_API_KEY` |
| VAPID keys | **Already generated**, see step 4 | Function secrets + GitHub secret |
| `CRON_SECRET`, `PUSH_ACTION_SECRET` | Random strings you generate (step 4) | Function secrets (+ Vault for CRON_SECRET) |

Never commit any of these. Only the anon key and VAPID **public** key are safe in the browser.

---

## 1. Create the Supabase project
1. Go to https://supabase.com/dashboard → **New project**. Name: `jennys-little-corner`. Region: closest to you (e.g. *East US (Ohio)* or *Central US*). Pick a strong DB password and save it.
2. When it's ready, copy the **Project URL**, **anon key** and the **project ref** (from the URL).

## 2. Configure sign-in (magic link)
Supabase → **Authentication → URL Configuration**:
- **Site URL**: `https://keithalanwitter-design.github.io/jennys-little-corner/`
- **Redirect URLs**: add
  - `https://keithalanwitter-design.github.io/jennys-little-corner/settings/`
  - `http://localhost:3000/jennys-little-corner/settings/` (for local dev)

Authentication → **Providers → Email**: enabled (default). Optional: *Authentication → Emails* to customize the magic-link email.
> The built-in email sender is rate-limited (a few emails/hour). That's fine for one person. For more, add custom SMTP (Authentication → Emails → SMTP).

## 3. Install the CLI, link, and run migrations
From the repo folder:
```bash
npx supabase@latest login                       # opens a browser, or paste an access token
npx supabase@latest link --project-ref <PROJECT_REF>   # enter the DB password
npx supabase@latest db push                     # runs supabase/migrations/20261011000001_schema.sql
```
This creates all tables (profiles, daily logs for water/protein/mood/sleep, goals, supplements, medications, doses, meals, movement, journal, check-ins, reminders, push subscriptions) with **Row Level Security** so each user can only read their own rows.

> `db push` also tries the second migration (cron). If it errors because the Vault secrets don't exist yet, do step 5 and run `db push` again.

## 4. Secrets for Edge Functions
The VAPID key pair was generated for you. The **public** key (safe to share) is:
```
BFpRWxu3ZhZy89LYx96X4WsOad_KJ_IzCpTZT3NVTMfRIv6_fM3eC3l6oftz8NxVy2zFcBkl4jaOFtrAEo9ynfA
```
The **private** key is stored only on the build box at `/workspace/secrets/vapid.txt` (not in the repo). Ask your assistant to show it, or generate a fresh pair with `npx web-push generate-vapid-keys` (then use that public key everywhere below).

Generate two random secrets:
```bash
openssl rand -hex 32   # → CRON_SECRET
openssl rand -hex 32   # → PUSH_ACTION_SECRET
```
Set them all (one command):
```bash
npx supabase@latest secrets set \
  LLM_API_KEY=sk-... \
  LLM_BASE_URL=https://api.openai.com/v1 \
  LLM_MODEL=gpt-4o-mini \
  VAPID_PUBLIC_KEY=BFpRWxu3ZhZy89LYx96X4WsOad_KJ_IzCpTZT3NVTMfRIv6_fM3eC3l6oftz8NxVy2zFcBkl4jaOFtrAEo9ynfA \
  VAPID_PRIVATE_KEY=<private key from /workspace/secrets/vapid.txt> \
  VAPID_SUBJECT=mailto:<your email> \
  CRON_SECRET=<first random string> \
  PUSH_ACTION_SECRET=<second random string>
```
(`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are provided to functions automatically.)
`LLM_BASE_URL`/`LLM_MODEL` can point at any OpenAI-compatible API (OpenAI, OpenRouter, Groq, Together, Azure OpenAI-compatible, etc.).

## 5. Deploy functions & schedule reminders
```bash
npx supabase@latest functions deploy coach
npx supabase@latest functions deploy push-send --no-verify-jwt
npx supabase@latest functions deploy push-action --no-verify-jwt
```
- `coach`: requires a signed-in user.
- `push-send`: protected by `CRON_SECRET` (and by the user's token for "Send test push").
- `push-action`: protected by signed, expiring tokens embedded in each notification.

Now in Supabase → **SQL Editor**, run (fill in your values):
```sql
select vault.create_secret('https://<PROJECT_REF>.supabase.co', 'project_url');
select vault.create_secret('<CRON_SECRET from step 4>', 'cron_secret');
```
Then `npx supabase@latest db push` (applies `20261011000002_push_cron.sql`), or paste that file into the SQL Editor. It schedules `push-send` **every minute** via `pg_cron` + `pg_net` (Database → Extensions should show both enabled).

Check it: SQL Editor → `select * from cron.job_run_details order by start_time desc limit 5;`

## 6. GitHub repository secrets (for the Pages build)
GitHub → repo **Settings → Secrets and variables → Actions → New repository secret**:
| Name | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://<PROJECT_REF>.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon / publishable key |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | `BFpRWxu3ZhZy89LYx96X4WsOad_KJ_IzCpTZT3NVTMfRIv6_fM3eC3l6oftz8NxVy2zFcBkl4jaOFtrAEo9ynfA` |

Or with the GitHub CLI:
```bash
gh secret set NEXT_PUBLIC_SUPABASE_URL --body "https://<PROJECT_REF>.supabase.co"
gh secret set NEXT_PUBLIC_SUPABASE_ANON_KEY --body "<anon key>"
gh secret set NEXT_PUBLIC_VAPID_PUBLIC_KEY --body "BFpRWxu3ZhZy89LYx96X4WsOad_KJ_IzCpTZT3NVTMfRIv6_fM3eC3l6oftz8NxVy2zFcBkl4jaOFtrAEo9ynfA"
```
Then re-run the deploy: **Actions → Deploy to GitHub Pages → Run workflow** (or push any commit).

## 7. Try it
1. Open the site, go to **Settings → Account & sync**, enter your email, then tap the magic link **on the same device**. Your on-device data merges into your account (nothing is lost).
2. **On iPhone**: first add the app to the Home Screen (Safari → Share → Add to Home Screen) and open it from there. Web Push on iOS works only for Home Screen apps (iOS 16.4+).
3. Settings → **Get reminders even when closed**, then allow notifications, then **Send test push**.
4. Add a medication with a time 2 minutes from now and close the app. You'll get a notification with **Taken ✓** / **Snooze 15 min**. *Taken* logs the dose. Open the app and it syncs.
5. Open **Coach**. The "not connected" banner disappears once you're signed in and the function has `LLM_API_KEY`.

## Local development
```bash
cp .env.example .env.local   # fill in the public values
npm run dev                  # http://localhost:3000/jennys-little-corner/
```

## How sync works
- The device is the source of truth. Everything saves to `localStorage` instantly and works offline, signed in or not.
- When signed in, changes upload (debounced) to `app_state`, and a database trigger copies them into the normalized tables.
- On sign-in and whenever the app comes back to the foreground, it downloads the account copy and **merges**: logs, doses, workouts, journal and wins are combined (nothing is lost), water/protein take the higher value per day, and settings take the most recent copy.
- Known limitation: an item deleted on one device can reappear if another device still has it and syncs before the deletion propagates.

## Troubleshooting
- **Coach still says "not connected"**: make sure you're signed in, `LLM_API_KEY` is set, and `coach` is deployed. Check Supabase → Edge Functions → coach → Logs.
- **No push**: check `select * from push_subscriptions;`, function logs for `push-send`, and that the reminder/medication time is in your local time zone (it's taken from the device that last synced).
- **Magic link opens the wrong page**: double-check the Redirect URLs in step 2.
