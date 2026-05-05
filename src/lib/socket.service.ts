// src/lib/socket.service.ts
// Service WebSocket pour le mode multijoueur temps réel
// Gère : connexion authentifiée, reconnexion avec backoff, routing des messages

import { inject, Injectable } from '@angular/core';
import { ClerkService } from '../services/clerk.service';

export type SocketMessage =
  | { type: 'state:hydrate'; payload: HydratePayload }
  | { type: 'state:tick'; payload: TickPayload }
  | { type: 'action:confirmed'; payload: ActionConfirmedPayload }
  | { type: 'action:rejected'; payload: ActionRejectedPayload }
  | { type: 'event:triggered'; payload: EventPayload }
  | { type: 'round:started'; payload: RoundStartedPayload }
  | { type: 'round:ended'; payload: RoundEndedPayload };

export interface HydratePayload {
  roundId: string;
  endsAt: string;
  players: PlayerSnapshot[];
  me: PlayerState | null;
}

export interface TickPayload {
  players: PlayerSnapshot[];
  me?: PlayerState;
}

export interface ActionConfirmedPayload {
  actionId: string;
  actionType: string;
  money: number;
  score: number;
  [key: string]: any;
}

export interface ActionRejectedPayload {
  actionId: string;
  actionType: string;
  error: string;
  remainingMs?: number;
}

export interface EventPayload {
  eventType: string;
  targetUserId: string;
  mitigated: boolean;
  impact: number;
  source: string | null; // null = event naturel, userId = sabotage
}

export interface RoundStartedPayload {
  roundId: string;
  endsAt: string;
}

export interface RoundEndedPayload {
  roundId: string;
  ranking: PlayerSnapshot[];
}

export interface PlayerSnapshot {
  userId: string;
  name: string;
  score: number;
}

export interface PlayerState {
  money: number;
  score: number;
  clicks: number;
  resilience: number;
  upgrades: Record<string, number>;
  sabotageUsedAt: number;
}

type MessageHandler = (message: SocketMessage) => void;

@Injectable({ providedIn: 'root' })
export class SocketService {
  private clerkService = inject(ClerkService);

  private ws: WebSocket | null = null;
  private handlers = new Map<string, MessageHandler[]>();
  private reconnectAttempts = 0;
  private reconnectTimeout: any = null;
  private maxReconnectAttempts = 10;
  private reconnectDelays = [1000, 2000, 4000, 8000, 16000, 30000]; // backoff avec cap 30s
  
  public connectionState: 'disconnected' | 'connecting' | 'connected' | 'error' = 'disconnected';
  public reconnectCountdown = 0;

  /**
   * Se connecter au WebSocket avec authentification JWT
   */
  async connect(): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log('⚠️ WebSocket déjà connecté');
      return;
    }

    this.connectionState = 'connecting';

    try {
      // Récupérer le JWT Clerk
      const token = await this.clerkService.getToken();
      if (!token) {
        throw new Error('Impossible de récupérer le token Clerk');
      }

      // Ouvrir la connexion WebSocket avec token en query string
      const wsUrl = `ws://localhost:3000/ws?token=${token}`;
      this.ws = new WebSocket(wsUrl);

      // Événements WebSocket natifs
      this.ws.onopen = () => this.handleOpen();
      this.ws.onmessage = (event) => this.handleMessage(event);
      this.ws.onerror = (error) => this.handleError(error);
      this.ws.onclose = (event) => this.handleClose(event);

    } catch (error) {
      console.error('❌ Erreur connexion WebSocket:', error);
      this.connectionState = 'error';
      this.scheduleReconnect();
    }
  }

  /**
   * Déconnecter proprement (pas de reconnexion auto)
   */
  disconnect(): void {
    console.log('🔌 Déconnexion WebSocket volontaire');
    this.clearReconnectTimeout();
    this.reconnectAttempts = 0;
    
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
    
    this.connectionState = 'disconnected';
  }

  /**
   * Envoyer un message au serveur
   */
  send(message: any): void {
    if (this.ws?.readyState !== WebSocket.OPEN) {
      console.warn('⚠️ WebSocket pas connecté, message non envoyé:', message);
      return;
    }

    this.ws.send(JSON.stringify(message));
  }

  /**
   * Envoyer une action avec actionId pour matcher la réponse
   */
  sendAction(actionType: string, payload: any = {}): string {
    const actionId = this.generateActionId();
    this.send({
      type: `action:${actionType}`,
      actionId,
      payload,
    });
    return actionId;
  }

  /**
   * Écouter un type de message spécifique
   */
  on(messageType: string, handler: MessageHandler): void {
    if (!this.handlers.has(messageType)) {
      this.handlers.set(messageType, []);
    }
    this.handlers.get(messageType)!.push(handler);
  }

  /**
   * Retirer un handler
   */
  off(messageType: string, handler: MessageHandler): void {
    const handlers = this.handlers.get(messageType);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  // --- Handlers internes ---

  private handleOpen(): void {
    console.log('✅ WebSocket connecté');
    this.connectionState = 'connected';
    this.reconnectAttempts = 0;
    this.reconnectCountdown = 0;
    this.clearReconnectTimeout();
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const message: SocketMessage = JSON.parse(event.data);
      console.log('📨 Message reçu:', message.type, message);

      // Appeler les handlers enregistrés pour ce type
      const handlers = this.handlers.get(message.type);
      if (handlers) {
        handlers.forEach(handler => handler(message));
      }

      // Handler générique (écoute tous les messages)
      const allHandlers = this.handlers.get('*');
      if (allHandlers) {
        allHandlers.forEach(handler => handler(message));
      }

    } catch (error) {
      console.error('❌ Erreur parsing message WebSocket:', error);
    }
  }

  private handleError(error: Event): void {
    console.error('❌ Erreur WebSocket:', error);
    this.connectionState = 'error';
  }

  private handleClose(event: CloseEvent): void {
    console.log(`🔌 WebSocket fermé: code=${event.code}, reason="${event.reason}"`);
    this.connectionState = 'disconnected';
    this.ws = null;

    // Code 1008 = Policy Violation (auth failed)
    // Code 1000 = Normal closure
    // Code 1006 = Abnormal closure (network error)

    if (event.code === 1008 || event.code === 1000) {
      // Ne pas reconnecter : auth invalide ou fermeture normale
      console.log('🛑 Pas de reconnexion (auth invalide ou fermeture volontaire)');
      // TODO: Rediriger vers sign-in si 1008
      return;
    }

    // Reconnexion automatique avec backoff
    this.scheduleReconnect();
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Nombre max de tentatives de reconnexion atteint');
      this.connectionState = 'error';
      return;
    }

    const delayIndex = Math.min(this.reconnectAttempts, this.reconnectDelays.length - 1);
    const delay = this.reconnectDelays[delayIndex];
    
    this.reconnectAttempts++;
    this.reconnectCountdown = delay / 1000;

    console.log(`🔄 Reconnexion dans ${this.reconnectCountdown}s (tentative ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    // Countdown visuel
    const countdownInterval = setInterval(() => {
      this.reconnectCountdown--;
      if (this.reconnectCountdown <= 0) {
        clearInterval(countdownInterval);
      }
    }, 1000);

    this.reconnectTimeout = setTimeout(() => {
      console.log('🔄 Tentative de reconnexion...');
      this.connect();
    }, delay);
  }

  private clearReconnectTimeout(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }

  private generateActionId(): string {
    // UUID court (8 caractères suffisent pour matcher)
    return Math.random().toString(36).substring(2, 10);
  }

  /**
   * Cleanup complet (pour ngOnDestroy)
   */
  cleanup(): void {
    this.disconnect();
    this.handlers.clear();
  }
}
