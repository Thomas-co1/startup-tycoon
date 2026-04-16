import { Upgrade } from '../models/upgrade.model';

/**
 * Types d'actions possibles dans le jeu
 */
export enum GameActionType {
  CLICK = 'CLICK',
  TICK = 'TICK',
  BUY_UPGRADE = 'BUY_UPGRADE',
  RESET_GAME = 'RESET_GAME',
}

/**
 * Action déclenchée lors d'un clic
 */
export interface ClickAction {
  type: GameActionType.CLICK;
}

/**
 * Action déclenchée à chaque tick (toutes les secondes)
 */
export interface TickAction {
  type: GameActionType.TICK;
}

/**
 * Action déclenchée lors de l'achat d'un upgrade
 */
export interface BuyUpgradeAction {
  type: GameActionType.BUY_UPGRADE;
  payload: {
    upgrade: Upgrade;
  };
}

/**
 * Action pour réinitialiser le jeu
 */
export interface ResetGameAction {
  type: GameActionType.RESET_GAME;
}

/**
 * Union de toutes les actions possibles
 */
export type GameAction =
  | ClickAction
  | TickAction
  | BuyUpgradeAction
  | ResetGameAction;

/**
 * Fonctions créatrices d'actions (Action Creators)
 */
export const GameActions = {
  click: (): ClickAction => ({
    type: GameActionType.CLICK,
  }),

  tick: (): TickAction => ({
    type: GameActionType.TICK,
  }),

  buyUpgrade: (upgrade: Upgrade): BuyUpgradeAction => ({
    type: GameActionType.BUY_UPGRADE,
    payload: { upgrade },
  }),

  resetGame: (): ResetGameAction => ({
    type: GameActionType.RESET_GAME,
  }),
};
