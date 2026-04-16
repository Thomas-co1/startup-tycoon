import { Component, inject, signal } from '@angular/core';
import { GameStore } from '../store/game.store';
import { StorageService } from '../services/storage.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  template: `
    <div class="page-container">
      <h1>⚙️ Settings</h1>
      <p class="page-objective">Configuration et gestion de votre partie.</p>

      <div class="settings-section">
        <h2>💾 Sauvegarde</h2>
        
        <div class="info-box">
          @if (lastSaved()) {
            <p class="info-label">Dernière sauvegarde :</p>
            <p class="info-value">{{ lastSaved() }}</p>
          } @else {
            <p class="info-value">Aucune sauvegarde disponible</p>
          }
        </div>

        <div class="action-box">
          <h3>🗑️ Réinitialiser la sauvegarde</h3>
          <p class="warning-text">
            ⚠️ Cette action est <strong>irréversible</strong>. Vous perdrez toute votre progression :
            argent, upgrades, statistiques.
          </p>
          <button class="btn-danger" (click)="resetSave()">
            Reset Save
          </button>
        </div>
      </div>

      <div class="settings-section">
        <h2>📊 Statistiques de la session</h2>
        <div class="stats-grid">
          <div class="stat-card">
            <span class="stat-icon">💰</span>
            <span class="stat-label">Argent actuel</span>
            <span class="stat-value">{{ store.money() }}$</span>
          </div>
          <div class="stat-card">
            <span class="stat-icon">📈</span>
            <span class="stat-label">Revenu/sec</span>
            <span class="stat-value">{{ store.incomePerSecond() }}$/sec</span>
          </div>
          <div class="stat-card">
            <span class="stat-icon">🎯</span>
            <span class="stat-label">Total clics</span>
            <span class="stat-value">{{ store.totalClicks() }}</span>
          </div>
          <div class="stat-card">
            <span class="stat-icon">💎</span>
            <span class="stat-label">Total gagné</span>
            <span class="stat-value">{{ store.totalEarned() }}$</span>
          </div>
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

    h1 {
      color: #333;
      margin-bottom: 0.5rem;
    }

    .page-objective {
      font-size: 1.1rem;
      color: #666;
      margin-bottom: 2rem;
    }

    .settings-section {
      background: white;
      padding: 2rem;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      margin-bottom: 2rem;
    }

    .settings-section h2 {
      color: #2c3e50;
      margin: 0 0 1.5rem 0;
      font-size: 1.5rem;
    }

    .settings-section h3 {
      color: #34495e;
      margin: 0 0 0.75rem 0;
      font-size: 1.2rem;
    }

    .info-box {
      background: #f8f9fa;
      padding: 1.5rem;
      border-radius: 8px;
      margin-bottom: 1.5rem;
    }

    .info-label {
      font-size: 0.9rem;
      color: #6c757d;
      margin: 0 0 0.5rem 0;
      text-transform: uppercase;
      font-weight: 600;
    }

    .info-value {
      font-size: 1.1rem;
      color: #2c3e50;
      margin: 0;
      font-weight: 600;
    }

    .action-box {
      background: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 1.5rem;
      border-radius: 8px;
    }

    .warning-text {
      color: #856404;
      margin: 0.5rem 0 1rem 0;
      line-height: 1.5;
    }

    .btn-danger {
      background: #dc3545;
      color: white;
      border: none;
      padding: 0.75rem 2rem;
      border-radius: 6px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s;
    }

    .btn-danger:hover {
      background: #c82333;
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(220, 53, 69, 0.3);
    }

    .btn-danger:active {
      transform: translateY(0);
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }

    .stat-card {
      background: #f8f9fa;
      padding: 1.5rem;
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 0.5rem;
    }

    .stat-icon {
      font-size: 2rem;
    }

    .stat-label {
      font-size: 0.85rem;
      color: #6c757d;
      text-transform: uppercase;
      font-weight: 600;
    }

    .stat-value {
      font-size: 1.5rem;
      color: #2c3e50;
      font-weight: 700;
    }
  `]
})
export class SettingsPage {
  store = inject(GameStore);
  private storageService = inject(StorageService);

  lastSaved = signal<string | null>(null);

  constructor() {
    this.updateLastSaved();
  }

  /**
   * Met à jour l'affichage de la dernière sauvegarde
   */
  private updateLastSaved(): void {
    const lastSavedDate = this.storageService.getLastSavedDate();
    if (lastSavedDate) {
      this.lastSaved.set(lastSavedDate.toLocaleString('fr-FR'));
    } else {
      this.lastSaved.set(null);
    }
  }

  /**
   * Réinitialise la sauvegarde avec confirmation
   */
  resetSave(): void {
    const confirmed = confirm(
      '⚠️ Êtes-vous sûr de vouloir effacer votre sauvegarde ?\n\n' +
      'Vous perdrez :\n' +
      `• ${this.store.money()}$ d'argent\n` +
      `• ${this.store.upgrades().length} upgrades\n` +
      `• ${this.store.totalClicks()} clics effectués\n` +
      `• ${this.store.totalEarned()}$ gagnés au total\n\n` +
      'Cette action est IRRÉVERSIBLE !'
    );

    if (confirmed) {
      // Effacer la sauvegarde dans localStorage
      this.storageService.clearSave();
      
      // Réinitialiser le store
      this.store.resetGame();
      
      // Mettre à jour l'affichage
      this.updateLastSaved();
      
      alert('✅ Sauvegarde effacée avec succès. Le jeu a été réinitialisé.');
    }
  }
}
