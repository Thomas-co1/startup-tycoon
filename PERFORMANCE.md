# 📊 Mesures de Performance - TP11

## Baseline (AVANT optimisation)

### Lighthouse - Page Game (`/`)

| Métrique | Valeur |
|----------|--------|
| Performance Score | 84/100 |
| FCP (First Contentful Paint) | 1300 ms (1.3s) |
| LCP (Largest Contentful Paint) | 2200 ms (2.2s) |
| TBT (Total Blocking Time) | 20 ms |

**Screenshots** : `Ligthhouse-page-principale-perf.png` + `lighthouse-fcp-lcp-principale.png`

---

### Lighthouse - Page Shop (`/shop`)

| Métrique | Valeur |
|----------|--------|
| Performance Score | 82/100 |
| FCP (First Contentful Paint) | 1300 ms (1.3s) |
| LCP (Largest Contentful Paint) | 2300 ms (2.3s) |
| TBT (Total Blocking Time) | 70 ms |

**Screenshots** : `Ligthhouse-page-shop-perf.png` + `lighthouse-fcp-lcp-shop.png`

---

### Performance Tab - Page Shop (5-10 sec)

**Observations** :
- Long tasks : 
- Scripting time : 
- Rendering time : 

**Screenshot** : `screenshots/performance-shop-before.png`

---

## APRÈS optimisation

### Lighthouse - Page Game (`/`)

| Métrique | Avant | Après | Δ |
|----------|-------|-------|---|
| Performance Score | | | |
| FCP | | | |
| LCP | | | |
| TBT | | | |

**Screenshot** : `screenshots/lighthouse-game-after.png`

---

### Lighthouse - Page Shop (`/shop`)

| Métrique | Avant | Après | Δ |
|----------|-------|-------|---|
| Performance Score | | | |
| FCP | | | |
| LCP | | | |
| TBT | | | |

**Screenshot** : `screenshots/lighthouse-shop-after.png`

---

### Performance Tab - Page Shop

**Observations** :
- Long tasks : Avant ___ → Après ___
- Scripting time : Avant ___ → Après ___
- Rendering time : Avant ___ → Après ___

**Screenshot** : `screenshots/performance-shop-after.png`

---

### Network - Lazy Loading

**Chargement initial (`/`)** :
- Chunks Shop/Stats chargés ? OUI / NON
- Screenshot : `screenshots/network-initial.png`

**Navigation vers `/shop`** :
- Chunk chargé à la demande ? OUI / NON
- Screenshot : `screenshots/network-shop-lazy.png`
# 📊 Mesures de performance - TP11

## 🔹 Partie 1 : Baseline (AVANT optimisation)

### Instructions pour la mesure

1. **Lancer le serveur** : `npm start`
2. **Ouvrir Chrome DevTools** (F12)
3. **Lighthouse** :
   - Onglet "Lighthouse"
   - Sélectionner "Navigation" + catégorie "Performance"
   - Désactiver les extensions Chrome (mode incognito recommandé)
   - Lancer l'audit

4. **Performance Recording** :
   - Onglet "Performance"
   - Cliquer sur "Record"
   - Enregistrer pendant 5-10 secondes sur `/shop`
   - Observer les long tasks, scripting time, rendering time

---

### Lighthouse - Page Game (`/`)

**À remplir après mesure** :

| Métrique | Valeur | Notes |
|----------|--------|-------|
| Performance Score | ___/100 | Score global |
| First Contentful Paint (FCP) | ___ ms | Premier élément visible |
| Largest Contentful Paint (LCP) | ___ ms | Plus grand élément visible |
| Total Blocking Time (TBT) | ___ ms | Temps de blocage total |
| Cumulative Layout Shift (CLS) | ___ | Stabilité visuelle |
| Speed Index | ___ ms | Rapidité d'affichage |

**Capture d'écran** : `screenshots/lighthouse-game-before.png`

---

### Lighthouse - Page Shop (`/shop`)

**À remplir après mesure** :

| Métrique | Valeur | Notes |
|----------|--------|-------|
| Performance Score | ___/100 | Score global |
| First Contentful Paint (FCP) | ___ ms | Premier élément visible |
| Largest Contentful Paint (LCP) | ___ ms | Plus grand élément visible |
| Total Blocking Time (TBT) | ___ ms | Temps de blocage total |
| Cumulative Layout Shift (CLS) | ___ | Stabilité visuelle |
| Speed Index | ___ ms | Rapidité d'affichage |

**Capture d'écran** : `screenshots/lighthouse-shop-before.png`

---

### Performance Tab - Page Shop (`/shop`)

**Enregistrement pendant tick actif (5-10 secondes)** :

| Observation | Valeur | Notes |
|-------------|--------|-------|
| Long Tasks | ___ | Nombre de tâches >50ms |
| Main Thread Time | ___ ms | Temps CPU total |
| Scripting Time | ___ ms | Temps d'exécution JS |
| Rendering Time | ___ ms | Temps de rendu |
| Frame Rate | ___ fps | Images par seconde |

**Observations qualitatives** :
- [ ] Chutes de frame rate visible ?
- [ ] Long tasks fréquents ?
- [ ] Activité continue du main thread ?

**Capture d'écran** : `screenshots/performance-shop-before.png`

---

### Console - Logs de re-renders

**Après 10 secondes sur `/shop`** :

| Composant | Nombre de re-renders | Observations |
|-----------|---------------------|--------------|
| Navbar | ___ | Re-render à chaque tick ? |
| ShopPage | ___ | Re-render à chaque tick ? |
| UpgradeCard (Dev Junior) | ___ | Re-render même sans changement ? |
| UpgradeCard (Dev Senior) | ___ | Re-render même sans changement ? |
| UpgradeCard (Serveur Cloud) | ___ | Re-render même sans changement ? |
| UpgradeCard (Marketing) | ___ | Re-render même sans changement ? |
| UpgradeCard (CTO) | ___ | Re-render même sans changement ? |
| UpgradeCard (Data Center) | ___ | Re-render même sans changement ? |

**Observations** :
- _Décris ici le comportement observé dans la console_

---

## 🔹 Partie 6 : Mesures finales (APRÈS optimisation)

### Lighthouse - Page Game (`/`)

| Métrique | Avant | Après | Δ | % |
|----------|-------|-------|---|---|
| Performance Score | ___ | ___ | ___ | ___% |
| FCP | ___ ms | ___ ms | ___ ms | ___% |
| LCP | ___ ms | ___ ms | ___ ms | ___% |
| TBT | ___ ms | ___ ms | ___ ms | ___% |
| CLS | ___ | ___ | ___ | ___% |

**Capture d'écran** : `screenshots/lighthouse-game-after.png`

---

### Lighthouse - Page Shop (`/shop`)

| Métrique | Avant | Après | Δ | % |
|----------|-------|-------|---|---|
| Performance Score | ___ | ___ | ___ | ___% |
| FCP | ___ ms | ___ ms | ___ ms | ___% |
| LCP | ___ ms | ___ ms | ___ ms | ___% |
| TBT | ___ ms | ___ ms | ___ ms | ___% |
| CLS | ___ | ___ | ___ | ___% |

**Capture d'écran** : `screenshots/lighthouse-shop-after.png`

---

### Performance Tab - Page Shop (`/shop`)

| Observation | Avant | Après | Δ |
|-------------|-------|-------|---|
| Long Tasks | ___ | ___ | ___ |
| Main Thread Time | ___ ms | ___ ms | ___ ms |
| Scripting Time | ___ ms | ___ ms | ___ ms |
| Rendering Time | ___ ms | ___ ms | ___ ms |
| Frame Rate | ___ fps | ___ fps | ___ fps |

**Capture d'écran** : `screenshots/performance-shop-after.png`

---

### Console - Logs de re-renders (après optimisation)

**Après 10 secondes sur `/shop`** :

| Composant | Avant | Après | Réduction |
|-----------|-------|-------|-----------|
| Navbar | ___ | ___ | ___% |
| ShopPage | ___ | ___ | ___% |
| UpgradeCard (Dev Junior) | ___ | ___ | ___% |
| UpgradeCard (Dev Senior) | ___ | ___ | ___% |
| Toutes les UpgradeCards (total) | ___ | ___ | ___% |

---

### Network - Lazy Loading

**Chargement initial (`/`)** :
- [ ] Chunks Shop/Stats chargés ? OUI / NON
- [ ] Screenshot : `screenshots/network-initial.png`

**Navigation vers `/shop`** :
- [ ] Chunk Shop chargé à la demande ? OUI / NON
- [ ] Taille du chunk : ___ KB
- [ ] Screenshot : `screenshots/network-shop-lazy.png`

**Navigation vers `/stats`** :
- [ ] Chunk Stats chargé à la demande ? OUI / NON
- [ ] Taille du chunk : ___ KB
- [ ] Screenshot : `screenshots/network-stats-lazy.png`

---

## 📌 Synthèse

### Optimisations implémentées

1. **Re-renders** :
   - _Description de l'optimisation_
   - Impact mesuré : ___

2. **Debounce recherche** :
   - _Description de l'optimisation_
   - Impact mesuré : ___

3. **Lazy loading** :
   - _Description de l'optimisation_
   - Impact mesuré : ___

### Conclusion

_À remplir après toutes les mesures et optimisations_
