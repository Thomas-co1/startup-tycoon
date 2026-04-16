import { GameState, initialState } from './game.state';
import { GameAction, GameActionType } from './game.actions';

/**
 * Reducer pur qui gère les transitions d'état
 * Prend l'état actuel et une action, retourne le nouvel état
 */
export function gameReducer(
  state: GameState = initialState,
  action: GameAction
): GameState {
  switch (action.type) {
    case GameActionType.CLICK: {
      const earnedAmount = state.clickValue;
      return {
        ...state,
        money: state.money + earnedAmount,
        totalClicks: state.totalClicks + 1,
        totalEarned: state.totalEarned + earnedAmount,
      };
    }

    case GameActionType.TICK: {
      const earnedAmount = state.incomePerSecond;
      return {
        ...state,
        money: state.money + earnedAmount,
        totalEarned: state.totalEarned + earnedAmount,
      };
    }

    case GameActionType.BUY_UPGRADE: {
      const { upgrade } = action.payload;

      // Vérifier si l'achat est possible
      if (state.money < upgrade.baseCost) {
        return state; // Pas assez d'argent, on ne change rien
      }

      // Vérifier si l'upgrade existe déjà
      const existingUpgrade = state.upgrades.find((u) => u.id === upgrade.id);
      if (existingUpgrade) {
        return state; // Upgrade déjà acheté, on ne change rien
      }

      // Appliquer l'upgrade
      return {
        ...state,
        money: state.money - upgrade.baseCost,
        incomePerSecond: state.incomePerSecond + upgrade.incomePerSecondGain,
        upgrades: [...state.upgrades, upgrade],
      };
    }

    case GameActionType.RESET_GAME: {
      return { ...initialState };
    }

    default:
      return state;
  }
}
