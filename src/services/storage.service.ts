import { Injectable } from '@angular/core';
import { GameState } from '../state/game.state';

/**
 * Clé unique pour la sauvegarde dans localStorage
 */
const SAVE_KEY = 'startup-tycoon-save';

/**
 * Version du format de sauvegarde
 */
const SAVE_VERSION = 1;

/**
 * Format de la sauvegarde dans localStorage
 */
export interface SaveData {
  version: number;      // Version du format (pour migrations futures)
  savedAt: number;      // Timestamp de la sauvegarde
  state: GameState;     // État complet du jeu
}

/**
 * Service de gestion de la persistance du jeu dans localStorage
 */
@Injectable({
  providedIn: 'root',
})
export class StorageService {
  /**
   * Sauvegarde l'état du jeu dans localStorage
   */
  saveGame(state: GameState): void {
    try {
      const saveData: SaveData = {
        version: SAVE_VERSION,
        savedAt: Date.now(),
        state: state,
      };
      
      const json = JSON.stringify(saveData);
      localStorage.setItem(SAVE_KEY, json);
      
      console.log(`[Storage] Jeu sauvegardé à ${new Date(saveData.savedAt).toLocaleTimeString()}`);
    } catch (error) {
      console.error('[Storage] Erreur lors de la sauvegarde:', error);
    }
  }

  /**
   * Charge l'état du jeu depuis localStorage
   * Retourne null si aucune sauvegarde ou si la sauvegarde est invalide
   */
  loadGame(): GameState | null {
    try {
      const json = localStorage.getItem(SAVE_KEY);
      
      // Pas de sauvegarde
      if (!json) {
        console.log('[Storage] Aucune sauvegarde trouvée');
        return null;
      }

      // Parse le JSON
      const saveData = JSON.parse(json) as SaveData;

      // Validation du format
      if (!this.isValidSaveData(saveData)) {
        console.warn('[Storage] Format de sauvegarde invalide, ignoré');
        return null;
      }

      console.log(`[Storage] Sauvegarde restaurée (${new Date(saveData.savedAt).toLocaleString()})`);
      return saveData.state;
    } catch (error) {
      console.error('[Storage] Erreur lors du chargement:', error);
      return null;
    }
  }

  /**
   * Efface la sauvegarde du jeu
   */
  clearSave(): void {
    try {
      localStorage.removeItem(SAVE_KEY);
      console.log('[Storage] Sauvegarde effacée');
    } catch (error) {
      console.error('[Storage] Erreur lors de la suppression:', error);
    }
  }

  /**
   * Récupère la date de dernière sauvegarde
   * Retourne null si aucune sauvegarde
   */
  getLastSavedDate(): Date | null {
    try {
      const json = localStorage.getItem(SAVE_KEY);
      if (!json) return null;

      const saveData = JSON.parse(json) as SaveData;
      if (!saveData.savedAt) return null;

      return new Date(saveData.savedAt);
    } catch (error) {
      console.error('[Storage] Erreur lors de la lecture de savedAt:', error);
      return null;
    }
  }

  /**
   * Valide qu'une sauvegarde a le bon format
   */
  private isValidSaveData(data: any): data is SaveData {
    // Vérifier la structure de base
    if (!data || typeof data !== 'object') {
      console.warn('[Storage] Sauvegarde n\'est pas un objet');
      return false;
    }

    // Vérifier la version
    if (data.version !== SAVE_VERSION) {
      console.warn(`[Storage] Version incompatible: ${data.version} (attendu: ${SAVE_VERSION})`);
      return false;
    }

    // Vérifier savedAt
    if (typeof data.savedAt !== 'number' || data.savedAt <= 0) {
      console.warn('[Storage] savedAt invalide');
      return false;
    }

    // Vérifier que state existe et est un objet
    if (!data.state || typeof data.state !== 'object') {
      console.warn('[Storage] state manquant ou invalide');
      return false;
    }

    const state = data.state;

    // Valider les propriétés du state
    if (typeof state.money !== 'number' || state.money < 0) {
      console.warn('[Storage] money invalide');
      return false;
    }

    if (typeof state.clickValue !== 'number' || state.clickValue < 0) {
      console.warn('[Storage] clickValue invalide');
      return false;
    }

    if (typeof state.incomePerSecond !== 'number' || state.incomePerSecond < 0) {
      console.warn('[Storage] incomePerSecond invalide');
      return false;
    }

    if (!Array.isArray(state.upgrades)) {
      console.warn('[Storage] upgrades n\'est pas un tableau');
      return false;
    }

    if (typeof state.totalClicks !== 'number' || state.totalClicks < 0) {
      console.warn('[Storage] totalClicks invalide');
      return false;
    }

    if (typeof state.totalEarned !== 'number' || state.totalEarned < 0) {
      console.warn('[Storage] totalEarned invalide');
      return false;
    }

    return true;
  }
}
