import { Component, signal, OnInit, OnDestroy } from '@angular/core';
import { GameHeader } from '../components/game-header.component';
import { ClickButton } from '../components/click-button.component';

@Component({
  selector: 'app-game',
  standalone: true,
  imports: [GameHeader, ClickButton],
  template: `
    <div class="page-container">
      <app-game-header [money]="money()" [incomePerSecond]="incomePerSecond()" />
      
      <div class="game-content">
        <app-click-button 
          [clickValue]="clickValue()" 
          (onClick)="handleClick()"
        />
      </div>

      <div class="test-controls">
        <h3>🔧 Contrôles de test (temporaire)</h3>
        <div class="buttons">
          <button class="test-btn" (click)="increaseIncome()">+1 income/sec</button>
          <button class="test-btn reset" (click)="resetIncome()">Reset income/sec</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-container {
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
    }

    .game-content {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 400px;
    }

    .test-controls {
      margin-top: 3rem;
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

    .test-controls .buttons {
      display: flex;
      gap: 1rem;
      justify-content: center;
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

    .test-btn.reset {
      border-color: #dc3545;
      color: #dc3545;
    }

    .test-btn.reset:hover {
      background: #dc3545;
      color: white;
    }
  `]
})
export class GamePage implements OnInit, OnDestroy {
  money = signal(0);
  clickValue = signal(1);
  incomePerSecond = signal(0);

  private intervalId?: number;

  ngOnInit(): void {
    this.intervalId = window.setInterval(() => {
      this.money.update(current => current + this.incomePerSecond());
    }, 1000);
  }

  ngOnDestroy(): void {
    if (this.intervalId !== undefined) {
      clearInterval(this.intervalId);
    }
  }

  handleClick(): void {
    this.money.update(current => current + this.clickValue());
  }

  increaseIncome(): void {
    this.incomePerSecond.update(current => current + 1);
  }

  resetIncome(): void {
    this.incomePerSecond.set(0);
  }
}
