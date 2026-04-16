import { Component, signal, effect, OnInit } from '@angular/core';
import { Upgrade } from '../models/upgrade.model';
import { UpgradeCard } from '../components/upgrade-card.component';
import { UPGRADES } from '../data/upgrades.data';
import { loadGameData, saveGameData } from '../utils/localStorage';

@Component({
  selector: 'app-shop',
  standalone: true,
  imports: [UpgradeCard],
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

      <div class="upgrades-grid">
        @for (upgrade of upgrades(); track upgrade.id) {
          <app-upgrade-card
            [upgrade]="upgrade"
            [currentCost]="getCurrentCost(upgrade)"
            [canBuy]="canBuy(upgrade)"
            (onBuy)="buyUpgrade($event)"
          />
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

    .upgrades-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
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
export class ShopPage implements OnInit {
  money = signal(0);
  incomePerSecond = signal(0);
  upgrades = signal<Upgrade[]>([]);

  constructor() {
    // Sauvegarder automatiquement à chaque changement
    effect(() => {
      saveGameData('money', this.money());
      saveGameData('incomePerSecond', this.incomePerSecond());
      saveGameData('upgrades', this.upgrades());
    });
  }

  ngOnInit(): void {
    // Charger les données depuis localStorage
    this.money.set(loadGameData('money', 0));
    this.incomePerSecond.set(loadGameData('incomePerSecond', 0));
    
    // Charger les upgrades sauvegardées ou utiliser les valeurs par défaut
    const savedUpgrades = loadGameData<Upgrade[]>('upgrades', []);
    if (savedUpgrades.length > 0) {
      this.upgrades.set(savedUpgrades);
    } else {
      this.upgrades.set(UPGRADES.map(u => ({ ...u })));
    }
  }

  getCurrentCost(upgrade: Upgrade): number {
    return Math.round(upgrade.baseCost * Math.pow(1.15, upgrade.count));
  }

  canBuy(upgrade: Upgrade): boolean {
    return this.money() >= this.getCurrentCost(upgrade);
  }

  buyUpgrade(upgrade: Upgrade): void {
    const currentCost = this.getCurrentCost(upgrade);
    
    if (this.money() >= currentCost) {
      // Déduire le coût
      this.money.update(current => current - currentCost);
      
      // Augmenter le count de l'upgrade
      upgrade.count += 1;
      
      // Augmenter le revenu passif
      this.incomePerSecond.update(current => current + upgrade.incomePerSecondGain);
      
      // Mettre à jour le signal pour déclencher le re-render et la sauvegarde
      this.upgrades.update(upgrades => [...upgrades]);
      
      console.log(`✅ Acheté: ${upgrade.name} (Count: ${upgrade.count}, Income: ${this.incomePerSecond()}$/sec)`);
    } else {
      console.log(`❌ Fonds insuffisants pour ${upgrade.name}. Coût: ${currentCost}$, Disponible: ${this.money()}$`);
    }
  }

  addTestMoney(): void {
    this.money.update(current => current + 100);
  }
}
