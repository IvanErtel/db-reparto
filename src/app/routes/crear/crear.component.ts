import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RutasService } from '../../services/rutas.service';
import { ToastService } from '../../shared/toast.service';
import { LoadingService } from '../../loading/loading.service';

@Component({
  selector: 'app-crear-ruta',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './crear.component.html',
  styleUrl: './crear.component.scss'
})
export class CrearRutaComponent {

  nombreBase: 'GAMONAL' | 'ESTE' | 'CENTRO' | 'OESTE' | 'SUR' = 'GAMONAL';
  nombrePersonalizado: string = '';

  constructor(
    private rutasService: RutasService,
    private router: Router,
    private toast: ToastService,
    private loading: LoadingService
  ) {}

async guardar() {
  this.loading.mostrar();

  try {
    if (!this.nombrePersonalizado.trim()) {
      this.toast.mostrar('Debes ingresar un nombre para la ruta.', 'error');
      return;
    }

    await this.rutasService.crearRuta({
      nombreBase: this.nombreBase,
      nombrePersonalizado: this.nombrePersonalizado
    });

    this.toast.mostrar('Ruta creada correctamente', 'success');
    window.location.href = '/rutas';

  } catch (e) {
    console.error("Error al crear la ruta", e);
    this.toast.mostrar('Error al crear la ruta', 'error');
  } finally {
    this.loading.ocultar();
  }
}

cancelar() {
  window.location.href = '/rutas';
}
}
