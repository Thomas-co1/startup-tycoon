import { Injectable, inject } from '@angular/core';
import { injectQuery, injectMutation, injectQueryClient } from '@tanstack/angular-query-experimental';
import { ApiService } from '../lib/api.service';
import { Game, SubmitGameData, LeaderboardEntry } from '../models/game.model';

/**
 * Service pour gérer les parties (games) avec TanStack Query
 */
@Injectable({
  providedIn: 'root',
})
export class GamesService {
  private apiService = inject(ApiService);
  private queryClient = injectQueryClient();

  /**
   * Query pour récupérer l'historique des parties de l'utilisateur connecté
   * Nécessite authentification
   */
  useMyGames() {
    return injectQuery(() => ({
      queryKey: ['games', 'me'],
      queryFn: () => this.fetchMyGames(),
      staleTime: 30_000, // 30 secondes
    }));
  }

  /**
   * Mutation pour soumettre une nouvelle partie terminée
   * Avec optimistic update et invalidation du cache
   */
  useSubmitGame() {
    return injectMutation(() => ({
      mutationFn: (gameData: SubmitGameData) => this.submitGame(gameData),
      
      // Optimistic update : Mettre à jour l'UI immédiatement
      onMutate: async (newGame: SubmitGameData) => {
        // Annuler les requêtes en cours pour éviter les conflits
        await this.queryClient.cancelQueries({ queryKey: ['games', 'me'] });
        await this.queryClient.cancelQueries({ queryKey: ['leaderboard'] });

        // Sauvegarder les données actuelles pour rollback potentiel
        const previousGames = this.queryClient.getQueryData<Game[]>(['games', 'me']);
        const previousLeaderboard = this.queryClient.getQueryData<LeaderboardEntry[]>(['leaderboard']);

        // Optimistic update : Ajouter la nouvelle partie à l'historique
        if (previousGames) {
          const optimisticGame: Game = {
            _id: 'temp-' + Date.now(),
            userId: 'current-user',
            mode: newGame.mode,
            score: newGame.score,
            duration: newGame.duration,
            clicks: newGame.clicks,
            upgrades: newGame.upgrades,
            createdAt: new Date().toISOString(),
          };
          
          this.queryClient.setQueryData<Game[]>(
            ['games', 'me'],
            [...previousGames, optimisticGame]
          );
        }

        // Optimistic update : Mettre à jour le leaderboard si le score est bon
        if (previousLeaderboard && newGame.mode === 'solo') {
          const minScore = previousLeaderboard[previousLeaderboard.length - 1]?.score || 0;
          
          // Si le nouveau score est meilleur que le dernier du top 20
          if (newGame.score > minScore || previousLeaderboard.length < 20) {
            const optimisticEntry: LeaderboardEntry = {
              _id: 'temp-' + Date.now(),
              userId: 'current-user',
              username: 'You',
              score: newGame.score,
              createdAt: new Date().toISOString(),
            };

            const newLeaderboard = [...previousLeaderboard, optimisticEntry]
              .sort((a, b) => b.score - a.score)
              .slice(0, 20)
              .map((entry, index) => ({ ...entry, rank: index + 1 }));

            this.queryClient.setQueryData<LeaderboardEntry[]>(
              ['leaderboard'],
              newLeaderboard
            );
          }
        }

        // Retourner le contexte pour rollback
        return { previousGames, previousLeaderboard };
      },

      // En cas d'erreur : Rollback
      onError: (error, newGame, context) => {
        console.error('[GamesService] Erreur lors de la soumission:', error);
        
        // Restaurer les données précédentes
        if (context?.previousGames) {
          this.queryClient.setQueryData(['games', 'me'], context.previousGames);
        }
        if (context?.previousLeaderboard) {
          this.queryClient.setQueryData(['leaderboard'], context.previousLeaderboard);
        }

        // Afficher un message d'erreur (pourrait être un toast)
        alert('❌ Erreur : Impossible d\'enregistrer la partie. Veuillez réessayer.');
      },

      // Après succès ou erreur : Refetch pour synchroniser avec le serveur
      onSettled: () => {
        this.queryClient.invalidateQueries({ queryKey: ['games', 'me'] });
        this.queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
      },

      // Après succès : Log de confirmation
      onSuccess: (data) => {
        console.log('[GamesService] Partie enregistrée avec succès:', data);
      },
    }));
  }

  /**
   * Récupère l'historique des parties depuis l'API
   */
  private async fetchMyGames(): Promise<Game[]> {
    return this.apiService.get<Game[]>('/api/games/me');
  }

  /**
   * Soumet une nouvelle partie à l'API
   */
  private async submitGame(gameData: SubmitGameData): Promise<Game> {
    return this.apiService.post<Game>('/api/games', gameData);
  }
}
