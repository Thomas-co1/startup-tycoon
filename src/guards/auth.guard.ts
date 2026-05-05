import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { ClerkService } from '../services/clerk.service';

export const authGuard: CanActivateFn = (route, state) => {
  const clerk = inject(ClerkService);
  const router = inject(Router);

  if (clerk.getUser()) {
    return true;
  }

  // Rediriger vers la page de connexion
  router.navigate(['/sign-in'], {
    queryParams: { returnUrl: state.url }
  });
  return false;
};
