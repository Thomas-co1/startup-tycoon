import { Injectable, signal } from '@angular/core';
import { Upgrade } from '../models/upgrade.model';
import { UPGRADES } from '../data/upgrades.data';

@Injectable({
  providedIn: 'root'
})
export class GameStateService {
  // Signals pour le state global
  money = signal(0);
  clickValue = signal(1);
  incomePerSecond = signal(0);
  upgrades = signal<Upgrade[]>(UPGRADES.map(u => ({ ...u })));

  private intervalId?: number;

  constructor() {
    // Démarrer le tick automatiquement quand le service est créé
    this.startTick();
  }

  private startTick(): void {
    this.intervalId = window.setInterval(() => {
      const income = this.incomePerSecond();
      if (income > 0) {
        this.addMoney(income);
        console.log(`[TICK] ${new Date().toLocaleTimeString()} - Argent gagné: ${income}€`);
      }
    }, 1000);
  }

  // Méthodes pour modifier le state
  addMoney(amount: number): void {
    this.money.update(current => current + amount);
  }

  removeMoney(amount: number): void {
    this.money.update(current => current - amount);
  }

  addIncomePerSecond(amount: number): void {
    this.incomePerSecond.update(current => current + amount);
  }

  buyUpgrade(upgrade: Upgrade, cost: number): boolean {
    if (this.money() >= cost) {
      // Déduire le coût
      this.removeMoney(cost);
      
      // Augmenter le count de l'upgrade
      upgrade.count += 1;
      
      // Augmenter le revenu passif
      this.addIncomePerSecond(upgrade.incomePerSecondGain);
      
      // Mettre à jour le signal pour déclencher le re-render
      this.upgrades.update(upgrades => [...upgrades]);
      
      return true;
    }
    return false;
  }

  getCurrentCost(upgrade: Upgrade): number {
    return Math.round(upgrade.baseCost * Math.pow(1.15, upgrade.count));
  }

  canBuyUpgrade(upgrade: Upgrade): boolean {
    return this.money() >= this.getCurrentCost(upgrade);
  }
}
