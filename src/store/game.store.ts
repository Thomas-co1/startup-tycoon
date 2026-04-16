import { Injectable, signal, computed, effect } from '@angular/core';
import { GameState, initialState } from '../state/game.state';
import { GameAction, GameActions } from '../state/game.actions';
import { gameReducer } from '../state/game.reducer';
import { loadGameData, saveGameData } from '../utils/localStorage';

/**
 * Store global du jeu - point central de gestion de l'état
 */
@Injectable({
  providedIn: 'root',
})
export class GameStore {
  // Signal writable contenant tout l'état du jeu
  private state = signal<GameState>(this.loadInitialState());

  // Signals computed pour accéder facilement aux parties de l'état
  money = computed(() => this.state().money);
  clickValue = computed(() => this.state().clickValue);
  incomePerSecond = computed(() => this.state().incomePerSecond);
  upgrades = computed(() => this.state().upgrades);
  totalClicks = computed(() => this.state().totalClicks);
  totalEarned = computed(() => this.state().totalEarned);

  constructor() {
    // Sauvegarder automatiquement à chaque changement d'état
    effect(() => {
      const currentState = this.state();
      saveGameData('gameState', currentState);
      // Note: Dans un environnement de développement, ce log peut être utile
      // mais sera commenté en production pour éviter les side effects
      // console.log('State saved:', currentState);
    });
  }

  /**
   * Charge l'état initial depuis localStorage ou retourne initialState
   */
  private loadInitialState(): GameState {
    return loadGameData<GameState>('gameState', initialState);
  }

  /**
   * Dispatch une action pour modifier l'état
   */
  dispatch(action: GameAction): void {
    const currentState = this.state();
    const newState = gameReducer(currentState, action);
    this.state.set(newState);
  }

  /**
   * Réinitialise le jeu
   */
  resetGame(): void {
    this.dispatch(GameActions.resetGame());
  }
}
