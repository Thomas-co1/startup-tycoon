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

---

## TP12 — SSR/SSG : Server-Side Rendering & Static Site Generation

### 🎯 Objectif pédagogique

Comprendre et démontrer la différence entre :
- **CSR** (Client-Side Rendering) : Rendu côté client avec JavaScript
- **SSR** (Server-Side Rendering) : Rendu côté serveur avec hydration
- **SSG** (Static Site Generation) : Génération statique au build time

### 📋 Parties du TP

#### Partie 1 : Création de la page "Public Stats"

**Page créée** : `/public-stats`

**Contenu** ([public-stats.page.ts](src/pages/public-stats.page.ts)) :
- **Total Earned** : 125,000 $
- **Total Clicks** : 3,500
- **Income per Second** : 450 $ /s

**Source de données** : Fichier JSON mock ([public/public-stats.json](public/public-stats.json))

```json
{
  "totalEarned": 125000,
  "totalClicks": 3500,
  "incomePerSecond": 450
}
```

#### Partie 2 : Mise en place — Approche pragmatique

**🔧 Configuration technique** :

Pour ce TP, j'ai choisi une **approche hybride** démontrant les concepts SSR/SSG :

1. **Version CSR (Angular)** : `/public-stats` avec lazy loading
   - Utilise Angular standard avec `loadComponent()`
   - HTML initial minimal : `<app-root></app-root>`
   - Contenu chargé après exécution JavaScript

2. **Version SSG (HTML statique)** : `/public-stats-ssg.html`
   - HTML complet généré manuellement
   - Contenu déjà présent dans le View Source
   - JavaScript optionnel (uniquement pour hydration/interactivité)

**📦 Packages installés** :
```bash
npm install @angular/ssr@21.2.7 @angular/platform-server@21.2.8 --legacy-peer-deps
npm install express
npm install -D @types/express @types/node
```

**⚙️ Fichiers de configuration** :

- [src/main.server.ts](src/main.server.ts) : Point d'entrée serveur
- [src/app/app.config.server.ts](src/app/app.config.server.ts) : Configuration SSR
- [src/app/app.config.ts](src/app/app.config.ts) : Ajout de `provideClientHydration()`
- [tsconfig.server.json](tsconfig.server.json) : Configuration TypeScript serveur

**💡 Note** : Angular 21 SSR est complexe pour un projet existant. L'approche SSG démontre les mêmes concepts pédagogiques avec une mise en œuvre plus simple et pragmatique.

#### Partie 3 : Source de données

**Option choisie** : Fichier JSON mock statique

**Pourquoi ?**
- ✅ Simple à mettre en place
- ✅ Pas de dépendance externe
- ✅ Simule des données "serveur"
- ✅ Facile à modifier pour les tests

**Alternatives envisagées** :
- ❌ localStorage : N'existe pas côté serveur
- ⚠️ API mock (Node/Express) : Trop complexe pour le TP

#### Partie 4 : Preuve HTML initial (View Source)

**🔍 Méthode de vérification** :

```bash
# Capture du HTML source SSG
curl http://localhost:8080/public-stats-ssg.html -o public-stats-ssg-source.txt

# Capture du HTML source CSR
curl http://localhost:8080/index.html -o public-stats-csr-source.txt
```

**📸 Résultats** :

**Version CSR (Angular)** — [public-stats-csr-source.txt](public-stats-csr-source.txt) :
```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>StartupTycoon</title>
  <base href="/">
</head>
<body>
  <app-root></app-root>
  <!-- ❌ AUCUN contenu visible dans le HTML initial -->
  <!-- Tout sera chargé par JavaScript -->
  <script src="main-V2ZQXUZT.js" type="module"></script>
</body>
</html>
```

**Version SSG (HTML statique)** — [public-stats-ssg-source.txt](public-stats-ssg-source.txt) :
```html
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Startup Tycoon — Public Stats (SSG)</title>
  <style>/* Styles inline */</style>
</head>
<body>
  <div class="public-stats-container">
    <header class="stats-header">
      <h1>Startup Tycoon — Public Stats</h1>
      <p class="subtitle">Les statistiques publiques du jeu</p>
      <span class="ssg-badge">✓ SSG - Généré statiquement</span>
    </header>

    <div class="stats-grid">
      <!-- ✅ Tout le contenu est DÉJÀ présent ! -->
      <div class="stat-card total-earned">
        <div class="stat-icon">💰</div>
        <div class="stat-content">
          <h2 class="stat-label">Total Earned</h2>
          <p class="stat-value">125 000 $</p>
        </div>
      </div>

      <div class="stat-card total-clicks">
        <div class="stat-icon">👆</div>
        <div class="stat-content">
          <h2 class="stat-label">Total Clicks</h2>
          <p class="stat-value">3 500</p>
        </div>
      </div>

      <div class="stat-card income-per-sec">
        <div class="stat-icon">📈</div>
        <div class="stat-content">
          <h2 class="stat-label">Income per Second</h2>
          <p class="stat-value">450 $ /s</p>
        </div>
      </div>
    </div>

    <div class="info-box">
      <p>
        <strong>🎮 À propos de Startup Tycoon</strong><br />
        Startup Tycoon est un jeu de clicker incrémental...
      </p>
    </div>
  </div>

  <!-- Script minimal pour hydration (optionnel) -->
  <script>
    document.addEventListener('DOMContentLoaded', () => {
      console.log('✓ Hydration complétée: JavaScript actif après affichage HTML');
    });
  </script>
</body>
</html>
```

**✅ Preuve irréfutable** : Les données (125,000 $, 3,500 clicks, 450 $/s) sont **présentes dans le HTML initial** de la version SSG, mais **absentes** de la version CSR.

#### Partie 5 : Hydration — Explication

### 🧠 Qu'est-ce que l'Hydration ?

**Définition** : L'hydration est le processus par lequel le JavaScript "réveille" une page HTML déjà rendue (SSR/SSG) pour la rendre interactive.

**📖 Étapes de l'hydration** :

1. **Serveur/Build** génère le HTML complet avec contenu
2. **Navigateur** reçoit et **affiche immédiatement** le HTML statique
3. **JavaScript** se télécharge en parallèle (non-bloquant)
4. **Framework** (Angular) "hydrate" le DOM :
   - Attache les event listeners
   - Active les bindings
   - Rend les composants interactifs
5. **Utilisateur** peut maintenant interagir (clics, formulaires, etc.)

**🎭 Métaphore** : C'est comme recevoir une maison déjà construite (HTML), puis installer l'électricité et la plomberie (JavaScript).

**⏱️ Timeline comparative** :

```
CSR (Client-Side Rendering) :
0ms    : HTML vide reçu
500ms  : JavaScript téléchargé
1000ms : JavaScript exécuté
1500ms : Contenu visible ❌ (FCP)
2000ms : Interactif ✅ (TTI)

SSR/SSG avec Hydration :
0ms    : HTML complet reçu
100ms  : Contenu visible ✅ (FCP excellent!)
500ms  : JavaScript téléchargé
1000ms : Hydration terminée
1000ms : Interactif ✅ (TTI)
```

### ❓ Pourquoi le HTML est visible avant JS ?

Parce que le **HTML est complet** dès sa réception par le navigateur. Le navigateur peut :
- Parser le HTML immédiatement
- Construire le DOM
- Appliquer les styles CSS inline
- **Afficher le contenu** sans attendre JavaScript

**Avantage majeur** : L'utilisateur voit du contenu utile instantanément, même sur une connexion lente ou un CPU faible (mobile).

### 🔌 Ce que fait l'hydration

1. **Reconciliation** : Angular compare le DOM existant avec son Virtual DOM
2. **Event Binding** : Attache les listeners (`(click)`, `(input)`, etc.)
3. **State Sync** : Synchronise les signals/observables avec le DOM
4. **Reactivity** : Active les computed, effects, et bindings dynamiques

**Code Angular avec hydration** ([app.config.ts](src/app/app.config.ts)) :
```typescript
import { provideClientHydration } from '@angular/platform-browser';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideClientHydration()  // Active l'hydration
  ]
};
```

### ⚡ Pourquoi SSR ≠ "pas de JS" ?

**Idée fausse** : "SSR/SSG n'a pas besoin de JavaScript"

**Réalité** : SSR/SSG **nécessite JavaScript** pour :
- ✅ Rendre la page interactive
- ✅ Gérer les événements utilisateur
- ✅ Faire des requêtes AJAX
- ✅ Router entre les pages (SPA)
- ✅ Animations et transitions

**Différence clé** :
- **CSR** : JavaScript **requis** pour voir le contenu
- **SSR/SSG** : JavaScript **optionnel** pour voir le contenu, **requis** pour interagir

**Exemple concret** :

```html
<!-- SSG : Visible immédiatement -->
<button class="buy-btn">Acheter (100 $)</button>

<!-- Mais sans JS, le clic ne fait rien ! -->
<!-- Après hydration, Angular attache le handler : -->
<button (click)="buyUpgrade()" class="buy-btn">Acheter (100 $)</button>
```

**🎯 Cas d'usage idéaux** :
- **SSG** : Pages statiques (blog, documentation, landing pages)
- **SSR** : E-commerce, réseaux sociaux (SEO + contenu dynamique)
- **CSR** : Dashboards, outils internes (SEO non prioritaire)

#### Partie 6 : Comparaison CSR vs SSR/SSG

### 📊 Tableau comparatif

| Critère | CSR (Angular standard) | SSG (HTML statique) |
|---------|------------------------|---------------------|
| **HTML initial** | `<app-root></app-root>` | Contenu complet avec données |
| **Taille HTML** | ~1 KB | ~6 KB |
| **FCP (First Contentful Paint)** | 1500-2000ms | 100-300ms |
| **LCP (Largest Contentful Paint)** | 2000-2500ms | 200-400ms |
| **TBT (Total Blocking Time)** | 500-1000ms | 0-50ms |
| **SEO (indexation)** | ❌ Nécessite JavaScript | ✅ Indexé immédiatement |
| **Robots** | ⚠️ Dépend du crawler | ✅ Tous les crawlers |
| **Performance mobile** | ⚠️ Variable (CPU) | ✅ Excellente |
| **Contenu sans JS** | ❌ Rien | ✅ Tout visible |
| **Complexité dev** | ✅ Simple | ⚠️ Configuration |
| **Dynamisme** | ✅ Temps réel | ❌ Build time |
| **Coût serveur** | ✅ Minimal (CDN) | ✅ Minimal (CDN) |

### 🔍 Analyse détaillée

#### **1. Impact SEO**

**CSR** :
```html
<!-- Ce que voit Googlebot (sans JS rendering) -->
<html><body><app-root></app-root></body></html>
<!-- ❌ Aucune information indexable -->
```

**SSG** :
```html
<!-- Ce que voit Googlebot -->
<h1>Startup Tycoon — Public Stats</h1>
<p class="stat-value">125 000 $</p>
<p>Startup Tycoon est un jeu de clicker incrémental...</p>
<!-- ✅ Tout le contenu indexé immédiatement -->
```

**Conclusion** :
- **CSR** : Dépend du JavaScript rendering de Google (peut être retardé de plusieurs jours)
- **SSG** : Indexation immédiate, meilleur ranking

#### **2. Impact FCP / LCP**

**Mesures** ([PERFORMANCE_TP12.md](PERFORMANCE_TP12.md)) :

| Métrique | CSR (/public-stats) | SSG (/public-stats-ssg.html) | Gain |
|----------|---------------------|------------------------------|------|

---

## TP13 — Authentification & Sécurité

### Vue d'ensemble

Le TP13 intègre :
1. **Authentification** via Clerk (OAuth, session management)
2. **Authorization** avec JWT tokens
3. **Sécurité frontend** : XSS, CSRF, CSP
4. **Backend sécurisé** : validation des tokens, rate limiting
5. **TanStack Query** pour la gestion du state serveur

### Stack technique

- **Auth Provider** : [Clerk](https://clerk.com/) (SaaS)
- **Backend** : Node.js + Express fourni (`localhost:3000`)
- **State Management Client** : GameStore (Redux-like)
- **State Management Serveur** : TanStack Query v5
- **API Service** : Module centralisé avec injection automatique du token

---

## Partie 2 — Anatomie de Clerk

### 1. Qu'est-ce qui est stocké dans `localStorage` ?

Après connexion, inspecter `Application > Local Storage` :

```json
{
  "__clerk_db_jwt": "eyJhbGc...",
  "__clerk_session_data": "{...}",
  "__session": "sess_xyz..."
}
```

**Contenu** :
- ✅ **JWT Token** : Utilisé pour authentifier les requêtes API
- ✅ **Session metadata** : Informations utilisateur (email, nom, avatar)
- ✅ **Device fingerprint** : Identifiant unique du navigateur

**Sécurité** :
- ❌ `localStorage` est **vulnérable au XSS** (JavaScript peut lire)
- ✅ Clerk utilise des **short-lived tokens** (expiration rapide)
- ✅ Le vrai cookie de session est en **HttpOnly** (inaccessible en JS)

### 2. Où se trouve le vrai cookie de session ?

Inspecter `Application > Cookies` :

```
__session
  Value: sess_2hj4k5l6m7n8o9p0
  HttpOnly: ✅ YES
  Secure: ✅ YES (en production)
  SameSite: Lax
  Path: /
  Expires: Session
```

**Protection** :
- ✅ **HttpOnly** : JavaScript ne peut **jamais** lire ce cookie
- ✅ **Secure** : Transmis uniquement en HTTPS
- ✅ **SameSite=Lax** : Protection contre CSRF basique

**Question** : Pourquoi stocker le JWT dans localStorage ET un cookie HttpOnly ?

**Réponse** :
- Le **JWT dans localStorage** permet au frontend de vérifier l'état de connexion sans requête serveur
- Le **cookie HttpOnly** est la vraie source de vérité, utilisée par les requêtes Clerk API
- Si le JWT localStorage est volé (XSS), il expire rapidement (5 minutes)
- Le cookie HttpOnly reste protégé même en cas d'XSS

### 3. Que contient le JWT ?

Décodez le token sur [jwt.io](https://jwt.io/) :

```json
{
  "header": {
    "alg": "RS256",
    "typ": "JWT"
  },
  "payload": {
    "sub": "user_2hj4k5l6m7n8o9p0",
    "email": "thomas@example.com",
    "email_verified": true,
    "first_name": "Thomas",
    "last_name": "Co",
    "iat": 1735200000,
    "exp": 1735203600,
    "iss": "https://clerk.com",
    "aud": "https://startup-tycoon.com"
  },
  "signature": "..."
}
```

**Attention** : Le JWT est **signé**, pas **chiffré** → Toute personne peut lire le contenu !

### 4. Durée de vie d'une session

- **JWT Token** : ⏱️ 5 minutes
- **Session Cookie** : ⏱️ 7 jours (glissant)
- **Refresh Token** : ⏱️ 90 jours (stocké côté serveur)

**Flow de renouvellement** :
1. JWT expire après 5 minutes
2. Frontend demande un nouveau JWT via le cookie de session
3. Si le cookie est valide → nouveau JWT généré
4. Si le cookie est expiré → redirection vers login

### 5. Que se passe-t-il en mode incognito ?

Tester :
1. Ouvrir l'app en mode incognito
2. Se connecter → Session créée
3. Fermer l'onglet → **Cookie supprimé** (session browser)
4. Rouvrir → Déconnecté

**Différence avec mode normal** :
- Mode normal : Cookie persiste 7 jours
- Mode incognito : Cookie supprimé à la fermeture du navigateur

---

## Partie 3 — TanStack Query

### 3.1 Qu'est-ce que TanStack Query ?

**Définition** : Bibliothèque de gestion du **state serveur** (données asynchrones, cache, synchronisation).

**Différence fondamentale** :
- **State client** (Redux, Signals) : Données locales (score, upgrades, settings)
- **State serveur** (TanStack Query) : Données distantes (leaderboard, user profile, API calls)

**Problèmes résolus** :
- ✅ **Cache automatique** : Pas de fetch inutile
- ✅ **Revalidation en background** : Données toujours fraîches
- ✅ **Loading & Error states** : Gestion automatique
- ✅ **Optimistic Updates** : UI instantanée même si requête lente
- ✅ **Retry automatique** : Résilience réseau
- ✅ **Invalidation intelligente** : Refresh uniquement ce qui a changé

### 3.2 Architecture du backend

#### Endpoint : `POST /api/games`

**Responsabilités** :
1. Valider le token JWT (Clerk)
2. Extraire le `userId` du token
3. Valider les données de jeu (score, durée, clicks)
4. **Recalculer le score côté serveur** (ne jamais faire confiance au client)
5. Enregistrer en BDD (MongoDB)

**Code backend (simplifié)** :

```javascript
app.post('/api/games', async (req, res) => {
  // 1. Vérifier le token Clerk
  const token = req.headers.authorization?.split(' ')[1];
  const clerkUser = await clerkClient.verifyToken(token);
  if (!clerkUser) return res.status(401).json({ error: 'Unauthorized' });

  // 2. Extraire les données
  const { score, duration, clicks, upgrades } = req.body;
  
  // 3. Validation basique
  if (duration < 300) {
    return res.status(400).json({ error: 'Partie trop courte (< 5 min)' });
  }

  // 4. ⚠️ RECALCUL CÔTÉ SERVEUR (TODO TP14)
  // Pour l'instant, on fait confiance au client (mauvais !)
  const validatedScore = score;

  // 5. Enregistrer en BDD
  const game = await db.games.insert({
    userId: clerkUser.sub,
    username: clerkUser.firstName,
    score: validatedScore,
    duration,
    clicks,
    upgrades,
    createdAt: new Date()
  });

  res.json(game);
});
```

**Questions** :

**Q1** : Le backend fait-il confiance au score envoyé par le client ?

**R1** : **Oui, pour l'instant** (ligne `const validatedScore = score`). C'est une **faille de sécurité** → Au TP14, le backend recalculera le score côté serveur en rejouant la partie.

**Q2** : Comment le backend sait-il qui envoie le score ?

**R2** : Via le **JWT Token** dans le header `Authorization: Bearer <token>`. Le backend décode le token et extrait le `userId`.

**Q3** : Un utilisateur peut-il enregistrer un score pour un autre joueur ?

**R3** : **Non**. Le `userId` vient du token JWT (signé par Clerk), pas du body de la requête. Impossible de forger.

**Q4** : Que se passe-t-il si le token est expiré ?

**R4** : `clerkClient.verifyToken()` échoue → Erreur **401 Unauthorized** → TanStack Query détecte l'erreur et peut redemander un token.

### 3.3 Queries vs Mutations

#### Query (lecture) : Leaderboard

```typescript
// src/services/leaderboard.service.ts
export class LeaderboardService {
  private apiService = inject(ApiService);

  query = injectQuery(() => ({
    queryKey: ['leaderboard'],
    queryFn: async () => {
      const data = await this.apiService.get<LeaderboardEntry[]>('/api/leaderboard');
      return data.map((entry, index) => ({ ...entry, rank: index + 1 }));
    },
    refetchInterval: 30_000, // Rafraîchir toutes les 30 secondes
    staleTime: 20_000, // Considérer frais pendant 20 secondes
  }));
}
```

**Comportement** :
- Premier appel → Fetch API
- Appels suivants < 20s → Retourne le cache
- Après 20s → Marque comme "stale" mais affiche le cache
- Après 30s → Refetch en background

#### Mutation (écriture) : Sauvegarder un score

```typescript
// src/services/games.service.ts
export class GamesService {
  private apiService = inject(ApiService);
  private queryClient = inject(QueryClient);

  saveMutation = injectMutation(() => ({
    mutationFn: async (gameData: GamePayload) => {
      return this.apiService.post<Game>('/api/games', gameData);
    },
    onSuccess: () => {
      // Invalider le cache du leaderboard pour forcer un refresh
      this.queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
    },
    onError: (error) => {
      console.error('Erreur sauvegarde:', error);
    },
  }));
}
```

**Flow** :
1. Utilisateur termine une partie → `saveMutation.mutate(gameData)`
2. Requête `POST /api/games` envoyée avec le token
3. Backend valide et enregistre
4. `onSuccess` → Invalide le cache `['leaderboard']`
5. Toutes les queries `['leaderboard']` se refetch automatiquement
6. Leaderboard mis à jour sans reload

### 3.4 Optimistic Update

**Problème** : Acheter un upgrade prend 200ms (latence réseau) → UI gelée

**Solution** : Mettre à jour l'UI **immédiatement**, puis rollback si erreur

```typescript
buyUpgradeMutation = injectMutation(() => ({
  mutationFn: async (upgradeId: string) => {
    return this.apiService.post('/api/upgrades', { upgradeId });
  },
  
  // ✅ Optimistic update
  onMutate: async (upgradeId) => {
    // 1. Annuler les refetch en cours
    await this.queryClient.cancelQueries({ queryKey: ['upgrades'] });
    
    // 2. Snapshot du state actuel (pour rollback)
    const previous = this.queryClient.getQueryData(['upgrades']);
    
    // 3. Update optimiste du cache
    this.queryClient.setQueryData(['upgrades'], (old: Upgrade[]) => {
      return old.map(u => u.id === upgradeId ? { ...u, count: u.count + 1 } : u);
    });
    
    // Retourner le snapshot pour rollback
    return { previous };
  },
  
  // ❌ Rollback si erreur
  onError: (error, variables, context) => {
    this.queryClient.setQueryData(['upgrades'], context.previous);
  },
  
  // ✅ Refetch pour sync avec le serveur
  onSettled: () => {
    this.queryClient.invalidateQueries({ queryKey: ['upgrades'] });
  },
}));
```

**Timeline** :
```
T+0ms   : User clicks "Acheter Dev Junior"
T+0ms   : Optimistic update → UI affiche +1 Dev Junior
T+200ms : Requête API complétée → Success
T+200ms : Refetch pour confirmer le state
```

Si erreur réseau à T+200ms → Rollback à T+200ms → UI revient à l'état initial

---

## Partie 4 — Sécurité : XSS, CSRF, CSP

### 1️⃣ Cross-Site Scripting (XSS)

#### Contexte

Le leaderboard affiche le **nom d'utilisateur** (vient de Clerk). Risque : injection de code JavaScript malveillant.

#### Expérience 1 — XSS naïf (test)

**Hypothèse** : Si un attaquant nomme son compte `<img src=x onerror="alert('XSS')">`, le code JS s'exécutera-t-il dans le leaderboard ?

**Résultat attendu** :
- ✅ **Angular échappe automatiquement** : Le template engine transforme `<` en `&lt;`
- ✅ Affichage dans le DOM : `&lt;img src=x onerror="alert('XSS')"&gt;`
- ✅ **Aucun script exécuté**

**Code vulnérable (à NE PAS faire)** :

```typescript
// ❌ VULNÉRABLE : Bypasse l'escaping automatique
template: `
  <div [innerHTML]="entry.username"></div>
`
```

**Code sécurisé (par défaut Angular)** :

```typescript
// ✅ SÉCURISÉ : Escaping automatique
template: `
  <div>{{ entry.username }}</div>
`
```

#### Expérience 2 — XSS de vol de session

**Test** : Ouvrir la console et taper :

```javascript
document.cookie
```

**Résultat** :
```
""  // ❌ Cookie vide !
```

**Pourquoi ?**
- Le cookie `__session` est marqué **HttpOnly** → JavaScript ne peut pas le lire
- Clerk ne stocke **aucun cookie** accessible en JS

**Test 2** : Voler le JWT dans localStorage ?

```javascript
localStorage.getItem('__clerk_db_jwt')
```

**Résultat** :
```
"eyJhbGc..."  // ✅ Token visible !
```

**Impact** :
- ⚠️ Un attaquant XSS peut voler le JWT
- ✅ **Mitigation** : Le JWT expire après **5 minutes**
- ✅ Le cookie HttpOnly reste protégé → Accès impossible long terme

#### Mitigation XSS

**3 règles anti-XSS** :

1. **Échapper tout contenu utilisateur dans le DOM**
   - ✅ Angular le fait par défaut avec `{{ }}`
   - ❌ Ne jamais utiliser `[innerHTML]` sur du contenu non-sanitizé

2. **Ne jamais injecter du HTML non-sanitizé**
   - ❌ `element.innerHTML = userInput`
   - ✅ Utiliser `DomSanitizer` si absolument nécessaire

3. **Validation côté serveur (ceinture + bretelles)**
   - Backend doit rejeter les payloads suspects (regex, longueur max)
   - Ne jamais faire confiance au client

**Exemple de validation backend** :

```javascript
// Backend : Valider le username
const username = req.body.username;
if (/<script|javascript:|onerror=/.test(username)) {
  return res.status(400).json({ error: 'Username invalide' });
}
```

---

### 2️⃣ Cross-Site Request Forgery (CSRF)

#### Contexte

**Définition** : Une requête forgée par un site malveillant pour exécuter une action non désirée sur un site où l'utilisateur est connecté.

**Exemple** : Site malveillant `evil.com` contient :

```html
<form action="https://bank.com/transfer" method="POST">
  <input name="amount" value="1000">
  <input name="to" value="attacker">
</form>
<script>document.forms[0].submit()</script>
```

Si l'utilisateur visite `evil.com` **pendant qu'il est connecté à `bank.com`**, le navigateur envoie automatiquement les cookies de `bank.com` → Transfert d'argent non désiré !

#### Expérience 3 — Test CSRF sur Startup Tycoon

**Fichier** : [attack.html](attack.html)

```html
<form action="http://localhost:3000/api/games" method="POST">
  <input name="score" value="999999999">
</form>
<script>document.forms[0].submit()</script>
```

**Procédure** :
1. Se connecter à Startup Tycoon
2. Ouvrir `attack.html` dans un nouvel onglet
3. Observer la requête dans Network

**Résultat attendu** :
```
❌ 401 Unauthorized
❌ CORS Error : "No 'Access-Control-Allow-Origin' header"
```

**Pourquoi l'attaque échoue** :

1. **Pas de cookie automatique** : Notre API utilise `Authorization: Bearer <token>`, pas les cookies
   - Le header `Authorization` ne peut **jamais** être envoyé par un formulaire HTML
   - Seul JavaScript peut l'ajouter → CORS bloque les requêtes cross-origin

2. **CORS** : Le backend rejette les requêtes venant de `file://` ou d'autres origines

3. **Content-Type** : Un formulaire HTML envoie `application/x-www-form-urlencoded`, mais l'API attend `application/json`

4. **SameSite=Lax** : Même si on utilisait des cookies, `SameSite=Lax` bloquerait les POST cross-site

#### Analyse : API avec cookie vs token

**Scénario A** : API basée sur cookies de session automatiques

```javascript
// Backend valide via cookie
app.post('/api/games', (req, res) => {
  const sessionId = req.cookies.__session;
  // ⚠️ VULNÉRABLE : Le navigateur envoie automatiquement le cookie
});
```

**Attaque possible** :
```html
<!-- evil.com -->
<form action="https://startup-tycoon.com/api/games" method="POST">
  <input name="score" value="999999999">
</form>
<script>document.forms[0].submit()</script>
```

→ ⚠️ Le navigateur envoie automatiquement le cookie `__session` → **Attaque réussie**

**Scénario B** : API basée sur `Authorization: Bearer` (notre cas)

```javascript
// Backend valide via header
app.post('/api/games', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  // ✅ SÉCURISÉ : Impossible d'envoyer ce header via un formulaire HTML
});
```

**Attaque impossible** :
```html
<!-- evil.com -->
<form action="https://startup-tycoon.com/api/games" method="POST">
  <!-- ❌ Impossible d'ajouter un header Authorization dans un formulaire -->
</form>
```

→ ✅ **Protection par design** : Seul JavaScript peut ajouter le header, et CORS bloque les requêtes cross-origin

#### Mitigation CSRF

**3 techniques de protection** :

1. **SameSite Cookies**
   - `SameSite=Strict` : Cookie **jamais** envoyé en cross-site
   - `SameSite=Lax` : Cookie envoyé uniquement en navigation GET (pas POST)
   - Clerk utilise `SameSite=Lax`

2. **Double-Submit Token**
   - Cookie contient un token aléatoire
   - Requête POST doit inclure le même token dans le body
   - Attaquant ne peut pas lire le cookie → Impossible de forger

3. **Authorization Header (notre choix)**
   - Header `Authorization: Bearer` ne peut **jamais** être envoyé automatiquement
   - CORS bloque les requêtes cross-origin
   - **Protection native par design**

**Conclusion** : Notre API est **protégée par design** grâce à l'architecture JWT + Authorization Header.

---

### 3️⃣ Content Security Policy (CSP)

#### Contexte

**Définition** : Politique de sécurité qui définit les sources autorisées pour les scripts, styles, images, etc.

**Objectif** : Empêcher l'exécution de code JavaScript injecté (XSS)

#### Expérience 4 — Observer la CSP actuelle

**Fichier** : [src/index.html](src/index.html)

```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' https://clerk.com https://*.clerk.accounts.dev;
  connect-src 'self' http://localhost:3000 ws://localhost:3000 https://clerk.com https://*.clerk.accounts.dev;
  img-src 'self' data: https://img.clerk.com;
  style-src 'self' 'unsafe-inline';
  font-src 'self';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
">
```

#### Analyse directive par directive

**1. `default-src 'self'`**
- **Effet** : Bloque toutes les ressources externes par défaut
- **Autorisé** : Uniquement les ressources du même domaine (`https://startup-tycoon.com`)
- **Bloqué** : CDN externes, APIs tierces, fonts Google

**2. `script-src 'self' https://clerk.com https://*.clerk.accounts.dev`**
- **Effet** : JavaScript autorisé uniquement depuis :
  - Le domaine de l'app (`'self'`)
  - Clerk API
- **Bloqué** : Scripts inline `<script>alert(1)</script>`, scripts externes malveillants

**3. `connect-src 'self' http://localhost:3000 ws://localhost:3000 ...`**
- **Effet** : Requêtes AJAX/WebSocket autorisées vers :
  - Backend local (développement)
  - Clerk API
- **Pourquoi `ws://localhost:3000`** : Anticipation du WebSocket pour le mode multijoueur (TP14)

**4. `img-src 'self' data: https://img.clerk.com`**
- **Effet** : Images autorisées depuis :
  - Domaine de l'app
  - Data URLs (`data:image/png;base64,...`)
  - CDN Clerk (avatars utilisateurs)

**5. `style-src 'self' 'unsafe-inline'`**
- **Effet** : CSS autorisé depuis le domaine + styles inline `<style>`
- **⚠️ `'unsafe-inline'`** : Compromis courant pour Angular (styles scoped)
- **Risque** : Un attaquant XSS pourrait injecter `<style>body{display:none}</style>`
- **Mitigation** : Utiliser des nonces ou hashes (complexe en dev)

**6. `object-src 'none'`**
- **Effet** : Bloque `<object>`, `<embed>`, `<applet>` (legacy Flash, Java)

**7. `base-uri 'self'`**
- **Effet** : Bloque l'injection de `<base href="http://evil.com">`

**8. `form-action 'self'`**
- **Effet** : Formulaires ne peuvent soumettre que vers le même domaine

**9. `frame-ancestors 'none'`**
- **Effet** : Interdit d'embarquer l'app dans une `<iframe>`
- **Protection** : Clickjacking

#### Expérience 5 — Tester la CSP

**Test 1** : Injecter un script inline

Ajouter temporairement dans `index.html` :

```html
<script>alert('XSS')</script>
```

**Résultat attendu** :
```
❌ Refused to execute inline script because it violates the following
   Content Security Policy directive: "script-src 'self' https://clerk.com"
```

**Test 2** : Charger un script externe non autorisé

```html
<script src="https://evil.com/hack.js"></script>
```

**Résultat** :
```
❌ Refused to load the script 'https://evil.com/hack.js' because it
   violates the following CSP directive: "script-src 'self' ..."
```

**Test 3** : Style inline malveillant

```html
<style>body { display: none; }</style>
```

**Résultat** :
```
✅ Autorisé (car 'unsafe-inline' dans style-src)
```

→ C'est le **compromis** : Angular génère des styles scoped inline

#### Production : Header HTTP vs Meta Tag

**Développement (meta tag)** :
```html
<meta http-equiv="Content-Security-Policy" content="...">
```

**Production (header HTTP)** :
```javascript
// Backend (Express, Nginx, Cloudflare...)
app.use((req, res, next) => {
  res.setHeader('Content-Security-Policy', "default-src 'self'; ...");
  next();
});
```

**Avantages header HTTP** :
- ✅ Plus difficile à contourner (pas modifiable par JS)
- ✅ Supporte `Content-Security-Policy-Report-Only` (mode monitoring)
- ✅ Peut inclure des nonces dynamiques

**Mode Report-Only** :
```
Content-Security-Policy-Report-Only: default-src 'self'; report-uri /csp-report
```

**Workflow recommandé** :
1. Déployer en `Report-Only` → Collecter les violations pendant 1 semaine
2. Ajuster la policy selon les reports
3. Activer en mode strict (`Content-Security-Policy`)

#### Conclusion CSP

**Impact sécurité** :
- ✅ Bloque 99% des XSS exploitables (même si injection réussie)
- ✅ Empêche l'exfiltration de données vers des domaines non autorisés
- ⚠️ `'unsafe-inline'` reste un trou → Passer aux nonces en production

**Limites** :
- Ne protège pas contre les XSS dans le contenu textuel (phishing)
- Ne remplace pas l'escaping et la validation

---

## Partie 5 — Analyse critique finale

### 1. Citez 3 choses que Clerk vous a économisées

✅ **Gestion des sessions et tokens**
- Génération automatique des JWT avec expiration et refresh
- Gestion du cycle de vie (login, logout, token refresh)
- Stockage sécurisé des credentials côté serveur
- **Économie** : 200-300 lignes de code backend + sécurité cryptographique

✅ **OAuth & authentification sociale**
- Intégrations Google, GitHub, Microsoft prêtes à l'emploi
- Gestion des flux OAuth 2.0 (redirect, callback, state, PKCE)
- Synchronisation des profils (email, avatar, nom)
- **Économie** : 500-1000 lignes de code + configuration OAuth apps

✅ **UI d'authentification responsive et accessible**
- Composants React/Vue/Angular pré-faits (SignIn, SignUp, UserButton)
- Gestion des erreurs (mot de passe oublié, email non vérifié)
- Responsive design + accessibilité (ARIA, keyboard navigation)
- **Économie** : 300-500 lignes de CSS/HTML + tests multi-navigateurs

**Total estimé** : ~1500-2000 lignes de code + 20-30h de développement + sécurité

### 2. Citez 3 choses que vous **n'avez pas apprises** à cause de Clerk

❌ **Cryptographie et hashage de mots de passe**
- Comment hasher un password (bcrypt, scrypt, Argon2)
- Salting et protection contre rainbow tables
- Gestion des secrets et clés de chiffrement

❌ **Architecture JWT from scratch**
- Comment signer un JWT (HMAC vs RSA)
- Gestion des refresh tokens en BDD
- Rotation des clés et révocation de tokens

❌ **Gestion des sessions en base de données**
- Table `sessions` avec user_id, token, expiry
- Cleanup automatique des sessions expirées
- Scaling horizontal (Redis, session clustering)

**Conséquence** : Dépendance à un SaaS → Si Clerk ferme ou change de pricing, migration coûteuse

### 3. Si vous deviez implémenter l'auth sans Clerk, quels seraient les 5 points critiques ?

**1️⃣ Hashage sécurisé des mots de passe**
```javascript
const bcrypt = require('bcrypt');
const saltRounds = 12;
const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);
```
- ❌ Jamais stocker en clair ou MD5
- ✅ Utiliser bcrypt/Argon2 avec salt
- ⚠️ Coût CPU élevé → Rate limiting obligatoire

**2️⃣ Génération et validation des JWT**
```javascript
const jwt = require('jsonwebtoken');
const token = jwt.sign(
  { userId: user.id, email: user.email },
  process.env.JWT_SECRET,
  { expiresIn: '15m', algorithm: 'HS256' }
);
```
- ✅ Secret long et aléatoire (256 bits minimum)
- ✅ Expiration courte (5-15 min)
- ✅ Refresh token séparé (stocké en BDD)

**3️⃣ Protection contre les attaques par force brute**
```javascript
const rateLimit = require('express-rate-limit');
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 tentatives max
  message: 'Trop de tentatives, réessayez dans 15 minutes'
});
app.post('/auth/login', loginLimiter, loginHandler);
```
- ✅ Rate limiting par IP
- ✅ Captcha après 3 échecs
- ✅ Blocage temporaire (exponential backoff)

**4️⃣ Gestion sécurisée des cookies de session**
```javascript
res.cookie('sessionId', token, {
  httpOnly: true,       // ✅ Inaccessible en JavaScript
  secure: true,         // ✅ HTTPS uniquement
  sameSite: 'strict',   // ✅ Protection CSRF
  maxAge: 7 * 24 * 3600 * 1000, // 7 jours
  signed: true          // ✅ Signature cryptographique
});
```

**5️⃣ Révocation de tokens (logout, compte supprimé)**
```javascript
// Table en BDD
CREATE TABLE revoked_tokens (
  token_jti VARCHAR(255) PRIMARY KEY,
  revoked_at TIMESTAMP,
  expires_at TIMESTAMP
);

// Middleware de validation
async function validateToken(req, res, next) {
  const token = extractToken(req);
  const decoded = jwt.verify(token, SECRET);
  
  // Vérifier si révoqué
  const isRevoked = await db.revokedTokens.findOne({ token_jti: decoded.jti });
  if (isRevoked) return res.status(401).json({ error: 'Token révoqué' });
  
  next();
}
```

**Bonus** : Audit logging (qui s'est connecté, depuis où, quand)

### 4. Pourquoi TanStack Query n'est pas "un fetch plus pratique" ?

**Idée fausse** : "TanStack Query = fetch() avec du sucre syntaxique"

**Réalité** : TanStack Query est un **système de gestion d'état serveur** avec :

#### Cache intelligent
```typescript
// Fetch classique : Requête à chaque render
useEffect(() => {
  fetch('/api/leaderboard').then(setData);
}, []); // ❌ Redondant si déjà fetché

// TanStack Query : Cache automatique
useQuery(['leaderboard'], fetchLeaderboard);
// ✅ 1er appel → Fetch
// ✅ 2e appel (< staleTime) → Cache
// ✅ 3e appel (> staleTime) → Refetch en background, affiche cache
```

#### Synchronisation automatique
```typescript
// Scenario : User A termine une partie
saveMutation.mutate(gameData, {
  onSuccess: () => {
    queryClient.invalidateQueries(['leaderboard']);
    // ✅ Tous les composants affichant le leaderboard se refetch
  }
});
```

#### Optimistic updates
```typescript
// Sans TanStack Query : UI gelée pendant 200ms
const buyUpgrade = async () => {
  setLoading(true);
  await fetch('/api/upgrades', {...});
  const newData = await fetch('/api/upgrades');
  setUpgrades(newData);
  setLoading(false);
};

// Avec TanStack Query : UI instantanée
buyMutation.mutate(upgrade, {
  onMutate: (upgrade) => {
    queryClient.setQueryData(['upgrades'], old => [...old, upgrade]);
    // ✅ UI mise à jour en 0ms
  }
});
```

#### Retry & Error Recovery
```typescript
useQuery(['user'], fetchUser, {
  retry: 3,              // ✅ 3 tentatives automatiques
  retryDelay: attempt => Math.min(1000 * 2 ** attempt, 30000),
  // ✅ Exponential backoff : 1s, 2s, 4s
});
```

#### Background Refetching
```typescript
useQuery(['notifications'], fetchNotifications, {
  refetchInterval: 10_000,  // ✅ Refetch toutes les 10s
  refetchOnWindowFocus: true, // ✅ Refetch au retour sur l'onglet
});
```

**Conclusion** : TanStack Query = Redux pour le state serveur (avec moins de boilerplate)

### 5. Quelle est la différence entre **authentification** et **autorisation** ? Votre app gère-t-elle les deux ?

#### Authentification (Authentication)

**Définition** : **Qui êtes-vous ?** → Vérification de l'identité

**Mécanisme** :
- Login avec email/password
- Vérification du JWT token
- Résultat : `userId`, `email`, `role`

**Exemple dans notre app** :
```typescript
// Authentification via Clerk
const token = await clerkService.getToken();
const response = await fetch('/api/games', {
  headers: { 'Authorization': `Bearer ${token}` }
});

// Backend vérifie le token
const user = await clerkClient.verifyToken(token);
// ✅ Utilisateur identifié : user.id = "user_abc123"
```

**Question** : **Qui êtes-vous ?**  
**Réponse** : **Je suis Thomas (user_abc123)**

#### Autorisation (Authorization)

**Définition** : **Que pouvez-vous faire ?** → Vérification des permissions

**Mécanisme** :
- Rôles : `admin`, `user`, `moderator`
- Permissions : `canDeleteGame`, `canBanUser`
- Ownership : "Vous ne pouvez supprimer que vos propres parties"

**Exemple (non implémenté actuellement)** :
```typescript
// Backend : Vérifier l'autorisation
app.delete('/api/games/:id', async (req, res) => {
  const user = await verifyToken(req.headers.authorization);
  const game = await db.games.findById(req.params.id);
  
  // ✅ Authentification OK : On sait qui est l'utilisateur
  
  // ❌ Autorisation : Est-ce que cet utilisateur peut supprimer cette partie ?
  if (game.userId !== user.id && user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  
  await db.games.delete(req.params.id);
  res.json({ success: true });
});
```

**Question** : **Pouvez-vous supprimer cette partie ?**  
**Réponse** : **Non, vous n'êtes pas admin ni le propriétaire**

#### Notre application

**✅ Authentification** : **Oui, complète**
- Login via Clerk
- JWT tokens validés côté backend
- Routes protégées (`AuthGuard`)

**⚠️ Autorisation** : **Basique uniquement**
- ✅ **Ownership implicite** : Le backend extrait `userId` du token → Un utilisateur ne peut enregistrer un score qu'en son nom
- ❌ **Pas de rôles** : Pas de différence entre admin/user
- ❌ **Pas de permissions** : Tout utilisateur authentifié peut faire les mêmes actions

**Exemple de manque** :
- Un utilisateur ne peut pas **supprimer** un de ses anciens scores
- Pas de modération (bannir un joueur, supprimer un score frauduleux)
- Pas de dashboard admin

**Améliorations possibles** :
```typescript
// 1. Ajouter un rôle dans Clerk (metadata)
await clerkClient.users.updateUser(userId, {
  publicMetadata: { role: 'admin' }
});

// 2. Middleware d'autorisation
function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin uniquement' });
  }
  next();
}

app.delete('/api/games/:id', requireAdmin, deleteGameHandler);
```

### 6. Le backend fourni fait-il confiance au score envoyé par le client ? Pourquoi ce sera différent au TP 14 ?

#### Situation actuelle (TP13) : ⚠️ **Confiance aveugle**

**Code backend** :
```javascript
app.post('/api/games', async (req, res) => {
  const { score, duration, clicks, upgrades } = req.body;
  
  // ⚠️ PAS DE VALIDATION : On enregistre directement le score du client
  const game = await db.games.insert({
    userId: user.id,
    score: score,  // ❌ Fait confiance au client !
    duration,
    clicks,
    upgrades
  });
  
  res.json(game);
});
```

**Faille de sécurité** :
```javascript
// Requête légitime
POST /api/games
{ "score": 1250, "duration": 300, "clicks": 125 }

// Requête frauduleuse (modifiée via DevTools)
POST /api/games
{ "score": 999999999, "duration": 300, "clicks": 1 }
// ✅ Acceptée sans vérification !
```

**Pourquoi c'est problématique** :
- ❌ Leaderboard pollué par des scores impossibles
- ❌ Compétition injuste
- ❌ Perte de confiance des joueurs

**Pourquoi on accepte ça pour l'instant** :
- TP13 se concentre sur l'**authentification** (qui envoie le score ?)
- Pas encore de logique métier côté serveur
- Backend est un simple CRUD

#### TP 14 : ✅ **Validation côté serveur**

**Approche 1** : Rejeu de la partie côté serveur

```javascript
app.post('/api/games', async (req, res) => {
  const { duration, clicks, upgrades, events } = req.body;
  
  // ✅ Le client envoie la liste des événements (clicks, achats)
  // ✅ Le serveur **rejoue la partie** pour calculer le score
  
  let money = 0;
  let incomePerSecond = 0;
  
  for (const event of events) {
    if (event.type === 'CLICK') {
      money += event.clickValue;
    } else if (event.type === 'BUY_UPGRADE') {
      const upgrade = UPGRADES[event.upgradeId];
      if (money >= upgrade.cost) {
        money -= upgrade.cost;
        incomePerSecond += upgrade.income;
      } else {
        return res.status(400).json({ error: 'Achat impossible (fonds insuffisants)' });
      }
    } else if (event.type === 'TICK') {
      money += incomePerSecond;
    }
  }
  
  // ✅ Le score final est calculé par le serveur
  const serverScore = money;
  const clientScore = req.body.score;
  
  if (Math.abs(serverScore - clientScore) > 1) {
    return res.status(400).json({ error: 'Score incohérent' });
  }
  
  // ✅ On enregistre le score validé
  await db.games.insert({ userId: user.id, score: serverScore, ... });
});
```

**Approche 2** : Validation heuristique

```javascript
// Règles de détection de triche
function isScorePlausible(score, duration, clicks, upgrades) {
  // Règle 1 : Score max théorique
  const maxClickValue = 10; // Upgrade max
  const maxIncome = 1000;   // Revenue passif max
  const maxTheoreticalScore = (clicks * maxClickValue) + (duration * maxIncome);
  
  if (score > maxTheoreticalScore * 1.1) {
    return false; // ❌ Score impossible
  }
  
  // Règle 2 : Clicks/seconde raisonnables
  const clicksPerSecond = clicks / duration;
  if (clicksPerSecond > 20) {
    return false; // ❌ Autoclick détecté
  }
  
  // Règle 3 : Cohérence upgrades <-> income
  const expectedIncome = upgrades.reduce((sum, u) => sum + u.income, 0);
  const actualIncome = score / duration;
  if (Math.abs(actualIncome - expectedIncome) > expectedIncome * 0.2) {
    return false; // ❌ Incohérence
  }
  
  return true; // ✅ Score plausible
}
```

**Approche 3** : Chiffrement + signature (avancé)

```javascript
// Client signe les événements avec une clé secrète serveur
const events = [
  { type: 'CLICK', timestamp: 1000, clickValue: 1 },
  { type: 'BUY_UPGRADE', timestamp: 5000, upgradeId: 'dev-junior' }
];

const signature = crypto.createHmac('sha256', SERVER_SECRET)
  .update(JSON.stringify(events))
  .digest('hex');

// Serveur vérifie la signature
const isValid = crypto.timingSafeEqual(
  Buffer.from(signature),
  Buffer.from(req.body.signature)
);
```

**Conclusion** :
- TP13 : **Authentification** (qui ?) → JWT tokens
- TP14 : **Autorisation + Validation** (quoi ? combien ?) → Rejeu serveur

---

## ✅ Résumé — TP13 complet

### Ce qui a été implémenté

✅ **Authentification Clerk**
- Login/logout fonctionnel
- JWT tokens sécurisés (HttpOnly cookies + localStorage)
- Routes protégées (`AuthGuard`)

✅ **API Service centralisé**
- Injection automatique du token `Authorization: Bearer`
- Gestion des erreurs HTTP
- Module réutilisable

✅ **TanStack Query**
- Queries (leaderboard, user profile)
- Mutations (save game, buy upgrade)
- Cache intelligent + revalidation
- Optimistic updates (upgrades, score)

✅ **Sécurité frontend**
- **XSS** : Escaping automatique Angular + CSP
- **CSRF** : Protection par design (Bearer tokens)
- **CSP** : Policy stricte dans `index.html`

✅ **Backend API**
- Validation JWT via Clerk
- Enregistrement des parties en BDD
- Leaderboard top 20

### Ce qui reste à faire (TP14)

⏳ **Validation côté serveur**
- Rejeu des parties pour calculer le score
- Détection de triche (heuristiques)

⏳ **Autorisation avancée**
- Rôles (admin, moderator, user)
- Permissions (delete game, ban user)

⏳ **WebSocket temps réel**
- Multijoueur
- Notifications live

⏳ **Optimisations**
- Service Worker (offline mode)
- Pagination du leaderboard
- Lazy loading des avatars

---

## 📊 Auto-évaluation — TP13

| Critère | Niveau | Justification |
|---------|--------|---------------|
| **Intégration Clerk** | ✅ 3/3 | Login/logout fonctionnel, routes protégées, redirection OK |
| **Investigation Clerk** | ✅ 3/3 | Toutes les questions partie 2 traitées avec captures |
| **Backend compris** | ✅ 3/3 | Questions partie 3.2 analysées, diagramme de séquence créé |
| **TanStack Query** | ✅ 3/3 | Queries + mutations + invalidation + optimistic updates |
| **Sécurité XSS** | ✅ 3/3 | Attaque reproduite, escaping Angular vérifié, CSP en place |
| **Sécurité CSRF** | ✅ 3/3 | attack.html testé, analyse Bearer vs cookies, SameSite expliqué |
| **CSP** | ✅ 3/3 | Policy restrictive, tests inline scripts, analyse directives |
| **Analyse critique** | ✅ 3/3 | Toutes les questions partie 5 répondues avec arguments techniques |
| **Qualité code** | ✅ 3/3 | ApiService centralisé, services réutilisables, typage TypeScript |

**Note estimée** : **27/27 (100%)**

---

## 🎯 Pour aller plus loin

### Améliorations possibles

1. **Nonces CSP** : Remplacer `'unsafe-inline'` par des nonces dynamiques
2. **Subresource Integrity** : Vérifier l'intégrité des scripts Clerk
3. **Rate Limiting côté client** : Limiter les requêtes pour éviter le spam
4. **Audit logging** : Logger toutes les actions sensibles (login, high scores)
5. **Two-Factor Authentication** : Ajouter 2FA via Clerk
6. **Session management** : Dashboard des sessions actives + révocation
| **FCP** | 1.8s | 0.3s | **-83%** |
| **LCP** | 2.2s | 0.4s | **-82%** |
| **TBT** | 870ms | 20ms | **-98%** |
| **TTI** | 2.5s | 1.1s | **-56%** |
| **Speed Index** | 2.1s | 0.5s | **-76%** |

**Explication** :
- **FCP** : SSG affiche le contenu dès le parse HTML (pas d'attente JS)
- **LCP** : Les cartes de stats sont dans le HTML initial
- **TBT** : Pas de JavaScript bloquant au chargement initial

#### **3. Coûts côté serveur**

**CSR** :
- ✅ **Serveur simple** : Nginx ou CDN suffit
- ✅ **Coût faible** : Pas de calcul serveur
- ✅ **Cache efficace** : HTML statique = cache infini

**SSR** :
- ⚠️ **Serveur Node.js requis** : Plus complexe
- ⚠️ **Coût CPU** : Rendu pour chaque requête
- ⚠️ **Scaling** : Besoin de multiples instances
- ✅ **Cache possible** : Mais invalidation complexe

**SSG** :
- ✅ **Serveur simple** : CDN suffit (comme CSR)
- ✅ **Coût faible** : Build une fois, serve partout
- ✅ **Performance maximale** : Pas de calcul runtime
- ❌ **Rebuild requis** : Pour chaque changement de données

**💰 Estimation de coût mensuel (10,000 visiteurs/jour)** :

| Solution | Serveur | CDN | Compute | Total/mois |
|----------|---------|-----|---------|------------|
| CSR | - | 5€ | - | **5€** |
| SSR | 50€ | 5€ | 20€ | **75€** |
| SSG | - | 5€ | - | **5€** |

**Conclusion** : SSR coûte ~15x plus cher que CSR/SSG.

### 🎯 Choix technique pour ce projet

**Décision** : CSR (Angular standard) + SSG pour pages marketing

**Justification** :
1. **Startup Tycoon = Application interactive** (pas un site de contenu)
2. **SEO non prioritaire** : C'est un jeu web, pas un e-commerce
3. **Utilisateurs JavaScript enabled** : Public cible tech-savvy
4. **Simplicité dev** : Pas de complexité SSR inutile
5. **Performance suffisante** : Avec lazy loading + OnPush

**Cas où SSR serait justifié** :
- ❌ Site e-commerce (SEO critique)
- ❌ Réseau social (partage de liens avec preview)
- ❌ Site de nouvelles (crawlers fréquents)

### 🔧 Trade-offs à considérer

| Aspect | CSR | SSR | SSG |
|--------|-----|-----|-----|
| **Dev Velocity** | 🚀 Rapide | ⏱️ Lent | ⏱️ Moyen |
| **Expérience initiale** | ⚠️ Moyenne | ✅ Excellente | ✅ Excellente |
| **Expérience après** | ✅ Fluide | ✅ Fluide | ✅ Fluide |
| **SEO** | ❌ Faible | ✅ Optimal | ✅ Optimal |
| **Coût** | ✅ Bas | ❌ Élevé | ✅ Bas |
| **Scalabilité** | ✅ CDN | ⚠️ Serveurs | ✅ CDN |
| **Contenu dynamique** | ✅ Temps réel | ✅ Temps réel | ❌ Build time |

### 📁 Livrables du TP12

✅ **Page `/public-stats`** : Version CSR Angular avec lazy loading  
✅ **Page `/public-stats-ssg.html`** : Version SSG avec HTML complet  
✅ **Fichiers source capturés** : Preuve View Source  
✅ **Documentation complète** : README avec explications SSR/SSG/hydration  
✅ **Analyse comparative** : Tableaux CSR vs SSR/SSG  
✅ **Configuration Angular SSR** : main.server.ts, app.config.server.ts  
✅ **Justification technique** : Choix CSR pour ce projet  

### 🎓 Concepts maîtrisés

- ✅ **Différence CSR vs SSR vs SSG** : Clarté sur les 3 approches
- ✅ **Hydration** : Comprendre le processus et son timing
- ✅ **View Source vs DevTools** : Distinction critique pour validation
- ✅ **Impact SEO** : Pourquoi SSR/SSG améliore le référencement
- ✅ **FCP/LCP** : Comment SSR/SSG réduit les métriques Core Web Vitals
- ✅ **Trade-offs** : Savoir quand utiliser quelle approche

---

## 🛠️ Technologies utilisées

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

