import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { GameStore } from '../store/game.store';
import { formatNumber } from '../utils/formatNumber';
import { UserButtonComponent } from './user-button.component';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, UserButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav class="navbar">
      <div class="navbar-container">
        <h2 class="navbar-title">💼 Startup Tycoon</h2>
        
        <div class="navbar-stats">
          <div class="stat-item">
            <span class="stat-icon">💰</span>
            <span class="stat-value">{{ formatNumber(money()) }}$</span>
          </div>
          <div class="stat-item">
            <span class="stat-icon">📈</span>
            <span class="stat-value">{{ formatNumber(incomePerSecond()) }}$/sec</span>
          </div>
        </div>

        <ul class="navbar-menu">
          <li><a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}">Solo</a></li>
          <li><a routerLink="/multi" routerLinkActive="active">Multi</a></li>
          <li><a routerLink="/shop" routerLinkActive="active">Shop</a></li>
          <li><a routerLink="/leaderboard" routerLinkActive="active">Leaderboard</a></li>
          <li><a routerLink="/stats" routerLinkActive="active">Stats</a></li>
          <li><a routerLink="/settings" routerLinkActive="active">Settings</a></li>
        </ul>

        <app-user-button />
      </div>
    </nav>
  `,
  styles: [`
    .navbar {
      background-color: #2c3e50;
      color: white;
      padding: 1rem 0;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .navbar-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 2rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 2rem;
    }

    .navbar-title {
      margin: 0;
      font-size: 1.5rem;
      font-weight: bold;
      white-space: nowrap;
    }

    .navbar-stats {
      display: flex;
      gap: 2rem;
      flex: 0 0 auto;
    }

    .stat-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      background-color: rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      font-weight: 600;
    }

    .stat-icon {
      font-size: 1.2rem;
    }

    .stat-value {
      font-size: 1rem;
      color: #ffd700;
    }

    .navbar-menu {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      gap: 1rem;
      margin-left: auto;
    }

    .navbar-menu a {
      color: white;
      text-decoration: none;
      font-size: 1rem;
      padding: 0.5rem 1rem;
      border-radius: 4px;
      transition: background-color 0.3s;

      &:hover {
        background-color: rgba(255, 255, 255, 0.1);
      }

      &.active {
        background-color: #3498db;
      }
    }
  `]
})
export class NavbarComponent {
  private store = inject(GameStore);

  money = this.store.money;
  incomePerSecond = this.store.incomePerSecond;

  // Exposer formatNumber au template
  formatNumber = formatNumber;
}
