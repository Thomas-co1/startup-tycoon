import { Component, signal } from '@angular/core';
import { UPGRADES } from '../data/upgrades.data';
import { Upgrade } from '../models/upgrade.model';

@Component({
  selector: 'app-shop',
  standalone: true,
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
          <div class="upgrade-card">
            <div class="upgrade-header">
              <h3>{{ upgrade.name }}</h3>
              <span class="owned-count">Possédé: {{ upgrade.count }}</span>
            </div>
            
            <p class="description">{{ upgrade.description }}</p>
            
            <div class="stats">
              <div class="stat">
                <span class="label">Gain:</span>
                <span class="value">+{{ upgrade.incomePerSecondGain }}$/sec</span>
              </div>
              <div class="stat">
                <span class="label">Coût:</span>
                <span class="value cost">{{ getCurrentCost(upgrade) }}$</span>
              </div>
            </div>

            @if (!canBuy(upgrade)) {
              <div class="insufficient-funds">
                💰 Fonds insuffisants
              </div>
            }

            <button 
              class="buy-btn" 
              [disabled]="!canBuy(upgrade)"
              (click)="buyUpgrade(upgrade)"
            >
              Acheter
            </button>
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

    .upgrades-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .upgrade-card {
      background: white;
      border: 2px solid #e0e0e0;
      border-radius: 12px;
      padding: 1.5rem;
      transition: all 0.3s;
    }

    .upgrade-card:hover {
      border-color: #007bff;
      box-shadow: 0 4px 12px rgba(0, 123, 255, 0.15);
    }

    .upgrade-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.75rem;
    }

    .upgrade-header h3 {
      margin: 0;
      color: #333;
      font-size: 1.3rem;
    }

    .owned-count {
      background: #f0f0f0;
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.9rem;
      color: #666;
      font-weight: 600;
    }

    .description {
      color: #666;
      margin: 0 0 1rem 0;
      font-size: 0.95rem;
      line-height: 1.4;
    }

    .stats {
      display: flex;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .stat {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .stat .label {
      font-size: 0.85rem;
      color: #999;
      text-transform: uppercase;
      font-weight: 600;
    }

    .stat .value {
      font-size: 1.1rem;
      font-weight: 700;
      color: #333;
    }

    .stat .value.cost {
      color: #007bff;
    }

    .insufficient-funds {
      background: #fff3cd;
      border: 1px solid #ffc107;
      color: #856404;
      padding: 0.5rem;
      border-radius: 6px;
      text-align: center;
      font-size: 0.9rem;
      font-weight: 600;
      margin-bottom: 0.75rem;
    }

    .buy-btn {
      width: 100%;
      padding: 0.75rem;
      background: #28a745;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s;
    }

    .buy-btn:hover:not(:disabled) {
      background: #218838;
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(40, 167, 69, 0.3);
    }

    .buy-btn:active:not(:disabled) {
      transform: translateY(0);
    }

    .buy-btn:disabled {
      background: #6c757d;
      color: #adb5bd;
      cursor: not-allowed;
      opacity: 0.6;
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
export class ShopPage {
  upgrades = signal<Upgrade[]>(UPGRADES.map(u => ({ ...u })));
  money = signal(0);
  incomePerSecond = signal(0);

  getCurrentCost(upgrade: Upgrade): number {
    return Math.round(upgrade.baseCost * Math.pow(1.15, upgrade.count));
  }

  canBuy(upgrade: Upgrade): boolean {
    return this.money() >= this.getCurrentCost(upgrade);
  }

  buyUpgrade(upgrade: Upgrade): void {
    const currentCost = this.getCurrentCost(upgrade);
    
    // Vérifier si le joueur a assez d'argent
    if (this.money() >= currentCost) {
      // Déduire le coût
      this.money.update(current => current - currentCost);
      
      // Augmenter le count de l'upgrade
      upgrade.count += 1;
      
      // Augmenter le revenu passif
      this.incomePerSecond.update(current => current + upgrade.incomePerSecondGain);
      
      // Mettre à jour le signal pour déclencher le re-render
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
