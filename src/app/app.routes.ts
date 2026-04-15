import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('../pages/game.page').then(m => m.GamePage)
  },
  {
    path: 'shop',
    loadComponent: () => import('../pages/shop.page').then(m => m.ShopPage)
  },
  {
    path: 'stats',
    loadComponent: () => import('../pages/stats.page').then(m => m.StatsPage)
  },
  {
    path: 'settings',
    loadComponent: () => import('../pages/settings.page').then(m => m.SettingsPage)
  },
  {
    path: '**',
    loadComponent: () => import('../pages/not-found.page').then(m => m.NotFoundPage)
  }
];
