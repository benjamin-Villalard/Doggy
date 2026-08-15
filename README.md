# Doggy — Mon Yorkshire

Application mobile (iOS / Android / Web) d'éducation d'un Yorkshire Terrier de 2 à 12 mois, construite à partir du
livre PDF `docs/Programme-education-Yorkshire.pdf` (43 pages).

## Contenu embarqué (hors ligne)

- 6 phases chronologiques (Phase 0 : 72 h → Phase 5 : 9–12 mois)
- 28 tutoriels T01–T28 (étapes, critères de réussite, encadrés spécifiques toy)
- 15 fiches d'aléas A01–A15 + arbre de décision
- Grille de 28 compétences notées 0–5, checklist de 120 expériences de socialisation
- Journaux propreté, poids, séances ; chapitres du livre consultables et cherchables

## Fonctions interactives

- Détection automatique de la phase selon la date de naissance, 3 priorités du jour
- Minuteur de séance 2 min avec comptage réussites/échecs et historique
- Détection des créneaux horaires à risque d'accident, jours sans accident
- Courbe de poids avec fourchette de référence, alertes de retard sur compétences clés
- Notes personnelles par tutoriel, compteur d'occurrences par aléa sur 7 jours
- Persistance locale via AsyncStorage, aucun backend

## Lancer le projet

```bash
npm install
npm run web      # prévisualisation navigateur
npm start        # QR code Expo Go (iPhone / Android)
npm run lint     # tsc --noEmit
```

Node >= 20.19.4 requis (Expo SDK 57).
