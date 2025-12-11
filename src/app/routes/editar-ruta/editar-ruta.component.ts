import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { RutasService } from '../../services/rutas.service';
import { Ruta } from '../../models/ruta';
import { ToastService } from '../../shared/toast.service';
import { LoadingService } from '../../loading/loading.service';

@Component({
  selector: 'app-editar-ruta',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './editar-ruta.component.html',
  styleUrl: './editar-ruta.component.scss'
})
export class EditarRutaComponent implements OnInit {

  rutaId!: string;

  nombrePersonalizado = '';
  nombreBase: Ruta['nombreBase'] = 'GAMONAL';

  cargando = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private rutasService: RutasService,
    private loading: LoadingService,
    private toast: ToastService
  ) {}

  async ngOnInit() {
    this.cargando = true;

    // 🔥 FORMA 100% FIABLE
    this.rutaId = this.route.snapshot.paramMap.get('id') || '';

    if (!this.rutaId) {
      this.toast.mostrar('ID de ruta inválido', 'error');
      this.router.navigate(['/rutas']);
      return;
    }

    try {
      const data = await this.rutasService.obtenerRutaPorId(this.rutaId);

      if (!data) {
        this.toast.mostrar('Ruta no encontrada', 'error');
        this.router.navigate(['/rutas']);
        return;
      }

      this.nombrePersonalizado = data.nombrePersonalizado;
      this.nombreBase = data.nombreBase as Ruta['nombreBase'];
    } catch (error) {
      console.error('Error obteniendo la ruta', error);
      this.toast.mostrar('Ocurrió un error al cargar la ruta.', 'error');
      this.router.navigate(['/rutas']);
    } finally {
      this.cargando = false;
    }
  }

async guardarCambios() {
  this.loading.mostrar();

  try {
    await this.rutasService.actualizarRuta(this.rutaId, {
      nombrePersonalizado: this.nombrePersonalizado,
      nombreBase: this.nombreBase as Ruta['nombreBase'],
    });

    this.toast.mostrar('Ruta actualizada', 'success');
    this.router.navigate(['/rutas', this.rutaId]);

  } catch (e) {
    console.error('Error actualizando la ruta', e);
    this.toast.mostrar('Error al actualizar la ruta', 'error');

  } finally {
    this.loading.ocultar();
  }
}

async eliminarRuta() {
  const conf = confirm(
    '¿Seguro que deseas eliminar esta ruta? Se borrarán también sus direcciones.'
  );
  if (!conf) return;

  this.loading.mostrar();

  try {
    await this.rutasService.eliminarRuta(this.rutaId);
    this.toast.mostrar('Ruta eliminada', 'success');
    this.router.navigate(['/rutas']);

  } catch (e) {
    console.error('Error eliminando la ruta', e);
    this.toast.mostrar('Error al eliminar la ruta', 'error');

  } finally {
    this.loading.ocultar();
  }
}

  volver() {
    this.router.navigate(['/rutas']);
  }
}
