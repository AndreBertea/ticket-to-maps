# Ticket to Maps (PWA)

Prototype minimaliste et robuste pour scanner des tickets papier (OCR) et créer un itinéraire Google Maps avec waypoints.

## Stack
- Vite + React + TypeScript (SPA)
- Tesseract.js (eng + fra)
- PWA (manifest + service worker)
- 100% front (pas de backend)
- Déployable sur Vercel

## Démarrage

1. npm i
2. npm run dev
3. Ouvrir http://localhost:5173

Note: des icônes PWA sont générées automatiquement lors du `npm i` (scripts/gen-icons.cjs), pas d’étape manuelle.

## Utilisation (Guide)

1. Scanner un ticket
   - Bouton "Scanner" → ouvre l’appareil photo (mobile) ou le sélecteur de fichier (desktop).
   - Bouton "Lancer l’OCR" → Tesseract analyse l’image et affiche le texte brut.
2. Extraire
   - Bouton "Extraire" → Parsing automatique de l’adresse, ville, téléphone, horaire, notes.
   - Un formulaire pré-rempli apparaît : corriger/compléter si nécessaire.
3. Ajouter des stops
   - "Ajouter à la tournée" → Ajoute à la liste courante (persistée en localStorage).
   - Répéter pour plusieurs tickets (1..10+).
4. Ordre
   - Sélectionner "Par horaire" (tri ascendant sur `HH:MM`) ou "Manuel" (drag & drop).
5. Ouvrir l’itinéraire
   - "Ouvrir dans Google Maps" → ouvre un itinéraire avec waypoints dans l’ordre choisi.
   - L’URL est affichée (copiable).
6. Persistance
   - Rafraîchir la page ne perd pas la tournée (localStorage: stops, mode d’ordre, origin).

## PWA

- Installable (manifest public/manifest.json + service worker src/sw.js)
- iOS/Android: "Ajouter à l’écran d’accueil".
  - iOS (Safari): bouton Partager → "Add to Home Screen".
  - Android (Chrome): prompt d’installation intégré (bouton "Installer").

## Permissions & confidentialité

- L’OCR s’exécute côté client; aucune image ni donnée n’est envoyée côté serveur.
- Si la caméra/photo est refusée, un message d’erreur s’affiche et vous pouvez réessayer.

## Déploiement Vercel

1. npm i
2. npm run build
3. Push sur GitHub
4. Importer sur Vercel (Framework: Vite) → build auto
5. Tester sur mobile via l’URL Vercel; l’installer comme PWA.

`vercel.json` inclut un fallback SPA (`/`)

## Détails techniques

- OCR (Tesseract.js)
  - `utils/ocr.ts` charge les langues `eng+fra` une fois (singleton).
  - Prétraitement Canvas: passage en niveaux de gris + contraste léger.
- Parsing (`utils/parse.ts`)
  - Téléphone: regex EU + FR; normalise en `+CC xx xx ...`.
  - Heure: accepte `20h20`, `20:20`, `2020` → `HH:MM`.
  - Adresse: ligne commençant par numéro + type de voie commun (Rue, Avenue…).
  - Ville: heuristique simple en bas du ticket (mot(s) capitalisé(s)).
  - Notes: mots-clés typiques (coupé, couteau, fourchette, sans, 4 from, …).
  - Retourne `confidence` = nb champs trouvés / 5 et `debug.lines`.
- Maps (`utils/maps.ts`)
  - Construit `https://www.google.com/maps/dir/?api=1&origin=...&destination=...&waypoints=...&travelmode=driving&hl=fr`.
  - Fallback iOS app: `comgooglemaps://` si installé.
- Stockage (`utils/storage.ts`)
  - Persiste `stops`, `mode` d’ordre, `origin` dans `localStorage`.
- PWA
  - SW: NetworkFirst pour `index.html`, CacheFirst pour assets Vite.
  - Icons: générées en postinstall (images pleines 192/512, couleur slate).

## Accessibilité

- Labels explicites; `aria-live` pour l’état OCR.
- Focus visible; contrastes suffisants.

## À améliorer (pistes)

- Parsing plus robuste (modèle de NER léger, dictionnaires de rues, etc.).
- Prétraitement OCR plus avancé (binarisation, rotation).
- DnD plus riche (dnd-kit) si nécessaire.
- Déduplication/hygiène des numéros de téléphone.

## Captures (facultatif)

- À ajouter si utile.

