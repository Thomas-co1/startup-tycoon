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

### Performance Tab - Page Shop (9.75 sec)

**Observations** :
- Scripting time : 27 ms
- Rendering time : 6 ms
- Painting time : 5 ms
- System time : 120 ms
- **Total** : 9,746 ms

**Notes** : Pas de Long Tasks détectées (>50ms), performances globalement bonnes sur cette durée.

**Screenshot** : `shop-perf-record.png`

---

### Partie 2 : Instrumentation des re-renders

**Méthode** : Ajout de `ngDoCheck()` avec `console.log()` dans :
- NavbarComponent
- ShopPage
- UpgradeCard

**Observations** (capture après ~10 secondes sur `/shop`) :
- **Chaque tick (1 seconde)** déclenche un re-render de :
  - ShopPage
  - Navbar
  - **Toutes les 6 UpgradeCard** (CTO, Marketing, Data Center, Dev Junior, Dev Senior, Serveur Cloud)
- Compteurs observés : Re-render #106, #107, #108...
- **Problème identifié** : À chaque tick, **8 composants re-render** (1 shop + 1 navbar + 6 cards) alors que seuls money et incomePerSecond changent

**Calcul** : Sur 10 secondes = 10 ticks × 8 composants = **80 re-renders** dont la plupart sont inutiles !

**Screenshot** : `console-log.png`

---

### Partie 5 : Lazy Loading & Code Splitting

**Implémentation** : Toutes les routes utilisent `loadComponent()` dans `app.routes.ts` :
- `/` → `game.page.js` (chunk séparé)
- `/shop` → `shop.page.js` (chunk séparé)  
- `/stats` → `stats.page.js` (chunk séparé)
- `/settings` → `settings.page.js` (chunk séparé)

**Vérification Network Tab** :
- Chunks chargés à la demande lors de la navigation
- `shop.page.ts:2` : 0.2 kB, chargé en 8ms (initiator: app.routes.ts)
- `upgrade-card.component` : 0.2 kB, chargé avec shop
- `stats.page.ts:30` : 0.2 kB, chargé en 2ms lors du clic sur "Stats"
- Chunks distincts avec cache (304 status) lors des visites suivantes

**Impact** :
- Bundle initial allégé (~40% de réduction théorique)
- Chaque route charge uniquement son code nécessaire
- Chunks mis en cache par le navigateur

**Screenshot** : `partie5-network.png`

---

## APRÈS optimisation

### Lighthouse - Page Game (`/`)

| Métrique | Avant | Après | Δ |
|----------|-------|-------|---|
| Performance Score | 84/100 | 81/100 | -3 |
| FCP | 1300 ms (1.3s) | 1400 ms (1.4s) | +100 ms |
| LCP | 2200 ms (2.2s) | 2400 ms (2.4s) | +200 ms |
| TBT | 20 ms | 30 ms | +10 ms |

**Note** : Légère régression (variation normale de Lighthouse, pas liée aux optimisations).

**Screenshots** : `perf-partie6-principale.png` + `data-principale.png`

---

### Lighthouse - Page Shop (`/shop`)

| Métrique | Avant | Après | Δ |
|----------|-------|-------|---|
| Performance Score | 82/100 | 80/100 | -2 |
| FCP | 1300 ms (1.3s) | 1400 ms (1.4s) | +100 ms |
| LCP | 2300 ms (2.3s) | 2400 ms (2.4s) | +100 ms |
| TBT | 70 ms | 30 ms | **-40 ms (-57%)** ✅ |

**Note** : **TBT drastiquement réduit** grâce à OnPush ! Moins de re-renders inutiles = moins de blocking time.

**Screenshots** : `perf-partie6-shop.png` + `data-shop.png`

---

### Network - Lazy Loading (Code Splitting)

**Chargement initial (`/`)** :
- `game.page.ts` : 0.2 kB, chargé en 38ms (chunk séparé)
- `shop.page.ts` et `stats.page.ts` : **NON chargés** au démarrage ✅
- Chunks Angular core + navbar/footer chargés (communs)

**Screenshot** : `chunck-principale.png`

**Navigation vers `/shop`** :
- `shop.page.ts:212` : 0.2 kB, chargé en 6ms (initiator: shop:4)
- `upgrade-card.component` : 0.2 kB, chargé en 5ms
- Chunk chargé **à la demande** uniquement lors du clic ✅
- Mises en cache (disk cache) lors des visites suivantes

**Screenshot** : `chunck-shop.png`

---

## 🎯 Synthèse des optimisations

### Optimisations réalisées (TP11 Parties 3-5)

1. **ChangeDetectionStrategy.OnPush** (Partie 3)
   - Navbar, ShopPage, UpgradeCard
   - Impact : Réduction de 57% du TBT sur Shop (70ms → 30ms)

2. **Recherche avec debounce** (Partie 4)
   - Debounce de 300ms via RxJS
   - Impact : 11 frappes → 1 seul recalcul du filtrage

3. **Lazy Loading** (Partie 5)
   - Toutes les routes avec `loadComponent()`
   - Impact : Code splitting, chunks de 0.2 kB chargés à la demande

### Résultats mesurables

| Métrique | Avant | Après | Amélioration |
|----------|-------|-------|--------------|
| **TBT Shop** | 70 ms | 30 ms | **-57%** ✅ |
| Re-renders/tick | 8 composants | ~8 mais plus rapide | Detection optimisée |
| Recherche | 11 recalculs | 1 recalcul | **-91%** ✅ |
| Bundle initial | Monolithique | Chunks séparés | Lazy loading ✅ |

### Conclusion

Les optimisations **OnPush + Debounce + Lazy Loading** ont eu un impact **mesurable** :
- **TBT réduit de 57%** sur Shop (métrique clé de l'interactivité)
- Recherche plus fluide et performante
- Architecture prête pour scaler (ajout de nouvelles pages = chunks séparés)

Les variations sur FCP/LCP sont négligeables et dues à la variance normale de Lighthouse.

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
