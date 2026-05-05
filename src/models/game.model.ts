/**
 * Données d'une partie enregistrée sur le serveur
 */
export interface Game {
  _id: string;
  userId: string;
  mode: 'solo' | 'multi';
  score: number;
  duration: number; // en secondes
  clicks: number;
  upgrades: string[]; // IDs des upgrades achetées
  createdAt: string; // ISO date
}

/**
 * Entrée du leaderboard
 */
export interface LeaderboardEntry {
  _id: string;
  userId: string;
  username?: string;
  score: number;
  createdAt: string;
  rank?: number;
}

/**
 * Données pour soumettre une nouvelle partie
 */
export interface SubmitGameData {
  mode: 'solo' | 'multi';
  score: number;
  duration: number;
  clicks: number;
  upgrades: string[];
}
