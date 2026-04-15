import { Component, Input } from '@angular/core';
import { formatNumber } from '../utils/formatNumber';

@Component({
  selector: 'app-money-display',
  standalone: true,
  template: `
    <div class="money-display">
      <span class="label">Money:</span>
      <span class="amount">\${{ formattedMoney }}</span>
    </div>
  `,
  styles: [`
    .money-display {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 1rem;
      font-size: 1.5rem;
      font-weight: 600;
    }

    .label {
      color: #555;
    }

    .amount {
      color: #27ae60;
      font-size: 2rem;
    }
  `]
})
export class MoneyDisplay {
  @Input() money!: number;

  get formattedMoney(): string {
    return formatNumber(this.money);
  }
}

