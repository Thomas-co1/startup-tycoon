import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ClerkService } from '../services/clerk.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="home-container">
      <div class="hero-section">
        <h1 class="title">🚀 Startup Tycoon</h1>
        <p class="subtitle">Le jeu de clicker incrémental compétitif</p>
        <p class="version">v2.0 — Multijoueur Edition</p>
      </div>

      <div class="mode-selection">
        <div class="mode-card solo-card" (click)="startSoloGame()">
          <div class="mode-icon">🎮</div>
          <h2>Partie Solo</h2>
          <p class="mode-description">
            Jouez hors-ligne avec les règles classiques.
          </p>
          <button class="start-btn solo-btn">Jouer en Solo</button>
        </div>

        <div 
          class="mode-card multi-card" 
          [class.disabled]="!clerkService.user()" 
          [title]="clerkService.user() ? 'Lancer une partie multijoueur' : 'Connexion requise pour le mode multijoueur'"
          (click)="startMultiGame()">
          <div class="mode-icon">🌐</div>
          <h2>Partie Multi</h2>
          <p class="mode-description">
            Affrontez des joueurs en temps réel. (À venir TP14)
          </p>
          <button 
            class="start-btn multi-btn" 
            [disabled]="!clerkService.user()">
            @if (clerkService.user()) {
              Jouer en Multi
            } @else {
              🔒 Se connecter pour jouer
            }
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .home-container {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 40px 20px;
    }

    .hero-section {
      text-align: center;
      color: white;
      margin-bottom: 50px;
    }

    .title {
      font-size: 3rem;
      font-weight: 800;
      margin: 0 0 10px 0;
      text-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
    }

    .subtitle {
      font-size: 1.3rem;
      margin: 0;
      opacity: 0.95;
    }

    .version {
      font-size: 0.9rem;
      margin-top: 10px;
      opacity: 0.8;
    }

    .mode-selection {
      display: flex;
      gap: 30px;
      flex-wrap: wrap;
      justify-content: center;
      max-width: 900px;
    }

    .mode-card {
      background: white;
      border-radius: 16px;
      padding: 40px 30px;
      width: 320px;
      text-align: center;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
      transition: transform 0.3s, box-shadow 0.3s;
      cursor: pointer;
    }

    .mode-card:hover:not(.disabled) {
      transform: translateY(-8px);
      box-shadow: 0 15px 40px rgba(0, 0, 0, 0.3);
    }

    .mode-card.disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .mode-icon {
      font-size: 4rem;
      margin-bottom: 20px;
    }

    .mode-card h2 {
      font-size: 1.8rem;
      margin: 0 0 15px 0;
      color: #333;
    }

    .mode-description {
      color: #666;
      font-size: 1rem;
      margin-bottom: 30px;
      line-height: 1.5;
    }

    .start-btn {
      width: 100%;
      padding: 16px 24px;
      font-size: 1.1rem;
      font-weight: 600;
      border: none;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.3s;
    }

    .solo-btn {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .solo-btn:hover {
      transform: scale(1.05);
      box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
    }

    .multi-btn {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .multi-btn:disabled {
      background: #e0e0e0;
      color: #999;
      cursor: not-allowed;
    }
  `]
})
export class HomePage {
  private router = inject(Router);
  public clerkService = inject(ClerkService);

  startSoloGame(): void {
    this.router.navigate(['/game']);
  }

  startMultiGame(): void {
    if (!this.clerkService.user()) {
      this.router.navigate(['/sign-in']);
      return;
    }
    alert('Mode multijoueur à venir dans TP14!');
  }
}
