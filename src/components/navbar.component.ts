import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav class="navbar">
      <div class="navbar-container">
        <h2 class="navbar-title">Startup Tycoon</h2>
        <ul class="navbar-menu">
          <li><a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}">Game</a></li>
          <li><a routerLink="/shop" routerLinkActive="active">Shop</a></li>
          <li><a routerLink="/stats" routerLinkActive="active">Stats</a></li>
          <li><a routerLink="/settings" routerLinkActive="active">Settings</a></li>
        </ul>
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
    }

    .navbar-title {
      margin: 0;
      font-size: 1.5rem;
      font-weight: bold;
    }

    .navbar-menu {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      gap: 2rem;
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
export class NavbarComponent {}
