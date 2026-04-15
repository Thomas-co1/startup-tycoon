import { Component } from '@angular/core';

@Component({
  selector: 'app-shop',
  standalone: true,
  template: `
    <div class="page-container">
      <h1>Shop</h1>
      <p class="page-objective">Ici vous achèterez des upgrades.</p>
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
export class ShopPage {}
