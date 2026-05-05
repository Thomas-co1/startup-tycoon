// src/pages/multi.page.ts
// Page multijoueur temps réel avec WebSocket

import { Component, OnInit, OnDestroy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SocketService, PlayerSnapshot, PlayerState, HydratePayload, EventPayload } from '../lib/socket.service';
import { ClerkService } from '../services/clerk.service';
import { formatNumber } from '../utils/formatNumber';

interface GameEvent {
  id: string;
  eventType: string;
  targetUserId: string;
  targetName: string;
  mitigated: boolean;
  impact: number;
  source: string | null;
  timestamp: number;
}

@Component({
  selector: 'app-multi-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="multi-page">
      <!-- État de connexion -->
      <div class="connection-status" [class]="socketService.connectionState">
        @if (socketService.connectionState === 'connecting') {
          <span>🔄 Connexion en cours...</span>
        }
        @if (socketService.connectionState === 'connected') {
          <span>✅ Connecté</span>
        }
        @if (socketService.connectionState === 'disconnected') {
          <span>⚠️ Déconnecté - Reconnexion dans {{ socketService.reconnectCountdown }}s</span>
        }
        @if (socketService.connectionState === 'error') {
          <span>❌ Erreur de connexion</span>
        }
      </div>

      @if (socketService.connectionState === 'connected' && roundState()) {
        <!-- Header du round -->
        <div class="round-header">
          <h1>🎮 Mode Multijoueur</h1>
          <div class="round-info">
            <div class="round-id">Round: {{ roundState()!.roundId }}</div>
            <div class="timer" [class.urgent]="remainingSeconds() < 60">
              ⏱️ {{ formatTime(remainingSeconds()) }}
            </div>
          </div>
        </div>

        <!-- Mon état -->
        <div class="my-state">
          <h2>💼 Mon état</h2>
          <div class="stats-grid">
            <div class="stat">
              <span class="label">Argent</span>
              <span class="value">{{ formatNumber(myState()?.money || 0) }} $</span>
            </div>
            <div class="stat">
              <span class="label">Score</span>
              <span class="value">{{ formatNumber(myState()?.score || 0) }}</span>
            </div>
            <div class="stat">
              <span class="label">Clicks</span>
              <span class="value">{{ myState()?.clicks || 0 }}</span>
            </div>
            <div class="stat">
              <span class="label">Résilience</span>
              <span class="value">{{ myState()?.resilience || 0 }}</span>
            </div>
          </div>

          <!-- Actions -->
          <div class="actions">
            <button 
              class="action-btn primary" 
              (click)="handleClick()"
              [disabled]="actionPending()">
              👆 Cliquer
            </button>
            <button 
              class="action-btn secondary" 
              (click)="handleBuy('DEV_JUNIOR')"
              [disabled]="actionPending()">
              💻 Dev Junior (100$)
            </button>
            <button 
              class="action-btn secondary" 
              (click)="handleBuy('RESILIENCE_1')"
              [disabled]="actionPending()">
              🛡️ Résilience +1 (200$)
            </button>
          </div>

          @if (actionError()) {
            <div class="action-error">❌ {{ actionError() }}</div>
          }
        </div>

        <!-- Classement live -->
        <div class="leaderboard-live">
          <h2>🏆 Classement du round en cours</h2>
          <div class="players-list">
            @for (player of players(); track player.userId) {
              <div class="player-card" [class.me]="player.userId === currentUserId()">
                <div class="rank">#{{ $index + 1 }}</div>
                <div class="player-info">
                  <div class="player-name">
                    {{ player.name }}
                    @if (player.userId === currentUserId()) {
                      <span class="badge">C'est vous</span>
                    }
                  </div>
                  <div class="player-score">{{ formatNumber(player.score) }} $</div>
                </div>
                @if (player.userId !== currentUserId() && canSabotage()) {
                  <button 
                    class="sabotage-btn"
                    (click)="handleSabotage(player.userId, player.name)"
                    [disabled]="actionPending() || !canAffordSabotage()">
                    💣 Saboter (200$)
                  </button>
                }
              </div>
            }
          </div>
        </div>

        <!-- Flux d'événements -->
        <div class="events-feed">
          <h2>📰 Événements récents</h2>
          <div class="events-list">
            @for (event of recentEvents(); track event.id) {
              <div 
                class="event-card" 
                [class.positive]="event.impact > 0"
                [class.negative]="event.impact < 0"
                [class.targeted-me]="event.targetUserId === currentUserId()"
                [class.mitigated]="event.mitigated">
                <div class="event-icon">
                  {{ getEventIcon(event.eventType) }}
                </div>
                <div class="event-content">
                  <div class="event-type">{{ getEventLabel(event.eventType) }}</div>
                  <div class="event-desc">
                    @if (event.source) {
                      <!-- Sabotage -->
                      @if (event.targetUserId === currentUserId()) {
                        <span>Vous avez été saboté !</span>
                      } @else {
                        <span>{{ event.targetName }} a été saboté</span>
                      }
                    } @else {
                      <!-- Event naturel -->
                      @if (event.targetUserId === currentUserId()) {
                        <span>Vous êtes affecté</span>
                      } @else {
                        <span>{{ event.targetName }} est affecté</span>
                      }
                    }
                    <span class="impact" [class.positive]="event.impact > 0">
                      {{ event.impact > 0 ? '+' : '' }}{{ formatNumber(event.impact) }} $
                    </span>
                    @if (event.mitigated) {
                      <span class="mitigated-badge">🛡️ Mitigé</span>
                    }
                  </div>
                </div>
                <div class="event-time">{{ formatEventTime(event.timestamp) }}</div>
              </div>
            }
            @if (recentEvents().length === 0) {
              <div class="no-events">Aucun événement pour l'instant...</div>
            }
          </div>
        </div>
      } @else {
        <!-- Écran de chargement -->
        <div class="loading-screen">
          <div class="spinner"></div>
          <p>Connexion au monde multijoueur...</p>
        </div>
      }
    </div>
  `,
  styles: [`
    .multi-page {
      max-width: 1400px;
      margin: 0 auto;
      padding: 2rem;
    }

    .connection-status {
      position: fixed;
      top: 1rem;
      right: 1rem;
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      font-weight: 600;
      z-index: 1000;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }

    .connection-status.connecting {
      background: #ffc107;
      color: #000;
    }

    .connection-status.connected {
      background: #4caf50;
      color: white;
    }

    .connection-status.disconnected {
      background: #ff9800;
      color: white;
    }

    .connection-status.error {
      background: #f44336;
      color: white;
    }

    .round-header {
      text-align: center;
      margin-bottom: 2rem;
    }

    .round-header h1 {
      font-size: 2.5rem;
      margin-bottom: 1rem;
    }

    .round-info {
      display: flex;
      justify-content: center;
      gap: 2rem;
      font-size: 1.2rem;
    }

    .timer {
      font-weight: bold;
      color: #4caf50;
    }

    .timer.urgent {
      color: #f44336;
      animation: pulse 1s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.6; }
    }

    .my-state {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 2rem;
      border-radius: 12px;
      margin-bottom: 2rem;
    }

    .my-state h2 {
      margin-bottom: 1.5rem;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .stat {
      background: rgba(255,255,255,0.1);
      padding: 1rem;
      border-radius: 8px;
      text-align: center;
    }

    .stat .label {
      display: block;
      opacity: 0.8;
      font-size: 0.9rem;
      margin-bottom: 0.5rem;
    }

    .stat .value {
      display: block;
      font-size: 1.5rem;
      font-weight: bold;
    }

    .actions {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .action-btn {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .action-btn.primary {
      background: #4caf50;
      color: white;
    }

    .action-btn.secondary {
      background: rgba(255,255,255,0.2);
      color: white;
    }

    .action-btn:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    }

    .action-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .action-error {
      margin-top: 1rem;
      padding: 0.75rem;
      background: rgba(244, 67, 54, 0.2);
      border-radius: 8px;
      font-weight: 600;
    }

    .leaderboard-live {
      background: white;
      padding: 2rem;
      border-radius: 12px;
      margin-bottom: 2rem;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }

    .leaderboard-live h2 {
      margin-bottom: 1.5rem;
    }

    .players-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .player-card {
      display: flex;
      align-items: center;
      padding: 1rem;
      background: #f5f5f5;
      border-radius: 8px;
      gap: 1rem;
    }

    .player-card.me {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .rank {
      font-size: 1.5rem;
      font-weight: bold;
      min-width: 3rem;
      text-align: center;
    }

    .player-info {
      flex: 1;
    }

    .player-name {
      font-weight: 600;
      margin-bottom: 0.25rem;
    }

    .badge {
      display: inline-block;
      padding: 0.25rem 0.5rem;
      background: rgba(255,255,255,0.3);
      border-radius: 4px;
      font-size: 0.75rem;
      margin-left: 0.5rem;
    }

    .player-score {
      font-size: 1.2rem;
      opacity: 0.8;
    }

    .sabotage-btn {
      padding: 0.5rem 1rem;
      background: #f44336;
      color: white;
      border: none;
      border-radius: 6px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .sabotage-btn:hover:not(:disabled) {
      background: #d32f2f;
      transform: scale(1.05);
    }

    .sabotage-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .events-feed {
      background: white;
      padding: 2rem;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }

    .events-feed h2 {
      margin-bottom: 1.5rem;
    }

    .events-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      max-height: 500px;
      overflow-y: auto;
    }

    .event-card {
      display: flex;
      align-items: center;
      padding: 1rem;
      border-radius: 8px;
      border-left: 4px solid #ccc;
      gap: 1rem;
      background: #f9f9f9;
      transition: all 0.3s;
    }

    .event-card.positive {
      border-left-color: #4caf50;
      background: #e8f5e9;
    }

    .event-card.negative {
      border-left-color: #f44336;
      background: #ffebee;
    }

    .event-card.targeted-me {
      animation: flash 0.5s ease-in-out;
      font-weight: 600;
    }

    .event-card.mitigated {
      opacity: 0.7;
    }

    @keyframes flash {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.02); box-shadow: 0 8px 24px rgba(0,0,0,0.2); }
    }

    .event-icon {
      font-size: 2rem;
      min-width: 3rem;
      text-align: center;
    }

    .event-content {
      flex: 1;
    }

    .event-type {
      font-weight: 600;
      margin-bottom: 0.25rem;
    }

    .event-desc {
      font-size: 0.9rem;
      opacity: 0.8;
    }

    .impact {
      font-weight: 600;
      margin-left: 0.5rem;
    }

    .impact.positive {
      color: #4caf50;
    }

    .mitigated-badge {
      display: inline-block;
      padding: 0.25rem 0.5rem;
      background: #2196f3;
      color: white;
      border-radius: 4px;
      font-size: 0.75rem;
      margin-left: 0.5rem;
    }

    .event-time {
      font-size: 0.8rem;
      opacity: 0.6;
      white-space: nowrap;
    }

    .no-events {
      text-align: center;
      padding: 2rem;
      opacity: 0.5;
    }

    .loading-screen {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 60vh;
    }

    .spinner {
      width: 50px;
      height: 50px;
      border: 5px solid #f3f3f3;
      border-top: 5px solid #667eea;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 1rem;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `]
})
export class MultiPage implements OnInit, OnDestroy {
  socketService = inject(SocketService);
  clerkService = inject(ClerkService);
  router = inject(Router);

  // État du round
  roundState = signal<HydratePayload | null>(null);
  myState = signal<PlayerState | null>(null);
  players = signal<PlayerSnapshot[]>([]);
  
  // État UI
  actionPending = signal(false);
  actionError = signal<string | null>(null);
  recentEvents = signal<GameEvent[]>([]);
  
  // Timer
  remainingSeconds = signal(0);
  private timerInterval: any;

  // Utilitaires
  formatNumber = formatNumber;
  currentUserId = signal('');

  async ngOnInit() {
    // Récupérer userId actuel
    const user = this.clerkService.user();
    if (!user) {
      this.router.navigate(['/sign-in']);
      return;
    }
    this.currentUserId.set(user.id);

    // Se connecter au WebSocket
    await this.socketService.connect();

    // Écouter les messages
    this.socketService.on('state:hydrate', (msg: any) => this.handleHydrate(msg));
    this.socketService.on('state:tick', (msg: any) => this.handleTick(msg));
    this.socketService.on('action:confirmed', (msg: any) => this.handleActionConfirmed(msg));
    this.socketService.on('action:rejected', (msg: any) => this.handleActionRejected(msg));
    this.socketService.on('event:triggered', (msg: any) => this.handleEvent(msg));
    this.socketService.on('round:started', (msg: any) => this.handleRoundStarted(msg));
    this.socketService.on('round:ended', (msg: any) => this.handleRoundEnded(msg));

    // Timer local pour affichage countdown
    this.timerInterval = setInterval(() => {
      const state = this.roundState();
      if (state) {
        const endsAt = new Date(state.endsAt).getTime();
        const now = Date.now();
        const remaining = Math.max(0, Math.floor((endsAt - now) / 1000));
        this.remainingSeconds.set(remaining);
      }
    }, 1000);
  }

  ngOnDestroy() {
    this.socketService.disconnect();
    if (this.timerInterval) clearInterval(this.timerInterval);
  }

  // --- Handlers WebSocket ---

  handleHydrate(msg: any) {
    console.log('💧 Hydratation:', msg.payload);
    this.roundState.set(msg.payload);
    this.myState.set(msg.payload.me);
    this.players.set(msg.payload.players);
  }

  handleTick(msg: any) {
    this.players.set(msg.payload.players);
    if (msg.payload.me) {
      this.myState.set(msg.payload.me);
    }
  }

  handleActionConfirmed(msg: any) {
    console.log('✅ Action confirmée:', msg.payload);
    this.actionPending.set(false);
    this.actionError.set(null);
    
    // Mettre à jour mon état local
    const current = this.myState();
    if (current) {
      this.myState.set({
        ...current,
        ...msg.payload,
      });
    }
  }

  handleActionRejected(msg: any) {
    console.log('❌ Action rejetée:', msg.payload);
    this.actionPending.set(false);
    
    let errorMsg = msg.payload.error;
    if (msg.payload.remainingMs) {
      errorMsg += ` (${msg.payload.remainingMs}s restantes)`;
    }
    this.actionError.set(errorMsg);
    
    setTimeout(() => this.actionError.set(null), 3000);
  }

  handleEvent(msg: any) {
    const payload: EventPayload = msg.payload;
    console.log('⚡ Event:', payload);

    // Trouver le nom du joueur ciblé
    const targetPlayer = this.players().find(p => p.userId === payload.targetUserId);
    const targetName = targetPlayer?.name || 'Joueur inconnu';

    // Ajouter à la liste des events
    const event: GameEvent = {
      id: `${Date.now()}-${Math.random()}`,
      ...payload,
      targetName,
      timestamp: Date.now(),
    };

    const events = [event, ...this.recentEvents()];
    this.recentEvents.set(events.slice(0, 10)); // Garder les 10 derniers

    // Animation flash si je suis ciblé
    if (payload.targetUserId === this.currentUserId()) {
      document.body.classList.add('flash-effect');
      setTimeout(() => document.body.classList.remove('flash-effect'), 500);
    }
  }

  handleRoundStarted(msg: any) {
    console.log('🎮 Nouveau round:', msg.payload);
    // Reset état local
    this.recentEvents.set([]);
  }

  handleRoundEnded(msg: any) {
    console.log('🏁 Fin du round:', msg.payload);
    // TODO: Afficher modal avec classement final
    // TODO: Invalider queries TanStack Query
  }

  // --- Actions utilisateur ---

  handleClick() {
    this.actionPending.set(true);
    this.actionError.set(null);
    this.socketService.sendAction('click');
  }

  handleBuy(upgradeId: string) {
    this.actionPending.set(true);
    this.actionError.set(null);
    this.socketService.sendAction('buy', { upgradeId });
  }

  handleSabotage(targetUserId: string, targetName: string) {
    if (!confirm(`Saboter ${targetName} pour 200$ ?`)) {
      return;
    }
    
    this.actionPending.set(true);
    this.actionError.set(null);
    this.socketService.sendAction('sabotage', { targetUserId });
  }

  // --- Utilitaires UI ---

  canSabotage(): boolean {
    const state = this.myState();
    if (!state) return false;
    
    const COOLDOWN_MS = 30 * 1000;
    const now = Date.now();
    return state.sabotageUsedAt === 0 || (now - state.sabotageUsedAt >= COOLDOWN_MS);
  }

  canAffordSabotage(): boolean {
    const state = this.myState();
    return (state?.money || 0) >= 200;
  }

  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  formatEventTime(timestamp: number): string {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    return `${mins}min`;
  }

  getEventIcon(eventType: string): string {
    const icons: Record<string, string> = {
      'BUG_EN_PROD': '🐛',
      'LEVEE_DE_FONDS': '💰',
      'VIRAL_MARKETING': '📈',
      'TURNOVER': '🚪',
      'PARTENARIAT': '🤝',
    };
    return icons[eventType] || '⚡';
  }

  getEventLabel(eventType: string): string {
    const labels: Record<string, string> = {
      'BUG_EN_PROD': 'Bug en production',
      'LEVEE_DE_FONDS': 'Levée de fonds',
      'VIRAL_MARKETING': 'Marketing viral',
      'TURNOVER': 'Turnover',
      'PARTENARIAT': 'Partenariat',
    };
    return labels[eventType] || eventType;
  }
}
