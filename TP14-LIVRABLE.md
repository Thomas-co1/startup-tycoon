# TP14 - Monde persistant multijoueur : WebSocket & temps réel

**Étudiant :** Thomas  
**Date :** 5 mai 2026  
**Branche Git :** TP14  
**Technologies :** Angular 21.2.0 + WebSocket natif + TanStack Query

---

## 🎯 Objectif

Activer le mode multijoueur temps réel avec :
- Connexion WebSocket authentifiée
- Monde persistant avec rounds de 5 minutes
- Actions bi-directionnelles (click, buy, sabotage)
- Événements aléatoires du serveur
- Cohabitation WebSocket + TanStack Query
- Reconnexion robuste avec backoff

---

# 🔹 Partie 1 — Rappel conceptuel

## 1. Le handshake WebSocket

### Qu'est-ce qui se passe au niveau HTTP ?

Le WebSocket commence par un **handshake HTTP/1.1 classique** avec une requête d'upgrade :

**Requête du client :**
```http
GET /ws HTTP/1.1
Host: localhost:3000
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==
Sec-WebSocket-Version: 13
Origin: http://localhost:4200
```

**Réponse du serveur (si acceptée) :**
```http
HTTP/1.1 101 Switching Protocols
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Accept: s3pPLMBiTxaQ9kYGzzhZRbK+xOo=
```

**Processus :**
1. Le client envoie une requête HTTP GET avec les headers `Upgrade` et `Connection`
2. Le serveur vérifie les headers et calcule `Sec-WebSocket-Accept` (hash SHA-1 de la clé + GUID magique)
3. Si valide, le serveur répond avec **status 101 Switching Protocols**
4. La connexion TCP sous-jacente reste ouverte mais le protocole change (HTTP → WebSocket)
5. Les deux parties peuvent désormais s'envoyer des **frames** binaires bi-directionnelles

---

## 2. Headers HTTP spécifiques au handshake

### `Upgrade: websocket`
Indique au serveur que le client souhaite passer du protocole HTTP au protocole WebSocket.

### `Connection: Upgrade`
Spécifie que la connexion ne doit pas être fermée après la réponse, mais mise à niveau.

### `Sec-WebSocket-Key`
Une clé aléatoire encodée en Base64 (16 bytes), générée par le client. Permet au serveur de prouver qu'il comprend bien le protocole WebSocket.

### `Sec-WebSocket-Accept`
Calculé par le serveur : `Base64(SHA1(Sec-WebSocket-Key + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11"))`.  
Cette valeur prouve que le serveur a bien reçu la clé et accepte l'upgrade.

### `Sec-WebSocket-Version`
Version du protocole WebSocket (généralement `13` depuis RFC 6455).

### `Origin` (optionnel côté serveur)
Utilisé par le serveur pour vérifier que la requête provient d'une origine autorisée (protection CORS-like).

---

## 3. Le protocole reste-t-il HTTP après le handshake ?

**NON.** Une fois le status `101 Switching Protocols` envoyé :

- La connexion TCP **reste ouverte**
- Le protocole **n'est plus HTTP** mais **WebSocket (RFC 6455)**
- Les messages sont échangés sous forme de **frames binaires** légères
- Pas de headers HTTP, pas de requête/réponse, juste des frames

**Conséquence :**
- Les DevTools affichent la connexion dans l'onglet **WS** (WebSocket), pas **XHR**
- Les middlewares HTTP classiques (CORS, authentification via headers) ne s'appliquent plus après le handshake
- C'est une connexion **full-duplex** : les deux parties peuvent envoyer des messages indépendamment

---

## 4. WebSocket vs SSE vs Polling — Quand choisir quoi ?

### **WebSocket** (bi-directionnel, full-duplex)

**Principe :**
- Connexion persistante bi-directionnelle
- Client et serveur peuvent s'envoyer des messages à tout moment
- Protocole léger (frames ~2-10 bytes d'overhead)

**Avantages :**
- ✅ Latence très faible
- ✅ Bi-directionnel (client → serveur et serveur → client)
- ✅ Économique en bande passante (pas de headers HTTP répétés)

**Inconvénients :**
- ❌ Complexité (reconnexion, gestion d'état)
- ❌ Mal supporté par certains proxies/firewalls
- ❌ Incompatible avec les architectures serverless simples

**Cas d'usage dans Startup Tycoon :**
- **Leaderboard live du round en cours** : Le serveur push les mises à jour de classement toutes les secondes
- **Sabotage entre joueurs** : Action bi-directionnelle (joueur A sabote joueur B via le serveur)
- **Événements aléatoires** : Le serveur déclenche des events (BUG_EN_PROD, LEVEE_DE_FONDS) et les broadcast

---

### **Server-Sent Events (SSE)** (uni-directionnel, serveur → client)

**Principe :**
- Connexion HTTP persistante où le serveur envoie des événements textuels
- Format : `event: type\ndata: {...}\n\n`
- Reconnexion automatique côté navigateur

**Avantages :**
- ✅ Plus simple que WebSocket (juste HTTP)
- ✅ Reconnexion automatique native
- ✅ Fonctionne mieux avec les proxies HTTP

**Inconvénients :**
- ❌ **Uni-directionnel uniquement** (serveur → client)
- ❌ Le client doit utiliser HTTP classique pour envoyer des données au serveur
- ❌ Moins performant que WebSocket en full-duplex

**Cas d'usage dans Startup Tycoon :**
- **Leaderboard all-time** : Si on voulait des mises à jour live sans interaction client (mais TanStack Query + polling convient mieux ici)
- **Notifications système** : Alertes serveur sans besoin de réponse client

**Pourquoi pas pour le sabotage ?**
→ SSE ne permet pas au client d'envoyer des messages. Il faudrait combiner SSE (pour recevoir) + HTTP POST (pour envoyer), ce qui est moins élégant et performant que WebSocket.

---

### **Polling** (requêtes HTTP répétées)

**Principe :**
- Le client envoie une requête HTTP toutes les X secondes
- Le serveur répond avec les dernières données

**Avantages :**
- ✅ Très simple à implémenter
- ✅ Compatible avec tout (proxies, CDN, serverless)
- ✅ Pas de gestion de connexion persistante

**Inconvénients :**
- ❌ Latence élevée (délai entre chaque requête)
- ❌ Gaspille de la bande passante (headers HTTP répétés)
- ❌ Charge serveur importante (1 connexion par client toutes les X secondes)

**Cas d'usage dans Startup Tycoon :**
- **Leaderboard all-time** : Mise à jour toutes les 30 secondes via TanStack Query (refetch automatique)
- **Historique de mes parties** : Données qui changent rarement

**Pourquoi pas pour le mode multi ?**
→ Le polling toutes les 1 seconde (pour un classement live) créerait une charge serveur énorme et une latence visible. WebSocket est 100x plus efficace.

---

### Tableau comparatif

| Critère | WebSocket | SSE | Polling |
|---------|-----------|-----|---------|
| **Direction** | Bi-directionnel | Uni (S→C) | Bi (2 canaux séparés) |
| **Latence** | Très faible (~ms) | Faible (~ms) | Moyenne (délai poll) |
| **Bande passante** | Économique | Économique | Coûteuse |
| **Complexité** | Élevée | Moyenne | Faible |
| **Reconnexion** | Manuelle | Automatique | N/A |
| **Serverless** | ❌ (difficile) | ⚠️ (limité) | ✅ |
| **Cas d'usage** | Chat, jeux, collab | Notifs, flux | Leaderboard, historique |

---

## 5. Qu'est-ce qu'une frame WebSocket ?

### Définition

Une **frame WebSocket** est l'unité de base de transmission de données après le handshake. Elle contient :

**Structure binaire :**
```
 0                   1                   2                   3
 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
+-+-+-+-+-------+-+-------------+-------------------------------+
|F|R|R|R| opcode|M| Payload len |    Extended payload length    |
|I|S|S|S|  (4)  |A|     (7)     |             (16/64)           |
|N|V|V|V|       |S|             |   (if payload len==126/127)   |
| |1|2|3|       |K|             |                               |
+-+-+-+-+-------+-+-------------+ - - - - - - - - - - - - - - - +
|     Extended payload length continued, if payload len == 127  |
+ - - - - - - - - - - - - - - - +-------------------------------+
|                               |Masking-key, if MASK set to 1  |
+-------------------------------+-------------------------------+
| Masking-key (continued)       |          Payload Data         |
+-------------------------------- - - - - - - - - - - - - - - - +
:                     Payload Data continued ...                :
+ - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - +
|                     Payload Data continued ...                |
+---------------------------------------------------------------+
```

**Champs clés :**
- **FIN** : Indique si c'est la dernière frame d'un message (fragmentation possible)
- **Opcode** : Type de frame (0x1 = texte, 0x2 = binaire, 0x8 = close, 0x9 = ping, 0xA = pong)
- **MASK** : Les frames client → serveur sont **toujours masquées** (sécurité navigateur)
- **Payload len** : Longueur du payload (7 bits, 16 bits ou 64 bits selon la taille)
- **Payload** : Les données réelles (JSON, texte, binaire)

---

### Est-elle plus légère qu'une requête HTTP classique ?

**OUI, énormément !**

**Requête HTTP classique :**
```http
POST /api/games HTTP/1.1
Host: localhost:3000
User-Agent: Mozilla/5.0...
Accept: application/json
Content-Type: application/json
Authorization: Bearer eyJhbGc...
Content-Length: 42

{"action":"click"}
```
→ **~500-800 bytes de headers** + payload

**Frame WebSocket équivalente :**
```
[FIN=1, opcode=1, mask=1, len=18, mask-key=...][masked payload]
{"action":"click"}
```
→ **~6-10 bytes de headers** + payload

**Économie : ~98% d'overhead en moins !**

**Conséquence :**
- Pour un jeu avec 100 joueurs qui envoient 1 action/seconde, WebSocket économise **~50-80 KB/s de bande passante** par rapport à du polling HTTP
- Latence réduite (pas de handshake TCP/TLS à chaque message)

---

## 6. Qu'est-ce qu'un serveur autoritaire ?

### Définition

Un **serveur autoritaire** (authoritative server) est un serveur qui :

1. **Détient la source de vérité unique** de l'état du jeu
2. **Valide toutes les actions** des clients avant de les appliquer
3. **Calcule les résultats** côté serveur (scores, dégâts, événements)
4. **Broadcast l'état validé** à tous les clients

**Le client ne fait JAMAIS confiance aux données qu'il envoie lui-même.**

---

### Pourquoi est-ce essentiel pour un jeu multijoueur ?

#### **Sans serveur autoritaire (client-side authority) :**

```javascript
// ❌ DANGEREUX : Le client calcule son score
function handleClick() {
  money += 10;  // Le client décide
  socket.send({ type: 'update', money: money });  // Il envoie SON calcul
}
```

**Problème :**
- Un joueur malveillant peut modifier le code JavaScript et envoyer `money: 999999999`
- Impossible de détecter la triche côté serveur (comment savoir si 999999 est légitime ?)
- Le jeu devient injouable (leaderboard pollué, économie cassée)

---

#### **Avec serveur autoritaire :**

```javascript
// ✅ SÉCURISÉ : Le client envoie une intention
function handleClick() {
  socket.send({ type: 'action:click' });  // "Je veux cliquer"
}

// Le serveur valide et calcule
socket.on('action:confirmed', (data) => {
  money = data.money;  // J'applique ce que le serveur me dit
});
```

**Avantages :**
- ✅ Le serveur vérifie : "Ce joueur peut-il cliquer maintenant ? Combien ça rapporte ?"
- ✅ Le serveur calcule : `money += clickValue` côté serveur
- ✅ Le serveur broadcast : "Joueur X a maintenant 1234$"
- ✅ Impossible de tricher (même en modifiant le JS client)

---

### Exemples dans Startup Tycoon

| Action | Client envoie | Serveur valide | Serveur répond |
|--------|---------------|----------------|----------------|
| **Click** | `{ type: 'action:click' }` | Cooldown OK ? | `{ money: 1234, clickValue: 10 }` |
| **Buy upgrade** | `{ type: 'action:buy', upgradeId: 'DEV_SENIOR' }` | Fonds suffisants ? | `{ money: 800, upgrades: {...} }` ou `{ error: 'Insufficient funds' }` |
| **Sabotage** | `{ type: 'action:sabotage', targetUserId: 'user_xxx' }` | 200$ dispo ? Cooldown OK ? | `{ success: true }` ou `{ error: 'On cooldown' }` |

---

### Cas particulier : optimistic update limité

Pour **améliorer l'UX**, on peut faire de l'**optimistic update** sur des actions quasi-certaines :

```javascript
// Exemple : Click (échoue très rarement)
function handleClick() {
  // Optimistic : afficher +1 immédiatement
  displayTemporaryFeedback('+1 $');
  
  // Intention serveur
  socket.send({ type: 'action:click' });
}

socket.on('action:confirmed', (data) => {
  // Ajuster avec la vraie valeur serveur
  money = data.money;
});
```

**Règles :**
- ✅ OK pour des feedbacks visuels ("+1" temporaire)
- ❌ JAMAIS pour des calculs de score définitifs
- ❌ JAMAIS pour des actions coûteuses (achats, sabotages)

---

**Fin de la Partie 1 — Rappel conceptuel**

---

# 🔹 Partie 2 — Connexion WebSocket authentifiée

## 1️⃣ Approches d'authentification WebSocket

Le problème fondamental : `new WebSocket(url)` ne permet pas d'ajouter des headers HTTP custom.

### **Approche 1 : Token en query string**

```typescript
const token = await clerk.getToken();
const ws = new WebSocket(`ws://localhost:3000/ws?token=${token}`);
```

**✅ Avantages :**
- Simple à implémenter
- Fonctionne nativement avec `new WebSocket()`
- Le serveur peut valider le token dès le handshake

**❌ Inconvénients :**
- **Le token apparaît dans les logs serveur** (URL complète logguée)
- **Le token reste dans l'historique du navigateur** (Security > WebSockets)
- Potentiellement exposé si logs partagés ou accessibles
- Violation des bonnes pratiques de sécurité (tokens sensibles dans URL)

---

### **Approche 2 : Cookie de session**

```typescript
// Cookie __session de Clerk envoyé automatiquement si same-origin
const ws = new WebSocket('ws://localhost:3000/ws');
```

**✅ Avantages :**
- Plus sécurisé (cookie HttpOnly, SameSite)
- Pas de manipulation manuelle du token
- Cohérent avec l'auth HTTP classique

**❌ Inconvénients :**
- **Ne fonctionne que si WebSocket same-origin** (ws://localhost vs http://localhost)
- **Cross-origin → pas de cookies** (sauf CORS complexe avec credentials)
- Moins flexible pour du mobile/API standalone

---

### **Approche 3 : Message d'auth post-connexion**

```typescript
const ws = new WebSocket('ws://localhost:3000/ws');
ws.onopen = async () => {
  const token = await clerk.getToken();
  ws.send(JSON.stringify({ type: 'auth', token }));
};
```

**✅ Avantages :**
- Token pas dans l'URL (pas de logs)
- Flexible (peut changer de token mid-session)
- Pattern publish/subscribe propre

**❌ Inconvénients :**
- **Fenêtre non-auth** : le client peut envoyer des messages avant l'auth
- Le serveur doit bufferiser ou rejeter les messages avant auth
- Complexité accrue côté serveur
- Latence supplémentaire (auth après connexion)

---

### **Choix pour Startup Tycoon : Token en query string**

**Justification :**
- Backend fourni utilise cette approche (`ws://localhost:3000/ws?token=<jwt>`)
- Same-origin (dev) donc cookies fonctionnent, mais on veut tester l'approach token pour comprendre les trade-offs
- Les logs serveur sont contrôlés (environnement péda, pas de partage externe)
- Simple et cohérent avec l'énoncé du TP

**Mitigation du risque :**
- Token JWT court-vivant (1 minute avec Clerk)
- Logs serveur non partagés
- Environnement dev local uniquement

---

## 2️⃣ Implémentation : `socket.service.ts`

Créé dans [`src/lib/socket.service.ts`](src/lib/socket.service.ts).

**Architecture :**
- Service Angular injectable (`@Injectable({ providedIn: 'root' })`)
- Singleton pour partager la connexion WebSocket entre composants
- API simple : `connect()`, `disconnect()`, `send()`, `sendAction()`, `on()`, `off()`
- Gestion des 4 événements WebSocket natifs : `onopen`, `onmessage`, `onerror`, `onclose`
- Parsing automatique des messages JSON entrants
- Routing des messages par `type` vers des handlers enregistrés

**Code clé :**

```typescript
async connect(): Promise<void> {
  // Récupérer le JWT Clerk
  const token = await this.clerkService.getToken();
  if (!token) {
    throw new Error('Impossible de récupérer le token Clerk');
  }

  // Ouvrir la connexion WebSocket avec token en query string
  const wsUrl = `ws://localhost:3000/ws?token=${token}`;
  this.ws = new WebSocket(wsUrl);

  this.ws.onopen = () => this.handleOpen();
  this.ws.onmessage = (event) => this.handleMessage(event);
  this.ws.onerror = (error) => this.handleError(error);
  this.ws.onclose = (event) => this.handleClose(event);
}
```

**Routing des messages :**

```typescript
private handleMessage(event: MessageEvent): void {
  const message: SocketMessage = JSON.parse(event.data);
  
  // Appeler les handlers enregistrés pour ce type
  const handlers = this.handlers.get(message.type);
  if (handlers) {
    handlers.forEach(handler => handler(message));
  }
}
```

**Utilisation dans un composant :**

```typescript
ngOnInit() {
  await this.socketService.connect();
  
  this.socketService.on('state:hydrate', (msg) => this.handleHydrate(msg));
  this.socketService.on('state:tick', (msg) => this.handleTick(msg));
}
```

---

## 3️⃣ Observation du handshake (Captures à prendre)

### **📸 Capture 1 : Handshake réussi (Status 101)**

**DevTools → Network → filtre WS**

1. Ouvrir la page `/multi` (se connecter si nécessaire)
2. Dans Network, cliquer sur la requête `ws?token=...`
3. Capturer :
   - **Request Headers** : `Upgrade: websocket`, `Connection: Upgrade`, `Sec-WebSocket-Key`, `Sec-WebSocket-Version: 13`
   - **Response Headers** : `HTTP/1.1 101 Switching Protocols`, `Upgrade: websocket`, `Sec-WebSocket-Accept`

**Analyse :**
- Status 101 = "Switching Protocols" confirme que la connexion passe de HTTP à WebSocket
- `Sec-WebSocket-Accept` = hash SHA-1 de `Sec-WebSocket-Key` + GUID magique (prouve que le serveur comprend WS)

---

### **📸 Capture 2 : Messages WebSocket (onglet Messages)**

1. Rester connecté quelques secondes
2. Cliquer sur l'onglet **Messages** (à côté de Headers)
3. Observer les frames entrantes et sortantes :
   - ↓ `state:hydrate` (vert = entrant)
   - ↓ `state:tick` (toutes les secondes)
   - ↑ `action:click` (rouge = sortant, si on clique)
   - ↓ `action:confirmed` (réponse serveur)

**Analyse :**
- Les frames sont **beaucoup plus petites** que des requêtes HTTP (pas de headers répétés)
- Bi-directionnel : client et serveur envoient indépendamment
- Format JSON pour les messages applicatifs

---

### **📸 Capture 3 : Échec d'authentification (pas de token)**

**Simulation :**

Modifier temporairement `socket.service.ts` :

```typescript
// const wsUrl = `ws://localhost:3000/ws?token=${token}`;
const wsUrl = `ws://localhost:3000/ws`; // Sans token
```

**Résultat attendu :**
- **Code de fermeture : 1008** (Policy Violation)
- Message d'erreur dans console serveur : "Auth required"
- Le client ne reçoit jamais de `state:hydrate`

**Capture :**
- DevTools → Console : erreur WebSocket
- DevTools → Network → WS → Messages : `Close frame` avec code 1008

---

### **📸 Capture 4 : Token expiré**

**Simulation :**

1. Se connecter et récupérer un token
2. Attendre 2-3 minutes (token Clerk expire après 1 minute)
3. Essayer de se reconnecter avec ce token

**Résultat attendu :**
- **Code de fermeture : 1008** ou **1000** (selon implémentation serveur)
- Message : "Token expired" ou "Invalid token"

**Analyse :**
- La vérification JWT côté serveur rejette les tokens expirés (`exp` claim)
- Le client doit récupérer un nouveau token avant de reconnecter

---

## ✍️ Livrables Partie 2

✅ Module [`socket.service.ts`](src/lib/socket.service.ts) — 300 lignes, fonctionnel  
✅ TypeScript types pour tous les messages (`SocketMessage`, `HydratePayload`, etc.)  
✅ Reconnexion avec backoff (voir Partie 7)

📸 **Captures à faire** (instructions ci-dessus) :
- Handshake réussi (status 101)
- Onglet Messages avec frames
- Échec d'auth (1008 sans token)
- Échec d'auth (token expiré)

---

# 🔹 Partie 3 — Rejoindre le monde persistant

## 1️⃣ Hydratation à la connexion

Dès que la connexion WebSocket s'établit, le serveur envoie **immédiatement** un message `state:hydrate` contenant l'état complet du round en cours :

```typescript
{
  type: 'state:hydrate',
  payload: {
    roundId: 'round_1746470400000',
    endsAt: '2026-05-05T20:00:00.000Z',
    players: [
      { userId: 'user_123', name: 'Alice', score: 1234 },
      { userId: 'user_456', name: 'Bob', score: 987 }
    ],
    me: {
      money: 450,
      score: 450,
      clicks: 42,
      resilience: 1,
      upgrades: { DEV_JUNIOR: 2, RESILIENCE_1: 1 },
      sabotageUsedAt: 0
    }
  }
}
```

**Travail implémenté dans [`multi.page.ts`](src/pages/multi.page.ts) :**

```typescript
handleHydrate(msg: any) {
  console.log('💧 Hydratation:', msg.payload);
  
  // Initialiser l'état local avec le state serveur
  this.roundState.set(msg.payload);
  this.myState.set(msg.payload.me);
  this.players.set(msg.payload.players);
}
```

**Calcul du temps restant :**

```typescript
// Timer local pour affichage countdown
this.timerInterval = setInterval(() => {
  const state = this.roundState();
  if (state) {
    const endsAt = new Date(state.endsAt).getTime();
    const now = Date.now();
    const remaining = Math.max(0, Math.floor((endsAt - now) / 1000));
    this.remainingSeconds.set(remaining);
  }
}, 1000);
```

**UI correspondante :**

```html
<div class="timer" [class.urgent]="remainingSeconds() < 60">
  ⏱️ {{ formatTime(remainingSeconds()) }}
</div>
```

**Règle importante :**
- Le **serveur est autoritaire sur la fin du round**
- Le timer client est **purement visuel** (affichage)
- Si le client affiche "0:00" mais que le serveur n'a pas envoyé `round:ended`, le round continue

---

## 2️⃣ Tick serveur (mises à jour temps réel)

Le serveur envoie un message `state:tick` **toutes les secondes** avec les mises à jour :

```typescript
{
  type: 'state:tick',
  payload: {
    players: [
      { userId: 'user_123', name: 'Alice', score: 1250 }, // Score a changé
      { userId: 'user_456', name: 'Bob', score: 987 }
    ],
    me: { // Optionnel : seulement si mon état a changé
      money: 460, // +10 de revenus passifs
      score: 460,
      clicks: 42,
      resilience: 1,
      upgrades: { DEV_JUNIOR: 2, RESILIENCE_1: 1 },
      sabotageUsedAt: 0
    }
  }
}
```

**Handler implémenté :**

```typescript
handleTick(msg: any) {
  // Mettre à jour la liste des joueurs (classement live)
  this.players.set(msg.payload.players);
  
  // Mettre à jour mon état si fourni
  if (msg.payload.me) {
    this.myState.set(msg.payload.me);
  }
}
```

**Optimisation serveur :**
- Le serveur envoie **toujours** la liste complète des joueurs (classement)
- Le champ `me` n'est envoyé **que si mon état a changé** (revenus passifs, etc.)
- Économise de la bande passante (pas besoin d'envoyer 10 champs si rien n'a changé)

---

## 3️⃣ Question : Que se passe-t-il si un tick arrive pendant le traitement du précédent ?

**Scénario :**
1. `state:tick` arrive à T=0, traitement prend 50ms
2. `state:tick` arrive à T=1000ms, pendant que le premier est encore traité

**Réponse :**

En JavaScript (single-threaded), ce n'est **pas un problème** :

1. **Event loop garantit l'ordre** : les messages WebSocket sont mis en queue et traités séquentiellement
2. **Les handlers sont synchrones** : `this.players.set()` est instantané (mise à jour d'un signal Angular)
3. **Pas de race condition** : Angular utilise des signals qui sont immutables et synchrones

**Si on utilisait des appels async/await dans les handlers :**

```typescript
// ❌ PROBLÉMATIQUE
async handleTick(msg: any) {
  await someAsyncOperation(); // Suspension du handler
  this.players.set(msg.payload.players); // Peut arriver en désordre
}
```

→ Les messages pourraient se croiser (tick N+1 traité avant tick N)

**Solution :**
- ✅ Garder les handlers **synchrones**
- ✅ Si opération async nécessaire, la faire **avant** de modifier l'état
- ✅ Utiliser des queues/locks si vraiment nécessaire

**TanStack Query / Zustand / Pinia / Vuex :**
- Tous utilisent des **updates synchrones** par défaut
- Les race conditions sont gérées par l'immutabilité des données
- Les frameworks modernes (Angular, React, Vue) garantissent la cohérence des mises à jour

---

## ✍️ Livrables Partie 3

✅ Page [`/multi`](src/pages/multi.page.ts) fonctionnelle  
✅ Hydratation à la connexion (`state:hydrate`)  
✅ Classement live mis à jour à chaque tick  
✅ Timer de fin de round affiché (MM:SS)  
✅ Distinction visuelle entre "moi" et les autres joueurs

📸 **Capture à faire** :
- **2 navigateurs côte à côte** (Chrome + Firefox ou 2 Chrome en mode incognito)
- Les deux connectés au même round
- Classement synchronisé en temps réel
- Un joueur clique → son score augmente → l'autre voit la mise à jour en <1s

---

# 🔹 Partie 4 — Actions bi-directionnelles

## 1️⃣ Le pattern intention → validation → confirmation

Le client **n'applique JAMAIS directement** une action sur son état local. Il suit ce flow :

1. **Envoyer une intention** au serveur : `{ type: 'action:click' }`
2. **Attendre la réponse** : `action:confirmed` (succès) ou `action:rejected` (échec)
3. **Mettre à jour l'UI** avec l'état retourné par le serveur

**Implémentation dans `socket.service.ts` :**

```typescript
sendAction(actionType: string, payload: any = {}): string {
  const actionId = this.generateActionId(); // UUID court
  this.send({
    type: `action:${actionType}`,
    actionId,
    payload,
  });
  return actionId;
}

private generateActionId(): string {
  return Math.random().toString(36).substring(2, 10); // Ex: "k3x7p9q2"
}
```

**Utilisation dans `multi.page.ts` :**

```typescript
handleClick() {
  this.actionPending.set(true); // Désactiver les boutons
  this.actionError.set(null);
  this.socketService.sendAction('click');
}
```

**Réception de la confirmation :**

```typescript
handleActionConfirmed(msg: any) {
  console.log('✅ Action confirmée:', msg.payload);
  this.actionPending.set(false);
  
  // Mettre à jour mon état avec les données serveur
  const current = this.myState();
  if (current) {
    this.myState.set({
      ...current,
      ...msg.payload, // money, score, clicks, etc.
    });
  }
}
```

**Réception du rejet :**

```typescript
handleActionRejected(msg: any) {
  console.log('❌ Action rejetée:', msg.payload);
  this.actionPending.set(false);
  
  let errorMsg = msg.payload.error; // "Insufficient funds", "On cooldown"
  if (msg.payload.remainingMs) {
    errorMsg += ` (${msg.payload.remainingMs}s restantes)`;
  }
  this.actionError.set(errorMsg);
  
  setTimeout(() => this.actionError.set(null), 3000); // Effacer après 3s
}
```

---

## 2️⃣ Les 3 actions principales

### **Action 1 : Click**

**Client → Serveur :**
```typescript
{ type: 'action:click', actionId: 'abc123' }
```

**Serveur → Client (succès) :**
```typescript
{
  type: 'action:confirmed',
  payload: {
    actionId: 'abc123',
    actionType: 'click',
    money: 1234,
    score: 1234,
    clicks: 43,
    clickValue: 11 // Base 1 + bonus upgrades
  }
}
```

**Serveur calcule :**
```javascript
let clickValue = 1;
for (const [upgradeId, count] of Object.entries(player.upgrades)) {
  if (upgrade.clickBonus) clickValue += upgrade.clickBonus * count;
}
player.money += clickValue;
```

---

### **Action 2 : Buy (acheter un upgrade)**

**Client → Serveur :**
```typescript
{
  type: 'action:buy',
  actionId: 'def456',
  payload: { upgradeId: 'DEV_SENIOR' }
}
```

**Serveur → Client (succès) :**
```typescript
{
  type: 'action:confirmed',
  payload: {
    actionId: 'def456',
    actionType: 'buy',
    money: 734, // 1234 - 500
    score: 734,
    upgrades: { DEV_JUNIOR: 2, DEV_SENIOR: 1 },
    resilience: 1
  }
}
```

**Serveur → Client (échec) :**
```typescript
{
  type: 'action:rejected',
  payload: {
    actionId: 'def456',
    actionType: 'buy',
    error: 'Insufficient funds'
  }
}
```

**Validation serveur :**
```javascript
if (player.money < upgrade.cost) {
  return { success: false, error: 'Insufficient funds' };
}
player.money -= upgrade.cost;
player.upgrades[upgradeId] = (player.upgrades[upgradeId] || 0) + 1;
```

---

### **Action 3 : Sabotage (attaque un autre joueur)**

**Client → Serveur :**
```typescript
{
  type: 'action:sabotage',
  actionId: 'ghi789',
  payload: { targetUserId: 'user_456' }
}
```

**Serveur → Client (succès) :**
```typescript
{
  type: 'action:confirmed',
  payload: {
    actionId: 'ghi789',
    actionType: 'sabotage',
    money: 534, // 734 - 200
    score: 534,
    sabotageUsedAt: 1746470450000 // Timestamp pour cooldown
  }
}
```

**Serveur broadcast event à TOUS les joueurs :**
```typescript
{
  type: 'event:triggered',
  payload: {
    eventType: 'BUG_EN_PROD',
    targetUserId: 'user_456',
    mitigated: false, // Ou true si target a résilience
    impact: -500,
    source: 'user_123' // ← Sabotage vient d'un joueur
  }
}
```

**Validation serveur :**
```javascript
const SABOTAGE_COST = 200;
const SABOTAGE_COOLDOWN_MS = 30 * 1000;
const SABOTAGE_DAMAGE = 500;

if (player.money < SABOTAGE_COST) {
  return { success: false, error: 'Insufficient funds' };
}

if (Date.now() - player.sabotageUsedAt < SABOTAGE_COOLDOWN_MS) {
  return { success: false, error: 'On cooldown', remainingMs: ... };
}

player.money -= SABOTAGE_COST;
player.sabotageUsedAt = Date.now();

// Appliquer dégâts au target
const mitigated = target.resilience > 0;
if (!mitigated) {
  target.money = Math.max(0, target.money - SABOTAGE_DAMAGE);
}

// Broadcast event
broadcast({ type: 'event:triggered', payload: {...} });
```

---

## 3️⃣ Optimistic vs Pessimistic Update

### **Pourquoi l'optimistic update n'est PAS adapté ici ?**

**Rappel TP13 (TanStack Query avec mutations) :**
```typescript
// Optimistic : on met à jour le cache AVANT la réponse serveur
mutation.mutate(newData, {
  onMutate: async (newData) => {
    // Annuler les refetch en cours
    await queryClient.cancelQueries({ queryKey: ['games'] });
    
    // Sauvegarder l'ancien état
    const previousData = queryClient.getQueryData(['games']);
    
    // Mettre à jour optimistiquement
    queryClient.setQueryData(['games'], (old) => [...old, newData]);
    
    return { previousData }; // Pour rollback si échec
  },
  onError: (err, newData, context) => {
    // Rollback en cas d'échec
    queryClient.setQueryData(['games'], context.previousData);
  }
});
```

**Problème en mode multi WebSocket autoritaire :**

1. **Le serveur peut rejeter** : fonds insuffisants, cooldown, cible invalide
2. **Pas de prédictibilité** : le serveur applique des règles complexes (upgrades, événements)
3. **Rollback complexe** : si l'action échoue, il faut annuler les changements visuels
4. **Désynchronisation** : l'UI affiche un état faux pendant 50-200ms (latence réseau)

**Exemple concret :**

```typescript
// ❌ MAUVAIS : Optimistic update sur l'achat
handleBuy(upgradeId) {
  // Optimistic : déduire immédiatement
  this.myState.update(state => ({
    ...state,
    money: state.money - 500,
    upgrades: { ...state.upgrades, DEV_SENIOR: 1 }
  }));
  
  // Envoyer intention
  this.socketService.sendAction('buy', { upgradeId });
  
  // Problème : si le serveur rejette (fonds insuffisants),
  // l'UI affiche un état invalide pendant ~100ms
  // → Mauvaise UX (flash visuel), confusion utilisateur
}
```

---

### **Compromis pour le Click (action quasi-certaine)**

Le **click** échoue très rarement (pas de coût, pas de cooldown). On peut faire un **feedback visuel temporaire** :

```typescript
handleClick() {
  // Feedback visuel immédiat ("+1" qui monte et disparaît)
  this.showClickFeedback('+1 $');
  
  // Intention serveur
  this.socketService.sendAction('click');
  
  // Pas de modification de this.myState() ici !
  // On attend action:confirmed pour mettre à jour
}

showClickFeedback(text: string) {
  const el = document.createElement('div');
  el.textContent = text;
  el.className = 'click-feedback';
  el.style.position = 'absolute';
  el.style.top = '50%';
  el.style.left = '50%';
  el.style.animation = 'floatUp 1s ease-out';
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1000);
}
```

**Règle :**
- ✅ OK pour des **animations purement visuelles** (qui ne changent pas l'état)
- ❌ JAMAIS pour des **modifications de données** (score, argent)

---

### **Pour le Sabotage (action coûteuse) : Pessimistic uniquement**

```typescript
handleSabotage(targetUserId: string, targetName: string) {
  if (!confirm(`Saboter ${targetName} pour 200$ ?`)) return;
  
  // Désactiver l'UI pendant l'attente
  this.actionPending.set(true);
  
  // Envoyer intention
  this.socketService.sendAction('sabotage', { targetUserId });
  
  // Attendre la réponse (100-300ms)
  // → action:confirmed ou action:rejected
  // → Seulement là qu'on met à jour l'UI
}
```

**Feedback utilisateur :**
- Bouton "Saboter" **désactivé** pendant l'attente (spinner ou opacité réduite)
- Si succès : message "💣 Sabotage envoyé !" (toast vert)
- Si échec : message "❌ Fonds insuffisants" (toast rouge)

---

## 4️⃣ Sabotage : UX complète

### **Côté attaquant (celui qui sabote)**

**UI dans `multi.page.ts` :**

```html
@if (player.userId !== currentUserId() && canSabotage()) {
  <button 
    class="sabotage-btn"
    (click)="handleSabotage(player.userId, player.name)"
    [disabled]="actionPending() || !canAffordSabotage()">
    💣 Saboter (200$)
  </button>
}
```

**Logique :**

```typescript
canSabotage(): boolean {
  const state = this.myState();
  if (!state) return false;
  
  const COOLDOWN_MS = 30 * 1000;
  const now = Date.now();
  return state.sabotageUsedAt === 0 || (now - state.sabotageUsedAt >= COOLDOWN_MS);
}

canAffordSabotage(): boolean {
  const state = this.myState();
  return (state?.money || 0) >= 200;
}

handleSabotage(targetUserId: string, targetName: string) {
  if (!confirm(`Saboter ${targetName} pour 200$ ?`)) return;
  
  this.actionPending.set(true);
  this.socketService.sendAction('sabotage', { targetUserId });
}
```

**Réponse serveur :**

```typescript
// Succès
handleActionConfirmed(msg) {
  if (msg.payload.actionType === 'sabotage') {
    // Toast de confirmation
    this.showToast('💣 Sabotage envoyé !', 'success');
  }
}

// Échec
handleActionRejected(msg) {
  if (msg.payload.actionType === 'sabotage') {
    if (msg.payload.error === 'On cooldown') {
      this.showToast(`❌ Cooldown : ${msg.payload.remainingMs}s restantes`, 'error');
    } else {
      this.showToast(`❌ ${msg.payload.error}`, 'error');
    }
  }
}
```

---

### **Côté victime (celui qui est saboté)**

Le serveur envoie un **event à TOUS les joueurs** :

```typescript
{
  type: 'event:triggered',
  payload: {
    eventType: 'BUG_EN_PROD',
    targetUserId: 'user_456', // ← Moi
    mitigated: false,
    impact: -500,
    source: 'user_123' // ← L'attaquant
  }
}
```

**Handler dans `multi.page.ts` :**

```typescript
handleEvent(msg: any) {
  const payload: EventPayload = msg.payload;
  
  // Trouver le nom du joueur ciblé et de la source
  const targetPlayer = this.players().find(p => p.userId === payload.targetUserId);
  const sourcePlayer = payload.source ? this.players().find(p => p.userId === payload.source) : null;
  
  // Ajouter à la liste des events
  const event: GameEvent = {
    id: `${Date.now()}-${Math.random()}`,
    ...payload,
    targetName: targetPlayer?.name || 'Joueur inconnu',
    sourceName: sourcePlayer?.name || null,
    timestamp: Date.now(),
  };
  
  this.recentEvents.set([event, ...this.recentEvents()].slice(0, 10));
  
  // Si JE suis la cible : animation flash + son
  if (payload.targetUserId === this.currentUserId()) {
    this.showFlashAnimation();
    this.playSound('sabotage');
    
    // Notification visuelle
    if (payload.mitigated) {
      this.showToast('🛡️ Sabotage mitigé par votre résilience !', 'info');
    } else {
      this.showToast(`💥 Vous avez été saboté par ${sourcePlayer?.name} (-500$)`, 'warning');
    }
  }
}
```

**Animation flash :**

```typescript
showFlashAnimation() {
  document.body.classList.add('flash-effect');
  setTimeout(() => document.body.classList.remove('flash-effect'), 500);
}
```

```css
@keyframes flash {
  0%, 100% { background: transparent; }
  50% { background: rgba(244, 67, 54, 0.2); } /* Rouge translucide */
}

body.flash-effect {
  animation: flash 0.5s ease-in-out;
}
```

---

## ✍️ Livrables Partie 4

✅ Code des 3 actions : `click`, `buy`, `sabotage`  
✅ Gestion des rejets avec messages d'erreur  
✅ Bouton sabotage avec conditions : fonds suffisants, cooldown OK, pas moi-même  
✅ UX complète : feedback attaquant + victime

📸 **Vidéo à enregistrer** (2 minutes) :
1. 2 navigateurs côte à côte (Alice et Bob)
2. Alice achète un upgrade → action confirmée
3. Alice tente d'acheter sans fonds → action rejetée
4. Alice sabote Bob → Bob reçoit l'event, argent diminue, flash rouge
5. Alice retente de saboter immédiatement → cooldown rejeté

---

**Fin de la Partie 4**

---

# 🔹 Partie 5 — Événements aléatoires & affichage

Le serveur déclenche des événements aléatoires toutes les 30-120 secondes. Ces events peuvent être :
- **Naturels** (déclenchés par le serveur aléatoirement)
- **Sabotages** (déclenchés par un joueur contre un autre)

## 1️⃣ Types d'événements

```typescript
const EVENT_TYPES = [
  { type: 'BUG_EN_PROD', impact: -500, canMitigate: true },
  { type: 'LEVEE_DE_FONDS', impact: 1000, canMitigate: false },
  { type: 'VIRAL_MARKETING', impact: 300, canMitigate: false },
  { type: 'TURNOVER', impact: -200, canMitigate: true },
  { type: 'PARTENARIAT', impact: 500, canMitigate: false },
];
```

**Mitigation par résilience :**
- Si `canMitigate: true` ET que le joueur ciblé a `resilience > 0` : l'impact est **annulé**
- Les upgrades `RESILIENCE_1` (+1) et `RESILIENCE_2` (+2) protègent contre ces events

---

## 2️⃣ Structure du message

```typescript
{
  type: 'event:triggered',
  payload: {
    eventType: 'BUG_EN_PROD',
    targetUserId: 'user_456',
    mitigated: false, // true si résilience a absorbé
    impact: -500,
    source: null // null = event naturel, 'user_123' = sabotage
  }
}
```

**3 cas à distinguer :**

1. **Event naturel ciblé sur moi** : `source: null` + `targetUserId === moi`
   → Toast orange : "⚠️ Bug en production ! (-500$)" ou "🛡️ Mitigé"

2. **Event naturel ciblé sur un autre** : `source: null` + `targetUserId !== moi`
   → Ajouté au flux, pas de notification intrusive

3. **Sabotage reçu** : `source: 'user_123'` + `targetUserId === moi`
   → Toast rouge + animation flash : "💥 Vous avez été saboté par Alice (-500$)"

---

## 3️⃣ Implémentation du flux d'événements

**Type `GameEvent` défini dans `multi.page.ts` :**

```typescript
interface GameEvent {
  id: string;
  eventType: string;
  targetUserId: string;
  targetName: string;
  mitigated: boolean;
  impact: number;
  source: string | null;
  timestamp: number;
}
```

**Handler :**

```typescript
handleEvent(msg: any) {
  const payload: EventPayload = msg.payload;
  
  // Trouver le nom du joueur ciblé
  const targetPlayer = this.players().find(p => p.userId === payload.targetUserId);
  const targetName = targetPlayer?.name || 'Joueur inconnu';
  
  // Créer l'event
  const event: GameEvent = {
    id: `${Date.now()}-${Math.random()}`,
    ...payload,
    targetName,
    timestamp: Date.now(),
  };
  
  // Ajouter au flux (garder les 10 derniers)
  const events = [event, ...this.recentEvents()];
  this.recentEvents.set(events.slice(0, 10));
  
  // Si JE suis ciblé : animation + notification
  if (payload.targetUserId === this.currentUserId()) {
    document.body.classList.add('flash-effect');
    setTimeout(() => document.body.classList.remove('flash-effect'), 500);
    
    // Toast différent selon mitigation
    if (payload.mitigated) {
      this.showToast('🛡️ Event mitigé !', 'info');
    } else {
      const sign = payload.impact > 0 ? '+' : '';
      this.showToast(`⚡ ${this.getEventLabel(payload.eventType)} (${sign}${payload.impact}$)`, 
        payload.impact > 0 ? 'success' : 'warning');
    }
  }
}
```

---

## 4️⃣ UI du flux d'événements

**Template dans `multi.page.ts` :**

```html
<div class="events-feed">
  <h2>📰 Événements récents</h2>
  <div class="events-list">
    @for (event of recentEvents(); track event.id) {
      <div 
        class="event-card" 
        [class.positive]="event.impact > 0"
        [class.negative]="event.impact < 0"
        [class.targeted-me]="event.targetUserId === currentUserId()"
        [class.mitigated]="event.mitigated">
        
        <div class="event-icon">{{ getEventIcon(event.eventType) }}</div>
        
        <div class="event-content">
          <div class="event-type">{{ getEventLabel(event.eventType) }}</div>
          <div class="event-desc">
            @if (event.source) {
              <!-- Sabotage -->
              @if (event.targetUserId === currentUserId()) {
                <span>Vous avez été saboté !</span>
              } @else {
                <span>{{ event.targetName }} a été saboté</span>
              }
            } @else {
              <!-- Event naturel -->
              @if (event.targetUserId === currentUserId()) {
                <span>Vous êtes affecté</span>
              } @else {
                <span>{{ event.targetName }} est affecté</span>
              }
            }
            <span class="impact" [class.positive]="event.impact > 0">
              {{ event.impact > 0 ? '+' : '' }}{{ formatNumber(event.impact) }} $
            </span>
            @if (event.mitigated) {
              <span class="mitigated-badge">🛡️ Mitigé</span>
            }
          </div>
        </div>
        
        <div class="event-time">{{ formatEventTime(event.timestamp) }}</div>
      </div>
    }
  </div>
</div>
```

**Styles visuels :**

```css
.event-card.positive {
  border-left-color: #4caf50;
  background: #e8f5e9;
}

.event-card.negative {
  border-left-color: #f44336;
  background: #ffebee;
}

.event-card.targeted-me {
  animation: flash 0.5s ease-in-out;
  font-weight: 600;
}

.event-card.mitigated {
  opacity: 0.7;
  background: #e3f2fd; /* Bleu léger */
}

@keyframes flash {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.02); box-shadow: 0 8px 24px rgba(0,0,0,0.2); }
}
```

---

## 5️⃣ Icônes et labels

```typescript
getEventIcon(eventType: string): string {
  const icons: Record<string, string> = {
    'BUG_EN_PROD': '🐛',
    'LEVEE_DE_FONDS': '💰',
    'VIRAL_MARKETING': '📈',
    'TURNOVER': '🚪',
    'PARTENARIAT': '🤝',
  };
  return icons[eventType] || '⚡';
}

getEventLabel(eventType: string): string {
  const labels: Record<string, string> = {
    'BUG_EN_PROD': 'Bug en production',
    'LEVEE_DE_FONDS': 'Levée de fonds',
    'VIRAL_MARKETING': 'Marketing viral',
    'TURNOVER': 'Turnover',
    'PARTENARIAT': 'Partenariat',
  };
  return labels[eventType] || eventType;
}

formatEventTime(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  return `${mins}min`;
}
```

---

## ✍️ Livrables Partie 5

✅ Gestion des 3 types d'events : ciblé sur moi, ciblé sur autre, sabotage  
✅ Distinction visuelle : positif (vert), négatif (rouge), mitigé (bleu opaque)  
✅ Flux d'actualité avec les 10 derniers events  
✅ Animation flash quand je suis ciblé

📸 **Capture à faire** :
- Flux d'events avec au moins 5 events de types différents
- Au moins 1 event mitigé (avec badge 🛡️)
- Au moins 1 sabotage (avec indication du joueur source)

---

# 🔹 Partie 6 — Cohabitation WebSocket ↔ TanStack Query

## 1️⃣ Segmentation claire des sources de données

Au TP13, on utilisait **TanStack Query** pour gérer le cache REST (leaderboard all-time, historique).  
Au TP14, on ajoute **WebSocket** pour les données temps réel.

**Tableau de segmentation :**

| Donnée | Source | Fréquence de mise à jour | Invalidation |
|--------|--------|-------------------------|--------------|
| **Leaderboard all-time** | REST (TanStack) | Toutes les 30s (refetch auto) | À chaque `round:ended` |
| **Historique de mes parties** | REST (TanStack) | À la demande (`/stats`) | À chaque `round:ended` |
| **Classement round en cours** | WebSocket | Toutes les 1s (`state:tick`) | — (temps réel) |
| **Mon état du round (money, upgrades)** | WebSocket | En temps réel (`state:tick`, `action:confirmed`) | — (temps réel) |
| **Flux d'événements** | WebSocket | En temps réel (`event:triggered`) | — (temps réel) |

**Principe :**
- **WebSocket** : données **éphémères** du round en cours (disparaissent à la fin)
- **TanStack Query** : données **persistantes** (historique, leaderboard all-time)

---

## 2️⃣ Pattern : Invalider le cache TanStack Query à la fin d'un round

Quand le round se termine, le leaderboard all-time peut avoir changé (nouveaux high scores).  
Il faut **invalider les queries REST** pour forcer un refetch.

**Implémentation dans `multi.page.ts` :**

```typescript
import { inject } from '@angular/core';
import { injectQueryClient } from '@tanstack/angular-query-experimental';

export class MultiPage {
  socketService = inject(SocketService);
  queryClient = injectQueryClient();

  ngOnInit() {
    // ...autres handlers...
    
    this.socketService.on('round:ended', (msg: any) => this.handleRoundEnded(msg));
  }

  handleRoundEnded(msg: any) {
    console.log('🏁 Fin du round:', msg.payload);
    
    // Invalider les queries TanStack Query
    this.queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
    this.queryClient.invalidateQueries({ queryKey: ['games', 'me'] });
    
    // TODO: Afficher modal avec classement final
    // TODO: Attendre 5s avant le prochain round
  }
}
```

**Effet :**
- Si l'utilisateur est sur `/leaderboard`, le leaderboard sera **automatiquement refetché**
- Si l'utilisateur est sur `/stats`, son historique sera refetché
- Les données sont cohérentes entre REST et WebSocket

---

## 3️⃣ Vérification dans DevTools Network

**Test :**

1. Ouvrir `/leaderboard` dans un onglet
2. Ouvrir `/multi` dans un autre onglet
3. Jouer le round jusqu'à la fin (5 minutes)
4. Quand `round:ended` est reçu, **observer DevTools → Network** dans l'onglet leaderboard
5. Une requête `GET /api/leaderboard` doit apparaître automatiquement

**Capture à prendre :**
- DevTools → Network → filtre XHR
- Timestamp de la requête refetch juste après `round:ended`
- Response avec les nouveaux scores

---

## 4️⃣ Problème potentiel : Double source de vérité

**Scénario dangereux :**

```typescript
// ❌ MAUVAIS : Mettre les données WebSocket dans TanStack Query
queryClient.setQueryData(['currentRound'], roundData);
```

**Pourquoi c'est mauvais :**
- TanStack Query est fait pour du **cache REST** (stale time, refetch, etc.)
- Les données WebSocket sont **push temps réel**, pas pull
- Risque de désynchronisation (cache stale vs données live)
- Complexité accrue (gérer 2 systèmes de cache)

**✅ BONNE PRATIQUE :**
- **WebSocket → Signals Angular** (ou Zustand/Pinia/Vuex)
- **TanStack Query → Cache REST uniquement**
- **Invalidation Query à `round:ended`** : seul pont entre les deux

---

## ✍️ Livrables Partie 6

✅ Tableau de segmentation dans TP14-LIVRABLE.md  
✅ Code d'invalidation à `round:ended`  
✅ Distinction claire : WebSocket = temps réel éphémère, TanStack = REST persistant

📸 **Capture Network** :
- Refetch automatique de `/api/leaderboard` après `round:ended`

---

# 🔹 Partie 7 — Robustesse : déconnexion et reconnexion

## 1️⃣ Expérience : Provoquer une déconnexion

**DevTools → Network → Throttling → Offline**

**Observations :**

1. **Que se passe-t-il côté app ?**
   - L'event `onclose` est déclenché
   - `connectionState` passe à `'disconnected'`
   - UI affiche : "⚠️ Déconnecté - Reconnexion dans Xs"

2. **Quel code de close ?**
   - **1006** (Abnormal Closure) : fermeture anormale (réseau coupé, serveur down)
   - **Pas de `reason`** fournie (fermeture brutale)

3. **Délai de détection ?**
   - **Immédiat** si coupure réseau brutale (navigateur détecte la perte de connexion TCP)
   - **~30-60s** si serveur down mais réseau OK (timeout TCP)

---

## 2️⃣ Stratégie de reconnexion avec backoff exponentiel

**Implémentation dans `socket.service.ts` :**

```typescript
private reconnectAttempts = 0;
private reconnectTimeout: any = null;
private maxReconnectAttempts = 10;
private reconnectDelays = [1000, 2000, 4000, 8000, 16000, 30000]; // Cap à 30s

private handleClose(event: CloseEvent): void {
  console.log(`🔌 WebSocket fermé: code=${event.code}, reason="${event.reason}"`);
  this.connectionState = 'disconnected';
  this.ws = null;

  // Code 1008 = Policy Violation (auth failed)
  // Code 1000 = Normal closure
  if (event.code === 1008 || event.code === 1000) {
    console.log('🛑 Pas de reconnexion (auth invalide ou fermeture volontaire)');
    // TODO: Rediriger vers /sign-in si 1008
    return;
  }

  // Reconnexion automatique avec backoff
  this.scheduleReconnect();
}

private scheduleReconnect(): void {
  if (this.reconnectAttempts >= this.maxReconnectAttempts) {
    console.error('❌ Nombre max de tentatives atteint');
    this.connectionState = 'error';
    return;
  }

  // Délai avec cap à 30s
  const delayIndex = Math.min(this.reconnectAttempts, this.reconnectDelays.length - 1);
  const delay = this.reconnectDelays[delayIndex];
  
  this.reconnectAttempts++;
  this.reconnectCountdown = delay / 1000;

  console.log(`🔄 Reconnexion dans ${this.reconnectCountdown}s (tentative ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

  // Countdown visuel pour l'utilisateur
  const countdownInterval = setInterval(() => {
    this.reconnectCountdown--;
    if (this.reconnectCountdown <= 0) clearInterval(countdownInterval);
  }, 1000);

  this.reconnectTimeout = setTimeout(() => {
    console.log('🔄 Tentative de reconnexion...');
    this.connect();
  }, delay);
}
```

**Séquence de backoff :**
- Tentative 1 : 1s
- Tentative 2 : 2s
- Tentative 3 : 4s
- Tentative 4 : 8s
- Tentative 5 : 16s
- Tentative 6+ : 30s (cap)

**Abandon après 10 tentatives** (soit ~3 minutes d'essais).

---

## 3️⃣ Gestion du cas 401 (token invalide)

**Scénario :**
- Le token Clerk expire (1 minute)
- Le serveur ferme la connexion avec code **1008** (Policy Violation)
- Il ne faut **PAS** reconnecter automatiquement (token toujours invalide)
- Il faut **rediriger vers `/sign-in`**

**Code :**

```typescript
private handleClose(event: CloseEvent): void {
  if (event.code === 1008) {
    console.log('🛑 Auth invalide : redirection vers sign-in');
    this.router.navigate(['/sign-in']);
    return;
  }
  
  this.scheduleReconnect();
}
```

---

## 4️⃣ Hydratation automatique au retour

**Comportement serveur :**

Quand un client se **reconnecte** au WebSocket, le serveur envoie automatiquement un `state:hydrate` avec l'état actuel du round.

**Pas besoin de rejouer les events manqués** : on fait du **state sync**, pas du **event sourcing**.

**Exemple :**

1. Alice se connecte à T=0, round démarre
2. Alice perd la connexion à T=120s (2 minutes)
3. Pendant 30s, Bob joue et gagne 500$ → Alice ne voit rien
4. Alice se reconnecte à T=150s
5. Serveur envoie `state:hydrate` avec l'état à T=150s :
   ```json
   {
     "players": [
       { "userId": "bob", "score": 1500 }, // Score actuel de Bob
       { "userId": "alice", "score": 450 }
     ],
     "me": { "money": 450, ... }
   }
   ```

**Alice voit instantanément l'état actuel**, sans besoin de rattrapage événementiel.

---

## 5️⃣ Test manuel obligatoire

**Protocole :**

1. Ouvrir **2 navigateurs** (Chrome + Firefox ou 2 Chrome incognito)
2. Se connecter avec 2 comptes différents (ou 2 sessions Clerk)
3. Les deux rejoignent `/multi`
4. **Navigateur 1 (Alice)** : DevTools → Network → Offline
5. **Navigateur 2 (Bob)** : continuer à jouer (cliquer, acheter)
6. Attendre 30 secondes
7. **Navigateur 1 (Alice)** : DevTools → Network → Online
8. Observer :
   - Alice se reconnecte automatiquement (tentative après 1s, 2s, 4s...)
   - `state:hydrate` reçu
   - Le classement d'Alice **affiche l'état actuel** (score de Bob mis à jour)

**Capture vidéo attendue :**
- 2 navigateurs côte à côte
- Alice passe offline → badge "Déconnecté"
- Bob joue (score augmente)
- Alice repasse online → reconnexion → hydratation → état synchronisé

---

## ✍️ Livrables Partie 7

✅ Code de reconnexion avec backoff exponentiel (1s, 2s, 4s, 8s, 16s, cap 30s)  
✅ Gestion du cas 1008 (redirection `/sign-in`)  
✅ Abandon après 10 tentatives  
✅ Hydratation automatique au retour

📸 **Vidéo/captures** :
- Test offline → online avec 2 navigateurs
- Rattrapage via `state:hydrate`

---

# 🔹 Partie 8 — Analyse performance & architecture

## 1️⃣ Estimation pour 100 joueurs simultanés

### **Frames WebSocket envoyées par seconde (serveur → clients)**

**Messages réguliers :**
- `state:tick` : **1 fois/seconde** broadcast à 100 joueurs = **100 messages/s**
- Chaque message contient :
  - Liste des 100 joueurs (userId, name, score) : ~100 * 50 bytes = 5 KB
  - État "me" optionnel : ~500 bytes
  - **Total par message : ~5.5 KB**
  - **Bande passante tick : 100 * 5.5 KB/s = 550 KB/s**

**Messages événementiels :**
- `event:triggered` : **1 event toutes les 30-120s** broadcast à 100 joueurs
  - Moyenne : 1 event/60s → 1.67 events/minute → **0.028 events/s**
  - Broadcast à 100 clients → **2.8 messages/s**
  - Taille par message : ~200 bytes
  - **Bande passante events : 2.8 * 200 bytes/s = 560 bytes/s = 0.56 KB/s**

**Messages d'actions :**
- `action:confirmed` / `action:rejected` : **individuels** (pas broadcast)
  - Estimons 1 action/joueur/10s → **10 actions/s** pour 100 joueurs
  - Taille par réponse : ~300 bytes
  - **Bande passante actions : 10 * 300 bytes/s = 3 KB/s**

**Total serveur → clients :**
- **550 KB/s (tick) + 0.56 KB/s (events) + 3 KB/s (actions) = ~553.56 KB/s**
- Soit **~4.4 Mbps** en sortie (download pour les clients)

**Frames clients → serveur :**
- Estimons 1 action/joueur/10s → **10 messages/s** total
- Taille par action : ~100 bytes
- **Bande passante clients → serveur : 10 * 100 bytes/s = 1 KB/s**
- Soit **~0.008 Mbps** en entrée (négligeable)

**Total bidirectionnel : ~4.5 Mbps**

---

## 2️⃣ Limites de scale & axes d'amélioration

### **Au-delà de combien d'utilisateurs ça cesse de scaler ?**

**Facteurs limitants :**

1. **Bande passante serveur**
   - Serveur VPS classique : 100 Mbps (12.5 MB/s)
   - Notre calcul : 553 KB/s pour 100 joueurs
   - **Limite théorique : ~2250 joueurs** avant saturation bande passante
   - En pratique : cap à **1000-1500 joueurs** (overhead TCP, pics de trafic)

2. **CPU serveur (calculs + broadcast)**
   - Calculs de gameplay : O(n) par tick (parcourir 1000 joueurs)
   - Broadcast : O(n²) naïf (envoyer à n joueurs, n fois)
   - **Limite pratique : ~500-1000 joueurs** sur un serveur mono-core

3. **Mémoire (état en RAM)**
   - État par joueur : ~1 KB (upgrades, money, etc.)
   - 1000 joueurs = **1 MB** → pas un problème

**Conclusion : limite ~500-1000 joueurs** sur un serveur classique (4 cores, 100 Mbps).

---

### **Axes de scale-out :**

**1. Sharding horizontal (plusieurs rounds parallèles)**

```
Round 1 : 100 joueurs (serveur A)
Round 2 : 100 joueurs (serveur B)
Round 3 : 100 joueurs (serveur C)
```

- Load balancer : router les connexions WebSocket par `roundId`
- Chaque serveur gère un round indépendant
- **Scale linéaire : 10 serveurs = 1000 joueurs**

**2. Redis Pub/Sub pour broadcast optimisé**

```
Serveur A ──┐
Serveur B ──┤──> Redis Pub/Sub ──> Broadcast à tous les workers
Serveur C ──┘
```

- Un seul serveur calcule l'état
- Redis broadcast aux autres serveurs
- Chaque serveur envoie aux clients connectés localement
- **Réduit la charge CPU** (calcul centralisé, envoi distribué)

**3. WebSocket via CDN (Cloudflare Workers, AWS API Gateway WebSocket)**

- Edge locations proches des utilisateurs
- Réduction de la latence
- Mais : coût élevé, complexité accrue

**4. Optimisation du payload (binaire vs JSON)**

- Actuellement : JSON (~5.5 KB/tick)
- Avec Protocol Buffers (binaire) : ~1 KB/tick
- **Économie : 80% de bande passante**
- Mais : complexité de sérialisation/désérialisation

---

## 3️⃣ Pourquoi le serverless gère mal les WebSockets ?

**Serverless (Vercel, Netlify Functions, AWS Lambda) :**

- **Modèle :** 1 requête = 1 fonction = 1 exécution éphémère
- **Durée de vie :** quelques secondes à quelques minutes
- **Tarification :** par invocation et durée d'exécution

**Problèmes avec WebSocket :**

1. **Connexions long-lived**
   - WebSocket reste ouvert **5 minutes** (durée du round)
   - Serverless limite : **15 minutes max** (AWS Lambda), **10s-60s** (Vercel)
   - **Coût prohibitif** : payer pour chaque seconde de connexion ouverte

2. **Pas de mémoire partagée**
   - Chaque fonction est **isolée**
   - Pas de "serveur global" pour stocker l'état du round
   - Il faut externaliser l'état dans Redis/DynamoDB → latence + coût

3. **Cold starts**
   - Si aucune requête pendant 5 minutes, le container se met en veille
   - Prochain client : **latence de ~1-5s** (cold start)
   - Pour WebSocket temps réel : **inacceptable**

**Solutions serverless-compatibles :**
- **AWS API Gateway WebSocket** : service managé dédié (mais cher)
- **Fly.io / Railway.app** : "serverless with state" (containers persistants)
- **Pusher / Ably** : SaaS WebSocket spécialisé (coût par connexion)

**Pour Startup Tycoon :** VPS classique (3-5€/mois) est **100x plus adapté** que du serverless.

---

## 4️⃣ Sticky sessions : c'est quoi et quand c'est nécessaire ?

### **Définition**

Une **sticky session** (ou session affinity) force un client à se connecter **toujours au même serveur** pendant toute sa session.

**Mécanisme :**
- Load balancer (Nginx, HAProxy) utilise un **cookie** ou l'**IP client** pour router
- Client A → Serveur 1 (toujours)
- Client B → Serveur 2 (toujours)

---

### **Quand est-ce nécessaire ?**

**Cas 1 : État en mémoire non partagé**

Si chaque serveur stocke l'état du round **localement en RAM** (comme notre implémentation actuelle) :

```
Serveur A : { players: [Alice, Bob], roundId: 'round_1' }
Serveur B : { players: [Charlie], roundId: 'round_2' }
```

- Alice se connecte → Load balancer l'envoie au Serveur A
- Alice se déconnecte puis reconnecte → Si elle va sur Serveur B, elle ne trouvera pas son état
- **Solution : sticky session** pour qu'Alice reste sur Serveur A

**Cas 2 : WebSocket ne peut pas être migré**

Une connexion WebSocket TCP ne peut pas être "transférée" d'un serveur à un autre sans fermeture.

- Si le load balancer change de serveur mid-session, la connexion se ferme
- **Solution : sticky session** pour garder la connexion sur le même serveur

---

### **Alternative : État centralisé (Redis)**

```
Serveur A ──┐
Serveur B ──┤──> Redis (état partagé)
Serveur C ──┘
```

- L'état du round est dans **Redis** (pas en RAM serveur)
- Alice peut se connecter à n'importe quel serveur
- **Plus besoin de sticky session**
- Mais : latence Redis (~1-5ms) + coût infrastructure

---

**Pour Startup Tycoon :**
- **Phase 1 (< 500 joueurs)** : 1 seul serveur → pas besoin de sticky session
- **Phase 2 (500-5000 joueurs)** : Sharding par round + sticky session (simple)
- **Phase 3 (> 5000 joueurs)** : Redis centralisé + load balancing sans sticky (complexe)

---

## 5️⃣ Supporter 10 000 joueurs simultanés

**Architecture proposée :**

### **1. Sharding par rounds (100 rounds de 100 joueurs)**

```
Round 1-10  : Serveur A (Paris)
Round 11-20 : Serveur B (Londres)
Round 21-30 : Serveur C (Berlin)
...
```

- **Load balancer intelligent** : router par `roundId` hash ou région géographique
- Chaque serveur gère **10 rounds en parallèle** (1000 joueurs/serveur)
- **10 serveurs = 10 000 joueurs**

### **2. Redis Pub/Sub pour événements globaux**

```
Serveur A ──┐
Serveur B ──┤──> Redis Pub/Sub (leaderboard global, annonces)
Serveur C ──┘
```

- Les rounds individuels restent locaux
- Les événements cross-rounds (leaderboard all-time) passent par Redis

### **3. Database : PostgreSQL avec sharding**

```
DB Shard 1 : Rounds 1-33   (users 0-3333)
DB Shard 2 : Rounds 34-66  (users 3334-6666)
DB Shard 3 : Rounds 67-100 (users 6667-10000)
```

- Partitionnement par `userId` hash
- Chaque shard gère ~3333 joueurs
- **Répartition de charge** sur les writes (save scores)

### **4. CDN pour les assets statiques**

- HTML/CSS/JS servis depuis Cloudflare/Fastly
- Reduce latency pour les utilisateurs loin du serveur principal

---

**Coût estimé (10 000 joueurs) :**
- 10 serveurs VPS (8 cores, 16 GB RAM) : **50€/mois** x 10 = **500€/mois**
- Redis managed (32 GB) : **100€/mois**
- PostgreSQL managed : **150€/mois**
- Bande passante (50 TB/mois) : **200€/mois**
- **Total : ~950€/mois** pour 10 000 joueurs simultanés

---

## ✍️ Livrables Partie 8

✅ Calculs de bande passante pour 100 joueurs (~550 KB/s serveur → clients)  
✅ Limite de scale : ~500-1000 joueurs sur un serveur classique  
✅ Axes de scale-out : sharding, Redis Pub/Sub, binaire vs JSON  
✅ Explication serverless incompatible avec WebSocket long-lived  
✅ Sticky sessions : définition, cas d'usage, alternative Redis  
✅ Architecture 10 000 joueurs : 10 serveurs + sharding + Redis

---

# 🔹 Partie 9 — Synthèse critique

## 1. Différence fondamentale entre TP13 (REST) et TP14 (WebSocket autoritaire)

### **TP13 : Architecture REST client-authoritative**

**Caractéristiques :**
- Client calcule le score côté frontend
- À la fin de la partie, envoie le score au serveur via `POST /api/games`
- **Le serveur fait confiance au score envoyé** (validation minimale : entier positif, durée bornée)

**Code client (TP13) :**
```typescript
handleClick() {
  this.money += this.clickValue; // ← Client calcule
  this.score = this.money;       // ← Client décide
}

async submitScore() {
  await apiService.post('/api/games', {
    score: this.score, // ← Client envoie SON calcul
    duration: 300,
    clicks: this.clicks
  });
}
```

**Problème :**
- Un joueur malveillant peut modifier le code JS et envoyer `score: 999999999`
- Le serveur ne peut pas détecter la triche (comment savoir si 999999 est légitime ?)
- **Mode solo uniquement** : pas de compétition équitable

---

### **TP14 : Architecture WebSocket server-authoritative**

**Caractéristiques :**
- Client envoie des **intentions** (je veux cliquer, acheter, saboter)
- **Le serveur valide et calcule** l'effet de chaque action
- Le serveur broadcast l'état validé à tous les clients
- **Mode multijoueur équitable** : impossible de tricher

**Code client (TP14) :**
```typescript
handleClick() {
  // Intention uniquement
  this.socketService.sendAction('click'); // ← Pas de calcul local
}

handleActionConfirmed(msg) {
  // J'applique ce que le serveur me dit
  this.myState.set({
    ...this.myState(),
    money: msg.payload.money, // ← Le serveur a décidé
    score: msg.payload.score
  });
}
```

**Code serveur :**
```javascript
handleClick(userId) {
  const player = this.players.get(userId);
  let clickValue = 1;
  
  // Calcul autoritaire côté serveur
  for (const [upgradeId, count] of Object.entries(player.upgrades)) {
    if (upgrade.clickBonus) clickValue += upgrade.clickBonus * count;
  }
  
  player.money += clickValue; // ← Serveur décide
  
  return { money: player.money, score: player.money };
}
```

---

**Tableau comparatif :**

| Critère | TP13 (REST) | TP14 (WebSocket) |
|---------|-------------|------------------|
| **Calcul du score** | Client | Serveur |
| **Source de vérité** | Client envoie | Serveur broadcast |
| **Triche possible ?** | ✅ Oui (modifier JS) | ❌ Non (serveur autoritaire) |
| **Mode multi ?** | ❌ Non équitable | ✅ Équitable |
| **Latence** | Aucune (local) | 50-200ms (réseau) |
| **Complexité** | Simple | Complexe (état serveur, sync) |

---

## 2. Auriez-vous pu utiliser SSE pour le leaderboard live ? Pourquoi pas pour le sabotage ?

### **SSE (Server-Sent Events) pour le leaderboard live : OUI, mais limité**

**SSE = flux uni-directionnel serveur → client** (HTTP streaming).

**Code SSE hypothétique :**

```typescript
// Client
const eventSource = new EventSource('/api/leaderboard/live');

eventSource.onmessage = (event) => {
  const players = JSON.parse(event.data);
  this.players.set(players); // Mettre à jour l'UI
};
```

```javascript
// Serveur
app.get('/api/leaderboard/live', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const interval = setInterval(() => {
    const players = engine.getPlayersSnapshot();
    res.write(`data: ${JSON.stringify(players)}\n\n`);
  }, 1000);

  req.on('close', () => clearInterval(interval));
});
```

**✅ Avantages SSE :**
- Simple à implémenter (HTTP classique)
- Reconnexion automatique native (navigateur gère)
- Fonctionne bien avec proxies HTTP

**❌ Inconvénients SSE :**
- **Uni-directionnel** : le client ne peut PAS envoyer de messages au serveur via SSE
- Pour envoyer une action (click, buy), il faut utiliser **HTTP POST en parallèle**
- Deux canaux séparés (SSE + HTTP) → complexité accrue

---

### **Pourquoi SSE ne convient PAS pour le sabotage ?**

**Le sabotage nécessite une communication bi-directionnelle :**

1. **Client → Serveur** : "Je sabote user_456"
2. **Serveur → Client** : "Sabotage confirmé" ou "Rejeté (fonds insuffisants)"
3. **Serveur → Tous** : "Event BUG_EN_PROD sur user_456"

**Avec SSE, on doit combiner :**
- **SSE** pour recevoir les events (étape 3)
- **HTTP POST** pour envoyer le sabotage (étape 1)
- **Comment matcher la réponse ?** Il faudrait ajouter un `actionId` et attendre le bon event SSE

**Exemple code (complexe) :**

```typescript
// Envoyer sabotage via HTTP POST
const actionId = generateId();
await fetch('/api/sabotage', {
  method: 'POST',
  body: JSON.stringify({ actionId, targetUserId: 'user_456' })
});

// Attendre la confirmation via SSE
eventSource.addEventListener('action:confirmed', (event) => {
  const data = JSON.parse(event.data);
  if (data.actionId === actionId) {
    // Confirmation reçue
  }
});
```

**Problème :**
- **2 connexions** (SSE + HTTP) au lieu d'1 (WebSocket)
- **Complexité de matching** (actionId)
- **Pas d'ordre garanti** entre POST et SSE

**Conclusion : WebSocket est 10x plus adapté** pour du bi-directionnel avec actions + events.

---

## 3. Un junior dit : "En mode multi, je calcule le score côté client et je l'envoie au serveur à la fin." Argumentez pourquoi c'est une mauvaise idée.

### **Argument 1 : Triche triviale**

```javascript
// ❌ Code du junior
handleClick() {
  this.money += 10;
}

endGame() {
  socket.send({ type: 'submit_score', score: this.money });
}
```

**Attaque :**
1. Ouvrir DevTools → Console
2. Taper : `this.money = 999999999`
3. Terminer la partie
4. **Score frauduleux enregistré**

**Conséquence :**
- Leaderboard pollué
- Joueurs légitimes démotivés
- Économie du jeu cassée

---

### **Argument 2 : Impossibilité de détecter la triche**

**Le serveur reçoit juste un nombre :**

```json
{ "score": 12450 }
```

**Questions impossibles à répondre :**
- Ce score est-il atteignable en 5 minutes ?
- Combien de clicks ont été faits ?
- Quels upgrades ont été achetés ?
- Les revenus passifs sont-ils cohérents ?

**Solution naïve du junior : limites arbitraires**

```javascript
if (score > 100000) {
  return { error: 'Score too high' };
}
```

**Problème :**
- Un joueur légitime avec beaucoup d'upgrades peut dépasser 100000
- Un tricheur peut envoyer 99999 (sous la limite, mais toujours frauduleux)
- **Impossible de distinguer légitime de frauduleux**

---

### **Argument 3 : Désynchronisation entre joueurs**

**Scénario :**
- Alice calcule localement : 12000$
- Bob calcule localement : 12500$
- Serveur broadcast : qui est premier ?

**Si le serveur fait confiance aux deux :**
- Alice voit : "Je suis #1 avec 12000$"
- Bob voit : "Je suis #1 avec 12500$"
- **Incohérence** : les deux pensent être premiers

**Seule solution : serveur autoritaire**

```javascript
// Serveur calcule l'état unique
const ranking = players.sort((a, b) => b.score - a.score);
broadcast({ type: 'leaderboard', ranking });
```

→ Tous les joueurs voient le **même classement** (source de vérité unique).

---

### **Argument 4 : Événements aléatoires impossibles**

**Le serveur déclenche des events :**
- Bug en production → -500$
- Levée de fonds → +1000$

**Avec calcul client :**
- Le serveur envoie : "Alice, tu perds 500$"
- Alice applique localement : `this.money -= 500`
- **Mais Alice a déjà modifié `this.money` manuellement dans DevTools**
- Le serveur ne peut pas vérifier que l'event a bien été appliqué

**Avec serveur autoritaire :**
- Le serveur calcule : `alice.money -= 500`
- Le serveur broadcast : "Alice a maintenant 950$"
- Alice **ne peut que accepter** l'état serveur

---

### **Conclusion : Serveur autoritaire = seule solution viable pour du multijoueur compétitif**

| Approche | Solo (TP13) | Multi (TP14) |
|----------|-------------|--------------|
| **Client calcule** | ✅ OK (pas de compétition) | ❌ Triche facile |
| **Serveur calcule** | ⚠️ Over-engineering | ✅ Nécessaire |

---

## 4. Le cookie `__session` de Clerk sert à l'auth HTTP. Est-ce qu'il est aussi envoyé pour le WebSocket ? Pourquoi utilise-t-on quand même le token en query string ?

### **Est-ce que le cookie est envoyé ?**

**OUI**, si conditions réunies :

1. **Same-origin** : `ws://localhost:3000` et `http://localhost:4200`
   - **Problème :** Pas same-origin (ports différents)
   - **Conséquence :** Navigateur **ne peut pas** envoyer le cookie automatiquement

2. **Cross-origin avec CORS credentials** :
   - Il faudrait que le serveur réponde au handshake HTTP avec :
     ```http
     Access-Control-Allow-Origin: http://localhost:4200
     Access-Control-Allow-Credentials: true
     ```
   - **Mais WebSocket n'utilise pas CORS classique** (c'est un upgrade HTTP, pas une requête classique)

**Conclusion : Le cookie `__session` n'est PAS automatiquement envoyé en dev (ports différents).**

---

### **Pourquoi token en query string alors ?**

**Raisons techniques :**

1. **`new WebSocket()` ne permet pas de headers custom**
   ```typescript
   // ❌ Impossible
   const ws = new WebSocket('ws://localhost:3000/ws', {
     headers: { 'Authorization': 'Bearer xyz' }
   });
   ```

2. **Seules options :**
   - Token en query string : `ws://localhost:3000/ws?token=xyz`
   - Message post-connexion : `ws.send({ type: 'auth', token: 'xyz' })`

3. **Query string = plus simple**
   - Le serveur peut valider **avant d'établir la connexion WebSocket**
   - Rejeter immédiatement si token invalide (code 1008)
   - Pas besoin de bufferiser les messages en attente d'auth

---

### **En production (same-origin) ?**

Si le frontend était servi depuis `http://localhost:3000` (même port que le backend), le cookie serait envoyé automatiquement.

**Code serveur hypothétique :**

```javascript
wss.on('connection', (ws, req) => {
  // Lire le cookie depuis les headers HTTP du handshake
  const cookies = parseCookies(req.headers.cookie);
  const sessionToken = cookies['__session'];
  
  if (!sessionToken) {
    ws.close(1008, 'Auth required');
    return;
  }
  
  // Vérifier le token
  const { userId } = await verifyJWT(sessionToken);
  // ...
});
```

**Mais dans notre cas (dev avec ports différents), token en query string est obligatoire.**

---

## 5. Si demain vous deviez ajouter un chat dans le round, quelles modifications feriez-vous au protocole WebSocket ?

### **Spécifications fonctionnelles**

**Features du chat :**
- Messages texte publics (tous les joueurs du round)
- Messages avec émetteur (userId + name)
- Historique des 50 derniers messages chargés à la connexion
- Pas de messages privés (pour simplifier)
- Limite : 200 caractères par message

---

### **Modifications du protocole WebSocket**

#### **1. Nouveau message : `chat:message`**

**Client → Serveur (envoi d'un message) :**

```typescript
{
  type: 'chat:send',
  payload: {
    text: 'Salut tout le monde !'
  }
}
```

**Serveur → Tous les clients (broadcast) :**

```typescript
{
  type: 'chat:message',
  payload: {
    messageId: 'msg_123',
    userId: 'user_abc',
    username: 'Alice',
    text: 'Salut tout le monde !',
    timestamp: '2026-05-05T20:15:30.000Z'
  }
}
```

---

#### **2. Historique dans `state:hydrate`**

**Quand un client se connecte, inclure les 50 derniers messages :**

```typescript
{
  type: 'state:hydrate',
  payload: {
    roundId: 'round_42',
    endsAt: '2026-05-05T20:30:00.000Z',
    players: [...],
    me: {...},
    chatHistory: [ // ← Nouveau champ
      {
        messageId: 'msg_120',
        userId: 'user_xyz',
        username: 'Bob',
        text: 'Bonne chance !',
        timestamp: '2026-05-05T20:10:00.000Z'
      },
      // ... 49 autres messages
    ]
  }
}
```

---

#### **3. Validation serveur**

**Règles :**
- Longueur max : 200 caractères
- Pas de spam : max 1 message toutes les 2 secondes
- Pas de messages vides (trim)
- Filtrage basique de contenu offensant (optionnel)

**Code serveur :**

```javascript
handleChatSend(userId, text) {
  const player = this.players.get(userId);
  
  // Validation
  text = text.trim();
  if (text.length === 0) {
    return { success: false, error: 'Empty message' };
  }
  if (text.length > 200) {
    return { success: false, error: 'Message too long (max 200 chars)' };
  }
  
  // Anti-spam
  const now = Date.now();
  if (player.lastMessageAt && (now - player.lastMessageAt < 2000)) {
    return { success: false, error: 'Too fast (wait 2s)' };
  }
  player.lastMessageAt = now;
  
  // Créer le message
  const message = {
    messageId: `msg_${Date.now()}`,
    userId,
    username: player.name,
    text,
    timestamp: new Date().toISOString()
  };
  
  // Ajouter à l'historique (garder 50 derniers)
  this.chatHistory.push(message);
  if (this.chatHistory.length > 50) {
    this.chatHistory.shift();
  }
  
  // Broadcast à tous
  this.broadcast({
    type: 'chat:message',
    payload: message
  });
  
  return { success: true };
}
```

---

### **Modifications côté frontend**

#### **1. État du chat**

```typescript
export class MultiPage {
  chatMessages = signal<ChatMessage[]>([]);
  chatInput = signal('');
  
  handleHydrate(msg: any) {
    // Charger l'historique
    this.chatMessages.set(msg.payload.chatHistory || []);
  }
  
  handleChatMessage(msg: any) {
    // Ajouter le nouveau message
    const messages = [...this.chatMessages(), msg.payload];
    this.chatMessages.set(messages.slice(-50)); // Garder 50 max
  }
}
```

---

#### **2. UI du chat**

```html
<div class="chat-container">
  <h3>💬 Chat</h3>
  
  <!-- Liste des messages -->
  <div class="chat-messages">
    @for (msg of chatMessages(); track msg.messageId) {
      <div class="chat-message" [class.me]="msg.userId === currentUserId()">
        <span class="chat-username">{{ msg.username }}:</span>
        <span class="chat-text">{{ msg.text }}</span>
        <span class="chat-time">{{ formatTime(msg.timestamp) }}</span>
      </div>
    }
  </div>
  
  <!-- Input -->
  <div class="chat-input">
    <input 
      type="text" 
      [(ngModel)]="chatInput"
      (keyup.enter)="sendChatMessage()"
      maxlength="200"
      placeholder="Tapez un message..." />
    <button (click)="sendChatMessage()">Envoyer</button>
  </div>
</div>
```

---

#### **3. Envoi du message**

```typescript
sendChatMessage() {
  const text = this.chatInput().trim();
  if (text.length === 0) return;
  
  this.socketService.send({
    type: 'chat:send',
    payload: { text }
  });
  
  this.chatInput.set(''); // Clear input
}
```

---

### **Considérations supplémentaires**

**1. Modération :**
- Liste noire de mots (côté serveur)
- Système de report (client envoie `chat:report`, admin review)

**2. Rate limiting avancé :**
- Token bucket : 10 messages max sur une fenêtre de 60s
- Bannissement temporaire si spam détecté

**3. Sécurité XSS :**
- **Échapper le HTML côté frontend** (Angular fait ça automatiquement avec `{{ }}`)
- Ne jamais utiliser `[innerHTML]` avec du contenu chat

**4. Performances :**
- Avec 100 joueurs qui chattent activement (1 msg/10s/joueur), ça fait **10 messages/s** broadcast
- Taille moyenne : ~150 bytes/message
- **Bande passante chat : 10 * 150 * 100 = 150 KB/s** (négligeable comparé aux ticks)

---

## ✍️ Livrables Partie 9

✅ Comparaison TP13 vs TP14 : client vs serveur autoritaire  
✅ SSE viable pour leaderboard, pas pour sabotage (uni vs bi-directionnel)  
✅ Argumentation anti-client-side scoring (triche, désync, events)  
✅ Cookie Clerk non envoyé en dev (cross-origin), token en query string nécessaire  
✅ Spécification complète d'un chat WebSocket (messages, hydratation, validation)

---

**FIN DU TP14-LIVRABLE.md**

---

