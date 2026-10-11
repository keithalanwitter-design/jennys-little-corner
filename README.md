# Jenny's Little Corner 🌿

A private, mobile-first wellness web app (installable PWA). There are no shame streaks, no weight-loss assumptions and no medical advice. Every goal and target is set by the user and can be changed.

## Features
- **Design:** a hand-drawn SVG brand mark and app icons (an arched window with sunrise, hills and a sprout), a time-of-day greeting scene, an animated water glass, progress rings, Fraunces + Nunito Sans fonts, a warm palette with gradients and paper grain, dark mode, framer-motion micro-animations (respecting reduced-motion), and a desktop sidebar layout.
- **Onboarding** (5 steps, all skippable): your name, focus areas, goals in your own words, optional targets, kitchen preferences and household size, optional comfort toggles.
- **Today:** mood check-in with tailored suggestions, energy and stress scales, +16oz water and +20g protein, weekly movement ring, quick actions, today's planned meals, supplements due, a little note.
- **Nourish:** weekly meal planner (tap or drag to assign, auto-fill, whole week to grocery list), 44 high-protein recipes with macros, filters, sorting, favorites and scalable servings, plate builder, fridge matching with weighted scoring, batch-prep scheduler (auto servings from your plan, a step order, a consolidated shopping list), and a grocery list grouped by aisle with quantities.
- **Move:** 5 rebounder routines × 3 levels (Seedling, Sprout, Bloom) with cue cards and a full-screen guided player, 5 mobility and stretch flows, and a 7-day log.
- **Unwind:** breathing animation (box, 4-7-8, sigh, coherent), Me Time self-care ideas with a randomizer, sleep log and wind-down routine.
- **Progress:** recharts trends for water, protein, movement, energy and stress, and sleep; optional private measurements.
- **Journal & Little Wins:** prompts, three good things, a win jar, milestones that never reset.
- **Supplements:** your own lineup grouped by morning, midday and evening, check-offs, refill countdown, info cards with a doctor/pharmacist note.
- **Settings:** theme, optional targets, 8 reminders (browser notifications), export, import and delete.

Data lives in `localStorage` (via `lib/db.ts`, a swappable adapter). `supabase/schema.sql` holds the planned Supabase schema with Row Level Security.

## Run
```bash
npm install
npm run dev     # http://localhost:3000/jennys-little-corner/
npm run build   # static site in out/  (npx serve out)
```

## Live site
https://keithalanwitter-design.github.io/jennys-little-corner/ (GitHub Pages, deployed by `.github/workflows/pages.yml` on every push to `main`).

The app is a static export (`output: "export"`, basePath `/jennys-little-corner`). Build output goes to `out/`. For local dev the app is at http://localhost:3000/jennys-little-corner/. Set `NEXT_PUBLIC_BASE_PATH=""` to build without a base path (e.g. for Vercel).

## Deploy (Vercel, alternative)
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
