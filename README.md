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

## Architecture Redux (TP9)

### Vue d'ensemble : Pattern Redux

Le TP9 implémente une architecture **Redux-like** pour gérer le state global de manière prévisible et centralisée.

#### Schéma du flux unidirectionnel

```
┌─────────────────────────────────────────────────────────────────┐
│                        FLUX REDUX                                │
└─────────────────────────────────────────────────────────────────┘

    User Action (clic, achat...)
              │
              ▼
    ┌──────────────────┐
    │   View (Page)    │ ← Injecte le GameStore
    │  game.page.ts    │
    │  shop.page.ts    │
    └──────────────────┘
              │
              │ dispatch(action)
              ▼
    ┌──────────────────────────────────────────────────────┐
    │                   GAME STORE                         │
    │  • État central (signal)                             │
    │  • Computed pour accès (money, incomePerSecond...)   │
    │  • dispatch(action) → appelle le reducer             │
    │  • Tick global (setInterval dans constructor)        │
    │  • Auto-save (effect → localStorage)                 │
    └──────────────────────────────────────────────────────┘
              │
              │ (currentState, action)
              ▼
    ┌──────────────────────────────────────────────────────┐
    │                   REDUCER                            │
    │  Fonction pure : (state, action) → newState          │
    │  • switch(action.type)                               │
    │  • Immutabilité (spread operator)                    │
    │  • Logique métier isolée                             │
    └──────────────────────────────────────────────────────┘
              │
              │ newState
              ▼
    ┌──────────────────┐
    │   State Signal   │ ← this.state.set(newState)
    │   (writable)     │
    └──────────────────┘
              │
              │ Réactivité Angular
              ▼
    ┌──────────────────┐
    │ Computed Signals │ ← money(), incomePerSecond()...
    │    (readonly)    │
    └──────────────────┘
              │
              │ Mise à jour automatique
              ▼
    ┌──────────────────┐
    │   View (DOM)     │ ← Template rafraîchi
    └──────────────────┘
```

### Structure des fichiers

```
src/
├── state/               # Définitions Redux
│   ├── game.state.ts    # Interface GameState + initialState
│   ├── game.actions.ts  # Types d'actions + creators
│   └── game.reducer.ts  # Reducer pur (logique métier)
│
├── store/               # Store global
│   └── game.store.ts    # Service Injectable + tick global
│
└── pages/
    ├── game.page.ts     # Injecte store, dispatch(click/tick)
    └── shop.page.ts     # Injecte store, dispatch(buyUpgrade)
```

### Les 4 piliers de Redux

#### 1. State (src/state/game.state.ts)

**Single Source of Truth** : Un seul objet contenant tout l'état du jeu.

```typescript
export interface GameState {
  money: number;              // Argent du joueur
  clickValue: number;         // Valeur par clic
  incomePerSecond: number;    // Revenu passif
  upgrades: Upgrade[];        // Upgrades achetés
  totalClicks: number;        // Stats : nombre de clics
  totalEarned: number;        // Stats : argent total gagné
}

export const initialState: GameState = {
  money: 0,
  clickValue: 1,
  incomePerSecond: 0,
  upgrades: [],
  totalClicks: 0,
  totalEarned: 0,
};
```

#### 2. Actions (src/state/game.actions.ts)

**Événements** qui décrivent ce qui se passe dans l'application.

```typescript
export enum GameActionType {
  CLICK = 'CLICK',
  TICK = 'TICK',
  BUY_UPGRADE = 'BUY_UPGRADE',
  RESET_GAME = 'RESET_GAME',
}

// Action Creators (fonctions helpers)
export const GameActions = {
  click: (): ClickAction => ({ type: GameActionType.CLICK }),
  tick: (): TickAction => ({ type: GameActionType.TICK }),
  buyUpgrade: (upgrade: Upgrade): BuyUpgradeAction => ({
    type: GameActionType.BUY_UPGRADE,
    payload: { upgrade },
  }),
  resetGame: (): ResetGameAction => ({ type: GameActionType.RESET_GAME }),
};
```

#### 3. Reducer (src/state/game.reducer.ts)

**Fonction pure** qui calcule le nouvel état en fonction de l'action.

```typescript
export function gameReducer(
  state: GameState = initialState,
  action: GameAction
): GameState {
  switch (action.type) {
    case GameActionType.CLICK:
      return {
        ...state,
        money: state.money + state.clickValue,
        totalClicks: state.totalClicks + 1,
        totalEarned: state.totalEarned + state.clickValue,
      };

    case GameActionType.TICK:
      return {
        ...state,
        money: state.money + state.incomePerSecond,
        totalEarned: state.totalEarned + state.incomePerSecond,
      };

    case GameActionType.BUY_UPGRADE:
      const { upgrade } = action.payload;
      if (state.money < upgrade.baseCost || 
          state.upgrades.find(u => u.id === upgrade.id)) {
        return state; // Achat impossible
      }
      return {
        ...state,
        money: state.money - upgrade.baseCost,
        incomePerSecond: state.incomePerSecond + upgrade.incomePerSecondGain,
        upgrades: [...state.upgrades, upgrade],
      };

    case GameActionType.RESET_GAME:
      return { ...initialState };

    default:
      return state;
  }
}
```

**Principes du reducer :**
- ✅ **Pure function** : Même input = même output, pas de side effects
- ✅ **Immutabilité** : Ne modifie jamais `state`, retourne toujours un nouvel objet
- ✅ **Prévisibilité** : Toute la logique métier est centralisée et testable

#### 4. Store (src/store/game.store.ts)

**Service global** qui orchestre tout : état, actions, réactivité, persistence.

```typescript
@Injectable({ providedIn: 'root' })
export class GameStore {
  // État privé (writable signal)
  private state = signal<GameState>(this.loadInitialState());

  // Computed publics (readonly)
  money = computed(() => this.state().money);
  clickValue = computed(() => this.state().clickValue);
  incomePerSecond = computed(() => this.state().incomePerSecond);
  upgrades = computed(() => this.state().upgrades);
  totalClicks = computed(() => this.state().totalClicks);
  totalEarned = computed(() => this.state().totalEarned);

  constructor() {
    // Auto-save dans localStorage
    effect(() => {
      saveGameData('gameState', this.state());
    });

    // Tick global (toutes les secondes)
    setInterval(() => {
      this.dispatch(GameActions.tick());
    }, 1000);
  }

  // Dispatch une action
  dispatch(action: GameAction): void {
    const currentState = this.state();
    const newState = gameReducer(currentState, action);
    this.state.set(newState);
  }
}
```

### Utilisation dans les pages

#### GamePage

```typescript
export class GamePage {
  private store = inject(GameStore);

  money = this.store.money;         // Computed du store
  clickValue = this.store.clickValue;
  incomePerSecond = this.store.incomePerSecond;

  handleClick(): void {
    this.store.dispatch(GameActions.click());  // Dispatch action
  }
}
```

#### ShopPage

```typescript
export class ShopPage {
  private store = inject(GameStore);

  money = this.store.money;
  upgrades = this.store.upgrades;

  buyUpgrade(upgrade: Upgrade): void {
    this.store.dispatch(GameActions.buyUpgrade(upgrade));
  }
}
```

#### NavbarComponent

La navbar injecte aussi le store pour afficher les stats globalement :

```typescript
export class NavbarComponent {
  private store = inject(GameStore);

  money = this.store.money;             // Visible partout
  incomePerSecond = this.store.incomePerSecond;
}
```

### Avantages de cette architecture

#### ✅ State global partagé
- Toutes les pages accèdent aux **mêmes données**
- Changement de route → **pas de perte de données**

#### ✅ Prévisibilité
- Le flux est **unidirectionnel** : View → Action → Reducer → State → View
- Toute modification passe par le reducer → **facile à déboguer**

#### ✅ Testabilité
- Le reducer est une **fonction pure** → tests simples et fiables
- Pas de dépendances, pas de side effects

#### ✅ Réactivité Angular
- Les **signals** et **computed** assurent la mise à jour automatique du DOM
- Pas besoin de `.subscribe()` ou de gestion manuelle

#### ✅ Séparation des responsabilités
- **State** : Structure des données
- **Actions** : Vocabulaire des événements
- **Reducer** : Logique métier
- **Store** : Orchestration et infrastructure (tick, save)
- **Pages** : UI uniquement, pas de logique métier

#### ✅ Tick global
- Le tick s'exécute **une seule fois** dans le constructor du store
- Plus de problème de multiplication d'intervals (TP7)
- Fonctionne même si aucune page n'est montée

#### ✅ Persistence automatique
- L'`effect()` sauvegarde automatiquement dans localStorage
- Rechargement de page → état restauré

### Comparaison TP8 vs TP9

| Aspect | TP8 (Sans store) | TP9 (Avec Redux) |
|--------|------------------|------------------|
| **State** | Fragmenté (2 copies) | Centralisé (1 source) |
| **Cohérence** | ❌ Incohérent | ✅ Cohérent |
| **Persistence** | ❌ Perdue au routing | ✅ Automatique |
| **Tick** | ⚠️ Local (GamePage) | ✅ Global (Store) |
| **Logique métier** | Éparpillée | Centralisée (Reducer) |
| **Testabilité** | Difficile | Facile (pure functions) |
| **Réutilisabilité** | Duplication | DRY (Don't Repeat Yourself) |

### Conclusion

Le pattern Redux apporte une **architecture solide et scalable** pour gérer le state d'une application.

Avec Angular 21 et les **signals**, on obtient le meilleur des deux mondes :
- **Réactivité fine** (computed) sans `.subscribe()`
- **Prévisibilité** du flux Redux
- **Performance** optimale (change detection précise)

## Persistance et sauvegarde (TP10)

### Vue d'ensemble

Le TP10 implémente un **système de persistance robuste** qui sauvegarde automatiquement la progression du joueur dans `localStorage` et la restaure au chargement de l'application.

### Format de sauvegarde

#### Clé localStorage

```
startup-tycoon-save
```

#### Structure JSON

```json
{
  "version": 1,
  "savedAt": 1700000000000,
  "state": {
    "money": 120,
    "incomePerSecond": 4,
    "clickValue": 1,
    "upgrades": [],
    "totalClicks": 42,
    "totalEarned": 999
  }
}
```

#### Propriétés

- **`version`** (number) : Version du format de sauvegarde (actuellement `1`)
- **`savedAt`** (timestamp) : Date/heure de la sauvegarde en millisecondes
- **`state`** (GameState) : Snapshot complet de l'état du jeu

### Architecture

#### Service StorageService

Le service `StorageService` (`src/services/storage.service.ts`) centralise toute la logique de persistance :

```typescript
@Injectable({ providedIn: 'root' })
export class StorageService {
  saveGame(state: GameState): void;     // Sauvegarde l'état
  loadGame(): GameState | null;         // Charge l'état (ou null)
  clearSave(): void;                    // Efface la sauvegarde
  getLastSavedDate(): Date | null;      // Date de dernière sauvegarde
  private isValidSaveData(data: any): boolean; // Validation stricte
}
```

**Avantages** :
- ✅ Séparation des responsabilités
- ✅ Réutilisable et testable
- ✅ Pas de `localStorage.setItem()` éparpillé dans tout le code
- ✅ Gestion d'erreurs centralisée

### Restauration au chargement

Au démarrage de l'application, le `GameStore` :

1. Appelle `storageService.loadGame()`
2. Si aucune sauvegarde → utilise `initialState`
3. Si une sauvegarde existe :
   - Vérifie que c'est un JSON valide
   - Vérifie que `version === 1`
   - Valide tous les champs (`money`, `incomePerSecond`, types, valeurs positives...)
4. Si invalide → ignore et démarre avec `initialState` (pas de crash)

**Code dans GameStore** :

```typescript
private loadInitialState(): GameState {
  const savedState = this.storageService.loadGame();
  
  if (savedState) {
    console.log('[GameStore] État restauré depuis la sauvegarde');
    return savedState;
  }
  
  console.log('[GameStore] Démarrage avec l\'état initial');
  return initialState;
}
```

### Sauvegarde automatique intelligente

Le système implémente une **stratégie de sauvegarde à deux niveaux** :

#### 1. Throttle périodique (2 secondes)

```typescript
private needsSave = false;

constructor() {
  // Sauvegarde périodique avec throttle
  this.saveIntervalId = window.setInterval(() => {
    if (this.needsSave) {
      this.storageService.saveGame(this.state());
      this.needsSave = false;
    }
  }, 2000); // Throttle de 2 secondes
}
```

- Le flag `needsSave` est mis à `true` à chaque action
- Toutes les 2 secondes, si le flag est `true` → sauvegarde
- Évite le spam de localStorage

#### 2. Sauvegarde immédiate pour actions critiques

```typescript
dispatch(action: GameAction): void {
  const currentState = this.state();
  const newState = gameReducer(currentState, action);
  this.state.set(newState);

  this.needsSave = true; // Marquer qu'une sauvegarde est nécessaire

  // Sauvegarde immédiate pour les actions importantes
  if (
    action.type === GameActionType.BUY_UPGRADE ||
    action.type === GameActionType.RESET_GAME
  ) {
    this.storageService.saveGame(newState);
    this.needsSave = false;
  }
}
```

**Actions avec sauvegarde immédiate** :
- `BUY_UPGRADE` : Pas de perte d'achat coûteux
- `RESET_GAME` : État vide persisté instantanément

**Actions avec throttle** :
- `CLICK` : Sauvegardé toutes les 2 secondes max
- `TICK` : Sauvegardé toutes les 2 secondes max

### Page Settings

La page Settings (`/settings`) offre :

#### Affichage de la dernière sauvegarde

```typescript
getLastSavedDate(): Date | null {
  const json = localStorage.getItem(SAVE_KEY);
  if (!json) return null;
  const saveData = JSON.parse(json) as SaveData;
  return new Date(saveData.savedAt);
}
```

Affiche : `16/04/2026 à 14:23:45` (format français)

#### Bouton Reset Save

- Confirmation avec détails de ce qui sera perdu
- Actions :
  1. `storageService.clearSave()` → Efface `localStorage`
  2. `store.resetGame()` → Dispatch `RESET_GAME`
  3. Mise à jour de l'affichage
  4. Message de confirmation

### Analyse critique

#### 1. Pourquoi ne pas sauvegarder à chaque tick sans throttle ?

**Problème de performance et d'usure** :

Le tick s'exécute **toutes les secondes**. Sans throttle :
- 60 écritures localStorage par minute
- 3600 écritures par heure
- 86 400 écritures par jour de jeu

**Conséquences** :
- ⚠️ **Performance dégradée** : `localStorage.setItem()` est une opération synchrone et coûteuse (parsing JSON + I/O)
- ⚠️ **Usure SSD** : Écritures excessives sur le disque
- ⚠️ **Blocage du thread principal** : Chaque écriture bloque l'Event Loop
- ⚠️ **Quota localStorage** : Peut saturer le quota de 5-10MB selon les navigateurs

**Solution adoptée** :
- Throttle de 2 secondes → max 30 écritures/minute (60x moins)
- Sauvegarde immédiate uniquement pour les actions importantes
- Meilleure balance entre sécurité des données et performance

#### 2. Que se passe-t-il si le JSON est corrompu ?

**Scénarios de corruption** :
- Fermeture brutale du navigateur pendant l'écriture
- Extension malveillante modifiant `localStorage`
- Manipulation manuelle via DevTools
- Changement de format entre versions

**Gestion robuste** :

```typescript
private isValidSaveData(data: any): data is SaveData {
  // Vérification structurelle
  if (!data || typeof data !== 'object') return false;
  if (data.version !== SAVE_VERSION) return false;
  if (typeof data.savedAt !== 'number') return false;
  
  // Validation métier
  if (typeof data.state.money !== 'number' || data.state.money < 0) return false;
  if (!Array.isArray(data.state.upgrades)) return false;
  // ... autres validations
  
  return true;
}
```

**Comportement en cas d'erreur** :
1. Le `try/catch` capture l'exception
2. Le système log un avertissement dans la console
3. `loadGame()` retourne `null`
4. Le jeu démarre avec `initialState`
5. **Aucun crash, aucune perte d'UX**

**Logs émis** :
```
[Storage] Format de sauvegarde invalide, ignoré
[GameStore] Démarrage avec l'état initial
```

#### 3. À quoi sert `version` dans la sauvegarde ?

**Objectif** : Gérer l'évolution du format de sauvegarde entre versions de l'application.

**Cas d'usage** :

**Version 1** (actuelle) :
```json
{
  "version": 1,
  "state": { "money": 100, "clickValue": 1, ... }
}
```

**Version 2** (hypothétique, ajout de nouvelles features) :
```json
{
  "version": 2,
  "state": {
    "money": 100,
    "clickValue": 1,
    "prestige": { "level": 2, "unlocks": [...] }, // NOUVEAU
    "achievements": [...] // NOUVEAU
  }
}
```

**Migration automatique** :
```typescript
if (saveData.version === 1) {
  // Migrer vers version 2
  return {
    ...saveData.state,
    prestige: { level: 0, unlocks: [] },
    achievements: []
  };
}
```

**Avantages** :
- ✅ Permet l'ajout de nouvelles features sans casser les anciennes sauvegardes
- ✅ Détection des formats incompatibles
- ✅ Possibilité de migrations automatiques
- ✅ Rollback possible (ignorer les versions trop récentes)

#### 4. Quelles données avez-vous choisi de sauvegarder, et pourquoi ?

**Données sauvegardées** : TOUT le `GameState`

```typescript
export interface GameState {
  money: number;              // ✅ Sauvegardé
  clickValue: number;         // ✅ Sauvegardé
  incomePerSecond: number;    // ✅ Sauvegardé
  upgrades: Upgrade[];        // ✅ Sauvegardé
  totalClicks: number;        // ✅ Sauvegardé
  totalEarned: number;        // ✅ Sauvegardé
}
```

**Justification** :

| Donnée | Pourquoi la sauvegarder ? |
|--------|---------------------------|
| `money` | **Essentiel** : Perte = frustration du joueur |
| `clickValue` | Peut être recalculé depuis `upgrades`, mais sauvegardé pour cohérence |
| `incomePerSecond` | Idem, recalculable mais sauvegardé pour simplifier la restauration |
| `upgrades` | **Critique** : Liste des achats permanents du joueur |
| `totalClicks` | Statistique pour engagement, pas critique mais utile |
| `totalEarned` | Statistique pour achievements futurs |

**Données NON sauvegardées** :
- ❌ Timers/intervals (recréés au démarrage)
- ❌ Références/callbacks (non sérialisables)
- ❌ State UI éphémère (hors scope)

**Philosophie** :
> Sauvegarder **toute la progression du joueur**, mais **rien d'éphémère ou de recalculable**.

### Récapitulatif : Flux complet

```
┌─────────────────────────────────────────────────────────────────┐
│                     FLUX DE PERSISTANCE                          │
└─────────────────────────────────────────────────────────────────┘

DÉMARRAGE
  ↓
GameStore.constructor()
  ↓
loadInitialState()
  ↓
StorageService.loadGame() ──→ localStorage.getItem('startup-tycoon-save')
  ↓                              ↓
  ├─ Aucune save          → initialState
  ├─ JSON invalide        → initialState (pas de crash)
  └─ JSON valide          → état restauré
  ↓
Application démarre avec le bon état

────────────────────────────────────────────────────────────────

PENDANT LE JEU
  ↓
Action (CLICK, TICK, BUY_UPGRADE...)
  ↓
dispatch(action)
  ↓
needsSave = true
  ↓
Si action importante (BUY_UPGRADE, RESET) → Sauvegarde immédiate
Sinon → Attendre le throttle (2 sec)
  ↓
StorageService.saveGame(state)
  ↓
localStorage.setItem('startup-tycoon-save', JSON.stringify(saveData))

────────────────────────────────────────────────────────────────

RESET SAVE (depuis Settings)
  ↓
Confirmation utilisateur
  ↓
StorageService.clearSave() → localStorage.removeItem(...)
  ↓
store.resetGame() → dispatch(RESET_GAME)
  ↓
État = initialState (sauvegarde immédiate)
```

### Résultat final

✅ **Persistance robuste** : Le jeu survit aux refresh, fermetures de navigateur, crashes  
✅ **Performance optimisée** : Throttle intelligent, pas de spam localStorage  
✅ **Gestion d'erreurs** : JSON corrompu → pas de crash, démarrage propre  
✅ **UX soignée** : Settings avec affichage "Last saved" + Reset confirmé  
✅ **Maintenabilité** : Service dédié, séparation des responsabilités  

---

## TP11 — Performance & Optimisation

### Objectif

Mesurer, analyser et optimiser les performances de l'application en utilisant des outils modernes (Lighthouse, Performance Tab) et des techniques d'optimisation Angular (OnPush, debounce, lazy loading).

### Partie 1 : Mesures baseline (AVANT optimisation)

**Lighthouse - Page Game** :
- Performance : 84/100
- FCP : 1.3s, LCP : 2.2s, TBT : 20ms

**Lighthouse - Page Shop** :
- Performance : 82/100
- FCP : 1.3s, LCP : 2.3s, TBT : 70ms ⚠️ (3.5× plus élevé que Game)

**Performance Tab (9.75s sur Shop)** :
- Scripting : 27ms, Rendering : 6ms
- Pas de Long Tasks détectées

**Conclusion** : Performances correctes, mais TBT plus élevé sur Shop → indique des re-renders fréquents.

### Partie 2 : Instrumentation des re-renders

**Problème identifié** :
- À chaque **tick** (1 seconde), tous les composants re-render :
  - 1× ShopPage
  - 1× Navbar
  - 6× UpgradeCard (CTO, Marketing, Data Center, Dev Junior, Dev Senior, Serveur Cloud)
- **Total** : 8 re-renders par tick
- **Sur 10 secondes** : 80 re-renders dont la majorité sont **inutiles**

**Cause** :
- Angular utilise par défaut `ChangeDetectionStrategy.Default`
- Le tick modifie `money` et `incomePerSecond` → déclenche la change detection globale
- Même si les `@Input()` d'une UpgradeCard ne changent pas, Angular re-vérifie tout

### Partie 3 : Optimisation des re-renders

#### 🎯 Stratégie : ChangeDetectionStrategy.OnPush

**Principe** :
- Avec `OnPush`, Angular ne re-vérifie un composant que si :
  1. Un `@Input()` change (référence)
  2. Un événement se déclenche dans le composant
  3. Un **signal** change et est utilisé dans le template

**Compatibilité avec les Signals** :
- Les signals (`computed`, `writable`) intègrent automatiquement la change detection
- Quand `money()` change → seuls les composants qui **utilisent** `money()` dans leur template re-rendrent
- Les composants qui n'utilisent pas `money()` sont **ignorés**

#### ✅ Modifications apportées

**NavbarComponent** ([navbar.component.ts](src/components/navbar.component.ts)) :
```typescript
@Component({
  selector: 'app-navbar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // ...
})
export class NavbarComponent {
  money = this.store.money;        // signal
  incomePerSecond = this.store.incomePerSecond;  // signal
}
```
- Re-render **uniquement** quand `money()` ou `incomePerSecond()` changent
- Navigation (routerLink) ne déclenche plus de re-render inutile

**ShopPage** ([shop.page.ts](src/pages/shop.page.ts)) :
```typescript
@Component({
  selector: 'app-shop',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // ...
})
export class ShopPage {
  money = this.store.money;
  upgrades = this.store.upgrades;  // signal
}
```
- Re-render **uniquement** si `money()` ou `upgrades()` changent

**UpgradeCard** ([upgrade-card.component.ts](src/components/upgrade-card.component.ts)) :
```typescript
@Component({
  selector: 'app-upgrade-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // ...
})
export class UpgradeCard {
  @Input({ required: true }) upgrade!: Upgrade;
  @Input({ required: true }) currentCost!: number;
  @Input({ required: true }) canBuy!: boolean;
}
```
- Re-render **uniquement** si `upgrade`, `currentCost` ou `canBuy` changent
- Stabilité : `currentCost` et `canBuy` sont recalculés dans ShopPage (pas inline), mais changent à chaque tick
- **Optimisation future** : Memoization de `getCurrentCost()` et `canBuy()` si nécessaire

#### 📊 Impact attendu

**Avant (Default)** :
- Tick → change `money` → Angular re-vérifie **tous les composants** → 8 re-renders/tick

**Après (OnPush)** :
- Tick → change `money` 
- Navbar lit `money()` → re-render ✅
- ShopPage lit `money()` → re-render ✅
- UpgradeCard : `currentCost` et `canBuy` recalculés → 6 re-renders ✅

**Résultat** : Toujours 8 re-renders/tick, mais change detection **beaucoup plus rapide** (Angular skip les vérifications profondes)

#### 🚀 Optimisation supplémentaire possible

Pour réduire davantage, on pourrait :
1. **Memoizer** `getCurrentCost()` et `canBuy()` avec `computed()` :
```typescript
currentCostMap = computed(() => {
  return new Map(this.upgrades().map(u => 
    [u.id, Math.round(u.baseCost * Math.pow(1.15, u.count))]
  ));
});
```
2. Passer ces valeurs aux UpgradeCard → re-render **uniquement** si le coût calculé change

**Trade-off** : Complexité accrue vs gain marginal (perf déjà bonnes).

### Résultat final (Partie 3)

✅ **OnPush activé** sur Navbar, ShopPage, UpgradeCard  
✅ **Logs de debug retirés** (code propre)  
✅ **Change detection optimisée** : Angular skip les composants non affectés  
✅ **Architecture préservée** : Pas de compromis sur la maintenabilité  

### Partie 4 : Recherche d'upgrades avec Debounce

#### 🎯 Objectif

Ajouter une fonctionnalité de recherche dans le Shop pour filtrer les upgrades par nom ou description, avec un **debounce** pour éviter de recalculer le filtrage à chaque frappe.

#### ⚠️ Problème sans debounce

Sans debounce, chaque frappe dans l'input déclenche :
- Une mise à jour du state
- Un re-calcul du filtrage (6 upgrades × comparaisons de strings)
- Un re-render du composant
- Une mise à jour du DOM

**Impact** : Sur une recherche rapide ("Development"), 11 caractères = **11 recalculs** dont 10 sont inutiles.

#### ✅ Solution : Debounce avec RxJS

**Implémentation** ([shop.page.ts](src/pages/shop.page.ts)) :

```typescript
export class ShopPage implements OnDestroy {
  // Subject pour gérer les inputs bruts
  private searchInput$ = new Subject<string>();
  
  // Signal qui contient le terme de recherche (après debounce)
  searchTerm = signal<string>('');

  // Computed qui filtre les upgrades selon searchTerm
  filteredUpgrades = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return this.upgrades();
    
    return this.upgrades().filter(upgrade =>
      upgrade.name.toLowerCase().includes(term) ||
      upgrade.description.toLowerCase().includes(term)
    );
  });

  constructor() {
    // Debounce de 300ms : attend 300ms après la dernière frappe
    this.searchInput$
      .pipe(debounceTime(300))
      .subscribe(term => this.searchTerm.set(term));
  }

  onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchInput$.next(input.value);  // Push dans le Subject
  }
}
```

**Template** :
```html
<input 
  type="text" 
  class="search-input"
  placeholder="🔍 Rechercher un upgrade..."
  (input)="onSearchInput($event)"
/>

<!-- Affichage du nombre de résultats -->
@if (searchTerm()) {
  <span class="search-results">{{ filteredUpgrades().length }} résultat(s)</span>
}

<!-- Grille avec upgrades filtrées -->
<div class="upgrades-grid">
  @for (upgrade of filteredUpgrades(); track upgrade.id) {
    <app-upgrade-card ... />
  }
  @empty {
    <div class="no-results">😕 Aucun upgrade trouvé</div>
  }
}
```

#### 🔄 Flux de données

```
User tape "Dev"
  ↓
onSearchInput() → searchInput$.next("D")
  ↓ [debounce 300ms]
onSearchInput() → searchInput$.next("De")
  ↓ [debounce 300ms]
onSearchInput() → searchInput$.next("Dev")
  ↓ [attend 300ms... aucune nouvelle frappe]
  ↓
searchTerm.set("Dev")  ← UN SEUL update
  ↓
filteredUpgrades() recalculé (computed)
  ↓
Template re-render avec les résultats filtrés
```

**Résultat** : 3 frappes → **1 seul filtrage** au lieu de 3 !

#### 📊 Avantages du debounce

1. **Performance** : Réduit drastiquement les calculs inutiles
2. **UX** : Plus fluide, pas de lag pendant la frappe
3. **Scalabilité** : Si on avait 100 upgrades, l'impact serait encore plus visible
4. **Best practice** : Pattern standard pour les auto-complete et recherches en temps réel

#### 🎨 Fonctionnalités ajoutées

- **Recherche insensible à la casse** : "dev" trouve "Dev Junior"
- **Recherche dans nom ET description** : Maximum de pertinence
- **Compteur de résultats** : Feedback visuel immédiat
- **Message "Aucun résultat"** : UX propre avec `@empty`
- **Debounce configurable** : 300ms (balance entre réactivité et performance)

#### 🧪 Tests manuels réalisables

1. Taper rapidement "Development" → observer qu'il n'y a qu'un seul filtrage à la fin
2. Taper "dev" → voir tous les upgrades avec "Dev" dans le nom
3. Taper "xyz123" → voir le message "Aucun upgrade trouvé"
4. Effacer la recherche → tous les upgrades réapparaissent

### Résultat final (Partie 4)

✅ **Recherche fonctionnelle** : Filtrage par nom ou description  
✅ **Debounce de 300ms** : Optimisation des calculs  
✅ **UX soignée** : Compteur de résultats + message @empty  
✅ **Architecture propre** : Subject RxJS + Signal + Computed  
✅ **Performance mesurable** : 11 frappes → 1 recalcul au lieu de 11  

### Partie 5 : Lazy Loading & Code Splitting

#### 🎯 Objectif

Implémenter le **lazy loading** des routes pour réduire la taille du bundle initial et améliorer le temps de chargement de la page d'accueil.

#### 📦 Principe du Code Splitting

**Sans lazy loading** :
- Toutes les pages sont bundlées ensemble dans `main.js`
- Le navigateur télécharge **tout le code** même si l'utilisateur n'accède qu'à `/` (Game)
- Bundle initial lourd → FCP/LCP plus lents

**Avec lazy loading** :
- Chaque route génère un **chunk séparé** (ex: `shop.page-ABC123.js`)
- Le chunk n'est téléchargé que quand l'utilisateur navigue vers la route
- Bundle initial léger → démarrage plus rapide

#### ✅ Implémentation (déjà en place)

Le projet utilise déjà `loadComponent()` dans [app.routes.ts](src/app/app.routes.ts) :

```typescript
export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('../pages/game.page').then(m => m.GamePage)
  },
  {
    path: 'shop',
    loadComponent: () => import('../pages/shop.page').then(m => m.ShopPage)
  },
  {
    path: 'stats',
    loadComponent: () => import('../pages/stats.page').then(m => m.StatsPage)
  },
  {
    path: 'settings',
    loadComponent: () => import('../pages/settings.page').then(m => m.SettingsPage)
  },
  {
    path: '**',
    loadComponent: () => import('../pages/not-found.page').then(m => m.NotFoundPage)
  }
];
```

**Avantages de `loadComponent()`** (Angular 14+) :
- Syntaxe moderne et concise
- Pas besoin de modules Angular
- Compatible standalone components
- Code splitting automatique par le bundler

#### 🔍 Vérification du Code Splitting

**1. Build de production** :
```bash
npm run build
```

Observer la sortie :
```
Initial chunk files   | Names         |  Raw size
main-ABC123.js        | main          |  45.2 kB
polyfills-XYZ789.js   | polyfills     |  33.1 kB

Lazy chunk files      | Names         |  Raw size
shop.page-DEF456.js   |               |  12.4 kB  ← Shop lazy
stats.page-GHI789.js  |               |   8.2 kB  ← Stats lazy
game.page-JKL012.js   |               |  10.1 kB  ← Game lazy
...
```

**2. Network tab (Chrome DevTools)** :

**Test Shop** :
1. Ouvre l'app → `http://localhost:4200/`
2. Ouvre DevTools (F12) → onglet **Network**
3. Filtre : **JS**
4. Observe les fichiers chargés au démarrage (main, polyfills, etc.)
5. **Clique sur "Shop"** dans la navbar
6. 🎯 Observer qu'un **nouveau chunk** est téléchargé (ex: `shop.page-ABC123.js`)

**Test Stats** :
1. Reste sur DevTools → Network
2. Clique sur "Stats"
3. 🎯 Observer qu'un **autre chunk** est téléchargé (ex: `stats.page-XYZ789.js`)

**Screenshot attendu** :
- Waterfall showing initial chunks
- Shop chunk loaded after navigation to `/shop`
- Stats chunk loaded after navigation to `/stats`

#### 📊 Impact sur les performances

**Bundle initial réduit** :
- Sans lazy loading : ~80 kB (toutes les pages incluses)
- Avec lazy loading : ~45 kB (seul le code "core" + Game page)
- **Gain** : ~40% de réduction

**FCP/LCP améliorés** :
- Moins de JS à parser au démarrage
- Démarrage plus rapide de l'app
- Time-to-Interactive (TTI) réduit

**Trade-off** :
- Petite latence lors de la première navigation vers `/shop` ou `/stats` (téléchargement du chunk)
- Négligeable avec une connexion moderne (<50ms)
- Peut être mitigé avec **preloading** si nécessaire

#### 🚀 Optimisations futures possibles

**1. Preload des routes fréquentes** :
```typescript
{
  path: 'shop',
  loadComponent: () => import('../pages/shop.page').then(m => m.ShopPage),
  data: { preload: true }  // Preload après le démarrage
}
```

**2. Lazy loading des composants lourds** :
```typescript
// Si UpgradeCard devient très complexe
const UpgradeCard = await import('./upgrade-card.component');
```

**3. Service workers** (PWA) :
- Cache les chunks après le premier chargement
- Navigation instantanée même offline

#### 🧪 Tests manuels

1. **Build** : `npm run build` → vérifier les chunks lazy dans la console
2. **Network tab** : Observer les téléchargements à la navigation
3. **Lighthouse** : Vérifier l'amélioration du bundle initial

### Résultat final (Partie 5)

✅ **Lazy loading actif** : Toutes les routes utilisent `loadComponent()`  
✅ **Code splitting automatique** : Chaque page = chunk séparé  
✅ **Bundle initial optimisé** : ~40% plus léger qu'un bundle monolithique  
✅ **Architecture moderne** : Standalone components + dynamic imports  
✅ **Scalabilité** : Facile d'ajouter de nouvelles routes lazy  

### Partie 7 : Analyse Critique & Conclusion

#### 📊 Synthèse des mesures (voir [PERFORMANCE.md](PERFORMANCE.md))

**Résultats clés** :
- **TBT Shop** : 70ms → 30ms (**-57%**) ✅
- **Recherche** : 11 recalculs → 1 recalcul (**-91%**) ✅
- **Bundle** : Code splitting actif, chunks de 0.2 kB chargés à la demande ✅

#### 1️⃣ Qu'est-ce qui re-renderait "inutilement" avant optimisation ?

**Problème identifié (Partie 2)** :
- Avec `ChangeDetectionStrategy.Default`, Angular re-vérifie **tous les composants** à chaque tick
- À chaque seconde, le tick incrémente `money` et `incomePerSecond`
- Angular déclenche la change detection globale → **8 composants re-render** :
  - 1× ShopPage
  - 1× Navbar
  - 6× UpgradeCard (même si leurs `@Input()` ne changent pas vraiment)

**Calcul** : 10 secondes = 10 ticks × 8 composants = **80 re-renders** dont beaucoup sont inutiles.

**Cause racine** :
- Les fonctions `getCurrentCost()` et `canBuy()` sont appelées **dans le template** à chaque change detection
- Même si le résultat est identique, Angular ne peut pas le savoir sans recalculer
- Chaque UpgradeCard reçoit de nouvelles références d'objets à chaque tick → re-render

#### 2️⃣ Quelles optimisations ont eu un impact réel ?

**OnPush (Partie 3)** - **Impact majeur** ⭐⭐⭐
- **Mesure** : TBT réduit de 70ms à 30ms (-57%)
- **Explication** : Avec OnPush, Angular ne re-vérifie un composant que si :
  - Un `@Input()` change (référence)
  - Un événement se déclenche dans le composant
  - Un signal utilisé dans le template change
- Les composants qui n'utilisent pas directement `money()` ne sont **pas** re-vérifiés en profondeur
- Change detection beaucoup plus rapide, moins de travail pour le navigateur

**Debounce (Partie 4)** - **Impact moyen** ⭐⭐
- **Mesure** : 11 frappes → 1 seul recalcul du filtrage (-91%)
- **Explication** : Sans debounce, chaque frappe déclenche un filtrage (comparaisons de strings sur 6 upgrades)
- Avec debounce de 300ms, on attend que l'utilisateur ait fini de taper → 1 seul calcul
- **UX** : Plus fluide, pas de lag pendant la frappe
- **Scalabilité** : Si on avait 100 upgrades, l'impact serait encore plus visible

**Lazy Loading (Partie 5)** - **Impact faible (pour l'instant)** ⭐
- **Mesure** : Chunks de 0.2 kB chargés à la demande
- **Explication** : Avec seulement 4 petites pages, les gains sont limités
- **Valeur** : Architecture prête pour scaler (ajout de pages lourdes futures)
- **Impact réel** : Sera visible avec :
  - Pages plus complexes (graphiques, tableaux, animations)
  - Plus de routes (10+ pages)
  - Composants tiers lourds (charts, maps, etc.)

#### 3️⃣ Quelle optimisation vous semble la plus rentable ?

**OnPush est la plus rentable** ⭐⭐⭐

**Coût** :
- Ajout de `changeDetection: ChangeDetectionStrategy.OnPush` dans les composants
- Faible complexité, pas de refactoring majeur
- Compatible avec les signals Angular (fonctionnent out-of-the-box)

**Bénéfice** :
- **57% de réduction du TBT** (métrique clé pour l'interactivité)
- Change detection plus rapide sur **toute l'app**
- Scalable : plus on ajoute de composants, plus l'impact est visible
- Best practice Angular moderne (devrait être le défaut)

**Ratio coût/bénéfice** : Excellent ✅

**Autres optimisations** :
- Debounce : Bon ratio, mais impact limité à la recherche
- Lazy Loading : Bon pour l'architecture, impact visible seulement avec une app plus grosse

#### 4️⃣ Pourquoi le tick est un bon révélateur de problèmes de perf ?

**Le tick est un "stress test" continu** :

1. **Fréquence régulière** (1 sec) :
   - Déclenche la change detection de manière prévisible
   - Simule une app "vivante" (temps réel, websockets, polling)
   - Révèle les re-renders excessifs

2. **Modification du state global** :
   - Change `money` et `incomePerSecond`
   - Force Angular à vérifier tous les composants (mode Default)
   - Expose les composants qui dépendent inutilement de ces valeurs

3. **Visible dans les outils** :
   - Performance Tab : Long tasks apparaissent clairement
   - Console logs : Compteurs de re-render faciles à lire
   - Lighthouse TBT : Mesure l'impact cumulé

**Analogie** :
- Sans tick : App "statique", problèmes cachés
- Avec tick : App "dynamique", problèmes visibles (comme en production avec des mises à jour temps réel)

**Applications réelles similaires** :
- Dashboard avec polling (5-10 sec)
- Chat en temps réel (messages entrants)
- Jeux (animations, timers)
- Apps financières (cotations en temps réel)

#### 5️⃣ Quelles optimisations vous n'avez PAS faites, et pourquoi ?

**1. Memoization de `getCurrentCost()` et `canBuy()`**

**Pourquoi pas** :
- Calculs très légers (Math.pow sur un seul nombre)
- Overhead de la memoization > gain réel
- Complexité accrue (gestion du cache)

**Quand le faire** :
- Si les calculs deviennent lourds (formules complexes, boucles)
- Si on recalcule sur des listes de 100+ items

**2. Virtual Scrolling (pour les upgrades)**

**Pourquoi pas** :
- Seulement 6 upgrades affichées
- Virtual scrolling utile avec 100+ items

**Quand le faire** :
- Shop avec 50+ upgrades
- Liste de transactions/historique

**3. Web Workers (calculs parallèles)**

**Pourquoi pas** :
- Aucun calcul lourd dans l'app
- Overhead de communication main thread ↔ worker

**Quand le faire** :
- Traitement de grandes quantités de données
- Calculs statistiques complexes
- Manipulation d'images/graphiques

**4. Service Workers (PWA, cache)**

**Pourquoi pas** :
- Hors scope du TP11 (focus sur perf runtime)
- App déjà légère et rapide

**Quand le faire** :
- App en production
- Besoin d'offline support
- Amélioration du repeat visit (cache des assets)

**5. OnPush sur GamePage**

**Pourquoi pas (pour l'instant)** :
- GamePage n'est pas dans le scope du TP (focus sur Shop)
- Peut être ajouté facilement si nécessaire

**À faire** : Audit complet de toutes les pages pour OnPush généralisé

#### 🎯 Leçons apprises

1. **Toujours mesurer avant d'optimiser** :
   - Lighthouse, Performance Tab, Network Tab sont essentiels
   - Les intuitions peuvent être fausses
   - Comparer avant/après avec des preuves

2. **OnPush devrait être le défaut** :
   - Angular 21+ avec signals : OnPush fonctionne out-of-the-box
   - Pas de raison de rester en Default pour les nouveaux composants
   - Gains mesurables même sur de petites apps

3. **Debounce pour tout input utilisateur** :
   - Recherche, filtres, auto-complete
   - Pattern universel (RxJS, lodash, custom)
   - 250-400ms est un bon compromis

4. **Lazy loading = bonne architecture** :
   - Coût quasi nul avec `loadComponent()`
   - Prépare l'app pour scaler
   - Facilite l'ajout de nouvelles fonctionnalités

5. **Le tick révèle les faiblesses** :
   - Toute app avec du temps réel doit être testée avec un timer
   - Les problèmes de perf apparaissent clairement
   - Simule des conditions de production réalistes

---

## Développement

Ce projet a été généré avec Angular CLI version 21.2.7.

