import { Injectable, inject } from '@angular/core';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { ApiService } from '../lib/api.service';
import { LeaderboardEntry } from '../models/game.model';

/**
 * Service pour gérer le leaderboard avec TanStack Query
 */
@Injectable({
  providedIn: 'root',
})
export class LeaderboardService {
  private apiService = inject(ApiService);

  /**
   * Query pour récupérer le leaderboard all-time (top 20)
   * Endpoint public, pas d'authentification requise
   */
  useLeaderboard() {
    return injectQuery(() => ({
      queryKey: ['leaderboard'],
      queryFn: () => this.fetchLeaderboard(),
      staleTime: 10_000, // 10 secondes - données considérées fraîches
      refetchInterval: 30_000, // Refetch automatique toutes les 30 secondes
    }));
  }

  /**
   * Récupère le leaderboard depuis l'API
   */
  private async fetchLeaderboard(): Promise<LeaderboardEntry[]> {
    const data = await this.apiService.get<LeaderboardEntry[]>('/api/leaderboard');
    
    // Ajouter le rang à chaque entrée
    return data.map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));
  }
}
