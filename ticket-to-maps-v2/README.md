# Ticket-to-Maps v2

Application Next.js mobile-first pour préparer rapidement un itinéraire autour de Verzenay. L'interface s'appuie sur shadcn/ui et propose combobox ville/rue, molette d'heure infinie, dictée vocale et aperçu Google Maps mis à jour en temps réel.

## Démarrage rapide

```bash
npm install
npm run dev
```

L'application est disponible sur [http://localhost:3000](http://localhost:3000). Le projet utilise le dossier `app` (App Router) et TailwindCSS.

## Scripts disponibles

- `npm run dev` : lance le serveur de développement.
- `npm run build` : build de production Next.js.
- `npm run start` : démarre le serveur après build.
- `npm run lint` : vérifie le linting.

## Déploiement sur Vercel

1. Pousser le dossier `ticket-to-maps-v2` dans un dépôt Git (branche `main` pour la production).
2. Connecter le dépôt à Vercel et sélectionner ce répertoire comme racine du projet.
3. Garder les commandes par défaut (`npm install`, `npm run build`, `npm run start`).
4. Vercel gère automatiquement les previews pour chaque branche et la production depuis `main`.

Aucune variable d'environnement n'est nécessaire.

## Fonctionnalités clés

- **Sélection ville** : combobox shadcn/ui alimentée via `data/villages.json`.
- **Auto-complétion rue** : suggestions fuzzy dépendantes de la ville sélectionnée.
- **Numéro de voie** : champ numérique optionnel adjacent à la rue.
- **Molette d'heure infinie** : double colonne heures/minutes avec scroll-snap et recentrage automatique.
- **Dictée vocale** : Web Speech API (si disponible) pour remplir ville/rue/numéro/heure.
- **Géolocalisation** : récupération de la position actuelle + mise à jour continue lorsque c'est autorisé.
- **Aperçu Google Maps** : URL recalculée à chaque changement + bouton copie et ouverture application native.

## Compatibilité mobile

- Design mobile-first avec cibles tactiles ≥ 44px.
- vibrations légères (si supportées) pour les sélections importantes.
- Sur iOS/Android :
  - localisation : nécessite d'autoriser l'accès navigateur.
  - dictée vocale : support partiel (iOS ≥ 17 / Chrome Android recommandé).

## Données

Les listes de villages et rues proviennent d'exports Overpass et sont stockées en local (`data/villages.json`, `data/streets.json`). Aucun appel réseau n'est requis côté client.
