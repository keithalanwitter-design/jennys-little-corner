# Product Plan (draft)

Private, mobile-first PWA the user controls. Principles taken: low cognitive load, adherence-neutral (no shame, red alerts, or broken streaks), every assumption editable, all tracking optional, no medical claims, and partner support is opt-in only. Personal details stay out of code; use a **private** repo.

## Modules & features
1. **Today / Fuel & Flow dashboard**: protein glance (+20g tap), water fill-up (+8/16oz), "one next meal / one movement / one restore" cards, AM/PM energy and stress slider (1–5), and gentle wins (no punitive streaks).
2. **Kitchen Hub**: Mix & Match builder (protein + produce + carb/fat, Harvard plate visual); recipe matrix (15-min dinners, 3-day fridge staples, grab-and-go breakfasts); a "What's in my fridge" pantry list that ranks recipes by matching ingredients; a batch-prep scheduler ("cook 4 chicken breasts Sun → lunches through Wed"); an auto-generated grocery list grouped by aisle; and family-style servings.
3. **Movement Studio**: rebounder interval timer (Gentle Health Bounce, 40/20 Interval Cardio; 10/15/20 min) with embedded YouTube playlists; 5-min knee-friendly cooldown (quads/hip flexors, calves/ankles, bridges); mobility/flexibility routines; and weekly minutes tracked against the optional CDC 150-min reference. Before rebounding, a safety screen asks about knee pain, balance, pregnancy, and recent surgery, and offers alternatives.
4. **Mind & Recovery**: hydration roadmap (waking / midday / post-workout), box-breathing timer, evening stretch, and optional sleep/mood notes.
5. **Supplements**: her list (name, dose, timing, with food?), daily check-off, and refill reminder. The info cards (e.g., vitamin D, magnesium, omega-3, creatine, protein powder, fiber) state the evidence level and link to NIH ODS. Every card carries a "check with your doctor/pharmacist" caveat plus interaction notes. The app makes no prescriptions.
6. **Goals**: she writes her own goals (flexibility, energy, cardio, weight trend, water, protein) and can edit, pause, or delete them. The protein range (1.2–1.6 g/kg) appears only if she enters her weight and opts in.
7. **Settings/Privacy**: export or delete all data, notification controls, an optional "Together" support-request feature for a partner (e.g., "grab groceries").

## Onboarding (short, skippable, "prefer not to say" everywhere)
- What do you want help with now? (meals, variety, prep, water, energy/sleep, stress, movement, flexibility, supplements)
- Your goals in your own words, plus optional targets
- Food likes and dislikes, cultural staples, allergies, foods never to suggest
- Cooking time and equipment, budget, cooking for yourself or the family
- Movement: rebounder experience, preferred session length, best time of day
- Optional safeguards: knee pain or injury, balance issues, pregnancy or breastfeeding, kidney issues or fluid restriction, clinician limits, and whether food/weight tracking has ever felt distressing
- Optional body metrics (private, can be hidden)
- Reminder preferences: which reminders, quiet hours, frequency

## MVP vs later
**MVP:** auth, onboarding, Today dashboard, water and protein taps, check-in slider, goals, Mix & Match plus about 30 seed recipes, fridge matching, grocery list, rebounder timer and cooldown, supplement tracker, PWA reminders, data export/delete.
**Later:** batch-prep scheduler math, barcode or photo fridge scan, AI meal suggestions (only with consent), trend charts, breathwork audio, Together mode, wearable sync, native app wrapper.

## Data model (Supabase/Postgres, RLS per user)
profiles(id, display_name, prefs jsonb, safeguards jsonb, units, tz)
goals(id, user_id, title, category, target, unit, status, created_at)
daily_logs(id, user_id, date, water_oz, protein_g, energy_am, energy_pm, stress, notes)
recipes(id, title, prep_style, minutes, protein_g, servings, tags[], ingredients jsonb, steps)
pantry_items(id, user_id, name, qty, expires_on)
grocery_items(id, user_id, name, aisle, checked, source_recipe_id)
meal_plans(id, user_id, date, slot, recipe_id)
workouts(id, title, type, minutes, intervals jsonb, video_url)
workout_logs(id, user_id, workout_id, done_at, minutes, rpe, comfort)
supplements(id, user_id, name, dose, schedule jsonb, with_food, refill_on)
supplement_logs(id, user_id, supplement_id, taken_at)
reminders(id, user_id, kind, schedule jsonb, quiet_hours, enabled)
push_subscriptions(id, user_id, endpoint, keys jsonb)

## Notifications
PWA with service worker and Web Push (VAPID). On Android it works from the browser; on iOS 16.4+ it works only after "Add to Home Screen". A Supabase Edge Function on a pg_cron schedule sends due reminders (water, supplements, workout, evening wind-down) and respects quiet hours. Fallbacks: in-app nudges and an optional email digest. Gentle copy, easy snooze or off.

## Tech stack
Next.js (App Router) + TypeScript + Tailwind (+ shadcn/ui), Supabase (Auth, Postgres+RLS, Edge Functions, cron), PWA via next-pwa/Serwist, deployed on Vercel. Videos as YouTube embeds. Private GitHub repo, with personal data kept in the DB only and never in code.

## Content sources
NIDDK, Harvard Healthy Eating Plate, CDC activity guidelines, AAOS OrthoInfo, EatingWell, NIH Office of Dietary Supplements. Link out for education; the app is not medical care.
