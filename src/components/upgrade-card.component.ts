import { Component, Input, Output, EventEmitter, DoCheck } from '@angular/core';
import { Upgrade } from '../models/upgrade.model';

@Component({
  selector: 'app-upgrade-card',
  standalone: true,
  template: `
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
          <span class="value cost">{{ currentCost }}$</span>
        </div>
      </div>

      @if (!canBuy) {
        <div class="insufficient-funds">
          💰 Fonds insuffisants
        </div>
      }

      <button 
        class="buy-btn" 
        [disabled]="!canBuy"
        (click)="handleBuy()"
      >
        Acheter
      </button>
    </div>
  `,
  styles: [`
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
  `]
})
export class UpgradeCard implements DoCheck {
  @Input({ required: true }) upgrade!: Upgrade;
  @Input({ required: true }) currentCost!: number;
  @Input({ required: true }) canBuy!: boolean;
  @Output() onBuy = new EventEmitter<Upgrade>();

  private renderCount = 0;

  // 🔍 TP11 Partie 2: Instrumentation re-renders
  ngDoCheck(): void {
    this.renderCount++;
    console.log(`[UPGRADE-CARD] ${this.upgrade?.name || '?'} - Re-render #${this.renderCount}`);
  }

  handleBuy(): void {
    if (this.canBuy) {
      this.onBuy.emit(this.upgrade);
    }
  }
}
