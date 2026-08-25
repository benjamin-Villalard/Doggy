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

## Builds installables (EAS)

`eas.json` définit trois profils :

| Profil | Sortie | Usage |
| --- | --- | --- |
| `preview` | APK Android + IPA ad hoc iOS | installation directe sur ses propres appareils |
| `preview-ios-simulator` | build simulateur iOS | test sans compte Apple Developer |
| `production` | AAB Android + IPA App Store | soumission aux stores |

```bash
npx eas-cli login                            # compte Expo (gratuit)
npx eas-cli build --platform android --profile preview   # APK à installer directement
npx eas-cli build --platform ios --profile preview       # nécessite un compte Apple Developer (99 $/an)
```

Identifiants d'application : `com.benjamin.monyorkshire` (iOS et Android).

Android n'exige qu'un compte Expo : l'APK produit s'installe directement depuis le lien de build.
iOS exige un compte Apple Developer payant pour signer l'app, même pour un usage personnel ;
sans lui, l'app reste utilisable via Expo Go ou le build simulateur.

## Installer sur iPhone sans compte Apple (PWA)

L'export web est une PWA installable : `manifest.json`, service worker (`public/sw.js`) pour le hors ligne,
icônes `public/pwa/`, métadonnées dans `app/+html.tsx`. `experiments.baseUrl` vaut `/Doggy` pour GitHub Pages.

```bash
npm run build:web    # génère dist/ prêt à héberger
```

Déploiement : branche `gh-pages` (contenu de `dist/`) ou workflow `.github/workflows/deploy-pwa.yml`
(Settings → Pages → Source : GitHub Actions).

URL publique : https://benjamin-villalard.github.io/Doggy/
Sur iPhone : ouvrir l'URL dans Safari → Partager → « Sur l'écran d'accueil ».
