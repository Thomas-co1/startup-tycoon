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

      // Calculer le coût actuel basé sur le count
      const currentCost = Math.round(upgrade.baseCost * Math.pow(1.15, upgrade.count));

      // Vérifier si l'achat est possible
      if (state.money < currentCost) {
        return state; // Pas assez d'argent
      }

      // Trouver l'upgrade dans le state et augmenter son count
      const updatedUpgrades = state.upgrades.map(u =>
        u.id === upgrade.id
          ? { ...u, count: u.count + 1 }
          : u
      );

      // Appliquer l'upgrade
      return {
        ...state,
        money: state.money - currentCost,
        incomePerSecond: state.incomePerSecond + upgrade.incomePerSecondGain,
        upgrades: updatedUpgrades,
      };
    }

    case GameActionType.RESET_GAME: {
      return { ...initialState };
    }

    default:
      return state;
  }
}
