# Doggy — Mon Yorkshire

Application mobile (iOS / Android / Web) hors ligne : **carnet de santé d'un Yorkshire Biewer** en page d'accueil,
santé détaillée et fiches d'éducation.

## 3 onglets

- **Carnet** (accueil) : identité, alertes, courbe de croissance type pédiatrie, rappels vaccins/vermifuge,
  croquettes et eau du jour, compteur pipis/selles, saisie rapide (pipi, selle détaillée, eau, repas).
- **Santé** : recherche « que se passe-t-il ? », urgences, vaccins (date au choix, export calendrier `.ics`),
  nutrition, soins et toilettage, carnet véto, signes cliniques, mode clinicien.
- **Éducation** : 24 tours, 28 bases, 15 soucis de comportement, avec étapes et astuces ; étoile « à lui apprendre ».

## Modèles de calcul (indicatifs)

- Croissance (`lib/growth.ts`) : courbe de Gompertz W(t) = A·exp(ln(W0/A)·e^(−k·t)), k = 0,0161/j ;
  A = moyenne des poids des parents (± 4 % selon le sexe), sinon poids de naissance × 22, sinon poids visé ;
  couloirs P3/P15/P50/P85/P97 dont la largeur croît avec l'âge ; poids adulte reprojeté sur les pesées réelles ;
  alertes perte de poids, stagnation, cassure d'un couloir, hors P3-P97.
- Ration (`lib/daily.ts`) : RER = 70·kg^0,75 × 3 (< 50 % du poids adulte), 2,5 (< 80 %), 2 (croissance), 1,6/1,4 adulte.
- Eau : 60-90 ml/kg/j chiot, 50-70 adulte, alerte > 100 ml/kg/j.
- Selles : 8 couleurs et échelle de consistance 1-7, alertes (noir, sang, diarrhées répétées, vers…).

Persistance locale via AsyncStorage (clé `mon-yorkshire-v1`, anciennes données conservées), aucun backend.

## Sauvegarde automatique sur GitHub (facultative)

Écran `Réglages → Sauvegarde automatique sur GitHub` (`app/sauvegarde.tsx`, logique dans `lib/sync.tsx`).

1. Créer un dépôt GitHub **privé** dédié aux données (ex. `Doggy-data`) — jamais ce dépôt public.
2. Créer un token fine-grained limité à ce dépôt, permission `Contents: Read and write` uniquement.
3. Renseigner dépôt, chemin du fichier, branche et token, puis « Vérifier ».
4. Activer la sauvegarde automatique : l'état complet est envoyé via l'API Contents (`PUT`) 4 s après la dernière
   modification, avec le `sha` du fichier distant pour éviter les écrasements involontaires.

La persistance locale reste la source de vérité : hors ligne, l'app fonctionne normalement et l'envoi repart à la
prochaine modification. « Restaurer depuis GitHub » remplace tout l'état local (pas de fusion). Le token est stocké sur
l'appareil, jamais commité ni journalisé.

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
