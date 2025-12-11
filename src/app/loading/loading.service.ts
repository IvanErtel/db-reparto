import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LoadingService {
  cargando = signal(false);

  mostrar() {
    this.cargando.set(true);
  }

  ocultar() {
    this.cargando.set(false);
  }
}
