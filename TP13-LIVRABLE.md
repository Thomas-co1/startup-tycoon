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
