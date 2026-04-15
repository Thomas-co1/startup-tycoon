import { Component, signal } from '@angular/core';
import { GameHeader } from '../components/game-header.component';
import { ClickButton } from '../components/click-button.component';

@Component({
  selector: 'app-game',
  standalone: true,
  imports: [GameHeader, ClickButton],
  template: `
    <div class="page-container">
      <app-game-header [money]="money()" />
      
      <div class="game-content">
        <app-click-button 
          [clickValue]="clickValue()" 
          (onClick)="handleClick()"
        />
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
  `]
})
export class GamePage {
  money = signal(0);
  clickValue = signal(1);

  handleClick(): void {
    this.money.update(current => current + this.clickValue());
  }
}
