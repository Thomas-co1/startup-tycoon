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
