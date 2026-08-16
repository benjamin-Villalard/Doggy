---
name: testing-mon-yorkshire
description: How to run and end-to-end test the "Mon Yorkshire" Expo (SDK 57 / expo-router / React Native Web) puppy-training app locally, including state reset, mobile viewport setup, and the golden-path flow through onboarding, dashboard gamification, tutos, aléas, suivi carnets and livre.
---

# Testing "Mon Yorkshire" (Expo web)

Offline-only app: no backend, no auth, no login step. All state lives client-side, so
testing is purely local and needs no secrets.

## Devin Secrets Needed

None.

## Start the app

```bash
source ~/.nvm/nvm.sh && nvm use 22   # Node 20 is rejected by Expo SDK 57
cd <repo>                            # e.g. /home/ubuntu/yorkshire-app
npx expo start --web --port 8081
```
Then open `http://localhost:8081`. Start the server in a background shell and poll its
output until the bundler is ready; the first page load may take ~10 s while Metro bundles.
If port 8081 is already serving the app, reuse it instead of starting a second server.

## Viewport

This is a mobile app rendered via React Native Web. Do NOT test maximized — the layout
stretches and the bottom tab bar / hero look wrong. Resize Chrome to a narrow
mobile-like window (roughly 414–620 px wide, ~1000 px tall), e.g.:

```bash
wmctrl -r :ACTIVE: -b remove,maximized_vert,maximized_horz
wmctrl -r :ACTIVE: -e 0,30,0,420,700
```

## Reset state between runs

Persistence is AsyncStorage → `localStorage` under the key `mon-yorkshire-v1`
(see `lib/store.tsx`). To get a fresh onboarding:

1. Run `window.localStorage.clear()` in the browser console (this returns `undefined`;
   that is expected — verify visually that `/onboarding` renders empty fields).
2. Navigate to `http://localhost:8081/onboarding`.

Reloading with F5 is the way to test persistence; state should survive fully.

## Routes worth exercising

`/` (dashboard), `/programme`, `/tutos`, `/tutos/[code]`, `/aleas`, `/aleas/[code]`,
`/suivi`, `/suivi/{competences,socialisation,proprete,poids,seances}`, `/livre`,
`/livre/[index]`, `/onboarding`.

Detail screens (e.g. `/tutos/T13`) hide the bottom tab bar and use a back arrow at the
top-left (~x=46,y=89 in a narrow window). Don't try to click tabs from a detail screen —
you'll hit embedded content links instead. Go back first.

## Gamification math (lib/gamification.ts) — useful for exact assertions

XP is derived, not stored: 10 per skill point, 5 per validated socialisation,
4 per saved session, 2 per non-accident potty entry, 3 per weight entry.
Level 2 ("Chiot curieux") is at 120 XP. Asserting the exact XP total is the strongest
single check that all mutations landed — e.g. one skill at 4/5 + 2 clean potty + 1 accident
+ 1 session + 1 socialisation + 1 weight = 40+4+4+5+3 = 56 XP.

## Golden path that exercises the whole app

1. Onboarding: name + birthdate (`AAAA-MM-JJ`); "Commencer l'aventure" stays disabled
   until name and a valid birthdate are set. Age/phase on the dashboard derive from the
   birthdate vs the machine's current date — check the box date before asserting
   "8 semaines" / "Phase 1".
2. Dashboard: Pipi / Caca / Accident quick actions increment DEHORS / ACCIDENTS and XP.
3. All 6 tabs render their own ScreenHeader.
4. Tutos: search is accent-insensitive; block chips filter; ScorePicker 0→4 turns the cell
   green and propagates to the list badge and to `/suivi/competences`; SessionRunner has a
   120 s timer, Réussi/Raté counters, a note field, and "Enregistrer la séance" is disabled
   until at least one attempt.
5. Aléas: search, "Arbre de décision universel" toggles ouvrir/masquer, fiche detail has a
   7-day occurrence counter whose value shows as a `n/7j` badge back in the list.
6. Suivi: 5 carnets. Poids pre-fills today's date; weight is entered in grams.
7. Livre: global search needs ≥2 chars and returns mixed `tuto` / `alea` / `chapitre` rows.

## Known-acceptable console noise

`"shadow*" style props are deprecated`, `props.pointerEvents is deprecated`, and
`Animated: useNativeDriver is not supported` are expected on React Native Web and are not
failures. Anything else in the console should be treated as a real finding.
