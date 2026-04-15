import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="page-container">
      <h1>404 - Page Not Found</h1>
      <p class="page-objective">La page que vous recherchez n'existe pas.</p>
      <a routerLink="/" class="back-link">Retour à l'accueil</a>
    </div>
  `,
  styles: [`
    .page-container {
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
      text-align: center;
    }

    h1 {
      color: #e74c3c;
      margin-bottom: 1rem;
    }

    .page-objective {
      font-size: 1.1rem;
      color: #666;
      margin-bottom: 2rem;
    }

    .back-link {
      display: inline-block;
      padding: 0.75rem 1.5rem;
      background-color: #3498db;
      color: white;
      text-decoration: none;
      border-radius: 4px;
      transition: background-color 0.3s;

      &:hover {
        background-color: #2980b9;
      }
    }
  `]
})
export class NotFoundPage {}
