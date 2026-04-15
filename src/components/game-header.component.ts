import { Component, Input } from '@angular/core';
import { MoneyDisplay } from './moneyDisplay.component';

@Component({
  selector: 'app-game-header',
  standalone: true,
  imports: [MoneyDisplay],
  template: `
    <header class="game-header">
      <h1 class="game-title">Startup Tycoon</h1>
      <div class="stats-container">
        <app-money-display [money]="money" />
        <div class="income-placeholder">
          <span class="label">Income:</span>
          <span class="value">$0/s</span>
        </div>
      </div>
    </header>
  `,
  styles: [`
    .game-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 2rem;
      border-radius: 12px;
      margin-bottom: 2rem;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
    }

    .game-title {
      margin: 0 0 1.5rem 0;
      font-size: 2.5rem;
      text-align: center;
      text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
    }

    .stats-container {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 3rem;
      flex-wrap: wrap;
    }

    .income-placeholder {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 1rem;
      font-size: 1.5rem;
      font-weight: 600;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 8px;
    }

    .income-placeholder .label {
      color: rgba(255, 255, 255, 0.8);
    }

    .income-placeholder .value {
      color: #ffd700;
      font-size: 2rem;
    }

    :host ::ng-deep app-money-display .money-display {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 8px;
    }

    :host ::ng-deep app-money-display .label {
      color: rgba(255, 255, 255, 0.8);
    }

    :host ::ng-deep app-money-display .amount {
      color: #4ade80;
    }
  `]
})
export class GameHeader {
  @Input() money!: number;
}
