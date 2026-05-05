import { Component, inject } from '@angular/core';
import { ClerkService } from '../services/clerk.service';

@Component({
  selector: 'app-sign-in',
  standalone: true,
  template: `
    <div class="sign-in-container">
      <div class="sign-in-card">
        <h1>🚀 Startup Tycoon</h1>
        <p class="subtitle">Connecte-toi pour accéder au mode multijoueur</p>
        
        <button (click)="login()" class="sign-in-btn">Se connecter</button>
        <button (click)="logout()" class="sign-out-btn">Se déconnecter</button>
        <button (click)="debugClerk()" class="debug-btn">🔍 Debug Clerk (TP13 P2)</button>
      </div>
    </div>
  `,
  styles: [`
    .sign-in-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
    }

    .sign-in-card {
      background: white;
      border-radius: 16px;
      padding: 40px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      max-width: 450px;
      width: 100%;
      text-align: center;
    }

    h1 {
      margin: 0 0 10px 0;
      font-size: 2rem;
      color: #333;
    }

    .subtitle {
      color: #666;
      margin: 0 0 30px 0;
      font-size: 0.95rem;
    }

    button {
      width: 100%;
      border: none;
      padding: 16px 24px;
      border-radius: 12px;
      font-size: 1.1rem;
      font-weight: 600;
      cursor: pointer;
      margin: 10px 0;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .sign-in-btn {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .sign-in-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
    }

    .sign-out-btn {
      background: #f5f5f5;
      color: #666;
    }

    .sign-out-btn:hover {
      background: #e0e0e0;

    .debug-btn {
      background: #ff9800;
      color: white;
      font-size: 0.9rem;
      margin-top: 20px;
    }

    .debug-btn:hover {
      background: #f57c00;
    }
    }
  `]
})
export class SignInPage {
  private clerkService = inject(ClerkService);

  login() {
    this.clerkService.signIn();
  }

  logout() {
    this.clerkService.signOut();
  }

  async debugClerk() {
    console.log('=== 🔍 DEBUG CLERK ===');
    
    // 1. Informations utilisateur
    console.log('👤 User:', this.clerkService.getUser());
    
    // 2. JWT Token
    const token = await this.clerkService.getToken();
    console.log('🎫 JWT Token:', token);
    
    // 3. Cookies
    console.log('🍪 document.cookie:', document.cookie);
    console.log('➡️ Les cookies HttpOnly ne sont PAS visibles ici');
    
    // 4. Instructions
    console.log('\n📋 INSTRUCTIONS:');
    console.log('1. Ouvrir DevTools → Application → Cookies');
    console.log('2. Copier le token JWT ci-dessus sur https://jwt.io');
    console.log('3. Observer les requêtes Network');
    
    alert('Voir la console pour les infos de debug !');
  }
}
