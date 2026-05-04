import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

interface PublicStats {
  totalEarned: number;
  totalClicks: number;
  incomePerSecond: number;
}

@Component({
  selector: 'app-public-stats',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="public-stats-container">
      <header class="stats-header">
        <h1>Startup Tycoon — Public Stats</h1>
        <p class="subtitle">Les statistiques publiques du jeu</p>
      </header>

      @if (loading()) {
        <div class="loading">Chargement des statistiques...</div>
      } @else if (error()) {
        <div class="error">{{ error() }}</div>
      } @else if (stats()) {
        <div class="stats-grid">
          <div class="stat-card total-earned">
            <div class="stat-icon">💰</div>
            <div class="stat-content">
              <h2 class="stat-label">Total Earned</h2>
              <p class="stat-value">{{ stats()!.totalEarned.toLocaleString('fr-FR') }} $</p>
            </div>
          </div>

          <div class="stat-card total-clicks">
            <div class="stat-icon">👆</div>
            <div class="stat-content">
              <h2 class="stat-label">Total Clicks</h2>
              <p class="stat-value">{{ stats()!.totalClicks.toLocaleString('fr-FR') }}</p>
            </div>
          </div>

          <div class="stat-card income-per-sec">
            <div class="stat-icon">📈</div>
            <div class="stat-content">
              <h2 class="stat-label">Income per Second</h2>
              <p class="stat-value">{{ stats()!.incomePerSecond.toLocaleString('fr-FR') }} $ /s</p>
            </div>
          </div>
        </div>

        <div class="info-box">
          <p>
            <strong>🎮 À propos de Startup Tycoon</strong><br />
            Startup Tycoon est un jeu de clicker incrémental où tu construis ton empire entrepreneurial.
            Clique pour gagner de l'argent, achète des améliorations et automatise tes revenus !
          </p>
        </div>
      }

      <footer class="stats-footer">
        <p>Données mises à jour en temps réel via SSR</p>
      </footer>
    </div>
  `,
  styles: [`
    .public-stats-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }

    .stats-header {
      text-align: center;
      margin-bottom: 3rem;
      padding: 2rem 0;
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

    .loading,
    .error {
      text-align: center;
      padding: 2rem;
      font-size: 1.2rem;
      color: #666;
    }

    .error {
      color: #e74c3c;
      background: #fadbd8;
      border-radius: 0.5rem;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 2rem;
      margin-bottom: 2rem;
    }

    .stat-card {
      background: white;
      border-radius: 1rem;
      padding: 2rem;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      display: flex;
      align-items: center;
      gap: 1.5rem;
      transition: transform 0.3s ease, box-shadow 0.3s ease;
    }

    .stat-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 8px 15px rgba(0, 0, 0, 0.15);
    }

    .stat-card.total-earned {
      border-left: 5px solid #f39c12;
    }

    .stat-card.total-clicks {
      border-left: 5px solid #3498db;
    }

    .stat-card.income-per-sec {
      border-left: 5px solid #2ecc71;
    }

    .stat-icon {
      font-size: 3rem;
      line-height: 1;
    }

    .stat-content {
      flex: 1;
    }

    .stat-label {
      font-size: 0.9rem;
      color: #7f8c8d;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin: 0 0 0.5rem 0;
      font-weight: 600;
    }

    .stat-value {
      font-size: 2rem;
      font-weight: 700;
      color: #2c3e50;
      margin: 0;
    }

    .info-box {
      background: #ecf0f1;
      border-radius: 0.5rem;
      padding: 1.5rem;
      margin-bottom: 2rem;
      border-left: 4px solid #3498db;
    }

    .info-box p {
      margin: 0;
      line-height: 1.6;
      color: #34495e;
    }

    .info-box strong {
      color: #2c3e50;
    }

    .stats-footer {
      text-align: center;
      padding-top: 2rem;
      border-top: 2px solid #ecf0f1;
      color: #95a5a6;
      font-size: 0.9rem;
    }

    .stats-footer p {
      margin: 0;
    }

    @media (max-width: 768px) {
      .stats-header h1 {
        font-size: 1.8rem;
      }

      .stats-grid {
        grid-template-columns: 1fr;
      }

      .stat-value {
        font-size: 1.5rem;
      }
    }
  `]
})
export class PublicStatsPage implements OnInit {
  stats = signal<PublicStats | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  async ngOnInit() {
    try {
      const response = await fetch('/public-stats.json');
      if (!response.ok) {
        throw new Error('Impossible de charger les statistiques');
      }
      const data = await response.json();
      this.stats.set(data);
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      this.loading.set(false);
    }
  }
}
