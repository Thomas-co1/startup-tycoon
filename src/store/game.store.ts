import { Injectable, signal, computed, inject } from '@angular/core';
import { GameState, initialState } from '../state/game.state';
import { GameAction, GameActions, GameActionType } from '../state/game.actions';
import { gameReducer } from '../state/game.reducer';
import { StorageService } from '../services/storage.service';

/**
 * Store global du jeu - point central de gestion de l'état
 */
@Injectable({
  providedIn: 'root',
})
export class GameStore {
  private storageService = inject(StorageService);

  // Signal writable contenant tout l'état du jeu
  private state = signal<GameState>(this.loadInitialState());

  // Signals computed pour accéder facilement aux parties de l'état
  money = computed(() => this.state().money);
  clickValue = computed(() => this.state().clickValue);
  incomePerSecond = computed(() => this.state().incomePerSecond);
  upgrades = computed(() => this.state().upgrades);
  totalClicks = computed(() => this.state().totalClicks);
  totalEarned = computed(() => this.state().totalEarned);

  private tickIntervalId?: number;
  private saveIntervalId?: number;
  private needsSave = false;

  constructor() {
    // Sauvegarde périodique avec throttle (toutes les 2 secondes)
    this.saveIntervalId = window.setInterval(() => {
      if (this.needsSave) {
        this.storageService.saveGame(this.state());
        this.needsSave = false;
      }
    }, 2000); // Throttle de 2 secondes

    // Tick global : s'exécute toutes les secondes
    this.tickIntervalId = window.setInterval(() => {
      this.dispatch(GameActions.tick());
    }, 1000);
  }

  /**
   * Charge l'état initial depuis localStorage ou retourne initialState
   */
  private loadInitialState(): GameState {
    const savedState = this.storageService.loadGame();
    
    if (savedState) {
      console.log('[GameStore] État restauré depuis la sauvegarde');
      return savedState;
    }
    
    console.log('[GameStore] Démarrage avec l\'état initial');
    return initialState;
  }

  /**
   * Dispatch une action pour modifier l'état
   */
  dispatch(action: GameAction): void {
    const currentState = this.state();
    const newState = gameReducer(currentState, action);
    this.state.set(newState);

    // Marquer qu'une sauvegarde est nécessaire
    this.needsSave = true;

    // Sauvegarde immédiate pour les actions importantes
    if (
      action.type === GameActionType.BUY_UPGRADE ||
      action.type === GameActionType.RESET_GAME
    ) {
      this.storageService.saveGame(newState);
      this.needsSave = false; // Réinitialiser le flag car on vient de sauvegarder
    }
  }

  /**
   * Réinitialise le jeu
   */
  resetGame(): void {
    this.dispatch(GameActions.resetGame());
  }
}
