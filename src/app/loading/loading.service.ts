import { computed, Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LoadingService {

  private _cargando = signal(false);

  cargando = computed(() => this._cargando());

  mostrar() {
    queueMicrotask(() => {
      this._cargando.set(true);
    });
  }

  ocultar() {
    queueMicrotask(() => {
      this._cargando.set(false);
    });
  }
}

