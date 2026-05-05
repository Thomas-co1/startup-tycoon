import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ClerkService } from '../services/clerk.service';
import { environment } from '../environments/environment';

/**
 * Service API centralisé avec authentification automatique
 * Ajoute le token Clerk à toutes les requêtes et gère les erreurs HTTP
 */
@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private clerkService = inject(ClerkService);
  private router = inject(Router);

  private readonly API_BASE_URL = environment.apiUrl || 'http://localhost:3000';

  /**
   * Effectue une requête HTTP authentifiée
   * @param path - Chemin relatif (ex: '/api/leaderboard')
   * @param options - Options fetch (method, body, headers...)
   * @returns Promise avec les données JSON
   */
  async fetch<T>(path: string, options: RequestInit = {}): Promise<T> {
    try {
      // Récupérer le token Clerk (si connecté)
      const token = await this.clerkService.getToken();

      // Construire les headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>),
      };

      // Ajouter l'Authorization header si token disponible
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Construire l'URL complète
      const url = `${this.API_BASE_URL}${path}`;

      // Faire la requête
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Gérer les erreurs HTTP
      if (!response.ok) {
        await this.handleHttpError(response);
      }

      // Parser et retourner le JSON
      return await response.json();
    } catch (error) {
      console.error('[ApiService] Erreur:', error);
      throw error;
    }
  }

  /**
   * GET request
   */
  async get<T>(path: string): Promise<T> {
    return this.fetch<T>(path, { method: 'GET' });
  }

  /**
   * POST request
   */
  async post<T>(path: string, body: any): Promise<T> {
    return this.fetch<T>(path, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  /**
   * PUT request
   */
  async put<T>(path: string, body: any): Promise<T> {
    return this.fetch<T>(path, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  /**
   * DELETE request
   */
  async delete<T>(path: string): Promise<T> {
    return this.fetch<T>(path, { method: 'DELETE' });
  }

  /**
   * Gère les erreurs HTTP
   */
  private async handleHttpError(response: Response): Promise<never> {
    const status = response.status;

    // 401 Unauthorized → Redirection vers /sign-in
    if (status === 401) {
      console.warn('[ApiService] 401 Unauthorized - Redirection vers /sign-in');
      this.router.navigate(['/sign-in'], {
        queryParams: { returnUrl: this.router.url },
      });
      throw new Error('Non authentifié');
    }

    // 403 Forbidden
    if (status === 403) {
      throw new Error('Accès refusé');
    }

    // 404 Not Found
    if (status === 404) {
      throw new Error('Ressource introuvable');
    }

    // Erreurs serveur (5xx)
    if (status >= 500) {
      throw new Error('Erreur serveur');
    }

    // Autres erreurs
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Erreur HTTP ${status}`);
  }
}
