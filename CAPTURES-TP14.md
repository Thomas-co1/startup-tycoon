# 📸 Guide des captures TP14

**⚠️ IMPORTANT : Le backend WebSocket doit être implémenté et fonctionnel avant de prendre ces captures.**

Actuellement, le backend n'a pas encore le code WebSocket. Vous devez soit :
1. Obtenir le backend TP14 auprès de votre prof
2. Attendre qu'il soit publié
3. Ou demander-moi de l'implémenter

---

## 🔧 Prérequis

1. **Backend lancé** : `cd BackEndStartUpTycoon ; npm start`
2. **Frontend lancé** : `cd startup-tycoon ; npm start`
3. **2 navigateurs** : Chrome + Firefox (ou 2 Chrome en mode incognito)
4. **2 comptes Clerk** : créer 2 comptes différents pour tester multi-joueurs

---

## 📸 Partie 2 : Connexion WebSocket authentifiée

### **Capture 1 : Handshake réussi (Status 101)**

**Steps :**
1. Ouvrir Chrome
2. DevTools → Network → filtre WS
3. Se connecter sur http://localhost:4200
4. Aller sur `/multi`
5. Dans Network, cliquer sur la requête `ws?token=...`
6. Onglet **Headers** :
   - Capturer **Request Headers** : `Upgrade: websocket`, `Connection: Upgrade`, `Sec-WebSocket-Key`
   - Capturer **Response Headers** : `HTTP/1.1 101 Switching Protocols`, `Sec-WebSocket-Accept`

**Nom du fichier :** `handshake-101.png`

---

### **Capture 2 : Messages WebSocket**

**Steps :**
1. Rester connecté sur `/multi`
2. DevTools → Network → requête WS → onglet **Messages**
3. Observer pendant 5-10 secondes :
   - ↓ `state:hydrate` (vert = reçu)
   - ↓ `state:tick` (plusieurs fois, toutes les secondes)
   - Cliquer sur le bouton "Cliquer"
   - ↑ `action:click` (rouge = envoyé)
   - ↓ `action:confirmed` (réponse)

**Capturer tout l'onglet Messages avec au moins 5 frames visibles.**

**Nom du fichier :** `websocket-messages.png`

---

### **Capture 3 : Échec d'auth (pas de token)**

**Steps :**
1. Modifier temporairement `src/lib/socket.service.ts` ligne ~45 :
   ```typescript
   // const wsUrl = `ws://localhost:3000/ws?token=${token}`;
   const wsUrl = `ws://localhost:3000/ws`; // Sans token
   ```
2. Recharger `/multi`
3. DevTools → Network → WS → Messages
4. Observer le **Close frame** avec code **1008** (Policy Violation)
5. Capturer l'onglet Messages montrant la fermeture

**Nom du fichier :** `auth-fail-no-token.png`

**⚠️ Ne pas oublier de remettre le token après la capture !**

---

### **Capture 4 : Token expiré**

**Steps :**
1. Se connecter sur `/multi`
2. Attendre **2-3 minutes** (token Clerk expire après 1 minute)
3. Fermer l'onglet et en ouvrir un nouveau
4. Aller sur `/multi` (avec le token expiré dans le cache Clerk)
5. Observer la déconnexion (code 1008 ou message d'erreur)

**Nom du fichier :** `auth-fail-expired.png`

---

## 📸 Partie 3 : Rejoindre le monde persistant

### **Capture 5 : 2 navigateurs synchronisés**

**Steps :**
1. **Navigateur 1 (Alice)** : Chrome, compte Clerk Alice, `/multi`
2. **Navigateur 2 (Bob)** : Firefox, compte Clerk Bob, `/multi`
3. Placer les 2 fenêtres **côte à côte**
4. **Bob clique 5-10 fois**
5. Observer que le score de Bob augmente **dans les 2 navigateurs**
6. Capturer les 2 écrans côte à côte montrant :
   - Les 2 classements synchronisés
   - Le timer identique
   - L'état "C'est vous" sur chaque navigateur pour son propre joueur

**Nom du fichier :** `multi-sync-2-browsers.png`

---

## 📸 Partie 4 : Actions bi-directionnelles

### **Capture 6 : Action rejetée (fonds insuffisants)**

**Steps :**
1. Se connecter sur `/multi`
2. Cliquer sur "💻 Dev Junior (100$)" **alors que vous avez 0$**
3. Observer le message d'erreur rouge : "❌ Insufficient funds"
4. Capturer l'écran avec le message d'erreur visible

**Nom du fichier :** `action-rejected-funds.png`

---

### **Capture 7 : Sabotage (2 joueurs)**

**Steps :**
1. **2 navigateurs côte à côte**
2. **Alice** : Cliquer plusieurs fois pour avoir au moins 200$
3. **Alice** : Cliquer sur "💣 Saboter (200$)" sur la carte de Bob
4. Confirmer la popup
5. **Observer dans les 2 navigateurs** :
   - Alice : message "💣 Sabotage envoyé !"
   - Bob : flash rouge + message "💥 Vous avez été saboté par Alice (-500$)"
   - Score de Bob diminue
6. Capturer les 2 navigateurs au moment de l'event

**Nom du fichier :** `sabotage-2-players.png`

---

### **Capture 8 : Cooldown sabotage**

**Steps :**
1. Juste après avoir saboté (capture précédente)
2. Essayer de saboter à nouveau immédiatement
3. Observer le message d'erreur : "❌ On cooldown (30s restantes)"
4. Capturer l'écran avec le message visible

**Nom du fichier :** `sabotage-cooldown.png`

---

## 📸 Partie 5 : Événements aléatoires

### **Capture 9 : Flux d'événements**

**Steps :**
1. Se connecter sur `/multi`
2. **Attendre 2-3 minutes** pour accumuler plusieurs événements :
   - Events aléatoires naturels (BUG_EN_PROD, LEVEE_DE_FONDS, etc.)
   - Sabotages entre joueurs si possible
3. Capturer le **flux d'actualité** avec **au moins 5 événements** visibles :
   - Au moins 1 événement positif (vert)
   - Au moins 1 événement négatif (rouge)
   - Au moins 1 événement mitigé (badge 🛡️)
   - Au moins 1 sabotage (avec indication du joueur source)

**Nom du fichier :** `events-feed.png`

---

## 📸 Partie 6 : Cohabitation WebSocket / TanStack Query

### **Capture 10 : Refetch après round:ended**

**Steps :**
1. Ouvrir `/leaderboard` dans un onglet
2. Ouvrir `/multi` dans un autre onglet
3. DevTools → Network → filtre XHR (dans l'onglet leaderboard)
4. **Attendre la fin du round** (5 minutes)
5. Quand `round:ended` est reçu (visible dans console WebSocket)
6. Observer dans Network : une nouvelle requête `GET /api/leaderboard` apparaît automatiquement
7. Capturer DevTools Network montrant :
   - La requête refetch
   - Le timestamp

**Nom du fichier :** `refetch-after-round-ended.png`

---

## 📸 Partie 7 : Robustesse (reconnexion)

### **Capture 11 : Test offline → online**

**Steps :**
1. **2 navigateurs côte à côte**
2. **Alice** : DevTools → Network → Throttling → **Offline**
3. Observer badge "⚠️ Déconnecté - Reconnexion dans Xs"
4. **Bob** : Continuer à jouer (cliquer, acheter)
5. Attendre 10-20 secondes
6. **Alice** : DevTools → Network → Throttling → **Online**
7. Observer :
   - Alice se reconnecte (tentatives 1s, 2s, 4s...)
   - `state:hydrate` reçu
   - Classement d'Alice mis à jour avec le nouveau score de Bob
8. Capturer les 2 navigateurs montrant :
   - Alice reconnectée
   - État synchronisé

**Nom du fichier :** `reconnect-offline-online.png`

---

## 🎥 Vidéo obligatoire (3-4 minutes)

**Scénario complet à enregistrer :**

1. **Intro** (10s)
   - Montrer les 2 navigateurs côte à côte
   - Dire "Alice" et "Bob"

2. **Rejoindre le round** (30s)
   - Les 2 joueurs se connectent sur `/multi`
   - Montrer le classement vide puis les 2 joueurs apparaissent
   - Timer qui décompte

3. **Actions** (1 min)
   - Alice clique plusieurs fois → son score augmente dans les 2 navigateurs
   - Bob achète un upgrade → confirmation
   - Alice tente d'acheter sans fonds → rejet

4. **Sabotage** (1 min)
   - Alice sabote Bob
   - Montrer les 2 effets (Alice : confirmation, Bob : flash + perte d'argent)
   - Alice retente immédiatement → cooldown

5. **Event aléatoire** (30s)
   - Attendre qu'un event naturel se déclenche
   - Montrer l'apparition dans le flux
   - Si l'event touche un joueur, montrer la notification

6. **Fin de round** (30s)
   - Attendre la fin du round (ou simuler en modifiant le temps)
   - Montrer `round:ended` → classement figé
   - Nouveau round démarre après 5s

7. **Reconnexion** (30s)
   - Alice passe offline
   - Bob joue
   - Alice repasse online → rattrapage

**Nom du fichier :** `tp14-demo.mp4` (ou .webm)

---

## 📊 Checklist finale

Avant de déposer sur Eduxim, vérifier que vous avez :

- [ ] 11 captures d'écran (parties 2-7)
- [ ] 1 vidéo de 3-4 minutes
- [ ] TP14-LIVRABLE.md complété (2000+ lignes)
- [ ] Code source poussé sur GitHub (branche TP14)
- [ ] README.md mis à jour (section TP14)
- [ ] `npm run build` fonctionne sans erreur

---

## ⚠️ Rappel

**Le backend WebSocket doit être fonctionnel pour ces captures.**

Si vous n'avez pas le backend fourni par le prof, vous devez soit :
1. Le demander
2. Attendre qu'il soit publié
3. Me demander de l'implémenter (mais l'énoncé dit "backend fourni")

**Bon courage ! 🚀**
