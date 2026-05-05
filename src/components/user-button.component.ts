import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ClerkService } from '../services/clerk.service';

@Component({
  selector: 'app-user-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="user-button-wrapper">
      @if (clerkService.user()) {
        <div class="user-info">
          <span class="user-email">{{ clerkService.user()?.primaryEmailAddress?.emailAddress }}</span>
          <button class="logout-button" (click)="logout()">Se déconnecter</button>
        </div>
      } @else {
        <button class="sign-in-button" (click)="goToSignIn()">
          Se connecter
        </button>
      }
    </div>
  `,
  styles: [`
    .user-button-wrapper {
      display: flex;
      align-items: center;
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .user-email {
      color: white;
      font-size: 0.9rem;
    }

    .logout-button {
      background: rgba(255, 255, 255, 0.2);
      color: white;
      border: 1px solid rgba(255, 255, 255, 0.3);
      padding: 6px 16px;
      border-radius: 6px;
      font-size: 0.85rem;
      cursor: pointer;
      transition: background 0.2s;
    }

    .logout-button:hover {
      background: rgba(255, 255, 255, 0.3);
    }

    .sign-in-button {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      padding: 8px 20px;
      border-radius: 8px;
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .sign-in-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }
  `]
})
export class UserButtonComponent {
  public clerkService = inject(ClerkService);
  private router = inject(Router);

  goToSignIn(): void {
    this.router.navigate(['/sign-in']);
  }

  logout(): void {
    this.clerkService.signOut();
  }
}
