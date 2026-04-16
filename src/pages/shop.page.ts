import { Component, inject, ChangeDetectionStrategy, signal, computed, OnDestroy } from '@angular/core';
import { Subject, debounceTime } from 'rxjs';
import { Upgrade } from '../models/upgrade.model';
import { UpgradeCard } from '../components/upgrade-card.component';
import { GameStore } from '../store/game.store';
import { GameActions } from '../state/game.actions';

@Component({
  selector: 'app-shop',
  standalone: true,
  imports: [UpgradeCard],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-container">
      <div class="shop-header">
        <div>
          <h1>🛒 Shop</h1>
          <p class="page-objective">Achetez des upgrades pour augmenter votre revenu passif !</p>
        </div>
        <div class="player-stats">
          <div class="stat-item">
            <span class="stat-label">Argent</span>
            <span class="stat-value money">{{ money() }}$</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Revenu</span>
            <span class="stat-value income">{{ incomePerSecond() }}$/sec</span>
          </div>
        </div>
      </div>

      <div class="search-container">
        <input 
          type="text" 
          class="search-input"
          placeholder="🔍 Rechercher un upgrade..."
          (input)="onSearchInput($event)"
        />
        @if (searchTerm()) {
          <span class="search-results">{{ filteredUpgrades().length }} résultat(s)</span>
        }
      </div>

      <div class="upgrades-grid">
        @for (upgrade of filteredUpgrades(); track upgrade.id) {
          <app-upgrade-card
            [upgrade]="upgrade"
            [currentCost]="getCurrentCost(upgrade)"
            [canBuy]="canBuy(upgrade)"
            (onBuy)="buyUpgrade($event)"
          />
        }
        @empty {
          <div class="no-results">
            <p>😕 Aucun upgrade trouvé</p>
            <p class="hint">Essayez une autre recherche</p>
          </div>
        }
      </div>

      <div class="test-controls">
        <h3>🔧 Contrôles de test (temporaire)</h3>
        <button class="test-btn" (click)="addTestMoney()">+100$</button>
      </div>
    </div>
  `,
  styles: [`
    .page-container {
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
    }

    h1 {
      color: #333;
      margin: 0 0 0.5rem 0;
    }

    .page-objective {
      font-size: 1.1rem;
      color: #666;
      margin: 0;
    }

    .shop-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      padding-bottom: 1.5rem;
      border-bottom: 2px solid #e0e0e0;
    }

    .player-stats {
      display: flex;
      gap: 2rem;
    }

    .stat-item {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
    }

    .stat-label {
      font-size: 0.85rem;
      color: #999;
      text-transform: uppercase;
      font-weight: 600;
      margin-bottom: 0.25rem;
    }

    .stat-value {
      font-size: 1.5rem;
      font-weight: 700;
    }

    .stat-value.money {
      color: #28a745;
    }

    .stat-value.income {
      color: #007bff;
    }

    .search-container {
      margin-bottom: 2rem;
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .search-input {
      flex: 1;
      max-width: 400px;
      padding: 0.75rem 1rem;
      font-size: 1rem;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      transition: all 0.3s;
    }

    .search-input:focus {
      outline: none;
      border-color: #007bff;
      box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
    }

    .search-results {
      font-size: 0.9rem;
      color: #666;
      font-weight: 600;
    }

    .upgrades-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .no-results {
      grid-column: 1 / -1;
      text-align: center;
      padding: 3rem 1rem;
      color: #999;
    }

    .no-results p {
      margin: 0.5rem 0;
      font-size: 1.2rem;
    }

    .no-results .hint {
      font-size: 0.9rem;
      color: #bbb;
    }

    .test-controls {
      margin-top: 2rem;
      padding: 1.5rem;
      background: #f8f9fa;
      border: 2px dashed #dee2e6;
      border-radius: 8px;
      text-align: center;
    }

    .test-controls h3 {
      margin: 0 0 1rem 0;
      color: #6c757d;
      font-size: 1.1rem;
    }

    .test-btn {
      padding: 0.75rem 1.5rem;
      border: 2px solid #007bff;
      background: white;
      color: #007bff;
      border-radius: 6px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s;
    }

    .test-btn:hover {
      background: #007bff;
      color: white;
    }
  `]
})
export class ShopPage implements OnDestroy {
  private store = inject(GameStore);

  // 🔍 TP11 Partie 4: Recherche avec debounce
  private searchInput$ = new Subject<string>();
  searchTerm = signal<string>('');

  // Signals du store
  money = this.store.money;
  incomePerSecond = this.store.incomePerSecond;
  upgrades = this.store.upgrades;

  // Computed: filtrage des upgrades basé sur searchTerm
  filteredUpgrades = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) {
      return this.upgrades();
    }
    return this.upgrades().filter(upgrade =>
      upgrade.name.toLowerCase().includes(term) ||
      upgrade.description.toLowerCase().includes(term)
    );
  });

  constructor() {
    // Debounce de 300ms sur les inputs de recherche
    this.searchInput$
      .pipe(debounceTime(300))
      .subscribe(term => this.searchTerm.set(term));
  }

  ngOnDestroy(): void {
    this.searchInput$.complete();
  }

  onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchInput$.next(input.value);
  }

  getCurrentCost(upgrade: Upgrade): number {
    return Math.round(upgrade.baseCost * Math.pow(1.15, upgrade.count));
  }

  canBuy(upgrade: Upgrade): boolean {
    return this.money() >= this.getCurrentCost(upgrade);
  }

  buyUpgrade(upgrade: Upgrade): void {
    this.store.dispatch(GameActions.buyUpgrade(upgrade));
    console.log(`Tentative d'achat: ${upgrade.name}`);
  }

  // TODO: Créer une action dédiée pour les tests si nécessaire
  addTestMoney(): void {
    console.warn('Test button disabled - needs proper action');
  }
}
