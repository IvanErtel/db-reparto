import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ToastService {

  mensaje = signal('');
  tipo = signal<'success' | 'error' | 'info'>('info');
  visible = signal(false);

  mostrar(texto: string, tipo: 'success' | 'error' | 'info' = 'info') {
    this.mensaje.set(texto);
    this.tipo.set(tipo);
    this.visible.set(true);

    setTimeout(() => this.ocultar(), 2500);
  }

  ocultar() {
    this.visible.set(false);
  }

show(mensaje: string, tipo: 'success' | 'error' | 'info' = 'info') {
  this.mensaje.set(mensaje);
  this.tipo.set(tipo);
  this.visible.set(true);

  setTimeout(() => this.ocultar(), 2500);
}


}
