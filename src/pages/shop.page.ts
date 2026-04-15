import { Component, signal } from '@angular/core';
import { UPGRADES } from '../data/upgrades.data';
import { Upgrade } from '../models/upgrade.model';

@Component({
  selector: 'app-shop',
  standalone: true,
  template: `
    <div class="page-container">
      <h1>🛒 Shop</h1>
      <p class="page-objective">Achetez des upgrades pour augmenter votre revenu passif !</p>

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

            <button class="buy-btn" (click)="buyUpgrade(upgrade)">
              Acheter
            </button>
          </div>
        }
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
      margin-bottom: 0.5rem;
    }

    .page-objective {
      font-size: 1.1rem;
      color: #666;
      margin-bottom: 2rem;
    }

    .upgrades-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.5rem;
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

    .buy-btn:hover {
      background: #218838;
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(40, 167, 69, 0.3);
    }

    .buy-btn:active {
      transform: translateY(0);
    }
  `]
})
export class ShopPage {
  upgrades = signal<Upgrade[]>(UPGRADES.map(u => ({ ...u })));

  getCurrentCost(upgrade: Upgrade): number {
    return Math.round(upgrade.baseCost * Math.pow(1.15, upgrade.count));
  }

  buyUpgrade(upgrade: Upgrade): void {
    // Logique d'achat implémentée dans les prochaines parties
    console.log('Achat de:', upgrade.name);
  }
}
