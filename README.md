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

## Gestion du tick et Event Loop (TP7)

### Revenu passif (income per second)

Le jeu implémente un système de revenu passif avec un tick toutes les secondes :
- **State** : `incomePerSecond = signal(0)` dans `GamePage`
- **Interval** : Créé dans `ngOnInit()` avec `window.setInterval(() => {...}, 1000)`
- **Nettoyage** : Détruit dans `ngOnDestroy()` avec `clearInterval(this.intervalId)`

### Pourquoi nettoyer l'interval ?

**Sans nettoyage** : À chaque recréation du composant (changement de route, refresh), un nouvel interval serait créé **sans supprimer l'ancien**. Résultat : multiplication des ticks → accélération du temps (2x, 3x, etc.).

**Avec nettoyage** : L'interval est correctement détruit quand le composant est démonté, garantissant un seul tick par seconde.

### Flow de l'Event Loop

1. **`setInterval(callback, 1000)`** → Enregistré dans les **Web APIs** du navigateur
2. Toutes les 1000ms, la Web API envoie `callback` dans la **Task Queue** (Macrotask)
3. L'**Event Loop** vérifie si le **Call Stack** est vide
4. Si vide, il déplace `callback` de la Task Queue vers le Call Stack
5. Le code du callback s'exécute (mise à jour de `money` via signal)
6. Angular détecte le changement et met à jour le DOM

Ce mécanisme garantit que les ticks ne bloquent jamais le thread principal et s'exécutent de manière asynchrone.

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

## Analyse du partage de state (TP8)

### Système d'upgrades

Le Shop permet d'acheter des upgrades qui augmentent le revenu passif du jeu :
- **6 upgrades** : Dev Junior, Dev Senior, Serveur Cloud, Marketing, CTO, Data Center
- **Coût croissant** : `currentCost = round(baseCost * (1.15 ^ count))`
- **Validation** : Bouton désactivé si fonds insuffisants
- **Composant** : `UpgradeCard` pour la réutilisabilité (props + events)

### Problème : State fragmenté et incohérent

#### 1. Où vivent `money` et `incomePerSecond` ?

Actuellement, ces données vivent **dans deux endroits différents** :
- Dans **`GamePage`** : `money = signal(0)` et `incomePerSecond = signal(0)`
- Dans **`ShopPage`** : `money = signal(0)` et `incomePerSecond = signal(0)`

Ces deux copies sont **complètement indépendantes** et ne se synchronisent jamais.

#### 2. Shop et Game ont-ils besoin des mêmes données ?

**Oui, absolument.** Les deux pages dépendent des mêmes informations :
- **Game** : Affiche l'argent et le génère (clic + tick), affiche l'income/sec
- **Shop** : Affiche l'argent, le dépense, modifie l'income/sec via les upgrades

Ces données représentent **l'état central du jeu** et doivent être partagées.

#### 3. Comment avez-vous fait pour partager ces données sans store global ?

**Réponse honnête : Je ne les ai pas partagées.**

Chaque page gère sa propre copie locale. Conséquences :
- Si on gagne 100$ dans Game et qu'on va au Shop → le Shop affiche 0$
- Si on achète un upgrade dans Shop (income +5$/sec) et qu'on retourne à Game → Game affiche toujours 0$/sec
- Les upgrades achetées dans Shop ne persistent pas
- Le joueur "perd" son argent à chaque changement de page

**Solution actuelle :** Bouton de test "+100$" dans Shop pour simuler de l'argent, mais c'est une béquille temporaire.

#### 4. Qu'est-ce qui devient fragile dans votre solution actuelle ?

**Tout.** Cette architecture est cassée par design :

- ❌ **Incohérence des données** : Deux sources de vérité pour les mêmes informations
- ❌ **Perte de données** : Changement de page = reset du state
- ❌ **Impossibilité de synchronisation** : Pas de mécanisme pour propager les changements
- ❌ **Duplication de logique** : Chaque page doit implémenter sa propre gestion de l'argent
- ❌ **Tests difficiles** : Impossible de tester le flow complet (Game → Shop → Game)
- ❌ **Mauvaise UX** : Le jeu ne fonctionne pas comme attendu

### Conclusion : Le besoin d'un state global

Cette implémentation démontre concrètement **pourquoi un state global est nécessaire** :

> Sans store centralisé, il est impossible de maintenir une cohérence entre les pages qui partagent des données. L'argent et le revenu passif doivent vivre dans un endroit unique accessible par toutes les pages.

**Prochaine étape** : Implémenter un service de state global (ou utiliser un store comme NgRx/Akita) pour résoudre ces problèmes architecturaux.

## Développement

Ce projet a été généré avec Angular CLI version 21.2.7.

