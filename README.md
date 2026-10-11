# Jenny's Little Corner 🌿

A private, mobile-first wellness web app (installable PWA). There are no shame streaks, no weight-loss assumptions and no medical advice. Every goal and target is set by the user and can be changed.

## Features (MVP)
- **Onboarding** (skippable): your name, what you want help with, your own goals (pause or remove anytime), optional water/protein targets, food likes, dislikes and allergies, cooking time, optional safety toggles.
- **Today**: +16oz water and +20g protein taps (with undo), energy and stress check-in with a gentle suggestion, goals at a glance.
- **Kitchen Hub**: Mix & Match plate builder with "surprise me", 12 high-protein recipes by prep style, "what's in my fridge" matching (have vs need), grocery list (checked items move to your fridge). Foods you said to avoid are filtered out.
- **Movement Studio**: rebounder interval timer (Gentle or Interval mode; 10/15/20 min) with beeps, a guided knee-friendly cooldown, box breathing, weekly minutes.
- **Supplements**: a list you fill in yourself with times, daily check-off, info cards each with a "check with your doctor or pharmacist" note, and links to NIH ODS.
- **Settings**: reminders using browser notifications, export and delete data.

Data lives in `localStorage` (via `lib/db.ts`, a swappable adapter). `supabase/schema.sql` holds the planned Supabase schema with Row Level Security.

## Run
```bash
npm install
npm run dev     # http://localhost:3000
npm run build && npm start
```

## Deploy (Vercel)
1. Go to vercel.com, choose New Project, and import this GitHub repo. The defaults work; no env vars are needed yet.
2. Each push to `main` redeploys automatically.

## Install on iPhone
1. Open the site in **Safari**.
2. Tap **Share**, then **Add to Home Screen**, then **Add**.
3. Open it from the Home Screen icon. In **Settings**, tap **Allow notifications**. iOS 16.4+ allows notifications only for Home Screen apps.

On Android in Chrome, use ⋮ then **Install app**.

## Reminders, now and next
The MVP checks reminders every minute while the app is open or running in the background, and shows them with the service worker. For reminders when the app is closed, the plan is: Supabase Auth, a `push_subscriptions` table, and an Edge Function on `pg_cron` that sends Web Push (VAPID). `public/sw.js` already handles `push` events.

## Next steps
Supabase auth and sync, batch-prep scheduler, trend charts, curated rebounder video embeds, opt-in "Together" support requests.

> General wellness information only, not medical advice.
