import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-click-button',
  standalone: true,
  template: `
    <button class="click-button" (click)="handleClick()">
      <span class="button-text">Développer</span>
      <span class="button-subtext">+{{ clickValue }}$ / clic</span>
    </button>
  `,
  styles: [`
    .click-button {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.25rem;
      padding: 1.5rem 3rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 12px;
      font-size: 1.25rem;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.1s, box-shadow 0.3s;
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
    }

    .click-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
    }

    .click-button:active {
      transform: translateY(0);
      box-shadow: 0 2px 10px rgba(102, 126, 234, 0.4);
    }

    .button-text {
      font-size: 1.5rem;
    }

    .button-subtext {
      font-size: 0.9rem;
      opacity: 0.9;
      font-weight: 400;
    }
  `]
})
export class ClickButton {
  @Input() clickValue!: number;
  @Output() onClick = new EventEmitter<void>();

  handleClick(): void {
    this.onClick.emit();
  }
}
