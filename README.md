# Startup Tycoon

Un jeu de type clicker/idle game développé avec Angular 21.

## Commandes

### Développement
```bash
npm run dev
```
Lance le serveur de développement sur `http://localhost:4200/`.

### Build
```bash
npm run build
```
Compile le projet et génère les fichiers optimisés dans le dossier `dist/`.

### Preview
```bash
npm run preview
```
Lance le serveur en mode production pour tester le build.

### Tests
```bash
npm run test
```
Lance les tests unitaires avec Vitest.

## Structure du projet

### `src/pages`
Contient les pages routées de l'application (Game, Shop, Stats, Settings, NotFound).

### `src/components`
Regroupe les composants UI réutilisables (navbar, footer, etc.).

### `src/services`
Centralise les services et l'accès aux données (sera utilisé dans les prochaines parties).

### `src/state`
Gère le state global de l'application (sera implémenté dans les prochaines parties).

### `src/styles`
Contient les styles globaux partagés par toute l'application.

## Routes

- `/` → Page Game (clicker principal)
- `/shop` → Page Shop (achats d'upgrades)
- `/stats` → Page Stats (statistiques de jeu)
- `/settings` → Page Settings (paramètres)
- `/**` → Page 404 (pour les routes inconnues)

## Point d'entrée de l'application

### 1. Fichier de montage dans le DOM
L'application est montée dans le DOM via le fichier **`src/main.ts`**, qui utilise `bootstrapApplication()`.

### 2. Composant racine
Le composant racine est **`App`**, défini dans **`src/app/app.ts`**.

### 3. Configuration du router
Le router est configuré dans **`src/app/app.routes.ts`** (définition des routes) et enregistré via `provideRouter(routes)` dans **`src/app/app.config.ts`**.

### 4. Élément HTML d'ancrage
L'élément HTML servant de point d'ancrage est **`<app-root>`** dans **`src/index.html`**. Il correspond au sélecteur défini dans le composant `App`.

## Développement

Ce projet a été généré avec Angular CLI version 21.2.7.

