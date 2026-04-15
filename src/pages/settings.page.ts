import { Component } from '@angular/core';

@Component({
  selector: 'app-settings',
  standalone: true,
  template: `
    <div class="page-container">
      <h1>Settings</h1>
      <p class="page-objective">Ici vous configurerez les paramètres du jeu.</p>
    </div>
  `,
  styles: [`
    .page-container {
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
    }

    h1 {
      color: #333;
      margin-bottom: 1rem;
    }

    .page-objective {
      font-size: 1.1rem;
      color: #666;
    }
  `]
})
export class SettingsPage {}
