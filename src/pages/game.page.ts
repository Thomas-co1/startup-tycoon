import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { GameHeader } from '../components/game-header.component';
import { ClickButton } from '../components/click-button.component';
import { GameStore } from '../store/game.store';
import { GameActions } from '../state/game.actions';
import { GamesService } from '../services/games.service';
import { ClerkService } from '../services/clerk.service';

@Component({
  selector: 'app-game',
  standalone: true,
  imports: [GameHeader, ClickButton, CommonModule],
  template: `
    <div class="page-container">
      <!-- Timer de partie -->
      <div class="timer-bar">
        <div class="timer-content">
          <span class="timer-label">⏱️ Temps écoulé:</span>
          <span class="timer-value">{{ formatTime(elapsedTime()) }}</span>
          <span class="timer-max">/ 5:00</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" [style.width.%]="getProgress()"></div>
        </div>
      </div>

      @if (!gameEnded()) {
        <!-- Jeu en cours -->
        <app-game-header [money]="money()" [incomePerSecond]="incomePerSecond()" />
        
        <div class="game-content">
          <app-click-button 
            [clickValue]="clickValue()" 
            (onClick)="handleClick()"
          />
        </div>

        <div class="game-info">
          <p>💡 La partie se termine automatiquement après 5 minutes</p>
          <p>Votre score sera enregistré si vous êtes connecté</p>
        </div>
      } @else {
        <!-- Écran de fin de partie -->
        <div class="game-over-screen">
          <div class="game-over-card">
            <h2>🎉 Partie terminée !</h2>
            
            <div class="final-stats">
              <div class="stat-item">
                <span class="stat-label">Score final</span>
                <span class="stat-value">{{ money().toLocaleString('fr-FR') }} $</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Durée</span>
                <span class="stat-value">{{ formatTime(elapsedTime()) }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Clics totaux</span>
                <span class="stat-value">{{ totalClicks().toLocaleString('fr-FR') }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Revenu/sec</span>
                <span class="stat-value">{{ incomePerSecond() }} $ /s</span>
              </div>
            </div>

            @if (submitMutation.isPending()) {
              <div class="submit-status submitting">
                <div class="spinner-small"></div>
                <p>Enregistrement du score...</p>
              </div>
            } @else if (submitMutation.isError()) {
              <div class="submit-status error">
                <p>❌ Erreur lors de l'enregistrement</p>
                <button class="retry-btn" (click)="retrySubmit()">Réessayer</button>
              </div>
            } @else if (submitMutation.isSuccess()) {
              <div class="submit-status success">
                <p>✅ Score enregistré avec succès !</p>
              </div>
            } @else if (!clerkService.user()) {
              <div class="submit-status not-logged">
                <p>⚠️ Non connecté - score non enregistré</p>
                <p class="hint">Connectez-vous pour sauvegarder vos scores</p>
              </div>
            }

            <div class="action-buttons">
              <button class="btn-primary" (click)="playAgain()">Rejouer</button>
              <button class="btn-secondary" (click)="goToStats()">Voir mes stats</button>
              <button class="btn-secondary" (click)="goToLeaderboard()">Leaderboard</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .page-container {
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
    }

    .timer-bar {
      background: white;
      padding: 1rem;
      border-radius: 1rem;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      margin-bottom: 2rem;
    }

    .timer-content {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.75rem;
    }

    .timer-label {
      font-size: 1rem;
      color: #6c757d;
    }

    .timer-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: #667eea;
    }

    .timer-max {
      font-size: 1rem;
      color: #adb5bd;
    }

    .progress-bar {
      height: 8px;
      background: #e9ecef;
      border-radius: 4px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
      transition: width 0.3s ease;
    }

    .game-content {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 400px;
    }

    .game-info {
      text-align: center;
      margin-top: 2rem;
      padding: 1rem;
      background: #e3f2fd;
      border-radius: 0.5rem;
      color: #1976d2;
    }

    .game-info p {
      margin: 0.25rem 0;
    }

    .game-over-screen {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 500px;
    }

    .game-over-card {
      background: white;
      padding: 3rem;
      border-radius: 1.5rem;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
      text-align: center;
      max-width: 600px;
      width: 100%;
    }

    .game-over-card h2 {
      font-size: 2.5rem;
      margin: 0 0 2rem 0;
      color: #2c3e50;
    }

    .final-stats {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .stat-item {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .stat-label {
      font-size: 0.9rem;
      color: #6c757d;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .stat-value {
      font-size: 1.8rem;
      font-weight: 700;
      color: #667eea;
    }

    .submit-status {
      padding: 1rem;
      border-radius: 0.5rem;
      margin-bottom: 2rem;
    }

    .submit-status.submitting {
      background: #e3f2fd;
      color: #1976d2;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
    }

    .submit-status.success {
      background: #e8f5e9;
      color: #2e7d32;
    }

    .submit-status.error {
      background: #ffebee;
      color: #c62828;
    }

    .submit-status.not-logged {
      background: #fff3e0;
      color: #e65100;
    }

    .submit-status p {
      margin: 0;
    }

    .hint {
      font-size: 0.9rem;
      margin-top: 0.5rem !important;
    }

    .spinner-small {
      width: 20px;
      height: 20px;
      border: 3px solid #bbdefb;
      border-top: 3px solid #1976d2;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .retry-btn {
      margin-top: 0.5rem;
      padding: 0.5rem 1rem;
      background: #c62828;
      color: white;
      border: none;
      border-radius: 0.25rem;
      cursor: pointer;
    }

    .action-buttons {
      display: flex;
      gap: 1rem;
      justify-content: center;
      flex-wrap: wrap;
    }

    .btn-primary,
    .btn-secondary {
      padding: 0.75rem 2rem;
      border: none;
      border-radius: 0.5rem;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s;
    }

    .btn-primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 15px rgba(102, 126, 234, 0.3);
    }

    .btn-secondary {
      background: #f8f9fa;
      color: #495057;
      border: 2px solid #dee2e6;
    }

    .btn-secondary:hover {
      background: #e9ecef;
    }

    @media (max-width: 768px) {
      .final-stats {
        grid-template-columns: 1fr;
      }

      .game-over-card {
        padding: 2rem 1.5rem;
      }

      .action-buttons {
        flex-direction: column;
      }

      .btn-primary,
      .btn-secondary {
        width: 100%;
      }
    }
  `]
})
export class GamePage implements OnInit, OnDestroy {
  private store = inject(GameStore);
  private router = inject(Router);
  private gamesService = inject(GamesService);
  clerkService = inject(ClerkService);

  // Signals du store
  money = this.store.money;
  clickValue = this.store.clickValue;
  incomePerSecond = this.store.incomePerSecond;
  totalClicks = this.store.totalClicks;

  // Timer de partie
  elapsedTime = signal(0);
  gameEnded = signal(false);
  private timerIntervalId?: number;
  private readonly GAME_DURATION = 300; // 5 minutes = 300 secondes

  // Mutation pour soumettre le score
  submitMutation = this.gamesService.useSubmitGame();

  ngOnInit() {
    // Démarrer le timer de partie
    this.startGameTimer();
  }

  ngOnDestroy() {
    // Nettoyer le timer
    if (this.timerIntervalId) {
      clearInterval(this.timerIntervalId);
    }
  }

  /**
   * Démarre le timer de partie (5 minutes)
   */
  private startGameTimer() {
    this.timerIntervalId = window.setInterval(() => {
      const currentTime = this.elapsedTime() + 1;
      this.elapsedTime.set(currentTime);

      // Vérifier si la partie est terminée (5 minutes écoulées)
      if (currentTime >= this.GAME_DURATION) {
        this.endGame();
      }
    }, 1000);
  }

  /**
   * Termine la partie et soumet le score
   */
  private endGame() {
    // Arrêter le timer
    if (this.timerIntervalId) {
      clearInterval(this.timerIntervalId);
    }

    // Marquer la partie comme terminée
    this.gameEnded.set(true);

    // Soumettre le score si l'utilisateur est connecté
    if (this.clerkService.user()) {
      this.submitScore();
    }
  }

  /**
   * Soumet le score au serveur
   */
  private submitScore() {
    const gameData = {
      mode: 'solo' as const,
      score: this.money(),
      duration: this.elapsedTime(),
      clicks: this.totalClicks(),
      upgrades: this.store.upgrades().filter(u => u.count > 0).map(u => u.id),
    };

    this.submitMutation.mutate(gameData);
  }

  /**
   * Réessayer la soumission en cas d'erreur
   */
  retrySubmit() {
    this.submitScore();
  }

  /**
   * Gérer le clic
   */
  handleClick(): void {
    if (!this.gameEnded()) {
      this.store.dispatch(GameActions.click());
    }
  }

  /**
   * Recommencer une partie
   */
  playAgain() {
    // Reset le state du jeu
    this.store.dispatch(GameActions.resetGame());
    
    // Reset le timer
    this.elapsedTime.set(0);
    this.gameEnded.set(false);
    
    // Redémarrer le timer
    this.startGameTimer();
  }

  /**
   * Aller à la page stats
   */
  goToStats() {
    this.router.navigate(['/stats']);
  }

  /**
   * Aller au leaderboard
   */
  goToLeaderboard() {
    this.router.navigate(['/leaderboard']);
  }

  /**
   * Formate le temps en MM:SS
   */
  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Calcule le pourcentage de progression
   */
  getProgress(): number {
    return (this.elapsedTime() / this.GAME_DURATION) * 100;
  }
}
