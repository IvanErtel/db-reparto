import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';

// Firebase (Standalone API de AngularFire)
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';

import { routes } from './app.routes';
import { environment } from '../../src/environments/environments';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),

    // Inicialización de Firebase
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
  ]
};
