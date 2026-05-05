import { Routes } from '@angular/router';
import { authGuard } from '../guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('../pages/home.page').then(m => m.HomePage)
  },
  {
    path: 'game',
    loadComponent: () => import('../pages/game.page').then(m => m.GamePage)
  },
  {
    path: 'shop',
    loadComponent: () => import('../pages/shop.page').then(m => m.ShopPage)
  },
  {
    path: 'sign-in',
    loadComponent: () => import('../pages/sign-in.page').then(m => m.SignInPage)
  },
  {
    path: 'stats',
    loadComponent: () => import('../pages/stats.page').then(m => m.StatsPage),
    canActivate: [authGuard]
  },
  {
    path: 'settings',
    loadComponent: () => import('../pages/settings.page').then(m => m.SettingsPage)
  },
  {
    path: 'public-stats',
    loadComponent: () => import('../pages/public-stats.page').then(m => m.PublicStatsPage)
  },
  {
    path: '**',
    loadComponent: () => import('../pages/not-found.page').then(m => m.NotFoundPage)
  }
];
