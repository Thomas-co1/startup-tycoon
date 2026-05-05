import { Injectable, signal } from '@angular/core';
import { Clerk } from '@clerk/clerk-js';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ClerkService {
  clerk: Clerk;
  private isLoaded = false;
  
  // Signal réactif pour l'utilisateur
  user = signal<any>(null);

  constructor() {
    this.clerk = new Clerk(environment.clerkPublishableKey);
    this.init();
  }

  async init() {
    await this.clerk.load();
    this.isLoaded = true;
    
    // Initialiser le signal
    this.user.set(this.clerk.user);
    
    // Écouter les changements d'utilisateur
    this.clerk.addListener(() => {
      this.user.set(this.clerk.user);
    });
  }

  signIn() {
    if (!this.isLoaded) return;
    this.clerk.redirectToSignIn();
  }

  signUp() {
    if (!this.isLoaded) return;
    this.clerk.redirectToSignUp();
  }

  signOut() {
    if (!this.isLoaded) return;
    this.clerk.signOut();
    this.user.set(null);
  }

  getUser() {
    return this.user();
  }

  isSignedIn() {
    return this.user() !== null;
  }

  async getToken() {
    if (!this.isLoaded) return null;
    return await this.clerk.session?.getToken();
  }
}
