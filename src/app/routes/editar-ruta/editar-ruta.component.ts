import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { RutasService } from '../../services/rutas.service';
import { Ruta } from '../../models/ruta';

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
    private rutasService: RutasService
  ) {}

  async ngOnInit() {
    this.cargando = true;

    // 🔥 FORMA 100% FIABLE
    this.rutaId = this.route.snapshot.paramMap.get('id') || '';

    if (!this.rutaId) {
      alert('ID de ruta inválido');
      this.router.navigate(['/rutas']);
      return;
    }

    try {
      const data = await this.rutasService.obtenerRutaPorId(this.rutaId);

      if (!data) {
        alert('Ruta no encontrada');
        this.router.navigate(['/rutas']);
        return;
      }

      this.nombrePersonalizado = data.nombrePersonalizado;
      this.nombreBase = data.nombreBase as Ruta['nombreBase'];
    } catch (error) {
      console.error('Error obteniendo la ruta', error);
      alert('Ocurrió un error al cargar la ruta.');
      this.router.navigate(['/rutas']);
    } finally {
      this.cargando = false;
    }
  }

  async guardarCambios() {
    await this.rutasService.actualizarRuta(this.rutaId, {
      nombrePersonalizado: this.nombrePersonalizado,
      nombreBase: this.nombreBase as Ruta['nombreBase']
    });

    alert('Ruta actualizada');
    this.router.navigate(['/rutas']);
  }

  async eliminarRuta() {
    const conf = confirm('¿Seguro que deseas eliminar esta ruta?');
    if (!conf) return;

    await this.rutasService.eliminarRuta(this.rutaId);
    alert('Ruta eliminada');
    this.router.navigate(['/rutas']);
  }

  volver() {
    this.router.navigate(['/rutas']);
  }
}
