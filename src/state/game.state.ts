import { Upgrade } from '../models/upgrade.model';

/**
 * Interface du state global du jeu
 * Contient toutes les données partagées par l'application
 */
export interface GameState {
  money: number;
  clickValue: number;
  incomePerSecond: number;
  upgrades: Upgrade[];
  totalClicks: number;
  totalEarned: number;
}

/**
 * État initial du jeu
 * Valeurs par défaut au démarrage de l'application
 */
export const initialState: GameState = {
  money: 0,
  clickValue: 1,
  incomePerSecond: 0,
  upgrades: [],
  totalClicks: 0,
  totalEarned: 0
};
