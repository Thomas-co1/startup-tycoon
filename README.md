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

### `src/utils`
Fonctions utilitaires réutilisables (formatage de nombres, etc.).

## Architecture du clicker (TP6)

### Composants créés

#### `MoneyDisplay` (`src/components/moneyDisplay.component.ts`)
Composant d'affichage pur qui affiche l'argent du joueur.
- **Props** : `money` (number) - Montant à afficher
- **Responsabilité** : Affichage uniquement, pas de logique métier
- **Bonus** : Utilise `formatNumber()` pour un affichage compact (999 → "999", 1200 → "1.2K", 1250000 → "1.25M")

#### `ClickButton` (`src/components/click-button.component.ts`)
Bouton interactif principal du jeu.
- **Props** : `clickValue` (number) - Valeur ajoutée par clic
- **Events** : `onClick` (EventEmitter) - Émis à chaque clic
- **Responsabilité** : UI + notification, ne modifie pas directement le state

#### `GameHeader` (`src/components/game-header.component.ts`)
En-tête du jeu regroupant les statistiques.
- **Props** : `money` (number) - Argent à afficher
- **Composition** : Utilise `MoneyDisplay` et prépare un placeholder pour l'income
- **Responsabilité** : Organisation visuelle, pas de logique

### State et flux de données

#### Localisation du state
Le state est **localisé uniquement dans `src/pages/game.page.ts`** :
- `money = signal(0)` - Argent actuel du joueur
- `clickValue = signal(1)` - Valeur générée par clic

**Pas de store global** - Le state reste dans la page Game conformément aux contraintes du TP.

#### Flux de données

**Props (descendent)** : Parent → Enfants
```
GamePage
  ├→ GameHeader [money]
  │   └→ MoneyDisplay [money]
  └→ ClickButton [clickValue]
```

**Events (remontent)** : Enfants → Parent
```
ClickButton (onClick)
  → GamePage.handleClick()
    → money.update(...)
```

#### Gestion de l'événement clic
1. L'utilisateur clique sur `ClickButton`
2. Le composant émet l'événement `onClick`
3. `GamePage` écoute et exécute `handleClick()`
4. Le signal `money` est mis à jour : `money.update(current => current + clickValue())`
5. Angular détecte le changement et met à jour l'affichage automatiquement

### Utilitaires

#### `formatNumber` (`src/utils/formatNumber.ts`)
Fonction pure de formatage des grands nombres.
- `999` → `"999"`
- `1200` → `"1.2K"`
- `1250000` → `"1.25M"`

**Isolation** : Logique métier séparée, réutilisable, testable.

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

