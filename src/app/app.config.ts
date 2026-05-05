import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideClientHydration } from '@angular/platform-browser';
import { provideAngularQuery, QueryClient } from '@tanstack/angular-query-experimental';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideClientHydration(),
    provideAngularQuery(
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000, // 30 secondes - données considérées fraîches
            retry: 2, // Retry 2 fois en cas d'erreur
            refetchOnWindowFocus: true, // Refetch au retour sur l'onglet
            refetchOnReconnect: true, // Refetch après reconnexion réseau
          },
          mutations: {
            retry: 1, // Retry 1 fois pour les mutations
          },
        },
      })
    ),
  ]
};
