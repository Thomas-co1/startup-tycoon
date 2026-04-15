import { Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  standalone: true,
  template: `
    <footer class="footer">
      <p>Startup Tycoon © {{ currentYear }}</p>
    </footer>
  `,
  styles: [`
    .footer {
      background-color: #34495e;
      color: white;
      padding: 1.5rem;
      text-align: center;
      margin-top: auto;
    }

    .footer p {
      margin: 0;
      font-size: 0.9rem;
    }
  `]
})
export class FooterComponent {
  currentYear = new Date().getFullYear();
}
