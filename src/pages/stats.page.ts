import { Component } from '@angular/core';

@Component({
  selector: 'app-stats',
  standalone: true,
  template: `
    <div class="page-container">
      <h1>Stats</h1>
      <p class="page-objective">Ici vous consulterez vos statistiques de jeu.</p>
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
export class StatsPage {}
