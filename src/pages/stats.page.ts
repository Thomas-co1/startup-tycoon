import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GamesService } from '../services/games.service';

@Component({
  selector: 'app-stats',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="stats-container">
      <header class="stats-header">
        <h1>📊 Mes Statistiques</h1>
        <p class="subtitle">Historique de vos parties terminées</p>
      </header>

      @if (query.isLoading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Chargement de votre historique...</p>
        </div>
      } @else if (query.isError()) {
        <div class="error-state">
          <p class="error-icon">❌</p>
          <p class="error-message">{{ query.error().message || 'Erreur lors du chargement' }}</p>
          <button class="retry-btn" (click)="query.refetch()">Réessayer</button>
        </div>
      } @else if (query.data()) {
        <div class="stats-content">
          @if (query.isFetching()) {
            <div class="refetching-indicator">🔄 Mise à jour...</div>
          }

          @if (query.data()!.length > 0) {
            <!-- Statistiques globales -->
            <div class="stats-overview">
              <div class="stat-card">
                <div class="stat-icon">🎮</div>
                <div class="stat-info">
                  <p class="stat-label">Parties jouées</p>
                  <p class="stat-value">{{ query.data()!.length }}</p>
                </div>
              </div>

              <div class="stat-card">
                <div class="stat-icon">🏆</div>
                <div class="stat-info">
                  <p class="stat-label">Meilleur score</p>
                  <p class="stat-value">{{ formatScore(getBestScore()) }}</p>
                </div>
              </div>

              <div class="stat-card">
                <div class="stat-icon">📈</div>
                <div class="stat-info">
                  <p class="stat-label">Score moyen</p>
                  <p class="stat-value">{{ formatScore(getAverageScore()) }}</p>
                </div>
              </div>

              <div class="stat-card">
                <div class="stat-icon">👆</div>
                <div class="stat-info">
                  <p class="stat-label">Total de clics</p>
                  <p class="stat-value">{{ getTotalClicks().toLocaleString('fr-FR') }}</p>
                </div>
              </div>
            </div>

            <!-- Historique des parties -->
            <div class="games-history">
              <h2>📜 Historique des parties</h2>
              
              <div class="games-table">
                <div class="table-header">
                  <div class="col-date">Date</div>
                  <div class="col-mode">Mode</div>
                  <div class="col-score">Score</div>
                  <div class="col-duration">Durée</div>
                  <div class="col-clicks">Clics</div>
                  <div class="col-upgrades">Upgrades</div>
                </div>

                @for (game of query.data(); track game._id) {
                  <div class="table-row" [class.best-score]="game.score === getBestScore()">
                    <div class="col-date">
                      {{ formatDate(game.createdAt) }}
                    </div>
                    <div class="col-mode">
                      @if (game.mode === 'solo') {
                        <span class="badge badge-solo">Solo</span>
                      } @else {
                        <span class="badge badge-multi">Multi</span>
                      }
                    </div>
                    <div class="col-score">
                      {{ formatScore(game.score) }}
                      @if (game.score === getBestScore()) {
                        <span class="best-indicator">🏆</span>
                      }
                    </div>
                    <div class="col-duration">
                      {{ formatDuration(game.duration) }}
                    </div>
                    <div class="col-clicks">
                      {{ game.clicks.toLocaleString('fr-FR') }}
                    </div>
                    <div class="col-upgrades">
                      {{ game.upgrades.length }}
                    </div>
                  </div>
                }
              </div>
            </div>
          } @else {
            <div class="empty-state">
              <p>🎮 Aucune partie terminée pour le moment</p>
              <p class="empty-subtitle">Jouez une partie solo de 5 minutes pour voir vos statistiques ici !</p>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .stats-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
    }

    .stats-header {
      text-align: center;
      margin-bottom: 2rem;
      padding: 2rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-radius: 1rem;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
    }

    .stats-header h1 {
      font-size: 2.5rem;
      margin: 0 0 0.5rem 0;
      font-weight: 700;
    }

    .subtitle {
      font-size: 1.1rem;
      opacity: 0.9;
      margin: 0;
    }

    .loading-state,
    .error-state {
      text-align: center;
      padding: 3rem 2rem;
    }

    .spinner {
      width: 50px;
      height: 50px;
      border: 4px solid #f3f3f3;
      border-top: 4px solid #667eea;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 1rem;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .error-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
    }

    .error-message {
      color: #e74c3c;
      font-size: 1.1rem;
      margin-bottom: 1rem;
    }

    .retry-btn {
      padding: 0.75rem 1.5rem;
      background: #667eea;
      color: white;
      border: none;
      border-radius: 0.5rem;
      font-size: 1rem;
      cursor: pointer;
      transition: background 0.3s;
    }

    .retry-btn:hover {
      background: #5568d3;
    }

    .refetching-indicator {
      text-align: center;
      padding: 0.5rem;
      background: #e3f2fd;
      border-radius: 0.5rem;
      margin-bottom: 1rem;
      font-size: 0.9rem;
      color: #1976d2;
    }

    .stats-overview {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .stat-card {
      background: white;
      padding: 1.5rem;
      border-radius: 1rem;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      display: flex;
      align-items: center;
      gap: 1rem;
      transition: transform 0.3s, box-shadow 0.3s;
    }

    .stat-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 8px 15px rgba(0, 0, 0, 0.15);
    }

    .stat-icon {
      font-size: 2.5rem;
    }

    .stat-info {
      flex: 1;
    }

    .stat-label {
      font-size: 0.85rem;
      color: #6c757d;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin: 0 0 0.25rem 0;
    }

    .stat-value {
      font-size: 1.8rem;
      font-weight: 700;
      color: #2c3e50;
      margin: 0;
    }

    .games-history {
      background: white;
      padding: 2rem;
      border-radius: 1rem;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    .games-history h2 {
      margin: 0 0 1.5rem 0;
      color: #2c3e50;
    }

    .games-table {
      overflow-x: auto;
    }

    .table-header,
    .table-row {
      display: grid;
      grid-template-columns: 150px 80px 120px 100px 100px 100px;
      padding: 1rem;
      align-items: center;
      gap: 1rem;
    }

    .table-header {
      background: #f8f9fa;
      font-weight: 700;
      text-transform: uppercase;
      font-size: 0.85rem;
      letter-spacing: 0.5px;
      color: #6c757d;
      border-radius: 0.5rem;
      margin-bottom: 0.5rem;
    }

    .table-row {
      border-bottom: 1px solid #f0f0f0;
      transition: background 0.3s;
    }

    .table-row:hover {
      background: #f8f9fa;
    }

    .table-row:last-child {
      border-bottom: none;
    }

    .table-row.best-score {
      background: linear-gradient(to right, #fff9e6 0%, white 100%);
    }

    .table-row.best-score:hover {
      background: linear-gradient(to right, #fff3d0 0%, #f8f9fa 100%);
    }

    .badge {
      padding: 0.25rem 0.75rem;
      border-radius: 1rem;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
    }

    .badge-solo {
      background: #e3f2fd;
      color: #1976d2;
    }

    .badge-multi {
      background: #f3e5f5;
      color: #7b1fa2;
    }

    .col-score {
      font-weight: 700;
      color: #667eea;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .best-indicator {
      font-size: 1.2rem;
    }

    .empty-state {
      text-align: center;
      padding: 3rem 2rem;
      color: #6c757d;
    }

    .empty-state p:first-child {
      font-size: 1.5rem;
      margin-bottom: 0.5rem;
    }

    .empty-subtitle {
      font-size: 1rem;
    }

    @media (max-width: 768px) {
      .table-header,
      .table-row {
        grid-template-columns: repeat(3, 1fr);
        font-size: 0.85rem;
      }

      .col-duration,
      .col-clicks,
      .col-upgrades {
        display: none;
      }

      .stats-overview {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class StatsPage {
  private gamesService = inject(GamesService);

  // Query TanStack pour l'historique des parties
  query = this.gamesService.useMyGames();

  /**
   * Obtient le meilleur score
   */
  getBestScore(): number {
    const games = this.query.data();
    if (!games || games.length === 0) return 0;
    return Math.max(...games.map(g => g.score));
  }

  /**
   * Calcule le score moyen
   */
  getAverageScore(): number {
    const games = this.query.data();
    if (!games || games.length === 0) return 0;
    const total = games.reduce((sum, g) => sum + g.score, 0);
    return Math.round(total / games.length);
  }

  /**
   * Calcule le total de clics
   */
  getTotalClicks(): number {
    const games = this.query.data();
    if (!games || games.length === 0) return 0;
    return games.reduce((sum, g) => sum + g.clicks, 0);
  }

  /**
   * Formate un score
   */
  formatScore(score: number): string {
    return score.toLocaleString('fr-FR') + ' $';
  }

  /**
   * Formate une durée en secondes
   */
  formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Formate une date
   */
  formatDate(isoDate: string): string {
    const date = new Date(isoDate);
    return date.toLocaleDateString('fr-FR', { 
      day: '2-digit', 
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
