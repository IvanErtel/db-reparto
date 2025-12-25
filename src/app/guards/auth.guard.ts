import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

import { Firestore, doc, getDoc } from '@angular/fire/firestore';
import { from, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const firestore = inject(Firestore);

  return auth.currentUser$.pipe(
    switchMap((user) => {
      const email = (user?.email || '').trim();
      if (!email) {
        router.navigate(['/login']);
        return of(false);
      }

      const ref = doc(firestore, `allowed_users/${email}`);

      return from(getDoc(ref)).pipe(
        map((snap) => {
          const data: any = snap.data();
          const enabled =
            snap.exists() && (data?.enabled === true || data?.enable === true);

          if (enabled) return true;

          router.navigate(['/login']);
          return false;
        }),
        catchError(() => {
          router.navigate(['/login']);
          return of(false);
        })
      );
    })
  );
};
