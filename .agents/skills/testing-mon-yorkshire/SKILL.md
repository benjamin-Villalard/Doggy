---
name: testing-mon-yorkshire
description: How to run and end-to-end test the "Mon Yorkshire" Expo (SDK 57 / expo-router / React Native Web) puppy-training app locally, including state reset, mobile viewport setup, the golden-path flow through onboarding, dashboard gamification, tutos, aléas, suivi carnets and livre, plus the Réglages personalization layer, coach-voice substitution and the Santé (health) area with its ration math.
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
`/livre/[index]`, `/onboarding`, `/reglages`,
`/sante`, `/sante/{vaccins,nutrition,carnet,urgences,signes}`.

There are **7 primary tabs** (Aujourd'hui, Programme, Tutos, Aléas, Suivi, Santé, Livre).
Check the tab bar on a *tab* route, not a detail route — detail screens hide it.

Detail screens (e.g. `/tutos/T13`) hide the bottom tab bar and use a back arrow at the
top-left (~x=46,y=89 in a narrow window). Don't try to click tabs from a detail screen —
you'll hit embedded content links instead. Go back first.

## Gamification math (lib/gamification.ts) — useful for exact assertions

XP is derived, not stored: 10 per skill point, 5 per validated socialisation,
4 per saved session, 2 per non-accident potty entry, 3 per weight entry.
Level 2 ("Chiot curieux") is at 120 XP. Asserting the exact XP total is the strongest
single check that all mutations landed — e.g. one skill at 4/5 + 2 clean potty + 1 accident
+ 1 session + 1 socialisation + 1 weight = 40+4+4+5+3 = 56 XP.

## Navigating by URL

Typing a URL in the omnibox can silently keep autocomplete text and land you somewhere
unexpected (it may look like an onboarding redirect / lost state). Reliable recipe:
click the omnibox → `ctrl+a` → type the URL → press `Delete` (kills the inline
autocomplete suffix) → `Return`. If you think state was lost, dump
`localStorage['mon-yorkshire-v1']` before believing it — it is usually intact.

The `type` action may drop accented chars like `ô`; use unaccented test strings
(e.g. `visite de controle`) rather than fighting the input method.

## Réglages (`/reglages`) — personalization and coach voice

Reach it via the gear icon at the top-right of the dashboard hero. It holds profile
(name, **nickname**, sex, avatar emoji, birth/arrival dates, owner first name, adult
target weight), coach tone (Ludique / Neutre / **Expert**), 4 toggles (emojis, show
success criteria, show toy-specific boxes, reduce motion), the 5 education words, the
goal steppers, weight unit, and "Revenir aux réglages conseillés".

How the voice layer behaves (`lib/voice.ts`) — good high-signal assertions:
- The **nickname** wins over the name everywhere, including the dashboard hero
  (`Benjamin & Bella`).
- `sex: female` swaps il→elle / le→la in tutorial text.
- The 5 words replace the book's wording in tutorials AND in the Aperçu card:
  `Dis « <recall> », marque avec « <marker> » puis donne la <treat>, et envoie <nickname> au <mat>.`
- Tone **Expert** makes `flavor()` return null → the playful mission card
  ("Le grand troc" / "Mission du jour" / "C'est gagné quand :") disappears from tutos
  while the technical steps stay. T05 is a good probe (contains treat/marker/il tokens);
  T09 is the probe for the criteria + toy boxes toggles (it has both).
- `sessionSeconds` drives the SessionRunner title and ring (`180` → "Séance minutée (3 min)", `3:00`).
- `goalSessions` / `goalPotty` drive the dashboard "Objectifs du jour" labels
  (`5 séances de 3 min (0/5)`, `8 sorties propreté (0/8)`).
- "Revenir aux réglages conseillés" resets **prefs only** (`setPrefs(defaultPrefs)`);
  profile fields such as the nickname must survive. Defaults: tone fun, `Viens`/`Oui`/`Ok`/
  `friandise`/`panier`, 120 s, 3 séances, 6 sorties.

## Santé area — what to assert

All health status is **derived from the birthdate and stored acts** (`lib/health.ts`), so
the box's current date matters. Compute expectations first: vaccine V1 is due at 8 weeks,
and `healthAlerts` surfaces anything due within 14 days on the dashboard
(`Santé : N rappel(s)` with `en retard de N j`).

- `/sante/vaccins`: "Marquer comme fait aujourd'hui" flips the pill `en retard` → `fait`,
  adds `Injecté le <date>`, swaps the button for `Annuler`, **and** writes an act into the
  carnet. The dashboard reminder count must drop by one — that cross-screen link is the
  key assertion.
- `/sante/nutrition`: needs a weighing in `/suivi/poids` first, otherwise it shows
  "Ajoute une pesée…" and an `à compléter` pill. Math: `RER = 70 × kg^0.75`, ×3 under
  17 weeks. Worked example: 1500 g → RER 95 kcal → 285 kcal/day; with 380 kcal/100 g →
  75 g/day → 19 g/meal at 4 meals, ~8 g of treats (10 %).
- `/sante/carnet`: vet name/phone, microchip, plus add / filter-by-type / delete acts.
  The saved vet phone must then appear on the red emergency card of `/sante`.
  Note the filter pills stay applied after a delete, so an empty state can look like data
  loss — switch back to "Tous" to confirm.
- `/sante/urgences`: 7 collapsible sheets, **exclusive** accordion (the first is expanded
  by default); each shows Je reconnais / Je fais tout de suite / Je ne fais jamais.
- `/sante/signes`: 16 signs, urgency filter pills ("Véto tout de suite" leaves 6 red ones),
  and "Je l'observe aujourd'hui" appends a timestamped entry to `Signes notés (N)`.
  Filter selections are ephemeral UI state and reset on reload — only the notes persist.

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
