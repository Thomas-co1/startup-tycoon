import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LeaderboardService } from '../services/leaderboard.service';

@Component({
  selector: 'app-leaderboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="leaderboard-container">
      <header class="leaderboard-header">
        <h1>🏆 Leaderboard</h1>
        <p class="subtitle">Top 20 des meilleurs scores all-time</p>
      </header>

      @if (query.isLoading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Chargement du leaderboard...</p>
        </div>
      } @else if (query.isError()) {
        <div class="error-state">
          <p class="error-icon">❌</p>
          <p class="error-message">{{ query.error().message || 'Erreur lors du chargement' }}</p>
          <button class="retry-btn" (click)="query.refetch()">Réessayer</button>
        </div>
      } @else if (query.data()) {
        <div class="leaderboard-content">
          @if (query.isFetching()) {
            <div class="refetching-indicator">🔄 Mise à jour...</div>
          }

          <div class="leaderboard-table">
            <div class="table-header">
              <div class="col-rank">Rang</div>
              <div class="col-player">Joueur</div>
              <div class="col-score">Score</div>
              <div class="col-date">Date</div>
            </div>

            @for (entry of query.data(); track entry._id) {
              <div class="table-row" [class.top-3]="entry.rank! <= 3">
                <div class="col-rank">
                  @if (entry.rank === 1) {
                    <span class="medal">🥇</span>
                  } @else if (entry.rank === 2) {
                    <span class="medal">🥈</span>
                  } @else if (entry.rank === 3) {
                    <span class="medal">🥉</span>
                  } @else {
                    <span class="rank-number">#{{ entry.rank }}</span>
                  }
                </div>
                <div class="col-player">
                  {{ entry.username || 'Joueur ' + entry.userId.slice(0, 8) }}
                </div>
                <div class="col-score">
                  {{ formatScore(entry.score) }}
                </div>
                <div class="col-date">
                  {{ formatDate(entry.createdAt) }}
                </div>
              </div>
            }
          </div>

          @if (query.data()!.length === 0) {
            <div class="empty-state">
              <p>🎮 Aucun score enregistré pour le moment</p>
              <p class="empty-subtitle">Soyez le premier à terminer une partie !</p>
            </div>
          }
        </div>
      }

      <div class="info-box">
        <p>
          💡 <strong>Info :</strong> Le leaderboard se met à jour automatiquement toutes les 30 secondes.
          Seuls les scores des parties <strong>solo terminées</strong> (5 minutes) sont comptabilisés.
        </p>
      </div>
    </div>
  `,
  styles: [`
    .leaderboard-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
    }

    .leaderboard-header {
      text-align: center;
      margin-bottom: 2rem;
      padding: 2rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-radius: 1rem;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
    }

    .leaderboard-header h1 {
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

    .leaderboard-table {
      background: white;
      border-radius: 1rem;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    .table-header,
    .table-row {
      display: grid;
      grid-template-columns: 80px 1fr 150px 150px;
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
      border-bottom: 2px solid #dee2e6;
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

    .table-row.top-3 {
      background: linear-gradient(to right, #fff9e6 0%, white 100%);
    }

    .table-row.top-3:hover {
      background: linear-gradient(to right, #fff3d0 0%, #f8f9fa 100%);
    }

    .col-rank {
      text-align: center;
      font-weight: 700;
    }

    .medal {
      font-size: 1.8rem;
    }

    .rank-number {
      font-size: 1.2rem;
      color: #6c757d;
    }

    .col-player {
      font-weight: 600;
      color: #2c3e50;
    }

    .col-score {
      font-size: 1.2rem;
      font-weight: 700;
      color: #667eea;
    }

    .col-date {
      color: #6c757d;
      font-size: 0.9rem;
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

    .info-box {
      margin-top: 2rem;
      padding: 1.5rem;
      background: #e3f2fd;
      border-left: 4px solid #1976d2;
      border-radius: 0.5rem;
    }

    .info-box p {
      margin: 0;
      line-height: 1.6;
      color: #0d47a1;
    }

    @media (max-width: 768px) {
      .table-header,
      .table-row {
        grid-template-columns: 60px 1fr 100px 100px;
        font-size: 0.85rem;
        padding: 0.75rem;
      }

      .leaderboard-header h1 {
        font-size: 1.8rem;
      }

      .medal {
        font-size: 1.3rem;
      }

      .col-score {
        font-size: 1rem;
      }
    }
  `]
})
export class LeaderboardPage {
  private leaderboardService = inject(LeaderboardService);

  // Query TanStack pour le leaderboard
  query = this.leaderboardService.useLeaderboard();

  /**
   * Formate un score avec séparateurs de milliers
   */
  formatScore(score: number): string {
    return score.toLocaleString('fr-FR') + ' $';
  }

  /**
   * Formate une date ISO en format lisible
   */
  formatDate(isoDate: string): string {
    const date = new Date(isoDate);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;

    return date.toLocaleDateString('fr-FR', { 
      day: '2-digit', 
      month: 'short',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  }
}
